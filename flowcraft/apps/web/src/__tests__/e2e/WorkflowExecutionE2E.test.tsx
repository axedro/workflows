import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock workflow execution engine components
const mockWorkflow = {
  id: 'execution-test-workflow',
  name: 'Execution E2E Test Workflow',
  description: 'Workflow for testing execution flow',
  definition: {
    nodes: [
      {
        id: 'start-node',
        type: 'START',
        position: { x: 100, y: 100 },
        data: {
          label: 'Start',
          outputs: {
            trigger: { type: 'object' }
          }
        }
      },
      {
        id: 'http-node',
        type: 'HTTP_REQUEST',
        position: { x: 300, y: 100 },
        data: {
          label: 'Fetch Users',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users',
          headers: { 'Accept': 'application/json' },
          outputs: {
            response: { type: 'object' },
            status: { type: 'number' }
          }
        }
      },
      {
        id: 'condition-node',
        type: 'CONDITION',
        position: { x: 500, y: 100 },
        data: {
          label: 'Check Status',
          condition: 'response.status === 200',
          outputs: {
            true: { type: 'object' },
            false: { type: 'object' }
          }
        }
      },
      {
        id: 'transform-node',
        type: 'DATA_TRANSFORM',
        position: { x: 700, y: 50 },
        data: {
          label: 'Extract Names',
          transformations: [
            {
              field: 'userNames',
              expression: 'response.data.map(user => user.name)'
            }
          ],
          outputs: {
            result: { type: 'object' }
          }
        }
      },
      {
        id: 'email-node',
        type: 'EMAIL',
        position: { x: 700, y: 150 },
        data: {
          label: 'Send Error Email',
          to: 'admin@example.com',
          subject: 'API Request Failed',
          body: 'The API request failed with status: {{response.status}}',
          outputs: {
            sent: { type: 'boolean' }
          }
        }
      },
      {
        id: 'end-success',
        type: 'END',
        position: { x: 900, y: 50 },
        data: {
          label: 'Success End',
          outputs: {}
        }
      },
      {
        id: 'end-error',
        type: 'END',
        position: { x: 900, y: 150 },
        data: {
          label: 'Error End',
          outputs: {}
        }
      }
    ],
    edges: [
      {
        id: 'start-to-http',
        source: 'start-node',
        target: 'http-node',
        sourceHandle: 'trigger',
        targetHandle: 'input'
      },
      {
        id: 'http-to-condition',
        source: 'http-node',
        target: 'condition-node',
        sourceHandle: 'response',
        targetHandle: 'input'
      },
      {
        id: 'condition-to-transform',
        source: 'condition-node',
        target: 'transform-node',
        sourceHandle: 'true',
        targetHandle: 'input'
      },
      {
        id: 'condition-to-email',
        source: 'condition-node',
        target: 'email-node',
        sourceHandle: 'false',
        targetHandle: 'input'
      },
      {
        id: 'transform-to-success',
        source: 'transform-node',
        target: 'end-success',
        sourceHandle: 'result',
        targetHandle: 'input'
      },
      {
        id: 'email-to-error',
        source: 'email-node',
        target: 'end-error',
        sourceHandle: 'sent',
        targetHandle: 'input'
      }
    ]
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock execution results
const mockSuccessExecution = {
  id: 'exec-success-1',
  workflowId: 'execution-test-workflow',
  status: 'completed',
  startTime: new Date(Date.now() - 30000), // 30 seconds ago
  endTime: new Date(),
  result: {
    success: true,
    nodeResults: {
      'start-node': {
        status: 'completed',
        outputs: {
          trigger: { timestamp: new Date().toISOString() }
        }
      },
      'http-node': {
        status: 'completed',
        outputs: {
          response: {
            status: 200,
            data: [
              { id: 1, name: 'John Doe', email: 'john@example.com' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ]
          },
          status: 200
        }
      },
      'condition-node': {
        status: 'completed',
        outputs: {
          true: {
            conditionMet: true,
            evaluatedValue: true
          }
        }
      },
      'transform-node': {
        status: 'completed',
        outputs: {
          result: {
            userNames: ['John Doe', 'Jane Smith']
          }
        }
      },
      'end-success': {
        status: 'completed',
        outputs: {}
      }
    }
  }
};

const mockFailureExecution = {
  id: 'exec-failure-1',
  workflowId: 'execution-test-workflow',
  status: 'failed',
  startTime: new Date(Date.now() - 45000), // 45 seconds ago
  endTime: new Date(Date.now() - 15000), // 15 seconds ago
  result: {
    success: false,
    error: 'HTTP request failed: Network timeout',
    nodeResults: {
      'start-node': {
        status: 'completed',
        outputs: {
          trigger: { timestamp: new Date().toISOString() }
        }
      },
      'http-node': {
        status: 'failed',
        error: 'Network timeout after 5000ms',
        outputs: {
          response: null,
          status: 0
        }
      }
    }
  }
};

// Mock workflow execution components
jest.mock('../../components/workflow-execution/ExecutionRunner', () => {
  return function MockExecutionRunner({ workflow, onComplete, onProgress }: any) {
    const [executing, setExecuting] = React.useState(false);
    const [progress, setProgress] = React.useState<any>(null);

    const executeWorkflow = async () => {
      setExecuting(true);
      onProgress?.({ status: 'starting', message: 'Initializing workflow execution...' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress?.({ status: 'running', message: 'Executing HTTP request...', currentNode: 'http-node' });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      onProgress?.({ status: 'running', message: 'Evaluating condition...', currentNode: 'condition-node' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress?.({ status: 'running', message: 'Transforming data...', currentNode: 'transform-node' });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setExecuting(false);
      onComplete?.(mockSuccessExecution);
    };

    return (
      <div data-testid="execution-runner">
        <div data-testid="workflow-info">
          <h3>Executing: {workflow?.name}</h3>
          <p>Nodes: {workflow?.definition?.nodes?.length}</p>
          <p>Edges: {workflow?.definition?.edges?.length}</p>
        </div>
        
        {progress && (
          <div data-testid="execution-progress">
            <p data-testid="progress-status">Status: {progress.status}</p>
            <p data-testid="progress-message">{progress.message}</p>
            {progress.currentNode && (
              <p data-testid="current-node">Current Node: {progress.currentNode}</p>
            )}
          </div>
        )}
        
        <button
          data-testid="execute-workflow"
          onClick={executeWorkflow}
          disabled={executing}
        >
          {executing ? 'Executing...' : 'Execute Workflow'}
        </button>
        
        {executing && (
          <div data-testid="execution-spinner">
            <span>⏳ Execution in progress...</span>
          </div>
        )}
      </div>
    );
  };
});

jest.mock('../../components/workflow-execution/ExecutionResults', () => {
  return function MockExecutionResults({ execution, onViewDetails }: any) {
    if (!execution) {
      return (
        <div data-testid="no-execution-results">
          <p>No execution results available</p>
        </div>
      );
    }

    const getDuration = () => {
      if (execution.startTime && execution.endTime) {
        const duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
        return `${duration / 1000}s`;
      }
      return 'N/A';
    };

    const getSuccessfulNodes = () => {
      if (!execution.result?.nodeResults) return 0;
      return Object.values(execution.result.nodeResults).filter(
        (result: any) => result.status === 'completed'
      ).length;
    };

    const getFailedNodes = () => {
      if (!execution.result?.nodeResults) return 0;
      return Object.values(execution.result.nodeResults).filter(
        (result: any) => result.status === 'failed'
      ).length;
    };

    return (
      <div data-testid="execution-results">
        <div data-testid="execution-summary">
          <h3>Execution Results</h3>
          <p data-testid="execution-id">ID: {execution.id}</p>
          <p data-testid="execution-status">Status: {execution.status}</p>
          <p data-testid="execution-duration">Duration: {getDuration()}</p>
          <p data-testid="successful-nodes">Successful Nodes: {getSuccessfulNodes()}</p>
          <p data-testid="failed-nodes">Failed Nodes: {getFailedNodes()}</p>
        </div>
        
        {execution.result?.success && (
          <div data-testid="success-details">
            <h4>Success Details</h4>
            {execution.result.nodeResults && Object.entries(execution.result.nodeResults).map(([nodeId, result]: any) => (
              <div key={nodeId} data-testid={`node-result-${nodeId}`}>
                <h5>Node: {nodeId}</h5>
                <p>Status: {result.status}</p>
                {result.outputs && (
                  <pre data-testid={`node-outputs-${nodeId}`}>
                    {JSON.stringify(result.outputs, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        
        {execution.result?.error && (
          <div data-testid="error-details">
            <h4>Error Details</h4>
            <p data-testid="execution-error">{execution.result.error}</p>
          </div>
        )}
        
        <button
          data-testid="view-detailed-results"
          onClick={() => onViewDetails?.(execution)}
        >
          View Detailed Results
        </button>
      </div>
    );
  };
});

// Mock hooks
jest.mock('../../hooks/useWorkflows', () => ({
  useExecuteWorkflow: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: mockSuccessExecution
    }),
    isLoading: false,
    isError: false
  }),
  useWorkflowExecutions: () => ({
    data: [mockSuccessExecution, mockFailureExecution],
    isLoading: false,
    isError: false,
    refetch: jest.fn()
  }),
  useWorkflowById: () => ({
    data: mockWorkflow,
    isLoading: false,
    isError: false
  })
}));

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

// Main test component that combines execution runner and results
const WorkflowExecutionPage: React.FC = () => {
  const [currentExecution, setCurrentExecution] = React.useState<any>(null);
  const [executionProgress, setExecutionProgress] = React.useState<any>(null);

  const ExecutionRunner = require('../../components/workflow-execution/ExecutionRunner').default;
  const ExecutionResults = require('../../components/workflow-execution/ExecutionResults').default;

  const handleExecutionComplete = (execution: any) => {
    setCurrentExecution(execution);
    setExecutionProgress(null);
  };

  const handleExecutionProgress = (progress: any) => {
    setExecutionProgress(progress);
  };

  const handleViewDetails = (execution: any) => {
    console.log('Viewing detailed results for:', execution.id);
  };

  return (
    <div data-testid="workflow-execution-page">
      <h1>Workflow Execution</h1>
      
      <ExecutionRunner
        workflow={mockWorkflow}
        onComplete={handleExecutionComplete}
        onProgress={handleExecutionProgress}
      />
      
      <ExecutionResults
        execution={currentExecution}
        onViewDetails={handleViewDetails}
      />
      
      {executionProgress && (
        <div data-testid="live-progress">
          <h3>Live Progress</h3>
          <p data-testid="live-status">{executionProgress.status}</p>
          <p data-testid="live-message">{executionProgress.message}</p>
        </div>
      )}
    </div>
  );
};

describe('Workflow Execution E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Complete Workflow Execution Flow', () => {
    it('should execute workflow and display real-time progress', async () => {
      const mockExecuteWorkflow = jest.fn().mockResolvedValue({
        success: true,
        data: mockSuccessExecution
      });

      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<WorkflowExecutionPage />);

      // Verify initial state
      expect(screen.getByTestId('workflow-execution-page')).toBeInTheDocument();
      expect(screen.getByTestId('execution-runner')).toBeInTheDocument();
      expect(screen.getByText('Executing: Execution E2E Test Workflow')).toBeInTheDocument();
      expect(screen.getByText('Nodes: 7')).toBeInTheDocument();
      expect(screen.getByText('Edges: 6')).toBeInTheDocument();

      // Start execution
      const executeButton = screen.getByTestId('execute-workflow');
      expect(executeButton).toHaveTextContent('Execute Workflow');
      fireEvent.click(executeButton);

      // Verify execution starts
      await waitFor(() => {
        expect(executeButton).toHaveTextContent('Executing...');
        expect(executeButton).toBeDisabled();
        expect(screen.getByTestId('execution-spinner')).toBeInTheDocument();
      });

      // Verify live progress updates
      await waitFor(() => {
        expect(screen.getByTestId('live-progress')).toBeInTheDocument();
        expect(screen.getByTestId('live-status')).toHaveTextContent('starting');
        expect(screen.getByTestId('live-message')).toHaveTextContent('Initializing workflow execution...');
      });

      // Wait for HTTP request step
      await waitFor(() => {
        expect(screen.getByTestId('live-message')).toHaveTextContent('Executing HTTP request...');
        expect(screen.getByTestId('current-node')).toHaveTextContent('Current Node: http-node');
      }, { timeout: 2000 });

      // Wait for condition evaluation
      await waitFor(() => {
        expect(screen.getByTestId('live-message')).toHaveTextContent('Evaluating condition...');
        expect(screen.getByTestId('current-node')).toHaveTextContent('Current Node: condition-node');
      }, { timeout: 2000 });

      // Wait for data transformation
      await waitFor(() => {
        expect(screen.getByTestId('live-message')).toHaveTextContent('Transforming data...');
        expect(screen.getByTestId('current-node')).toHaveTextContent('Current Node: transform-node');
      }, { timeout: 2000 });

      // Wait for execution completion
      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
        expect(executeButton).toHaveTextContent('Execute Workflow');
        expect(executeButton).not.toBeDisabled();
      }, { timeout: 3000 });

      // Verify execution results
      expect(screen.getByTestId('execution-summary')).toBeInTheDocument();
      expect(screen.getByTestId('execution-id')).toHaveTextContent('ID: exec-success-1');
      expect(screen.getByTestId('execution-status')).toHaveTextContent('Status: completed');
      expect(screen.getByTestId('successful-nodes')).toHaveTextContent('Successful Nodes: 5');
      expect(screen.getByTestId('failed-nodes')).toHaveTextContent('Failed Nodes: 0');

      // Verify detailed node results are shown
      expect(screen.getByTestId('success-details')).toBeInTheDocument();
      expect(screen.getByTestId('node-result-start-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-result-http-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-result-condition-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-result-transform-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-result-end-success')).toBeInTheDocument();

      // Verify node outputs are displayed
      expect(screen.getByTestId('node-outputs-transform-node')).toBeInTheDocument();
      expect(screen.getByTestId('node-outputs-transform-node')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('node-outputs-transform-node')).toHaveTextContent('Jane Smith');
    });

    it('should handle workflow execution failures gracefully', async () => {
      const mockExecuteWorkflow = jest.fn().mockResolvedValue({
        success: false,
        data: mockFailureExecution
      });

      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false,
        isError: false
      });

      // Mock execution runner to simulate failure
      jest.doMock('../../components/workflow-execution/ExecutionRunner', () => {
        return function MockExecutionRunner({ onComplete }: any) {
          const executeWorkflow = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            onComplete(mockFailureExecution);
          };

          return (
            <div data-testid="execution-runner">
              <button data-testid="execute-workflow" onClick={executeWorkflow}>
                Execute Workflow
              </button>
            </div>
          );
        };
      });

      renderWithProviders(<WorkflowExecutionPage />);

      // Execute workflow
      fireEvent.click(screen.getByTestId('execute-workflow'));

      // Wait for failure results
      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify failure status
      expect(screen.getByTestId('execution-status')).toHaveTextContent('Status: failed');
      expect(screen.getByTestId('failed-nodes')).toHaveTextContent('Failed Nodes: 1');
      
      // Verify error details are shown
      expect(screen.getByTestId('error-details')).toBeInTheDocument();
      expect(screen.getByTestId('execution-error')).toHaveTextContent('HTTP request failed: Network timeout');
    });

    it('should allow multiple consecutive executions', async () => {
      let executionCount = 0;
      const mockExecuteWorkflow = jest.fn().mockImplementation(() => {
        executionCount++;
        return Promise.resolve({
          success: true,
          data: {
            ...mockSuccessExecution,
            id: `exec-${executionCount}`,
            startTime: new Date(),
            endTime: new Date()
          }
        });
      });

      jest.mocked(require('../../hooks/useWorkflows').useExecuteWorkflow).mockReturnValue({
        mutateAsync: mockExecuteWorkflow,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<WorkflowExecutionPage />);

      // First execution
      fireEvent.click(screen.getByTestId('execute-workflow'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
        expect(screen.getByTestId('execution-id')).toHaveTextContent('ID: exec-1');
      }, { timeout: 3000 });

      // Second execution
      fireEvent.click(screen.getByTestId('execute-workflow'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-id')).toHaveTextContent('ID: exec-2');
      }, { timeout: 3000 });

      expect(executionCount).toBe(2);
    });
  });

  describe('Execution Results Interaction', () => {
    it('should display detailed execution results with node outputs', async () => {
      renderWithProviders(<WorkflowExecutionPage />);

      // Execute workflow
      fireEvent.click(screen.getByTestId('execute-workflow'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify detailed results button
      const detailsButton = screen.getByTestId('view-detailed-results');
      expect(detailsButton).toBeInTheDocument();

      // Click to view detailed results
      fireEvent.click(detailsButton);

      // Verify node outputs are visible and properly formatted
      const httpNodeOutputs = screen.getByTestId('node-outputs-http-node');
      expect(httpNodeOutputs).toBeInTheDocument();
      
      const outputsContent = httpNodeOutputs.textContent;
      expect(outputsContent).toContain('"status": 200');
      expect(outputsContent).toContain('"data"');
      expect(outputsContent).toContain('John Doe');
      expect(outputsContent).toContain('Jane Smith');

      // Verify transform node outputs
      const transformNodeOutputs = screen.getByTestId('node-outputs-transform-node');
      expect(transformNodeOutputs).toBeInTheDocument();
      expect(transformNodeOutputs.textContent).toContain('userNames');
      expect(transformNodeOutputs.textContent).toContain('John Doe');
      expect(transformNodeOutputs.textContent).toContain('Jane Smith');
    });

    it('should show execution duration and performance metrics', async () => {
      renderWithProviders(<WorkflowExecutionPage />);

      fireEvent.click(screen.getByTestId('execute-workflow'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify duration is displayed
      const duration = screen.getByTestId('execution-duration');
      expect(duration).toBeInTheDocument();
      expect(duration.textContent).toMatch(/Duration: \d+(\.\d+)?s/);

      // Verify success/failure counts
      expect(screen.getByTestId('successful-nodes')).toHaveTextContent('Successful Nodes: 5');
      expect(screen.getByTestId('failed-nodes')).toHaveTextContent('Failed Nodes: 0');
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle conditional workflow paths correctly', async () => {
      renderWithProviders(<WorkflowExecutionPage />);

      // Execute workflow that should follow the success path
      fireEvent.click(screen.getByTestId('execute-workflow'));

      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify condition node evaluated correctly
      const conditionNodeResult = screen.getByTestId('node-result-condition-node');
      expect(conditionNodeResult).toBeInTheDocument();
      expect(conditionNodeResult.textContent).toContain('Status: completed');

      // Verify transform node was executed (success path)
      const transformNodeResult = screen.getByTestId('node-result-transform-node');
      expect(transformNodeResult).toBeInTheDocument();

      // Verify success end node was reached
      const endSuccessResult = screen.getByTestId('node-result-end-success');
      expect(endSuccessResult).toBeInTheDocument();

      // Verify email node was NOT executed (failure path should be skipped)
      const emailNodeResult = screen.queryByTestId('node-result-email-node');
      expect(emailNodeResult).not.toBeInTheDocument();
    });

    it('should track execution progress through complex node graph', async () => {
      renderWithProviders(<WorkflowExecutionPage />);

      fireEvent.click(screen.getByTestId('execute-workflow'));

      // Verify progress goes through expected nodes in order
      await waitFor(() => {
        expect(screen.getByTestId('live-progress')).toBeInTheDocument();
      });

      // Should start with HTTP node
      await waitFor(() => {
        expect(screen.getByTestId('current-node')).toHaveTextContent('http-node');
      }, { timeout: 1000 });

      // Then move to condition node
      await waitFor(() => {
        expect(screen.getByTestId('current-node')).toHaveTextContent('condition-node');
      }, { timeout: 2000 });

      // Finally transform node (success path)
      await waitFor(() => {
        expect(screen.getByTestId('current-node')).toHaveTextContent('transform-node');
      }, { timeout: 3000 });

      // Execution should complete
      await waitFor(() => {
        expect(screen.getByTestId('execution-results')).toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });
});