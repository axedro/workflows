import { ConnectorConfig, ConnectorInstance } from '@flowcraft/shared-types';

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected instance: ConnectorInstance;

  constructor(config: ConnectorConfig, instance: ConnectorInstance) {
    this.config = config;
    this.instance = instance;
  }

  abstract execute(inputs: Record<string, any>): Promise<Record<string, any>>;

  abstract validate(): Promise<boolean>;

  getConfig(): ConnectorConfig {
    return this.config;
  }

  getInstance(): ConnectorInstance {
    return this.instance;
  }

  protected async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    // TODO: Implement proper logging
    console.log(`[${this.config.name}] ${level.toUpperCase()}: ${message}`);
  }
} 