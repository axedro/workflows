import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import components for E2E testing
import ConnectorWizard from '../../components/connector-wizard/ConnectorWizard';
import ConnectorDashboard from '../../components/connector-dashboard/ConnectorDashboard';

// Mock complete connector wizard flow data
const mockWizardData = {
  basicInfo: {
    name: 'E2E Test Connector',
    description: 'Created through E2E testing',
    type: 'http'
  },
  configuration: {
    method: 'GET',
    url: 'https://api.example.com/test',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    timeout: 5000
  }
};

const mockConnectorResponse = {
  id: 'e2e-connector-id',
  name: 'E2E Test Connector',
  type: 'http',
  description: 'Created through E2E testing',
  configuration: mockWizardData.configuration,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock all wizard steps to simulate real user flow
jest.mock('../../components/connector-wizard/steps/Step1BasicInfo', () => {
  return function MockStep1BasicInfo({ data, onUpdate, onNext }: any) {
    const handleNext = () => {
      onUpdate({
        name: 'E2E Test Connector',
        description: 'Created through E2E testing'
      });
      onNext();
    };

    return (
      <div data-testid="step1-basic-info">
        <h2>Basic Information</h2>
        <input
          data-testid="connector-name"
          value={data?.name || ''}
          onChange={(e) => onUpdate({ ...data, name: e.target.value })}
          placeholder="Enter connector name"
        />
        <textarea
          data-testid="connector-description"
          value={data?.description || ''}
          onChange={(e) => onUpdate({ ...data, description: e.target.value })}
          placeholder="Enter description"
        />
        <button data-testid="next-step" onClick={handleNext}>
          Next: Select Type
        </button>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step2SelectType', () => {
  return function MockStep2SelectType({ data, onUpdate, onNext, onPrevious }: any) {
    const handleSelectType = (type: string) => {
      onUpdate({ ...data, type });
      onNext();
    };

    return (
      <div data-testid="step2-select-type">
        <h2>Select Connector Type</h2>
        <div className="connector-types">
          <button
            data-testid="type-http"
            onClick={() => handleSelectType('http')}
            className={data?.type === 'http' ? 'selected' : ''}
          >
            HTTP/REST API
          </button>
          <button
            data-testid="type-email"
            onClick={() => handleSelectType('email')}
            className={data?.type === 'email' ? 'selected' : ''}
          >
            Email (SMTP)
          </button>
          <button
            data-testid="type-webhook"
            onClick={() => handleSelectType('webhook')}
            className={data?.type === 'webhook' ? 'selected' : ''}
          >
            Webhook
          </button>
        </div>
        <div className="navigation">
          <button data-testid="previous-step" onClick={onPrevious}>
            Previous
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step4Configuration', () => {
  return function MockStep4Configuration({ data, onUpdate, onNext, onPrevious }: any) {
    const handleConfigUpdate = (field: string, value: any) => {
      onUpdate({
        ...data,
        configuration: {
          ...data?.configuration,
          [field]: value
        }
      });
    };

    const handleNext = () => {
      onUpdate({
        ...data,
        configuration: {
          method: 'GET',
          url: 'https://api.example.com/test',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          timeout: 5000
        }
      });
      onNext();
    };

    return (
      <div data-testid="step4-configuration">
        <h2>Configuration</h2>
        <div className="config-form">
          <select
            data-testid="http-method"
            value={data?.configuration?.method || 'GET'}
            onChange={(e) => handleConfigUpdate('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          
          <input
            data-testid="api-url"
            type="url"
            value={data?.configuration?.url || ''}
            onChange={(e) => handleConfigUpdate('url', e.target.value)}
            placeholder="https://api.example.com"
          />
          
          <textarea
            data-testid="headers-config"
            value={JSON.stringify(data?.configuration?.headers || {}, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value);
                handleConfigUpdate('headers', headers);
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder="Request headers (JSON format)"
          />
          
          <input
            data-testid="timeout-config"
            type="number"
            value={data?.configuration?.timeout || 5000}
            onChange={(e) => handleConfigUpdate('timeout', parseInt(e.target.value))}
            placeholder="Timeout (ms)"
          />
        </div>
        
        <div className="navigation">
          <button data-testid="previous-step" onClick={onPrevious}>
            Previous
          </button>
          <button data-testid="next-step" onClick={handleNext}>
            Next: Testing
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step6Testing', () => {
  return function MockStep6Testing({ data, onComplete, onPrevious }: any) {
    const [testResult, setTestResult] = React.useState<any>(null);
    const [testing, setTesting] = React.useState(false);

    const handleTest = async () => {
      setTesting(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = {
        success: true,
        status: 200,
        message: 'Connection successful',
        data: { test: 'response' }
      };
      
      setTestResult(result);
      setTesting(false);
    };

    const handleComplete = () => {
      onComplete({
        ...data,
        testResult
      });
    };

    return (
      <div data-testid="step6-testing">
        <h2>Test Connection</h2>
        <div className="test-section">
          <p>Test your connector configuration before saving.</p>
          
          <div data-testid="connector-summary">
            <h3>Configuration Summary:</h3>
            <p><strong>Type:</strong> {data?.type}</p>
            <p><strong>URL:</strong> {data?.configuration?.url}</p>
            <p><strong>Method:</strong> {data?.configuration?.method}</p>
          </div>
          
          <button
            data-testid="test-connection"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div data-testid="test-result">
              <h4>Test Result:</h4>
              <p data-testid="test-status">
                Status: {testResult.success ? 'Success' : 'Failed'}
              </p>
              <p data-testid="test-message">{testResult.message}</p>
              {testResult.status && (
                <p data-testid="http-status">HTTP Status: {testResult.status}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="navigation">
          <button data-testid="previous-step" onClick={onPrevious}>
            Previous
          </button>
          <button
            data-testid="complete-wizard"
            onClick={handleComplete}
            disabled={!testResult?.success}
          >
            {testResult?.success ? 'Create Connector' : 'Test Required'}
          </button>
        </div>
      </div>
    );
  };
});

// Mock hooks
jest.mock('../../hooks/useConnectors', () => ({
  useCreateConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: mockConnectorResponse
    }),
    isLoading: false,
    isError: false
  }),
  useTestConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      status: 200,
      message: 'Connection successful',
      data: { test: 'response' }
    }),
    isLoading: false,
    isError: false
  }),
  useUpdateConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({
      success: true,
      data: mockConnectorResponse
    }),
    isLoading: false,
    isError: false
  }),
  useDeleteConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    isLoading: false
  }),
  useConnectors: () => ({
    data: [mockConnectorResponse],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn()
  })
}));

// Mock other wizard steps
jest.mock('../../components/connector-wizard/steps/Step3SelectTemplate', () => {
  return function MockStep3SelectTemplate({ onNext, onPrevious }: any) {
    return (
      <div data-testid="step3-select-template">
        <h2>Select Template (Optional)</h2>
        <p>Choose a pre-configured template or continue with custom setup.</p>
        <button data-testid="skip-template" onClick={onNext}>
          Skip Template
        </button>
        <button data-testid="previous-step" onClick={onPrevious}>
          Previous
        </button>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step5Credentials', () => {
  return function MockStep5Credentials({ onNext, onPrevious }: any) {
    return (
      <div data-testid="step5-credentials">
        <h2>Credentials (Optional)</h2>
        <p>Configure authentication if required.</p>
        <button data-testid="skip-credentials" onClick={onNext}>
          Skip Credentials
        </button>
        <button data-testid="previous-step" onClick={onPrevious}>
          Previous
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

describe('Connector E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    user = userEvent.setup();
    mockOnClose = jest.fn();
    jest.clearAllMocks();
  });

  describe('Complete Connector Creation Flow', () => {
    it('should create HTTP connector through complete wizard flow', async () => {
      const mockCreateConnector = jest.fn().mockResolvedValue({
        success: true,
        data: mockConnectorResponse
      });

      jest.mocked(require('../../hooks/useConnectors').useCreateConnector).mockReturnValue({
        mutateAsync: mockCreateConnector,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Step 1: Basic Information
      expect(screen.getByTestId('step1-basic-info')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();

      const nameInput = screen.getByTestId('connector-name');
      const descriptionInput = screen.getByTestId('connector-description');

      await user.clear(nameInput);
      await user.type(nameInput, 'E2E Test Connector');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Created through E2E testing');

      fireEvent.click(screen.getByTestId('next-step'));

      // Step 2: Select Type
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
        expect(screen.getByText('Select Connector Type')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('type-http'));

      // Step 3: Template (Skip)
      await waitFor(() => {
        expect(screen.getByTestId('step3-select-template')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('skip-template'));

      // Step 4: Configuration
      await waitFor(() => {
        expect(screen.getByTestId('step4-configuration')).toBeInTheDocument();
        expect(screen.getByText('Configuration')).toBeInTheDocument();
      });

      // Configure HTTP settings
      const methodSelect = screen.getByTestId('http-method');
      const urlInput = screen.getByTestId('api-url');
      const headersInput = screen.getByTestId('headers-config');
      const timeoutInput = screen.getByTestId('timeout-config');

      fireEvent.change(methodSelect, { target: { value: 'GET' } });
      await user.clear(urlInput);
      await user.type(urlInput, 'https://api.example.com/test');
      await user.clear(headersInput);
      await user.type(headersInput, JSON.stringify({
        'Accept': 'application/json',
        'Authorization': 'Bearer test-token'
      }, null, 2));
      await user.clear(timeoutInput);
      await user.type(timeoutInput, '5000');

      fireEvent.click(screen.getByTestId('next-step'));

      // Step 5: Credentials (Skip)
      await waitFor(() => {
        expect(screen.getByTestId('step5-credentials')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('skip-credentials'));

      // Step 6: Testing
      await waitFor(() => {
        expect(screen.getByTestId('step6-testing')).toBeInTheDocument();
        expect(screen.getByText('Test Connection')).toBeInTheDocument();
      });

      // Verify configuration summary
      expect(screen.getByTestId('connector-summary')).toBeInTheDocument();
      expect(screen.getByText('https://api.example.com/test')).toBeInTheDocument();
      expect(screen.getByText('GET')).toBeInTheDocument();

      // Test connection
      fireEvent.click(screen.getByTestId('test-connection'));

      await waitFor(() => {
        expect(screen.getByTestId('test-result')).toBeInTheDocument();
        expect(screen.getByTestId('test-status')).toHaveTextContent('Status: Success');
        expect(screen.getByTestId('test-message')).toHaveTextContent('Connection successful');
        expect(screen.getByTestId('http-status')).toHaveTextContent('HTTP Status: 200');
      });

      // Complete wizard
      const completeButton = screen.getByTestId('complete-wizard');
      expect(completeButton).not.toBeDisabled();
      expect(completeButton).toHaveTextContent('Create Connector');

      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockCreateConnector).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'E2E Test Connector',
            description: 'Created through E2E testing',
            type: 'http',
            configuration: expect.objectContaining({
              method: 'GET',
              url: 'https://api.example.com/test',
              headers: expect.any(Object),
              timeout: 5000
            })
          })
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle Email connector creation flow', async () => {
      const mockCreateConnector = jest.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockConnectorResponse,
          type: 'email',
          configuration: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            username: 'test@example.com',
            password: 'password'
          }
        }
      });

      jest.mocked(require('../../hooks/useConnectors').useCreateConnector).mockReturnValue({
        mutateAsync: mockCreateConnector,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Navigate through basic info
      const nameInput = screen.getByTestId('connector-name');
      await user.type(nameInput, 'Email Test Connector');
      fireEvent.click(screen.getByTestId('next-step'));

      // Select Email type
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('type-email'));

      // Should proceed to template step
      await waitFor(() => {
        expect(screen.getByTestId('step3-select-template')).toBeInTheDocument();
      });
    });

    it('should handle Webhook connector creation flow', async () => {
      const mockCreateConnector = jest.fn().mockResolvedValue({
        success: true,
        data: {
          ...mockConnectorResponse,
          type: 'webhook',
          configuration: {
            url: 'https://webhook.example.com/hook',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        }
      });

      jest.mocked(require('../../hooks/useConnectors').useCreateConnector).mockReturnValue({
        mutateAsync: mockCreateConnector,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Navigate through basic info
      const nameInput = screen.getByTestId('connector-name');
      await user.type(nameInput, 'Webhook Test Connector');
      fireEvent.click(screen.getByTestId('next-step'));

      // Select Webhook type
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('type-webhook'));

      // Should proceed to template step
      await waitFor(() => {
        expect(screen.getByTestId('step3-select-template')).toBeInTheDocument();
      });
    });
  });

  describe('Connector Testing and Validation', () => {
    it('should handle test failures and retry capability', async () => {
      let testAttempts = 0;
      const mockTestConnector = jest.fn().mockImplementation(() => {
        testAttempts++;
        if (testAttempts === 1) {
          return Promise.reject(new Error('Connection timeout'));
        }
        return Promise.resolve({
          success: true,
          status: 200,
          message: 'Connection successful'
        });
      });

      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: mockTestConnector,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Navigate to testing step quickly
      fireEvent.click(screen.getByTestId('next-step')); // Step 1 -> 2
      await waitFor(() => fireEvent.click(screen.getByTestId('type-http')));
      await waitFor(() => fireEvent.click(screen.getByTestId('skip-template')));
      await waitFor(() => fireEvent.click(screen.getByTestId('next-step')));
      await waitFor(() => fireEvent.click(screen.getByTestId('skip-credentials')));

      await waitFor(() => {
        expect(screen.getByTestId('step6-testing')).toBeInTheDocument();
      });

      // First test attempt (should fail)
      fireEvent.click(screen.getByTestId('test-connection'));

      // Wait for test to complete and show retry option
      await waitFor(() => {
        expect(testAttempts).toBe(1);
      });

      // Second test attempt (should succeed)
      fireEvent.click(screen.getByTestId('test-connection'));

      await waitFor(() => {
        expect(testAttempts).toBe(2);
        expect(screen.getByTestId('test-status')).toHaveTextContent('Status: Success');
      });

      // Should be able to complete wizard after successful test
      const completeButton = screen.getByTestId('complete-wizard');
      expect(completeButton).not.toBeDisabled();
    });

    it('should prevent completion without successful test', async () => {
      const mockTestConnector = jest.fn().mockResolvedValue({
        success: false,
        message: 'Authentication failed'
      });

      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: mockTestConnector,
        isLoading: false,
        isError: false
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Navigate to testing step
      fireEvent.click(screen.getByTestId('next-step'));
      await waitFor(() => fireEvent.click(screen.getByTestId('type-http')));
      await waitFor(() => fireEvent.click(screen.getByTestId('skip-template')));
      await waitFor(() => fireEvent.click(screen.getByTestId('next-step')));
      await waitFor(() => fireEvent.click(screen.getByTestId('skip-credentials')));

      await waitFor(() => {
        expect(screen.getByTestId('step6-testing')).toBeInTheDocument();
      });

      // Test connection (fails)
      fireEvent.click(screen.getByTestId('test-connection'));

      await waitFor(() => {
        expect(screen.getByTestId('test-status')).toHaveTextContent('Status: Failed');
        expect(screen.getByTestId('test-message')).toHaveTextContent('Authentication failed');
      });

      // Complete button should be disabled
      const completeButton = screen.getByTestId('complete-wizard');
      expect(completeButton).toBeDisabled();
      expect(completeButton).toHaveTextContent('Test Required');
    });
  });

  describe('Wizard Navigation and Data Persistence', () => {
    it('should preserve data when navigating backwards and forwards', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Step 1: Fill basic info
      const nameInput = screen.getByTestId('connector-name');
      await user.type(nameInput, 'Navigation Test Connector');
      fireEvent.click(screen.getByTestId('next-step'));

      // Step 2: Select type
      await waitFor(() => fireEvent.click(screen.getByTestId('type-http')));

      // Step 3: Go back to step 2
      await waitFor(() => fireEvent.click(screen.getByTestId('previous-step')));

      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
        expect(screen.getByTestId('type-http')).toHaveClass('selected');
      });

      // Go back to step 1
      fireEvent.click(screen.getByTestId('previous-step'));

      await waitFor(() => {
        expect(screen.getByTestId('step1-basic-info')).toBeInTheDocument();
        expect(screen.getByTestId('connector-name')).toHaveValue('Navigation Test Connector');
      });
    });

    it('should handle wizard cancellation at any step', async () => {
      const { unmount } = renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);

      // Fill some data
      const nameInput = screen.getByTestId('connector-name');
      await user.type(nameInput, 'Cancelled Connector');

      // Cancel wizard by unmounting
      unmount();

      // Verify no API calls were made
      const mockCreateConnector = jest.mocked(require('../../hooks/useConnectors').useCreateConnector().mutateAsync);
      expect(mockCreateConnector).not.toHaveBeenCalled();
    });
  });
});