import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface Logger {
  debug: (obj: any, msg?: string) => void;
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
}

export interface ExecutionServiceConfig {
  baseURL: string;
  timeout: number;
  logger?: Logger;
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  userId: string;
  input?: Record<string, any>;
}

export interface ExecuteWorkflowResponse {
  executionId: string;
  status: string;
  message: string;
}

export interface ExecutionStatus {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorDetails?: string;
  executionTimeMs?: number;
  nodes: ExecutionNodeStatus[];
  logs: ExecutionLogEntry[];
}

export interface ExecutionNodeStatus {
  id: string;
  nodeId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt?: string;
  completedAt?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorDetails?: string;
}

export interface ExecutionLogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export class ExecutionService {
  private client: AxiosInstance;
  private config: ExecutionServiceConfig;
  private logger: Logger;

  constructor(serviceConfig?: Partial<ExecutionServiceConfig>) {
    this.config = {
      baseURL: serviceConfig?.baseURL || process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001',
      timeout: serviceConfig?.timeout || 30000,
      logger: serviceConfig?.logger,
    };

    // Default logger if none provided
    this.logger = this.config.logger || {
      debug: (obj, msg) => console.debug(msg, obj),
      info: (obj, msg) => console.info(msg, obj),
      warn: (obj, msg) => console.warn(msg, obj),
      error: (obj, msg) => console.error(msg, obj),
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        this.logger.debug(
          { 
            method: config.method?.toUpperCase(), 
            url: config.url, 
            baseURL: config.baseURL 
          }, 
          'ExecutionService HTTP request'
        );
        return config;
      },
      (error: any) => {
        this.logger.error({ error }, 'ExecutionService request error');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(
          { 
            status: response.status, 
            url: response.config.url,
            duration: response.headers['x-response-time']
          }, 
          'ExecutionService HTTP response'
        );
        return response;
      },
      (error: any) => {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message;
        
        this.logger.error(
          { 
            status,
            message,
            url: error.config?.url,
            method: error.config?.method 
          }, 
          'ExecutionService HTTP error'
        );
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string, 
    userId: string, 
    input?: Record<string, any>
  ): Promise<string> {
    try {
      const request: ExecuteWorkflowRequest = {
        workflowId,
        userId,
        input: input || {},
      };

      const response = await this.client.post<ExecuteWorkflowResponse>(
        '/api/workflows/execute', 
        request
      );

      this.logger.info(
        { 
          workflowId, 
          userId, 
          executionId: response.data.executionId 
        }, 
        'Workflow execution started via ExecutionService'
      );

      return response.data.executionId;

    } catch (error: any) {
      this.logger.error(
        { 
          error, 
          workflowId, 
          userId 
        }, 
        'Failed to execute workflow via ExecutionService'
      );

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(`ExecutionService error: ${message}`);
      }

      throw error;
    }
  }

  /**
   * Get execution status and details
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    try {
      const response = await this.client.get<ExecutionStatus>(
        `/api/executions/${executionId}`
      );

      return response.data;

    } catch (error: any) {
      this.logger.error(
        { 
          error, 
          executionId 
        }, 
        'Failed to get execution status from ExecutionService'
      );

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Execution not found: ${executionId}`);
        }
        const message = error.response?.data?.error || error.message;
        throw new Error(`ExecutionService error: ${message}`);
      }

      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    try {
      await this.client.post(`/api/executions/${executionId}/cancel`);

      this.logger.info(
        { executionId }, 
        'Execution cancelled via ExecutionService'
      );

    } catch (error: any) {
      this.logger.error(
        { 
          error, 
          executionId 
        }, 
        'Failed to cancel execution via ExecutionService'
      );

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Execution not found: ${executionId}`);
        }
        const message = error.response?.data?.error || error.message;
        throw new Error(`ExecutionService error: ${message}`);
      }

      throw error;
    }
  }

  async resumeExecution(executionId: string, nodeId?: string): Promise<void> {
    try {
      await this.client.post(`/api/executions/${executionId}/resume`, {
        nodeId: nodeId,
      });

      this.logger.info(
        { executionId, nodeId }, 
        'Execution resumed via ExecutionService'
      );

    } catch (error: any) {
      this.logger.error(
        { 
          error, 
          executionId, 
          nodeId 
        }, 
        'Failed to resume execution via ExecutionService'
      );

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Execution not found: ${executionId}`);
        }
        const message = error.response?.data?.error || error.message;
        throw new Error(`ExecutionService error: ${message}`);
      }

      throw error;
    }
  }

  /**
   * List executions for a workflow
   */
  async listWorkflowExecutions(
    workflowId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    }
  ): Promise<{
    executions: Omit<ExecutionStatus, 'nodes' | 'logs'>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);

      const queryString = params.toString();
      const url = `/api/workflows/${workflowId}/executions${queryString ? `?${queryString}` : ''}`;

      const response = await this.client.get(url);

      return response.data;

    } catch (error: any) {
      this.logger.error(
        { 
          error, 
          workflowId, 
          options 
        }, 
        'Failed to list workflow executions from ExecutionService'
      );

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(`ExecutionService error: ${message}`);
      }

      throw error;
    }
  }

  /**
   * Health check for ExecutionService
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;

    } catch (error: any) {
      this.logger.warn(
        { error: error instanceof Error ? error.message : String(error) }, 
        'ExecutionService health check failed'
      );
      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): ExecutionServiceConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ExecutionServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update axios instance
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
    
    this.logger.info(
      { config: this.config }, 
      'ExecutionService configuration updated'
    );
  }
}