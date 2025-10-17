/**
 * API Test Runner
 * Menjalankan tests dengan API testing dan endpoint testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class APITestRunner {
  constructor() {
    this.startTime = Date.now();
    this.apiResults = {
      endpointTests: [],
      authenticationTests: [],
      authorizationTests: [],
      validationTests: [],
      performanceTests: [],
      securityTests: [],
      errorHandlingTests: [],
      integrationTests: [],
      documentationTests: [],
      versioningTests: [],
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
    this.httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    this.statusCodes = [200, 201, 400, 401, 403, 404, 422, 500];
  }

  async runAPITests() {
    console.log('🔌 Running API Tests...\n');
    
    try {
      // Run endpoint tests
      await this.runEndpointTests();
      
      // Run authentication tests
      await this.runAuthenticationTests();
      
      // Run authorization tests
      await this.runAuthorizationTests();
      
      // Run validation tests
      await this.runValidationTests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Run security tests
      await this.runSecurityTests();
      
      // Run error handling tests
      await this.runErrorHandlingTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run documentation tests
      await this.runDocumentationTests();
      
      // Run versioning tests
      await this.runVersioningTests();
      
      // Analyze API results
      await this.analyzeAPIResults();
      
      // Generate API report
      this.generateAPIReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ API tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ API tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runEndpointTests() {
    console.log('🌐 Running endpoint tests...');
    
    for (const endpoint of this.apiEndpoints) {
      try {
        console.log(`🌐 Testing endpoint: ${endpoint}...`);
        
        // Run Jest tests for specific endpoint
        execSync(`npx jest --testPathPattern="api" --testNamePattern="${endpoint}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.endpointTests.push({
          endpoint: endpoint,
          status: 'passed',
          description: `API test for endpoint: ${endpoint}`
        });
        
        console.log(`✅ Endpoint ${endpoint} test passed`);
        
      } catch (error) {
        this.apiResults.endpointTests.push({
          endpoint: endpoint,
          status: 'failed',
          description: `API test for endpoint: ${endpoint}`,
          error: error.message
        });
        
        console.log(`❌ Endpoint ${endpoint} test failed: ${error.message}`);
      }
    }
  }

  async runAuthenticationTests() {
    console.log('🔐 Running authentication tests...');
    
    const authTests = [
      {
        name: 'Login Authentication',
        command: 'npx jest --testPathPattern="api" --testNamePattern="login-auth"',
        description: 'Tests for login authentication'
      },
      {
        name: 'Token Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="token-validation"',
        description: 'Tests for token validation'
      },
      {
        name: 'Session Management',
        command: 'npx jest --testPathPattern="api" --testNamePattern="session-management"',
        description: 'Tests for session management'
      },
      {
        name: 'Password Reset',
        command: 'npx jest --testPathPattern="api" --testNamePattern="password-reset"',
        description: 'Tests for password reset'
      },
      {
        name: 'Logout Authentication',
        command: 'npx jest --testPathPattern="api" --testNamePattern="logout-auth"',
        description: 'Tests for logout authentication'
      }
    ];
    
    for (const test of authTests) {
      try {
        console.log(`🔐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.authenticationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.authenticationTests.push({
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
    console.log('🛡️ Running authorization tests...');
    
    const authzTests = [
      {
        name: 'Role-Based Access',
        command: 'npx jest --testPathPattern="api" --testNamePattern="role-access"',
        description: 'Tests for role-based access control'
      },
      {
        name: 'Permission Checks',
        command: 'npx jest --testPathPattern="api" --testNamePattern="permission-checks"',
        description: 'Tests for permission checks'
      },
      {
        name: 'Resource Access',
        command: 'npx jest --testPathPattern="api" --testNamePattern="resource-access"',
        description: 'Tests for resource access control'
      },
      {
        name: 'API Access Control',
        command: 'npx jest --testPathPattern="api" --testNamePattern="api-access"',
        description: 'Tests for API access control'
      },
      {
        name: 'Data Access Control',
        command: 'npx jest --testPathPattern="api" --testNamePattern="data-access"',
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
        
        this.apiResults.authorizationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.authorizationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runValidationTests() {
    console.log('✅ Running validation tests...');
    
    const validationTests = [
      {
        name: 'Input Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="input-validation"',
        description: 'Tests for input validation'
      },
      {
        name: 'Data Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="data-validation"',
        description: 'Tests for data validation'
      },
      {
        name: 'Schema Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="schema-validation"',
        description: 'Tests for schema validation'
      },
      {
        name: 'Format Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="format-validation"',
        description: 'Tests for format validation'
      },
      {
        name: 'Range Validation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="range-validation"',
        description: 'Tests for range validation'
      }
    ];
    
    for (const test of validationTests) {
      try {
        console.log(`✅ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.validationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.validationTests.push({
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
    console.log('⚡ Running API performance tests...');
    
    const performanceTests = [
      {
        name: 'Response Time',
        command: 'npx jest --testPathPattern="api" --testNamePattern="response-time"',
        description: 'Tests for API response time'
      },
      {
        name: 'Throughput',
        command: 'npx jest --testPathPattern="api" --testNamePattern="throughput"',
        description: 'Tests for API throughput'
      },
      {
        name: 'Load Testing',
        command: 'npx jest --testPathPattern="api" --testNamePattern="load-testing"',
        description: 'Tests for API load testing'
      },
      {
        name: 'Stress Testing',
        command: 'npx jest --testPathPattern="api" --testNamePattern="stress-testing"',
        description: 'Tests for API stress testing'
      },
      {
        name: 'Concurrent Requests',
        command: 'npx jest --testPathPattern="api" --testNamePattern="concurrent"',
        description: 'Tests for concurrent requests'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.performanceTests.push({
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
    console.log('🔒 Running API security tests...');
    
    const securityTests = [
      {
        name: 'SQL Injection',
        command: 'npx jest --testPathPattern="api" --testNamePattern="sql-injection"',
        description: 'Tests for SQL injection protection'
      },
      {
        name: 'XSS Protection',
        command: 'npx jest --testPathPattern="api" --testNamePattern="xss-protection"',
        description: 'Tests for XSS protection'
      },
      {
        name: 'CSRF Protection',
        command: 'npx jest --testPathPattern="api" --testNamePattern="csrf-protection"',
        description: 'Tests for CSRF protection'
      },
      {
        name: 'Rate Limiting',
        command: 'npx jest --testPathPattern="api" --testNamePattern="rate-limiting"',
        description: 'Tests for rate limiting'
      },
      {
        name: 'Input Sanitization',
        command: 'npx jest --testPathPattern="api" --testNamePattern="input-sanitization"',
        description: 'Tests for input sanitization'
      }
    ];
    
    for (const test of securityTests) {
      try {
        console.log(`🔒 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.securityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.securityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runErrorHandlingTests() {
    console.log('⚠️ Running error handling tests...');
    
    const errorTests = [
      {
        name: 'Error Responses',
        command: 'npx jest --testPathPattern="api" --testNamePattern="error-responses"',
        description: 'Tests for error responses'
      },
      {
        name: 'Status Codes',
        command: 'npx jest --testPathPattern="api" --testNamePattern="status-codes"',
        description: 'Tests for status codes'
      },
      {
        name: 'Error Messages',
        command: 'npx jest --testPathPattern="api" --testNamePattern="error-messages"',
        description: 'Tests for error messages'
      },
      {
        name: 'Exception Handling',
        command: 'npx jest --testPathPattern="api" --testNamePattern="exception-handling"',
        description: 'Tests for exception handling'
      },
      {
        name: 'Graceful Degradation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="graceful-degradation"',
        description: 'Tests for graceful degradation'
      }
    ];
    
    for (const test of errorTests) {
      try {
        console.log(`⚠️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.errorHandlingTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.errorHandlingTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running API integration tests...');
    
    const integrationTests = [
      {
        name: 'API Integration',
        command: 'npx jest --testPathPattern="api" --testNamePattern="api-integration"',
        description: 'Tests for API integration'
      },
      {
        name: 'Database Integration',
        command: 'npx jest --testPathPattern="api" --testNamePattern="database-integration"',
        description: 'Tests for database integration'
      },
      {
        name: 'Service Integration',
        command: 'npx jest --testPathPattern="api" --testNamePattern="service-integration"',
        description: 'Tests for service integration'
      },
      {
        name: 'External API Integration',
        command: 'npx jest --testPathPattern="api" --testNamePattern="external-integration"',
        description: 'Tests for external API integration'
      },
      {
        name: 'Middleware Integration',
        command: 'npx jest --testPathPattern="api" --testNamePattern="middleware-integration"',
        description: 'Tests for middleware integration'
      }
    ];
    
    for (const test of integrationTests) {
      try {
        console.log(`🔗 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.integrationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.integrationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runDocumentationTests() {
    console.log('📚 Running API documentation tests...');
    
    const documentationTests = [
      {
        name: 'OpenAPI Specification',
        command: 'npx jest --testPathPattern="api" --testNamePattern="openapi-spec"',
        description: 'Tests for OpenAPI specification'
      },
      {
        name: 'Swagger Documentation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="swagger-docs"',
        description: 'Tests for Swagger documentation'
      },
      {
        name: 'API Documentation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="api-docs"',
        description: 'Tests for API documentation'
      },
      {
        name: 'Endpoint Documentation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="endpoint-docs"',
        description: 'Tests for endpoint documentation'
      },
      {
        name: 'Response Documentation',
        command: 'npx jest --testPathPattern="api" --testNamePattern="response-docs"',
        description: 'Tests for response documentation'
      }
    ];
    
    for (const test of documentationTests) {
      try {
        console.log(`📚 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.documentationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.documentationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runVersioningTests() {
    console.log('🔄 Running API versioning tests...');
    
    const versioningTests = [
      {
        name: 'API Versioning',
        command: 'npx jest --testPathPattern="api" --testNamePattern="api-versioning"',
        description: 'Tests for API versioning'
      },
      {
        name: 'Backward Compatibility',
        command: 'npx jest --testPathPattern="api" --testNamePattern="backward-compatibility"',
        description: 'Tests for backward compatibility'
      },
      {
        name: 'Version Headers',
        command: 'npx jest --testPathPattern="api" --testNamePattern="version-headers"',
        description: 'Tests for version headers'
      },
      {
        name: 'Version Endpoints',
        command: 'npx jest --testPathPattern="api" --testNamePattern="version-endpoints"',
        description: 'Tests for version endpoints'
      },
      {
        name: 'Deprecation Handling',
        command: 'npx jest --testPathPattern="api" --testNamePattern="deprecation"',
        description: 'Tests for deprecation handling'
      }
    ];
    
    for (const test of versioningTests) {
      try {
        console.log(`🔄 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.apiResults.versioningTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.apiResults.versioningTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeAPIResults() {
    console.log('📊 Analyzing API results...');
    
    // Analyze all test categories
    const testCategories = [
      'endpointTests', 'authenticationTests', 'authorizationTests', 'validationTests',
      'performanceTests', 'securityTests', 'errorHandlingTests', 'integrationTests',
      'documentationTests', 'versioningTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.apiResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generateAPIRecommendations();
    
    console.log(`📈 API Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  API issues found!');
    }
  }

  generateAPIRecommendations() {
    const recommendations = [];
    
    // Check for common API issues
    const failedEndpointTests = this.apiResults.endpointTests.filter(t => t.status === 'failed');
    if (failedEndpointTests.length > 0) {
      recommendations.push('Fix failed endpoint tests');
    }
    
    const failedAuthTests = this.apiResults.authenticationTests.filter(t => t.status === 'failed');
    if (failedAuthTests.length > 0) {
      recommendations.push('Address authentication test issues');
    }
    
    const failedAuthzTests = this.apiResults.authorizationTests.filter(t => t.status === 'failed');
    if (failedAuthzTests.length > 0) {
      recommendations.push('Fix authorization test issues');
    }
    
    const failedValidationTests = this.apiResults.validationTests.filter(t => t.status === 'failed');
    if (failedValidationTests.length > 0) {
      recommendations.push('Address validation test issues');
    }
    
    const failedPerformanceTests = this.apiResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Fix performance test issues');
    }
    
    const failedSecurityTests = this.apiResults.securityTests.filter(t => t.status === 'failed');
    if (failedSecurityTests.length > 0) {
      recommendations.push('Address security test issues');
    }
    
    const failedErrorTests = this.apiResults.errorHandlingTests.filter(t => t.status === 'failed');
    if (failedErrorTests.length > 0) {
      recommendations.push('Fix error handling test issues');
    }
    
    const failedIntegrationTests = this.apiResults.integrationTests.filter(t => t.status === 'failed');
    if (failedIntegrationTests.length > 0) {
      recommendations.push('Address integration test issues');
    }
    
    const failedDocumentationTests = this.apiResults.documentationTests.filter(t => t.status === 'failed');
    if (failedDocumentationTests.length > 0) {
      recommendations.push('Fix documentation test issues');
    }
    
    const failedVersioningTests = this.apiResults.versioningTests.filter(t => t.status === 'failed');
    if (failedVersioningTests.length > 0) {
      recommendations.push('Address versioning test issues');
    }
    
    // General API recommendations
    recommendations.push('Implement comprehensive API testing');
    recommendations.push('Add endpoint testing');
    recommendations.push('Implement authentication testing');
    recommendations.push('Add authorization testing');
    recommendations.push('Implement validation testing');
    recommendations.push('Add performance testing');
    recommendations.push('Implement security testing');
    recommendations.push('Add error handling testing');
    recommendations.push('Implement integration testing');
    recommendations.push('Add documentation testing');
    recommendations.push('Implement versioning testing');
    recommendations.push('Add API monitoring');
    recommendations.push('Implement API optimization');
    recommendations.push('Add API reporting');
    recommendations.push('Implement API maintenance');
    recommendations.push('Add API documentation');
    recommendations.push('Implement API best practices');
    
    this.apiResults.recommendations = recommendations;
  }

  generateAPIReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      endpointTests: this.apiResults.endpointTests,
      authenticationTests: this.apiResults.authenticationTests,
      authorizationTests: this.apiResults.authorizationTests,
      validationTests: this.apiResults.validationTests,
      performanceTests: this.apiResults.performanceTests,
      securityTests: this.apiResults.securityTests,
      errorHandlingTests: this.apiResults.errorHandlingTests,
      integrationTests: this.apiResults.integrationTests,
      documentationTests: this.apiResults.documentationTests,
      versioningTests: this.apiResults.versioningTests,
      recommendations: this.apiResults.recommendations,
      status: this.getAPIStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'endpointTests', 'authenticationTests', 'authorizationTests', 'validationTests',
      'performanceTests', 'securityTests', 'errorHandlingTests', 'integrationTests',
      'documentationTests', 'versioningTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.apiResults[category];
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
    fs.writeFileSync('api-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 API report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# API Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Endpoint Tests
${report.endpointTests.map(test => `
### ${test.endpoint}
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

## Validation Tests
${report.validationTests.map(test => `
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

## Error Handling Tests
${report.errorHandlingTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Integration Tests
${report.integrationTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Documentation Tests
${report.documentationTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Versioning Tests
${report.versioningTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## API Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## API Testing Checklist
- [ ] All endpoints are tested
- [ ] Authentication is tested
- [ ] Authorization is tested
- [ ] Validation is tested
- [ ] Performance is tested
- [ ] Security is tested
- [ ] Error handling is tested
- [ ] Integration is tested
- [ ] Documentation is tested
- [ ] Versioning is tested

## Next Steps
1. Review all failed API tests
2. Implement recommended API improvements
3. Add comprehensive API testing
4. Implement API monitoring
5. Consider API optimization
`;
    
    fs.writeFileSync('api-report.md', markdown);
  }

  getAPIStatus() {
    const totalTests = this.apiResults.endpointTests.length + 
                      this.apiResults.authenticationTests.length + 
                      this.apiResults.authorizationTests.length + 
                      this.apiResults.validationTests.length + 
                      this.apiResults.performanceTests.length + 
                      this.apiResults.securityTests.length + 
                      this.apiResults.errorHandlingTests.length + 
                      this.apiResults.integrationTests.length + 
                      this.apiResults.documentationTests.length + 
                      this.apiResults.versioningTests.length;
    
    const totalFailed = this.apiResults.endpointTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.authenticationTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.authorizationTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.validationTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.performanceTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.securityTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.errorHandlingTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.integrationTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.documentationTests.filter(t => t.status === 'failed').length + 
                       this.apiResults.versioningTests.filter(t => t.status === 'failed').length;
    
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
      apiResults: this.apiResults
    };
    
    fs.writeFileSync('api-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 API failure report saved to api-failure-report.json');
  }
}

// Run API tests
const runner = new APITestRunner();
runner.runAPITests().catch(error => {
  console.error('❌ API test runner failed:', error);
  process.exit(1);
});