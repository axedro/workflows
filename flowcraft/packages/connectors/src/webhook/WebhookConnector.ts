import { BaseConnector } from '../base';
import { ConnectorConfig, ConnectorResult } from '@flowcraft/shared-types';
import { createHash, createHmac } from 'crypto';

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  signature?: {
    secret: string;
    algorithm: 'sha1' | 'sha256' | 'sha512';
    headerName: string;
  };
  validateSSL?: boolean;
  followRedirects?: boolean;
}

export interface WebhookInput {
  body?: any;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}

export class WebhookConnector extends BaseConnector {
  async execute(config: WebhookConfig, input?: WebhookInput): Promise<ConnectorResult> {
    try {
      const url = new URL(config.url);
      
      // Add query parameters if provided
      if (input?.query) {
        Object.entries(input.query).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
        ...input?.headers,
      };

      // Add signature if configured
      if (config.signature && input?.body) {
        const signature = this.generateSignature(
          JSON.stringify(input.body),
          config.signature.secret,
          config.signature.algorithm
        );
        headers[config.signature.headerName] = signature;
      }

      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
        redirect: config.followRedirects !== false ? 'follow' : 'manual',
      };

      // Add body for non-GET requests
      if (input?.body && config.method !== 'GET') {
        fetchOptions.body = typeof input.body === 'string' 
          ? input.body 
          : JSON.stringify(input.body);
      }

      // Set timeout
      const timeout = config.timeout || 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      fetchOptions.signal = controller.signal;

      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const responseBody = contentType.includes('application/json') 
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status} ${response.statusText}`,
          message: 'Webhook request failed',
          data: {
            status: response.status,
            statusText: response.statusText,
            responseBody,
            url: url.toString(),
            method: config.method,
          },
        };
      }

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          responseBody,
          headers: Object.fromEntries(response.headers.entries()),
          url: url.toString(),
          method: config.method,
        },
        message: 'Webhook request successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Webhook request failed',
      };
    }
  }

  async test(config: WebhookConfig): Promise<ConnectorResult> {
    try {
      const testInput: WebhookInput = {
        body: {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'FlowCraft webhook connector test',
        },
        headers: {
          'X-Test': 'true',
        },
      };

      return await this.execute(config, testInput);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Webhook connector test failed',
      };
    }
  }

  private generateSignature(payload: string, secret: string, algorithm: string): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    return `${algorithm}=${hmac.digest('hex')}`;
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          title: 'Webhook URL',
          description: 'Target webhook endpoint URL',
          format: 'uri',
          examples: ['https://api.example.com/webhook', 'https://hooks.slack.com/services/...'],
        },
        method: {
          type: 'string',
          title: 'HTTP Method',
          description: 'HTTP method for the webhook request',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'POST',
        },
        headers: {
          type: 'object',
          title: 'Headers',
          description: 'Additional HTTP headers',
          additionalProperties: {
            type: 'string',
          },
          examples: [
            { 'Authorization': 'Bearer token123' },
            { 'X-API-Key': 'api-key-here' },
          ],
        },
        timeout: {
          type: 'number',
          title: 'Timeout (ms)',
          description: 'Request timeout in milliseconds',
          default: 30000,
          minimum: 1000,
          maximum: 300000,
        },
        retries: {
          type: 'number',
          title: 'Retry Count',
          description: 'Number of retry attempts on failure',
          default: 0,
          minimum: 0,
          maximum: 5,
        },
        signature: {
          type: 'object',
          title: 'Signature Configuration',
          description: 'Webhook signature for security',
          properties: {
            secret: {
              type: 'string',
              title: 'Secret Key',
              description: 'Secret key for signature generation',
              format: 'password',
            },
            algorithm: {
              type: 'string',
              title: 'Algorithm',
              description: 'Hashing algorithm for signature',
              enum: ['sha1', 'sha256', 'sha512'],
              default: 'sha256',
            },
            headerName: {
              type: 'string',
              title: 'Header Name',
              description: 'Header name for the signature',
              default: 'X-Signature',
              examples: ['X-Signature', 'X-Hub-Signature', 'X-Webhook-Signature'],
            },
          },
          required: ['secret', 'algorithm', 'headerName'],
        },
        validateSSL: {
          type: 'boolean',
          title: 'Validate SSL',
          description: 'Validate SSL certificates',
          default: true,
        },
        followRedirects: {
          type: 'boolean',
          title: 'Follow Redirects',
          description: 'Follow HTTP redirects',
          default: true,
        },
      },
      required: ['url', 'method'],
    };
  }

  getInputSchema(): any {
    return {
      type: 'object',
      properties: {
        body: {
          type: 'object',
          title: 'Request Body',
          description: 'Data to send in the request body',
          additionalProperties: true,
        },
        query: {
          type: 'object',
          title: 'Query Parameters',
          description: 'URL query parameters',
          additionalProperties: {
            type: 'string',
          },
        },
        headers: {
          type: 'object',
          title: 'Request Headers',
          description: 'Additional request headers',
          additionalProperties: {
            type: 'string',
          },
        },
      },
    };
  }

  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        status: {
          type: 'number',
          title: 'HTTP Status',
          description: 'HTTP response status code',
        },
        statusText: {
          type: 'string',
          title: 'Status Text',
          description: 'HTTP response status text',
        },
        responseBody: {
          type: 'object',
          title: 'Response Body',
          description: 'Response body content',
          additionalProperties: true,
        },
        headers: {
          type: 'object',
          title: 'Response Headers',
          description: 'Response headers',
          additionalProperties: {
            type: 'string',
          },
        },
        url: {
          type: 'string',
          title: 'Request URL',
          description: 'Final request URL (after redirects)',
        },
        method: {
          type: 'string',
          title: 'HTTP Method',
          description: 'HTTP method used',
        },
      },
    };
  }
}
