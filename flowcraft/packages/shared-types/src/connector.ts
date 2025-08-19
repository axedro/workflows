export interface ConnectorConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  category: string;
  inputs: ConnectorInput[];
  outputs: ConnectorOutput[];
  configSchema: Record<string, any>;
}

export interface ConnectorInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface ConnectorOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
}

export interface ConnectorInstance {
  id: string;
  connectorId: string;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
} 