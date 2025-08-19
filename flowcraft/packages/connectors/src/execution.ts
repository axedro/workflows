import { BaseConnector } from './base';
import { ConnectorResult } from '@flowcraft/shared-types';

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  error?: string;
  executionTime: number;
  context: ExecutionContext;
}

export class ConnectorExecutor {
  static async execute(
    connector: BaseConnector,
    config: any,
    inputs?: Record<string, any>,
    context?: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Execute connector
      const result: ConnectorResult = await connector.execute(config, inputs);

      return {
        success: result.success,
        outputs: result.data || {},
        error: result.error,
        executionTime: Date.now() - startTime,
        context: context || {
          executionId: 'unknown',
          workflowId: 'unknown',
          nodeId: 'unknown',
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        outputs: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
        context: context || {
          executionId: 'unknown',
          workflowId: 'unknown',
          nodeId: 'unknown',
          timestamp: new Date(),
        },
      };
    }
  }
} 