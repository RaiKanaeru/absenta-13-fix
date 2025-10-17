/**
 * Performance Test Runner
 * Menjalankan tests dengan performance testing dan load testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class PerformanceTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.performanceResults = {
      loadTests: [],
      stressTests: [],
      spikeTests: [],
      volumeTests: [],
      enduranceTests: [],
      scalabilityTests: [],
      memoryTests: [],
      cpuTests: [],
      networkTests: [],
      databaseTests: [],
      apiTests: [],
      frontendTests: [],
      recommendations: []
    };
    this.loadScenarios = [
      { name: 'Light Load', users: 10, duration: '5m' },
      { name: 'Medium Load', users: 50, duration: '10m' },
      { name: 'Heavy Load', users: 100, duration: '15m' },
      { name: 'Peak Load', users: 200, duration: '20m' }
    ];
    this.stressScenarios = [
      { name: 'CPU Stress', cpuLoad: 80, duration: '10m' },
      { name: 'Memory Stress', memoryLoad: 90, duration: '10m' },
      { name: 'Network Stress', networkLoad: 70, duration: '10m' },
      { name: 'Database Stress', dbLoad: 85, duration: '10m' }
    ];
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...\n');
    
    try {
      // Run load tests
      await this.runLoadTests();
      
      // Run stress tests
      await this.runStressTests();
      
      // Run spike tests
      await this.runSpikeTests();
      
      // Run volume tests
      await this.runVolumeTests();
      
      // Run endurance tests
      await this.runEnduranceTests();
      
      // Run scalability tests
      await this.runScalabilityTests();
      
      // Run memory tests
      await this.runMemoryTests();
      
      // Run CPU tests
      await this.runCPUTests();
      
      // Run network tests
      await this.runNetworkTests();
      
      // Run database tests
      await this.runDatabaseTests();
      
      // Run API tests
      await this.runAPITests();
      
      // Run frontend tests
      await this.runFrontendTests();
      
      // Analyze performance results
      await this.analyzePerformanceResults();
      
      // Generate performance report
      this.generatePerformanceReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Performance tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Performance tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runLoadTests() {
    console.log('📊 Running load tests...');
    
    for (const scenario of this.loadScenarios) {
      try {
        console.log(`📊 Testing load scenario: ${scenario.name} (${scenario.users} users, ${scenario.duration})...`);
        
        // Run load test for specific scenario
        execSync(`npx k6 run --vus ${scenario.users} --duration ${scenario.duration} load-test.js`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.loadTests.push({
          scenario: scenario.name,
          users: scenario.users,
          duration: scenario.duration,
          status: 'passed',
          description: `Load test for scenario: ${scenario.name}`
        });
        
        console.log(`✅ Load test ${scenario.name} passed`);
        
      } catch (error) {
        this.performanceResults.loadTests.push({
          scenario: scenario.name,
          users: scenario.users,
          duration: scenario.duration,
          status: 'failed',
          description: `Load test for scenario: ${scenario.name}`,
          error: error.message
        });
        
        console.log(`❌ Load test ${scenario.name} failed: ${error.message}`);
      }
    }
  }

  async runStressTests() {
    console.log('🔥 Running stress tests...');
    
    for (const scenario of this.stressScenarios) {
      try {
        console.log(`🔥 Testing stress scenario: ${scenario.name}...`);
        
        // Run stress test for specific scenario
        execSync(`npx k6 run --vus 100 --duration 10m stress-test.js`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.stressTests.push({
          scenario: scenario.name,
          status: 'passed',
          description: `Stress test for scenario: ${scenario.name}`
        });
        
        console.log(`✅ Stress test ${scenario.name} passed`);
        
      } catch (error) {
        this.performanceResults.stressTests.push({
          scenario: scenario.name,
          status: 'failed',
          description: `Stress test for scenario: ${scenario.name}`,
          error: error.message
        });
        
        console.log(`❌ Stress test ${scenario.name} failed: ${error.message}`);
      }
    }
  }

  async runSpikeTests() {
    console.log('📈 Running spike tests...');
    
    const spikeTests = [
      {
        name: 'User Spike',
        command: 'npx k6 run --vus 10 --duration 1m --vus-max 100 spike-test.js',
        description: 'Tests for user spike handling'
      },
      {
        name: 'Traffic Spike',
        command: 'npx k6 run --vus 50 --duration 2m --vus-max 500 spike-test.js',
        description: 'Tests for traffic spike handling'
      },
      {
        name: 'Data Spike',
        command: 'npx k6 run --vus 20 --duration 3m --vus-max 200 spike-test.js',
        description: 'Tests for data spike handling'
      },
      {
        name: 'API Spike',
        command: 'npx k6 run --vus 30 --duration 4m --vus-max 300 spike-test.js',
        description: 'Tests for API spike handling'
      }
    ];
    
    for (const test of spikeTests) {
      try {
        console.log(`📈 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.spikeTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.spikeTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runVolumeTests() {
    console.log('📦 Running volume tests...');
    
    const volumeTests = [
      {
        name: 'Data Volume',
        command: 'npx k6 run --vus 100 --duration 15m volume-test.js',
        description: 'Tests for data volume handling'
      },
      {
        name: 'File Volume',
        command: 'npx k6 run --vus 50 --duration 10m file-volume-test.js',
        description: 'Tests for file volume handling'
      },
      {
        name: 'Request Volume',
        command: 'npx k6 run --vus 200 --duration 20m request-volume-test.js',
        description: 'Tests for request volume handling'
      },
      {
        name: 'Concurrent Volume',
        command: 'npx k6 run --vus 150 --duration 25m concurrent-volume-test.js',
        description: 'Tests for concurrent volume handling'
      }
    ];
    
    for (const test of volumeTests) {
      try {
        console.log(`📦 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.volumeTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.volumeTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runEnduranceTests() {
    console.log('⏱️ Running endurance tests...');
    
    const enduranceTests = [
      {
        name: 'Long Duration',
        command: 'npx k6 run --vus 50 --duration 60m endurance-test.js',
        description: 'Tests for long duration performance'
      },
      {
        name: 'Memory Leak',
        command: 'npx k6 run --vus 30 --duration 45m memory-leak-test.js',
        description: 'Tests for memory leak detection'
      },
      {
        name: 'Resource Exhaustion',
        command: 'npx k6 run --vus 40 --duration 30m resource-exhaustion-test.js',
        description: 'Tests for resource exhaustion'
      },
      {
        name: 'Stability Test',
        command: 'npx k6 run --vus 25 --duration 90m stability-test.js',
        description: 'Tests for system stability'
      }
    ];
    
    for (const test of enduranceTests) {
      try {
        console.log(`⏱️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.enduranceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.enduranceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runScalabilityTests() {
    console.log('📏 Running scalability tests...');
    
    const scalabilityTests = [
      {
        name: 'Horizontal Scaling',
        command: 'npx k6 run --vus 10 --duration 10m horizontal-scaling-test.js',
        description: 'Tests for horizontal scaling'
      },
      {
        name: 'Vertical Scaling',
        command: 'npx k6 run --vus 20 --duration 15m vertical-scaling-test.js',
        description: 'Tests for vertical scaling'
      },
      {
        name: 'Auto Scaling',
        command: 'npx k6 run --vus 30 --duration 20m auto-scaling-test.js',
        description: 'Tests for auto scaling'
      },
      {
        name: 'Load Balancing',
        command: 'npx k6 run --vus 40 --duration 25m load-balancing-test.js',
        description: 'Tests for load balancing'
      }
    ];
    
    for (const test of scalabilityTests) {
      try {
        console.log(`📏 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.scalabilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.scalabilityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runMemoryTests() {
    console.log('🧠 Running memory tests...');
    
    const memoryTests = [
      {
        name: 'Memory Usage',
        command: 'npx k6 run --vus 50 --duration 10m memory-usage-test.js',
        description: 'Tests for memory usage'
      },
      {
        name: 'Memory Leak',
        command: 'npx k6 run --vus 30 --duration 20m memory-leak-test.js',
        description: 'Tests for memory leak detection'
      },
      {
        name: 'Garbage Collection',
        command: 'npx k6 run --vus 40 --duration 15m gc-test.js',
        description: 'Tests for garbage collection'
      },
      {
        name: 'Memory Optimization',
        command: 'npx k6 run --vus 25 --duration 12m memory-optimization-test.js',
        description: 'Tests for memory optimization'
      }
    ];
    
    for (const test of memoryTests) {
      try {
        console.log(`🧠 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.memoryTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.memoryTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runCPUTests() {
    console.log('💻 Running CPU tests...');
    
    const cpuTests = [
      {
        name: 'CPU Usage',
        command: 'npx k6 run --vus 100 --duration 10m cpu-usage-test.js',
        description: 'Tests for CPU usage'
      },
      {
        name: 'CPU Intensive',
        command: 'npx k6 run --vus 50 --duration 15m cpu-intensive-test.js',
        description: 'Tests for CPU intensive operations'
      },
      {
        name: 'CPU Optimization',
        command: 'npx k6 run --vus 75 --duration 12m cpu-optimization-test.js',
        description: 'Tests for CPU optimization'
      },
      {
        name: 'CPU Scaling',
        command: 'npx k6 run --vus 60 --duration 18m cpu-scaling-test.js',
        description: 'Tests for CPU scaling'
      }
    ];
    
    for (const test of cpuTests) {
      try {
        console.log(`💻 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.cpuTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.cpuTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runNetworkTests() {
    console.log('🌐 Running network tests...');
    
    const networkTests = [
      {
        name: 'Network Latency',
        command: 'npx k6 run --vus 80 --duration 10m network-latency-test.js',
        description: 'Tests for network latency'
      },
      {
        name: 'Network Throughput',
        command: 'npx k6 run --vus 60 --duration 15m network-throughput-test.js',
        description: 'Tests for network throughput'
      },
      {
        name: 'Network Stability',
        command: 'npx k6 run --vus 40 --duration 20m network-stability-test.js',
        description: 'Tests for network stability'
      },
      {
        name: 'Network Optimization',
        command: 'npx k6 run --vus 70 --duration 12m network-optimization-test.js',
        description: 'Tests for network optimization'
      }
    ];
    
    for (const test of networkTests) {
      try {
        console.log(`🌐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.networkTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.networkTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runDatabaseTests() {
    console.log('🗄️ Running database tests...');
    
    const databaseTests = [
      {
        name: 'Database Performance',
        command: 'npx k6 run --vus 100 --duration 10m database-performance-test.js',
        description: 'Tests for database performance'
      },
      {
        name: 'Query Performance',
        command: 'npx k6 run --vus 80 --duration 15m query-performance-test.js',
        description: 'Tests for query performance'
      },
      {
        name: 'Connection Pool',
        command: 'npx k6 run --vus 60 --duration 12m connection-pool-test.js',
        description: 'Tests for connection pool'
      },
      {
        name: 'Database Scaling',
        command: 'npx k6 run --vus 90 --duration 18m database-scaling-test.js',
        description: 'Tests for database scaling'
      }
    ];
    
    for (const test of databaseTests) {
      try {
        console.log(`🗄️ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.databaseTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.databaseTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runAPITests() {
    console.log('🔌 Running API tests...');
    
    const apiTests = [
      {
        name: 'API Response Time',
        command: 'npx k6 run --vus 50 --duration 10m api-response-time-test.js',
        description: 'Tests for API response time'
      },
      {
        name: 'API Throughput',
        command: 'npx k6 run --vus 75 --duration 15m api-throughput-test.js',
        description: 'Tests for API throughput'
      },
      {
        name: 'API Error Rate',
        command: 'npx k6 run --vus 60 --duration 12m api-error-rate-test.js',
        description: 'Tests for API error rate'
      },
      {
        name: 'API Load Balancing',
        command: 'npx k6 run --vus 80 --duration 18m api-load-balancing-test.js',
        description: 'Tests for API load balancing'
      }
    ];
    
    for (const test of apiTests) {
      try {
        console.log(`🔌 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.apiTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.apiTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runFrontendTests() {
    console.log('🎨 Running frontend tests...');
    
    const frontendTests = [
      {
        name: 'Page Load Time',
        command: 'npx k6 run --vus 30 --duration 10m page-load-time-test.js',
        description: 'Tests for page load time'
      },
      {
        name: 'Frontend Performance',
        command: 'npx k6 run --vus 40 --duration 15m frontend-performance-test.js',
        description: 'Tests for frontend performance'
      },
      {
        name: 'Resource Loading',
        command: 'npx k6 run --vus 25 --duration 12m resource-loading-test.js',
        description: 'Tests for resource loading'
      },
      {
        name: 'User Experience',
        command: 'npx k6 run --vus 35 --duration 18m user-experience-test.js',
        description: 'Tests for user experience'
      }
    ];
    
    for (const test of frontendTests) {
      try {
        console.log(`🎨 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.performanceResults.frontendTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.performanceResults.frontendTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzePerformanceResults() {
    console.log('📊 Analyzing performance results...');
    
    // Analyze all test categories
    const testCategories = [
      'loadTests', 'stressTests', 'spikeTests', 'volumeTests',
      'enduranceTests', 'scalabilityTests', 'memoryTests', 'cpuTests',
      'networkTests', 'databaseTests', 'apiTests', 'frontendTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.performanceResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generatePerformanceRecommendations();
    
    console.log(`📈 Performance Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  Performance issues found!');
    }
  }

  generatePerformanceRecommendations() {
    const recommendations = [];
    
    // Check for common performance issues
    const failedLoadTests = this.performanceResults.loadTests.filter(t => t.status === 'failed');
    if (failedLoadTests.length > 0) {
      recommendations.push('Fix failed load tests');
    }
    
    const failedStressTests = this.performanceResults.stressTests.filter(t => t.status === 'failed');
    if (failedStressTests.length > 0) {
      recommendations.push('Address stress test issues');
    }
    
    const failedSpikeTests = this.performanceResults.spikeTests.filter(t => t.status === 'failed');
    if (failedSpikeTests.length > 0) {
      recommendations.push('Fix spike test issues');
    }
    
    const failedVolumeTests = this.performanceResults.volumeTests.filter(t => t.status === 'failed');
    if (failedVolumeTests.length > 0) {
      recommendations.push('Address volume test issues');
    }
    
    const failedEnduranceTests = this.performanceResults.enduranceTests.filter(t => t.status === 'failed');
    if (failedEnduranceTests.length > 0) {
      recommendations.push('Fix endurance test issues');
    }
    
    const failedScalabilityTests = this.performanceResults.scalabilityTests.filter(t => t.status === 'failed');
    if (failedScalabilityTests.length > 0) {
      recommendations.push('Address scalability test issues');
    }
    
    const failedMemoryTests = this.performanceResults.memoryTests.filter(t => t.status === 'failed');
    if (failedMemoryTests.length > 0) {
      recommendations.push('Fix memory test issues');
    }
    
    const failedCPUTests = this.performanceResults.cpuTests.filter(t => t.status === 'failed');
    if (failedCPUTests.length > 0) {
      recommendations.push('Address CPU test issues');
    }
    
    const failedNetworkTests = this.performanceResults.networkTests.filter(t => t.status === 'failed');
    if (failedNetworkTests.length > 0) {
      recommendations.push('Fix network test issues');
    }
    
    const failedDatabaseTests = this.performanceResults.databaseTests.filter(t => t.status === 'failed');
    if (failedDatabaseTests.length > 0) {
      recommendations.push('Address database test issues');
    }
    
    const failedAPITests = this.performanceResults.apiTests.filter(t => t.status === 'failed');
    if (failedAPITests.length > 0) {
      recommendations.push('Fix API test issues');
    }
    
    const failedFrontendTests = this.performanceResults.frontendTests.filter(t => t.status === 'failed');
    if (failedFrontendTests.length > 0) {
      recommendations.push('Address frontend test issues');
    }
    
    // General performance recommendations
    recommendations.push('Implement comprehensive performance testing');
    recommendations.push('Add load testing');
    recommendations.push('Implement stress testing');
    recommendations.push('Add spike testing');
    recommendations.push('Implement volume testing');
    recommendations.push('Add endurance testing');
    recommendations.push('Implement scalability testing');
    recommendations.push('Add memory testing');
    recommendations.push('Implement CPU testing');
    recommendations.push('Add network testing');
    recommendations.push('Implement database testing');
    recommendations.push('Add API testing');
    recommendations.push('Implement frontend testing');
    recommendations.push('Add performance monitoring');
    recommendations.push('Implement performance optimization');
    recommendations.push('Add performance reporting');
    recommendations.push('Implement performance maintenance');
    recommendations.push('Add performance documentation');
    recommendations.push('Implement performance best practices');
    
    this.performanceResults.recommendations = recommendations;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      loadTests: this.performanceResults.loadTests,
      stressTests: this.performanceResults.stressTests,
      spikeTests: this.performanceResults.spikeTests,
      volumeTests: this.performanceResults.volumeTests,
      enduranceTests: this.performanceResults.enduranceTests,
      scalabilityTests: this.performanceResults.scalabilityTests,
      memoryTests: this.performanceResults.memoryTests,
      cpuTests: this.performanceResults.cpuTests,
      networkTests: this.performanceResults.networkTests,
      databaseTests: this.performanceResults.databaseTests,
      apiTests: this.performanceResults.apiTests,
      frontendTests: this.performanceResults.frontendTests,
      recommendations: this.performanceResults.recommendations,
      status: this.getPerformanceStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'loadTests', 'stressTests', 'spikeTests', 'volumeTests',
      'enduranceTests', 'scalabilityTests', 'memoryTests', 'cpuTests',
      'networkTests', 'databaseTests', 'apiTests', 'frontendTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.performanceResults[category];
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
    fs.writeFileSync('performance-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Performance report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Performance Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Load Tests
${report.loadTests.map(test => `
### ${test.scenario}
- **Users**: ${test.users}
- **Duration**: ${test.duration}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Stress Tests
${report.stressTests.map(test => `
### ${test.scenario}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Spike Tests
${report.spikeTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Volume Tests
${report.volumeTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Endurance Tests
${report.enduranceTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Scalability Tests
${report.scalabilityTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Memory Tests
${report.memoryTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## CPU Tests
${report.cpuTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Network Tests
${report.networkTests.map(test => `
### ${test.name}
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

## API Tests
${report.apiTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Frontend Tests
${report.frontendTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Performance Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Performance Testing Checklist
- [ ] Load testing is implemented
- [ ] Stress testing is implemented
- [ ] Spike testing is implemented
- [ ] Volume testing is implemented
- [ ] Endurance testing is implemented
- [ ] Scalability testing is implemented
- [ ] Memory testing is implemented
- [ ] CPU testing is implemented
- [ ] Network testing is implemented
- [ ] Database testing is implemented
- [ ] API testing is implemented
- [ ] Frontend testing is implemented

## Next Steps
1. Review all failed performance tests
2. Implement recommended performance improvements
3. Add comprehensive performance testing
4. Implement performance monitoring
5. Consider performance optimization
`;
    
    fs.writeFileSync('performance-report.md', markdown);
  }

  getPerformanceStatus() {
    const totalTests = this.performanceResults.loadTests.length + 
                      this.performanceResults.stressTests.length + 
                      this.performanceResults.spikeTests.length + 
                      this.performanceResults.volumeTests.length + 
                      this.performanceResults.enduranceTests.length + 
                      this.performanceResults.scalabilityTests.length + 
                      this.performanceResults.memoryTests.length + 
                      this.performanceResults.cpuTests.length + 
                      this.performanceResults.networkTests.length + 
                      this.performanceResults.databaseTests.length + 
                      this.performanceResults.apiTests.length + 
                      this.performanceResults.frontendTests.length;
    
    const totalFailed = this.performanceResults.loadTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.stressTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.spikeTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.volumeTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.enduranceTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.scalabilityTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.memoryTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.cpuTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.networkTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.databaseTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.apiTests.filter(t => t.status === 'failed').length + 
                       this.performanceResults.frontendTests.filter(t => t.status === 'failed').length;
    
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
      performanceResults: this.performanceResults
    };
    
    fs.writeFileSync('performance-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Performance failure report saved to performance-failure-report.json');
  }
}

// Run performance tests
const runner = new PerformanceTestRunner();
runner.runPerformanceTests().catch(error => {
  console.error('❌ Performance test runner failed:', error);
  process.exit(1);
});