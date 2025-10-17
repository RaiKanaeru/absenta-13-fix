/**
 * Security Test Runner
 * Menjalankan tests dengan security testing dan vulnerability detection
 */

import { execSync } from 'child_process';
import fs from 'fs';

class SecurityTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.securityResults = {
      vulnerabilityTests: [],
      authenticationTests: [],
      authorizationTests: [],
      dataProtectionTests: [],
      recommendations: []
    };
    this.securityAreas = [
      'Authentication Security',
      'Authorization Security',
      'Data Protection',
      'Input Validation',
      'Output Encoding',
      'Session Management',
      'Error Handling',
      'Logging and Monitoring'
    ];
  }

  async runSecurityTests() {
    console.log('🔒 Running Security Tests...\n');
    
    try {
      // Run vulnerability tests
      await this.runVulnerabilityTests();
      
      // Run authentication security tests
      await this.runAuthenticationSecurityTests();
      
      // Run authorization security tests
      await this.runAuthorizationSecurityTests();
      
      // Run data protection tests
      await this.runDataProtectionTests();
      
      // Analyze security results
      await this.analyzeSecurityResults();
      
      // Generate security report
      this.generateSecurityReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Security tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Security tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runVulnerabilityTests() {
    console.log('🛡️ Running vulnerability tests...');
    
    const vulnerabilityTests = [
      {
        name: 'SQL Injection',
        command: 'npm run test:unit -- --testNamePattern="sql|injection"',
        description: 'Tests for SQL injection vulnerabilities'
      },
      {
        name: 'XSS Protection',
        command: 'npm run test:unit -- --testNamePattern="xss|cross-site"',
        description: 'Tests for XSS protection'
      },
      {
        name: 'CSRF Protection',
        command: 'npm run test:unit -- --testNamePattern="csrf|forgery"',
        description: 'Tests for CSRF protection'
      },
      {
        name: 'Input Validation',
        command: 'npm run test:unit -- --testNamePattern="validation|sanitize"',
        description: 'Tests for input validation security'
      },
      {
        name: 'Output Encoding',
        command: 'npm run test:unit -- --testNamePattern="encoding|escape"',
        description: 'Tests for output encoding security'
      }
    ];
    
    for (const test of vulnerabilityTests) {
      try {
        console.log(`🛡️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.securityResults.vulnerabilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.securityResults.vulnerabilityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAuthenticationSecurityTests() {
    console.log('🔐 Running authentication security tests...');
    
    const authTests = [
      {
        name: 'Password Security',
        command: 'npm run test:unit -- --testNamePattern="password|hash"',
        description: 'Tests for password security'
      },
      {
        name: 'Session Security',
        command: 'npm run test:unit -- --testNamePattern="session|token"',
        description: 'Tests for session security'
      },
      {
        name: 'Login Security',
        command: 'npm run test:unit -- --testNamePattern="login|auth"',
        description: 'Tests for login security'
      },
      {
        name: 'Account Lockout',
        command: 'npm run test:unit -- --testNamePattern="lockout|attempt"',
        description: 'Tests for account lockout security'
      },
      {
        name: 'Password Policy',
        command: 'npm run test:unit -- --testNamePattern="policy|strength"',
        description: 'Tests for password policy security'
      }
    ];
    
    for (const test of authTests) {
      try {
        console.log(`🔐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.securityResults.authenticationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.securityResults.authenticationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAuthorizationSecurityTests() {
    console.log('🔑 Running authorization security tests...');
    
    const authzTests = [
      {
        name: 'Role-Based Access',
        command: 'npm run test:unit -- --testNamePattern="role|permission"',
        description: 'Tests for role-based access control'
      },
      {
        name: 'Resource Access',
        command: 'npm run test:unit -- --testNamePattern="resource|access"',
        description: 'Tests for resource access control'
      },
      {
        name: 'API Authorization',
        command: 'npm run test:unit -- --testNamePattern="api|endpoint"',
        description: 'Tests for API authorization'
      },
      {
        name: 'Data Access Control',
        command: 'npm run test:unit -- --testNamePattern="data|control"',
        description: 'Tests for data access control'
      },
      {
        name: 'Function Access Control',
        command: 'npm run test:unit -- --testNamePattern="function|method"',
        description: 'Tests for function access control'
      }
    ];
    
    for (const test of authzTests) {
      try {
        console.log(`🔑 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.securityResults.authorizationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.securityResults.authorizationTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runDataProtectionTests() {
    console.log('🛡️ Running data protection tests...');
    
    const dataProtectionTests = [
      {
        name: 'Data Encryption',
        command: 'npm run test:unit -- --testNamePattern="encryption|cipher"',
        description: 'Tests for data encryption'
      },
      {
        name: 'Data Masking',
        command: 'npm run test:unit -- --testNamePattern="masking|obfuscation"',
        description: 'Tests for data masking'
      },
      {
        name: 'Data Validation',
        command: 'npm run test:unit -- --testNamePattern="validation|sanitize"',
        description: 'Tests for data validation'
      },
      {
        name: 'Data Integrity',
        command: 'npm run test:unit -- --testNamePattern="integrity|checksum"',
        description: 'Tests for data integrity'
      },
      {
        name: 'Data Backup',
        command: 'npm run test:unit -- --testNamePattern="backup|recovery"',
        description: 'Tests for data backup security'
      }
    ];
    
    for (const test of dataProtectionTests) {
      try {
        console.log(`🛡️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.securityResults.dataProtectionTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.securityResults.dataProtectionTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeSecurityResults() {
    console.log('📊 Analyzing security results...');
    
    // Analyze vulnerability tests
    const passedVulnTests = this.securityResults.vulnerabilityTests.filter(t => t.status === 'passed').length;
    const failedVulnTests = this.securityResults.vulnerabilityTests.filter(t => t.status === 'failed').length;
    
    // Analyze authentication tests
    const passedAuthTests = this.securityResults.authenticationTests.filter(t => t.status === 'passed').length;
    const failedAuthTests = this.securityResults.authenticationTests.filter(t => t.status === 'failed').length;
    
    // Analyze authorization tests
    const passedAuthzTests = this.securityResults.authorizationTests.filter(t => t.status === 'passed').length;
    const failedAuthzTests = this.securityResults.authorizationTests.filter(t => t.status === 'failed').length;
    
    // Analyze data protection tests
    const passedDataTests = this.securityResults.dataProtectionTests.filter(t => t.status === 'passed').length;
    const failedDataTests = this.securityResults.dataProtectionTests.filter(t => t.status === 'failed').length;
    
    // Generate recommendations
    this.generateSecurityRecommendations();
    
    console.log(`📈 Security Analysis:`);
    console.log(`  Vulnerability Tests: ${passedVulnTests} passed, ${failedVulnTests} failed`);
    console.log(`  Authentication Tests: ${passedAuthTests} passed, ${failedAuthTests} failed`);
    console.log(`  Authorization Tests: ${passedAuthzTests} passed, ${failedAuthzTests} failed`);
    console.log(`  Data Protection Tests: ${passedDataTests} passed, ${failedDataTests} failed`);
    
    if (failedVulnTests > 0 || failedAuthTests > 0 || failedAuthzTests > 0 || failedDataTests > 0) {
      console.log('⚠️  Security issues found!');
    }
  }

  generateSecurityRecommendations() {
    const recommendations = [];
    
    // Check for common security issues
    const failedVulnTests = this.securityResults.vulnerabilityTests.filter(t => t.status === 'failed');
    if (failedVulnTests.length > 0) {
      recommendations.push('Address vulnerability test failures');
    }
    
    const failedAuthTests = this.securityResults.authenticationTests.filter(t => t.status === 'failed');
    if (failedAuthTests.length > 0) {
      recommendations.push('Fix authentication security issues');
    }
    
    const failedAuthzTests = this.securityResults.authorizationTests.filter(t => t.status === 'failed');
    if (failedAuthzTests.length > 0) {
      recommendations.push('Address authorization security issues');
    }
    
    const failedDataTests = this.securityResults.dataProtectionTests.filter(t => t.status === 'failed');
    if (failedDataTests.length > 0) {
      recommendations.push('Fix data protection security issues');
    }
    
    // General security recommendations
    recommendations.push('Implement comprehensive security testing');
    recommendations.push('Add security monitoring and logging');
    recommendations.push('Implement security best practices');
    recommendations.push('Add security documentation');
    recommendations.push('Implement security training');
    recommendations.push('Add security auditing');
    recommendations.push('Implement security incident response');
    recommendations.push('Add security compliance');
    recommendations.push('Implement security risk assessment');
    recommendations.push('Add security governance');
    
    this.securityResults.recommendations = recommendations;
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        vulnerabilityTests: this.securityResults.vulnerabilityTests.length,
        passedVulnTests: this.securityResults.vulnerabilityTests.filter(t => t.status === 'passed').length,
        failedVulnTests: this.securityResults.vulnerabilityTests.filter(t => t.status === 'failed').length,
        authenticationTests: this.securityResults.authenticationTests.length,
        passedAuthTests: this.securityResults.authenticationTests.filter(t => t.status === 'passed').length,
        failedAuthTests: this.securityResults.authenticationTests.filter(t => t.status === 'failed').length,
        authorizationTests: this.securityResults.authorizationTests.length,
        passedAuthzTests: this.securityResults.authorizationTests.filter(t => t.status === 'passed').length,
        failedAuthzTests: this.securityResults.authorizationTests.filter(t => t.status === 'failed').length,
        dataProtectionTests: this.securityResults.dataProtectionTests.length,
        passedDataTests: this.securityResults.dataProtectionTests.filter(t => t.status === 'passed').length,
        failedDataTests: this.securityResults.dataProtectionTests.filter(t => t.status === 'failed').length
      },
      vulnerabilityTests: this.securityResults.vulnerabilityTests,
      authenticationTests: this.securityResults.authenticationTests,
      authorizationTests: this.securityResults.authorizationTests,
      dataProtectionTests: this.securityResults.dataProtectionTests,
      recommendations: this.securityResults.recommendations,
      status: this.getSecurityStatus()
    };
    
    // Save JSON report
    fs.writeFileSync('security-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Security report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Security Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Vulnerability Tests**: ${report.summary.vulnerabilityTests} (${report.summary.passedVulnTests} passed, ${report.summary.failedVulnTests} failed)
- **Authentication Tests**: ${report.summary.authenticationTests} (${report.summary.passedAuthTests} passed, ${report.summary.failedAuthTests} failed)
- **Authorization Tests**: ${report.summary.authorizationTests} (${report.summary.passedAuthzTests} passed, ${report.summary.failedAuthzTests} failed)
- **Data Protection Tests**: ${report.summary.dataProtectionTests} (${report.summary.passedDataTests} passed, ${report.summary.failedDataTests} failed)

## Vulnerability Tests
${report.vulnerabilityTests.map(test => `
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

## Data Protection Tests
${report.dataProtectionTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Security Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Security Testing Checklist
- [ ] All vulnerabilities are tested
- [ ] Authentication security is verified
- [ ] Authorization security is implemented
- [ ] Data protection is in place
- [ ] Security monitoring is active
- [ ] Security documentation is complete
- [ ] Security training is provided
- [ ] Security compliance is maintained

## Next Steps
1. Review all failed security tests
2. Implement recommended security improvements
3. Add comprehensive security testing
4. Implement security monitoring
5. Consider security audit
`;
    
    fs.writeFileSync('security-report.md', markdown);
  }

  getSecurityStatus() {
    const failedVulnTests = this.securityResults.vulnerabilityTests.filter(t => t.status === 'failed').length;
    const failedAuthTests = this.securityResults.authenticationTests.filter(t => t.status === 'failed').length;
    const failedAuthzTests = this.securityResults.authorizationTests.filter(t => t.status === 'failed').length;
    const failedDataTests = this.securityResults.dataProtectionTests.filter(t => t.status === 'failed').length;
    
    if (failedVulnTests > 0 || failedAuthTests > 0 || failedAuthzTests > 0 || failedDataTests > 0) {
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
      securityResults: this.securityResults
    };
    
    fs.writeFileSync('security-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Security failure report saved to security-failure-report.json');
  }
}

// Run security tests
const runner = new SecurityTestRunner();
runner.runSecurityTests().catch(error => {
  console.error('❌ Security test runner failed:', error);
  process.exit(1);
});