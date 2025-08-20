module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Global setup
  roots: ['<rootDir>'],
  
  // Test patterns - exclude frontend E2E tests for now
  testMatch: [
    '<rootDir>/packages/**/__tests__/**/*.test.ts',
    '<rootDir>/apps/api/src/__tests__/**/*.test.ts'
  ],
  
  // Ignore problematic E2E tests
  testPathIgnorePatterns: [
    'apps/web/src/__tests__/e2e/',
    'node_modules/'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'packages/connectors/src/**/*.ts',
    'apps/api/src/services/**/*.ts',
    'apps/api/src/routes/**/*.ts',
    'apps/web/src/components/**/*.tsx',
    'apps/web/src/services/**/*.ts',
    'apps/web/src/hooks/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@flowcraft/(.*)$': '<rootDir>/packages/$1/src',
    '^@/(.*)$': '<rootDir>/apps/web/src/$1'
  },
  
  // Transform settings
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks
  clearMocks: true,
  
  // Verbose output
  verbose: true
};