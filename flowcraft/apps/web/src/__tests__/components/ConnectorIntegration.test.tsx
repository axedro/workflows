import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectorIntegrationPanel } from '../../components/workflow-editor/panels/ConnectorIntegrationPanel';
import { NodeType } from '@flowcraft/shared-types';

// Mock the useConnectors hook
jest.mock('../../hooks/useConnectors', () => ({
  useConnectors: () => ({
    data: [
      {
        id: '1',
        name: 'Test HTTP Connector',
        description: 'Test HTTP connector for testing',
        type: 'http',
        isActive: true,
      },
      {
        id: '2',
        name: 'Test Email Connector',
        description: 'Test email connector for testing',
        type: 'email',
        isActive: true,
      }
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('ConnectorIntegrationPanel', () => {
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

  test('renders connector selection panel', () => {
    renderComponent();
    
    expect(screen.getByText('Seleccionar Conector')).toBeInTheDocument();
    expect(screen.getByText('Test HTTP Connector')).toBeInTheDocument();
  });

  test('shows only compatible connectors for node type', () => {
    renderComponent({ nodeType: NodeType.HTTP_REQUEST });
    
    expect(screen.getByText('Test HTTP Connector')).toBeInTheDocument();
    expect(screen.queryByText('Test Email Connector')).not.toBeInTheDocument();
  });

  test('calls onConnectorSelect when connector is clicked', () => {
    const onConnectorSelect = jest.fn();
    renderComponent({ onConnectorSelect });
    
    fireEvent.click(screen.getByText('Test HTTP Connector'));
    
    expect(onConnectorSelect).toHaveBeenCalledWith('1');
  });

  test('calls onCreateConnector when new connector button is clicked', () => {
    const onCreateConnector = jest.fn();
    renderComponent({ onCreateConnector });
    
    fireEvent.click(screen.getByText('Nuevo'));
    
    expect(onCreateConnector).toHaveBeenCalled();
  });

  test('displays selected connector', () => {
    renderComponent({ selectedConnectorId: '1' });
    
    expect(screen.getByText('Seleccionado')).toBeInTheDocument();
  });

  test('shows empty state when no compatible connectors', () => {
    // Mock empty connectors
    jest.doMock('../../hooks/useConnectors', () => ({
      useConnectors: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    }));

    renderComponent({ nodeType: NodeType.WEBHOOK });
    
    expect(screen.getByText('No hay conectores compatibles con este tipo de nodo')).toBeInTheDocument();
  });
});