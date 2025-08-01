export type ConnectorType = 'trigger' | 'action' | 'condition' | 'transform';

export type ConnectorCategory = 
  | 'communication'
  | 'data'
  | 'file'
  | 'http'
  | 'logic'
  | 'notification'
  | 'social'
  | 'utility';

export interface ConnectorMetadata {
  author: string;
  website?: string;
  documentation?: string;
  tags: string[];
  examples?: ConnectorExample[];
}

export interface ConnectorExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
}

export interface ConnectorStats {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted?: Date;
}

export interface ConnectorVersion {
  version: string;
  releaseDate: Date;
  changelog: string[];
  breakingChanges: string[];
  deprecated?: boolean;
} 