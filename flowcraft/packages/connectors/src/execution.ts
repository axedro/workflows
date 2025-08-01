import { BaseConnector } from './base';
import { ConnectorValidator, ValidationResult } from './validation';
import { ConnectorInstance } from '@flowcraft/shared-types';

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
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      const config = connector.getConfig();
      const inputValidation = ConnectorValidator.validateInputs(inputs, config.inputs);
      
      if (!inputValidation.isValid) {
        return {
          success: false,
          outputs: {},
          error: `Input validation failed: ${inputValidation.errors.join(', ')}`,
          executionTime: Date.now() - startTime,
          context,
        };
      }

      // Validate connector
      const isValid = await connector.validate();
      if (!isValid) {
        return {
          success: false,
          outputs: {},
          error: 'Connector validation failed',
          executionTime: Date.now() - startTime,
          context,
        };
      }

      // Execute connector
      const outputs = await connector.execute(inputs);

      return {
        success: true,
        outputs,
        executionTime: Date.now() - startTime,
        context,
      };
    } catch (error) {
      return {
        success: false,
        outputs: {},
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
        context,
      };
    }
  }
} 