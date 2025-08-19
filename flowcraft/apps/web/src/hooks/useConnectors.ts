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
      const response = await apiService.getConnectors(filters);
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        return response as Connector[];
      }
      
      // If response has a data property (like { success: true, data: [...] })
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response.data as Connector[];
      }
      
      // Fallback to empty array
      console.warn('useConnectors: Unexpected response format:', response);
      return [] as Connector[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useConnectorStats = () => {
  return useQuery({
    queryKey: ['connector-stats'],
    queryFn: async () => {
      const response = await apiService.getConnectors();
      
      // Extract data from response if it has a data property
      let data = response;
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        data = response.data;
      }
      
      // Ensure data is an array
      const connectors = Array.isArray(data) ? data : [];
      
      const stats: ConnectorStats = {
        total: connectors.length,
        active: connectors.filter(c => c.isActive).length,
        inactive: connectors.filter(c => !c.isActive).length,
        byType: connectors.reduce((acc, connector) => {
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
      const response = await apiService.getConnector(id);
      
      // If response has a data property (like { success: true, data: {...} })
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as Connector;
      }
      
      // Otherwise return response directly
      return response as Connector;
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
      const response = await apiService.createConnector(data);
      return response as Connector;
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
      const response = await apiService.updateConnector(id, data);
      return response as Connector;
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
      await apiService.deleteConnector(id);
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
      const response = await apiService.testConnector(id);
      
      // If response has a data property (like { success: true, data: {...} })
      if (response && typeof response === 'object' && 'data' in response) {
        return response.data as { success: boolean; message: string; details?: any };
      }
      
      // Otherwise return response directly
      return response as { success: boolean; message: string; details?: any };
    },
  });
};

// Template hooks
export const useTemplates = () => {
  return useQuery({
    queryKey: ['connector-templates'],
    queryFn: async () => {
      const response = await apiService.request('/api/connector-templates');
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTemplate = (id: string) => {
  return useQuery({
    queryKey: ['connector-template', id],
    queryFn: async () => {
      const response = await apiService.request(`/api/connector-templates/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 