import { EditorNode, EditorEdge, NodeType } from '@flowcraft/shared-types';
import ConnectorValidationService from './connectorValidation.service';

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
  category: 'workflow' | 'field' | 'structural';
}

export interface UnifiedValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  nodeValidations: Map<string, NodeValidationResult>;
}

export interface NodeValidationResult {
  nodeId: string;
  isValid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export class UnifiedValidationService {
  private static instance: UnifiedValidationService;
  
  static getInstance(): UnifiedValidationService {
    if (!UnifiedValidationService.instance) {
      UnifiedValidationService.instance = new UnifiedValidationService();
    }
    return UnifiedValidationService.instance;
  }

  /**
   * Validates entire workflow including structure and individual node fields
   */
  validateWorkflow(nodes: EditorNode[], edges: EditorEdge[]): UnifiedValidationResult {
    const allIssues: ValidationIssue[] = [];
    const nodeValidations = new Map<string, NodeValidationResult>();

    // 1. Structural validation (workflow-level)
    const structuralIssues = this.validateWorkflowStructure(nodes, edges);
    allIssues.push(...structuralIssues);

    // 2. Individual node validations (field-level)
    for (const node of nodes) {
      const nodeValidation = this.validateNode(node, nodes, edges);
      nodeValidations.set(node.id, nodeValidation);
      allIssues.push(...nodeValidation.issues);
    }

    // 3. Edge validations
    const edgeIssues = this.validateEdges(edges, nodes);
    allIssues.push(...edgeIssues);

    // Separate errors and warnings
    const errors = allIssues.filter(issue => issue.type === 'error');
    const warnings = allIssues.filter(issue => issue.type === 'warning');

    return {
      isValid: errors.length === 0,
      issues: allIssues,
      errors,
      warnings,
      nodeValidations
    };
  }

  /**
   * Validates workflow structure (orphan nodes, cycles, etc.)
   */
  private validateWorkflowStructure(nodes: EditorNode[], edges: EditorEdge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for orphan nodes (nodes without connections)
    if (edges.length > 0) {
      const connectedNodeIds = new Set<string>();
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      nodes.forEach(node => {
        if (!connectedNodeIds.has(node.id) && node.type !== NodeType.START) {
          issues.push({
            id: `orphan-${node.id}`,
            type: 'warning',
            code: 'ORPHAN_NODE',
            message: `Node "${node.data.label || node.id}" is not connected to the workflow`,
            nodeId: node.id,
            category: 'structural'
          });
        }
      });
    }

    // Check for multiple start nodes
    const startNodes = nodes.filter(node => node.type === NodeType.START);
    if (startNodes.length > 1) {
      startNodes.forEach(node => {
        issues.push({
          id: `multiple-start-${node.id}`,
          type: 'warning', 
          code: 'MULTIPLE_START_NODES',
          message: 'Workflow has multiple start nodes',
          nodeId: node.id,
          category: 'structural'
        });
      });
    }

    // Check for missing start node
    if (startNodes.length === 0 && nodes.length > 0) {
      issues.push({
        id: 'no-start-node',
        type: 'error',
        code: 'NO_START_NODE',
        message: 'Workflow must have at least one start node',
        category: 'structural'
      });
    }

    // Check for unreachable nodes
    if (nodes.length > 1 && edges.length > 0) {
      const reachableNodes = this.getReachableNodes(nodes, edges);
      nodes.forEach(node => {
        if (!reachableNodes.has(node.id) && node.type !== NodeType.START) {
          issues.push({
            id: `unreachable-${node.id}`,
            type: 'warning',
            code: 'UNREACHABLE_NODE',
            message: `Node "${node.data.label || node.id}" is unreachable from start nodes`,
            nodeId: node.id,
            category: 'structural'
          });
        }
      });
    }

    return issues;
  }

  /**
   * Validates individual node fields and configuration
   */
  validateNode(node: EditorNode, _allNodes: EditorNode[], _allEdges: EditorEdge[]): NodeValidationResult {
    const issues: ValidationIssue[] = [];

    // Validate based on node type
    switch (node.type) {
      case NodeType.HTTP_REQUEST:
        issues.push(...this.validateHttpRequestNode(node));
        break;
      case NodeType.EMAIL:
        issues.push(...this.validateEmailNode(node));
        break;
      case NodeType.SLACK:
        issues.push(...this.validateSlackNode(node));
        break;
      case NodeType.CONDITION:
        issues.push(...this.validateConditionNode(node));
        break;
      case NodeType.DATA_TRANSFORM:
        issues.push(...this.validateDataTransformNode(node));
        break;
      case NodeType.START:
        issues.push(...this.validateStartNode(node));
        break;
      case NodeType.END:
        issues.push(...this.validateEndNode(node));
        break;
      default:
        // Generic node validation
        issues.push(...this.validateGenericNode(node));
        break;
    }

    const errors = issues.filter(issue => issue.type === 'error');
    const warnings = issues.filter(issue => issue.type === 'warning');

    return {
      nodeId: node.id,
      isValid: errors.length === 0,
      issues,
      errors,
      warnings
    };
  }

  /**
   * HTTP Request node validation
   */
  private validateHttpRequestNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const data = node.data as any;

    // Check if connector is being used
    if (data.connectorId) {
      // When using a connector, we validate the connector exists and is active
      // The actual HTTP configuration comes from the connector
      if (!data.connectorId.trim()) {
        issues.push({
          id: `http-connector-empty-${node.id}`,
          type: 'error',
          code: 'EMPTY_CONNECTOR_ID',
          message: 'Connector ID cannot be empty',
          nodeId: node.id,
          field: 'connectorId',
          category: 'field'
        });
      }
      // TODO: Add validation to check if connector exists and is active
      // This would require access to the connector data, which might need to be passed as a parameter
      
      return issues; // Skip manual field validation when using connector
    }

    // Manual configuration validation (when no connector is selected)
    if (!data.url || typeof data.url !== 'string') {
      issues.push({
        id: `http-url-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_URL',
        message: 'URL is required for HTTP request',
        nodeId: node.id,
        field: 'url',
        category: 'field'
      });
    } else {
      // Use ConnectorValidationService for detailed URL validation
      try {
        const validationConfig = {
          connectorType: 'HTTP_REQUEST',
          fields: { url: data.url, method: data.method },
          schema: {}
        };
        const result = ConnectorValidationService.validateConnector(validationConfig);
        
        result.errors.forEach((error, index) => {
          // Determine field based on error message
          const field = error.toLowerCase().includes('method') ? 'method' : 'url';
          const code = field === 'method' ? 'MISSING_HTTP_METHOD' : 'INVALID_URL';
          
          issues.push({
            id: `http-${field}-error-${node.id}-${index}`,
            type: 'error',
            code: code,
            message: error,
            nodeId: node.id,
            field: field,
            category: 'field'
          });
        });

        result.warnings.forEach((warning, index) => {
          // Determine field based on warning message
          const field = warning.toLowerCase().includes('method') ? 'method' : 'url';
          const code = field === 'method' ? 'METHOD_WARNING' : 'URL_WARNING';
          
          issues.push({
            id: `http-${field}-warning-${node.id}-${index}`,
            type: 'warning',
            code: code,
            message: warning,
            nodeId: node.id,
            field: field,
            category: 'field'
          });
        });
      } catch (error) {
        console.error('HTTP validation error:', error);
      }
    }

    // Note: Method validation is now handled by ConnectorValidationService above

    return issues;
  }

  /**
   * Email node validation
   */
  private validateEmailNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const data = node.data as any;

    // Check if connector is being used
    if (data.connectorId) {
      // When using a connector, we validate the connector exists and is active
      // The actual email configuration comes from the connector
      if (!data.connectorId.trim()) {
        issues.push({
          id: `email-connector-empty-${node.id}`,
          type: 'error',
          code: 'EMPTY_CONNECTOR_ID',
          message: 'Connector ID cannot be empty',
          nodeId: node.id,
          field: 'connectorId',
          category: 'field'
        });
      }
      
      return issues; // Skip manual field validation when using connector
    }

    // Manual configuration validation (when no connector is selected)
    if (!data.to || typeof data.to !== 'string') {
      issues.push({
        id: `email-to-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_EMAIL_TO',
        message: 'Recipient email address is required',
        nodeId: node.id,
        field: 'to',
        category: 'field'
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.to)) {
        issues.push({
          id: `email-to-invalid-${node.id}`,
          type: 'error',
          code: 'INVALID_EMAIL',
          message: 'Invalid email address format',
          nodeId: node.id,
          field: 'to',
          category: 'field'
        });
      }
    }

    // Subject validation
    if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0) {
      issues.push({
        id: `email-subject-missing-${node.id}`,
        type: 'warning',
        code: 'MISSING_EMAIL_SUBJECT',
        message: 'Email subject is recommended',
        nodeId: node.id,
        field: 'subject',
        category: 'field'
      });
    }

    return issues;
  }

  /**
   * Slack node validation
   */
  private validateSlackNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const data = node.data as any;

    // Check if connector is being used
    if (data.connectorId) {
      // When using a connector, we validate the connector exists and is active
      // The actual Slack configuration comes from the connector
      if (!data.connectorId.trim()) {
        issues.push({
          id: `slack-connector-empty-${node.id}`,
          type: 'error',
          code: 'EMPTY_CONNECTOR_ID',
          message: 'Connector ID cannot be empty',
          nodeId: node.id,
          field: 'connectorId',
          category: 'field'
        });
      }
      
      return issues; // Skip manual field validation when using connector
    }

    // Manual configuration validation (when no connector is selected)
    // Channel validation
    if (!data.channel || typeof data.channel !== 'string') {
      issues.push({
        id: `slack-channel-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_SLACK_CHANNEL',
        message: 'Slack channel is required',
        nodeId: node.id,
        field: 'channel',
        category: 'field'
      });
    }

    // Message validation
    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      issues.push({
        id: `slack-message-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_SLACK_MESSAGE',
        message: 'Slack message content is required',
        nodeId: node.id,
        field: 'message',
        category: 'field'
      });
    }

    return issues;
  }

  /**
   * Condition node validation
   */
  private validateConditionNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const data = node.data as any;

    // New advanced condition system validation
    const dataConditions = data.dataConditions || [];
    
    // Check if there are any conditions defined
    if (dataConditions.length === 0) {
      issues.push({
        id: `condition-expression-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_CONDITION',
        message: 'At least one condition is required',
        nodeId: node.id,
        field: 'dataConditions',
        category: 'field'
      });
    } else {
      // Validate each condition
      dataConditions.forEach((condition: any, index: number) => {
        if (!condition.field || condition.field.trim() === '') {
          issues.push({
            id: `condition-field-missing-${node.id}-${index}`,
            type: 'error',
            code: 'MISSING_CONDITION_FIELD',
            message: `Condition ${index + 1}: Field is required`,
            nodeId: node.id,
            field: `dataConditions[${index}].field`,
            category: 'field'
          });
        }
        
        if (condition.value === undefined || condition.value === null || condition.value === '') {
          issues.push({
            id: `condition-value-missing-${node.id}-${index}`,
            type: 'error',
            code: 'MISSING_CONDITION_VALUE',
            message: `Condition ${index + 1}: Value is required`,
            nodeId: node.id,
            field: `dataConditions[${index}].value`,
            category: 'field'
          });
        }
      });
    }

    return issues;
  }

  /**
   * Data Transform node validation
   */
  private validateDataTransformNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const data = node.data as any;

    // Transform operation validation
    if (!data.operation || typeof data.operation !== 'string') {
      issues.push({
        id: `transform-operation-missing-${node.id}`,
        type: 'error',
        code: 'MISSING_TRANSFORM_OPERATION',
        message: 'Transform operation is required',
        nodeId: node.id,
        field: 'operation',
        category: 'field'
      });
    }

    return issues;
  }

  /**
   * Start node validation
   */
  private validateStartNode(_node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // Start nodes typically don't require field validation
    return issues;
  }

  /**
   * End node validation
   */
  private validateEndNode(_node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    // End nodes typically don't require field validation
    return issues;
  }

  /**
   * Generic node validation for unknown types
   */
  private validateGenericNode(node: EditorNode): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    // Basic node validation - ensure it has a label
    if (!node.data.label || typeof node.data.label !== 'string' || node.data.label.trim().length === 0) {
      issues.push({
        id: `generic-label-missing-${node.id}`,
        type: 'warning',
        code: 'MISSING_NODE_LABEL',
        message: 'Node should have a descriptive label',
        nodeId: node.id,
        field: 'label',
        category: 'field'
      });
    }

    return issues;
  }

  /**
   * Validates edges between nodes
   */
  private validateEdges(edges: EditorEdge[], nodes: EditorNode[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    edges.forEach(edge => {
      // 1. Basic structural validations
      issues.push(...this.validateEdgeStructure(edge, nodeIds));
      
      // 2. Data flow and compatibility validations
      issues.push(...this.validateEdgeDataFlow(edge, nodeMap));
      
      // 3. Condition-based edge validations
      issues.push(...this.validateEdgeConditions(edge, nodeMap));
      
      // 4. Field mapping validations
      issues.push(...this.validateEdgeFieldMappings(edge, nodeMap));
    });

    // 5. Global edge validations (cycles, paths, etc.)
    issues.push(...this.validateWorkflowPaths(edges, nodes));

    return issues;
  }

  /**
   * Validates basic edge structure
   */
  private validateEdgeStructure(edge: EditorEdge, nodeIds: Set<string>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check if source and target nodes exist
    if (!nodeIds.has(edge.source)) {
      issues.push({
        id: `edge-invalid-source-${edge.id}`,
        type: 'error',
        code: 'INVALID_EDGE_SOURCE',
        message: `Edge source node does not exist: ${edge.source}`,
        edgeId: edge.id,
        category: 'structural'
      });
    }

    if (!nodeIds.has(edge.target)) {
      issues.push({
        id: `edge-invalid-target-${edge.id}`,
        type: 'error',
        code: 'INVALID_EDGE_TARGET',
        message: `Edge target node does not exist: ${edge.target}`,
        edgeId: edge.id,
        category: 'structural'
      });
    }

    // Check for self-loops
    if (edge.source === edge.target) {
      issues.push({
        id: `edge-self-loop-${edge.id}`,
        type: 'warning',
        code: 'SELF_LOOP',
        message: 'Edge creates a self-loop, ensure this is intentional',
        edgeId: edge.id,
        category: 'structural'
      });
    }

    // Check if edge has valid ID
    if (!edge.id || edge.id.trim().length === 0) {
      issues.push({
        id: `edge-missing-id-${Date.now()}`,
        type: 'error',
        code: 'MISSING_EDGE_ID',
        message: 'Edge must have a valid ID',
        edgeId: edge.id,
        category: 'structural'
      });
    }

    return issues;
  }

  /**
   * Validates edge data flow and compatibility
   */
  private validateEdgeDataFlow(edge: EditorEdge, nodeMap: Map<string, EditorNode>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) {
      return issues; // Skip if nodes don't exist (handled in structure validation)
    }

    if (edge.dataFlow) {
      // Validate data flow structure
      if (!edge.dataFlow.fieldMappings || edge.dataFlow.fieldMappings.length === 0) {
        issues.push({
          id: `edge-invalid-dataflow-${edge.id}`,
          type: 'error',
          code: 'INVALID_DATA_FLOW',
          message: 'Data flow must have at least one field mapping',
          edgeId: edge.id,
          field: 'dataFlow',
          category: 'field'
        });
      }

      // Validate data type compatibility through field mappings
      if (edge.dataFlow.fieldMappings && edge.dataFlow.fieldMappings.length > 0) {
        const hasTransformations = edge.dataFlow.transformations && edge.dataFlow.transformations.length > 0;
        
        // Check if transformations are needed for type compatibility
        if (!hasTransformations) {
          issues.push({
            id: `edge-datatype-mismatch-${edge.id}`,
            type: 'warning',
            code: 'DATA_TYPE_MISMATCH',
            message: `Consider adding transformations for better data type compatibility.`,
            edgeId: edge.id,
            field: 'dataFlow',
            category: 'field'
          });
        }
      }
    }

    // Validate START node connections
    if (sourceNode.type === NodeType.START) {
      const outgoingEdges = [...nodeMap.values()].filter(n => n.id !== sourceNode.id);
      if (outgoingEdges.length === 0) {
        issues.push({
          id: `edge-start-no-output-${edge.id}`,
          type: 'warning',
          code: 'START_NODE_NO_OUTPUT',
          message: 'START node should connect to other workflow nodes',
          edgeId: edge.id,
          nodeId: sourceNode.id,
          category: 'workflow'
        });
      }
    }

    // Validate END node connections
    if (targetNode.type === NodeType.END) {
      // END nodes should not have outgoing connections (this would be handled at node level)
      // but we can validate that the connection makes sense
      if (!sourceNode) {
        issues.push({
          id: `edge-end-no-input-${edge.id}`,
          type: 'error',
          code: 'END_NODE_NO_INPUT',
          message: 'END node must have valid input connections',
          edgeId: edge.id,
          nodeId: targetNode.id,
          category: 'workflow'
        });
      }
    }

    return issues;
  }

  /**
   * Validates edge conditions (for conditional branches)
   */
  private validateEdgeConditions(edge: EditorEdge, nodeMap: Map<string, EditorNode>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const sourceNode = nodeMap.get(edge.source);
    const data = edge.data;
    
    if (!sourceNode || !data) {
      return issues;
    }

    // Validate conditions on CONDITION node edges
    if (sourceNode.type === NodeType.CONDITION) {
      if (data.condition) {
        // Basic condition syntax validation
        if (typeof data.condition !== 'string' || data.condition.trim().length === 0) {
          issues.push({
            id: `edge-invalid-condition-${edge.id}`,
            type: 'error',
            code: 'INVALID_EDGE_CONDITION',
            message: 'Edge condition must be a non-empty string',
            edgeId: edge.id,
            field: 'condition',
            category: 'field'
          });
        } else {
          // Check for common condition patterns
          const condition = data.condition.trim();
          
          // Warn about potentially unsafe conditions
          if (condition === 'true' || condition === 'false') {
            issues.push({
              id: `edge-static-condition-${edge.id}`,
              type: 'warning',
              code: 'STATIC_CONDITION',
              message: `Static condition "${condition}" - consider using dynamic conditions`,
              edgeId: edge.id,
              field: 'condition',
              category: 'field'
            });
          }
          
          // Check for missing operators
          if (!condition.includes('==') && !condition.includes('!=') && 
              !condition.includes('>') && !condition.includes('<') &&
              !condition.includes('&&') && !condition.includes('||')) {
            issues.push({
              id: `edge-simple-condition-${edge.id}`,
              type: 'warning',
              code: 'SIMPLE_CONDITION',
              message: 'Consider using comparison operators in conditions (==, !=, >, <)',
              edgeId: edge.id,
              field: 'condition',
              category: 'field'
            });
          }
        }
      } else {
        // CONDITION nodes should have conditions on their edges
        issues.push({
          id: `edge-missing-condition-${edge.id}`,
          type: 'warning',
          code: 'MISSING_EDGE_CONDITION',
          message: 'Edges from CONDITION nodes should have conditions defined',
          edgeId: edge.id,
          field: 'condition',
          category: 'field'
        });
      }
    }

    // Validate edge labels
    if (data.label) {
      if (typeof data.label !== 'string' || data.label.trim().length === 0) {
        issues.push({
          id: `edge-invalid-label-${edge.id}`,
          type: 'warning',
          code: 'INVALID_EDGE_LABEL',
          message: 'Edge label should be a descriptive string',
          edgeId: edge.id,
          field: 'label',
          category: 'field'
        });
      }
    }

    return issues;
  }

  /**
   * Validates field mappings in edge data configuration
   */
  private validateEdgeFieldMappings(edge: EditorEdge, nodeMap: Map<string, EditorNode>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    const data = edge.data;
    if (!data?.dataConfig?.fieldMappings) {
      return issues;
    }

    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) {
      return issues;
    }

    data.dataConfig.fieldMappings.forEach((mapping, index) => {
      // Validate mapping structure
      if (!mapping.sourceField || !mapping.targetField) {
        issues.push({
          id: `edge-invalid-mapping-${edge.id}-${index}`,
          type: 'error',
          code: 'INVALID_FIELD_MAPPING',
          message: `Field mapping ${index + 1} must specify both source and target fields`,
          edgeId: edge.id,
          field: 'dataConfig.fieldMappings',
          category: 'field'
        });
      }

      // Validate field names format
      if (mapping.sourceField && typeof mapping.sourceField === 'string') {
        if (mapping.sourceField.includes(' ') || mapping.sourceField.includes('-')) {
          issues.push({
            id: `edge-invalid-source-field-${edge.id}-${index}`,
            type: 'warning',
            code: 'INVALID_FIELD_NAME',
            message: `Source field "${mapping.sourceField}" should use camelCase or snake_case`,
            edgeId: edge.id,
            field: 'dataConfig.fieldMappings',
            category: 'field'
          });
        }
      }

      if (mapping.targetField && typeof mapping.targetField === 'string') {
        if (mapping.targetField.includes(' ') || mapping.targetField.includes('-')) {
          issues.push({
            id: `edge-invalid-target-field-${edge.id}-${index}`,
            type: 'warning',
            code: 'INVALID_FIELD_NAME',
            message: `Target field "${mapping.targetField}" should use camelCase or snake_case`,
            edgeId: edge.id,
            field: 'dataConfig.fieldMappings',
            category: 'field'
          });
        }
      }

      // Validate transformations
      if (mapping.transformation) {
        if (typeof mapping.transformation !== 'string' || mapping.transformation.trim().length === 0) {
          issues.push({
            id: `edge-invalid-transformation-${edge.id}-${index}`,
            type: 'error',
            code: 'INVALID_TRANSFORMATION',
            message: `Transformation for mapping ${index + 1} must be a non-empty string`,
            edgeId: edge.id,
            field: 'dataConfig.fieldMappings',
            category: 'field'
          });
        }
      }
    });

    return issues;
  }

  /**
   * Validates workflow paths and cycles
   */
  private validateWorkflowPaths(edges: EditorEdge[], nodes: EditorNode[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Detect cycles
    const cycles = this.detectCycles(edges);
    if (cycles.length > 0) {
      cycles.forEach((cycle, index) => {
        issues.push({
          id: `workflow-cycle-${index}`,
          type: 'warning',
          code: 'WORKFLOW_CYCLE',
          message: `Potential infinite loop detected in workflow path: ${cycle.join(' → ')}`,
          category: 'workflow'
        });
      });
    }

    // Check for disconnected components
    const components = this.findDisconnectedComponents(edges, nodes);
    if (components.length > 1) {
      components.forEach((component, index) => {
        if (component.length > 1) { // Ignore single isolated nodes (handled elsewhere)
          issues.push({
            id: `workflow-disconnected-${index}`,
            type: 'warning',
            code: 'DISCONNECTED_COMPONENT',
            message: `Disconnected workflow component found with nodes: ${component.join(', ')}`,
            category: 'workflow'
          });
        }
      });
    }

    return issues;
  }

  /**
   * Detects cycles in the workflow graph
   */
  private detectCycles(edges: EditorEdge[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const edgeMap = new Map<string, string[]>();
    
    // Build adjacency list
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // Get all unique node IDs
    const allNodes = new Set<string>();
    for (const edge of edges) {
      allNodes.add(edge.source);
      allNodes.add(edge.target);
    }

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = edgeMap.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart >= 0) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of allNodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * Finds disconnected components in the workflow
   */
  private findDisconnectedComponents(edges: EditorEdge[], nodes: EditorNode[]): string[][] {
    const components: string[][] = [];
    const visited = new Set<string>();
    const adjacencyList = new Map<string, string[]>();
    
    // Build undirected adjacency list
    for (const edge of edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      if (!adjacencyList.has(edge.target)) {
        adjacencyList.set(edge.target, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
      adjacencyList.get(edge.target)!.push(edge.source);
    }

    const dfs = (node: string, component: string[]): void => {
      visited.add(node);
      component.push(node);
      
      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      }
    };

    // Find all components
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const component: string[] = [];
        dfs(node.id, component);
        if (component.length > 0) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Get all reachable nodes from start nodes
   */
  private getReachableNodes(nodes: EditorNode[], edges: EditorEdge[]): Set<string> {
    const startNodes = nodes
      .filter(n => n.type === NodeType.START)
      .map(n => n.id);

    const edgeMap = new Map<string, string[]>();
    for (const edge of edges) {
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
   * Updates node validation state based on validation results
   */
  updateNodeValidation(node: EditorNode, validationResult: NodeValidationResult): EditorNode {
    return {
      ...node,
      data: {
        ...node.data,
        validation: {
          isValid: validationResult.isValid,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message)
        }
      }
    };
  }
}

export default UnifiedValidationService.getInstance();