import { ConnectorRegistry } from './registry';
import { HttpConnector } from './http';
import { EmailConnector } from './email';
import { WebhookConnector } from './webhook';
import { TimerConnector } from './timer';
import { DataTransformConnector } from './data-transform';
import { ConnectorConfig } from '@flowcraft/shared-types';

// HTTP Connector Configuration
const httpConfig: ConnectorConfig = {
  id: 'http',
  name: 'HTTP Request',
  description: 'Realizar peticiones HTTP a APIs y servicios web',
  version: '1.0.0',
  category: 'Core',
  icon: '🌐',
  inputs: [],
  outputs: [],
  configSchema: {},
};

// Email Connector Configuration
const emailConfig: ConnectorConfig = {
  id: 'email',
  name: 'Email/SMTP',
  description: 'Enviar emails a través de SMTP',
  version: '1.0.0',
  category: 'Comunicación',
  icon: '📧',
  inputs: [],
  outputs: [],
  configSchema: {},
};

// Webhook Connector Configuration
const webhookConfig: ConnectorConfig = {
  id: 'webhook',
  name: 'Webhook',
  description: 'Recibir eventos y notificaciones de servicios externos',
  version: '1.0.0',
  category: 'Core',
  icon: '🔗',
  inputs: [],
  outputs: [],
  configSchema: {},
};

// Timer Connector Configuration
const timerConfig: ConnectorConfig = {
  id: 'timer',
  name: 'Timer/Schedule',
  description: 'Ejecutar acciones en intervalos programados',
  version: '1.0.0',
  category: 'Core',
  icon: '⏰',
  inputs: [],
  outputs: [],
  configSchema: {},
};

// Data Transform Connector Configuration
const dataTransformConfig: ConnectorConfig = {
  id: 'data-transform',
  name: 'Data Transform',
  description: 'Transformar y manipular datos entre servicios',
  version: '1.0.0',
  category: 'Core',
  icon: '🔄',
  inputs: [],
  outputs: [],
  configSchema: {},
};

/**
 * Register all connectors in the ConnectorRegistry
 */
export function registerAllConnectors(): void {
  const registry = ConnectorRegistry.getInstance();

  // Register HTTP Connector
  registry.register('http', HttpConnector, httpConfig);

  // Register Email Connector
  registry.register('email', EmailConnector, emailConfig);

  // Register Webhook Connector
  registry.register('webhook', WebhookConnector, webhookConfig);

  // Register Timer Connector
  registry.register('timer', TimerConnector, timerConfig);

  // Register Data Transform Connector
  registry.register('data-transform', DataTransformConnector, dataTransformConfig);

  console.log('✅ All connectors registered successfully');
  console.log(`📦 Registered connectors: ${registry.getAllIds().join(', ')}`);
}

/**
 * Get all registered connector configurations
 */
export function getAllConnectorConfigs(): ConnectorConfig[] {
  const registry = ConnectorRegistry.getInstance();
  return registry.getAllConfigs();
}

/**
 * Check if a connector is registered
 */
export function isConnectorRegistered(id: string): boolean {
  const registry = ConnectorRegistry.getInstance();
  return registry.hasConnector(id);
}
