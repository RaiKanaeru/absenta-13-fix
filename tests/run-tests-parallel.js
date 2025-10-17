/**
 * Parallel Test Runner
 * Menjalankan tests secara parallel untuk performa yang lebih baik
 */

import { spawn } from 'child_process';
import fs from 'fs';

class ParallelTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.processes = [];
    this.results = {
      unit: { status: 'pending', duration: 0, output: '' },
      integration: { status: 'pending', duration: 0, output: '' },
      e2e: { status: 'pending', duration: 0, output: '' }
    };
  }

  async runTestsInParallel() {
    console.log('⚡ Running Tests in Parallel...\n');
    
    try {
      // Start all test types in parallel
      await Promise.all([
        this.runUnitTests(),
        this.runIntegrationTests(),
        this.runE2ETests()
      ]);
      
      const totalDuration = Date.now() - this.startTime;
      console.log(`\n✅ All tests completed in parallel in ${totalDuration}ms`);
      
      // Display results
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Parallel test execution failed:', error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  async runUnitTests() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log('🧪 Starting unit tests...');
      
      const process = spawn('npm', ['run', 'test:unit', '--', '--coverage', '--verbose'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        this.results.unit = {
          status: code === 0 ? 'passed' : 'failed',
          duration,
          output
        };
        
        if (code === 0) {
          console.log(`✅ Unit tests completed in ${duration}ms`);
        } else {
          console.log(`❌ Unit tests failed in ${duration}ms`);
        }
        
        resolve();
      });
      
      process.on('error', (error) => {
        reject(error);
      });
      
      this.processes.push(process);
    });
  }

  async runIntegrationTests() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log('🔗 Starting integration tests...');
      
      const process = spawn('npm', ['run', 'test:integration', '--', '--verbose'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        this.results.integration = {
          status: code === 0 ? 'passed' : 'failed',
          duration,
          output
        };
        
        if (code === 0) {
          console.log(`✅ Integration tests completed in ${duration}ms`);
        } else {
          console.log(`❌ Integration tests failed in ${duration}ms`);
        }
        
        resolve();
      });
      
      process.on('error', (error) => {
        reject(error);
      });
      
      this.processes.push(process);
    });
  }

  async runE2ETests() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      console.log('🎭 Starting E2E tests...');
      
      const process = spawn('npx', ['playwright', 'test', '--reporter=html'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        this.results.e2e = {
          status: code === 0 ? 'passed' : 'failed',
          duration,
          output
        };
        
        if (code === 0) {
          console.log(`✅ E2E tests completed in ${duration}ms`);
        } else {
          console.log(`❌ E2E tests failed in ${duration}ms`);
        }
        
        resolve();
      });
      
      process.on('error', (error) => {
        reject(error);
      });
      
      this.processes.push(process);
    });
  }

  displayResults() {
    const totalDuration = Date.now() - this.startTime;
    const passed = Object.values(this.results).filter(r => r.status === 'passed').length;
    const failed = Object.values(this.results).filter(r => r.status === 'failed').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PARALLEL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    Object.entries(this.results).forEach(([type, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${type.charAt(0).toUpperCase() + type.slice(1)}: ${result.duration}ms`);
    });
    
    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      results: this.results,
      summary: { passed, failed, successRate: ((passed / (passed + failed)) * 100).toFixed(1) }
    };
    
    fs.writeFileSync('parallel-test-results.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Parallel test results saved to parallel-test-results.json');
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed in parallel!');
    }
  }

  cleanup() {
    this.processes.forEach(process => {
      if (process && !process.killed) {
        process.kill('SIGTERM');
      }
    });
  }
}

// Run tests in parallel
const runner = new ParallelTestRunner();
runner.runTestsInParallel().catch(error => {
  console.error('❌ Parallel test runner failed:', error);
  process.exit(1);
});
