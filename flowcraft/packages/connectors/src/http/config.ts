import { ConnectorConfig } from '@flowcraft/shared-types';

export const HTTP_CONNECTOR_CONFIG: ConnectorConfig = {
  id: 'http-request',
  name: 'HTTP Request',
  version: '1.0.0',
  description: 'Make HTTP requests to external APIs and web services',
  icon: '🌐',
  category: 'http',
  
  inputs: [
    {
      name: 'url',
      type: 'string',
      required: true,
      description: 'The URL to make the request to',
    },
    {
      name: 'method',
      type: 'string',
      required: false,
      description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)',
      defaultValue: 'GET',
    },
    {
      name: 'headers',
      type: 'object',
      required: false,
      description: 'Additional headers to include in the request',
      defaultValue: {},
    },
    {
      name: 'body',
      type: 'object',
      required: false,
      description: 'Request body data (for POST, PUT, PATCH methods)',
    },
    {
      name: 'params',
      type: 'object',
      required: false,
      description: 'URL query parameters',
      defaultValue: {},
    },
    {
      name: 'timeout',
      type: 'number',
      required: false,
      description: 'Request timeout in milliseconds',
      defaultValue: 30000,
    },
  ],
  
  outputs: [
    {
      name: 'status',
      type: 'number',
      description: 'HTTP response status code',
    },
    {
      name: 'statusText',
      type: 'string',
      description: 'HTTP response status text',
    },
    {
      name: 'data',
      type: 'object',
      description: 'Response data',
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Response headers',
    },
    {
      name: 'responseTime',
      type: 'number',
      description: 'Request response time in milliseconds',
    },
    {
      name: 'url',
      type: 'string',
      description: 'Final URL that was requested',
    },
    {
      name: 'success',
      type: 'boolean',
      description: 'Whether the request was successful (status 2xx)',
    },
  ],
  
  configSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        title: 'Base URL',
        description: 'The base URL for requests (can be overridden per execution)',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        default: 'GET',
        title: 'HTTP Method',
        description: 'Default HTTP method to use',
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        title: 'Default Headers',
        description: 'Headers to include in all requests',
        default: {},
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 300000,
        default: 30000,
        title: 'Timeout (ms)',
        description: 'Request timeout in milliseconds',
      },
      retries: {
        type: 'number',
        minimum: 0,
        maximum: 10,
        default: 3,
        title: 'Max Retries',
        description: 'Maximum number of retry attempts',
      },
      retryDelay: {
        type: 'number',
        minimum: 100,
        maximum: 30000,
        default: 1000,
        title: 'Retry Delay (ms)',
        description: 'Delay between retry attempts in milliseconds',
      },
      followRedirects: {
        type: 'boolean',
        default: true,
        title: 'Follow Redirects',
        description: 'Whether to follow HTTP redirects',
      },
      validateSSL: {
        type: 'boolean',
        default: true,
        title: 'Validate SSL',
        description: 'Whether to validate SSL certificates',
      },
      authentication: {
        type: 'object',
        title: 'Authentication',
        description: 'Authentication configuration',
        properties: {
          type: {
            type: 'string',
            enum: ['bearer', 'basic', 'apikey'],
            title: 'Authentication Type',
            description: 'Type of authentication to use',
          },
          token: {
            type: 'string',
            title: 'Bearer Token',
            description: 'Bearer token for authentication',
          },
          username: {
            type: 'string',
            title: 'Username',
            description: 'Username for basic authentication',
          },
          password: {
            type: 'string',
            title: 'Password',
            description: 'Password for basic authentication',
            format: 'password',
          },
          apiKey: {
            type: 'string',
            title: 'API Key',
            description: 'API key for authentication',
          },
          apiKeyHeader: {
            type: 'string',
            default: 'X-API-Key',
            title: 'API Key Header',
            description: 'Header name for API key authentication',
          },
        },
        dependencies: {
          type: {
            oneOf: [
              {
                properties: {
                  type: { const: 'bearer' },
                  token: { type: 'string' },
                },
                required: ['token'],
              },
              {
                properties: {
                  type: { const: 'basic' },
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['username', 'password'],
              },
              {
                properties: {
                  type: { const: 'apikey' },
                  apiKey: { type: 'string' },
                  apiKeyHeader: { type: 'string' },
                },
                required: ['apiKey'],
              },
            ],
          },
        },
      },
    },
    required: ['url'],
  },
};