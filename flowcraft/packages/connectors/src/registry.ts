import { BaseConnector } from './base';
import { ConnectorConfig } from '@flowcraft/shared-types';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, typeof BaseConnector> = new Map();
  private configs: Map<string, ConnectorConfig> = new Map();

  private constructor() {}

  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  register(id: string, connectorClass: typeof BaseConnector, config: ConnectorConfig): void {
    this.connectors.set(id, connectorClass);
    this.configs.set(id, config);
  }

  getConnector(id: string): typeof BaseConnector | undefined {
    return this.connectors.get(id);
  }

  getConfig(id: string): ConnectorConfig | undefined {
    return this.configs.get(id);
  }

  getAllConfigs(): ConnectorConfig[] {
    return Array.from(this.configs.values());
  }

  getAllIds(): string[] {
    return Array.from(this.connectors.keys());
  }

  hasConnector(id: string): boolean {
    return this.connectors.has(id);
  }
} 