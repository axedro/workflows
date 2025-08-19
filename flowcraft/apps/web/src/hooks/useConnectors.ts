import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

export interface Connector {
  id: string;
  name: string;
  type: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
  description?: string;
  configuration: Record<string, any>;
  isActive: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
}

export interface ConnectorStats {
  total: number;
  active: number;
  inactive: number;
  byType: Record<string, number>;
}

export const useConnectors = (filters: ConnectorFilters = {}) => {
  return useQuery({
    queryKey: ['connectors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);

      const response = await apiService.get(`/api/connectors?${params.toString()}`);
      return response.data as Connector[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConnectorStats = () => {
  return useQuery({
    queryKey: ['connector-stats'],
    queryFn: async () => {
      const connectors = await apiService.get('/api/connectors');
      const data = connectors.data as Connector[];
      
      const stats: ConnectorStats = {
        total: data.length,
        active: data.filter(c => c.isActive).length,
        inactive: data.filter(c => !c.isActive).length,
        byType: data.reduce((acc, connector) => {
          acc[connector.type] = (acc[connector.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
      
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConnector = (id: string) => {
  return useQuery({
    queryKey: ['connector', id],
    queryFn: async () => {
      const response = await apiService.get(`/api/connectors/${id}`);
      return response.data as Connector;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations
export const useCreateConnector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Connector, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => {
      const response = await apiService.request({
        method: 'POST',
        url: '/api/connectors',
        data,
      });
      return response.data as Connector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['connector-stats'] });
    },
  });
};

export const useUpdateConnector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Connector> }) => {
      const response = await apiService.request({
        method: 'PUT',
        url: `/api/connectors/${id}`,
        data,
      });
      return response.data as Connector;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['connector', id] });
      queryClient.invalidateQueries({ queryKey: ['connector-stats'] });
    },
  });
};

export const useDeleteConnector = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiService.request({
        method: 'DELETE',
        url: `/api/connectors/${id}`,
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['connector-stats'] });
    },
  });
};

export const useTestConnector = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.request({
        method: 'POST',
        url: `/api/connectors/${id}/test`,
      });
      return response.data as { success: boolean; message: string; details?: any };
    },
  });
};

// Template hooks
export const useTemplates = () => {
  return useQuery({
    queryKey: ['connector-templates'],
    queryFn: async () => {
      const response = await apiService.get('/api/connector-templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ['connector-template', id],
    queryFn: async () => {
      const response = await apiService.get(`/api/connector-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 