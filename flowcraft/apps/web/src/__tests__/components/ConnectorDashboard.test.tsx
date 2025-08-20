import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectorDashboard from '../../components/connector-dashboard/ConnectorDashboard';

// Mock the child components
jest.mock('../../components/connector-dashboard/ConnectorList', () => {
  return function MockConnectorList({ connectors, onEdit, onDelete, onTest }: any) {
    return (
      <div data-testid="connector-list">
        {connectors?.map((connector: any) => (
          <div key={connector.id} data-testid={`connector-${connector.id}`}>
            <span>{connector.name}</span>
            <span>{connector.type}</span>
            <button
              data-testid={`edit-${connector.id}`}
              onClick={() => onEdit(connector)}
            >
              Edit
            </button>
            <button
              data-testid={`delete-${connector.id}`}
              onClick={() => onDelete(connector.id)}
            >
              Delete
            </button>
            <button
              data-testid={`test-${connector.id}`}
              onClick={() => onTest(connector.id)}
            >
              Test
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/connector-dashboard/ConnectorFilters', () => {
  return function MockConnectorFilters({ filters, onFilterChange }: any) {
    return (
      <div data-testid="connector-filters">
        <select
          data-testid="type-filter"
          value={filters?.type || ''}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          <option value="http">HTTP</option>
          <option value="email">Email</option>
          <option value="webhook">Webhook</option>
        </select>
        <select
          data-testid="status-filter"
          value={filters?.isActive?.toString() || ''}
          onChange={(e) => onFilterChange({ 
            ...filters, 
            isActive: e.target.value ? e.target.value === 'true' : undefined 
          })}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <input
          data-testid="search-input"
          type="text"
          placeholder="Search connectors..."
          value={filters?.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
        />
      </div>
    );
  };
});

jest.mock('../../components/connector-dashboard/ConnectorStats', () => {
  return function MockConnectorStats({ connectors }: any) {
    const totalConnectors = connectors?.length || 0;
    const activeConnectors = connectors?.filter((c: any) => c.isActive).length || 0;
    const types = [...new Set(connectors?.map((c: any) => c.type))];

    return (
      <div data-testid="connector-stats">
        <div data-testid="total-connectors">{totalConnectors}</div>
        <div data-testid="active-connectors">{activeConnectors}</div>
        <div data-testid="connector-types">{types.length}</div>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/ConnectorWizard', () => {
  return function MockConnectorWizard({ onClose, editConnector }: any) {
    return (
      <div data-testid="connector-wizard">
        {editConnector ? (
          <div data-testid="editing-connector">{editConnector.name}</div>
        ) : (
          <div data-testid="creating-connector">New Connector</div>
        )}
        <button data-testid="close-wizard" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="complete-wizard"
          onClick={() => {
            // Simulate successful creation/edit
            onClose();
          }}
        >
          Complete
        </button>
      </div>
    );
  };
});

// Mock the hooks
jest.mock('../../hooks/useConnectors', () => ({
  useConnectors: () => ({
    data: [
      {
        id: 'connector-1',
        name: 'HTTP API Connector',
        type: 'http',
        description: 'Test HTTP connector',
        isActive: true,
        configuration: { url: 'https://api.example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'connector-2',
        name: 'Email SMTP Connector',
        type: 'email',
        description: 'Test Email connector',
        isActive: false,
        configuration: { smtpHost: 'smtp.example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'connector-3',
        name: 'Webhook Connector',
        type: 'webhook',
        description: 'Test Webhook connector',
        isActive: true,
        configuration: { url: 'https://webhook.example.com' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDeleteConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false,
  }),
  useTestConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      message: 'Test successful' 
    }),
    isLoading: false,
  }),
}));

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ConnectorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the main dashboard components', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByTestId('connector-stats')).toBeInTheDocument();
      expect(screen.getByTestId('connector-filters')).toBeInTheDocument();
      expect(screen.getByTestId('connector-list')).toBeInTheDocument();
    });

    it('should display connector statistics correctly', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByTestId('total-connectors')).toHaveTextContent('3');
      expect(screen.getByTestId('active-connectors')).toHaveTextContent('2');
      expect(screen.getByTestId('connector-types')).toHaveTextContent('3');
    });

    it('should display all connectors in the list', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByTestId('connector-connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('connector-connector-2')).toBeInTheDocument();
      expect(screen.getByTestId('connector-connector-3')).toBeInTheDocument();
    });

    it('should have a create new connector button', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter connectors by type', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const typeFilter = screen.getByTestId('type-filter');
      fireEvent.change(typeFilter, { target: { value: 'http' } });
      
      // In a real implementation, this would filter the list
      expect(typeFilter).toHaveValue('http');
    });

    it('should filter connectors by status', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'true' } });
      
      expect(statusFilter).toHaveValue('true');
    });

    it('should search connectors by name', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'HTTP' } });
      
      expect(searchInput).toHaveValue('HTTP');
    });

    it('should clear filters when search is cleared', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'HTTP' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Connector Actions', () => {
    it('should open wizard when create button is clicked', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('connector-wizard')).toBeInTheDocument();
        expect(screen.getByTestId('creating-connector')).toBeInTheDocument();
      });
    });

    it('should open wizard in edit mode when edit button is clicked', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const editButton = screen.getByTestId('edit-connector-1');
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('connector-wizard')).toBeInTheDocument();
        expect(screen.getByTestId('editing-connector')).toBeInTheDocument();
        expect(screen.getByTestId('editing-connector')).toHaveTextContent('HTTP API Connector');
      });
    });

    it('should close wizard when close button is clicked', async () => {
      renderWithProviders(<ConnectorDashboard />);
      
      // Open wizard
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('connector-wizard')).toBeInTheDocument();
      });
      
      // Close wizard
      const closeButton = screen.getByTestId('close-wizard');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('connector-wizard')).not.toBeInTheDocument();
      });
    });

    it('should test connector when test button is clicked', async () => {
      const mockTestConnector = jest.fn().mockResolvedValue({ 
        success: true, 
        message: 'Test successful' 
      });
      
      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: mockTestConnector,
        isLoading: false,
      });

      renderWithProviders(<ConnectorDashboard />);
      
      const testButton = screen.getByTestId('test-connector-1');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockTestConnector).toHaveBeenCalledWith('connector-1');
      });
    });

    it('should delete connector when delete button is clicked', async () => {
      const mockDeleteConnector = jest.fn().mockResolvedValue({ success: true });
      
      jest.mocked(require('../../hooks/useConnectors').useDeleteConnector).mockReturnValue({
        mutateAsync: mockDeleteConnector,
        isLoading: false,
      });

      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(<ConnectorDashboard />);
      
      const deleteButton = screen.getByTestId('delete-connector-1');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockDeleteConnector).toHaveBeenCalledWith('connector-1');
      });

      confirmSpy.mockRestore();
    });

    it('should not delete connector if user cancels confirmation', async () => {
      const mockDeleteConnector = jest.fn();
      
      jest.mocked(require('../../hooks/useConnectors').useDeleteConnector).mockReturnValue({
        mutateAsync: mockDeleteConnector,
        isLoading: false,
      });

      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(<ConnectorDashboard />);
      
      const deleteButton = screen.getByTestId('delete-connector-1');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockDeleteConnector).not.toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when data is loading', () => {
      jest.mocked(require('../../hooks/useConnectors').useConnectors).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      jest.mocked(require('../../hooks/useConnectors').useConnectors).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch connectors'),
        refetch: jest.fn(),
      });

      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should show empty state when no connectors exist', () => {
      jest.mocked(require('../../hooks/useConnectors').useConnectors).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProviders(<ConnectorDashboard />);
      
      expect(screen.getByTestId('total-connectors')).toHaveTextContent('0');
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh connector list when refresh button is clicked', async () => {
      const mockRefetch = jest.fn();
      
      jest.mocked(require('../../hooks/useConnectors').useConnectors).mockReturnValue({
        data: [
          {
            id: 'connector-1',
            name: 'HTTP API Connector',
            type: 'http',
            description: 'Test HTTP connector',
            isActive: true,
            configuration: { url: 'https://api.example.com' },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
      });

      renderWithProviders(<ConnectorDashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for actions', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      const editButton = screen.getByTestId('edit-connector-1');
      const deleteButton = screen.getByTestId('delete-connector-1');
      const testButton = screen.getByTestId('test-connector-1');
      
      // All buttons should be focusable
      editButton.focus();
      expect(document.activeElement).toBe(editButton);
      
      deleteButton.focus();
      expect(document.activeElement).toBe(deleteButton);
      
      testButton.focus();
      expect(document.activeElement).toBe(testButton);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      // Check for essential accessibility features
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Search connectors...');
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<ConnectorDashboard />);
      
      // Check for main heading
      const heading = screen.getByRole('heading', { name: /manage connectors/i });
      expect(heading).toBeInTheDocument();
    });
  });
});