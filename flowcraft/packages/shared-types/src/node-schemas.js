/**
 * Node Data Schemas - FlowCraft Workflow Automation Platform
 *
 * This module provides default data schemas for each node type
 * to ensure consistent data flow across the workflow editor.
 */
import { DataType } from './data-flow';
import { NodeType } from './workflow';
// ===== DEFAULT DATA FIELDS =====
export const DEFAULT_FIELDS = {
    // Common fields
    id: {
        id: 'id',
        name: 'ID',
        type: DataType.STRING,
        required: true,
        description: 'Unique identifier',
        example: 'user-123'
    },
    name: {
        id: 'name',
        name: 'Name',
        type: DataType.STRING,
        required: true,
        description: 'Display name',
        example: 'John Doe'
    },
    email: {
        id: 'email',
        name: 'Email',
        type: DataType.EMAIL,
        required: false,
        description: 'Email address',
        example: 'john@example.com',
        validation: {
            pattern: '^[^@]+@[^@]+\\.[^@]+$'
        }
    },
    timestamp: {
        id: 'timestamp',
        name: 'Timestamp',
        type: DataType.DATE,
        required: false,
        description: 'Date and time',
        example: '2024-01-01T00:00:00Z'
    },
    status: {
        id: 'status',
        name: 'Status',
        type: DataType.STRING,
        required: false,
        description: 'Current status',
        example: 'active',
        validation: {
            enum: ['active', 'inactive', 'pending', 'completed', 'error']
        }
    },
    data: {
        id: 'data',
        name: 'Data',
        type: DataType.JSON,
        required: false,
        description: 'Generic data object',
        example: { key: 'value' }
    },
    count: {
        id: 'count',
        name: 'Count',
        type: DataType.NUMBER,
        required: false,
        description: 'Numeric count',
        example: 42,
        validation: {
            min: 0
        }
    },
    success: {
        id: 'success',
        name: 'Success',
        type: DataType.BOOLEAN,
        required: false,
        description: 'Success flag',
        example: true
    },
    message: {
        id: 'message',
        name: 'Message',
        type: DataType.STRING,
        required: false,
        description: 'Text message',
        example: 'Operation completed successfully'
    },
    error: {
        id: 'error',
        name: 'Error',
        type: DataType.STRING,
        required: false,
        description: 'Error message',
        example: 'Something went wrong'
    },
    // HTTP Request specific fields
    url: {
        id: 'url',
        name: 'URL',
        type: DataType.URL,
        required: true,
        description: 'Request URL',
        example: 'https://api.example.com/data',
        validation: {
            pattern: '^https?://.+'
        }
    },
    method: {
        id: 'method',
        name: 'Method',
        type: DataType.STRING,
        required: true,
        description: 'HTTP method',
        example: 'GET',
        validation: {
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        }
    },
    headers: {
        id: 'headers',
        name: 'Headers',
        type: DataType.JSON,
        required: false,
        description: 'HTTP headers',
        example: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' }
    },
    body: {
        id: 'body',
        name: 'Body',
        type: DataType.JSON,
        required: false,
        description: 'Request body',
        example: { key: 'value' }
    },
    responseStatus: {
        id: 'responseStatus',
        name: 'Response Status',
        type: DataType.NUMBER,
        required: false,
        description: 'HTTP response status code',
        example: 200,
        validation: {
            min: 100,
            max: 599
        }
    },
    responseData: {
        id: 'responseData',
        name: 'Response Data',
        type: DataType.JSON,
        required: false,
        description: 'Response data from HTTP request',
        example: { result: 'success', data: [] }
    },
    // Email specific fields
    to: {
        id: 'to',
        name: 'To',
        type: DataType.ARRAY,
        required: true,
        description: 'Recipient email addresses',
        example: ['user@example.com', 'admin@example.com']
    },
    cc: {
        id: 'cc',
        name: 'CC',
        type: DataType.ARRAY,
        required: false,
        description: 'CC recipient email addresses',
        example: ['cc@example.com']
    },
    bcc: {
        id: 'bcc',
        name: 'BCC',
        type: DataType.ARRAY,
        required: false,
        description: 'BCC recipient email addresses',
        example: ['bcc@example.com']
    },
    subject: {
        id: 'subject',
        name: 'Subject',
        type: DataType.STRING,
        required: true,
        description: 'Email subject',
        example: 'Important notification'
    },
    emailBody: {
        id: 'emailBody',
        name: 'Email Body',
        type: DataType.STRING,
        required: true,
        description: 'Email body content',
        example: 'This is the email content...'
    },
    attachments: {
        id: 'attachments',
        name: 'Attachments',
        type: DataType.ARRAY,
        required: false,
        description: 'Email attachments',
        example: [{ name: 'document.pdf', url: 'https://example.com/doc.pdf' }]
    },
    // Slack specific fields
    channel: {
        id: 'channel',
        name: 'Channel',
        type: DataType.STRING,
        required: true,
        description: 'Slack channel name',
        example: '#general'
    },
    slackMessage: {
        id: 'slackMessage',
        name: 'Message',
        type: DataType.STRING,
        required: true,
        description: 'Slack message content',
        example: 'Hello from FlowCraft!'
    },
    blocks: {
        id: 'blocks',
        name: 'Blocks',
        type: DataType.JSON,
        required: false,
        description: 'Slack message blocks',
        example: [{ type: 'section', text: { type: 'mrkdwn', text: 'Hello!' } }]
    },
    // Timer specific fields
    duration: {
        id: 'duration',
        name: 'Duration',
        type: DataType.NUMBER,
        required: true,
        description: 'Timer duration in milliseconds',
        example: 5000,
        validation: {
            min: 1000,
            max: 86400000 // 24 hours
        }
    },
    schedule: {
        id: 'schedule',
        name: 'Schedule',
        type: DataType.STRING,
        required: false,
        description: 'Cron schedule expression',
        example: '0 0 * * *'
    },
    // Data Transform specific fields
    transformType: {
        id: 'transformType',
        name: 'Transform Type',
        type: DataType.STRING,
        required: true,
        description: 'Type of transformation',
        example: 'map',
        validation: {
            enum: ['map', 'filter', 'aggregate', 'sort', 'custom']
        }
    },
    transformConfig: {
        id: 'transformConfig',
        name: 'Transform Config',
        type: DataType.JSON,
        required: true,
        description: 'Transformation configuration',
        example: { field: 'name', operation: 'uppercase' }
    },
    // Webhook specific fields
    webhookUrl: {
        id: 'webhookUrl',
        name: 'Webhook URL',
        type: DataType.URL,
        required: true,
        description: 'Webhook endpoint URL',
        example: 'https://api.example.com/webhook',
        validation: {
            pattern: '^https?://.+'
        }
    },
    webhookMethod: {
        id: 'webhookMethod',
        name: 'Webhook Method',
        type: DataType.STRING,
        required: true,
        description: 'HTTP method for webhook',
        example: 'POST',
        validation: {
            enum: ['GET', 'POST', 'PUT', 'DELETE']
        }
    },
    webhookHeaders: {
        id: 'webhookHeaders',
        name: 'Webhook Headers',
        type: DataType.JSON,
        required: false,
        description: 'Headers for webhook request',
        example: { 'X-API-Key': 'secret-key' }
    }
};
// ===== DEFAULT PORTS =====
export const DEFAULT_PORTS = {
    // Input ports
    input: {
        id: 'input',
        name: 'Input',
        type: 'input',
        fields: [DEFAULT_FIELDS.data],
        position: 'left',
        required: true,
        description: 'Input data port'
    },
    // Output ports
    output: {
        id: 'output',
        name: 'Output',
        type: 'output',
        fields: [DEFAULT_FIELDS.data],
        position: 'right',
        required: true,
        description: 'Output data port'
    },
    // Success output
    success: {
        id: 'success',
        name: 'Success',
        type: 'output',
        fields: [DEFAULT_FIELDS.data, DEFAULT_FIELDS.success, DEFAULT_FIELDS.message],
        position: 'right',
        required: false,
        description: 'Success output port'
    },
    // Error output
    error: {
        id: 'error',
        name: 'Error',
        type: 'output',
        fields: [DEFAULT_FIELDS.error, DEFAULT_FIELDS.success],
        position: 'bottom',
        required: false,
        description: 'Error output port'
    }
};
// ===== NODE SCHEMAS =====
export const NODE_SCHEMAS = {
    [NodeType.START]: {
        input: {},
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        description: 'Start node schema - generates initial data',
        version: '1.0'
    },
    [NodeType.END]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message
        },
        output: {},
        description: 'End node schema - receives final data',
        version: '1.0'
    },
    [NodeType.ACTION]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp
        },
        description: 'Action node schema - processes data',
        version: '1.0'
    },
    [NodeType.CONDITION]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success
        },
        description: 'Condition node schema - filters data based on conditions',
        version: '1.0'
    },
    [NodeType.LOOP]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.count.id]: DEFAULT_FIELDS.count
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.count.id]: DEFAULT_FIELDS.count,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success
        },
        description: 'Loop node schema - iterates over data',
        version: '1.0'
    },
    [NodeType.HTTP_REQUEST]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.url.id]: DEFAULT_FIELDS.url,
            [DEFAULT_FIELDS.method.id]: DEFAULT_FIELDS.method,
            [DEFAULT_FIELDS.headers.id]: DEFAULT_FIELDS.headers,
            [DEFAULT_FIELDS.body.id]: DEFAULT_FIELDS.body,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.responseStatus.id]: DEFAULT_FIELDS.responseStatus,
            [DEFAULT_FIELDS.responseData.id]: DEFAULT_FIELDS.responseData,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp
        },
        description: 'HTTP Request node schema - makes HTTP requests',
        version: '1.0'
    },
    [NodeType.EMAIL]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.to.id]: DEFAULT_FIELDS.to,
            [DEFAULT_FIELDS.cc.id]: DEFAULT_FIELDS.cc,
            [DEFAULT_FIELDS.bcc.id]: DEFAULT_FIELDS.bcc,
            [DEFAULT_FIELDS.subject.id]: DEFAULT_FIELDS.subject,
            [DEFAULT_FIELDS.emailBody.id]: DEFAULT_FIELDS.emailBody,
            [DEFAULT_FIELDS.attachments.id]: DEFAULT_FIELDS.attachments,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp
        },
        description: 'Email node schema - sends emails',
        version: '1.0'
    },
    [NodeType.SLACK]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.channel.id]: DEFAULT_FIELDS.channel,
            [DEFAULT_FIELDS.slackMessage.id]: DEFAULT_FIELDS.slackMessage,
            [DEFAULT_FIELDS.blocks.id]: DEFAULT_FIELDS.blocks,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp
        },
        description: 'Slack node schema - sends Slack messages',
        version: '1.0'
    },
    [NodeType.DATA_TRANSFORM]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.transformType.id]: DEFAULT_FIELDS.transformType,
            [DEFAULT_FIELDS.transformConfig.id]: DEFAULT_FIELDS.transformConfig
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message
        },
        description: 'Data Transform node schema - transforms data',
        version: '1.0'
    },
    [NodeType.TIMER]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.duration.id]: DEFAULT_FIELDS.duration,
            [DEFAULT_FIELDS.schedule.id]: DEFAULT_FIELDS.schedule
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success
        },
        description: 'Timer node schema - delays execution',
        version: '1.0'
    },
    [NodeType.WEBHOOK]: {
        input: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.webhookUrl.id]: DEFAULT_FIELDS.webhookUrl,
            [DEFAULT_FIELDS.webhookMethod.id]: DEFAULT_FIELDS.webhookMethod,
            [DEFAULT_FIELDS.webhookHeaders.id]: DEFAULT_FIELDS.webhookHeaders,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
        },
        output: {
            [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
            [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
            [DEFAULT_FIELDS.success.id]: DEFAULT_FIELDS.success,
            [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
            [DEFAULT_FIELDS.timestamp.id]: DEFAULT_FIELDS.timestamp
        },
        description: 'Webhook node schema - receives webhook data',
        version: '1.0'
    },
    [NodeType.TEST]: {
        input: {},
        output: {},
        description: 'Test node schema',
        version: '1.0'
    }
};
// ===== NODE PORTS =====
export const NODE_PORTS = {
    [NodeType.START]: [
        {
            ...DEFAULT_PORTS.output,
            id: 'start-output',
            position: 'right',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.END]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'end-input',
            position: 'left',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message
            ]
        }
    ],
    [NodeType.ACTION]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'action-input',
            position: 'left',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'action-output',
            position: 'right',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.CONDITION]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'condition-input',
            position: 'top',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.success,
            id: 'condition-true',
            position: 'right',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data, DEFAULT_FIELDS.success]
        },
        {
            ...DEFAULT_PORTS.error,
            id: 'condition-false',
            position: 'left',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data, DEFAULT_FIELDS.success]
        }
    ],
    [NodeType.LOOP]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'loop-input',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data, DEFAULT_FIELDS.count]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'loop-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.count,
                DEFAULT_FIELDS.success
            ]
        }
    ],
    [NodeType.HTTP_REQUEST]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'http-input',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'http-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.status,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.EMAIL]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'email-input',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.email,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.data
            ]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'email-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.SLACK]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'slack-input',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.message, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'slack-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.DATA_TRANSFORM]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'transform-input',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'transform-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message
            ]
        }
    ],
    [NodeType.TIMER]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'timer-input',
            fields: [DEFAULT_FIELDS.id]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'timer-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.timestamp,
                DEFAULT_FIELDS.success
            ]
        }
    ],
    [NodeType.WEBHOOK]: [
        {
            ...DEFAULT_PORTS.input,
            id: 'webhook-input',
            fields: [DEFAULT_FIELDS.id, DEFAULT_FIELDS.data]
        },
        {
            ...DEFAULT_PORTS.output,
            id: 'webhook-output',
            fields: [
                DEFAULT_FIELDS.id,
                DEFAULT_FIELDS.data,
                DEFAULT_FIELDS.success,
                DEFAULT_FIELDS.message,
                DEFAULT_FIELDS.timestamp
            ]
        }
    ],
    [NodeType.TEST]: [
        {
            id: 'test-output',
            name: 'Output',
            type: 'output',
            position: 'right',
            fields: [],
            required: false,
            description: 'Test output port'
        }
    ]
};
// ===== UTILITY FUNCTIONS =====
/**
 * Get the default data schema for a node type
 */
export function getNodeSchema(nodeType) {
    return NODE_SCHEMAS[nodeType];
}
/**
 * Get the default ports for a node type
 */
export function getNodePorts(nodeType) {
    return NODE_PORTS[nodeType];
}
/**
 * Get input ports for a node type
 */
export function getNodeInputPorts(nodeType) {
    return NODE_PORTS[nodeType].filter(port => port.type === 'input');
}
/**
 * Get output ports for a node type
 */
export function getNodeOutputPorts(nodeType) {
    return NODE_PORTS[nodeType].filter(port => port.type === 'output');
}
/**
 * Create a custom data field
 */
export function createDataField(id, name, type, required = false, description, example) {
    return {
        id,
        name,
        type,
        required,
        description,
        example
    };
}
/**
 * Create a custom data port
 */
export function createDataPort(id, name, type, fields, position, required = false, description) {
    return {
        id,
        name,
        type,
        fields,
        position,
        required,
        description
    };
}
/**
 * Create a custom data schema
 */
export function createDataSchema(input, output, description, version = '1.0') {
    return {
        input,
        output,
        description,
        version
    };
}
//# sourceMappingURL=node-schemas.js.map