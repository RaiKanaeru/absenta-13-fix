// jest.config.js
export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Test patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/security/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage paths
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/App.tsx',
    '!src/vite-env.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@sentry))',
  ],
  
  // Global setup
  globalSetup: '<rootDir>/tests/globalSetup.js',
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  
  // Test results processor
  testResultsProcessor: 'jest-html-reporters',
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      expand: true,
    }],
  ],
};