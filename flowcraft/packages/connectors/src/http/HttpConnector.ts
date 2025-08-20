import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BaseConnector } from '../base';
import { ConnectorResult } from '@flowcraft/shared-types';

export interface HttpConnectorConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: Record<string, any> | string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
  authentication?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export interface HttpConnectorResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  responseTime: number;
  url: string;
}

export interface HttpConnectorError {
  message: string;
  status?: number;
  statusText?: string;
  responseData?: any;
  isTimeout: boolean;
  isNetworkError: boolean;
}

export class HttpConnector extends BaseConnector {
  private client: AxiosInstance;
  private requestTimings: Map<string, number> = new Map();

  constructor() {
    super();
    
    // Create axios instance with base configuration
    this.client = axios.create({
      timeout: 30000, // 30 second default timeout
      validateStatus: () => true, // Accept all status codes, handle in response
      maxRedirects: 5, // Default to follow redirects
    });

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Execute HTTP request
   */
  async execute(config: any, input?: any): Promise<ConnectorResult> {
    const requestId = `req_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    this.requestTimings.set(requestId, startTime);
    
    try {
      const httpConfig = this.buildRequestConfig(config, input);
      await this.log(`Making ${httpConfig.method} request to ${httpConfig.url}`, 'info');
      
      const response = await this.makeRequestWithRetries(httpConfig);
      const result = this.processResponse(response, requestId);
      
      await this.log(`Request completed successfully with status ${result.status}`, 'info');
      return {
        success: true,
        data: result,
        message: 'HTTP request completed successfully',
      };
      
    } catch (error) {
      const httpError = this.processError(error, requestId);
      await this.log(`Request failed: ${httpError.message}`, 'error');
      return {
        success: false,
        error: httpError.message,
        message: 'HTTP request failed',
      };
    } finally {
      this.requestTimings.delete(requestId);
    }
  }

  /**
   * Test connector configuration
   */
  async test(config: any): Promise<ConnectorResult> {
    try {
      // Check required configuration
      const url = config.url || config.baseUrl;
      const method = config.method || 'GET';

      if (!url) {
        return {
          success: false,
          error: 'URL is required',
          message: 'Validation failed: URL is required',
        };
      }

      if (!this.isValidHttpMethod(method)) {
        return {
          success: false,
          error: `Invalid HTTP method '${method}'`,
          message: 'Validation failed: Invalid HTTP method',
        };
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return {
          success: false,
          error: `Invalid URL format '${url}'`,
          message: 'Validation failed: Invalid URL format',
        };
      }

      // Make a test request
      const testConfig = {
        ...config,
        method: 'GET',
        url: url,
      };

      return await this.execute(testConfig);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'HTTP connector test failed',
      };
    }
  }



  /**
   * Setup axios interceptors for logging and authentication
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor  
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Build axios request configuration from inputs
   */
  private buildRequestConfig(connectorConfig: any, input?: any): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      url: input?.url || connectorConfig.url,
      method: (input?.method || connectorConfig.method || 'GET').toUpperCase(),
      timeout: connectorConfig.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlowCraft-HTTP-Connector/1.0',
        ...connectorConfig.headers,
        ...input?.headers,
      },
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(config.method!)) {
      const body = connectorConfig.body || input?.body;
      if (body) {
        config.data = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    // Add query parameters
    if (input?.params || input?.queryParams) {
      config.params = input.params || input.queryParams;
    }

    // Add authentication
    this.addAuthentication(config, connectorConfig);

    return config;
  }

  /**
   * Add authentication to request config
   */
  private addAuthentication(config: AxiosRequestConfig, connectorConfig: any): void {
    const auth = connectorConfig.authentication;
    if (!auth) return;

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          config.headers!['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
        
      case 'basic':
        if (auth.username && auth.password) {
          config.auth = {
            username: auth.username,
            password: auth.password,
          };
        }
        break;
        
      case 'apikey':
        if (auth.apiKey) {
          const headerName = auth.apiKeyHeader || 'X-API-Key';
          config.headers![headerName] = auth.apiKey;
        }
        break;
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequestWithRetries(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const maxRetries = 3; // Default retries
    const retryDelay = 1000; // Default delay
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.request(config);
        
        // Check if we should retry based on status code
        if (this.shouldRetry(response.status) && attempt < maxRetries) {
          await this.log(`Request returned ${response.status}, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`, 'warn');
          await this.delay(retryDelay);
          continue;
        }
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        if (this.shouldRetryError(error) && attempt < maxRetries) {
          await this.log(`Request failed, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`, 'warn');
          await this.delay(retryDelay);
          continue;
        }
        
        break;
      }
    }
    
    throw lastError;
  }

  /**
   * Process successful response
   */
  private processResponse(response: AxiosResponse, requestId: string): Record<string, any> {
    const startTime = this.requestTimings.get(requestId) || Date.now();
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      responseTime,
      url: response.config.url,
      success: response.status >= 200 && response.status < 300,
    };
  }

  /**
   * Process error response
   */
  private processError(error: any, requestId: string): HttpConnectorError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      return {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        responseData: axiosError.response?.data,
        isTimeout: axiosError.code === 'ECONNABORTED',
        isNetworkError: !axiosError.response,
      };
    }
    
    return {
      message: error instanceof Error ? error.message : 'Unknown error',
      isTimeout: false,
      isNetworkError: true,
    };
  }

  /**
   * Check if status code should trigger a retry
   */
  private shouldRetry(status: number): boolean {
    // Retry on server errors and some client errors
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetryError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors, timeouts, and connection issues
      return error.code === 'ECONNABORTED' || 
             error.code === 'ENOTFOUND' || 
             error.code === 'ECONNREFUSED' ||
             error.code === 'ETIMEDOUT';
    }
    return false;
  }

  /**
   * Validate HTTP method
   */
  private isValidHttpMethod(method: string): boolean {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  /**
   * Validate authentication configuration
   */
  private isValidAuthentication(auth: any): boolean {
    if (!auth.type) return false;
    
    switch (auth.type) {
      case 'bearer':
        return !!auth.token;
      case 'basic':
        return !!auth.username && !!auth.password;
      case 'apikey':
        return !!auth.apiKey;
      default:
        return false;
    }
  }



  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}