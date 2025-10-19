// tests/setup.js - Global test setup for Jest
const path = require('path');

// Import test utilities
const testUtils = require('./utils/testUtils');

// Setup global test utilities
global.testUtils = testUtils;

// Setup test database connection
global.getTestDb = testUtils.getTestDb;

// Setup JWT token generation
global.generateTestToken = testUtils.generateTestToken;

// Setup test data factories
global.createTestUser = testUtils.createTestUser;
global.createTestSchedule = testUtils.createTestSchedule;
global.createTestAttendance = testUtils.createTestAttendance;

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'absenta_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';

// Setup console for test output
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup test timeout
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
  // Cleanup test database if needed
  if (global.testUtils && global.testUtils.cleanup) {
    await global.testUtils.cleanup();
  }
});