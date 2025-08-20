import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock error scenarios for comprehensive E2E error testing
const mockApiError = {
  message: 'Internal Server Error',
  status: 500,
  details: {
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  }
};

const mockNetworkError = {
  message: 'Network request failed',
  status: 0,
  details: {
    code: 'NETWORK_ERROR',
    cause: 'Connection timeout'
  }
};

const mockValidationError = {
  message: 'Validation failed',
  status: 400,
  details: {
    code: 'VALIDATION_ERROR',
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'url', message: 'URL must be HTTPS' }
    ]
  }
};

// Mock failed workflow execution
const mockFailedExecution = {
  id: 'failed-exec-1',
  workflowId: 'test-workflow',
  status: 'failed',
  startTime: new Date(Date.now() - 30000),
  endTime: new Date(),
  result: {
    success: false,
    error: 'HTTP connector failed: Connection timeout',
    nodeResults: {
      'start': {
        status: 'completed',
        outputs: { trigger: true }
      },
      'http-node': {
        status: 'failed',
        error: 'Connection timeout after 5000ms',
        outputs: null,
        retryAttempts: 3
      },
      'condition-node': {
        status: 'skipped',
        reason: 'Previous node failed'
      }
    }
  }
};

// Mock connector test failures
const mockConnectorTestFailures = {
  'http-timeout': {
    success: false,
    error: 'Connection timeout',
    status: 0,
    details: {
      url: 'https://api.example.com/timeout',
      timeout: 5000,
      retries: 3
    }
  },
  'http-auth-fail': {
    success: false,
    error: 'Authentication failed',
    status: 401,
    details: {
      message: 'Invalid API key',
      hint: 'Check your API key configuration'
    }
  },
  'email-smtp-fail': {
    success: false,
    error: 'SMTP connection failed',
    status: 0,
    details: {
      host: 'smtp.gmail.com',
      port: 587,
      message: 'Authentication failed'
    }
  },
  'webhook-invalid-url': {
    success: false,
    error: 'Invalid webhook URL',
    status: 404,
    details: {
      url: 'https://hooks.slack.com/invalid',
      message: 'Webhook not found'
    }
  }
};

// Error Boundary component for testing error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
    console.error('Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Something went wrong</h2>
          <p data-testid="error-message">{this.state.error?.message}</p>
          <button 
            data-testid="retry-button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mock application with error handling
const MockApplicationWithErrors: React.FC = () => {
  const [currentError, setCurrentError] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [testResults, setTestResults] = React.useState<any>(null);

  const simulateApiError = async (errorType: string) => {
    setLoading(true);
    setCurrentError(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    
    switch (errorType) {
      case 'api-500':
        setCurrentError(mockApiError);
        break;
      case 'network':
        setCurrentError(mockNetworkError);
        break;
      case 'validation':
        setCurrentError(mockValidationError);
        break;
      case 'connector-timeout':
        setTestResults(mockConnectorTestFailures['http-timeout']);
        break;
      case 'connector-auth':
        setTestResults(mockConnectorTestFailures['http-auth-fail']);
        break;
      case 'workflow-execution':
        setTestResults(mockFailedExecution);
        break;
      default:
        setCurrentError({ message: 'Unknown error', status: 500 });
    }
    
    setLoading(false);
  };

  const clearError = () => {
    setCurrentError(null);
    setTestResults(null);
  };

  return (
    <ErrorBoundary onError={(error) => console.log('Boundary caught:', error.message)}>
      <div data-testid="error-test-app">
        <h1>Error Handling Test Application</h1>
        
        {/* Error Simulation Controls */}
        <div data-testid="error-controls">
          <h2>Simulate Errors</h2>
          <button 
            data-testid="trigger-api-error"
            onClick={() => simulateApiError('api-500')}
            disabled={loading}
          >
            Trigger API Error (500)
          </button>
          <button 
            data-testid="trigger-network-error"
            onClick={() => simulateApiError('network')}
            disabled={loading}
          >
            Trigger Network Error
          </button>
          <button 
            data-testid="trigger-validation-error"
            onClick={() => simulateApiError('validation')}
            disabled={loading}
          >
            Trigger Validation Error
          </button>
          <button 
            data-testid="trigger-connector-timeout"
            onClick={() => simulateApiError('connector-timeout')}
            disabled={loading}
          >
            Test Connector Timeout
          </button>
          <button 
            data-testid="trigger-connector-auth"
            onClick={() => simulateApiError('connector-auth')}
            disabled={loading}
          >
            Test Connector Auth Failure
          </button>
          <button 
            data-testid="trigger-workflow-failure"
            onClick={() => simulateApiError('workflow-execution')}
            disabled={loading}
          >
            Test Workflow Execution Failure
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div data-testid="loading-spinner">
            <p>Loading...</p>
          </div>
        )}

        {/* Error Display */}
        {currentError && (
          <div data-testid="error-display">
            <div data-testid="error-alert" className="error-alert">
              <h3>Error Occurred</h3>
              <p data-testid="error-message-text">{currentError.message}</p>
              <p data-testid="error-status">Status: {currentError.status}</p>
              
              {currentError.details && (
                <div data-testid="error-details">
                  <h4>Details:</h4>
                  <p data-testid="error-code">Code: {currentError.details.code}</p>
                  {currentError.details.errors && (
                    <ul data-testid="validation-errors">
                      {currentError.details.errors.map((error: any, index: number) => (
                        <li key={index} data-testid={`validation-error-${index}`}>
                          {error.field}: {error.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div data-testid="error-actions">
                <button data-testid="retry-action" onClick={clearError}>
                  Dismiss
                </button>
                <button data-testid="report-error" onClick={() => console.log('Error reported')}>
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Results Display */}
        {testResults && !testResults.success && (
          <div data-testid="test-failure-display">
            <div data-testid="test-failure-alert" className="warning-alert">
              <h3>Test Failed</h3>
              <p data-testid="test-error-message">{testResults.error}</p>
              {testResults.status !== undefined && (
                <p data-testid="test-status">Status: {testResults.status}</p>
              )}
              
              {testResults.details && (
                <div data-testid="test-failure-details">
                  <h4>Details:</h4>
                  {Object.entries(testResults.details).map(([key, value]: any) => (
                    <p key={key} data-testid={`test-detail-${key}`}>
                      {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                    </p>
                  ))}
                </div>
              )}
              
              <div data-testid="test-failure-actions">
                <button data-testid="retry-test" onClick={clearError}>
                  Retry Test
                </button>
                <button data-testid="edit-config" onClick={() => console.log('Edit configuration')}>
                  Edit Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Execution Failure Display */}
        {testResults && testResults.result && !testResults.result.success && (
          <div data-testid="workflow-failure-display">
            <div data-testid="workflow-failure-alert" className="error-alert">
              <h3>Workflow Execution Failed</h3>
              <p data-testid="workflow-error-message">{testResults.result.error}</p>
              <p data-testid="workflow-status">Status: {testResults.status}</p>
              
              <div data-testid="workflow-node-failures">
                <h4>Node Results:</h4>
                {Object.entries(testResults.result.nodeResults).map(([nodeId, result]: any) => (
                  <div key={nodeId} data-testid={`node-failure-${nodeId}`}>
                    <p><strong>{nodeId}:</strong> {result.status}</p>
                    {result.error && (
                      <p data-testid={`node-error-${nodeId}`} className="error-text">
                        Error: {result.error}
                      </p>
                    )}
                    {result.retryAttempts && (
                      <p data-testid={`node-retries-${nodeId}`}>
                        Retry Attempts: {result.retryAttempts}
                      </p>
                    )}
                    {result.reason && (
                      <p data-testid={`node-reason-${nodeId}`}>
                        Reason: {result.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div data-testid="workflow-failure-actions">
                <button data-testid="retry-workflow" onClick={clearError}>
                  Retry Workflow
                </button>
                <button data-testid="debug-workflow" onClick={() => console.log('Debug workflow')}>
                  Debug Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {testResults && testResults.success && (
          <div data-testid="success-display">
            <div data-testid="success-alert" className="success-alert">
              <h3>Operation Successful</h3>
              <p>The operation completed successfully.</p>
              <button data-testid="clear-success" onClick={clearError}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

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

describe('Error Handling E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Error Handling', () => {
    it('should handle 500 Internal Server Error gracefully', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      expect(screen.getByTestId('error-test-app')).toBeInTheDocument();

      // Trigger API error
      const apiErrorButton = screen.getByTestId('trigger-api-error');
      fireEvent.click(apiErrorButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify error details
      expect(screen.getByTestId('error-message-text')).toHaveTextContent('Internal Server Error');
      expect(screen.getByTestId('error-status')).toHaveTextContent('Status: 500');
      expect(screen.getByTestId('error-code')).toHaveTextContent('Code: INTERNAL_ERROR');

      // Verify error actions are available
      expect(screen.getByTestId('retry-action')).toBeInTheDocument();
      expect(screen.getByTestId('report-error')).toBeInTheDocument();

      // Test error dismissal
      fireEvent.click(screen.getByTestId('retry-action'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
    });

    it('should handle network errors with appropriate messaging', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger network error
      fireEvent.click(screen.getByTestId('trigger-network-error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByTestId('error-message-text')).toHaveTextContent('Network request failed');
      expect(screen.getByTestId('error-status')).toHaveTextContent('Status: 0');
      expect(screen.getByTestId('error-code')).toHaveTextContent('Code: NETWORK_ERROR');
    });

    it('should handle validation errors with field-specific messages', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger validation error
      fireEvent.click(screen.getByTestId('trigger-validation-error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByTestId('error-message-text')).toHaveTextContent('Validation failed');
      expect(screen.getByTestId('error-status')).toHaveTextContent('Status: 400');

      // Verify validation errors are displayed
      expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      expect(screen.getByTestId('validation-error-0')).toHaveTextContent('email: Invalid email format');
      expect(screen.getByTestId('validation-error-1')).toHaveTextContent('url: URL must be HTTPS');
    });
  });

  describe('Connector Test Failure Handling', () => {
    it('should handle connector timeout failures', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger connector timeout
      fireEvent.click(screen.getByTestId('trigger-connector-timeout'));

      await waitFor(() => {
        expect(screen.getByTestId('test-failure-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByTestId('test-error-message')).toHaveTextContent('Connection timeout');
      expect(screen.getByTestId('test-status')).toHaveTextContent('Status: 0');

      // Verify failure details
      expect(screen.getByTestId('test-failure-details')).toBeInTheDocument();
      expect(screen.getByTestId('test-detail-url')).toHaveTextContent('url: https://api.example.com/timeout');
      expect(screen.getByTestId('test-detail-timeout')).toHaveTextContent('timeout: 5000');
      expect(screen.getByTestId('test-detail-retries')).toHaveTextContent('retries: 3');

      // Verify retry actions
      expect(screen.getByTestId('retry-test')).toBeInTheDocument();
      expect(screen.getByTestId('edit-config')).toBeInTheDocument();
    });

    it('should handle connector authentication failures', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger connector auth failure
      fireEvent.click(screen.getByTestId('trigger-connector-auth'));

      await waitFor(() => {
        expect(screen.getByTestId('test-failure-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByTestId('test-error-message')).toHaveTextContent('Authentication failed');
      expect(screen.getByTestId('test-status')).toHaveTextContent('Status: 401');
      expect(screen.getByTestId('test-detail-message')).toHaveTextContent('message: Invalid API key');
      expect(screen.getByTestId('test-detail-hint')).toHaveTextContent('hint: Check your API key configuration');

      // Test retry functionality
      fireEvent.click(screen.getByTestId('retry-test'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('test-failure-display')).not.toBeInTheDocument();
      });
    });
  });

  describe('Workflow Execution Error Handling', () => {
    it('should handle workflow execution failures with detailed node information', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger workflow execution failure
      fireEvent.click(screen.getByTestId('trigger-workflow-failure'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-failure-display')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify main error information
      expect(screen.getByTestId('workflow-error-message')).toHaveTextContent('HTTP connector failed: Connection timeout');
      expect(screen.getByTestId('workflow-status')).toHaveTextContent('Status: failed');

      // Verify node-specific error information
      expect(screen.getByTestId('workflow-node-failures')).toBeInTheDocument();
      
      // Start node should be completed
      expect(screen.getByTestId('node-failure-start')).toHaveTextContent('start: completed');
      
      // HTTP node should show failure details
      expect(screen.getByTestId('node-failure-http-node')).toHaveTextContent('http-node: failed');
      expect(screen.getByTestId('node-error-http-node')).toHaveTextContent('Error: Connection timeout after 5000ms');
      expect(screen.getByTestId('node-retries-http-node')).toHaveTextContent('Retry Attempts: 3');
      
      // Condition node should be skipped
      expect(screen.getByTestId('node-failure-condition-node')).toHaveTextContent('condition-node: skipped');
      expect(screen.getByTestId('node-reason-condition-node')).toHaveTextContent('Reason: Previous node failed');

      // Verify workflow recovery actions
      expect(screen.getByTestId('retry-workflow')).toBeInTheDocument();
      expect(screen.getByTestId('debug-workflow')).toBeInTheDocument();
    });

    it('should allow workflow retry after failure', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger workflow failure
      fireEvent.click(screen.getByTestId('trigger-workflow-failure'));

      await waitFor(() => {
        expect(screen.getByTestId('workflow-failure-display')).toBeInTheDocument();
      });

      // Retry workflow
      fireEvent.click(screen.getByTestId('retry-workflow'));

      await waitFor(() => {
        expect(screen.queryByTestId('workflow-failure-display')).not.toBeInTheDocument();
      });

      // Should be able to trigger another test
      expect(screen.getByTestId('trigger-workflow-failure')).not.toBeDisabled();
    });
  });

  describe('Error Recovery and User Experience', () => {
    it('should maintain application state after error recovery', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Trigger error
      fireEvent.click(screen.getByTestId('trigger-api-error'));
      await waitFor(() => expect(screen.getByTestId('error-display')).toBeInTheDocument());

      // Dismiss error
      fireEvent.click(screen.getByTestId('retry-action'));
      await waitFor(() => expect(screen.queryByTestId('error-display')).not.toBeInTheDocument());

      // Verify application is still functional
      expect(screen.getByTestId('error-controls')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-api-error')).not.toBeDisabled();

      // Test another error type
      fireEvent.click(screen.getByTestId('trigger-network-error'));
      await waitFor(() => expect(screen.getByTestId('error-display')).toBeInTheDocument());

      expect(screen.getByTestId('error-message-text')).toHaveTextContent('Network request failed');
    });

    it('should handle multiple consecutive errors without breaking', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // First error
      fireEvent.click(screen.getByTestId('trigger-api-error'));
      await waitFor(() => expect(screen.getByTestId('error-display')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('retry-action'));
      await waitFor(() => expect(screen.queryByTestId('error-display')).not.toBeInTheDocument());

      // Second error
      fireEvent.click(screen.getByTestId('trigger-validation-error'));
      await waitFor(() => expect(screen.getByTestId('error-display')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('retry-action'));
      await waitFor(() => expect(screen.queryByTestId('error-display')).not.toBeInTheDocument());

      // Third error (connector failure)
      fireEvent.click(screen.getByTestId('trigger-connector-timeout'));
      await waitFor(() => expect(screen.getByTestId('test-failure-display')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('retry-test'));
      await waitFor(() => expect(screen.queryByTestId('test-failure-display')).not.toBeInTheDocument());

      // Application should still be responsive
      expect(screen.getByTestId('error-test-app')).toBeInTheDocument();
      expect(screen.getByTestId('error-controls')).toBeInTheDocument();
    });

    it('should provide appropriate error messaging for different failure types', async () => {
      renderWithProviders(<MockApplicationWithErrors />);

      // Test each error type for appropriate messaging
      const errorTests = [
        {
          trigger: 'trigger-api-error',
          expectedMessage: 'Internal Server Error',
          expectedSelector: 'error-display'
        },
        {
          trigger: 'trigger-network-error', 
          expectedMessage: 'Network request failed',
          expectedSelector: 'error-display'
        },
        {
          trigger: 'trigger-connector-timeout',
          expectedMessage: 'Connection timeout',
          expectedSelector: 'test-failure-display'
        },
        {
          trigger: 'trigger-workflow-failure',
          expectedMessage: 'HTTP connector failed: Connection timeout',
          expectedSelector: 'workflow-failure-display'
        }
      ];

      for (const test of errorTests) {
        // Trigger error
        fireEvent.click(screen.getByTestId(test.trigger));
        
        // Wait for error display
        await waitFor(() => {
          expect(screen.getByTestId(test.expectedSelector)).toBeInTheDocument();
        });

        // Verify message
        const messageElement = screen.getByTestId(test.expectedSelector)
          .querySelector('[data-testid*="error-message"], [data-testid*="test-error-message"], [data-testid*="workflow-error-message"]');
        expect(messageElement).toHaveTextContent(test.expectedMessage);

        // Clear error
        const clearButton = screen.getByTestId(test.expectedSelector)
          .querySelector('[data-testid*="retry"], [data-testid*="clear"]');
        if (clearButton) {
          fireEvent.click(clearButton);
          await waitFor(() => {
            expect(screen.queryByTestId(test.expectedSelector)).not.toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch JavaScript errors with Error Boundary', async () => {
      const ThrowingComponent: React.FC = () => {
        const [shouldThrow, setShouldThrow] = React.useState(false);
        
        if (shouldThrow) {
          throw new Error('Component crashed');
        }
        
        return (
          <div>
            <button 
              data-testid="throw-error"
              onClick={() => setShouldThrow(true)}
            >
              Throw Error
            </button>
          </div>
        );
      };

      renderWithProviders(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Trigger component error
      fireEvent.click(screen.getByTestId('throw-error'));

      // Error boundary should catch it
      await waitFor(() => {
        expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Component crashed');
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();

      // Test recovery
      fireEvent.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      });
    });
  });
});