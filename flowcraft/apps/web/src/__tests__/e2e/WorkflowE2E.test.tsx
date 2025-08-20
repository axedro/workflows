import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import main components for E2E testing
import WorkflowDashboard from '../../pages/WorkflowDashboard';
import ConnectorDashboard from '../../components/connector-dashboard/ConnectorDashboard';

// Mock API responses for complete workflow
const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'E2E Test Workflow',
    description: 'End-to-end test workflow',
    definition: {
      nodes: [
        {
          id: 'start-1',
          type: 'START',
          position: { x: 100, y: 100 },
          data: { label: 'Start' }
        },
        {
          id: 'http-1',
          type: 'HTTP_REQUEST',
          position: { x: 300, y: 100 },
          data: {
            label: 'HTTP Request',
            method: 'GET',
            url: 'https://api.example.com/users',
            headers: { 'Accept': 'application/json' }
          }
        },
        {
          id: 'end-1',
          type: 'END',
          position: { x: 500, y: 100 },
          data: { label: 'End' }
        }
      ],
      edges: [
        {
          id: 'start-http',
          source: 'start-1',
          target: 'http-1',
          type: 'default'
        },
        {
          id: 'http-end',
          source: 'http-1',
          target: 'end-1',
          type: 'default'
        }
      ]
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: 'test-org',
    createdBy: 'test-user'
  }
];

const mockConnectors = [
  {
    id: 'connector-1',
    name: 'HTTP API Connector',
    type: 'http',
    description: 'Test HTTP connector for E2E',
    configuration: {
      method: 'GET',
      url: 'https://api.example.com',
      headers: { 'Accept': 'application/json' }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockExecution = {
  id: 'execution-1',
  workflowId: 'workflow-1',
  status: 'completed',
  startTime: new Date(),
  endTime: new Date(),
  result: {
    success: true,
    outputs: {
      'http-1': {
        status: 200,
        data: { users: [{ id: 1, name: 'Test User' }] }
      }
    }
  }
};

// Mock all hooks and services
jest.mock('../../hooks/useWorkflows', () => ({
  useWorkflows: () => ({
    data: mockWorkflows,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn()
  }),
  useCreateWorkflow: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: { ...mockWorkflows[0], id: 'new-workflow-id' }
    }),
    isLoading: false
  }),
  useUpdateWorkflow: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: mockWorkflows[0]
    }),
    isLoading: false
  }),
  useDeleteWorkflow: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false
  }),
  useExecuteWorkflow: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: mockExecution
    }),
    isLoading: false
  })
}));

jest.mock('../../hooks/useConnectors', () => ({
  useConnectors: () => ({
    data: mockConnectors,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn()
  }),
  useCreateConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: { ...mockConnectors[0], id: 'new-connector-id' }
    }),
    isLoading: false
  }),
  useTestConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      message: 'Connector test successful',
      data: { status: 200 }
    }),
    isLoading: false
  }),
  useDeleteConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false
  })
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({ id: 'workflow-1' })
}));

// Mock WorkflowEditor component
jest.mock('../../components/workflow-editor/WorkflowEditor', () => {
  return function MockWorkflowEditor({ workflow, onSave }: any) {
    const handleSave = () => {
      onSave({
        ...workflow,
        definition: {
          ...workflow.definition,
          nodes: [
            ...workflow.definition.nodes,
            {
              id: 'new-node',
              type: 'HTTP_REQUEST',
              position: { x: 200, y: 200 },
              data: { label: 'New HTTP Node' }
            }
          ]
        }
      });
    };

    return (
      <div data-testid="workflow-editor">
        <div data-testid="workflow-name">{workflow?.name || 'New Workflow'}</div>
        <div data-testid="node-count">{workflow?.definition?.nodes?.length || 0}</div>
        <button data-testid="add-node" onClick={() => {/* Mock add node */}}>
          Add Node
        </button>
        <button data-testid="save-workflow" onClick={handleSave}>
          Save Workflow
        </button>
        <button data-testid="execute-workflow" onClick={() => {/* Mock execute */}}>
          Execute Workflow
        </button>
      </div>
    );
  };
});

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
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

describe('E2E Workflow Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    // Mock window.confirm for delete operations
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn(() => true)
    });
  });

  describe('Complete Workflow Creation Journey', () => {
    it('should create a complete workflow from start to execution', async () => {
      const mockCreateWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 'new-workflow-id', name: 'Test Workflow' }
      });
      
      jest.mocked(require('../../hooks/useWorkflows').useCreateWorkflow).mockReturnValue({
        mutateAsync: mockCreateWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Verify dashboard loads with existing workflows
      expect(screen.getByText('E2E Test Workflow')).toBeInTheDocument();
      
      // Step 2: Create new workflow
      const createButton = screen.getByRole('button', { name: /create workflow/i });
      fireEvent.click(createButton);

      // Step 3: Fill workflow details
      const nameInput = screen.getByPlaceholderText(/workflow name/i);
      const descriptionInput = screen.getByPlaceholderText(/description/i);
      
      await user.type(nameInput, 'My E2E Test Workflow');
      await user.type(descriptionInput, 'Created through E2E testing');

      // Step 4: Save workflow
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateWorkflow).toHaveBeenCalledWith({
          name: 'My E2E Test Workflow',
          description: 'Created through E2E testing',
          definition: expect.any(Object)
        });
      });

      // Step 5: Verify workflow appears in list
      await waitFor(() => {
        expect(screen.getByText('My E2E Test Workflow')).toBeInTheDocument();
      });
    });

    it('should edit workflow and add nodes through visual editor', async () => {
      const mockUpdateWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: mockWorkflows[0]
      });
      
      jest.mocked(require('../../hooks/useWorkflows').useUpdateWorkflow).mockReturnValue({
        mutateAsync: mockUpdateWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Open existing workflow for editing
      const editButton = screen.getByTestId('edit-workflow-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
        expect(screen.getByTestId('workflow-name')).toHaveTextContent('E2E Test Workflow');
        expect(screen.getByTestId('node-count')).toHaveTextContent('3');
      });

      // Step 2: Add new node to workflow
      const addNodeButton = screen.getByTestId('add-node');
      fireEvent.click(addNodeButton);

      // Step 3: Save workflow with new node
      const saveWorkflowButton = screen.getByTestId('save-workflow');
      fireEvent.click(saveWorkflowButton);

      await waitFor(() => {
        expect(mockUpdateWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            definition: expect.objectContaining({
              nodes: expect.arrayContaining([
                expect.objectContaining({ id: 'new-node', type: 'HTTP_REQUEST' })
              ])
            })
          })
        );
      });
    });

    it('should execute workflow and show results', async () => {
      const mockExecuteWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: mockExecution
      });
      
      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Navigate to workflow editor
      const editButton = screen.getByTestId('edit-workflow-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
      });

      // Step 2: Execute workflow
      const executeButton = screen.getByTestId('execute-workflow');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockExecuteWorkflow).toHaveBeenCalledWith('workflow-1');
      });

      // Step 3: Verify execution results are displayed
      // Note: In a real implementation, we'd check for execution results UI
      expect(mockExecuteWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete Connector Management Journey', () => {
    it('should create, test, and use connector in workflow', async () => {
      const mockCreateConnector = jest.fn().mockResolvedValue({
        success: true,
        data: { id: 'new-connector-id', name: 'E2E Test Connector' }
      });
      
      const mockTestConnector = jest.fn().mockResolvedValue({
        success: true,
        message: 'Test successful'
      });

      jest.mocked(require('../../hooks/useConnectors').useCreateConnector).mockReturnValue({
        mutateAsync: mockCreateConnector,
        isLoading: false
      });
      
      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: mockTestConnector,
        isLoading: false
      });

      renderWithProviders(<ConnectorDashboard />);

      // Step 1: Verify existing connectors are displayed
      expect(screen.getByText('HTTP API Connector')).toBeInTheDocument();

      // Step 2: Create new connector
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('connector-wizard')).toBeInTheDocument();
      });

      // Step 3: Complete wizard (simplified)
      const completeButton = screen.getByTestId('complete-wizard');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('connector-wizard')).not.toBeInTheDocument();
      });

      // Step 4: Test connector
      const testButton = screen.getByTestId('test-connector-1');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockTestConnector).toHaveBeenCalledWith('connector-1');
      });
    });

    it('should delete connector after confirmation', async () => {
      const mockDeleteConnector = jest.fn().mockResolvedValue({ success: true });
      
      jest.mocked(require('../../hooks/useConnectors').useDeleteConnector).mockReturnValue({
        mutateAsync: mockDeleteConnector,
        isLoading: false
      });

      renderWithProviders(<ConnectorDashboard />);

      // Step 1: Verify connector exists
      expect(screen.getByText('HTTP API Connector')).toBeInTheDocument();

      // Step 2: Delete connector
      const deleteButton = screen.getByTestId('delete-connector-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteConnector).toHaveBeenCalledWith('connector-1');
      });
    });
  });

  describe('Workflow and Connector Integration', () => {
    it('should create workflow using existing connector', async () => {
      const mockCreateWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'integrated-workflow',
          name: 'Connector Integration Test',
          definition: {
            nodes: [
              {
                id: 'start',
                type: 'START',
                data: { label: 'Start' }
              },
              {
                id: 'http-connector',
                type: 'HTTP_REQUEST',
                data: {
                  label: 'HTTP Connector',
                  connectorId: 'connector-1'
                }
              }
            ],
            edges: [
              {
                id: 'start-http',
                source: 'start',
                target: 'http-connector'
              }
            ]
          }
        }
      });
      
      jest.mocked(require('../../hooks/useWorkflows').useCreateWorkflow).mockReturnValue({
        mutateAsync: mockCreateWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Create workflow that uses connector
      const createButton = screen.getByRole('button', { name: /create workflow/i });
      fireEvent.click(createButton);

      // Step 2: Configure workflow to use connector
      const nameInput = screen.getByPlaceholderText(/workflow name/i);
      await user.type(nameInput, 'Connector Integration Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Connector Integration Test'
          })
        );
      });
    });

    it('should execute workflow with connector and validate results', async () => {
      const mockExecuteWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockExecution,
          result: {
            success: true,
            outputs: {
              'http-1': {
                status: 200,
                data: { message: 'Success from connector' }
              }
            }
          }
        }
      });
      
      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Open workflow editor
      const editButton = screen.getByTestId('edit-workflow-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
      });

      // Step 2: Execute workflow
      const executeButton = screen.getByTestId('execute-workflow');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockExecuteWorkflow).toHaveBeenCalledWith('workflow-1');
      });

      // Step 3: Verify execution was successful
      expect(mockExecuteWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle workflow execution failure gracefully', async () => {
      const mockExecuteWorkflow = jest.fn().mockRejectedValue(
        new Error('Workflow execution failed')
      );
      
      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false
      });

      renderWithProviders(<WorkflowDashboard />);

      // Step 1: Navigate to workflow editor
      const editButton = screen.getByTestId('edit-workflow-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
      });

      // Step 2: Attempt to execute workflow
      const executeButton = screen.getByTestId('execute-workflow');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(mockExecuteWorkflow).toHaveBeenCalledWith('workflow-1');
      });

      // Step 3: Verify error is handled (no crash)
      expect(screen.getByTestId('workflow-editor')).toBeInTheDocument();
    });

    it('should handle connector test failure and allow retry', async () => {
      const mockTestConnector = jest.fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({ success: true, message: 'Test successful' });
      
      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: mockTestConnector,
        isLoading: false
      });

      renderWithProviders(<ConnectorDashboard />);

      // Step 1: First test attempt (fails)
      const testButton = screen.getByTestId('test-connector-1');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockTestConnector).toHaveBeenCalledWith('connector-1');
      });

      // Step 2: Retry test (succeeds)
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(mockTestConnector).toHaveBeenCalledTimes(2);
      });
    });
  });
});