# 🧪 Testing Guide - Sistem Absenta

## 📋 Overview

Panduan lengkap untuk testing sistem Absenta dengan comprehensive test suite yang mencakup unit tests, integration tests, E2E tests, performance tests, dan security tests.

## 🏗️ Test Infrastructure

### Test Structure
```
tests/
├── unit/                    # Unit tests (85%+ coverage target)
│   ├── auth/               # Authentication tests
│   ├── models/             # Database model tests
│   ├── business/           # Business logic tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests (75%+ coverage target)
│   ├── api/               # API endpoint tests
│   ├── database/          # Database integration tests
│   └── features/          # Feature integration tests
├── e2e/                   # End-to-end tests (60%+ coverage target)
│   ├── admin/             # Admin flow tests
│   ├── teacher/           # Teacher flow tests
│   └── student/           # Student flow tests
├── performance/           # Performance tests
│   └── load-test.yml      # Artillery load test config
├── security/              # Security tests
│   └── security.test.js   # Security test suite
├── helpers/               # Test utilities
│   ├── authHelper.js      # Authentication helpers
│   ├── dbHelper.js        # Database helpers
│   ├── mockData.js        # Mock data factory
│   └── apiHelper.js       # API testing helpers
└── fixtures/              # Test fixtures
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Setup test database
mysql -u root -p -e "CREATE DATABASE absenta_test;"
mysql -u root -p absenta_test < absenta13.sql
```

### Running Tests

#### All Tests
```bash
npm run test:all
```

#### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security

# E2E tests only
npm run test:e2e

# Performance tests only
npm run test:performance
```

#### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/html-report/index.html
```

#### Watch Mode
```bash
# Watch mode for development
npm run test:watch
```

## 📊 Test Coverage

### Coverage Targets
- **Overall**: ≥80%
- **Unit Tests**: ≥85%
- **Integration Tests**: ≥75%
- **E2E Tests**: ≥60% (critical paths)

### Coverage Reports
- **Text**: Console output during test run
- **HTML**: `coverage/html-report/index.html`
- **LCOV**: `coverage/lcov.info` (for CI/CD)
- **JSON**: `coverage/coverage-summary.json`

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
export default {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js',
        '**/tests/security/**/*.test.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
```

### Playwright Configuration
```javascript
// playwright.config.js
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
```

## 🧪 Test Types

### 1. Unit Tests
**Location**: `tests/unit/`
**Purpose**: Test individual functions and components in isolation
**Coverage Target**: 85%+

#### Example Unit Test
```javascript
describe('Authentication - Login', () => {
    it('should hash password with pepper correctly', async () => {
        const password = 'testpass123';
        const hashedPassword = await authHelper.hashPassword(password);
        
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        
        const isValid = await authHelper.verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);
    });
});
```

### 2. Integration Tests
**Location**: `tests/integration/`
**Purpose**: Test API endpoints and database interactions
**Coverage Target**: 75%+

#### Example Integration Test
```javascript
describe('Admin API Integration Tests', () => {
    it('should allow admin access to admin endpoints', async () => {
        const response = await apiHelper.authenticatedGet('/api/admin/dashboard', adminToken);
        
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
    });
});
```

### 3. E2E Tests
**Location**: `tests/e2e/`
**Purpose**: Test complete user workflows
**Coverage Target**: 60%+ (critical paths)

#### Example E2E Test
```javascript
test('Teacher complete attendance flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="username"]', 'guru001');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="teacher-dashboard"]')).toBeVisible();
    
    await page.click('[data-testid="attendance-menu"]');
    await page.click('[data-testid="record-attendance"]');
    await page.click('[data-testid="status-hadir"]');
    await page.click('[data-testid="submit-attendance"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 4. Performance Tests
**Location**: `tests/performance/`
**Purpose**: Test system performance under load
**Tool**: Artillery

#### Example Performance Test
```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 5
    - duration: 300
      arrivalRate: 20
    - duration: 60
      arrivalRate: 5

scenarios:
  - name: "Admin Login Flow"
    weight: 30
    flow:
      - post:
          url: "/api/login"
          json:
            username: "admin"
            password: "admin123"
```

### 5. Security Tests
**Location**: `tests/security/`
**Purpose**: Test security vulnerabilities and protections
**Coverage**: SQL injection, XSS, authentication, authorization

#### Example Security Test
```javascript
describe('Security Tests', () => {
    it('should prevent SQL injection in login', async () => {
        const maliciousPayloads = [
            "admin'; DROP TABLE users; --",
            "admin' OR '1'='1"
        ];

        for (const payload of maliciousPayloads) {
            const response = await apiHelper.post('/api/login', {
                username: payload,
                password: 'anything'
            });

            expect(response.status).toBe(401);
            expect(response.data.success).toBe(false);
        }
    });
});
```

## 🛠️ Test Utilities

### Authentication Helper
```javascript
import { authHelper } from './helpers/authHelper.js';

// Generate test tokens
const adminToken = authHelper.generateAdminToken();
const teacherToken = authHelper.generateTeacherToken();
const studentToken = authHelper.generateStudentToken();

// Hash passwords
const hashedPassword = await authHelper.hashPassword('password123');
const isValid = await authHelper.verifyPassword('password123', hashedPassword);
```

### Database Helper
```javascript
import { dbHelper } from './helpers/dbHelper.js';

// Clean test database
await dbHelper.cleanAll();

// Seed test data
await dbHelper.seedBasicData();

// Query database
const users = await dbHelper.query('SELECT * FROM users WHERE role = ?', ['admin']);
```

### API Helper
```javascript
import { apiHelper } from './helpers/apiHelper.js';

// Make authenticated requests
const response = await apiHelper.authenticatedGet('/api/admin/dashboard', adminToken);

// Test file uploads
const response = await apiHelper.uploadFile('/api/admin/upload', fileData, adminToken);
```

### Mock Data Factory
```javascript
import { MockDataFactory } from './helpers/mockData.js';

// Generate test data
const userData = MockDataFactory.createUser({
    username: 'testuser',
    email: 'test@example.com'
});

const teacherData = MockDataFactory.createTeacher({
    nama: 'Guru Test',
    mapel_id: 1
});
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: absenta_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:security
      - run: npm run test:coverage
```

### Quality Gates
- ✅ All tests must pass
- ✅ Coverage >= 80%
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks met
- ✅ Linter passes

## 📈 Performance Benchmarks

### Target Metrics
- **API Response**: <2s (cached), <5s (fresh)
- **Database Queries**: <100ms average
- **Concurrent Users**: 150+ without degradation
- **Page Load**: <3s initial, <1s subsequent

### Load Testing
```bash
# Run performance tests
npm run test:performance

# Custom load test
artillery run tests/performance/custom-load-test.yml
```

## 🔒 Security Testing

### Security Test Categories
1. **SQL Injection Prevention**
2. **XSS Protection**
3. **Authentication Security**
4. **Authorization Controls**
5. **Input Validation**
6. **Session Management**
7. **Data Encryption**

### Security Test Commands
```bash
# Run security tests
npm run test:security

# Run security audit
npm audit

# Run custom security tests
npm run test:security:custom
```

## 🐛 Debugging Tests

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connection
mysql -u root -p -e "SELECT 1;"

# Verify test database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'absenta_test';"
```

#### 2. Test Timeout Issues
```javascript
// Increase timeout for specific test
it('should handle long operation', async () => {
    // Test code
}, 30000); // 30 second timeout
```

#### 3. Flaky E2E Tests
```javascript
// Add proper waits
await page.waitForSelector('[data-testid="element"]');
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

### Debug Commands
```bash
# Run specific test file
npm test tests/unit/auth/login.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode
npm run test:watch

# Debug specific test
npm test -- --testNamePattern="should hash password"
```

## 📚 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Test Data Management
- Use factories for test data generation
- Clean up after each test
- Use realistic test data
- Avoid hardcoded values

### 3. Assertions
- Use specific assertions
- Test both positive and negative cases
- Verify error messages and status codes
- Check data integrity

### 4. Performance
- Mock external services
- Use database transactions for isolation
- Parallelize tests where possible
- Monitor test execution time

### 5. Security
- Test all input validation
- Verify authentication and authorization
- Test for common vulnerabilities
- Use secure test data

## 📊 Test Reports

### HTML Reports
- **Jest HTML Reporter**: `coverage/html-report/index.html`
- **Playwright Report**: `playwright-report/index.html`
- **Artillery Report**: `artillery-report/index.html`

### JSON Reports
- **Coverage**: `coverage/coverage-summary.json`
- **Test Results**: `test-results.json`
- **Performance**: `artillery-report.json`

### CI/CD Reports
- **GitHub Actions**: Check Actions tab in repository
- **Codecov**: Coverage reports in PR comments
- **Artifacts**: Test results and reports uploaded as artifacts

## 🎯 Success Criteria

### Test Coverage
- ✅ Overall coverage ≥80%
- ✅ Unit test coverage ≥85%
- ✅ Integration test coverage ≥75%
- ✅ E2E test coverage ≥60%

### Test Quality
- ✅ All tests pass consistently
- ✅ Tests run in <10 minutes
- ✅ No flaky tests
- ✅ Clear error messages

### Security
- ✅ No critical vulnerabilities
- ✅ All security tests pass
- ✅ Input validation comprehensive
- ✅ Authentication/authorization secure

### Performance
- ✅ All performance targets met
- ✅ Load tests pass
- ✅ Response times acceptable
- ✅ No memory leaks

## 📞 Support

### Getting Help
1. Check this guide first
2. Review test logs and error messages
3. Check GitHub Issues for known problems
4. Ask team for assistance

### Contributing
1. Follow test naming conventions
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

---

**Last Updated**: 2025-01-09  
**Version**: 1.0.0  
**Maintainer**: Development Team
