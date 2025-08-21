import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectorIntegrationPanel } from '../../components/workflow-editor/panels/ConnectorIntegrationPanel';
import { NodeType } from '@flowcraft/shared-types';

// Mock the useConnectors hook
const mockConnectors = [
  {
    id: 'http-1',
    name: 'Test HTTP Connector',
    description: 'Test HTTP connector for testing',
    type: 'http',
    isActive: true,
    configuration: {
      method: 'POST',
      url: 'https://api.example.com/webhook',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    }
  },
  {
    id: 'email-1',
    name: 'Test Email Connector',
    description: 'Test email connector for testing',
    type: 'email',
    isActive: true,
    configuration: {
      to: ['test@example.com'],
      subject: 'Test Email',
      body: 'Test email body'
    }
  }
];

jest.mock('../../hooks/useConnectors', () => ({
  useConnectors: () => ({
    data: mockConnectors,
    isLoading: false,
    error: null,
  }),
  useConnector: (id: string) => ({
    data: mockConnectors.find(c => c.id === id),
    isLoading: false,
    error: null,
  }),
}));

describe('ConnectorIntegrationPanel - Enhanced Features', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      nodeType: NodeType.HTTP_REQUEST,
      onConnectorSelect: jest.fn(),
      onCreateConnector: jest.fn(),
      onEditConnector: jest.fn(),
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <ConnectorIntegrationPanel {...defaultProps} />
      </QueryClientProvider>
    );
  };

  test('shows connector data when connector is selected', async () => {
    const onConnectorSelect = jest.fn();
    renderComponent({ 
      nodeType: NodeType.HTTP_REQUEST,
      selectedConnectorId: 'http-1',
      onConnectorSelect 
    });
    
    expect(screen.getByText('Seleccionado')).toBeInTheDocument();
    expect(screen.getByText('Test HTTP Connector')).toBeInTheDocument();
  });

  test('filters connectors correctly by node type', () => {
    renderComponent({ nodeType: NodeType.HTTP_REQUEST });
    
    // Should show HTTP connector
    expect(screen.getByText('Test HTTP Connector')).toBeInTheDocument();
    // Should not show Email connector
    expect(screen.queryByText('Test Email Connector')).not.toBeInTheDocument();
  });

  test('shows empty state for incompatible node types', () => {
    // Mock empty connectors for this test
    jest.doMock('../../hooks/useConnectors', () => ({
      useConnectors: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    }));

    renderComponent({ nodeType: NodeType.WEBHOOK });
    
    expect(screen.getByText('No hay conectores compatibles con este tipo de nodo')).toBeInTheDocument();
    expect(screen.getByText('Crear Primer Conector')).toBeInTheDocument();
  });

  test('handles connector selection properly', () => {
    const onConnectorSelect = jest.fn();
    renderComponent({ 
      nodeType: NodeType.HTTP_REQUEST,
      onConnectorSelect 
    });
    
    fireEvent.click(screen.getByText('Test HTTP Connector'));
    
    expect(onConnectorSelect).toHaveBeenCalledWith('http-1');
  });

  test('shows loading state', () => {
    // Mock loading state
    jest.doMock('../../hooks/useConnectors', () => ({
      useConnectors: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
    }));

    renderComponent();
    
    expect(screen.getByText('Seleccionar Conector')).toBeInTheDocument();
    // Loading spinner should be visible
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('shows error state', () => {
    // Mock error state
    jest.doMock('../../hooks/useConnectors', () => ({
      useConnectors: () => ({
        data: null,
        isLoading: false,
        error: new Error('Failed to load connectors'),
      }),
    }));

    renderComponent();
    
    expect(screen.getByText('Error cargando conectores: Failed to load connectors')).toBeInTheDocument();
  });
});