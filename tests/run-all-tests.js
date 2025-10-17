/**
 * Test Runner untuk semua jenis tests
 * Menjalankan unit, integration, dan E2E tests dengan coverage reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_TYPES = {
  UNIT: 'unit',
  INTEGRATION: 'integration', 
  E2E: 'e2e',
  ALL: 'all'
};

const TEST_RESULTS = {
  PASSED: '✅',
  FAILED: '❌',
  SKIPPED: '⏭️',
  RUNNING: '🔄'
};

class TestRunner {
  constructor() {
    this.results = {
      unit: { status: 'pending', duration: 0, coverage: 0 },
      integration: { status: 'pending', duration: 0, coverage: 0 },
      e2e: { status: 'pending', duration: 0, coverage: 0 }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    try {
      // 1. Run unit tests
      console.log('📝 Running Unit Tests...');
      await this.runUnitTests();
      
      // 2. Run integration tests
      console.log('🔗 Running Integration Tests...');
      await this.runIntegrationTests();
      
      // 3. Run E2E tests
      console.log('🎭 Running E2E Tests...');
      await this.runE2ETests();
      
      // 4. Generate coverage report
      console.log('📊 Generating Coverage Report...');
      await this.generateCoverageReport();
      
      // 5. Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    const startTime = Date.now();
    
    try {
      // Run Jest unit tests
      execSync('npm run test:unit -- --coverage --verbose', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      this.results.unit.status = 'passed';
      this.results.unit.duration = Date.now() - startTime;
      
      // Parse coverage from Jest output
      const coverageFile = 'coverage/coverage-summary.json';
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        this.results.unit.coverage = coverage.total.lines.pct;
      }
      
      console.log(`${TEST_RESULTS.PASSED} Unit tests completed in ${this.results.unit.duration}ms`);
      
    } catch (error) {
      this.results.unit.status = 'failed';
      this.results.unit.duration = Date.now() - startTime;
      console.log(`${TEST_RESULTS.FAILED} Unit tests failed: ${error.message}`);
      throw error;
    }
  }

  async runIntegrationTests() {
    const startTime = Date.now();
    
    try {
      // Run integration tests
      execSync('npm run test:integration -- --verbose', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      this.results.integration.status = 'passed';
      this.results.integration.duration = Date.now() - startTime;
      
      console.log(`${TEST_RESULTS.PASSED} Integration tests completed in ${this.results.integration.duration}ms`);
      
    } catch (error) {
      this.results.integration.status = 'failed';
      this.results.integration.duration = Date.now() - startTime;
      console.log(`${TEST_RESULTS.FAILED} Integration tests failed: ${error.message}`);
      throw error;
    }
  }

  async runE2ETests() {
    const startTime = Date.now();
    
    try {
      // Run Playwright E2E tests
      execSync('npx playwright test --reporter=html', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      this.results.e2e.status = 'passed';
      this.results.e2e.duration = Date.now() - startTime;
      
      console.log(`${TEST_RESULTS.PASSED} E2E tests completed in ${this.results.e2e.duration}ms`);
      
    } catch (error) {
      this.results.e2e.status = 'failed';
      this.results.e2e.duration = Date.now() - startTime;
      console.log(`${TEST_RESULTS.FAILED} E2E tests failed: ${error.message}`);
      throw error;
    }
  }

  async generateCoverageReport() {
    try {
      // Generate comprehensive coverage report
      const coverageReport = {
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - this.startTime,
        results: this.results,
        summary: {
          totalTests: Object.keys(this.results).length,
          passed: Object.values(this.results).filter(r => r.status === 'passed').length,
          failed: Object.values(this.results).filter(r => r.status === 'failed').length,
          averageCoverage: Object.values(this.results)
            .filter(r => r.coverage > 0)
            .reduce((sum, r) => sum + r.coverage, 0) / 
            Object.values(this.results).filter(r => r.coverage > 0).length || 0
        }
      };
      
      // Save coverage report
      fs.writeFileSync('test-results.json', JSON.stringify(coverageReport, null, 2));
      
      // Generate HTML report
      this.generateHTMLReport(coverageReport);
      
      console.log('📊 Coverage report generated');
      
    } catch (error) {
      console.warn('⚠️ Could not generate coverage report:', error.message);
    }
  }

  generateHTMLReport(coverageReport) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absenta Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .coverage { color: #007bff; }
        .results { margin-top: 30px; }
        .test-result { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; }
        .test-result.passed { border-left: 4px solid #28a745; }
        .test-result.failed { border-left: 4px solid #dc3545; }
        .status { font-weight: bold; }
        .duration { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Absenta Test Results</h1>
            <p>Generated on ${new Date(coverageReport.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${coverageReport.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value passed">${coverageReport.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value failed">${coverageReport.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Coverage</h3>
                <div class="value coverage">${coverageReport.summary.averageCoverage.toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${Object.entries(coverageReport.results).map(([type, result]) => `
                <div class="test-result ${result.status}">
                    <div>
                        <strong>${type.charAt(0).toUpperCase() + type.slice(1)} Tests</strong>
                        <div class="status">${result.status === 'passed' ? '✅ Passed' : '❌ Failed'}</div>
                    </div>
                    <div>
                        <div class="duration">${result.duration}ms</div>
                        ${result.coverage > 0 ? `<div>Coverage: ${result.coverage.toFixed(1)}%</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('test-results.html', html);
  }

  displaySummary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = Object.values(this.results).filter(r => r.status === 'passed').length;
    const failed = Object.values(this.results).filter(r => r.status === 'failed').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    Object.entries(this.results).forEach(([type, result]) => {
      const status = result.status === 'passed' ? TEST_RESULTS.PASSED : TEST_RESULTS.FAILED;
      const coverage = result.coverage > 0 ? ` (${result.coverage.toFixed(1)}% coverage)` : '';
      console.log(`  ${status} ${type.charAt(0).toUpperCase() + type.slice(1)}: ${result.duration}ms${coverage}`);
    });
    
    console.log('\n📁 Reports Generated:');
    console.log('  📄 test-results.json - JSON report');
    console.log('  🌐 test-results.html - HTML report');
    console.log('  📊 coverage/ - Coverage reports');
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }
}

// Run tests
const runner = new TestRunner();
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
