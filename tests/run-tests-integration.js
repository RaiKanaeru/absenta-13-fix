/**
 * Integration Test Runner
 * Menjalankan tests dengan integration testing dan API testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class IntegrationTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.integrationResults = {
      apiTests: [],
      databaseTests: [],
      serviceTests: [],
      middlewareTests: [],
      routeTests: [],
      authenticationTests: [],
      authorizationTests: [],
      dataFlowTests: [],
      errorHandlingTests: [],
      performanceTests: [],
      securityTests: [],
      recommendations: []
    };
    this.apiEndpoints = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/admin/users',
      '/api/admin/classes',
      '/api/admin/subjects',
      '/api/admin/schedules',
      '/api/guru/attendance',
      '/api/guru/classes',
      '/api/siswa/attendance',
      '/api/siswa/schedule',
      '/api/attendance/submit',
      '/api/attendance/reports',
      '/api/health',
      '/api/performance/metrics'
    ];
    this.integrationScenarios = [
      'User Authentication Flow',
      'Admin Management Flow',
      'Teacher Attendance Flow',
      'Student Data Flow',
      'Schedule Management Flow',
      'Report Generation Flow',
      'File Import Flow',
      'Error Handling Flow',
      'Security Flow',
      'Performance Flow'
    ];
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...\n');
    
    try {
      // Run API integration tests
      await this.runAPITests();
      
      // Run database integration tests
      await this.runDatabaseTests();
      
      // Run service integration tests
      await this.runServiceTests();
      
      // Run middleware integration tests
      await this.runMiddlewareTests();
      
      // Run route integration tests
      await this.runRouteTests();
      
      // Run authentication integration tests
      await this.runAuthenticationTests();
      
      // Run authorization integration tests
      await this.runAuthorizationTests();
      
      // Run data flow integration tests
      await this.runDataFlowTests();
      
      // Run error handling integration tests
      await this.runErrorHandlingTests();
      
      // Run performance integration tests
      await this.runPerformanceTests();
      
      // Run security integration tests
      await this.runSecurityTests();
      
      // Analyze integration results
      await this.analyzeIntegrationResults();
      
      // Generate integration report
      this.generateIntegrationReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Integration tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Integration tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runAPITests() {
    console.log('🌐 Running API integration tests...');
    
    for (const endpoint of this.apiEndpoints) {
      try {
        console.log(`🌐 Testing API endpoint: ${endpoint}...`);
        
        // Run API tests for specific endpoint
        execSync(`npx jest --testPathPattern="api" --testNamePattern="${endpoint}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.apiTests.push({
          endpoint: endpoint,
          status: 'passed',
          description: `API integration test for endpoint: ${endpoint}`
        });
        
        console.log(`✅ API endpoint ${endpoint} test passed`);
        
      } catch (error) {
        this.integrationResults.apiTests.push({
          endpoint: endpoint,
          status: 'failed',
          description: `API integration test for endpoint: ${endpoint}`,
          error: error.message
        });
        
        console.log(`❌ API endpoint ${endpoint} test failed: ${error.message}`);
      }
    }
  }

  async runDatabaseTests() {
    console.log('🗄️ Running database integration tests...');
    
    const databaseTests = [
      {
        name: 'Database Connection',
        command: 'npx jest --testPathPattern="database" --testNamePattern="connection"',
        description: 'Tests for database connection'
      },
      {
        name: 'Database Queries',
        command: 'npx jest --testPathPattern="database" --testNamePattern="queries"',
        description: 'Tests for database queries'
      },
      {
        name: 'Database Transactions',
        command: 'npx jest --testPathPattern="database" --testNamePattern="transactions"',
        description: 'Tests for database transactions'
      },
      {
        name: 'Database Migrations',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migrations"',
        description: 'Tests for database migrations'
      },
      {
        name: 'Database Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="performance"',
        description: 'Tests for database performance'
      }
    ];
    
    for (const test of databaseTests) {
      try {
        console.log(`🗄️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.databaseTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.databaseTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runServiceTests() {
    console.log('⚙️ Running service integration tests...');
    
    const serviceTests = [
      {
        name: 'Authentication Service',
        command: 'npx jest --testPathPattern="service" --testNamePattern="auth"',
        description: 'Tests for authentication service'
      },
      {
        name: 'User Service',
        command: 'npx jest --testPathPattern="service" --testNamePattern="user"',
        description: 'Tests for user service'
      },
      {
        name: 'Attendance Service',
        command: 'npx jest --testPathPattern="service" --testNamePattern="attendance"',
        description: 'Tests for attendance service'
      },
      {
        name: 'Schedule Service',
        command: 'npx jest --testPathPattern="service" --testNamePattern="schedule"',
        description: 'Tests for schedule service'
      },
      {
        name: 'Report Service',
        command: 'npx jest --testPathPattern="service" --testNamePattern="report"',
        description: 'Tests for report service'
      }
    ];
    
    for (const test of serviceTests) {
      try {
        console.log(`⚙️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.serviceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.serviceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runMiddlewareTests() {
    console.log('🔧 Running middleware integration tests...');
    
    const middlewareTests = [
      {
        name: 'Authentication Middleware',
        command: 'npx jest --testPathPattern="middleware" --testNamePattern="auth"',
        description: 'Tests for authentication middleware'
      },
      {
        name: 'Authorization Middleware',
        command: 'npx jest --testPathPattern="middleware" --testNamePattern="authorization"',
        description: 'Tests for authorization middleware'
      },
      {
        name: 'Validation Middleware',
        command: 'npx jest --testPathPattern="middleware" --testNamePattern="validation"',
        description: 'Tests for validation middleware'
      },
      {
        name: 'Rate Limiting Middleware',
        command: 'npx jest --testPathPattern="middleware" --testNamePattern="rate"',
        description: 'Tests for rate limiting middleware'
      },
      {
        name: 'Error Handling Middleware',
        command: 'npx jest --testPathPattern="middleware" --testNamePattern="error"',
        description: 'Tests for error handling middleware'
      }
    ];
    
    for (const test of middlewareTests) {
      try {
        console.log(`🔧 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.middlewareTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.middlewareTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runRouteTests() {
    console.log('🛣️ Running route integration tests...');
    
    const routeTests = [
      {
        name: 'Auth Routes',
        command: 'npx jest --testPathPattern="route" --testNamePattern="auth"',
        description: 'Tests for authentication routes'
      },
      {
        name: 'Admin Routes',
        command: 'npx jest --testPathPattern="route" --testNamePattern="admin"',
        description: 'Tests for admin routes'
      },
      {
        name: 'Teacher Routes',
        command: 'npx jest --testPathPattern="route" --testNamePattern="teacher"',
        description: 'Tests for teacher routes'
      },
      {
        name: 'Student Routes',
        command: 'npx jest --testPathPattern="route" --testNamePattern="student"',
        description: 'Tests for student routes'
      },
      {
        name: 'Attendance Routes',
        command: 'npx jest --testPathPattern="route" --testNamePattern="attendance"',
        description: 'Tests for attendance routes'
      }
    ];
    
    for (const test of routeTests) {
      try {
        console.log(`🛣️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.routeTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.routeTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAuthenticationTests() {
    console.log('🔐 Running authentication integration tests...');
    
    const authTests = [
      {
        name: 'Login Flow',
        command: 'npx jest --testPathPattern="auth" --testNamePattern="login"',
        description: 'Tests for login flow'
      },
      {
        name: 'Logout Flow',
        command: 'npx jest --testPathPattern="auth" --testNamePattern="logout"',
        description: 'Tests for logout flow'
      },
      {
        name: 'Token Validation',
        command: 'npx jest --testPathPattern="auth" --testNamePattern="token"',
        description: 'Tests for token validation'
      },
      {
        name: 'Password Reset',
        command: 'npx jest --testPathPattern="auth" --testNamePattern="password"',
        description: 'Tests for password reset'
      },
      {
        name: 'Session Management',
        command: 'npx jest --testPathPattern="auth" --testNamePattern="session"',
        description: 'Tests for session management'
      }
    ];
    
    for (const test of authTests) {
      try {
        console.log(`🔐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.authenticationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.authenticationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAuthorizationTests() {
    console.log('🛡️ Running authorization integration tests...');
    
    const authzTests = [
      {
        name: 'Role-Based Access',
        command: 'npx jest --testPathPattern="authz" --testNamePattern="role"',
        description: 'Tests for role-based access control'
      },
      {
        name: 'Permission Checks',
        command: 'npx jest --testPathPattern="authz" --testNamePattern="permission"',
        description: 'Tests for permission checks'
      },
      {
        name: 'Resource Access',
        command: 'npx jest --testPathPattern="authz" --testNamePattern="resource"',
        description: 'Tests for resource access control'
      },
      {
        name: 'API Access',
        command: 'npx jest --testPathPattern="authz" --testNamePattern="api"',
        description: 'Tests for API access control'
      },
      {
        name: 'Data Access',
        command: 'npx jest --testPathPattern="authz" --testNamePattern="data"',
        description: 'Tests for data access control'
      }
    ];
    
    for (const test of authzTests) {
      try {
        console.log(`🛡️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.authorizationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.authorizationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runDataFlowTests() {
    console.log('📊 Running data flow integration tests...');
    
    for (const scenario of this.integrationScenarios) {
      try {
        console.log(`📊 Testing data flow: ${scenario}...`);
        
        // Run data flow tests for specific scenario
        execSync(`npx jest --testPathPattern="dataflow" --testNamePattern="${scenario}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.dataFlowTests.push({
          scenario: scenario,
          status: 'passed',
          description: `Data flow integration test for scenario: ${scenario}`
        });
        
        console.log(`✅ Data flow ${scenario} test passed`);
        
      } catch (error) {
        this.integrationResults.dataFlowTests.push({
          scenario: scenario,
          status: 'failed',
          description: `Data flow integration test for scenario: ${scenario}`,
          error: error.message
        });
        
        console.log(`❌ Data flow ${scenario} test failed: ${error.message}`);
      }
    }
  }

  async runErrorHandlingTests() {
    console.log('⚠️ Running error handling integration tests...');
    
    const errorTests = [
      {
        name: 'API Error Handling',
        command: 'npx jest --testPathPattern="error" --testNamePattern="api"',
        description: 'Tests for API error handling'
      },
      {
        name: 'Database Error Handling',
        command: 'npx jest --testPathPattern="error" --testNamePattern="database"',
        description: 'Tests for database error handling'
      },
      {
        name: 'Validation Error Handling',
        command: 'npx jest --testPathPattern="error" --testNamePattern="validation"',
        description: 'Tests for validation error handling'
      },
      {
        name: 'Authentication Error Handling',
        command: 'npx jest --testPathPattern="error" --testNamePattern="auth"',
        description: 'Tests for authentication error handling'
      },
      {
        name: 'Authorization Error Handling',
        command: 'npx jest --testPathPattern="error" --testNamePattern="authorization"',
        description: 'Tests for authorization error handling'
      }
    ];
    
    for (const test of errorTests) {
      try {
        console.log(`⚠️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.errorHandlingTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.errorHandlingTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance integration tests...');
    
    const performanceTests = [
      {
        name: 'API Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="api"',
        description: 'Tests for API performance'
      },
      {
        name: 'Database Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="database"',
        description: 'Tests for database performance'
      },
      {
        name: 'Query Performance',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="query"',
        description: 'Tests for query performance'
      },
      {
        name: 'Response Time',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="response"',
        description: 'Tests for response time'
      },
      {
        name: 'Load Testing',
        command: 'npx jest --testPathPattern="performance" --testNamePattern="load"',
        description: 'Tests for load performance'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.performanceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runSecurityTests() {
    console.log('🔒 Running security integration tests...');
    
    const securityTests = [
      {
        name: 'Authentication Security',
        command: 'npx jest --testPathPattern="security" --testNamePattern="auth"',
        description: 'Tests for authentication security'
      },
      {
        name: 'Authorization Security',
        command: 'npx jest --testPathPattern="security" --testNamePattern="authorization"',
        description: 'Tests for authorization security'
      },
      {
        name: 'Input Validation',
        command: 'npx jest --testPathPattern="security" --testNamePattern="input"',
        description: 'Tests for input validation security'
      },
      {
        name: 'SQL Injection',
        command: 'npx jest --testPathPattern="security" --testNamePattern="sql"',
        description: 'Tests for SQL injection security'
      },
      {
        name: 'XSS Protection',
        command: 'npx jest --testPathPattern="security" --testNamePattern="xss"',
        description: 'Tests for XSS protection'
      }
    ];
    
    for (const test of securityTests) {
      try {
        console.log(`🔒 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.integrationResults.securityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.integrationResults.securityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeIntegrationResults() {
    console.log('📊 Analyzing integration results...');
    
    // Analyze all test categories
    const testCategories = [
      'apiTests', 'databaseTests', 'serviceTests', 'middlewareTests',
      'routeTests', 'authenticationTests', 'authorizationTests',
      'dataFlowTests', 'errorHandlingTests', 'performanceTests', 'securityTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.integrationResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generateIntegrationRecommendations();
    
    console.log(`📈 Integration Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  Integration issues found!');
    }
  }

  generateIntegrationRecommendations() {
    const recommendations = [];
    
    // Check for common integration issues
    const failedApiTests = this.integrationResults.apiTests.filter(t => t.status === 'failed');
    if (failedApiTests.length > 0) {
      recommendations.push('Fix failed API integration tests');
    }
    
    const failedDatabaseTests = this.integrationResults.databaseTests.filter(t => t.status === 'failed');
    if (failedDatabaseTests.length > 0) {
      recommendations.push('Address database integration issues');
    }
    
    const failedServiceTests = this.integrationResults.serviceTests.filter(t => t.status === 'failed');
    if (failedServiceTests.length > 0) {
      recommendations.push('Fix service integration issues');
    }
    
    const failedMiddlewareTests = this.integrationResults.middlewareTests.filter(t => t.status === 'failed');
    if (failedMiddlewareTests.length > 0) {
      recommendations.push('Address middleware integration issues');
    }
    
    const failedRouteTests = this.integrationResults.routeTests.filter(t => t.status === 'failed');
    if (failedRouteTests.length > 0) {
      recommendations.push('Fix route integration issues');
    }
    
    const failedAuthTests = this.integrationResults.authenticationTests.filter(t => t.status === 'failed');
    if (failedAuthTests.length > 0) {
      recommendations.push('Address authentication integration issues');
    }
    
    const failedAuthzTests = this.integrationResults.authorizationTests.filter(t => t.status === 'failed');
    if (failedAuthzTests.length > 0) {
      recommendations.push('Fix authorization integration issues');
    }
    
    const failedDataFlowTests = this.integrationResults.dataFlowTests.filter(t => t.status === 'failed');
    if (failedDataFlowTests.length > 0) {
      recommendations.push('Address data flow integration issues');
    }
    
    const failedErrorTests = this.integrationResults.errorHandlingTests.filter(t => t.status === 'failed');
    if (failedErrorTests.length > 0) {
      recommendations.push('Fix error handling integration issues');
    }
    
    const failedPerformanceTests = this.integrationResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Address performance integration issues');
    }
    
    const failedSecurityTests = this.integrationResults.securityTests.filter(t => t.status === 'failed');
    if (failedSecurityTests.length > 0) {
      recommendations.push('Fix security integration issues');
    }
    
    // General integration recommendations
    recommendations.push('Implement comprehensive integration testing');
    recommendations.push('Add API integration testing');
    recommendations.push('Implement database integration testing');
    recommendations.push('Add service integration testing');
    recommendations.push('Implement middleware integration testing');
    recommendations.push('Add route integration testing');
    recommendations.push('Implement authentication integration testing');
    recommendations.push('Add authorization integration testing');
    recommendations.push('Implement data flow integration testing');
    recommendations.push('Add error handling integration testing');
    recommendations.push('Implement performance integration testing');
    recommendations.push('Add security integration testing');
    recommendations.push('Implement integration test automation');
    recommendations.push('Add integration test monitoring');
    recommendations.push('Implement integration test reporting');
    recommendations.push('Add integration test maintenance');
    recommendations.push('Implement integration test documentation');
    recommendations.push('Add integration test best practices');
    
    this.integrationResults.recommendations = recommendations;
  }

  generateIntegrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      apiTests: this.integrationResults.apiTests,
      databaseTests: this.integrationResults.databaseTests,
      serviceTests: this.integrationResults.serviceTests,
      middlewareTests: this.integrationResults.middlewareTests,
      routeTests: this.integrationResults.routeTests,
      authenticationTests: this.integrationResults.authenticationTests,
      authorizationTests: this.integrationResults.authorizationTests,
      dataFlowTests: this.integrationResults.dataFlowTests,
      errorHandlingTests: this.integrationResults.errorHandlingTests,
      performanceTests: this.integrationResults.performanceTests,
      securityTests: this.integrationResults.securityTests,
      recommendations: this.integrationResults.recommendations,
      status: this.getIntegrationStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'apiTests', 'databaseTests', 'serviceTests', 'middlewareTests',
      'routeTests', 'authenticationTests', 'authorizationTests',
      'dataFlowTests', 'errorHandlingTests', 'performanceTests', 'securityTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.integrationResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      report.summary.totalTests += tests.length;
      report.summary.totalPassed += passed;
      report.summary.totalFailed += failed;
    }
    
    report.summary.successRate = report.summary.totalTests > 0 
      ? (report.summary.totalPassed / report.summary.totalTests) * 100 
      : 0;
    
    // Save JSON report
    fs.writeFileSync('integration-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Integration report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Integration Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## API Tests
${report.apiTests.map(test => `
### ${test.endpoint}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Database Tests
${report.databaseTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Service Tests
${report.serviceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Middleware Tests
${report.middlewareTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Route Tests
${report.routeTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Authentication Tests
${report.authenticationTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Authorization Tests
${report.authorizationTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Data Flow Tests
${report.dataFlowTests.map(test => `
### ${test.scenario}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Error Handling Tests
${report.errorHandlingTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Performance Tests
${report.performanceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Security Tests
${report.securityTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Integration Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Integration Testing Checklist
- [ ] All API endpoints are tested
- [ ] Database operations are tested
- [ ] Service integrations are tested
- [ ] Middleware functions are tested
- [ ] Route handlers are tested
- [ ] Authentication flows are tested
- [ ] Authorization checks are tested
- [ ] Data flows are tested
- [ ] Error handling is tested
- [ ] Performance is tested
- [ ] Security is tested

## Next Steps
1. Review all failed integration tests
2. Implement recommended integration improvements
3. Add comprehensive integration testing
4. Implement integration test automation
5. Consider integration test monitoring
`;
    
    fs.writeFileSync('integration-report.md', markdown);
  }

  getIntegrationStatus() {
    const totalTests = this.integrationResults.apiTests.length + 
                      this.integrationResults.databaseTests.length + 
                      this.integrationResults.serviceTests.length + 
                      this.integrationResults.middlewareTests.length + 
                      this.integrationResults.routeTests.length + 
                      this.integrationResults.authenticationTests.length + 
                      this.integrationResults.authorizationTests.length + 
                      this.integrationResults.dataFlowTests.length + 
                      this.integrationResults.errorHandlingTests.length + 
                      this.integrationResults.performanceTests.length + 
                      this.integrationResults.securityTests.length;
    
    const totalFailed = this.integrationResults.apiTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.databaseTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.serviceTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.middlewareTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.routeTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.authenticationTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.authorizationTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.dataFlowTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.errorHandlingTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.performanceTests.filter(t => t.status === 'failed').length + 
                       this.integrationResults.securityTests.filter(t => t.status === 'failed').length;
    
    if (totalFailed > 0) {
      return 'FAILED';
    }
    
    return 'PASSED';
  }

  generateFailureReport(error) {
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      duration: Date.now() - this.startTime,
      integrationResults: this.integrationResults
    };
    
    fs.writeFileSync('integration-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Integration failure report saved to integration-failure-report.json');
  }
}

// Run integration tests
const runner = new IntegrationTestRunner();
runner.runIntegrationTests().catch(error => {
  console.error('❌ Integration test runner failed:', error);
  process.exit(1);
});