/**
 * Test Watch Mode Runner
 * Menjalankan tests dalam watch mode untuk development
 */

import { spawn } from 'child_process';
import fs from 'fs';

class TestWatchRunner {
  constructor() {
    this.processes = [];
    this.isRunning = false;
  }

  async startWatchMode() {
    console.log('👀 Starting Test Watch Mode...\n');
    console.log('Press Ctrl+C to stop all tests\n');
    
    this.isRunning = true;
    
    // Start unit tests in watch mode
    this.startUnitTestsWatch();
    
    // Start integration tests in watch mode (if available)
    this.startIntegrationTestsWatch();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping test watch mode...');
      this.stopAllTests();
      process.exit(0);
    });
  }

  startUnitTestsWatch() {
    console.log('🧪 Starting unit tests in watch mode...');
    
    const unitTestProcess = spawn('npm', ['run', 'test:unit', '--', '--watch'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    unitTestProcess.on('error', (error) => {
      console.error('❌ Unit test watch failed:', error);
    });
    
    this.processes.push(unitTestProcess);
  }

  startIntegrationTestsWatch() {
    // Check if integration test watch is available
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.scripts['test:integration:watch']) {
      console.log('🔗 Starting integration tests in watch mode...');
      
      const integrationTestProcess = spawn('npm', ['run', 'test:integration:watch'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      integrationTestProcess.on('error', (error) => {
        console.error('❌ Integration test watch failed:', error);
      });
      
      this.processes.push(integrationTestProcess);
    } else {
      console.log('ℹ️  Integration test watch not available');
    }
  }

  stopAllTests() {
    this.isRunning = false;
    
    this.processes.forEach(process => {
      if (process && !process.killed) {
        process.kill('SIGTERM');
      }
    });
    
    console.log('✅ All test processes stopped');
  }
}

// Start watch mode
const runner = new TestWatchRunner();
runner.startWatchMode().catch(error => {
  console.error('❌ Test watch runner failed:', error);
  process.exit(1);
});
