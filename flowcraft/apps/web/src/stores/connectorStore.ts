import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface Connector {
  id: string;
  name: string;
  description?: string;
  type: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
  configuration: Record<string, any>;
  credentials?: ConnectorCredential;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  testStatus?: 'success' | 'failed' | 'pending';
  testResult?: string;
}

export interface ConnectorCredential {
  id: string;
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'bearer_token';
  data: Record<string, any>;
  expiresAt?: Date;
  isEncrypted: boolean;
}

export interface ConnectorLog {
  id: string;
  connectorId: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
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
  createdAt: Date;
  updatedAt: Date;
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

// Store State
interface ConnectorState {
  // Data
  connectors: Connector[];
  templates: ConnectorTemplate[];
  stats: ConnectorStats | null;
  templateStats: TemplateStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedConnector: Connector | null;
  filters: {
    search: string;
    type: string;
    status: string;
    category: string;
  };
  viewMode: 'grid' | 'list';
  
  // Actions
  setConnectors: (connectors: Connector[]) => void;
  addConnector: (connector: Connector) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  deleteConnector: (id: string) => void;
  setTemplates: (templates: ConnectorTemplate[]) => void;
  setStats: (stats: ConnectorStats) => void;
  setTemplateStats: (stats: TemplateStats) => void;
  setSelectedConnector: (connector: Connector | null) => void;
  setFilters: (filters: Partial<ConnectorState['filters']>) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Initial State
const initialState = {
  connectors: [],
  templates: [],
  stats: null,
  templateStats: null,
  loading: false,
  error: null,
  selectedConnector: null,
  filters: {
    search: '',
    type: '',
    status: '',
    category: '',
  },
  viewMode: 'grid' as const,
};

// Store
export const useConnectorStore = create<ConnectorState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setConnectors: (connectors) => set({ connectors }),
      
      addConnector: (connector) => set((state) => ({
        connectors: [...state.connectors, connector],
      })),
      
      updateConnector: (id, updates) => set((state) => ({
        connectors: state.connectors.map((connector) =>
          connector.id === id ? { ...connector, ...updates } : connector
        ),
      })),
      
      deleteConnector: (id) => set((state) => ({
        connectors: state.connectors.filter((connector) => connector.id !== id),
      })),
      
      setTemplates: (templates) => set({ templates }),
      
      setStats: (stats) => set({ stats }),
      
      setTemplateStats: (templateStats) => set({ templateStats }),
      
      setSelectedConnector: (selectedConnector) => set({ selectedConnector }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      
      setViewMode: (viewMode) => set({ viewMode }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'connector-store',
    }
  )
);

// Selectors
export const useConnectorActions = () => {
  const store = useConnectorStore();
  return {
    setConnectors: store.setConnectors,
    addConnector: store.addConnector,
    updateConnector: store.updateConnector,
    deleteConnector: store.deleteConnector,
    setTemplates: store.setTemplates,
    setStats: store.setStats,
    setTemplateStats: store.setTemplateStats,
    setSelectedConnector: store.setSelectedConnector,
    setFilters: store.setFilters,
    setViewMode: store.setViewMode,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    reset: store.reset,
  };
};

export const useConnectorData = () => {
  const store = useConnectorStore();
  return {
    connectors: store.connectors,
    templates: store.templates,
    stats: store.stats,
    templateStats: store.templateStats,
    selectedConnector: store.selectedConnector,
    filters: store.filters,
    viewMode: store.viewMode,
  };
};

export const useConnectorUI = () => {
  const store = useConnectorStore();
  return {
    loading: store.loading,
    error: store.error,
  };
};
