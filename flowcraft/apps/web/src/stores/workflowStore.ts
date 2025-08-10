import { create } from 'zustand';
import { Workflow } from '@flowcraft/shared-types';
import {
  apiService,
  WorkflowListParams,
  WorkflowListResponse,
  CreateWorkflowData,
  UpdateWorkflowData,
  ValidationResult,
  NameAvailabilityResult,
  CheckNameParams,
} from '../services/api';
import { fixedApiService } from '../services/apiFixed';
import { useNotificationStore } from './notificationStore';

// Force reload - using updated apiService: 2025-08-09-09:13

interface WorkflowState {
  // State
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
  };
  filters: {
    status?: string;
    search?: string;
  };

  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<WorkflowState['pagination']>) => void;
  setFilters: (filters: Partial<WorkflowState['filters']>) => void;

  // API Actions
  fetchWorkflows: (params?: WorkflowListParams) => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (data: CreateWorkflowData) => Promise<Workflow>;
  updateWorkflow: (id: string, data: UpdateWorkflowData) => Promise<Workflow>;
  deleteWorkflow: (id: string) => Promise<void>;
  duplicateWorkflow: (id: string, name: string) => Promise<Workflow>;
  validateWorkflow: (id: string, definition: any) => Promise<ValidationResult>;
  checkWorkflowNameAvailability: (params: CheckNameParams) => Promise<NameAvailabilityResult>;
  toggleWorkflowStatus: (id: string, status: 'ACTIVE' | 'PAUSED') => Promise<Workflow>;
}

export const useWorkflowStore = create<WorkflowState>(set => ({
  // Initial state
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    total: 0,
    totalPages: 0,
    limit: 10,
  },
  filters: {},

  // State setters
  setWorkflows: workflows => set({ workflows }),
  setCurrentWorkflow: currentWorkflow => set({ currentWorkflow }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
  setPagination: pagination =>
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    })),
  setFilters: filters =>
    set(state => ({
      filters: { ...state.filters, ...filters },
    })),

  // API Actions
  fetchWorkflows: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response: WorkflowListResponse =
        await apiService.getWorkflows(params);

      set({
        workflows: response.workflows,
        pagination: {
          page: response.page,
          total: response.total,
          totalPages: response.totalPages,
          limit: params.limit || 10,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch workflows',
        isLoading: false,
      });
    }
  },

  fetchWorkflow: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const workflow = await apiService.getWorkflow(id);
      set({ currentWorkflow: workflow, isLoading: false });
    } catch (error) {
      console.error('Error fetching workflow:', error);
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch workflow',
        isLoading: false,
      });
    }
  },

  createWorkflow: async (data: CreateWorkflowData) => {
    try {
      set({ isLoading: true, error: null });
      const workflow = await apiService.createWorkflow(data);

      // Add to workflows list
      set(state => ({
        workflows: [workflow, ...state.workflows],
        isLoading: false,
      }));

      // Show success notification
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Workflow Created',
        message: `"${workflow.name}" has been created successfully.`,
      });

      return workflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workflow';
      set({
        error: errorMessage,
        isLoading: false,
      });
      
      // Show error notification
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Failed to Create Workflow',
        message: errorMessage,
      });
      
      throw error;
    }
  },

  updateWorkflow: async (id: string, data: UpdateWorkflowData) => {
    try {
      set({ isLoading: true, error: null });
      const workflow = await apiService.updateWorkflow(id, data);

      // Update in workflows list and current workflow
      set(state => ({
        workflows: state.workflows.map(w => (w.id === id ? workflow : w)),
        currentWorkflow:
          state.currentWorkflow?.id === id ? workflow : state.currentWorkflow,
        isLoading: false,
      }));

      return workflow;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to update workflow',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteWorkflow: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get workflow name before deletion for notification
      const workflowToDelete = useWorkflowStore.getState().workflows.find(w => w.id === id);
      
      console.log('🔥 DIRECT DELETE FIX - BYPASSING CACHE ISSUES');
      
      // DIRECT FIX: Handle DELETE requests with empty responses
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/workflows/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        }
      });
      
      console.log('📡 Direct DELETE response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Delete failed:', errorText);
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // ✅ SUCCESS: Don't try to parse JSON for DELETE operations
      console.log('✅ DELETE SUCCESS - No JSON parsing needed');
      
      // Continue with success handling...

      // Remove from workflows list and clear current if it's the deleted one
      set(state => ({
        workflows: state.workflows.filter(w => w.id !== id),
        currentWorkflow:
          state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        isLoading: false,
      }));

      // Show success notification
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Workflow Deleted',
        message: workflowToDelete ? `"${workflowToDelete.name}" has been deleted.` : 'Workflow has been deleted successfully.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workflow';
      set({
        error: errorMessage,
        isLoading: false,
      });
      
      // Show error notification
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Failed to Delete Workflow',
        message: errorMessage,
      });
      
      throw error;
    }
  },

  duplicateWorkflow: async (id: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      const workflow = await apiService.duplicateWorkflow(id, name);

      // Add to workflows list
      set(state => ({
        workflows: [workflow, ...state.workflows],
        isLoading: false,
      }));

      // Show success notification
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Workflow Duplicated',
        message: `"${workflow.name}" has been created as a copy.`,
      });

      return workflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate workflow';
      set({
        error: errorMessage,
        isLoading: false,
      });
      
      // Show error notification
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Failed to Duplicate Workflow',
        message: errorMessage,
      });
      
      throw error;
    }
  },

  validateWorkflow: async (id: string, definition: any) => {
    try {
      set({ error: null });
      const validation = await apiService.validateWorkflow(id, definition);
      return validation;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to validate workflow',
      });
      throw error;
    }
  },

  checkWorkflowNameAvailability: async (params: CheckNameParams) => {
    try {
      set({ error: null });
      const result = await apiService.checkWorkflowNameAvailability(params);
      return result;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check workflow name availability',
      });
      throw error;
    }
  },

  toggleWorkflowStatus: async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    try {
      set({ isLoading: true, error: null });
      
      // Get workflow name for notification
      const targetWorkflow = useWorkflowStore.getState().workflows.find(w => w.id === id);
      
      const workflow = await apiService.updateWorkflow(id, { status });

      // Update the workflow in the local state
      set(state => ({
        workflows: state.workflows.map(w =>
          w.id === id ? { ...w, status: workflow.status } : w
        ),
        isLoading: false,
      }));

      // Show success notification
      const statusText = status === 'ACTIVE' ? 'activated' : 'paused';
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: `Workflow ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
        message: targetWorkflow ? `"${targetWorkflow.name}" has been ${statusText}.` : `Workflow has been ${statusText}.`,
      });

      return workflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle workflow status';
      set({
        error: errorMessage,
        isLoading: false,
      });
      
      // Show error notification
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Failed to Update Status',
        message: errorMessage,
      });
      
      throw error;
    }
  },
}));
