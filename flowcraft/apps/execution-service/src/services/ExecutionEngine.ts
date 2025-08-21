import { prisma } from '@flowcraft/database';
import { EditorNode, EditorEdge } from '@flowcraft/shared-types';
import { ExecutionContext, ExecutionStatus, ExecutionResult } from '../types/execution.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import axios from 'axios';

export class ExecutionEngine {
  // In-memory cancellation registry (simple cooperative cancellation)
  private static cancelledExecutions: Set<string> = new Set<string>();
  // Active abort controllers for each execution
  private static activeControllers: Map<string, Set<AbortController>> = new Map();

  constructor() {
    logger.info('Initializing ExecutionEngine with unified Prisma client');
  }

  /**
   * Execute a workflow by ID
   */
  async executeWorkflow(
    workflowId: string, 
    userId: string, 
    input?: Record<string, any>
  ): Promise<string> {
    logger.info({ workflowId, userId }, 'Starting workflow execution');

    try {
      // 1. Get workflow data
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          user: true,
          organization: true,
        }
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // 2. Create execution record
      const execution = await prisma.execution.create({
        data: {
          workflowId,
          userId,
          status: 'PENDING',
          inputData: input || {},
          startedAt: new Date(),
        }
      });

      logger.info({ executionId: execution.id, workflowId }, 'Execution record created');

      // 3. Parse workflow definition
      const workflowDefinition = workflow.definition as unknown as {
        nodes: EditorNode[];
        edges: EditorEdge[];
      };

      // 4. Start execution process
      await this.executeWorkflowNodes(execution.id, workflowDefinition, input || {});

      return execution.id;
    } catch (error) {
      logger.error({ error, workflowId, userId }, 'Failed to start workflow execution');
      throw error;
    }
  }

  /**
   * Create an execution record without starting it (for async queue flow)
   */
  async createExecutionRecord(
    workflowId: string,
    userId: string,
    input?: Record<string, any>
  ): Promise<string> {
    // Validate workflow exists (and fetch minimal fields)
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true }
    });
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId,
        status: 'PENDING',
        inputData: input || {},
        startedAt: new Date(),
      },
      select: { id: true }
    });

    logger.info({ executionId: execution.id, workflowId }, 'Execution record pre-created');
    return execution.id;
  }

  /**
   * Execute a workflow using an existing executionId (async queue consumer)
   */
  async executeWorkflowByExecutionId(
    executionId: string,
    workflowId: string,
    userId: string,
    input?: Record<string, any>
  ): Promise<void> {
    logger.info({ executionId, workflowId, userId }, 'Executing workflow by existing executionId');

    // 1. Get workflow data (including definition)
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        user: true,
        organization: true,
      }
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 2. Parse workflow definition
    const workflowDefinition = workflow.definition as unknown as {
      nodes: EditorNode[];
      edges: EditorEdge[];
    };

    // 3. Start execution process using provided executionId
    await this.executeWorkflowNodes(executionId, workflowDefinition, input || {});
  }

  /**
   * Execute workflow nodes in sequence
   */
  private async executeWorkflowNodes(
    executionId: string,
    workflowDefinition: { nodes: EditorNode[]; edges: EditorEdge[] },
    initialInput: Record<string, any>
  ): Promise<void> {
    const { nodes, edges } = workflowDefinition;
    
    try {
      // Update execution status to RUNNING
      await prisma.execution.update({
        where: { id: executionId },
        data: { 
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      // Find START node
      const startNode = nodes.find(node => node.type === 'start');
      if (!startNode) {
        throw new Error('No START node found in workflow');
      }

      // Execute nodes starting from START node
      const executionContext: ExecutionContext = {
        executionId,
        workflowId: '', // Will be set from execution record
        userId: '', // Will be set from execution record  
        nodeId: startNode.id,
        input: initialInput,
        startedAt: new Date(),
        status: ExecutionStatus.RUNNING,
      };

      // Track data flow between nodes
      const dataFlow: Record<string, any> = {};
      const nodeResults: Record<string, any> = {};

      await this.executeNodeSequence(startNode, nodes, edges, executionContext, dataFlow, nodeResults);

      // Create execution summary
      const summary = this.createExecutionSummary(nodes, nodeResults, dataFlow);

      // Mark execution as completed
      await prisma.execution.update({
        where: { id: executionId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          outputData: executionContext.output || {},
          summary: summary,
          dataFlow: dataFlow,
          metadata: {
            totalNodes: nodes.length,
            completedNodes: Object.keys(nodeResults).length,
            executionTime: Date.now() - executionContext.startedAt.getTime()
          }
        }
      });

      logger.info({ executionId }, 'Workflow execution completed successfully');

    } catch (error) {
      // Mark execution as failed
      await prisma.execution.update({
        where: { id: executionId },
        data: { 
          status: 'FAILED',
          completedAt: new Date(),
          errorDetails: error instanceof Error ? error.message : String(error)
        }
      });

      logger.error({ error, executionId }, 'Workflow execution failed');
      throw error;
    }
  }

  /**
   * Execute a single node and follow connected nodes
   */
  private async executeNodeSequence(
    currentNode: EditorNode,
    allNodes: EditorNode[],
    allEdges: EditorEdge[],
    context: ExecutionContext,
    dataFlow: Record<string, any>,
    nodeResults: Record<string, any>
  ): Promise<ExecutionResult> {
    const nodeStartTime = Date.now();
    logger.info({ nodeId: currentNode.id, nodeType: currentNode.type }, 'Executing node');

    try {
      // Cooperative cancellation check before starting node
      if (ExecutionEngine.cancelledExecutions.has(context.executionId)) {
        logger.warn({ executionId: context.executionId }, 'Execution cancelled before node start');
        return {
          success: false,
          error: 'Execution cancelled',
          duration: 0
        };
      }
      // Create execution node record
      const executionNode = await prisma.executionNode.create({
        data: {
          executionId: context.executionId,
          nodeId: currentNode.id,
          status: 'RUNNING',
          startedAt: new Date(),
          inputData: context.input || {}
        }
      });

      // Execute the node with retries
      const maxRetries = 2;
      let attempt = 0;
      let nodeResult: ExecutionResult | null = null;
      let lastError: any = null;

      while (attempt <= maxRetries) {
        nodeResult = await this.executeNode(currentNode, context);
        if (nodeResult.success) break;

        lastError = nodeResult.error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          logger.warn({ nodeId: currentNode.id, attempt: attempt + 1, delay }, 'Node failed, retrying with backoff');
          // Mark retry metadata
          await prisma.executionNode.update({
            where: { id: executionNode.id },
            data: {
              metadata: {
                ...(executionNode as any).metadata,
                retrying: true,
                attempts: attempt + 1,
                lastError: nodeResult.error,
              },
            }
          });
          await new Promise(res => setTimeout(res, delay));
        }
        attempt++;
      }

      const finalResult = nodeResult!;
      const nodeEndTime = Date.now();
      const nodeDuration = nodeEndTime - nodeStartTime;

      // Store node result with detailed information
      nodeResults[currentNode.id] = {
        success: finalResult.success,
        data: finalResult.data,
        error: finalResult.error,
        duration: nodeDuration,
        startedAt: nodeStartTime,
        completedAt: nodeEndTime,
        attempts: attempt + (finalResult.success ? 0 : 0)
      } as any;

      // Track data flow for this node
      dataFlow[currentNode.id] = {
        input: this.truncateData(context.input || {}),
        output: this.truncateData(finalResult.data || {}),
        duration: nodeDuration,
        nodeType: currentNode.type
      };

      // Update execution node record with detailed data
      await prisma.executionNode.update({
        where: { id: executionNode.id },
        data: {
          status: finalResult.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          outputData: this.truncateData(finalResult.data || {}),
          errorDetails: finalResult.error,
          performance: {
            duration: nodeDuration,
            startedAt: new Date(nodeStartTime),
            completedAt: new Date(nodeEndTime)
          },
          metadata: {
            nodeType: currentNode.type,
            nodeName: currentNode.data?.label || currentNode.id,
            attempts: attempt,
          }
        }
      });

      // Log execution result
      await this.addExecutionLog(context.executionId, currentNode.id, finalResult.success ? 'INFO' : 'WARN', 
        `Node ${currentNode.type} ${finalResult.success ? 'completed' : 'failed'} in ${nodeDuration}ms` + (attempt ? ` after ${attempt} retries` : ''), 
        finalResult.data
      );

      if (!finalResult.success) {
        throw new Error(`Node execution failed: ${lastError || finalResult.error}`);
      }

      // Update context with output data
      context.output = finalResult.data;

      // If this is an END node, stop execution
      if (currentNode.type === 'end') {
        return finalResult;
      }

      // Cooperative cancellation check after node
      if (ExecutionEngine.cancelledExecutions.has(context.executionId)) {
        logger.warn({ executionId: context.executionId }, 'Execution cancelled after node');
        return finalResult;
      }

      // Find next nodes connected to this node
      const outgoingEdges = allEdges.filter(edge => edge.source === currentNode.id);
      
      for (const edge of outgoingEdges) {
        const nextNode = allNodes.find(node => node.id === edge.target);
        if (nextNode) {
          // Track data flow between nodes
          dataFlow[`${currentNode.id}_to_${nextNode.id}`] = {
            sourceId: currentNode.id,
            targetId: nextNode.id,
            input: this.truncateData(finalResult.data || context.input),
            output: this.truncateData(finalResult.data || context.input),
            edgeId: edge.id
          };

          // Continue with next node, passing current output as input
          const nextContext = {
            ...context,
            nodeId: nextNode.id,
            input: finalResult.data || context.input
          };
          
          await this.executeNodeSequence(nextNode, allNodes, allEdges, nextContext, dataFlow, nodeResults);
        }
      }

      return finalResult;

    } catch (error) {
      const nodeEndTime = Date.now();
      const nodeDuration = nodeEndTime - nodeStartTime;
      
      logger.error({ error, nodeId: currentNode.id }, 'Node execution failed');
      
      // Store failed node result
      nodeResults[currentNode.id] = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: nodeDuration,
        startedAt: nodeStartTime,
        completedAt: nodeEndTime
      };
      
      // Log error
      await this.addExecutionLog(context.executionId, currentNode.id, 'ERROR',
        `Node execution failed: ${error instanceof Error ? error.message : String(error)}`
      );

      throw error;
    }
  }

  /**
   * Execute individual node based on type
   */
  private async executeNode(node: EditorNode, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      switch (node.type) {
        case 'start':
          return this.executeStartNode(node, context);
        
        case 'end':
          return this.executeEndNode(node, context);
        
        case 'http_request':
          return this.executeHttpRequestNode(node, context);
        
        case 'email':
          return this.executeEmailNode(node, context);
        
        case 'webhook':
          return this.executeWebhookNode(node, context);
        
        case 'timer':
          return this.executeTimerNode(node, context);
        
        case 'data_transform':
          return this.executeDataTransformNode(node, context);
        
        case 'slack':
          return this.executeSlackNode(node, context);
        
        default:
          logger.warn({ nodeType: node.type }, 'Unknown node type, skipping');
          return {
            success: true,
            data: context.input,
            duration: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Email node
   */
  private async executeEmailNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('Email node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Validate connector configuration
      if (!connectorConfig.smtpHost || !connectorConfig.smtpPort) {
        throw new Error(`Connector ${connector.name} is missing SMTP configuration`);
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        smtpHost: connectorConfig.smtpHost
      }, 'Executing Email with connector');

      // For now, return success with connector info
      // TODO: Implement actual email sending logic
      const result = {
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        smtpHost: connectorConfig.smtpHost,
        smtpPort: connectorConfig.smtpPort,
        success: true,
        message: 'Email configuration loaded from connector'
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        success: result.success 
      }, 'Email execution completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'Email execution failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Webhook node
   */
  private async executeWebhookNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('Webhook node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Build URL from connector configuration
      let url: string;
      if (connectorConfig.url) {
        // Direct URL configuration
        url = connectorConfig.url;
      } else if (connectorConfig.baseUrl) {
        // Base URL + endpoint configuration
        const endpoint = connectorConfig.endpoint || '';
        url = connectorConfig.baseUrl + endpoint;
      } else {
        throw new Error(`Connector ${connector.name} is missing URL configuration (needs either 'url' or 'baseUrl')`);
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        url: url
      }, 'Executing Webhook with connector');

      // For now, return success with connector info
      // TODO: Implement actual webhook logic
      const result = {
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        url: url,
        method: connectorConfig.method || 'POST',
        success: true,
        message: 'Webhook configuration loaded from connector'
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        success: result.success 
      }, 'Webhook execution completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'Webhook execution failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Timer node
   */
  private async executeTimerNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('Timer node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Validate connector configuration
      if (!connectorConfig.schedule) {
        throw new Error(`Connector ${connector.name} is missing schedule configuration`);
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        schedule: connectorConfig.schedule
      }, 'Executing Timer with connector');

      // For now, return success with connector info
      // TODO: Implement actual timer logic
      const result = {
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        schedule: connectorConfig.schedule,
        success: true,
        message: 'Timer configuration loaded from connector'
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        success: result.success 
      }, 'Timer execution completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'Timer execution failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Data Transform node
   */
  private async executeDataTransformNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('Data Transform node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Validate connector configuration
      if (!connectorConfig.transformations) {
        throw new Error(`Connector ${connector.name} is missing transformations configuration`);
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name
      }, 'Executing Data Transform with connector');

      // For now, return success with connector info
      // TODO: Implement actual data transformation logic
      const result = {
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        transformations: connectorConfig.transformations,
        inputData: context.input,
        success: true,
        message: 'Data Transform configuration loaded from connector'
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        success: result.success 
      }, 'Data Transform execution completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'Data Transform execution failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute Slack node
   */
  private async executeSlackNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('Slack node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Validate connector configuration
      if (!connectorConfig.botToken) {
        throw new Error(`Connector ${connector.name} is missing Slack bot token configuration`);
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name
      }, 'Executing Slack with connector');

      // For now, return success with connector info
      // TODO: Implement actual Slack API logic using the SlackConnector
      const result = {
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        defaultChannel: connectorConfig.defaultChannel,
        botToken: connectorConfig.botToken ? '***' : undefined, // Hide token in logs
        success: true,
        message: 'Slack configuration loaded from connector'
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        success: result.success 
      }, 'Slack execution completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'Slack execution failed');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute START node
   */
  private async executeStartNode(node: EditorNode, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // START node just passes through input data and any configured initial data
    const nodeData = node.data as any;
    const outputData = {
      ...context.input,
      ...(nodeData?.initialData || {})
    };

    return {
      success: true,
      data: outputData,
      duration: Date.now() - startTime
    };
  }

  /**
   * Execute END node  
   */
  private async executeEndNode(node: EditorNode, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // END node just captures final data
    return {
      success: true,
      data: context.input,
      duration: Date.now() - startTime
    };
  }

  /**
   * Execute HTTP Request node
   */
  private async executeHttpRequestNode(
    node: EditorNode, 
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const signal = controller.signal;
    const nodeData = node.data as any;

    try {
      // Register controller for this execution
      if (!ExecutionEngine.activeControllers.has(context.executionId)) {
        ExecutionEngine.activeControllers.set(context.executionId, new Set());
      }
      ExecutionEngine.activeControllers.get(context.executionId)!.add(controller);
      
      // If already cancelled, abort immediately
      if (ExecutionEngine.cancelledExecutions.has(context.executionId)) {
        controller.abort();
      }

      // Check if connector is configured
      if (!nodeData.connectorId) {
        throw new Error('HTTP Request node requires a connector to be selected');
      }

      // Get connector configuration from database
      const connector = await prisma.connector.findUnique({
        where: { id: nodeData.connectorId }
      });

      if (!connector) {
        throw new Error(`Connector not found: ${nodeData.connectorId}`);
      }

      if (!connector.isActive) {
        throw new Error(`Connector is not active: ${connector.name}`);
      }

      // Parse connector configuration
      const connectorConfig = connector.configuration as any;
      
      // Build URL from connector configuration
      let url: string;
      if (connectorConfig.url) {
        // Direct URL configuration
        url = connectorConfig.url;
      } else if (connectorConfig.baseUrl) {
        // Base URL + endpoint configuration
        const endpoint = connectorConfig.endpoint || '';
        url = connectorConfig.baseUrl + endpoint;
      } else {
        throw new Error(`Connector ${connector.name} is missing URL configuration (needs either 'url' or 'baseUrl')`);
      }

      // Build request configuration from connector
      const requestConfig: any = {
        method: connectorConfig.method || 'GET',
        url: url,
        timeout: connectorConfig.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FlowCraft-HTTP-Connector/1.0',
          ...connectorConfig.headers
        },
        signal
      };

      // Add request body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method.toUpperCase())) {
        if (connectorConfig.body) {
          requestConfig.data = connectorConfig.body;
        } else if (context.input && Object.keys(context.input).length > 0) {
          requestConfig.data = context.input;
        }
      }

      // Add query parameters from connector
      if (connectorConfig.params) {
        requestConfig.params = connectorConfig.params;
      }

      // Add authentication from connector
      if (connectorConfig.authentication) {
        const auth = connectorConfig.authentication;
        switch (auth.type) {
          case 'bearer':
            requestConfig.headers.Authorization = `Bearer ${auth.token}`;
            break;
          case 'basic':
            const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            requestConfig.headers.Authorization = `Basic ${credentials}`;
            break;
          case 'apikey':
            const headerName = auth.apiKeyHeader || 'X-API-Key';
            requestConfig.headers[headerName] = auth.apiKey;
            break;
        }
      }

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        method: requestConfig.method, 
        url: requestConfig.url 
      }, 'Executing HTTP request with connector');

      const response = await axios(requestConfig);

      const result = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        url: response.config.url,
        connectorId: nodeData.connectorId,
        connectorName: connector.name,
        success: response.status >= 200 && response.status < 300
      };

      logger.info({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        status: response.status, 
        success: result.success 
      }, 'HTTP request completed');

      // Cleanup controller
      ExecutionEngine.activeControllers.get(context.executionId)?.delete(controller);

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      // Cleanup controller on error
      ExecutionEngine.activeControllers.get(context.executionId)?.delete(controller);
      logger.error({ 
        nodeId: node.id, 
        connectorId: nodeData.connectorId,
        error: error instanceof Error ? error.message : String(error) 
      }, 'HTTP request failed');

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Add execution log entry
   */
  private async addExecutionLog(
    executionId: string,
    nodeId: string,
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.executionLog.create({
        data: {
          executionId,
          level,
          message,
          metadata: data || {},
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error({ error, executionId, nodeId }, 'Failed to create execution log');
    }
  }

  /**
   * Get execution status with detailed data
   */
  async getExecutionStatus(executionId: string): Promise<{
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startedAt: string;
    completedAt?: string;
    progress: number;
    currentNode?: string;
    error?: string;
    logs: Array<{
      id: string;
      timestamp: string;
      level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
      message: string;
      nodeId?: string;
    }>;
    // Nuevos campos para datos detallados
    summary?: Record<string, any>;
    dataFlow?: Record<string, any>;
    nodes?: Array<{
      id: string;
      nodeId: string;
      status: string;
      startedAt?: string;
      completedAt?: string;
      inputData?: Record<string, any>;
      outputData?: Record<string, any>;
      errorDetails?: string;
      performance?: Record<string, any>;
      metadata?: Record<string, any>;
    }>;
    metadata?: Record<string, any>;
  } | null> {
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        nodes: {
          orderBy: { startedAt: 'asc' }
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!execution) {
      return null;
    }

    // Calculate progress based on completed nodes
    const totalNodes = execution.nodes.length;
    const completedNodes = execution.nodes.filter(node => 
      node.status === 'COMPLETED' || node.status === 'FAILED'
    ).length;
    const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    // Get current running node
    const currentNode = execution.nodes.find(node => node.status === 'RUNNING')?.nodeId;

    // Format logs
    const logs = execution.logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      level: log.level as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
      message: log.message,
      nodeId: (log.metadata as any)?.nodeId
    }));

    // Format nodes with detailed data
    const nodes = execution.nodes.map(node => ({
      id: node.id,
      nodeId: node.nodeId,
      status: node.status,
      startedAt: node.startedAt?.toISOString(),
      completedAt: node.completedAt?.toISOString(),
      inputData: node.inputData as Record<string, any> | undefined,
      outputData: node.outputData as Record<string, any> | undefined,
      errorDetails: node.errorDetails as string | undefined,
      performance: node.performance as Record<string, any> | undefined,
      metadata: node.metadata as Record<string, any> | undefined
    }));

    return {
      id: execution.id,
      status: execution.status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
      startedAt: execution.startedAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      progress,
      currentNode,
      error: execution.errorDetails as string | undefined,
      logs,
      // Nuevos campos
      summary: execution.summary as Record<string, any> | undefined,
      dataFlow: execution.dataFlow as Record<string, any> | undefined,
      nodes,
      metadata: execution.metadata as Record<string, any> | undefined
    };
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    // Mark as cancelled in memory so running tasks can check
    ExecutionEngine.cancelledExecutions.add(executionId);
    // Abort all active controllers for this execution
    const controllers = ExecutionEngine.activeControllers.get(executionId);
    if (controllers) {
      controllers.forEach(controller => controller.abort());
      controllers.clear();
    }
    ExecutionEngine.activeControllers.delete(executionId);
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    logger.info({ executionId }, 'Execution cancelled');
  }

  /**
   * Mark execution as failed (used by worker for final failure)
   */
  async markExecutionAsFailed(executionId: string, errorMessage: string): Promise<void> {
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorDetails: {
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      }
    });

    logger.info({ executionId, errorMessage }, 'Execution marked as failed');
  }

  /**
   * Resume execution from a failed node (or specified nodeId)
   */
  async resumeExecution(executionId: string, nodeId?: string): Promise<void> {
    // Load execution and related info
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      select: {
        id: true,
        workflowId: true,
        status: true,
      }
    });
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Find target node to resume
    let targetNode = await prisma.executionNode.findFirst({
      where: {
        executionId,
        ...(nodeId ? { nodeId } : { status: 'FAILED' as any })
      },
      orderBy: { startedAt: 'desc' }
    });
    if (!targetNode) {
      throw new Error('No failed node found to resume');
    }

    // Load workflow definition
    const workflow = await prisma.workflow.findUnique({
      where: { id: execution.workflowId },
      select: { definition: true }
    });
    if (!workflow) {
      throw new Error(`Workflow not found: ${execution.workflowId}`);
    }

    const workflowDefinition = workflow.definition as unknown as {
      nodes: EditorNode[];
      edges: EditorEdge[];
    };

    // Set execution to RUNNING
    await prisma.execution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' }
    });

    // Execute from target node using its inputData
    await this.executeWorkflowFromNode(
      executionId,
      workflowDefinition,
      targetNode.nodeId,
      (targetNode.inputData as any) || {}
    );
  }

  /**
   * Execute workflow starting from a specific node
   */
  private async executeWorkflowFromNode(
    executionId: string,
    workflowDefinition: { nodes: EditorNode[]; edges: EditorEdge[] },
    startNodeId: string,
    initialInput: Record<string, any>
  ): Promise<void> {
    const { nodes, edges } = workflowDefinition;

    // Find start node by id
    const startNode = nodes.find(n => n.id === startNodeId);
    if (!startNode) {
      throw new Error(`Start node not found: ${startNodeId}`);
    }

    const executionContext: ExecutionContext = {
      executionId,
      workflowId: '',
      userId: '',
      nodeId: startNode.id,
      input: initialInput,
      startedAt: new Date(),
      status: ExecutionStatus.RUNNING,
    };

    const dataFlow: Record<string, any> = {};
    const nodeResults: Record<string, any> = {};

    try {
      await this.executeNodeSequence(startNode, nodes, edges, executionContext, dataFlow, nodeResults);

      // If completed path to END, mark execution completed
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          outputData: executionContext.output || {}
        }
      });

      logger.info({ executionId, startNodeId }, 'Execution resumed and completed successfully');
    } catch (error) {
      // Failure handled in node sequence; propagate
      throw error;
    }
  }

  /**
   * Truncate large JSON payloads to avoid oversized storage
   */
  private truncateData(data: any, maxChars: number = 10000): any {
    try {
      const str = JSON.stringify(data);
      if (str.length > maxChars) {
        return {
          __preview: str.slice(0, maxChars),
          __truncated: true,
          __bytes: str.length,
        };
      }
      return data;
    } catch {
      return data;
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
    // Clear all active controllers
    ExecutionEngine.activeControllers.clear();
    ExecutionEngine.cancelledExecutions.clear();
  }

  /**
   * Create execution summary
   */
  private createExecutionSummary(
    nodes: EditorNode[],
    nodeResults: Record<string, any>,
    dataFlow: Record<string, any>
  ): Record<string, any> {
    const summary: Record<string, any> = {};
    const nodeIds = Object.keys(nodeResults);

    // Add basic counts
    summary.totalNodes = nodes.length;
    summary.completedNodes = nodeIds.length;
    summary.failedNodes = nodeIds.filter(id => nodeResults[id].success === false).length;
    summary.executionTime = Date.now() - (nodeResults[nodeIds[0]]?.startedAt || 0); // Estimate based on first node

    // Add detailed node results
    summary.nodes = nodeIds.map(id => {
      const node = nodes.find(n => n.id === id);
      const result = nodeResults[id];
      return {
        id,
        type: node?.type,
        name: (node as any)?.data?.label || node?.id,
        success: result.success,
        error: result.error,
        duration: result.duration,
        input: dataFlow[id]?.input || {},
        output: result.data || {},
        startedAt: result.startedAt,
        completedAt: result.completedAt
      };
    });

    // Add data flow summary
    summary.dataFlow = Object.entries(dataFlow).map(([sourceId, flow]) => ({
      sourceId,
      targetId: flow.targetId,
      input: flow.input,
      output: flow.output
    }));

    return summary;
  }
}