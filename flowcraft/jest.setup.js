// Global test setup for Jest
require('@testing-library/jest-dom');

// Add TextEncoder/TextDecoder for Node.js tests
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/flowcraft_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep errors for debugging
};

// Mock fetch globally
global.fetch = jest.fn();

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Mock user for authentication tests
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    organizationId: 'test-org-id',
    role: 'ADMIN'
  },
  
  // Mock connector data
  mockConnector: {
    id: 'test-connector-id',
    name: 'Test Connector',
    type: 'http',
    description: 'Test connector for unit tests',
    configuration: {
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: {}
    },
    isActive: true
  },
  
  // Mock workflow data
  mockWorkflow: {
    id: 'test-workflow-id',
    name: 'Test Workflow',
    description: 'Test workflow for unit tests',
    definition: {
      nodes: [],
      edges: []
    }
  }
};

// Suppress specific warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};