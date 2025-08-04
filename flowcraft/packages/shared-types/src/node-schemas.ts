/**
 * Node Data Schemas - FlowCraft Workflow Automation Platform
 * 
 * This module provides default data schemas for each node type
 * to ensure consistent data flow across the workflow editor.
 */

import {
  DataSchema,
  DataField,
  DataType,
  DataPort,
  PortPosition,
  PortType
} from './data-flow';
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
  } as DataField,
  
  name: {
    id: 'name',
    name: 'Name',
    type: DataType.STRING,
    required: true,
    description: 'Display name',
    example: 'John Doe'
  } as DataField,
  
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
  } as DataField,
  
  timestamp: {
    id: 'timestamp',
    name: 'Timestamp',
    type: DataType.DATE,
    required: false,
    description: 'Date and time',
    example: '2024-01-01T00:00:00Z'
  } as DataField,
  
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
  } as DataField,
  
  data: {
    id: 'data',
    name: 'Data',
    type: DataType.JSON,
    required: false,
    description: 'Generic data object',
    example: { key: 'value' }
  } as DataField,
  
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
  } as DataField,
  
  success: {
    id: 'success',
    name: 'Success',
    type: DataType.BOOLEAN,
    required: false,
    description: 'Success flag',
    example: true
  } as DataField,
  
  message: {
    id: 'message',
    name: 'Message',
    type: DataType.STRING,
    required: false,
    description: 'Text message',
    example: 'Operation completed successfully'
  } as DataField,
  
  error: {
    id: 'error',
    name: 'Error',
    type: DataType.STRING,
    required: false,
    description: 'Error message',
    example: 'Something went wrong'
  } as DataField,

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
  } as DataField,

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
  } as DataField,

  headers: {
    id: 'headers',
    name: 'Headers',
    type: DataType.JSON,
    required: false,
    description: 'HTTP headers',
    example: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' }
  } as DataField,

  body: {
    id: 'body',
    name: 'Body',
    type: DataType.JSON,
    required: false,
    description: 'Request body',
    example: { key: 'value' }
  } as DataField,

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
  } as DataField,

  responseData: {
    id: 'responseData',
    name: 'Response Data',
    type: DataType.JSON,
    required: false,
    description: 'Response data from HTTP request',
    example: { result: 'success', data: [] }
  } as DataField,

  // Email specific fields
  to: {
    id: 'to',
    name: 'To',
    type: DataType.ARRAY,
    required: true,
    description: 'Recipient email addresses',
    example: ['user@example.com', 'admin@example.com']
  } as DataField,

  cc: {
    id: 'cc',
    name: 'CC',
    type: DataType.ARRAY,
    required: false,
    description: 'CC recipient email addresses',
    example: ['cc@example.com']
  } as DataField,

  bcc: {
    id: 'bcc',
    name: 'BCC',
    type: DataType.ARRAY,
    required: false,
    description: 'BCC recipient email addresses',
    example: ['bcc@example.com']
  } as DataField,

  subject: {
    id: 'subject',
    name: 'Subject',
    type: DataType.STRING,
    required: true,
    description: 'Email subject',
    example: 'Important notification'
  } as DataField,

  emailBody: {
    id: 'emailBody',
    name: 'Email Body',
    type: DataType.STRING,
    required: true,
    description: 'Email body content',
    example: 'This is the email content...'
  } as DataField,

  attachments: {
    id: 'attachments',
    name: 'Attachments',
    type: DataType.ARRAY,
    required: false,
    description: 'Email attachments',
    example: [{ name: 'document.pdf', url: 'https://example.com/doc.pdf' }]
  } as DataField,

  // Slack specific fields
  channel: {
    id: 'channel',
    name: 'Channel',
    type: DataType.STRING,
    required: true,
    description: 'Slack channel name',
    example: '#general'
  } as DataField,

  slackMessage: {
    id: 'slackMessage',
    name: 'Message',
    type: DataType.STRING,
    required: true,
    description: 'Slack message content',
    example: 'Hello from FlowCraft!'
  } as DataField,

  blocks: {
    id: 'blocks',
    name: 'Blocks',
    type: DataType.JSON,
    required: false,
    description: 'Slack message blocks',
    example: [{ type: 'section', text: { type: 'mrkdwn', text: 'Hello!' } }]
  } as DataField,

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
  } as DataField,

  schedule: {
    id: 'schedule',
    name: 'Schedule',
    type: DataType.STRING,
    required: false,
    description: 'Cron schedule expression',
    example: '0 0 * * *'
  } as DataField,

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
  } as DataField,

  transformConfig: {
    id: 'transformConfig',
    name: 'Transform Config',
    type: DataType.JSON,
    required: true,
    description: 'Transformation configuration',
    example: { field: 'name', operation: 'uppercase' }
  } as DataField,

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
  } as DataField,

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
  } as DataField,

  webhookHeaders: {
    id: 'webhookHeaders',
    name: 'Webhook Headers',
    type: DataType.JSON,
    required: false,
    description: 'Headers for webhook request',
    example: { 'X-API-Key': 'secret-key' }
  } as DataField
};

// ===== DEFAULT PORTS =====

export const DEFAULT_PORTS = {
  // Input ports
  input: {
    id: 'input',
    name: 'Input',
    type: 'input' as PortType,
    fields: [DEFAULT_FIELDS.data],
    position: 'left' as PortPosition,
    required: true,
    description: 'Input data port'
  } as DataPort,
  
  // Output ports
  output: {
    id: 'output',
    name: 'Output',
    type: 'output' as PortType,
    fields: [DEFAULT_FIELDS.data],
    position: 'right' as PortPosition,
    required: true,
    description: 'Output data port'
  } as DataPort,
  
  // Success output
  success: {
    id: 'success',
    name: 'Success',
    type: 'output' as PortType,
    fields: [DEFAULT_FIELDS.data, DEFAULT_FIELDS.success, DEFAULT_FIELDS.message],
    position: 'right' as PortPosition,
    required: false,
    description: 'Success output port'
  } as DataPort,
  
  // Error output
  error: {
    id: 'error',
    name: 'Error',
    type: 'output' as PortType,
    fields: [DEFAULT_FIELDS.error, DEFAULT_FIELDS.success],
    position: 'bottom' as PortPosition,
    required: false,
    description: 'Error output port'
  } as DataPort
};

// ===== NODE SCHEMAS =====

export const NODE_SCHEMAS: Record<NodeType, DataSchema> = {
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

export const NODE_PORTS: Record<NodeType, DataPort[]> = {
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
export function getNodeSchema(nodeType: NodeType): DataSchema {
  return NODE_SCHEMAS[nodeType];
}

/**
 * Get the default ports for a node type
 */
export function getNodePorts(nodeType: NodeType): DataPort[] {
  return NODE_PORTS[nodeType];
}

/**
 * Get input ports for a node type
 */
export function getNodeInputPorts(nodeType: NodeType): DataPort[] {
  return NODE_PORTS[nodeType].filter(port => port.type === 'input');
}

/**
 * Get output ports for a node type
 */
export function getNodeOutputPorts(nodeType: NodeType): DataPort[] {
  return NODE_PORTS[nodeType].filter(port => port.type === 'output');
}

/**
 * Create a custom data field
 */
export function createDataField(
  id: string,
  name: string,
  type: DataType,
  required: boolean = false,
  description?: string,
  example?: any
): DataField {
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
export function createDataPort(
  id: string,
  name: string,
  type: PortType,
  fields: DataField[],
  position: PortPosition,
  required: boolean = false,
  description?: string
): DataPort {
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
export function createDataSchema(
  input: Record<string, DataField>,
  output: Record<string, DataField>,
  description?: string,
  version: string = '1.0'
): DataSchema {
  return {
    input,
    output,
    description,
    version
  };
} 