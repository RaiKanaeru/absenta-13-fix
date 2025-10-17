/**
 * Test Runner dengan Coverage Threshold
 * Menjalankan semua tests dengan coverage requirements
 */

import { execSync } from 'child_process';
import fs from 'fs';

class CoverageTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.coverageThresholds = {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    };
  }

  async runTestsWithCoverage() {
    console.log('📊 Running Tests with Coverage Requirements...\n');
    
    try {
      // Run tests with coverage
      execSync('npm run test:unit -- --coverage --coverageThreshold=' + 
        JSON.stringify(this.coverageThresholds), { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Tests with coverage completed in ${duration}ms`);
      
      // Analyze coverage results
      this.analyzeCoverageResults();
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Tests with coverage failed in ${duration}ms: ${error.message}`);
      this.generateCoverageReport();
      process.exit(1);
    }
  }

  analyzeCoverageResults() {
    const coverageFile = 'coverage/coverage-summary.json';
    
    if (fs.existsSync(coverageFile)) {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      
      console.log('\n📊 Coverage Analysis:');
      console.log('='.repeat(50));
      
      const results = {
        lines: { actual: coverage.total.lines.pct, threshold: this.coverageThresholds.lines },
        functions: { actual: coverage.total.functions.pct, threshold: this.coverageThresholds.functions },
        branches: { actual: coverage.total.branches.pct, threshold: this.coverageThresholds.branches },
        statements: { actual: coverage.total.statements.pct, threshold: this.coverageThresholds.statements }
      };
      
      let allPassed = true;
      
      Object.entries(results).forEach(([metric, result]) => {
        const status = result.actual >= result.threshold ? '✅' : '❌';
        const color = result.actual >= result.threshold ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        
        console.log(`${status} ${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${color}${result.actual.toFixed(1)}%${reset} (threshold: ${result.threshold}%)`);
        
        if (result.actual < result.threshold) {
          allPassed = false;
        }
      });
      
      console.log('='.repeat(50));
      
      if (allPassed) {
        console.log('🎉 All coverage thresholds met!');
      } else {
        console.log('⚠️  Some coverage thresholds not met');
        this.generateCoverageReport();
        process.exit(1);
      }
      
    } else {
      console.log('⚠️  Coverage report not found');
      process.exit(1);
    }
  }

  generateCoverageReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      thresholds: this.coverageThresholds,
      status: 'failed',
      recommendations: [
        'Add more unit tests for uncovered code',
        'Focus on testing edge cases and error scenarios',
        'Consider testing utility functions and helpers',
        'Add integration tests for complex workflows',
        'Review and test error handling paths'
      ]
    };
    
    fs.writeFileSync('coverage-failure-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Coverage failure report saved to coverage-failure-report.json');
  }
}

// Run tests with coverage
const runner = new CoverageTestRunner();
runner.runTestsWithCoverage().catch(error => {
  console.error('❌ Coverage test runner failed:', error);
  process.exit(1);
});
