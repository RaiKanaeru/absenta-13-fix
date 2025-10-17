/**
 * Unit Test Runner
 * Menjalankan unit tests dengan coverage reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';

class UnitTestRunner {
  constructor() {
    this.startTime = Date.now();
  }

  async runUnitTests() {
    console.log('🧪 Running Unit Tests...\n');
    
    try {
      // Run Jest unit tests with coverage
      execSync('npm run test:unit -- --coverage --verbose --watchAll=false', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Unit tests completed in ${duration}ms`);
      
      // Check if coverage meets threshold
      this.checkCoverageThreshold();
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Unit tests failed in ${duration}ms: ${error.message}`);
      process.exit(1);
    }
  }

  checkCoverageThreshold() {
    const coverageFile = 'coverage/coverage-summary.json';
    const threshold = 80; // 80% coverage threshold
    
    if (fs.existsSync(coverageFile)) {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const linesCoverage = coverage.total.lines.pct;
      
      console.log(`\n📊 Coverage Report:`);
      console.log(`  Lines: ${linesCoverage.toFixed(1)}%`);
      console.log(`  Functions: ${coverage.total.functions.pct.toFixed(1)}%`);
      console.log(`  Branches: ${coverage.total.branches.pct.toFixed(1)}%`);
      console.log(`  Statements: ${coverage.total.statements.pct.toFixed(1)}%`);
      
      if (linesCoverage < threshold) {
        console.log(`\n⚠️  Coverage below threshold (${threshold}%)`);
        console.log(`   Current coverage: ${linesCoverage.toFixed(1)}%`);
        console.log(`   Required: ${threshold}%`);
        process.exit(1);
      } else {
        console.log(`\n🎉 Coverage meets threshold (${threshold}%)`);
      }
    } else {
      console.log('\n⚠️  Coverage report not found');
    }
  }
}

// Run unit tests
const runner = new UnitTestRunner();
runner.runUnitTests().catch(error => {
  console.error('❌ Unit test runner failed:', error);
  process.exit(1);
});
