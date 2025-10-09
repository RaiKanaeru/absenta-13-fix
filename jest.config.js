export default {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js',
        '**/tests/security/**/*.test.js'
    ],
    collectCoverageFrom: [
        'server_modern.js',
        'db.js',
        'logger.js',
        'cache.js',
        'response-helper.js',
        'backend/utils/*.js',
        'src/components/*.tsx',
        'src/utils/*.ts',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**',
        '!**/dist/**',
        '!**/build/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        './server_modern.js': {
            branches: 70,
            functions: 75,
            lines: 75,
            statements: 75
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    verbose: true,
    testEnvironmentOptions: {
        url: 'http://localhost:3001'
    },
    reporters: [
        'default'
    ],
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    }
};