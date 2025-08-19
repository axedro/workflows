import { ConnectorResult } from '@flowcraft/shared-types';

export abstract class BaseConnector {
  constructor() {}

  abstract execute(config: any, input?: any): Promise<ConnectorResult>;

  abstract test(config: any): Promise<ConnectorResult>;

  getConfigSchema(): any {
    return {};
  }

  getInputSchema(): any {
    return {};
  }

  getOutputSchema(): any {
    return {};
  }

  protected async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    // TODO: Implement proper logging
    console.log(`[${this.constructor.name}] ${level.toUpperCase()}: ${message}`);
  }
} 