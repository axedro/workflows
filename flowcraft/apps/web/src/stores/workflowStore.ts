import { create } from 'zustand'
import { Workflow } from '@flowcraft/shared-types'
import { apiService, WorkflowListParams, WorkflowListResponse, CreateWorkflowData, UpdateWorkflowData, ValidationResult } from '../services/api'

interface WorkflowState {
  // State
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    total: number
    totalPages: number
    limit: number
  }
  filters: {
    status?: string
    search?: string
  }

  // Actions
  setWorkflows: (workflows: Workflow[]) => void
  setCurrentWorkflow: (workflow: Workflow | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (pagination: Partial<WorkflowState['pagination']>) => void
  setFilters: (filters: Partial<WorkflowState['filters']>) => void

  // API Actions
  fetchWorkflows: (params?: WorkflowListParams) => Promise<void>
  fetchWorkflow: (id: string) => Promise<void>
  createWorkflow: (data: CreateWorkflowData) => Promise<Workflow>
  updateWorkflow: (id: string, data: UpdateWorkflowData) => Promise<Workflow>
  deleteWorkflow: (id: string) => Promise<void>
  duplicateWorkflow: (id: string, name: string) => Promise<Workflow>
  validateWorkflow: (id: string, definition: any) => Promise<ValidationResult>
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
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
  setWorkflows: (workflows) => set({ workflows }),
  setCurrentWorkflow: (currentWorkflow) => set({ currentWorkflow }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  // API Actions
  fetchWorkflows: async (params = {}) => {
    try {
      set({ isLoading: true, error: null })
      const response: WorkflowListResponse = await apiService.getWorkflows(params)
      
      set({
        workflows: response.workflows,
        pagination: {
          page: response.page,
          total: response.total,
          totalPages: response.totalPages,
          limit: params.limit || 10,
        },
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch workflows',
        isLoading: false,
      })
    }
  },

  fetchWorkflow: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const workflow = await apiService.getWorkflow(id)
      set({ currentWorkflow: workflow, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch workflow',
        isLoading: false,
      })
    }
  },

  createWorkflow: async (data: CreateWorkflowData) => {
    try {
      set({ isLoading: true, error: null })
      const workflow = await apiService.createWorkflow(data)
      
      // Add to workflows list
      set((state) => ({
        workflows: [workflow, ...state.workflows],
        isLoading: false,
      }))
      
      return workflow
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create workflow',
        isLoading: false,
      })
      throw error
    }
  },

  updateWorkflow: async (id: string, data: UpdateWorkflowData) => {
    try {
      set({ isLoading: true, error: null })
      const workflow = await apiService.updateWorkflow(id, data)
      
      // Update in workflows list and current workflow
      set((state) => ({
        workflows: state.workflows.map(w => w.id === id ? workflow : w),
        currentWorkflow: state.currentWorkflow?.id === id ? workflow : state.currentWorkflow,
        isLoading: false,
      }))
      
      return workflow
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update workflow',
        isLoading: false,
      })
      throw error
    }
  },

  deleteWorkflow: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await apiService.deleteWorkflow(id)
      
      // Remove from workflows list and clear current if it's the deleted one
      set((state) => ({
        workflows: state.workflows.filter(w => w.id !== id),
        currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete workflow',
        isLoading: false,
      })
      throw error
    }
  },

  duplicateWorkflow: async (id: string, name: string) => {
    try {
      set({ isLoading: true, error: null })
      const workflow = await apiService.duplicateWorkflow(id, name)
      
      // Add to workflows list
      set((state) => ({
        workflows: [workflow, ...state.workflows],
        isLoading: false,
      }))
      
      return workflow
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate workflow',
        isLoading: false,
      })
      throw error
    }
  },

  validateWorkflow: async (id: string, definition: any) => {
    try {
      set({ error: null })
      const validation = await apiService.validateWorkflow(id, definition)
      return validation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to validate workflow',
      })
      throw error
    }
  },
})) 