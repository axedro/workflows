import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.js';

export interface ExecutionStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  progress: number;
  currentNode?: string;
  error?: string;
  logs: ExecutionLog[];
  // Nuevos campos para datos detallados
  summary?: Record<string, any>;
  dataFlow?: Record<string, any>;
  nodes?: Array<{
    id: string;
    nodeId: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    errorDetails?: string;
    performance?: Record<string, any>;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  nodeId?: string;
}

export const useExecutionStatus = (executionId: string | null) => {
  return useQuery({
    queryKey: ['execution', executionId],
    queryFn: async (): Promise<ExecutionStatus> => {
      if (!executionId) {
        throw new Error('Execution ID is required');
      }
      return apiService.getExecutionStatus(executionId);
    },
    enabled: !!executionId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if execution is running
      if (data?.status === 'RUNNING' || data?.status === 'PENDING') {
        return 2000;
      }
      // Stop polling if completed, failed, or cancelled
      return false;
    },
    refetchIntervalInBackground: false,
    staleTime: 0, // Always consider data stale to get fresh updates
    retry: (failureCount, _error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
