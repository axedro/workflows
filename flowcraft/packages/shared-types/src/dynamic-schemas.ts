/**
 * Dynamic Schema Calculation - FlowCraft Workflow Automation Platform
 * 
 * This module provides functions to calculate node input/output schemas
 * dynamically based on workflow connections and data flow transformations.
 */

import {
  DataField,
  DataType,
  DataFlow,
  DataTransformation,
  TransformationType
} from './data-flow';
import { NodeType, EditorNode, EditorEdge } from './workflow';

// ===== DYNAMIC SCHEMA CALCULATION =====

/**
 * Calculate the actual input schema for a node based on incoming connections
 */
export function calculateNodeInputSchema(
  nodeId: string,
  nodes: EditorNode[],
  edges: EditorEdge[]
): Record<string, DataField> {
  const inputSchema: Record<string, DataField> = {};
  
  // Find all incoming edges to this node
  const incomingEdges = edges.filter(edge => edge.target === nodeId);
  
  if (incomingEdges.length === 0) {
    // No incoming connections - use default schema based on node type
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return {};
    
    if (node.type === NodeType.START) {
      // Start nodes have no input
      return {};
    }
    
    // For other nodes without input, return default input schema based on node type
    return getDefaultInputSchema(node.type);
  }
  
  // Process each incoming edge
  incomingEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return;
    
    // Get the source node's output schema
    const sourceOutputSchema = calculateNodeOutputSchema(sourceNode.id, nodes, edges);
    
    // Apply data flow transformations from the edge
    if (edge.dataFlow) {
      const transformedSchema = applyDataFlowToSchema(
        sourceOutputSchema,
        edge.dataFlow
      );
      
      // Merge into input schema
      Object.assign(inputSchema, transformedSchema);
    } else {
      // No data flow defined - pass through all fields
      Object.assign(inputSchema, sourceOutputSchema);
    }
  });
  
  return inputSchema;
}

/**
 * Calculate the actual output schema for a node based on its type and input
 */
export function calculateNodeOutputSchema(
  nodeId: string,
  nodes: EditorNode[],
  edges: EditorEdge[]
): Record<string, DataField> {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return {};
  
  // Get the node's input schema
  const inputSchema = calculateNodeInputSchema(nodeId, nodes, edges);
  
  // Calculate output based on node type and configuration
  switch (node.type) {
    case NodeType.START:
      // Start nodes generate initial data based on trigger configuration
      return generateStartNodeOutput(node, inputSchema);
      
    case NodeType.ACTION:
      // Action nodes transform input data based on their configuration
      return generateActionNodeOutput(node, inputSchema);
      
    case NodeType.CONDITION:
      // Condition nodes create true/false branches
      return generateConditionNodeOutput(node, inputSchema);
      
    case NodeType.END:
      // End nodes don't have output fields - they are the final node
      return {};
      
    case NodeType.HTTP_REQUEST:
      return generateHttpRequestOutput(node, inputSchema);
      
    case NodeType.EMAIL:
      return generateEmailOutput(node, inputSchema);
      
    case NodeType.SLACK:
      return generateSlackOutput(node, inputSchema);
      
    case NodeType.DATA_TRANSFORM:
      return generateDataTransformOutput(node, inputSchema);
      
    case NodeType.TIMER:
      return generateTimerOutput(node, inputSchema);
      
    case NodeType.WEBHOOK:
      return generateWebhookOutput(node, inputSchema);
      
    default:
      // For unknown node types, pass through input
      return inputSchema;
  }
}

/**
 * Apply data flow transformations to a schema
 */
function applyDataFlowToSchema(
  sourceSchema: Record<string, DataField>,
  dataFlow: DataFlow
): Record<string, DataField> {
  const transformedSchema: Record<string, DataField> = {};
  
  // Apply field mappings
  dataFlow.fieldMappings.forEach(mapping => {
    const sourceField = sourceSchema[mapping.sourceField];
    if (sourceField) {
      transformedSchema[mapping.targetField] = {
        ...sourceField,
        id: mapping.targetField,
        name: mapping.targetField
      };
    }
  });
  
  // Apply transformations
  if (dataFlow.transformations) {
    dataFlow.transformations.forEach(transformation => {
      // For now, we'll apply transformations to all fields
      // In a more sophisticated implementation, we'd use transformation.config.field
      Object.keys(transformedSchema).forEach(fieldKey => {
        const field = transformedSchema[fieldKey];
        transformedSchema[fieldKey] = applyTransformationToField(
          field,
          transformation
        );
      });
    });
  }
  
  return transformedSchema;
}

/**
 * Apply a transformation to a data field
 */
function applyTransformationToField(
  field: DataField,
  transformation: DataTransformation
): DataField {
  switch (transformation.type) {
    case TransformationType.RENAME:
      return {
        ...field,
        id: transformation.config.newName || field.id,
        name: transformation.config.newName || field.name
      };
      
    case TransformationType.TRANSFORM:
      // Apply type transformation
      const transformType = transformation.config.transformType;
      if (transformType === 'toUpperCase' && field.type === DataType.STRING) {
        return {
          ...field,
          example: field.example ? String(field.example).toUpperCase() : field.example
        };
      }
      if (transformType === 'toLowerCase' && field.type === DataType.STRING) {
        return {
          ...field,
          example: field.example ? String(field.example).toLowerCase() : field.example
        };
      }
      break;
      
    case TransformationType.FORMAT:
      // Apply formatting
      const formatType = transformation.config.formatType;
      if (formatType === 'date' && field.type === DataType.DATE) {
        return {
          ...field,
          example: field.example ? new Date(field.example).toISOString() : field.example
        };
      }
      break;
  }
  
  return field;
}

// ===== NODE-SPECIFIC OUTPUT GENERATORS =====

function generateStartNodeOutput(
  node: EditorNode,
  _inputSchema: Record<string, DataField>
): Record<string, DataField> {
  // Start nodes generate initial data based on trigger type
  const triggerType = (node.data as any)?.triggerType || 'manual';
  
  const baseFields: Record<string, DataField> = {
    id: {
      id: 'id',
      name: 'ID',
      type: DataType.STRING,
      required: true,
      description: 'Workflow execution ID',
      example: `exec-${Date.now()}`
    },
    timestamp: {
      id: 'timestamp',
      name: 'Timestamp',
      type: DataType.DATE,
      required: true,
      description: 'Execution timestamp',
      example: new Date().toISOString()
    }
  };
  
  switch (triggerType) {
    case 'webhook':
      return {
        ...baseFields,
        webhookData: {
          id: 'webhookData',
          name: 'Webhook Data',
          type: DataType.JSON,
          required: false,
          description: 'Data received from webhook',
          example: { body: {}, headers: {}, method: 'POST' }
        }
      };
      
    case 'scheduled':
      return {
        ...baseFields,
        scheduleData: {
          id: 'scheduleData',
          name: 'Schedule Data',
          type: DataType.JSON,
          required: false,
          description: 'Scheduled execution data',
          example: { cron: '0 0 * * *', nextRun: new Date().toISOString() }
        }
      };
      
    default:
      return {
        ...baseFields,
        data: {
          id: 'data',
          name: 'Data',
          type: DataType.JSON,
          required: false,
          description: 'Initial workflow data',
          example: { status: 'active', count: 42 }
        }
      };
  }
}

function generateActionNodeOutput(
  node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  // Action nodes typically pass through input data with potential modifications
  const actionConfig = (node.data as any)?.actionConfig;
  
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add action-specific fields
  if (actionConfig) {
    output.actionResult = {
      id: 'actionResult',
      name: 'Action Result',
      type: DataType.JSON,
      required: false,
      description: 'Result of the action execution',
      example: { success: true, message: 'Action completed' }
    };
    
    output.executionTime = {
      id: 'executionTime',
      name: 'Execution Time',
      type: DataType.NUMBER,
      required: false,
      description: 'Time taken to execute the action (ms)',
      example: 150
    };
  }
  
  return output;
}

function generateConditionNodeOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  // Condition nodes create a cleaner output schema
  const output: Record<string, DataField> = {};
  
  // Add condition evaluation result
  output.conditionResult = {
    id: 'conditionResult',
    name: 'Condition Result',
    type: DataType.BOOLEAN,
    required: true,
    description: 'Result of condition evaluation',
    example: true
  };
  
  // Add input data as a single set of fields (not duplicated)
  Object.entries(inputSchema).forEach(([key, field]) => {
    output[key] = {
      ...field,
      description: `${field.description} - Available in both true and false branches`
    };
  });
  
  return output;
}

function generateHttpRequestOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add HTTP response fields
  output.responseStatus = {
    id: 'responseStatus',
    name: 'Response Status',
    type: DataType.NUMBER,
    required: true,
    description: 'HTTP response status code',
    example: 200
  };
  
  output.responseData = {
    id: 'responseData',
    name: 'Response Data',
    type: DataType.JSON,
    required: false,
    description: 'Response body data',
    example: { success: true, data: {} }
  };
  
  output.responseHeaders = {
    id: 'responseHeaders',
    name: 'Response Headers',
    type: DataType.JSON,
    required: false,
    description: 'Response headers',
    example: { 'content-type': 'application/json' }
  };
  
  return output;
}

function generateEmailOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add email-specific fields
  output.emailSent = {
    id: 'emailSent',
    name: 'Email Sent',
    type: DataType.BOOLEAN,
    required: true,
    description: 'Whether email was sent successfully',
    example: true
  };
  
  output.messageId = {
    id: 'messageId',
    name: 'Message ID',
    type: DataType.STRING,
    required: false,
    description: 'Email message ID',
    example: 'msg-123456'
  };
  
  return output;
}

function generateSlackOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add Slack-specific fields
  output.messageSent = {
    id: 'messageSent',
    name: 'Message Sent',
    type: DataType.BOOLEAN,
    required: true,
    description: 'Whether Slack message was sent successfully',
    example: true
  };
  
  output.channel = {
    id: 'channel',
    name: 'Channel',
    type: DataType.STRING,
    required: false,
    description: 'Slack channel where message was sent',
    example: '#general'
  };
  
  return output;
}

function generateDataTransformOutput(
  node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  // Data transform nodes apply transformations to input data
  const transformConfig = (node.data as any)?.transformConfig;
  
  if (transformConfig && transformConfig.transformations) {
    // Apply transformations to create new schema
    return applyDataFlowToSchema(inputSchema, {
      id: 'transform-flow',
      sourcePortId: 'transform-input',
      targetPortId: 'transform-output',
      fieldMappings: transformConfig.fieldMappings || [],
      transformations: transformConfig.transformations,
      validation: { 
        isValid: true, 
        errors: [], 
        warnings: [],
        portsCompatible: true,
        requiredFieldsMapped: true,
        typeCompatible: true
      },
      enabled: true
    });
  }
  
  // If no transformations defined, pass through input
  return inputSchema;
}

function generateTimerOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add timer-specific fields
  output.timerTriggered = {
    id: 'timerTriggered',
    name: 'Timer Triggered',
    type: DataType.BOOLEAN,
    required: true,
    description: 'Whether timer was triggered',
    example: true
  };
  
  output.triggerTime = {
    id: 'triggerTime',
    name: 'Trigger Time',
    type: DataType.DATE,
    required: true,
    description: 'When timer was triggered',
    example: new Date().toISOString()
  };
  
  return output;
}

function generateWebhookOutput(
  _node: EditorNode,
  inputSchema: Record<string, DataField>
): Record<string, DataField> {
  const output: Record<string, DataField> = { ...inputSchema };
  
  // Add webhook-specific fields
  output.webhookReceived = {
    id: 'webhookReceived',
    name: 'Webhook Received',
    type: DataType.BOOLEAN,
    required: true,
    description: 'Whether webhook was received',
    example: true
  };
  
  output.webhookData = {
    id: 'webhookData',
    name: 'Webhook Data',
    type: DataType.JSON,
    required: false,
    description: 'Data received from webhook',
    example: { body: {}, headers: {}, method: 'POST' }
  };
  
  return output;
}

// ===== DEFAULT SCHEMA GENERATORS =====

/**
 * Get default input schema for a node type when no connections exist
 */
function getDefaultInputSchema(nodeType: NodeType): Record<string, DataField> {
  switch (nodeType) {
    case NodeType.CONDITION:
      return {
        id: {
          id: 'id',
          name: 'ID',
          type: DataType.STRING,
          required: true,
          description: 'Unique identifier',
          example: 'cond-123'
        },
        timestamp: {
          id: 'timestamp',
          name: 'Timestamp',
          type: DataType.DATE,
          required: true,
          description: 'Execution timestamp',
          example: new Date().toISOString()
        },
        data: {
          id: 'data',
          name: 'Data',
          type: DataType.JSON,
          required: false,
          description: 'Input data to evaluate',
          example: { status: 'active', count: 42 }
        }
      };
      
    case NodeType.ACTION:
    case NodeType.HTTP_REQUEST:
    case NodeType.EMAIL:
    case NodeType.SLACK:
    case NodeType.DATA_TRANSFORM:
      return {
        id: {
          id: 'id',
          name: 'ID',
          type: DataType.STRING,
          required: true,
          description: 'Unique identifier',
          example: 'action-123'
        },
        timestamp: {
          id: 'timestamp',
          name: 'Timestamp',
          type: DataType.DATE,
          required: true,
          description: 'Execution timestamp',
          example: new Date().toISOString()
        },
        data: {
          id: 'data',
          name: 'Data',
          type: DataType.JSON,
          required: false,
          description: 'Input data to process',
          example: { status: 'active', count: 42 }
        }
      };
      
    case NodeType.END:
      return {
        id: {
          id: 'id',
          name: 'ID',
          type: DataType.STRING,
          required: true,
          description: 'Unique identifier',
          example: 'end-123'
        },
        timestamp: {
          id: 'timestamp',
          name: 'Timestamp',
          type: DataType.DATE,
          required: true,
          description: 'Execution timestamp',
          example: new Date().toISOString()
        },
        data: {
          id: 'data',
          name: 'Data',
          type: DataType.JSON,
          required: false,
          description: 'Final data to output',
          example: { status: 'completed', result: 'success' }
        }
      };
      
    case NodeType.TIMER:
    case NodeType.WEBHOOK:
      return {
        id: {
          id: 'id',
          name: 'ID',
          type: DataType.STRING,
          required: true,
          description: 'Unique identifier',
          example: 'trigger-123'
        },
        timestamp: {
          id: 'timestamp',
          name: 'Timestamp',
          type: DataType.DATE,
          required: true,
          description: 'Execution timestamp',
          example: new Date().toISOString()
        }
      };
      
    default:
      return {};
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get the dynamic input schema for a node
 */
export function getNodeInputSchema(
  nodeId: string,
  nodes: EditorNode[],
  edges: EditorEdge[]
): Record<string, DataField> {
  return calculateNodeInputSchema(nodeId, nodes, edges);
}

/**
 * Get the dynamic output schema for a node
 */
export function getNodeOutputSchema(
  nodeId: string,
  nodes: EditorNode[],
  edges: EditorEdge[]
): Record<string, DataField> {
  return calculateNodeOutputSchema(nodeId, nodes, edges);
}

/**
 * Check if a node has any incoming connections
 */
export function hasIncomingConnections(
  nodeId: string,
  edges: EditorEdge[]
): boolean {
  return edges.some(edge => edge.target === nodeId);
}

/**
 * Check if a node has any outgoing connections
 */
export function hasOutgoingConnections(
  nodeId: string,
  edges: EditorEdge[]
): boolean {
  return edges.some(edge => edge.source === nodeId);
} 