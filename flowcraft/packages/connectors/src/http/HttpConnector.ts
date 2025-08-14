import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { BaseConnector } from '../base.js';
import { ConnectorConfig, ConnectorInstance } from '@flowcraft/shared-types';

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

  constructor(config: ConnectorConfig, instance: ConnectorInstance) {
    super(config, instance);
    
    // Create axios instance with base configuration
    this.client = axios.create({
      timeout: 30000, // 30 second default timeout
      validateStatus: () => true, // Accept all status codes, handle in response
      maxRedirects: this.getConfigValue('followRedirects', true) ? 5 : 0,
    });

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Execute HTTP request
   */
  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    const requestId = `req_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    this.requestTimings.set(requestId, startTime);
    
    try {
      const httpConfig = this.buildRequestConfig(inputs);
      await this.log(`Making ${httpConfig.method} request to ${httpConfig.url}`, 'info');
      
      const response = await this.makeRequestWithRetries(httpConfig);
      const result = this.processResponse(response, requestId);
      
      await this.log(`Request completed successfully with status ${result.status}`, 'info');
      return result;
      
    } catch (error) {
      const httpError = this.processError(error, requestId);
      await this.log(`Request failed: ${httpError.message}`, 'error');
      throw new Error(`HTTP request failed: ${httpError.message}`);
    } finally {
      this.requestTimings.delete(requestId);
    }
  }

  /**
   * Validate connector configuration
   */
  async validate(): Promise<boolean> {
    try {
      // Check required configuration
      const url = this.getConfigValue('url');
      const method = this.getConfigValue('method', 'GET');

      if (!url) {
        await this.log('Validation failed: URL is required', 'error');
        return false;
      }

      if (!this.isValidHttpMethod(method)) {
        await this.log(`Validation failed: Invalid HTTP method '${method}'`, 'error');
        return false;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        await this.log(`Validation failed: Invalid URL format '${url}'`, 'error');
        return false;
      }

      // Validate authentication config if present
      const auth = this.getConfigValue('authentication');
      if (auth && !this.isValidAuthentication(auth)) {
        await this.log('Validation failed: Invalid authentication configuration', 'error');
        return false;
      }

      await this.log('Configuration validation passed', 'info');
      return true;

    } catch (error) {
      await this.log(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return false;
    }
  }

  /**
   * Setup axios interceptors for logging and authentication
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor  
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Build axios request configuration from inputs
   */
  private buildRequestConfig(inputs: Record<string, any>): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      url: this.getConfigValue('url', inputs.url),
      method: (this.getConfigValue('method', inputs.method) || 'GET').toUpperCase(),
      timeout: this.getConfigValue('timeout', 30000),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlowCraft-HTTP-Connector/1.0',
        ...this.getConfigValue('headers', {}),
        ...inputs.headers,
      },
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(config.method!)) {
      const body = this.getConfigValue('body', inputs.body);
      if (body) {
        config.data = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    // Add query parameters
    if (inputs.params || inputs.queryParams) {
      config.params = inputs.params || inputs.queryParams;
    }

    // Add authentication
    this.addAuthentication(config);

    return config;
  }

  /**
   * Add authentication to request config
   */
  private addAuthentication(config: AxiosRequestConfig): void {
    const auth = this.getConfigValue('authentication');
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
    const maxRetries = this.getConfigValue('retries', 3);
    const retryDelay = this.getConfigValue('retryDelay', 1000);
    
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
   * Get configuration value with fallback
   */
  private getConfigValue(key: string, fallback?: any): any {
    return this.instance.config[key] ?? fallback;
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}