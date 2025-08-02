import { create } from 'zustand'
import { WorkflowTemplate } from '@flowcraft/shared-types'
import { apiService, TemplateListParams, TemplateListResponse, CreateTemplateData, UpdateTemplateData, ValidationResult } from '../services/api'

interface TemplateState {
  // State
  templates: WorkflowTemplate[]
  currentTemplate: WorkflowTemplate | null
  publicTemplates: WorkflowTemplate[]
  categories: string[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    total: number
    totalPages: number
    limit: number
  }
  filters: {
    category?: string
    search?: string
    isPublic?: boolean
  }

  // Actions
  setTemplates: (templates: WorkflowTemplate[]) => void
  setCurrentTemplate: (template: WorkflowTemplate | null) => void
  setPublicTemplates: (templates: WorkflowTemplate[]) => void
  setCategories: (categories: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (pagination: Partial<TemplateState['pagination']>) => void
  setFilters: (filters: Partial<TemplateState['filters']>) => void

  // API Actions
  fetchTemplates: (params?: TemplateListParams) => Promise<void>
  fetchPublicTemplates: (params?: Omit<TemplateListParams, 'isPublic'>) => Promise<void>
  fetchTemplate: (id: string) => Promise<void>
  fetchCategories: () => Promise<void>
  createTemplate: (data: CreateTemplateData) => Promise<WorkflowTemplate>
  updateTemplate: (id: string, data: UpdateTemplateData) => Promise<WorkflowTemplate>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string, name: string) => Promise<WorkflowTemplate>
  validateTemplate: (id: string, definition: any) => Promise<ValidationResult>
}

export const useTemplateStore = create<TemplateState>((set) => ({
  // Initial state
  templates: [],
  currentTemplate: null,
  publicTemplates: [],
  categories: [],
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
  setTemplates: (templates) => set({ templates }),
  setCurrentTemplate: (currentTemplate) => set({ currentTemplate }),
  setPublicTemplates: (publicTemplates) => set({ publicTemplates }),
  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  // API Actions
  fetchTemplates: async (params = {}) => {
    try {
      set({ isLoading: true, error: null })
      const response: TemplateListResponse = await apiService.getTemplates(params)
      
      set({
        templates: response.templates,
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
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
        isLoading: false,
      })
    }
  },

  fetchPublicTemplates: async (params = {}) => {
    try {
      set({ isLoading: true, error: null })
      const response: TemplateListResponse = await apiService.getPublicTemplates(params)
      
      set({
        publicTemplates: response.templates,
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
        error: error instanceof Error ? error.message : 'Failed to fetch public templates',
        isLoading: false,
      })
    }
  },

  fetchTemplate: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const template = await apiService.getTemplate(id)
      set({ currentTemplate: template, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch template',
        isLoading: false,
      })
    }
  },

  fetchCategories: async () => {
    try {
      set({ error: null })
      const categories = await apiService.getTemplateCategories()
      set({ categories })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      })
    }
  },

  createTemplate: async (data: CreateTemplateData) => {
    try {
      set({ isLoading: true, error: null })
      const template = await apiService.createTemplate(data)
      
      // Add to templates list
      set((state) => ({
        templates: [template, ...state.templates],
        isLoading: false,
      }))
      
      return template
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create template',
        isLoading: false,
      })
      throw error
    }
  },

  updateTemplate: async (id: string, data: UpdateTemplateData) => {
    try {
      set({ isLoading: true, error: null })
      const template = await apiService.updateTemplate(id, data)
      
      // Update in templates list and current template
      set((state) => ({
        templates: state.templates.map(t => t.id === id ? template : t),
        currentTemplate: state.currentTemplate?.id === id ? template : state.currentTemplate,
        isLoading: false,
      }))
      
      return template
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update template',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await apiService.deleteTemplate(id)
      
      // Remove from templates list and clear current if it's the deleted one
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete template',
        isLoading: false,
      })
      throw error
    }
  },

  duplicateTemplate: async (id: string, name: string) => {
    try {
      set({ isLoading: true, error: null })
      const template = await apiService.duplicateTemplate(id, name)
      
      // Add to templates list
      set((state) => ({
        templates: [template, ...state.templates],
        isLoading: false,
      }))
      
      return template
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate template',
        isLoading: false,
      })
      throw error
    }
  },

  validateTemplate: async (id: string, definition: any) => {
    try {
      set({ error: null })
      const validation = await apiService.validateTemplate(id, definition)
      return validation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to validate template',
      })
      throw error
    }
  },
})) 