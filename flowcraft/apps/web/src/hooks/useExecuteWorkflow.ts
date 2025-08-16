import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api.js';

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

export const useExecuteWorkflow = () => {
  return useMutation({
    mutationFn: async (request: ExecuteWorkflowRequest): Promise<ExecuteWorkflowResponse> => {
      const response = await apiService.executeWorkflow(request.workflowId, request.userId, request.input);
      return response;
    },
    onSuccess: (data) => {
      console.log('Workflow execution started:', data);
    },
    onError: (error) => {
      console.error('Workflow execution failed:', error);
    }
  });
};
