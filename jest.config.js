// jest.config.js
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapping (fixed typo)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@/components/(.*)$': '<rootDir>/frontend/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/frontend/src/hooks/$1',
    '^@/config/(.*)$': '<rootDir>/frontend/src/config/$1',
    '^@/lib/(.*)$': '<rootDir>/frontend/src/lib/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Test patterns (exclude e2e/playwright tests)
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/security/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Exclude patterns
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
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
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    'backend/**/*.{js,ts}',
    'server_modern.js',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/main.tsx',
    '!frontend/src/App.tsx',
    '!frontend/src/vite-env.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/tests/**',
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
  moduleDirectories: ['node_modules', 'frontend/src'],
  
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