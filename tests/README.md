# Absenta Testing Suite

Comprehensive testing suite untuk sistem Absenta yang mencakup unit tests, integration tests, security tests, E2E tests, dan performance tests.

## 📁 Struktur Testing

```
tests/
├── unit/                    # Unit tests
│   ├── auth/               # Authentication tests
│   ├── models/             # Database model tests
│   ├── business/           # Business logic tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests
│   ├── api/                # API endpoint tests
│   ├── database/           # Database integration tests
│   └── external/           # External service tests
├── security/               # Security tests
│   ├── sql-injection/      # SQL injection tests
│   ├── xss/                # XSS prevention tests
│   └── authentication/     # Authentication security tests
├── e2e/                    # End-to-end tests
│   ├── critical-flows/     # Critical user flow tests
│   ├── admin/              # Admin workflow tests
│   └── teacher/            # Teacher workflow tests
├── performance/            # Performance tests
│   ├── load-test.yml       # Artillery load test config
│   └── reports/            # Performance test reports
├── helpers/                # Test helper functions
│   ├── authHelper.js       # Authentication helpers
│   ├── dbHelper.js         # Database helpers
│   ├── apiHelper.js        # API testing helpers
│   └── mockData.js         # Mock data generators
├── fixtures/               # Test fixtures
│   └── sample-schedule.xlsx # Sample Excel file
├── config/                 # Test configuration
│   └── test.env            # Test environment variables
├── utils/                  # Test utilities
│   └── testRunner.js       # Test runner utilities
├── setup.js                # Global test setup
├── jest.config.js          # Jest configuration
├── playwright.config.js    # Playwright configuration
└── README.md               # This file
```

## 🚀 Menjalankan Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test database
npm run test:setup

# Load test environment
cp tests/config/test.env .env.test
```

### Basic Test Commands

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:security      # Security tests only
npm run test:e2e          # E2E tests only
npm run test:performance  # Performance tests only

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with verbose output
npm run test:verbose
```

### Advanced Test Commands

```bash
# Run tests with debugging
npm run test:debug

# Run tests with specific configuration
npm run test:ci            # CI/CD optimized
npm run test:quick         # Quick smoke tests
npm run test:smoke         # Smoke tests
npm run test:regression    # Regression tests
npm run test:acceptance    # Acceptance tests
npm run test:load          # Load tests
npm run test:quality       # Quality tests

# Generate reports
npm run test:report        # HTML coverage report
npm run test:performance:html  # Performance HTML report

# Clean up
npm run test:clean         # Clean test artifacts
```

## 🧪 Test Types

### 1. Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual functions and components
- **Coverage**: Authentication, models, business logic, utilities
- **Command**: `npm run test:unit`

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test API endpoints and database interactions
- **Coverage**: API endpoints, database operations, external services
- **Command**: `npm run test:integration`

### 3. Security Tests
- **Location**: `tests/security/`
- **Purpose**: Test security vulnerabilities and protections
- **Coverage**: SQL injection, XSS, authentication, authorization
- **Command**: `npm run test:security`

### 4. E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows
- **Coverage**: Critical user flows, admin workflows, teacher workflows
- **Command**: `npm run test:e2e`

### 5. Performance Tests
- **Location**: `tests/performance/`
- **Purpose**: Test system performance under load
- **Coverage**: Load testing, stress testing, performance benchmarks
- **Command**: `npm run test:performance`

## 🔧 Configuration

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
  collectCoverageFrom: [
    'server_modern.js',
    'db.js',
    'backend/utils/*.js',
    'src/components/*.tsx',
    'src/utils/*.ts'
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
export default {
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    timeout: 30000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
};
```

### Artillery Configuration
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 20
      name: "Sustained load"
```

## 📊 Test Coverage

### Coverage Targets
- **Global**: 80% minimum
- **Critical Files**: 75% minimum
- **New Code**: 90% minimum

### Coverage Reports
- **Text**: Console output
- **HTML**: `coverage/html-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`

## 🛠️ Test Helpers

### Authentication Helper
```javascript
import { authHelper } from './helpers/authHelper.js';

// Generate test tokens
const adminToken = authHelper.generateAdminToken();
const teacherToken = authHelper.generateTeacherToken(1);
const studentToken = authHelper.generateStudentToken(2000);

// Hash passwords
const hashedPassword = await authHelper.hashPassword('password123');
const isValid = await authHelper.verifyPassword('password123', hashedPassword);
```

### Database Helper
```javascript
import { dbHelper } from './helpers/dbHelper.js';

// Clean database
await dbHelper.cleanAll();

// Seed test data
await dbHelper.seedBasicData();

// Query database
const users = await dbHelper.query('SELECT * FROM users');
```

### API Helper
```javascript
import { apiHelper } from './helpers/apiHelper.js';

// Make authenticated requests
const response = await apiHelper.authenticatedGet('/api/admin/users', adminToken);

// Make POST requests
const response = await apiHelper.authenticatedPost('/api/admin/users', userData, adminToken);
```

### Mock Data Helper
```javascript
import { MockDataFactory } from './helpers/mockData.js';

// Generate test data
const userData = MockDataFactory.createUser({
  username: 'testuser',
  email: 'test@example.com'
});

const teacherData = MockDataFactory.createTeacher({
  id_guru: 1,
  nama_guru: 'Test Teacher'
});
```

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connection
   npm run test:setup
   ```

2. **Port Conflicts**
   ```bash
   # Kill processes on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

3. **Test Timeouts**
   ```bash
   # Run with debug mode
   npm run test:debug
   ```

4. **Memory Issues**
   ```bash
   # Increase Node.js memory
   NODE_OPTIONS="--max-old-space-size=4096" npm run test
   ```

### Debug Commands

```bash
# Run specific test file
npm run test -- tests/unit/auth/login.test.js

# Run tests with debugging
npm run test:debug

# Run tests with verbose output
npm run test:verbose

# Clear Jest cache
npm run test:clear-cache
```

## 📈 Performance Testing

### Load Testing
```bash
# Run basic load test
npm run test:performance

# Generate performance report
npm run test:performance:html

# Run custom load test
npx artillery run tests/performance/custom-load-test.yml
```

### Performance Metrics
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: > 100 requests/second
- **Error Rate**: < 1%
- **Memory Usage**: < 512MB
- **CPU Usage**: < 80%

## 🔒 Security Testing

### Security Test Categories
1. **SQL Injection Prevention**
2. **XSS Prevention**
3. **Authentication Security**
4. **Authorization Security**
5. **Input Validation**
6. **File Upload Security**
7. **Session Security**
8. **Rate Limiting**

### Security Test Commands
```bash
# Run all security tests
npm run test:security

# Run specific security test
npm run test -- tests/security/sql-injection.test.js

# Run security scan
npm run test:security:scan
```

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - run: npm run test:coverage
```

### Test Commands for CI
```bash
# Quick CI tests
npm run test:ci:quick

# Full CI tests
npm run test:ci:full

# CI with coverage
npm run test:ci:coverage

# CI with reports
npm run test:ci:report
```

## 📝 Best Practices

### Writing Tests
1. **Use descriptive test names**
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Test edge cases and error conditions**
4. **Keep tests independent and isolated**
5. **Use meaningful assertions**

### Test Organization
1. **Group related tests in describe blocks**
2. **Use beforeEach/afterEach for setup/cleanup**
3. **Mock external dependencies**
4. **Use test data factories**
5. **Keep tests fast and reliable**

### Performance Considerations
1. **Use test database for isolation**
2. **Clean up test data after each test**
3. **Mock external services**
4. **Use parallel execution where possible**
5. **Monitor test execution time**

## 🆘 Troubleshooting

### Common Problems

1. **Tests failing randomly**
   - Check for race conditions
   - Ensure proper test isolation
   - Use proper async/await patterns

2. **Database connection issues**
   - Verify database is running
   - Check connection credentials
   - Ensure test database exists

3. **Memory leaks in tests**
   - Close database connections
   - Clear event listeners
   - Use proper cleanup

4. **Slow test execution**
   - Use test database
   - Mock external services
   - Run tests in parallel

### Getting Help

1. **Check test logs** in `logs/test.log`
2. **Review coverage reports** in `coverage/`
3. **Check performance reports** in `tests/performance/reports/`
4. **Run tests with verbose output** using `npm run test:verbose`

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Artillery Documentation](https://artillery.io/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
