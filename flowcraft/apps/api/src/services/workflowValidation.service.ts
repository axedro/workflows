import { prisma } from '../../../../packages/database/dist/index.js';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
}

export interface WorkflowDefinition {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: any;
  }>;
}

export class WorkflowValidationService {
  /**
   * Validate complete workflow definition
   */
  async validateWorkflow(
    definition: WorkflowDefinition
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    this.validateBasicStructure(definition, errors, warnings);

    // Node validation
    this.validateNodes(definition.nodes, errors, warnings);

    // Edge validation
    this.validateEdges(definition.edges, definition.nodes, errors, warnings);

    // Connector validation
    await this.validateConnectors(definition.nodes, errors, warnings);

    // Logic validation
    this.validateLogic(definition, errors, warnings);

    // Performance validation
    this.validatePerformance(definition, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate basic workflow structure
   */
  private validateBasicStructure(
    definition: WorkflowDefinition,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!definition) {
      errors.push({
        type: 'error',
        code: 'MISSING_DEFINITION',
        message: 'Workflow definition is missing',
      });
      return;
    }

    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      errors.push({
        type: 'error',
        code: 'INVALID_NODES',
        message: 'Workflow must have a nodes array',
      });
      return;
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      errors.push({
        type: 'error',
        code: 'INVALID_EDGES',
        message: 'Workflow must have an edges array',
      });
      return;
    }

    if (definition.nodes.length === 0) {
      errors.push({
        type: 'error',
        code: 'EMPTY_WORKFLOW',
        message: 'Workflow must have at least one node',
      });
    }

    if (definition.nodes.length > 100) {
      warnings.push({
        type: 'warning',
        code: 'LARGE_WORKFLOW',
        message:
          'Workflow has many nodes, consider breaking it into smaller workflows',
      });
    }
  }

  /**
   * Validate individual nodes
   */
  private validateNodes(
    nodes: WorkflowDefinition['nodes'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const nodeIds = new Set<string>();
    const startNodes: string[] = [];
    const endNodes: string[] = [];

    for (const node of nodes) {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_NODE_ID',
          message: `Duplicate node ID: ${node.id}`,
          nodeId: node.id,
        });
      }
      nodeIds.add(node.id);

      // Validate required fields
      if (!node.id || typeof node.id !== 'string') {
        errors.push({
          type: 'error',
          code: 'INVALID_NODE_ID',
          message: 'Node must have a valid string ID',
          nodeId: node.id,
        });
      }

      if (!node.type || typeof node.type !== 'string') {
        errors.push({
          type: 'error',
          code: 'INVALID_NODE_TYPE',
          message: 'Node must have a valid type',
          nodeId: node.id,
        });
      }

      if (!node.data) {
        errors.push({
          type: 'error',
          code: 'MISSING_NODE_DATA',
          message: 'Node must have data',
          nodeId: node.id,
        });
      }

      // Validate position
      if (
        !node.position ||
        typeof node.position.x !== 'number' ||
        typeof node.position.y !== 'number'
      ) {
        warnings.push({
          type: 'warning',
          code: 'INVALID_POSITION',
          message: 'Node should have valid position coordinates',
          nodeId: node.id,
        });
      }

      // Track start and end nodes
      if (node.type === 'trigger' || node.type === 'start') {
        startNodes.push(node.id);
      }
      if (node.type === 'end' || node.type === 'output') {
        endNodes.push(node.id);
      }
    }

    // Validate start nodes
    if (startNodes.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_START_NODE',
        message: 'Workflow must have at least one start/trigger node',
      });
    }

    if (startNodes.length > 1) {
      warnings.push({
        type: 'warning',
        code: 'MULTIPLE_START_NODES',
        message:
          'Workflow has multiple start nodes, ensure proper flow control',
      });
    }

    // Validate end nodes
    if (endNodes.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_END_NODE',
        message: 'Workflow must have at least one end/output node',
      });
    }
  }

  /**
   * Validate edges between nodes
   */
  private validateEdges(
    edges: WorkflowDefinition['edges'],
    nodes: WorkflowDefinition['nodes'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const nodeIds = new Set(nodes.map(n => n.id));
    const edgeIds = new Set<string>();
    const edgeMap = new Map<string, string[]>(); // source -> targets

    for (const edge of edges) {
      // Check for duplicate IDs
      if (edgeIds.has(edge.id)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_EDGE_ID',
          message: `Duplicate edge ID: ${edge.id}`,
          edgeId: edge.id,
        });
      }
      edgeIds.add(edge.id);

      // Validate required fields
      if (!edge.id || typeof edge.id !== 'string') {
        errors.push({
          type: 'error',
          code: 'INVALID_EDGE_ID',
          message: 'Edge must have a valid string ID',
          edgeId: edge.id,
        });
      }

      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push({
          type: 'error',
          code: 'INVALID_SOURCE_NODE',
          message: `Edge source node does not exist: ${edge.source}`,
          edgeId: edge.id,
          field: 'source',
        });
      }

      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push({
          type: 'error',
          code: 'INVALID_TARGET_NODE',
          message: `Edge target node does not exist: ${edge.target}`,
          edgeId: edge.id,
          field: 'target',
        });
      }

      // Check for self-loops
      if (edge.source === edge.target) {
        warnings.push({
          type: 'warning',
          code: 'SELF_LOOP',
          message: 'Edge creates a self-loop, ensure this is intentional',
          edgeId: edge.id,
        });
      }

      // Build edge map for cycle detection
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // Check for cycles
    if (this.hasCycle(edgeMap)) {
      errors.push({
        type: 'error',
        code: 'CYCLE_DETECTED',
        message: 'Workflow contains cycles, which are not allowed',
      });
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    for (const edge of edges) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const node of nodes) {
      if (!connectedNodes.has(node.id)) {
        warnings.push({
          type: 'warning',
          code: 'DISCONNECTED_NODE',
          message: `Node is not connected to the workflow: ${node.id}`,
          nodeId: node.id,
        });
      }
    }
  }

  /**
   * Validate connectors used in nodes
   */
  private async validateConnectors(
    nodes: WorkflowDefinition['nodes'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const connectorNodes = nodes.filter(
      node => node.type === 'action' && node.data?.connector
    );

    for (const node of connectorNodes) {
      const connectorName = node.data.connector;

      try {
        // Check if connector exists in database
        const connector = await prisma.connector.findUnique({
          where: { name: connectorName },
        });

        if (!connector) {
          errors.push({
            type: 'error',
            code: 'INVALID_CONNECTOR',
            message: `Connector not found: ${connectorName}`,
            nodeId: node.id,
            field: 'connector',
          });
          continue;
        }

        // Validate connector configuration
        if (node.data.config) {
          this.validateConnectorConfig(
            node.data.config,
            connector.definition as any,
            node.id,
            errors,
            warnings
          );
        }
      } catch (error) {
        warnings.push({
          type: 'warning',
          code: 'CONNECTOR_VALIDATION_ERROR',
          message: `Could not validate connector ${connectorName}: ${error}`,
          nodeId: node.id,
        });
      }
    }
  }

  /**
   * Validate connector configuration
   */
  private validateConnectorConfig(
    config: any,
    connectorDefinition: any,
    nodeId: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!connectorDefinition.config) {
      return;
    }

    for (const [key, schema] of Object.entries(connectorDefinition.config)) {
      const value = config[key];

      if (
        (schema as any).required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push({
          type: 'error',
          code: 'MISSING_REQUIRED_CONFIG',
          message: `Missing required configuration: ${key}`,
          nodeId,
          field: key,
        });
      }

      if (value !== undefined && (schema as any).type) {
        this.validateConfigValue(value, schema, key, nodeId, errors, warnings);
      }
    }
  }

  /**
   * Validate configuration value against schema
   */
  private validateConfigValue(
    value: any,
    schema: any,
    key: string,
    nodeId: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    switch (schema.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            type: 'error',
            code: 'INVALID_CONFIG_TYPE',
            message: `Configuration ${key} must be a string`,
            nodeId,
            field: key,
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push({
            type: 'error',
            code: 'INVALID_CONFIG_TYPE',
            message: `Configuration ${key} must be a number`,
            nodeId,
            field: key,
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            type: 'error',
            code: 'INVALID_CONFIG_TYPE',
            message: `Configuration ${key} must be a boolean`,
            nodeId,
            field: key,
          });
        }
        break;

      case 'enum':
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            type: 'error',
            code: 'INVALID_CONFIG_VALUE',
            message: `Configuration ${key} must be one of: ${schema.enum.join(', ')}`,
            nodeId,
            field: key,
          });
        }
        break;
    }
  }

  /**
   * Validate workflow logic
   */
  private validateLogic(
    definition: WorkflowDefinition,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for unreachable nodes
    const reachableNodes = this.getReachableNodes(definition);
    const allNodeIds = new Set(definition.nodes.map(n => n.id));

    for (const nodeId of allNodeIds) {
      if (!reachableNodes.has(nodeId)) {
        warnings.push({
          type: 'warning',
          code: 'UNREACHABLE_NODE',
          message: `Node is unreachable: ${nodeId}`,
          nodeId,
        });
      }
    }

    // Check for dead ends (nodes with no outgoing edges)
    const outgoingEdges = new Map<string, number>();
    for (const edge of definition.edges) {
      outgoingEdges.set(edge.source, (outgoingEdges.get(edge.source) || 0) + 1);
    }

    for (const node of definition.nodes) {
      if (
        node.type !== 'end' &&
        node.type !== 'output' &&
        !outgoingEdges.has(node.id)
      ) {
        warnings.push({
          type: 'warning',
          code: 'DEAD_END_NODE',
          message: `Node has no outgoing edges: ${node.id}`,
          nodeId: node.id,
        });
      }
    }
  }

  /**
   * Validate performance aspects
   */
  private validatePerformance(
    definition: WorkflowDefinition,
    warnings: ValidationWarning[]
  ): void {
    // Check for long chains
    const maxChainLength = this.getMaxChainLength(definition);
    if (maxChainLength > 20) {
      warnings.push({
        type: 'warning',
        code: 'LONG_CHAIN',
        message: `Workflow has a long chain of ${maxChainLength} nodes, consider parallelization`,
      });
    }

    // Check for nodes with many outgoing edges
    const outgoingEdges = new Map<string, number>();
    for (const edge of definition.edges) {
      outgoingEdges.set(edge.source, (outgoingEdges.get(edge.source) || 0) + 1);
    }

    for (const [nodeId, count] of outgoingEdges) {
      if (count > 5) {
        warnings.push({
          type: 'warning',
          code: 'MANY_OUTGOING_EDGES',
          message: `Node has many outgoing edges (${count}), consider simplifying logic`,
          nodeId,
        });
      }
    }
  }

  /**
   * Check for cycles in the workflow
   */
  private hasCycle(edgeMap: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = edgeMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }

      recStack.delete(node);
      return false;
    };

    for (const node of edgeMap.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return true;
      }
    }

    return false;
  }

  /**
   * Get all reachable nodes from start nodes
   */
  private getReachableNodes(definition: WorkflowDefinition): Set<string> {
    const startNodes = definition.nodes
      .filter(n => n.type === 'trigger' || n.type === 'start')
      .map(n => n.id);

    const edgeMap = new Map<string, string[]>();
    for (const edge of definition.edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    const reachable = new Set<string>();
    const queue = [...startNodes];

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (reachable.has(node)) continue;

      reachable.add(node);
      const neighbors = edgeMap.get(node) || [];
      queue.push(...neighbors);
    }

    return reachable;
  }

  /**
   * Get maximum chain length in the workflow
   */
  private getMaxChainLength(definition: WorkflowDefinition): number {
    const edgeMap = new Map<string, string[]>();
    for (const edge of definition.edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    const startNodes = definition.nodes
      .filter(n => n.type === 'trigger' || n.type === 'start')
      .map(n => n.id);

    let maxLength = 0;

    const dfs = (node: string, length: number): void => {
      maxLength = Math.max(maxLength, length);
      const neighbors = edgeMap.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, length + 1);
      }
    };

    for (const startNode of startNodes) {
      dfs(startNode, 1);
    }

    return maxLength;
  }
}
