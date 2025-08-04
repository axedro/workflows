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
    // Esquemas específicos para ramas true/false
    trueBranch: {
      [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
      [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
      [DEFAULT_FIELDS.success.id]: {
        ...DEFAULT_FIELDS.success,
        example: true
      }
    },
    falseBranch: {
      [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
      [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
      [DEFAULT_FIELDS.success.id]: {
        ...DEFAULT_FIELDS.success,
        example: false
      }
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
      [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
    },
    output: {
      [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id,
      [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data,
      [DEFAULT_FIELDS.status.id]: DEFAULT_FIELDS.status,
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
      [DEFAULT_FIELDS.email.id]: DEFAULT_FIELDS.email,
      [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
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
      [DEFAULT_FIELDS.message.id]: DEFAULT_FIELDS.message,
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
      [DEFAULT_FIELDS.data.id]: DEFAULT_FIELDS.data
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
      [DEFAULT_FIELDS.id.id]: DEFAULT_FIELDS.id
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