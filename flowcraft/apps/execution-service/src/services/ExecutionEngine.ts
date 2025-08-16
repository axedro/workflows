import { PrismaClient } from '@prisma/client';
import { EditorNode, EditorEdge } from '@flowcraft/shared-types';
import { ExecutionContext, ExecutionStatus, ExecutionResult } from '../types/execution.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import axios from 'axios';

export class ExecutionEngine {
  private prisma: PrismaClient;

  constructor() {
    // Use environment variables directly
    const databaseUrl = process.env.DATABASE_URL || config.DATABASE_URL;
    logger.info({ databaseUrl: databaseUrl?.replace(/\/\/.*@/, '//***:***@') }, 'Initializing PrismaClient');
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
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
      const workflow = await this.prisma.workflow.findUnique({
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
      const execution = await this.prisma.execution.create({
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
      await this.prisma.execution.update({
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

      await this.executeNodeSequence(startNode, nodes, edges, executionContext);

      // Mark execution as completed
      await this.prisma.execution.update({
        where: { id: executionId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          outputData: executionContext.output || {}
        }
      });

      logger.info({ executionId }, 'Workflow execution completed successfully');

    } catch (error) {
      // Mark execution as failed
      await this.prisma.execution.update({
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
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    logger.info({ nodeId: currentNode.id, nodeType: currentNode.type }, 'Executing node');

    try {
      // Create execution node record
      const executionNode = await this.prisma.executionNode.create({
        data: {
          executionId: context.executionId,
          nodeId: currentNode.id,
          status: 'RUNNING',
          startedAt: new Date(),
          inputData: context.input || {}
        }
      });

      // Execute the node based on its type
      const nodeResult = await this.executeNode(currentNode, context);

      // Update execution node record
      await this.prisma.executionNode.update({
        where: { id: executionNode.id },
        data: {
          status: nodeResult.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          outputData: nodeResult.data || {},
          errorDetails: nodeResult.error
        }
      });

      // Log execution result
      await this.addExecutionLog(context.executionId, currentNode.id, 'INFO', 
        `Node ${currentNode.type} ${nodeResult.success ? 'completed' : 'failed'}`, 
        nodeResult.data
      );

      if (!nodeResult.success) {
        throw new Error(`Node execution failed: ${nodeResult.error}`);
      }

      // Update context with output data
      context.output = nodeResult.data;

      // If this is an END node, stop execution
      if (currentNode.type === 'end') {
        return nodeResult;
      }

      // Find next nodes connected to this node
      const outgoingEdges = allEdges.filter(edge => edge.source === currentNode.id);
      
      for (const edge of outgoingEdges) {
        const nextNode = allNodes.find(node => node.id === edge.target);
        if (nextNode) {
          // Continue with next node, passing current output as input
          const nextContext = {
            ...context,
            nodeId: nextNode.id,
            input: nodeResult.data || context.input
          };
          
          await this.executeNodeSequence(nextNode, allNodes, allEdges, nextContext);
        }
      }

      return nodeResult;

    } catch (error) {
      logger.error({ error, nodeId: currentNode.id }, 'Node execution failed');
      
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
  private async executeHttpRequestNode(node: EditorNode, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const nodeData = node.data as any;

    try {
      // Validate required configuration
      if (!nodeData.url) {
        throw new Error('HTTP Request node requires a URL');
      }

      // Build request configuration
      const requestConfig: any = {
        method: nodeData.method || 'GET',
        url: nodeData.url,
        timeout: nodeData.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
          ...nodeData.headers
        }
      };

      // Add request body for POST, PUT, PATCH methods
      if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method.toUpperCase())) {
        if (nodeData.body) {
          requestConfig.data = nodeData.body;
        } else if (context.input && Object.keys(context.input).length > 0) {
          requestConfig.data = context.input;
        }
      }

      // Add query parameters
      if (nodeData.params) {
        requestConfig.params = nodeData.params;
      }

      // Add authentication if configured
      if (nodeData.authentication) {
        const auth = nodeData.authentication;
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
        method: requestConfig.method, 
        url: requestConfig.url 
      }, 'Executing HTTP request');

      const response = await axios(requestConfig);

      const result = {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        url: response.config.url,
        success: response.status >= 200 && response.status < 300
      };

      logger.info({ 
        nodeId: node.id, 
        status: response.status, 
        success: result.success 
      }, 'HTTP request completed');

      return {
        success: result.success,
        data: result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      logger.error({ 
        nodeId: node.id, 
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
      await this.prisma.executionLog.create({
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
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<any> {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        nodes: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    return execution;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    await this.prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    });

    logger.info({ executionId }, 'Execution cancelled');
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}