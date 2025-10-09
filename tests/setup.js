/**
 * Test Setup Configuration
 * Global setup untuk semua test suites dengan SQLite test database
 */

require('dotenv').config();
const { beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const MockDatabase = require('./helpers/mockDb');

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PASSWORD_PEPPER = 'test-pepper-2025';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(30000);

// Global test database instance
global.testDb = null;

// Global test utilities
global.testUtils = {
    // Generate test JWT token
    generateTestToken(payload = {}) {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            {
                id: payload.id || 1,
                username: payload.username || 'testuser',
                role: payload.role || 'admin',
                ...payload
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    },

    // Wait for async operations
    async wait(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Get test database instance
    getTestDb() {
        return global.testDb;
    },

    // Create test database connection
    async createTestDb() {
        if (!global.testDb) {
            global.testDb = new MockDatabase();
            await global.testDb.connect();
            await global.testDb.createTables();
        }
        return global.testDb;
    },

    // Clean test database
    async cleanTestDb() {
        if (global.testDb) {
            await global.testDb.clearData();
        }
    },

    // Seed test database
    async seedTestDb() {
        if (global.testDb) {
            await global.testDb.seedTestData();
        }
    }
};

// Global setup
beforeAll(async () => {
    console.log('🧪 Setting up test environment...');
    
    try {
        // Create and setup test database
        await global.testUtils.createTestDb();
        await global.testUtils.seedTestDb();
        console.log('✅ Test environment ready with SQLite database');
    } catch (error) {
        console.error('❌ Failed to setup test database:', error.message);
        console.log('⚠️  Continuing with tests that don\'t require database...');
    }
});

// Global teardown
afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    
    try {
        if (global.testDb) {
            await global.testDb.disconnect();
            global.testDb = null;
        }
        console.log('✅ Test environment cleaned');
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    }
});

// Test isolation
beforeEach(async () => {
    // Clean database before each test
    if (global.testDb) {
        await global.testUtils.cleanTestDb();
        await global.testUtils.seedTestDb();
    }
});

afterEach(async () => {
    // Clean up after each test if needed
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});