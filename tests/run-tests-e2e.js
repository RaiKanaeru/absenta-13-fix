/**
 * E2E Test Runner
 * Menjalankan tests dengan end-to-end testing dan user journey validation
 */

import { execSync } from 'child_process';
import fs from 'fs';

class E2ETestRunner {
  constructor() {
    this.startTime = Date.now();
    this.e2eResults = {
      userJourneyTests: [],
      browserTests: [],
      mobileTests: [],
      performanceTests: [],
      recommendations: []
    };
    this.userJourneys = [
      'Admin Login and Dashboard Access',
      'Teacher Attendance Management',
      'Student Data Management',
      'Schedule Creation and Management',
      'Report Generation and Export',
      'File Import and Processing',
      'Error Handling and Recovery',
      'Mobile Responsive Testing'
    ];
    this.browsers = ['chromium', 'firefox', 'webkit'];
  }

  async runE2ETests() {
    console.log('🎭 Running E2E Tests...\n');
    
    try {
      // Run user journey tests
      await this.runUserJourneyTests();
      
      // Run browser compatibility tests
      await this.runBrowserTests();
      
      // Run mobile E2E tests
      await this.runMobileTests();
      
      // Run E2E performance tests
      await this.runE2EPerformanceTests();
      
      // Analyze E2E results
      await this.analyzeE2EResults();
      
      // Generate E2E report
      this.generateE2EReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ E2E tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ E2E tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runUserJourneyTests() {
    console.log('👤 Running user journey tests...');
    
    for (const journey of this.userJourneys) {
      try {
        console.log(`👤 Testing user journey: ${journey}...`);
        
        // Run Playwright tests for specific user journey
        execSync(`npx playwright test --grep="${journey}" --reporter=html`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.e2eResults.userJourneyTests.push({
          journey: journey,
          status: 'passed',
          description: `E2E test for user journey: ${journey}`
        });
        
        console.log(`✅ User journey ${journey} test passed`);
        
      } catch (error) {
        this.e2eResults.userJourneyTests.push({
          journey: journey,
          status: 'failed',
          description: `E2E test for user journey: ${journey}`,
          error: error.message
        });
        
        console.log(`❌ User journey ${journey} test failed: ${error.message}`);
      }
    }
  }

  async runBrowserTests() {
    console.log('🌐 Running browser compatibility tests...');
    
    for (const browser of this.browsers) {
      try {
        console.log(`🌐 Testing browser: ${browser}...`);
        
        // Run Playwright tests for specific browser
        execSync(`npx playwright test --project=${browser} --reporter=html`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.e2eResults.browserTests.push({
          browser: browser,
          status: 'passed',
          description: `E2E test for browser: ${browser}`
        });
        
        console.log(`✅ Browser ${browser} test passed`);
        
      } catch (error) {
        this.e2eResults.browserTests.push({
          browser: browser,
          status: 'failed',
          description: `E2E test for browser: ${browser}`,
          error: error.message
        });
        
        console.log(`❌ Browser ${browser} test failed: ${error.message}`);
      }
    }
  }

  async runMobileTests() {
    console.log('📱 Running mobile E2E tests...');
    
    const mobileTests = [
      {
        name: 'Mobile Login Flow',
        command: 'npx playwright test --project=mobile-chrome --grep="login"',
        description: 'Tests for mobile login flow'
      },
      {
        name: 'Mobile Dashboard',
        command: 'npx playwright test --project=mobile-chrome --grep="dashboard"',
        description: 'Tests for mobile dashboard functionality'
      },
      {
        name: 'Mobile Forms',
        command: 'npx playwright test --project=mobile-chrome --grep="form"',
        description: 'Tests for mobile form interactions'
      },
      {
        name: 'Mobile Navigation',
        command: 'npx playwright test --project=mobile-chrome --grep="navigation"',
        description: 'Tests for mobile navigation'
      },
      {
        name: 'Mobile Responsive',
        command: 'npx playwright test --project=mobile-chrome --grep="responsive"',
        description: 'Tests for mobile responsive design'
      }
    ];
    
    for (const test of mobileTests) {
      try {
        console.log(`📱 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.e2eResults.mobileTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.e2eResults.mobileTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runE2EPerformanceTests() {
    console.log('⚡ Running E2E performance tests...');
    
    const performanceTests = [
      {
        name: 'Page Load Performance',
        command: 'npx playwright test --grep="performance" --reporter=html',
        description: 'Tests for page load performance'
      },
      {
        name: 'User Interaction Performance',
        command: 'npx playwright test --grep="interaction" --reporter=html',
        description: 'Tests for user interaction performance'
      },
      {
        name: 'API Response Performance',
        command: 'npx playwright test --grep="api" --reporter=html',
        description: 'Tests for API response performance'
      },
      {
        name: 'Database Query Performance',
        command: 'npx playwright test --grep="database" --reporter=html',
        description: 'Tests for database query performance'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.e2eResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.e2eResults.performanceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeE2EResults() {
    console.log('📊 Analyzing E2E results...');
    
    // Analyze user journey tests
    const passedJourneyTests = this.e2eResults.userJourneyTests.filter(t => t.status === 'passed').length;
    const failedJourneyTests = this.e2eResults.userJourneyTests.filter(t => t.status === 'failed').length;
    
    // Analyze browser tests
    const passedBrowserTests = this.e2eResults.browserTests.filter(t => t.status === 'passed').length;
    const failedBrowserTests = this.e2eResults.browserTests.filter(t => t.status === 'failed').length;
    
    // Analyze mobile tests
    const passedMobileTests = this.e2eResults.mobileTests.filter(t => t.status === 'passed').length;
    const failedMobileTests = this.e2eResults.mobileTests.filter(t => t.status === 'failed').length;
    
    // Analyze performance tests
    const passedPerformanceTests = this.e2eResults.performanceTests.filter(t => t.status === 'passed').length;
    const failedPerformanceTests = this.e2eResults.performanceTests.filter(t => t.status === 'failed').length;
    
    // Generate recommendations
    this.generateE2ERecommendations();
    
    console.log(`📈 E2E Analysis:`);
    console.log(`  User Journey Tests: ${passedJourneyTests} passed, ${failedJourneyTests} failed`);
    console.log(`  Browser Tests: ${passedBrowserTests} passed, ${failedBrowserTests} failed`);
    console.log(`  Mobile Tests: ${passedMobileTests} passed, ${failedMobileTests} failed`);
    console.log(`  Performance Tests: ${passedPerformanceTests} passed, ${failedPerformanceTests} failed`);
    
    if (failedJourneyTests > 0 || failedBrowserTests > 0 || failedMobileTests > 0 || failedPerformanceTests > 0) {
      console.log('⚠️  E2E issues found!');
    }
  }

  generateE2ERecommendations() {
    const recommendations = [];
    
    // Check for common E2E issues
    const failedJourneyTests = this.e2eResults.userJourneyTests.filter(t => t.status === 'failed');
    if (failedJourneyTests.length > 0) {
      recommendations.push('Fix failed user journey tests');
    }
    
    const failedBrowserTests = this.e2eResults.browserTests.filter(t => t.status === 'failed');
    if (failedBrowserTests.length > 0) {
      recommendations.push('Address browser compatibility issues');
    }
    
    const failedMobileTests = this.e2eResults.mobileTests.filter(t => t.status === 'failed');
    if (failedMobileTests.length > 0) {
      recommendations.push('Fix mobile E2E test issues');
    }
    
    const failedPerformanceTests = this.e2eResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Address E2E performance issues');
    }
    
    // General E2E recommendations
    recommendations.push('Implement comprehensive E2E testing');
    recommendations.push('Add cross-browser testing');
    recommendations.push('Implement mobile E2E testing');
    recommendations.push('Add E2E performance testing');
    recommendations.push('Implement E2E test automation');
    recommendations.push('Add E2E test monitoring');
    recommendations.push('Implement E2E test reporting');
    recommendations.push('Add E2E test maintenance');
    recommendations.push('Implement E2E test documentation');
    recommendations.push('Add E2E test best practices');
    
    this.e2eResults.recommendations = recommendations;
  }

  generateE2EReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        userJourneyTests: this.e2eResults.userJourneyTests.length,
        passedJourneyTests: this.e2eResults.userJourneyTests.filter(t => t.status === 'passed').length,
        failedJourneyTests: this.e2eResults.userJourneyTests.filter(t => t.status === 'failed').length,
        browserTests: this.e2eResults.browserTests.length,
        passedBrowserTests: this.e2eResults.browserTests.filter(t => t.status === 'passed').length,
        failedBrowserTests: this.e2eResults.browserTests.filter(t => t.status === 'failed').length,
        mobileTests: this.e2eResults.mobileTests.length,
        passedMobileTests: this.e2eResults.mobileTests.filter(t => t.status === 'passed').length,
        failedMobileTests: this.e2eResults.mobileTests.filter(t => t.status === 'failed').length,
        performanceTests: this.e2eResults.performanceTests.length,
        passedPerformanceTests: this.e2eResults.performanceTests.filter(t => t.status === 'passed').length,
        failedPerformanceTests: this.e2eResults.performanceTests.filter(t => t.status === 'failed').length
      },
      userJourneyTests: this.e2eResults.userJourneyTests,
      browserTests: this.e2eResults.browserTests,
      mobileTests: this.e2eResults.mobileTests,
      performanceTests: this.e2eResults.performanceTests,
      recommendations: this.e2eResults.recommendations,
      status: this.getE2EStatus()
    };
    
    // Save JSON report
    fs.writeFileSync('e2e-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 E2E report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# E2E Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **User Journey Tests**: ${report.summary.userJourneyTests} (${report.summary.passedJourneyTests} passed, ${report.summary.failedJourneyTests} failed)
- **Browser Tests**: ${report.summary.browserTests} (${report.summary.passedBrowserTests} passed, ${report.summary.failedBrowserTests} failed)
- **Mobile Tests**: ${report.summary.mobileTests} (${report.summary.passedMobileTests} passed, ${report.summary.failedMobileTests} failed)
- **Performance Tests**: ${report.summary.performanceTests} (${report.summary.passedPerformanceTests} passed, ${report.summary.failedPerformanceTests} failed)

## User Journey Tests
${report.userJourneyTests.map(test => `
### ${test.journey}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Browser Tests
${report.browserTests.map(test => `
### ${test.browser}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Mobile Tests
${report.mobileTests.map(test => `
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

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## E2E Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## E2E Testing Checklist
- [ ] All user journeys are tested
- [ ] Cross-browser compatibility is verified
- [ ] Mobile functionality is tested
- [ ] Performance meets requirements
- [ ] Error scenarios are handled
- [ ] User experience is validated
- [ ] Security is tested end-to-end
- [ ] Data integrity is maintained

## Next Steps
1. Review all failed E2E tests
2. Implement recommended E2E improvements
3. Add comprehensive E2E testing
4. Implement E2E test automation
5. Consider E2E test monitoring
`;
    
    fs.writeFileSync('e2e-report.md', markdown);
  }

  getE2EStatus() {
    const failedJourneyTests = this.e2eResults.userJourneyTests.filter(t => t.status === 'failed').length;
    const failedBrowserTests = this.e2eResults.browserTests.filter(t => t.status === 'failed').length;
    const failedMobileTests = this.e2eResults.mobileTests.filter(t => t.status === 'failed').length;
    const failedPerformanceTests = this.e2eResults.performanceTests.filter(t => t.status === 'failed').length;
    
    if (failedJourneyTests > 0 || failedBrowserTests > 0 || failedMobileTests > 0 || failedPerformanceTests > 0) {
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
      e2eResults: this.e2eResults
    };
    
    fs.writeFileSync('e2e-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 E2E failure report saved to e2e-failure-report.json');
  }
}

// Run E2E tests
const runner = new E2ETestRunner();
runner.runE2ETests().catch(error => {
  console.error('❌ E2E test runner failed:', error);
  process.exit(1);
});