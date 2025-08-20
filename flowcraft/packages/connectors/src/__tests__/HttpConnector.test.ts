import { HttpConnector } from '../http/HttpConnector';
import axios from 'axios';
import { ConnectorResult } from '@flowcraft/shared-types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpConnector', () => {
  let httpConnector: HttpConnector;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    mockedAxios.isAxiosError.mockImplementation((error) => error.isAxiosError === true);
    
    httpConnector = new HttpConnector();
  });

  describe('execute', () => {
    it('should execute GET request successfully', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true, message: 'Hello World' },
        headers: { 'content-type': 'application/json' },
        config: { url: 'https://httpbin.org/get' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/get'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        status: 200,
        statusText: 'OK',
        data: { success: true, message: 'Hello World' },
        success: true
      }));
      expect(result.message).toBe('HTTP request completed successfully');
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: 'https://httpbin.org/get',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'FlowCraft-HTTP-Connector/1.0'
        })
      }));
    });

    it('should execute POST request with body successfully', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        data: { id: 1, created: true },
        headers: { 'content-type': 'application/json' },
        config: { url: 'https://httpbin.org/post' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'POST',
        url: 'https://httpbin.org/post',
        body: { name: 'test', value: 123 }
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(201);
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'https://httpbin.org/post',
        data: JSON.stringify({ name: 'test', value: 123 })
      }));
    });

    it('should handle authentication - Bearer token', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { authenticated: true },
        headers: {},
        config: { url: 'https://api.example.com/protected' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        authentication: {
          type: 'bearer',
          token: 'abc123'
        }
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer abc123'
        })
      }));
    });

    it('should handle authentication - Basic auth', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { authenticated: true },
        headers: {},
        config: { url: 'https://api.example.com/protected' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        authentication: {
          type: 'basic',
          username: 'user',
          password: 'pass'
        }
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        auth: {
          username: 'user',
          password: 'pass'
        }
      }));
    });

    it('should handle authentication - API Key', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { authenticated: true },
        headers: {},
        config: { url: 'https://api.example.com/protected' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        authentication: {
          type: 'apikey',
          apiKey: 'key123',
          apiKeyHeader: 'X-Custom-API-Key'
        }
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-API-Key': 'key123'
        })
      }));
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      (networkError as any).code = 'ENOTFOUND';
      
      mockAxiosInstance.request.mockRejectedValue(networkError);
      
      const config = {
        method: 'GET',
        url: 'https://nonexistent.example.com'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
      expect(result.message).toBe('HTTP request failed');
    });

    it('should handle HTTP error responses', async () => {
      const httpError = new Error('Request failed with status code 404');
      (httpError as any).isAxiosError = true;
      (httpError as any).response = {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'Resource not found' }
      };
      
      mockAxiosInstance.request.mockRejectedValue(httpError);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/status/404'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Request failed with status code 404');
      expect(result.message).toBe('HTTP request failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      (timeoutError as any).isAxiosError = true;
      (timeoutError as any).code = 'ECONNABORTED';
      
      mockAxiosInstance.request.mockRejectedValue(timeoutError);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/delay/10',
        timeout: 5000
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('timeout of 5000ms exceeded');
    });
  });

  describe('test', () => {
    it('should validate required URL', async () => {
      const config = {
        method: 'GET'
        // Missing URL
      };
      
      const result: ConnectorResult = await httpConnector.test(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('URL is required');
      expect(result.message).toBe('Validation failed: URL is required');
    });

    it('should validate HTTP method', async () => {
      const config = {
        method: 'INVALID',
        url: 'https://httpbin.org/get'
      };
      
      const result: ConnectorResult = await httpConnector.test(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid HTTP method 'INVALID'");
      expect(result.message).toBe('Validation failed: Invalid HTTP method');
    });

    it('should validate URL format', async () => {
      const config = {
        method: 'GET',
        url: 'not-a-valid-url'
      };
      
      const result: ConnectorResult = await httpConnector.test(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid URL format 'not-a-valid-url'");
      expect(result.message).toBe('Validation failed: Invalid URL format');
    });

    it('should perform successful test request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { test: 'success' },
        headers: { 'content-type': 'application/json' },
        config: { url: 'https://httpbin.org/get' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'POST', // Should be converted to GET for test
        url: 'https://httpbin.org/get'
      };
      
      const result: ConnectorResult = await httpConnector.test(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(200);
      
      // Verify that test method converts to GET
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: 'https://httpbin.org/get'
      }));
    });

    it('should handle test request failures', async () => {
      const testError = new Error('Connection refused');
      (testError as any).isAxiosError = true;
      (testError as any).code = 'ECONNREFUSED';
      
      mockAxiosInstance.request.mockRejectedValue(testError);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/get'
      };
      
      const result: ConnectorResult = await httpConnector.test(config);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('retry logic', () => {
    it('should retry on server errors', async () => {
      const serverErrorResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Server error' },
        headers: {},
        config: { url: 'https://httpbin.org/status/500' }
      };
      
      const successResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
        headers: {},
        config: { url: 'https://httpbin.org/status/500' }
      };
      
      // First call returns 500, second call succeeds
      mockAxiosInstance.request
        .mockResolvedValueOnce(serverErrorResponse)
        .mockResolvedValueOnce(successResponse);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/status/500'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(200);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      (networkError as any).code = 'ENOTFOUND';
      
      const successResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
        headers: {},
        config: { url: 'https://httpbin.org/get' }
      };
      
      // First call throws network error, second call succeeds
      mockAxiosInstance.request
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/get'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(200);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      const clientErrorResponse = {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'Not found' },
        headers: {},
        config: { url: 'https://httpbin.org/status/404' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(clientErrorResponse);
      
      const config = {
        method: 'GET',
        url: 'https://httpbin.org/status/404'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe(404);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1); // No retry
    });
  });

  describe('input merging', () => {
    it('should merge config and input parameters', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { merged: true },
        headers: {},
        config: { url: 'https://httpbin.org/get' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'POST',
        url: 'https://httpbin.org/post',
        headers: { 'X-Config-Header': 'config-value' }
      };
      
      const input = {
        body: { inputData: 'test' },
        headers: { 'X-Input-Header': 'input-value' }
      };
      
      const result: ConnectorResult = await httpConnector.execute(config, input);
      
      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'https://httpbin.org/post',
        data: JSON.stringify({ inputData: 'test' }),
        headers: expect.objectContaining({
          'X-Config-Header': 'config-value',
          'X-Input-Header': 'input-value'
        })
      }));
    });

    it('should prioritize input over config for URL and method', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { overridden: true },
        headers: {},
        config: { url: 'https://httpbin.org/put' }
      };
      
      mockAxiosInstance.request.mockResolvedValue(mockResponse);
      
      const config = {
        method: 'POST',
        url: 'https://httpbin.org/post'
      };
      
      const input = {
        method: 'PUT',
        url: 'https://httpbin.org/put'
      };
      
      const result: ConnectorResult = await httpConnector.execute(config, input);
      
      expect(result.success).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'PUT',
        url: 'https://httpbin.org/put'
      }));
    });
  });
});