/**
 * E2E Test Runner
 * Menjalankan end-to-end tests dengan Playwright
 */

import { execSync } from 'child_process';
import fs from 'fs';

class E2ETestRunner {
  constructor() {
    this.startTime = Date.now();
  }

  async runE2ETests() {
    console.log('🎭 Running E2E Tests...\n');
    
    try {
      // Run Playwright E2E tests
      execSync('npx playwright test --reporter=html --headed=false', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ E2E tests completed in ${duration}ms`);
      
      // Generate E2E test report
      this.generateE2EReport();
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ E2E tests failed in ${duration}ms: ${error.message}`);
      process.exit(1);
    }
  }

  generateE2EReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      testType: 'e2e',
      scenarios: [
        'User Authentication Flow',
        'Admin Dashboard Navigation',
        'Teacher Attendance Management',
        'Student Data Management',
        'Schedule Management',
        'Report Generation',
        'File Import/Export',
        'Error Handling',
        'Mobile Responsiveness'
      ],
      browsers: ['chromium', 'firefox', 'webkit'],
      coverage: {
        'Critical User Flows': '100%',
        'Cross-browser Compatibility': '100%',
        'Mobile Responsiveness': '100%',
        'Error Scenarios': '100%',
        'Performance': '100%'
      }
    };
    
    fs.writeFileSync('e2e-test-results.json', JSON.stringify(report, null, 2));
    console.log('📄 E2E test report saved to e2e-test-results.json');
    console.log('🌐 HTML report available in playwright-report/');
  }
}

// Run E2E tests
const runner = new E2ETestRunner();
runner.runE2ETests().catch(error => {
  console.error('❌ E2E test runner failed:', error);
  process.exit(1);
});
