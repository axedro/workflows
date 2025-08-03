import { User, Workflow, WorkflowTemplate } from '@flowcraft/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

// Workflow interfaces
export interface CreateWorkflowData {
  name: string;
  description?: string;
  definition: any;
  organizationId?: string;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  definition?: any;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

export interface WorkflowListParams {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  search?: string;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WorkflowVersion {
  id: string;
  versionNumber: number;
  definition: any;
  changelog?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateVersionData {
  definition: any;
  changelog?: string;
}

// Template interfaces
export interface CreateTemplateData {
  name: string;
  description?: string;
  category: string;
  definition: any;
  isPublic?: boolean;
  organizationId?: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: string;
  definition?: any;
  isPublic?: boolean;
}

export interface TemplateListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isPublic?: boolean;
}

export interface TemplateListResponse {
  templates: WorkflowTemplate[];
  total: number;
  page: number;
  totalPages: number;
}

// Import/Export interfaces
export interface ExportWorkflowOptions {
  includeVersions?: boolean;
  includeExecutions?: boolean;
}

export interface ImportWorkflowData {
  name: string;
  description?: string;
  definition: any;
  organizationId?: string;
  overwrite?: boolean;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  results: Array<{
    name: string;
    success: boolean;
    id?: string;
    error?: string;
  }>;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    type: string;
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
    field?: string;
  }>;
  warnings: Array<{
    type: string;
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
    field?: string;
  }>;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('accessToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Authentication endpoints
  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse['tokens']> {
    return this.request<AuthResponse['tokens']>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Organization endpoints
  async getCurrentOrganization(): Promise<any> {
    return this.request<any>('/organizations/me');
  }

  async updateOrganization(data: {
    name?: string;
    settings?: any;
  }): Promise<any> {
    return this.request<any>('/organizations/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Workflow endpoints
  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    return this.request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflows(
    params: WorkflowListParams = {}
  ): Promise<WorkflowListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return this.request<WorkflowListResponse>(
      `/workflows${query ? `?${query}` : ''}`
    );
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}`);
  }

  async updateWorkflow(
    id: string,
    data: UpdateWorkflowData
  ): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.request<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateWorkflow(id: string, name: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async createWorkflowVersion(
    id: string,
    data: CreateVersionData
  ): Promise<WorkflowVersion> {
    return this.request<WorkflowVersion>(`/workflows/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowVersion(
    id: string,
    version: number
  ): Promise<WorkflowVersion> {
    return this.request<WorkflowVersion>(
      `/workflows/${id}/versions/${version}`
    );
  }

  async validateWorkflow(
    id: string,
    definition: any
  ): Promise<ValidationResult> {
    return this.request<ValidationResult>(`/workflows/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ definition }),
    });
  }

  // Template endpoints
  async createTemplate(data: CreateTemplateData): Promise<WorkflowTemplate> {
    return this.request<WorkflowTemplate>('/workflow-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTemplates(
    params: TemplateListParams = {}
  ): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    if (params.isPublic !== undefined)
      searchParams.append('isPublic', params.isPublic.toString());

    const query = searchParams.toString();
    return this.request<TemplateListResponse>(
      `/workflow-templates${query ? `?${query}` : ''}`
    );
  }

  async getPublicTemplates(
    params: Omit<TemplateListParams, 'isPublic'> = {}
  ): Promise<TemplateListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return this.request<TemplateListResponse>(
      `/workflow-templates/public${query ? `?${query}` : ''}`
    );
  }

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    return this.request<WorkflowTemplate>(`/workflow-templates/${id}`);
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateData
  ): Promise<WorkflowTemplate> {
    return this.request<WorkflowTemplate>(`/workflow-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.request<void>(`/workflow-templates/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateTemplate(id: string, name: string): Promise<WorkflowTemplate> {
    return this.request<WorkflowTemplate>(
      `/workflow-templates/${id}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      }
    );
  }

  async getTemplateCategories(): Promise<string[]> {
    return this.request<string[]>('/workflow-templates/categories');
  }

  async validateTemplate(
    id: string,
    definition: any
  ): Promise<ValidationResult> {
    return this.request<ValidationResult>(
      `/workflow-templates/${id}/validate`,
      {
        method: 'POST',
        body: JSON.stringify({ definition }),
      }
    );
  }

  // Import/Export endpoints
  async exportWorkflow(
    id: string,
    options: ExportWorkflowOptions = {}
  ): Promise<any> {
    return this.request<any>(`/import-export/workflows/${id}/export`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async importWorkflow(data: ImportWorkflowData): Promise<Workflow> {
    return this.request<Workflow>('/import-export/workflows/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportTemplate(id: string): Promise<any> {
    return this.request<any>(`/import-export/workflow-templates/${id}/export`, {
      method: 'POST',
    });
  }

  async importTemplate(
    data: CreateTemplateData & { overwrite?: boolean }
  ): Promise<WorkflowTemplate> {
    return this.request<WorkflowTemplate>(
      '/import-export/workflow-templates/import',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async bulkExportWorkflows(
    workflowIds: string[],
    options: ExportWorkflowOptions = {}
  ): Promise<any> {
    return this.request<any>('/import-export/workflows/bulk-export', {
      method: 'POST',
      body: JSON.stringify({ workflowIds, ...options }),
    });
  }

  async bulkImportWorkflows(
    workflows: ImportWorkflowData[],
    overwrite: boolean = false
  ): Promise<BulkImportResult> {
    return this.request<BulkImportResult>(
      '/import-export/workflows/bulk-import',
      {
        method: 'POST',
        body: JSON.stringify({ workflows, overwrite }),
      }
    );
  }
}

export const apiService = new ApiService();
