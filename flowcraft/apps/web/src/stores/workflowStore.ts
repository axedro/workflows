import { create } from 'zustand'
import { Workflow } from '@flowcraft/shared-types'

interface WorkflowState {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  isLoading: boolean
  setWorkflows: (workflows: Workflow[]) => void
  setCurrentWorkflow: (workflow: Workflow | null) => void
  setLoading: (loading: boolean) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  setWorkflows: (workflows) => set({ workflows }),
  setCurrentWorkflow: (currentWorkflow) => set({ currentWorkflow }),
  setLoading: (isLoading) => set({ isLoading }),
})) 