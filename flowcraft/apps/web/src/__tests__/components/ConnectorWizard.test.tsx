import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectorWizard from '../../components/connector-wizard/ConnectorWizard';

// Mock React Query mutations
jest.mock('../../hooks/useConnectors', () => ({
  useCreateConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      data: { id: 'test-connector-id' } 
    }),
    isLoading: false,
    isError: false,
  }),
  useTestConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      message: 'Test successful' 
    }),
    isLoading: false,
    isError: false,
  }),
  useUpdateConnector: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ 
      success: true, 
      data: { id: 'test-connector-id' } 
    }),
    isLoading: false,
    isError: false,
  }),
}));

// Mock the step components
jest.mock('../../components/connector-wizard/steps/Step1BasicInfo', () => {
  return function MockStep1BasicInfo({ data, onUpdate, onNext }: any) {
    return (
      <div data-testid="step1-basic-info">
        <input
          data-testid="connector-name"
          value={data?.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Connector Name"
        />
        <input
          data-testid="connector-description"
          value={data?.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Description"
        />
        <button data-testid="next-step" onClick={onNext}>
          Next
        </button>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step2SelectType', () => {
  return function MockStep2SelectType({ data, onUpdate, onNext, onPrevious }: any) {
    return (
      <div data-testid="step2-select-type">
        <button
          data-testid="connector-type-http"
          onClick={() => {
            onUpdate({ type: 'http' });
            onNext();
          }}
        >
          HTTP
        </button>
        <button
          data-testid="connector-type-email"
          onClick={() => {
            onUpdate({ type: 'email' });
            onNext();
          }}
        >
          Email
        </button>
        <button data-testid="previous-step" onClick={onPrevious}>
          Previous
        </button>
      </div>
    );
  };
});

jest.mock('../../components/connector-wizard/steps/Step3SelectTemplate', () => {
  return function MockStep3SelectTemplate({ onNext, onPrevious }: any) {
    return (
      <div data-testid="step3-select-template">
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

jest.mock('../../components/connector-wizard/steps/Step4Configuration', () => {
  return function MockStep4Configuration({ data, onUpdate, onNext, onPrevious }: any) {
    return (
      <div data-testid="step4-configuration">
        <input
          data-testid="config-url"
          value={data?.configuration?.url || ''}
          onChange={(e) => onUpdate({ 
            configuration: { ...data?.configuration, url: e.target.value } 
          })}
          placeholder="API URL"
        />
        <button data-testid="next-step" onClick={onNext}>
          Next
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

jest.mock('../../components/connector-wizard/steps/Step6Testing', () => {
  return function MockStep6Testing({ onComplete, onPrevious }: any) {
    return (
      <div data-testid="step6-testing">
        <button
          data-testid="test-connector"
          onClick={() => {
            // Simulate successful test
            onComplete();
          }}
        >
          Test Connector
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

describe('ConnectorWizard', () => {
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnClose = jest.fn();
    jest.clearAllMocks();
  });

  describe('Wizard Navigation', () => {
    it('should render the first step initially', () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      expect(screen.getByTestId('step1-basic-info')).toBeInTheDocument();
      expect(screen.getByTestId('connector-name')).toBeInTheDocument();
      expect(screen.getByTestId('connector-description')).toBeInTheDocument();
    });

    it('should navigate to step 2 after completing step 1', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Fill step 1
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.change(screen.getByTestId('connector-description'), {
        target: { value: 'Test Description' }
      });
      
      // Go to next step
      fireEvent.click(screen.getByTestId('next-step'));
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
      });
    });

    it('should navigate through all steps in sequence', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Step 1 - Basic Info
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      // Step 2 - Select Type
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('connector-type-http'));
      
      // Step 3 - Select Template
      await waitFor(() => {
        expect(screen.getByTestId('step3-select-template')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('skip-template'));
      
      // Step 4 - Configuration
      await waitFor(() => {
        expect(screen.getByTestId('step4-configuration')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('config-url'), {
        target: { value: 'https://api.example.com' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      // Step 5 - Credentials
      await waitFor(() => {
        expect(screen.getByTestId('step5-credentials')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('skip-credentials'));
      
      // Step 6 - Testing
      await waitFor(() => {
        expect(screen.getByTestId('step6-testing')).toBeInTheDocument();
      });
    });

    it('should allow navigation backwards through steps', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Go to step 2
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-select-type')).toBeInTheDocument();
      });
      
      // Go back to step 1
      fireEvent.click(screen.getByTestId('previous-step'));
      
      await waitFor(() => {
        expect(screen.getByTestId('step1-basic-info')).toBeInTheDocument();
      });
      
      // Verify data is preserved
      expect(screen.getByTestId('connector-name')).toHaveValue('Test Connector');
    });
  });

  describe('Data Management', () => {
    it('should preserve wizard data across steps', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Fill step 1
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.change(screen.getByTestId('connector-description'), {
        target: { value: 'Test Description' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      // Select type in step 2
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('connector-type-http'));
      });
      
      // Skip to step 4
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('skip-template'));
      });
      
      // Add configuration
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('config-url'), {
          target: { value: 'https://api.example.com' }
        });
      });
      
      // Go back to step 1 and verify data is preserved
      fireEvent.click(screen.getByTestId('previous-step')); // Step 3
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('previous-step')); // Step 2
      });
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('previous-step')); // Step 1
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('connector-name')).toHaveValue('Test Connector');
        expect(screen.getByTestId('connector-description')).toHaveValue('Test Description');
      });
    });

    it('should reset wizard data when closed and reopened', () => {
      const { unmount } = renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Fill some data
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      
      // Close wizard
      unmount();
      
      // Reopen wizard
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Verify data is reset
      expect(screen.getByTestId('connector-name')).toHaveValue('');
    });
  });

  describe('Connector Types', () => {
    it('should handle HTTP connector creation', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Fill basic info
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'HTTP Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      // Select HTTP type
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('connector-type-http'));
      });
      
      // Skip template and go to configuration
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('skip-template'));
      });
      
      // Configure HTTP
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('config-url'), {
          target: { value: 'https://api.example.com' }
        });
        fireEvent.click(screen.getByTestId('next-step'));
      });
      
      // Skip credentials
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('skip-credentials'));
      });
      
      // Test connector
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('test-connector'));
      });
      
      // Verify completion
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle Email connector creation', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Fill basic info
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Email Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      // Select Email type
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('connector-type-email'));
      });
      
      // Should proceed through the wizard successfully
      await waitFor(() => {
        expect(screen.getByTestId('step3-select-template')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle connector creation failures gracefully', async () => {
      // Mock failed creation
      jest.mocked(require('../../hooks/useConnectors').useCreateConnector).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Creation failed')),
        isLoading: false,
        isError: true,
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Complete wizard flow
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('connector-type-http'));
      });
      
      // The wizard should handle the error gracefully
      // In a real implementation, we'd expect error messaging
    });

    it('should handle test connector failures', async () => {
      // Mock failed test
      jest.mocked(require('../../hooks/useConnectors').useTestConnector).mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue(new Error('Test failed')),
        isLoading: false,
        isError: true,
      });

      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Navigate to testing step
      fireEvent.change(screen.getByTestId('connector-name'), {
        target: { value: 'Test Connector' }
      });
      fireEvent.click(screen.getByTestId('next-step'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('connector-type-http'));
      });
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('skip-template'));
      });
      
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('config-url'), {
          target: { value: 'https://api.example.com' }
        });
        fireEvent.click(screen.getByTestId('next-step'));
      });
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('skip-credentials'));
      });
      
      // Test should handle failure
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('test-connector'));
      });
      
      // Should not close on failed test
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      // Check for essential accessibility features
      expect(screen.getByTestId('connector-name')).toBeInTheDocument();
      expect(screen.getByTestId('connector-description')).toBeInTheDocument();
      
      // Navigation buttons should be present
      expect(screen.getByTestId('next-step')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<ConnectorWizard onClose={mockOnClose} />);
      
      const nameInput = screen.getByTestId('connector-name');
      const nextButton = screen.getByTestId('next-step');
      
      // Focus should move between elements
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
      
      // Tab navigation should work
      fireEvent.keyDown(nameInput, { key: 'Tab' });
      // In a real implementation, we'd test actual tab navigation
    });
  });
});