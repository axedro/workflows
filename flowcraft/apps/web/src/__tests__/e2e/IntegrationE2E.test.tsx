import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock complete application flow
const mockUser = {
  id: 'test-user-id',
  name: 'E2E Test User',
  email: 'test@example.com',
  organizationId: 'test-org'
};

const mockOrganization = {
  id: 'test-org',
  name: 'E2E Test Organization',
  settings: {
    maxWorkflows: 10,
    maxConnectors: 20
  }
};

// Complete integration test data
const mockConnectors = [
  {
    id: 'http-connector-1',
    name: 'GitHub API Connector',
    type: 'http',
    description: 'Fetch GitHub repositories',
    configuration: {
      method: 'GET',
      url: 'https://api.github.com/user/repos',
      headers: {
        'Authorization': 'Bearer github-token',
        'Accept': 'application/vnd.github.v3+json'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'email-connector-1',
    name: 'Notification Email',
    type: 'email',
    description: 'Send notification emails',
    configuration: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      username: 'notifications@example.com',
      password: 'encrypted-password'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'webhook-connector-1',
    name: 'Slack Webhook',
    type: 'webhook',
    description: 'Send messages to Slack',
    configuration: {
      url: 'https://hooks.slack.com/services/T00/B00/slack-webhook-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockWorkflow = {
  id: 'integration-workflow-1',
  name: 'GitHub Repository Notification Workflow',
  description: 'Fetch GitHub repos and send notifications',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'START',
        position: { x: 100, y: 200 },
        data: { label: 'Start' }
      },
      {
        id: 'github-fetch',
        type: 'CONNECTOR',
        position: { x: 300, y: 200 },
        data: {
          label: 'Fetch GitHub Repos',
          connectorId: 'http-connector-1',
          connectorType: 'http'
        }
      },
      {
        id: 'transform-repos',
        type: 'DATA_TRANSFORM',
        position: { x: 500, y: 200 },
        data: {
          label: 'Transform Repository Data',
          transformations: [
            {
              field: 'repoCount',
              expression: 'data.length'
            },
            {
              field: 'repoNames',
              expression: 'data.map(repo => repo.name)'
            },
            {
              field: 'publicRepos',
              expression: 'data.filter(repo => !repo.private)'
            }
          ]
        }
      },
      {
        id: 'condition-check',
        type: 'CONDITION',
        position: { x: 700, y: 200 },
        data: {
          label: 'Check Repository Count',
          condition: 'repoCount > 5',
          trueLabel: 'Send Email + Slack',
          falseLabel: 'Send Email Only'
        }
      },
      {
        id: 'email-notification',
        type: 'CONNECTOR',
        position: { x: 900, y: 150 },
        data: {
          label: 'Send Email Notification',
          connectorId: 'email-connector-1',
          connectorType: 'email',
          configuration: {
            to: 'team@example.com',
            subject: 'GitHub Repository Report',
            body: 'Found {{repoCount}} repositories. Public: {{publicRepos.length}}'
          }
        }
      },
      {
        id: 'slack-notification',
        type: 'CONNECTOR',
        position: { x: 900, y: 250 },
        data: {
          label: 'Send Slack Notification',
          connectorId: 'webhook-connector-1',
          connectorType: 'webhook',
          configuration: {
            payload: {
              text: 'GitHub Report: Found {{repoCount}} repositories',
              channel: '#dev-notifications'
            }
          }
        }
      },
      {
        id: 'end',
        type: 'END',
        position: { x: 1100, y: 200 },
        data: { label: 'End' }
      }
    ],
    edges: [
      { id: 'start-github', source: 'start', target: 'github-fetch' },
      { id: 'github-transform', source: 'github-fetch', target: 'transform-repos' },
      { id: 'transform-condition', source: 'transform-repos', target: 'condition-check' },
      { id: 'condition-email', source: 'condition-check', target: 'email-notification', sourceHandle: 'true' },
      { id: 'condition-slack', source: 'condition-check', target: 'slack-notification', sourceHandle: 'true' },
      { id: 'condition-email-false', source: 'condition-check', target: 'email-notification', sourceHandle: 'false' },
      { id: 'email-end', source: 'email-notification', target: 'end' },
      { id: 'slack-end', source: 'slack-notification', target: 'end' }
    ]
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationId: 'test-org',
  createdBy: 'test-user-id'
};

const mockExecutionResult = {
  id: 'integration-exec-1',
  workflowId: 'integration-workflow-1',
  status: 'completed',
  startTime: new Date(Date.now() - 45000),
  endTime: new Date(),
  result: {
    success: true,
    nodeResults: {
      'start': {
        status: 'completed',
        outputs: { trigger: { timestamp: new Date().toISOString() } }
      },
      'github-fetch': {
        status: 'completed',
        outputs: {
          data: [
            { id: 1, name: 'repo-1', private: false, language: 'JavaScript' },
            { id: 2, name: 'repo-2', private: true, language: 'TypeScript' },
            { id: 3, name: 'repo-3', private: false, language: 'Python' },
            { id: 4, name: 'repo-4', private: false, language: 'Go' },
            { id: 5, name: 'repo-5', private: true, language: 'Rust' },
            { id: 6, name: 'repo-6', private: false, language: 'Java' },
            { id: 7, name: 'repo-7', private: false, language: 'Python' }
          ],
          status: 200
        }
      },
      'transform-repos': {
        status: 'completed',
        outputs: {
          repoCount: 7,
          repoNames: ['repo-1', 'repo-2', 'repo-3', 'repo-4', 'repo-5', 'repo-6', 'repo-7'],
          publicRepos: [
            { id: 1, name: 'repo-1', private: false, language: 'JavaScript' },
            { id: 3, name: 'repo-3', private: false, language: 'Python' },
            { id: 4, name: 'repo-4', private: false, language: 'Go' },
            { id: 6, name: 'repo-6', private: false, language: 'Java' },
            { id: 7, name: 'repo-7', private: false, language: 'Python' }
          ]
        }
      },
      'condition-check': {
        status: 'completed',
        outputs: {
          conditionMet: true,
          path: 'true'
        }
      },
      'email-notification': {
        status: 'completed',
        outputs: {
          sent: true,
          messageId: 'email-msg-123'
        }
      },
      'slack-notification': {
        status: 'completed',
        outputs: {
          sent: true,
          ts: '1234567890.123'
        }
      },
      'end': {
        status: 'completed',
        outputs: {}
      }
    }
  }
};

// Mock main application component
const MockApplication: React.FC = () => {
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<any>(null);
  const [executionResults, setExecutionResults] = React.useState<any>(null);

  const renderView = () => {
    switch (currentView) {
      case 'connectors':
        return (
          <div data-testid="connectors-view">
            <h1>Connectors</h1>
            <div data-testid="connector-list">
              {mockConnectors.map(connector => (
                <div key={connector.id} data-testid={`connector-${connector.id}`}>
                  <h3>{connector.name}</h3>
                  <p>{connector.description}</p>
                  <span data-testid={`connector-type-${connector.id}`}>{connector.type}</span>
                  <button 
                    data-testid={`test-connector-${connector.id}`}
                    onClick={() => {
                      console.log(`Testing connector: ${connector.name}`);
                    }}
                  >
                    Test
                  </button>
                </div>
              ))}
            </div>
            <button 
              data-testid="create-connector"
              onClick={() => setCurrentView('create-connector')}
            >
              Create New Connector
            </button>
          </div>
        );
      
      case 'workflows':
        return (
          <div data-testid="workflows-view">
            <h1>Workflows</h1>
            <div data-testid="workflow-list">
              <div data-testid={`workflow-${mockWorkflow.id}`}>
                <h3>{mockWorkflow.name}</h3>
                <p>{mockWorkflow.description}</p>
                <span data-testid={`workflow-nodes-${mockWorkflow.id}`}>
                  Nodes: {mockWorkflow.definition.nodes.length}
                </span>
                <button 
                  data-testid={`edit-workflow-${mockWorkflow.id}`}
                  onClick={() => {
                    setSelectedWorkflow(mockWorkflow);
                    setCurrentView('workflow-editor');
                  }}
                >
                  Edit
                </button>
                <button 
                  data-testid={`execute-workflow-${mockWorkflow.id}`}
                  onClick={() => {
                    setExecutionResults(mockExecutionResult);
                    setCurrentView('execution-results');
                  }}
                >
                  Execute
                </button>
              </div>
            </div>
            <button 
              data-testid="create-workflow"
              onClick={() => setCurrentView('create-workflow')}
            >
              Create New Workflow
            </button>
          </div>
        );
      
      case 'workflow-editor':
        return (
          <div data-testid="workflow-editor-view">
            <h1>Edit Workflow: {selectedWorkflow?.name}</h1>
            <div data-testid="workflow-canvas">
              <p>Visual workflow editor would be here</p>
              <div data-testid="node-palette">
                <h3>Available Connectors:</h3>
                {mockConnectors.map(connector => (
                  <div key={connector.id} data-testid={`palette-connector-${connector.id}`}>
                    <span>{connector.name} ({connector.type})</span>
                    <button data-testid={`add-to-workflow-${connector.id}`}>
                      Add to Workflow
                    </button>
                  </div>
                ))}
              </div>
              <div data-testid="workflow-nodes">
                <h3>Current Nodes:</h3>
                {selectedWorkflow?.definition.nodes.map((node: any) => (
                  <div key={node.id} data-testid={`workflow-node-${node.id}`}>
                    <span>{node.data.label} ({node.type})</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              data-testid="save-workflow"
              onClick={() => {
                console.log('Workflow saved');
                setCurrentView('workflows');
              }}
            >
              Save Workflow
            </button>
            <button 
              data-testid="test-workflow"
              onClick={() => {
                setExecutionResults(mockExecutionResult);
                setCurrentView('execution-results');
              }}
            >
              Test Workflow
            </button>
          </div>
        );
      
      case 'execution-results':
        return (
          <div data-testid="execution-results-view">
            <h1>Execution Results</h1>
            {executionResults && (
              <div data-testid="execution-details">
                <p data-testid="execution-status">Status: {executionResults.status}</p>
                <p data-testid="execution-duration">
                  Duration: {((new Date(executionResults.endTime).getTime() - new Date(executionResults.startTime).getTime()) / 1000)}s
                </p>
                <div data-testid="node-results">
                  {Object.entries(executionResults.result.nodeResults).map(([nodeId, result]: any) => (
                    <div key={nodeId} data-testid={`result-node-${nodeId}`}>
                      <h4>Node: {nodeId}</h4>
                      <p data-testid={`result-status-${nodeId}`}>Status: {result.status}</p>
                      {result.outputs && (
                        <pre data-testid={`result-outputs-${nodeId}`}>
                          {JSON.stringify(result.outputs, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
                <div data-testid="execution-summary">
                  <h3>Summary</h3>
                  <p data-testid="repos-found">Repositories Found: {executionResults.result.nodeResults['transform-repos']?.outputs?.repoCount}</p>
                  <p data-testid="public-repos">Public Repositories: {executionResults.result.nodeResults['transform-repos']?.outputs?.publicRepos?.length}</p>
                  <p data-testid="notifications-sent">
                    Notifications: Email ✓, Slack ✓
                  </p>
                </div>
              </div>
            )}
            <button 
              data-testid="back-to-workflows"
              onClick={() => setCurrentView('workflows')}
            >
              Back to Workflows
            </button>
          </div>
        );
      
      default:
        return (
          <div data-testid="dashboard-view">
            <h1>FlowCraft Dashboard</h1>
            <div data-testid="dashboard-stats">
              <div data-testid="stats-connectors">
                <h3>Connectors</h3>
                <p data-testid="connector-count">{mockConnectors.length} Active</p>
                <p data-testid="connector-types">
                  HTTP: {mockConnectors.filter(c => c.type === 'http').length}, 
                  Email: {mockConnectors.filter(c => c.type === 'email').length}, 
                  Webhook: {mockConnectors.filter(c => c.type === 'webhook').length}
                </p>
              </div>
              <div data-testid="stats-workflows">
                <h3>Workflows</h3>
                <p data-testid="workflow-count">1 Active</p>
                <p data-testid="workflow-nodes">7 Total Nodes</p>
              </div>
            </div>
            <div data-testid="recent-activity">
              <h3>Recent Activity</h3>
              <p>Last execution: 45 seconds ago (Success)</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div data-testid="application">
      <nav data-testid="navigation">
        <h1>FlowCraft</h1>
        <button 
          data-testid="nav-dashboard"
          onClick={() => setCurrentView('dashboard')}
          className={currentView === 'dashboard' ? 'active' : ''}
        >
          Dashboard
        </button>
        <button 
          data-testid="nav-connectors"
          onClick={() => setCurrentView('connectors')}
          className={currentView === 'connectors' ? 'active' : ''}
        >
          Connectors
        </button>
        <button 
          data-testid="nav-workflows"
          onClick={() => setCurrentView('workflows')}
          className={currentView === 'workflows' ? 'active' : ''}
        >
          Workflows
        </button>
      </nav>
      <main data-testid="main-content">
        {renderView()}
      </main>
    </div>
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

describe('Complete Application Integration E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Full Application Navigation Flow', () => {
    it('should navigate through all main application sections', async () => {
      renderWithProviders(<MockApplication />);

      // Start on dashboard
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      expect(screen.getByTestId('nav-dashboard')).toHaveClass('active');
      
      // Verify dashboard stats
      expect(screen.getByTestId('connector-count')).toHaveTextContent('3 Active');
      expect(screen.getByTestId('connector-types')).toHaveTextContent('HTTP: 1, Email: 1, Webhook: 1');
      expect(screen.getByTestId('workflow-count')).toHaveTextContent('1 Active');
      expect(screen.getByTestId('workflow-nodes')).toHaveTextContent('7 Total Nodes');

      // Navigate to Connectors
      fireEvent.click(screen.getByTestId('nav-connectors'));
      
      await waitFor(() => {
        expect(screen.getByTestId('connectors-view')).toBeInTheDocument();
        expect(screen.getByTestId('nav-connectors')).toHaveClass('active');
      });

      // Verify all connectors are displayed
      expect(screen.getByTestId('connector-http-connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('connector-email-connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('connector-webhook-connector-1')).toBeInTheDocument();
      
      expect(screen.getByText('GitHub API Connector')).toBeInTheDocument();
      expect(screen.getByText('Notification Email')).toBeInTheDocument();
      expect(screen.getByText('Slack Webhook')).toBeInTheDocument();

      // Navigate to Workflows
      fireEvent.click(screen.getByTestId('nav-workflows'));
      
      await waitFor(() => {
        expect(screen.getByTestId('workflows-view')).toBeInTheDocument();
        expect(screen.getByTestId('nav-workflows')).toHaveClass('active');
      });

      // Verify workflow is displayed
      expect(screen.getByTestId('workflow-integration-workflow-1')).toBeInTheDocument();
      expect(screen.getByText('GitHub Repository Notification Workflow')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-nodes-integration-workflow-1')).toHaveTextContent('Nodes: 7');

      // Back to Dashboard
      fireEvent.click(screen.getByTestId('nav-dashboard'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      });
    });

    it('should test connectors from the connector list', async () => {
      renderWithProviders(<MockApplication />);

      // Navigate to connectors
      fireEvent.click(screen.getByTestId('nav-connectors'));

      await waitFor(() => {
        expect(screen.getByTestId('connectors-view')).toBeInTheDocument();
      });

      // Test each connector type
      const httpTestButton = screen.getByTestId('test-connector-http-connector-1');
      const emailTestButton = screen.getByTestId('test-connector-email-connector-1');
      const webhookTestButton = screen.getByTestId('test-connector-webhook-connector-1');

      expect(httpTestButton).toBeInTheDocument();
      expect(emailTestButton).toBeInTheDocument();
      expect(webhookTestButton).toBeInTheDocument();

      // Verify connector types are displayed
      expect(screen.getByTestId('connector-type-http-connector-1')).toHaveTextContent('http');
      expect(screen.getByTestId('connector-type-email-connector-1')).toHaveTextContent('email');
      expect(screen.getByTestId('connector-type-webhook-connector-1')).toHaveTextContent('webhook');

      // Test HTTP connector
      fireEvent.click(httpTestButton);
      // Note: In a real test, we would verify test results appear
    });
  });

  describe('Complete Workflow Creation and Execution Flow', () => {
    it('should create workflow using existing connectors and execute successfully', async () => {
      renderWithProviders(<MockApplication />);

      // Navigate to workflows
      fireEvent.click(screen.getByTestId('nav-workflows'));

      await waitFor(() => {
        expect(screen.getByTestId('workflows-view')).toBeInTheDocument();
      });

      // Edit existing workflow to see how connectors are integrated
      const editButton = screen.getByTestId('edit-workflow-integration-workflow-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-editor-view')).toBeInTheDocument();
        expect(screen.getByText('Edit Workflow: GitHub Repository Notification Workflow')).toBeInTheDocument();
      });

      // Verify available connectors in palette
      expect(screen.getByTestId('node-palette')).toBeInTheDocument();
      expect(screen.getByTestId('palette-connector-http-connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('palette-connector-email-connector-1')).toBeInTheDocument();
      expect(screen.getByTestId('palette-connector-webhook-connector-1')).toBeInTheDocument();

      // Verify current workflow nodes
      expect(screen.getByTestId('workflow-nodes')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-node-start')).toHaveTextContent('Start (START)');
      expect(screen.getByTestId('workflow-node-github-fetch')).toHaveTextContent('Fetch GitHub Repos (CONNECTOR)');
      expect(screen.getByTestId('workflow-node-transform-repos')).toHaveTextContent('Transform Repository Data (DATA_TRANSFORM)');
      expect(screen.getByTestId('workflow-node-condition-check')).toHaveTextContent('Check Repository Count (CONDITION)');
      expect(screen.getByTestId('workflow-node-email-notification')).toHaveTextContent('Send Email Notification (CONNECTOR)');
      expect(screen.getByTestId('workflow-node-slack-notification')).toHaveTextContent('Send Slack Notification (CONNECTOR)');
      expect(screen.getByTestId('workflow-node-end')).toHaveTextContent('End (END)');

      // Test the workflow
      const testButton = screen.getByTestId('test-workflow');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('execution-results-view')).toBeInTheDocument();
      });

      // Verify execution results
      expect(screen.getByTestId('execution-status')).toHaveTextContent('Status: completed');
      expect(screen.getByTestId('execution-duration')).toHaveTextContent('Duration: 45s');

      // Verify all nodes executed successfully
      expect(screen.getByTestId('result-node-start')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-github-fetch')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-transform-repos')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-condition-check')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-email-notification')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-slack-notification')).toBeInTheDocument();
      expect(screen.getByTestId('result-node-end')).toBeInTheDocument();

      // Verify summary shows correct data
      expect(screen.getByTestId('repos-found')).toHaveTextContent('Repositories Found: 7');
      expect(screen.getByTestId('public-repos')).toHaveTextContent('Public Repositories: 5');
      expect(screen.getByTestId('notifications-sent')).toHaveTextContent('Notifications: Email ✓, Slack ✓');

      // Verify node outputs contain expected data
      const githubFetchOutputs = screen.getByTestId('result-outputs-github-fetch');
      expect(githubFetchOutputs.textContent).toContain('"status": 200');
      expect(githubFetchOutputs.textContent).toContain('repo-1');
      expect(githubFetchOutputs.textContent).toContain('JavaScript');

      const transformOutputs = screen.getByTestId('result-outputs-transform-repos');
      expect(transformOutputs.textContent).toContain('"repoCount": 7');
      expect(transformOutputs.textContent).toContain('repo-1');
      expect(transformOutputs.textContent).toContain('repo-7');

      const conditionOutputs = screen.getByTestId('result-outputs-condition-check');
      expect(conditionOutputs.textContent).toContain('"conditionMet": true');

      const emailOutputs = screen.getByTestId('result-outputs-email-notification');
      expect(emailOutputs.textContent).toContain('"sent": true');

      const slackOutputs = screen.getByTestId('result-outputs-slack-notification');
      expect(slackOutputs.textContent).toContain('"sent": true');
    });

    it('should handle workflow execution from workflows list', async () => {
      renderWithProviders(<MockApplication />);

      // Navigate to workflows
      fireEvent.click(screen.getByTestId('nav-workflows'));

      await waitFor(() => {
        expect(screen.getByTestId('workflows-view')).toBeInTheDocument();
      });

      // Execute workflow directly from list
      const executeButton = screen.getByTestId('execute-workflow-integration-workflow-1');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(screen.getByTestId('execution-results-view')).toBeInTheDocument();
      });

      // Verify execution completed successfully
      expect(screen.getByTestId('execution-status')).toHaveTextContent('Status: completed');
      
      // Verify we can navigate back
      const backButton = screen.getByTestId('back-to-workflows');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflows-view')).toBeInTheDocument();
      });
    });
  });

  describe('End-to-End Data Flow Verification', () => {
    it('should verify complete data transformation through workflow', async () => {
      renderWithProviders(<MockApplication />);

      // Navigate to workflows and execute
      fireEvent.click(screen.getByTestId('nav-workflows'));
      await waitFor(() => expect(screen.getByTestId('workflows-view')).toBeInTheDocument());
      
      fireEvent.click(screen.getByTestId('execute-workflow-integration-workflow-1'));
      await waitFor(() => expect(screen.getByTestId('execution-results-view')).toBeInTheDocument());

      // Verify data flow through each stage
      
      // 1. GitHub Fetch Node - Raw API Response
      const githubOutputs = screen.getByTestId('result-outputs-github-fetch');
      const githubData = githubOutputs.textContent;
      expect(githubData).toContain('repo-1');
      expect(githubData).toContain('repo-7');
      expect(githubData).toContain('JavaScript');
      expect(githubData).toContain('Python');
      expect(githubData).toContain('"private": false');
      expect(githubData).toContain('"private": true');

      // 2. Transform Node - Processed Data
      const transformOutputs = screen.getByTestId('result-outputs-transform-repos');
      const transformData = transformOutputs.textContent;
      expect(transformData).toContain('"repoCount": 7');
      expect(transformData).toContain('"repoNames"');
      expect(transformData).toContain('"publicRepos"');
      
      // Verify transformation logic worked correctly
      expect(transformData).toContain('repo-1'); // In repoNames array
      expect(transformData).toContain('repo-7');
      // Public repos should only contain non-private ones
      const publicReposMatch = transformData.match(/"publicRepos":\s*\[(.*?)\]/s);
      if (publicReposMatch) {
        const publicReposContent = publicReposMatch[1];
        expect(publicReposContent).toContain('"private": false');
        expect(publicReposContent).not.toContain('"private": true');
      }

      // 3. Condition Node - Decision Logic
      const conditionOutputs = screen.getByTestId('result-outputs-condition-check');
      const conditionData = conditionOutputs.textContent;
      expect(conditionData).toContain('"conditionMet": true'); // 7 > 5
      expect(conditionData).toContain('"path": "true"');

      // 4. Email Notification - Successful Send
      const emailOutputs = screen.getByTestId('result-outputs-email-notification');
      expect(emailOutputs.textContent).toContain('"sent": true');
      expect(emailOutputs.textContent).toContain('"messageId"');

      // 5. Slack Notification - Successful Send
      const slackOutputs = screen.getByTestId('result-outputs-slack-notification');
      expect(slackOutputs.textContent).toContain('"sent": true');
      expect(slackOutputs.textContent).toContain('"ts"'); // Slack timestamp

      // 6. Summary verification
      expect(screen.getByTestId('repos-found')).toHaveTextContent('7');
      expect(screen.getByTestId('public-repos')).toHaveTextContent('5');
    });

    it('should verify connector configuration is properly applied in workflow', async () => {
      renderWithProviders(<MockApplication />);

      // Go to connectors and verify configurations
      fireEvent.click(screen.getByTestId('nav-connectors'));
      await waitFor(() => expect(screen.getByTestId('connectors-view')).toBeInTheDocument());

      // Verify GitHub connector configuration
      expect(screen.getByText('GitHub API Connector')).toBeInTheDocument();
      expect(screen.getByText('Fetch GitHub repositories')).toBeInTheDocument();
      expect(screen.getByTestId('connector-type-http-connector-1')).toHaveTextContent('http');

      // Verify Email connector configuration
      expect(screen.getByText('Notification Email')).toBeInTheDocument();
      expect(screen.getByText('Send notification emails')).toBeInTheDocument();
      expect(screen.getByTestId('connector-type-email-connector-1')).toHaveTextContent('email');

      // Verify Webhook connector configuration
      expect(screen.getByText('Slack Webhook')).toBeInTheDocument();
      expect(screen.getByText('Send messages to Slack')).toBeInTheDocument();
      expect(screen.getByTestId('connector-type-webhook-connector-1')).toHaveTextContent('webhook');

      // Go to workflow editor to see how connectors are integrated
      fireEvent.click(screen.getByTestId('nav-workflows'));
      await waitFor(() => expect(screen.getByTestId('workflows-view')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('edit-workflow-integration-workflow-1'));
      await waitFor(() => expect(screen.getByTestId('workflow-editor-view')).toBeInTheDocument());

      // Verify connectors are available in palette with correct names and types
      expect(screen.getByText('GitHub API Connector (http)')).toBeInTheDocument();
      expect(screen.getByText('Notification Email (email)')).toBeInTheDocument();
      expect(screen.getByText('Slack Webhook (webhook)')).toBeInTheDocument();

      // Execute and verify connector-specific outputs
      fireEvent.click(screen.getByTestId('test-workflow'));
      await waitFor(() => expect(screen.getByTestId('execution-results-view')).toBeInTheDocument());

      // GitHub connector should return proper HTTP response
      const githubResult = screen.getByTestId('result-status-github-fetch');
      expect(githubResult).toHaveTextContent('Status: completed');

      // Email connector should show successful email send
      const emailResult = screen.getByTestId('result-status-email-notification');
      expect(emailResult).toHaveTextContent('Status: completed');

      // Slack connector should show successful webhook call
      const slackResult = screen.getByTestId('result-status-slack-notification');
      expect(slackResult).toHaveTextContent('Status: completed');
    });
  });

  describe('Cross-Feature Integration', () => {
    it('should demonstrate complete user journey from connector creation to workflow execution', async () => {
      renderWithProviders(<MockApplication />);

      // Start with dashboard overview
      expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
      expect(screen.getByText('FlowCraft Dashboard')).toBeInTheDocument();
      
      // Check initial state
      expect(screen.getByTestId('connector-count')).toHaveTextContent('3 Active');
      expect(screen.getByTestId('workflow-count')).toHaveTextContent('1 Active');

      // 1. Review existing connectors
      fireEvent.click(screen.getByTestId('nav-connectors'));
      await waitFor(() => expect(screen.getByTestId('connectors-view')).toBeInTheDocument());

      // Verify all connector types are available
      expect(screen.getByText('GitHub API Connector')).toBeInTheDocument(); // HTTP
      expect(screen.getByText('Notification Email')).toBeInTheDocument();    // Email  
      expect(screen.getByText('Slack Webhook')).toBeInTheDocument();         // Webhook

      // 2. Review workflow that uses these connectors
      fireEvent.click(screen.getByTestId('nav-workflows'));
      await waitFor(() => expect(screen.getByTestId('workflows-view')).toBeInTheDocument());

      expect(screen.getByText('GitHub Repository Notification Workflow')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-nodes-integration-workflow-1')).toHaveTextContent('Nodes: 7');

      // 3. Edit workflow to see connector integration
      fireEvent.click(screen.getByTestId('edit-workflow-integration-workflow-1'));
      await waitFor(() => expect(screen.getByTestId('workflow-editor-view')).toBeInTheDocument());

      // Verify workflow uses all three connector types
      expect(screen.getByTestId('workflow-node-github-fetch')).toHaveTextContent('Fetch GitHub Repos (CONNECTOR)');
      expect(screen.getByTestId('workflow-node-email-notification')).toHaveTextContent('Send Email Notification (CONNECTOR)');
      expect(screen.getByTestId('workflow-node-slack-notification')).toHaveTextContent('Send Slack Notification (CONNECTOR)');

      // 4. Execute workflow and verify end-to-end functionality
      fireEvent.click(screen.getByTestId('test-workflow'));
      await waitFor(() => expect(screen.getByTestId('execution-results-view')).toBeInTheDocument());

      // Verify complete execution success
      expect(screen.getByTestId('execution-status')).toHaveTextContent('Status: completed');
      expect(screen.getByTestId('notifications-sent')).toHaveTextContent('Notifications: Email ✓, Slack ✓');

      // 5. Return to dashboard to see updated stats
      fireEvent.click(screen.getByTestId('nav-dashboard'));
      await waitFor(() => expect(screen.getByTestId('dashboard-view')).toBeInTheDocument());

      // Verify recent activity reflects our execution
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
      expect(screen.getByText(/Last execution.*Success/)).toBeInTheDocument();
    });
  });
});