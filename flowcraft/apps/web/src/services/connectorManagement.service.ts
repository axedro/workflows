import { apiService } from './api';

export interface Connector {
  id: string;
  name: string;
  description?: string;
  type: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
  configuration: Record<string, any>;
  credentials?: ConnectorCredential;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'pending';
  testResult?: string;
}

export interface ConnectorCredential {
  id: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token';
  data: Record<string, any>;
  expiresAt?: string;
  isEncrypted: boolean;
}

export interface ConnectorTemplate {
  id: string;
  name: string;
  description: string;
  type: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
  category: string;
  configuration: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorStats {
  total: number;
  active: number;
  byType: Record<string, number>;
  recentActivity: number;
  healthStatus: {
    healthy: number;
    warning: number;
    error: number;
  };
}

export interface TemplateStats {
  total: number;
  public: number;
  private: number;
  byCategory: Record<string, number>;
  popular: ConnectorTemplate[];
}

export interface ConnectorFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
  category?: string;
}

// Connector Management
export const connectorManagementService = {
  // Get all connectors
  getConnectors: async (filters?: ConnectorFilters): Promise<Connector[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);

    const response = await apiService.request({
      method: 'GET',
      url: `/api/connectors?${params.toString()}`,
    });
    return response.data;
  },

  // Get single connector
  getConnector: async (id: string): Promise<Connector> => {
    const response = await apiService.request({
      method: 'GET',
      url: `/api/connectors/${id}`,
    });
    return response.data;
  },

  // Create connector
  createConnector: async (data: Omit<Connector, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Connector> => {
    const response = await apiService.request({
      method: 'POST',
      url: '/api/connectors',
      data: JSON.stringify(data),
    });
    return response.data;
  },

  // Update connector
  updateConnector: async (id: string, data: Partial<Connector>): Promise<Connector> => {
    const response = await apiService.request({
      method: 'PUT',
      url: `/api/connectors/${id}`,
      data: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete connector
  deleteConnector: async (id: string): Promise<void> => {
    await apiService.request({
      method: 'DELETE',
      url: `/api/connectors/${id}`,
    });
  },

  // Test connector
  testConnector: async (id: string): Promise<{ success: boolean; message: string; details?: any }> => {
    const response = await apiService.request({
      method: 'POST',
      url: `/api/connectors/${id}/test`,
    });
    return response.data;
  },

  // Get connector stats
  getConnectorStats: async (): Promise<ConnectorStats> => {
    const response = await apiService.request({
      method: 'GET',
      url: '/api/connectors/stats',
    });
    return response.data;
  },

  // Get connector logs
  getConnectorLogs: async (id: string, limit = 50): Promise<any[]> => {
    const response = await apiService.request({
      method: 'GET',
      url: `/api/connectors/${id}/logs?limit=${limit}`,
    });
    return response.data;
  },
};

// Template Management
export const connectorTemplateService = {
  // Get all templates
  getTemplates: async (filters?: { category?: string; isPublic?: boolean }): Promise<ConnectorTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());

    const response = await apiService.request({
      method: 'GET',
      url: `/api/connector-templates?${params.toString()}`,
    });
    return response.data;
  },

  // Get single template
  getTemplate: async (id: string): Promise<ConnectorTemplate> => {
    const response = await apiService.request({
      method: 'GET',
      url: `/api/connector-templates/${id}`,
    });
    return response.data;
  },

  // Create template
  createTemplate: async (data: Omit<ConnectorTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ConnectorTemplate> => {
    const response = await apiService.request({
      method: 'POST',
      url: '/api/connector-templates',
      data: JSON.stringify(data),
    });
    return response.data;
  },

  // Update template
  updateTemplate: async (id: string, data: Partial<ConnectorTemplate>): Promise<ConnectorTemplate> => {
    const response = await apiService.request({
      method: 'PUT',
      url: `/api/connector-templates/${id}`,
      data: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete template
  deleteTemplate: async (id: string): Promise<void> => {
    await apiService.request({
      method: 'DELETE',
      url: `/api/connector-templates/${id}`,
    });
  },

  // Get template categories
  getTemplateCategories: async (): Promise<string[]> => {
    const response = await apiService.request({
      method: 'GET',
      url: '/api/connector-templates/categories',
    });
    return response.data;
  },

  // Get popular templates
  getPopularTemplates: async (limit = 10): Promise<ConnectorTemplate[]> => {
    const response = await apiService.request({
      method: 'GET',
      url: `/api/connector-templates/popular?limit=${limit}`,
    });
    return response.data;
  },

  // Get template stats
  getTemplateStats: async (): Promise<TemplateStats> => {
    const response = await apiService.request({
      method: 'GET',
      url: '/api/connector-templates/stats',
    });
    return response.data;
  },
}; 