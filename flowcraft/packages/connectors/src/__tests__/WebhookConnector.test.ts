import { WebhookConnector, WebhookConfig, WebhookInput } from '../webhook/WebhookConnector';
import { ConnectorResult } from '@flowcraft/shared-types';

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: {}
})) as any;

describe('WebhookConnector', () => {
  let webhookConnector: WebhookConnector;
  const mockResponse = (status: number, data: any, headers: Record<string, string> = {}) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : status === 201 ? 'Created' : status === 404 ? 'Not Found' : 'Error',
      headers: new Map(Object.entries({
        'content-type': 'application/json',
        ...headers
      })),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data))
    } as Response);
  };

  const validWebhookConfig: WebhookConfig = {
    url: 'https://httpbin.org/post',
    method: 'POST'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    webhookConnector = new WebhookConnector();
  });

  describe('execute', () => {
    it('should execute POST webhook successfully', async () => {
      const responseData = { received: true, id: 123 };
      mockFetch.mockResolvedValue(mockResponse(200, responseData));

      const input: WebhookInput = {
        body: { message: 'Hello, World!' }
      };

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig, input);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        status: 200,
        statusText: 'OK',
        responseBody: responseData,
        method: 'POST'
      }));
      expect(result.message).toBe('Webhook request successful');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://httpbin.org/post',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ message: 'Hello, World!' })
        })
      );
    });

    it('should execute GET webhook successfully', async () => {
      const getConfig: WebhookConfig = {
        url: 'https://httpbin.org/get',
        method: 'GET'
      };

      const responseData = { args: {}, headers: {} };
      mockFetch.mockResolvedValue(mockResponse(200, responseData));

      const result: ConnectorResult = await webhookConnector.execute(getConfig);

      expect(result.success).toBe(true);
      expect(result.data?.method).toBe('GET');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://httpbin.org/get',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should add query parameters to URL', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const input: WebhookInput = {
        query: {
          param1: 'value1',
          param2: 'value2'
        }
      };

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://httpbin.org/post?param1=value1&param2=value2',
        expect.any(Object)
      );
    });

    it('should merge headers from config and input', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const configWithHeaders: WebhookConfig = {
        ...validWebhookConfig,
        headers: {
          'X-Config-Header': 'config-value',
          'Authorization': 'Bearer token123'
        }
      };

      const input: WebhookInput = {
        headers: {
          'X-Input-Header': 'input-value',
          'Content-Type': 'application/xml' // Should override default
        }
      };

      const result: ConnectorResult = await webhookConnector.execute(configWithHeaders, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/xml',
            'X-Config-Header': 'config-value',
            'Authorization': 'Bearer token123',
            'X-Input-Header': 'input-value'
          })
        })
      );
    });

    it('should generate webhook signature', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const configWithSignature: WebhookConfig = {
        ...validWebhookConfig,
        signature: {
          secret: 'my-secret-key',
          algorithm: 'sha256',
          headerName: 'X-Hub-Signature'
        }
      };

      const input: WebhookInput = {
        body: { test: 'data' }
      };

      const result: ConnectorResult = await webhookConnector.execute(configWithSignature, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Hub-Signature': expect.stringMatching(/^sha256=[a-f0-9]+$/)
          })
        })
      );
    });

    it('should handle different signature algorithms', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const configWithSha1: WebhookConfig = {
        ...validWebhookConfig,
        signature: {
          secret: 'secret',
          algorithm: 'sha1',
          headerName: 'X-Signature'
        }
      };

      const input: WebhookInput = {
        body: { test: 'data' }
      };

      const result: ConnectorResult = await webhookConnector.execute(configWithSha1, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Signature': expect.stringMatching(/^sha1=[a-f0-9]+$/)
          })
        })
      );
    });

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Not found', code: 404 };
      mockFetch.mockResolvedValue(mockResponse(404, errorResponse));

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP 404 Not Found');
      expect(result.message).toBe('Webhook request failed');
      expect(result.data).toEqual(expect.objectContaining({
        status: 404,
        statusText: 'Not Found',
        responseBody: errorResponse
      }));
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.message).toBe('Webhook request failed');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('The operation was aborted'));

      const configWithTimeout: WebhookConfig = {
        ...validWebhookConfig,
        timeout: 1000
      };

      const result: ConnectorResult = await webhookConnector.execute(configWithTimeout);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The operation was aborted');
      expect(result.message).toBe('Webhook request failed');
    });

    it('should handle non-JSON responses', async () => {
      const textResponse = 'Plain text response';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'text/plain']]),
        json: () => Promise.reject(new Error('Not JSON')),
        text: () => Promise.resolve(textResponse)
      } as Response);

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig);

      expect(result.success).toBe(true);
      expect(result.data?.responseBody).toBe(textResponse);
    });

    it('should set custom timeout', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const configWithTimeout: WebhookConfig = {
        ...validWebhookConfig,
        timeout: 5000
      };

      // Mock setTimeout to capture timeout value
      const mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((callback, timeout) => {
        expect(timeout).toBe(5000);
        return setTimeout(callback, 0); // Execute immediately for test
      });

      const result: ConnectorResult = await webhookConnector.execute(configWithTimeout);

      expect(result.success).toBe(true);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

      mockSetTimeout.mockRestore();
    });

    it('should handle string body input', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const input: WebhookInput = {
        body: '<xml>test</xml>'
      };

      const result: ConnectorResult = await webhookConnector.execute(validWebhookConfig, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: '<xml>test</xml>'
        })
      );
    });

    it('should not include body for GET requests', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const getConfig: WebhookConfig = {
        ...validWebhookConfig,
        method: 'GET'
      };

      const input: WebhookInput = {
        body: { shouldNotBeSent: true }
      };

      const result: ConnectorResult = await webhookConnector.execute(getConfig, input);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          body: expect.anything()
        })
      );
    });
  });

  describe('test', () => {
    it('should send test webhook successfully', async () => {
      const responseData = { test: 'received' };
      mockFetch.mockResolvedValue(mockResponse(200, responseData));

      const result: ConnectorResult = await webhookConnector.test(validWebhookConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        status: 200,
        responseBody: responseData
      }));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://httpbin.org/post',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Test': 'true'
          }),
          body: expect.stringContaining('"test":true')
        })
      );
    });

    it('should include test payload', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const result: ConnectorResult = await webhookConnector.test(validWebhookConfig);

      expect(result.success).toBe(true);
      
      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs?.body as string);
      
      expect(body).toEqual(expect.objectContaining({
        test: true,
        message: 'FlowCraft webhook connector test',
        timestamp: expect.any(String)
      }));
    });

    it('should handle test webhook failures', async () => {
      mockFetch.mockRejectedValue(new Error('Connection failed'));

      const result: ConnectorResult = await webhookConnector.test(validWebhookConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
      expect(result.message).toBe('Webhook connector test failed');
    });

    it('should test with signature configuration', async () => {
      mockFetch.mockResolvedValue(mockResponse(200, {}));

      const configWithSignature: WebhookConfig = {
        ...validWebhookConfig,
        signature: {
          secret: 'test-secret',
          algorithm: 'sha256',
          headerName: 'X-Test-Signature'
        }
      };

      const result: ConnectorResult = await webhookConnector.test(configWithSignature);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Test-Signature': expect.stringMatching(/^sha256=[a-f0-9]+$/)
          })
        })
      );
    });
  });

  describe('getConfigSchema', () => {
    it('should return valid JSON schema for configuration', () => {
      const schema = webhookConnector.getConfigSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('url');
      expect(schema.properties).toHaveProperty('method');
      expect(schema.properties).toHaveProperty('headers');
      expect(schema.properties).toHaveProperty('signature');
      expect(schema.required).toEqual(['url', 'method']);
    });

    it('should include signature configuration schema', () => {
      const schema = webhookConnector.getConfigSchema();

      expect(schema.properties.signature).toHaveProperty('type', 'object');
      expect(schema.properties.signature.properties).toHaveProperty('secret');
      expect(schema.properties.signature.properties).toHaveProperty('algorithm');
      expect(schema.properties.signature.properties).toHaveProperty('headerName');
      expect(schema.properties.signature.required).toEqual(['secret', 'algorithm', 'headerName']);
    });

    it('should include method enum values', () => {
      const schema = webhookConnector.getConfigSchema();

      expect(schema.properties.method.enum).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    });
  });

  describe('getInputSchema', () => {
    it('should return valid JSON schema for input data', () => {
      const schema = webhookConnector.getInputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('body');
      expect(schema.properties).toHaveProperty('query');
      expect(schema.properties).toHaveProperty('headers');
    });
  });

  describe('getOutputSchema', () => {
    it('should return valid JSON schema for output data', () => {
      const schema = webhookConnector.getOutputSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('status');
      expect(schema.properties).toHaveProperty('statusText');
      expect(schema.properties).toHaveProperty('responseBody');
      expect(schema.properties).toHaveProperty('headers');
      expect(schema.properties).toHaveProperty('url');
      expect(schema.properties).toHaveProperty('method');
    });
  });
});