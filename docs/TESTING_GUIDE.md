# Testing Guide - Absenta System

## Overview
This guide covers the comprehensive testing strategy for the Absenta attendance management system, including unit tests, integration tests, security tests, and performance tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── components/         # React component tests
│   ├── hooks/             # Custom hook tests
│   ├── utils/             # Utility function tests
│   └── backend/           # Backend middleware and utility tests
├── integration/           # Integration tests for API endpoints
├── security/             # Security and authentication tests
├── e2e/                  # End-to-end tests
├── performance/          # Performance and load tests
├── fixtures/             # Test data and fixtures
├── mocks/                # Mock implementations
├── utils/                # Test utilities and helpers
├── setup.js              # Test setup configuration
├── globalSetup.js        # Global test setup
├── globalTeardown.js     # Global test cleanup
└── run-tests.js          # Test runner script
```

## Test Categories

### 1. Unit Tests
Test individual components, functions, and modules in isolation.

**Coverage:**
- React components (rendering, props, state, events)
- Custom hooks (state management, side effects)
- Utility functions (data processing, validation)
- Backend middleware (authentication, validation, performance)
- API utilities (request/response handling)

**Commands:**
```bash
npm run test:unit              # Run all unit tests
npm run test:unit -- --watch   # Run unit tests in watch mode
npm run test:unit -- --verbose # Run with detailed output
```

### 2. Integration Tests
Test the interaction between different parts of the system.

**Coverage:**
- API endpoint functionality
- Database operations
- Authentication flows
- File upload/download
- Data validation and processing

**Commands:**
```bash
npm run test:integration       # Run integration tests
npm run test:integration -- --watch
```

### 3. Security Tests
Test security-related functionality and vulnerabilities.

**Coverage:**
- Authentication and authorization
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Account lockout mechanisms

**Commands:**
```bash
npm run test:security         # Run security tests
npm run test:security -- --verbose
```

### 4. End-to-End Tests
Test complete user workflows using Playwright.

**Coverage:**
- User login/logout flows
- Admin dashboard functionality
- Teacher attendance management
- Student data management
- Report generation
- File import/export

**Commands:**
```bash
npm run test:e2e              # Run E2E tests
npm run test:e2e -- --headed  # Run with browser UI
npm run test:e2e -- --debug   # Run in debug mode
```

### 5. Performance Tests
Test system performance under various loads.

**Coverage:**
- API response times
- Database query performance
- Memory usage
- CPU utilization
- Concurrent user handling

**Commands:**
```bash
npm run test:performance       # Run performance tests
npm run test:performance:report # Generate performance report
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Setup
```javascript
// tests/setup.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
});

// Mock global objects
global.fetch = jest.fn();
global.localStorage = mockLocalStorage();
```

## Writing Tests

### Component Tests
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/testUtils';
import Button from '../../../src/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Tests
```typescript
// tests/unit/hooks/useApi.test.ts
import { renderHook, act } from '@testing-library/react';
import { useApi } from '../../../src/hooks/useApi';

describe('useApi Hook', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useApi('/api/test'));
    
    await act(async () => {
      await result.current.fetch();
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

### API Tests
```typescript
// tests/integration/api/auth.test.ts
import request from 'supertest';
import app from '../../../server_modular.js';

describe('Authentication API', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

### Security Tests
```typescript
// tests/security/auth.test.ts
import request from 'supertest';
import app from '../../server_modular.js';

describe('Security Tests', () => {
  it('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: "admin'; DROP TABLE users; --",
        password: 'password'
      });

    expect(response.status).toBe(401);
    // Verify database is still intact
  });

  it('should enforce rate limiting', async () => {
    const promises = Array(10).fill(null).map(() =>
      request(app).post('/api/auth/login').send({
        username: 'admin',
        password: 'wrongpassword'
      })
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Test Utilities

### Custom Render Function
```typescript
// tests/utils/testUtils.js
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export const renderWithProviders = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
```

### Mock Data Factories
```typescript
// tests/utils/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  nama: 'Test User',
  role: 'admin',
  email: 'test@example.com',
  ...overrides,
});

export const createMockStudent = (overrides = {}) => ({
  id: 1,
  nama: 'Test Student',
  nis: '12345',
  kelas: 'X AK 1',
  ...overrides,
});
```

## Coverage Requirements

### Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports
```bash
npm run test:coverage        # Generate coverage report
npm run test:report          # Generate HTML coverage report
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking
- Mock external dependencies
- Use realistic mock data
- Clean up mocks between tests

### 3. Assertions
- Use specific assertions
- Test both positive and negative cases
- Verify error conditions

### 4. Performance
- Keep tests fast
- Use parallel execution where possible
- Avoid unnecessary setup/teardown

## Debugging Tests

### Running Specific Tests
```bash
npm test -- --testNamePattern="Button Component"
npm test -- --testPathPattern="components"
npm test -- --testPathPattern="auth"
```

### Debug Mode
```bash
npm test -- --detectOpenHandles --forceExit
npm test -- --verbose
```

### Watch Mode
```bash
npm test -- --watch
npm test -- --watchAll
```

## Test Data Management

### Fixtures
```typescript
// tests/fixtures/users.ts
export const adminUser = {
  id: 1,
  username: 'admin',
  nama: 'Administrator',
  role: 'admin',
  email: 'admin@example.com',
};

export const teacherUser = {
  id: 2,
  username: 'teacher',
  nama: 'Teacher User',
  role: 'guru',
  email: 'teacher@example.com',
};
```

### Database Seeding
```typescript
// tests/utils/seedDatabase.ts
export const seedTestDatabase = async () => {
  await db.execute('INSERT INTO pengguna VALUES (?, ?, ?, ?, ?, ?)', [
    1, 'admin', 'Administrator', 'admin', 'admin@example.com', 'hashed_password'
  ]);
};
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in jest.config.js
   - Check for unclosed promises
   - Use fake timers for time-dependent tests

2. **Mock not working**
   - Ensure mocks are hoisted
   - Check import paths
   - Use jest.doMock for dynamic imports

3. **Database connection issues**
   - Use test database
   - Clean up after tests
   - Use transactions for isolation

### Debug Commands
```bash
npm test -- --detectOpenHandles
npm test -- --forceExit
npm test -- --verbose --no-cache
```

## Conclusion

This testing strategy ensures:
- **Quality**: High test coverage and quality
- **Reliability**: Consistent test results
- **Maintainability**: Easy to update and extend
- **Performance**: Fast test execution
- **Security**: Comprehensive security testing

Follow this guide to maintain a robust testing suite for the Absenta system.
