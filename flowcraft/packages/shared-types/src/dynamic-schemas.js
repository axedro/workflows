/**
 * Dynamic Schema Calculation - FlowCraft Workflow Automation Platform
 *
 * This module provides functions to calculate node input/output schemas
 * dynamically based on workflow connections and data flow transformations.
 */
import { DataType, TransformationType } from './data-flow';
import { NodeType } from './workflow';
// ===== DYNAMIC SCHEMA CALCULATION =====
/**
 * Calculate the actual input schema for a node based on incoming connections
 */
export function calculateNodeInputSchema(nodeId, nodes, edges) {
    const inputSchema = {};
    // Find all incoming edges to this node
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    if (incomingEdges.length === 0) {
        // No incoming connections - return empty schema
        // Nodes without connections should not have input schemas
        return {};
    }
    // Process each incoming edge
    incomingEdges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode)
            return;
        // Get the source node's output schema
        const sourceOutputSchema = calculateNodeOutputSchema(sourceNode.id, nodes, edges);
        // Apply data flow transformations from the edge
        if (edge.dataFlow) {
            const transformedSchema = applyDataFlowToSchema(sourceOutputSchema, edge.dataFlow);
            // Merge into input schema
            Object.assign(inputSchema, transformedSchema);
        }
        else {
            // No data flow defined - pass through all fields
            Object.assign(inputSchema, sourceOutputSchema);
        }
    });
    return inputSchema;
}
/**
 * Calculate the actual output schema for a node based on its type and input
 */
export function calculateNodeOutputSchema(nodeId, nodes, edges) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node)
        return {};
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
function applyDataFlowToSchema(sourceSchema, dataFlow) {
    const transformedSchema = {};
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
                transformedSchema[fieldKey] = applyTransformationToField(field, transformation);
            });
        });
    }
    return transformedSchema;
}
/**
 * Apply a transformation to a data field
 */
function applyTransformationToField(field, transformation) {
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
function generateStartNodeOutput(node, _inputSchema) {
    // Start nodes generate initial data based on trigger type
    const triggerType = node.data?.triggerType || 'manual';
    const baseFields = {
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
function generateActionNodeOutput(node, inputSchema) {
    // Action nodes typically pass through input data with potential modifications
    const actionConfig = node.data?.actionConfig;
    const output = { ...inputSchema };
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
function generateConditionNodeOutput(_node, inputSchema) {
    // Condition nodes create a cleaner output schema
    const output = {};
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
function generateHttpRequestOutput(_node, inputSchema) {
    const output = { ...inputSchema };
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
function generateEmailOutput(_node, inputSchema) {
    const output = { ...inputSchema };
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
function generateSlackOutput(_node, inputSchema) {
    const output = { ...inputSchema };
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
function generateDataTransformOutput(_node, inputSchema) {
    const output = { ...inputSchema };
    // Add data transform specific fields
    output.transformResult = {
        id: 'transformResult',
        name: 'Transform Result',
        type: DataType.JSON,
        required: true,
        description: 'Result of data transformation',
        example: { transformed: true, data: {} }
    };
    output.transformStatus = {
        id: 'transformStatus',
        name: 'Transform Status',
        type: DataType.STRING,
        required: true,
        description: 'Status of transformation operation',
        example: 'success'
    };
    output.processedData = {
        id: 'processedData',
        name: 'Processed Data',
        type: DataType.JSON,
        required: false,
        description: 'Data after transformation processing',
        example: { status: 'processed', count: 42 }
    };
    return output;
}
function generateTimerOutput(_node, inputSchema) {
    const output = { ...inputSchema };
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
function generateWebhookOutput(_node, inputSchema) {
    const output = { ...inputSchema };
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
// ===== UTILITY FUNCTIONS =====
/**
 * Get the dynamic input schema for a node
 */
export function getNodeInputSchema(nodeId, nodes, edges) {
    return calculateNodeInputSchema(nodeId, nodes, edges);
}
/**
 * Get the dynamic output schema for a node
 */
export function getNodeOutputSchema(nodeId, nodes, edges) {
    return calculateNodeOutputSchema(nodeId, nodes, edges);
}
/**
 * Check if a node has any incoming connections
 */
export function hasIncomingConnections(nodeId, edges) {
    return edges.some(edge => edge.target === nodeId);
}
/**
 * Check if a node has any outgoing connections
 */
export function hasOutgoingConnections(nodeId, edges) {
    return edges.some(edge => edge.source === nodeId);
}
//# sourceMappingURL=dynamic-schemas.js.map