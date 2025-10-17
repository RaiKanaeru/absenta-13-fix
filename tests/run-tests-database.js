/**
 * Database Test Runner
 * Menjalankan tests dengan database testing dan data integrity testing
 */

import { execSync } from 'child_process';
import fs from 'fs';

class DatabaseTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.databaseResults = {
      connectionTests: [],
      queryTests: [],
      transactionTests: [],
      migrationTests: [],
      performanceTests: [],
      integrityTests: [],
      securityTests: [],
      backupTests: [],
      recoveryTests: [],
      scalabilityTests: [],
      recommendations: []
    };
    this.databaseTypes = ['MySQL', 'MariaDB', 'PostgreSQL', 'SQLite'];
    this.queryTypes = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    this.transactionTypes = ['ACID', 'Isolation', 'Consistency', 'Durability'];
  }

  async runDatabaseTests() {
    console.log('🗄️ Running Database Tests...\n');
    
    try {
      // Run connection tests
      await this.runConnectionTests();
      
      // Run query tests
      await this.runQueryTests();
      
      // Run transaction tests
      await this.runTransactionTests();
      
      // Run migration tests
      await this.runMigrationTests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Run integrity tests
      await this.runIntegrityTests();
      
      // Run security tests
      await this.runSecurityTests();
      
      // Run backup tests
      await this.runBackupTests();
      
      // Run recovery tests
      await this.runRecoveryTests();
      
      // Run scalability tests
      await this.runScalabilityTests();
      
      // Analyze database results
      await this.analyzeDatabaseResults();
      
      // Generate database report
      this.generateDatabaseReport();
      
      const duration = Date.now() - this.startTime;
      console.log(`\n✅ Database tests completed in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      console.log(`\n❌ Database tests failed in ${duration}ms: ${error.message}`);
      this.generateFailureReport(error);
      process.exit(1);
    }
  }

  async runConnectionTests() {
    console.log('🔌 Running connection tests...');
    
    const connectionTests = [
      {
        name: 'Database Connection',
        command: 'npx jest --testPathPattern="database" --testNamePattern="connection"',
        description: 'Tests for database connection'
      },
      {
        name: 'Connection Pool',
        command: 'npx jest --testPathPattern="database" --testNamePattern="pool"',
        description: 'Tests for connection pool'
      },
      {
        name: 'Connection Timeout',
        command: 'npx jest --testPathPattern="database" --testNamePattern="timeout"',
        description: 'Tests for connection timeout'
      },
      {
        name: 'Connection Retry',
        command: 'npx jest --testPathPattern="database" --testNamePattern="retry"',
        description: 'Tests for connection retry'
      },
      {
        name: 'Connection Health',
        command: 'npx jest --testPathPattern="database" --testNamePattern="health"',
        description: 'Tests for connection health'
      }
    ];
    
    for (const test of connectionTests) {
      try {
        console.log(`🔌 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.connectionTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.connectionTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runQueryTests() {
    console.log('📝 Running query tests...');
    
    for (const queryType of this.queryTypes) {
      try {
        console.log(`📝 Testing query type: ${queryType}...`);
        
        // Run Jest tests for specific query type
        execSync(`npx jest --testPathPattern="database" --testNamePattern="${queryType}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.queryTests.push({
          queryType: queryType,
          status: 'passed',
          description: `Database test for query type: ${queryType}`
        });
        
        console.log(`✅ Query type ${queryType} test passed`);
        
      } catch (error) {
        this.databaseResults.queryTests.push({
          queryType: queryType,
          status: 'failed',
          description: `Database test for query type: ${queryType}`,
          error: error.message
        });
        
        console.log(`❌ Query type ${queryType} test failed: ${error.message}`);
      }
    }
  }

  async runTransactionTests() {
    console.log('🔄 Running transaction tests...');
    
    for (const transactionType of this.transactionTypes) {
      try {
        console.log(`🔄 Testing transaction type: ${transactionType}...`);
        
        // Run Jest tests for specific transaction type
        execSync(`npx jest --testPathPattern="database" --testNamePattern="${transactionType}" --reporter=json`, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.transactionTests.push({
          transactionType: transactionType,
          status: 'passed',
          description: `Database test for transaction type: ${transactionType}`
        });
        
        console.log(`✅ Transaction type ${transactionType} test passed`);
        
      } catch (error) {
        this.databaseResults.transactionTests.push({
          transactionType: transactionType,
          status: 'failed',
          description: `Database test for transaction type: ${transactionType}`,
          error: error.message
        });
        
        console.log(`❌ Transaction type ${transactionType} test failed: ${error.message}`);
      }
    }
  }

  async runMigrationTests() {
    console.log('🔄 Running migration tests...');
    
    const migrationTests = [
      {
        name: 'Migration Up',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migration-up"',
        description: 'Tests for migration up'
      },
      {
        name: 'Migration Down',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migration-down"',
        description: 'Tests for migration down'
      },
      {
        name: 'Migration Rollback',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migration-rollback"',
        description: 'Tests for migration rollback'
      },
      {
        name: 'Migration Status',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migration-status"',
        description: 'Tests for migration status'
      },
      {
        name: 'Migration Validation',
        command: 'npx jest --testPathPattern="database" --testNamePattern="migration-validation"',
        description: 'Tests for migration validation'
      }
    ];
    
    for (const test of migrationTests) {
      try {
        console.log(`🔄 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.migrationTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.migrationTests.push({
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
    console.log('⚡ Running database performance tests...');
    
    const performanceTests = [
      {
        name: 'Query Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="query-performance"',
        description: 'Tests for query performance'
      },
      {
        name: 'Index Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="index-performance"',
        description: 'Tests for index performance'
      },
      {
        name: 'Connection Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="connection-performance"',
        description: 'Tests for connection performance'
      },
      {
        name: 'Transaction Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="transaction-performance"',
        description: 'Tests for transaction performance'
      },
      {
        name: 'Bulk Operation Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="bulk-performance"',
        description: 'Tests for bulk operation performance'
      }
    ];
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.performanceTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.performanceTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runIntegrityTests() {
    console.log('🔒 Running data integrity tests...');
    
    const integrityTests = [
      {
        name: 'Data Consistency',
        command: 'npx jest --testPathPattern="database" --testNamePattern="consistency"',
        description: 'Tests for data consistency'
      },
      {
        name: 'Referential Integrity',
        command: 'npx jest --testPathPattern="database" --testNamePattern="referential"',
        description: 'Tests for referential integrity'
      },
      {
        name: 'Constraint Validation',
        command: 'npx jest --testPathPattern="database" --testNamePattern="constraint"',
        description: 'Tests for constraint validation'
      },
      {
        name: 'Data Validation',
        command: 'npx jest --testPathPattern="database" --testNamePattern="validation"',
        description: 'Tests for data validation'
      },
      {
        name: 'Data Synchronization',
        command: 'npx jest --testPathPattern="database" --testNamePattern="synchronization"',
        description: 'Tests for data synchronization'
      }
    ];
    
    for (const test of integrityTests) {
      try {
        console.log(`🔒 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.integrityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.integrityTests.push({
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
    console.log('🔐 Running database security tests...');
    
    const securityTests = [
      {
        name: 'SQL Injection',
        command: 'npx jest --testPathPattern="database" --testNamePattern="sql-injection"',
        description: 'Tests for SQL injection protection'
      },
      {
        name: 'Access Control',
        command: 'npx jest --testPathPattern="database" --testNamePattern="access-control"',
        description: 'Tests for access control'
      },
      {
        name: 'Data Encryption',
        command: 'npx jest --testPathPattern="database" --testNamePattern="encryption"',
        description: 'Tests for data encryption'
      },
      {
        name: 'Audit Logging',
        command: 'npx jest --testPathPattern="database" --testNamePattern="audit"',
        description: 'Tests for audit logging'
      },
      {
        name: 'Authentication',
        command: 'npx jest --testPathPattern="database" --testNamePattern="authentication"',
        description: 'Tests for authentication'
      }
    ];
    
    for (const test of securityTests) {
      try {
        console.log(`🔐 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.securityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.securityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runBackupTests() {
    console.log('💾 Running backup tests...');
    
    const backupTests = [
      {
        name: 'Full Backup',
        command: 'npx jest --testPathPattern="database" --testNamePattern="full-backup"',
        description: 'Tests for full backup'
      },
      {
        name: 'Incremental Backup',
        command: 'npx jest --testPathPattern="database" --testNamePattern="incremental-backup"',
        description: 'Tests for incremental backup'
      },
      {
        name: 'Backup Validation',
        command: 'npx jest --testPathPattern="database" --testNamePattern="backup-validation"',
        description: 'Tests for backup validation'
      },
      {
        name: 'Backup Compression',
        command: 'npx jest --testPathPattern="database" --testNamePattern="backup-compression"',
        description: 'Tests for backup compression'
      },
      {
        name: 'Backup Storage',
        command: 'npx jest --testPathPattern="database" --testNamePattern="backup-storage"',
        description: 'Tests for backup storage'
      }
    ];
    
    for (const test of backupTests) {
      try {
        console.log(`💾 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.backupTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.backupTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async runRecoveryTests() {
    console.log('🔄 Running recovery tests...');
    
    const recoveryTests = [
      {
        name: 'Point-in-Time Recovery',
        command: 'npx jest --testPathPattern="database" --testNamePattern="pit-recovery"',
        description: 'Tests for point-in-time recovery'
      },
      {
        name: 'Disaster Recovery',
        command: 'npx jest --testPathPattern="database" --testNamePattern="disaster-recovery"',
        description: 'Tests for disaster recovery'
      },
      {
        name: 'Data Recovery',
        command: 'npx jest --testPathPattern="database" --testNamePattern="data-recovery"',
        description: 'Tests for data recovery'
      },
      {
        name: 'Recovery Validation',
        command: 'npx jest --testPathPattern="database" --testNamePattern="recovery-validation"',
        description: 'Tests for recovery validation'
      },
      {
        name: 'Recovery Performance',
        command: 'npx jest --testPathPattern="database" --testNamePattern="recovery-performance"',
        description: 'Tests for recovery performance'
      }
    ];
    
    for (const test of recoveryTests) {
      try {
        console.log(`🔄 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.recoveryTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.recoveryTests.push({
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
    console.log('📏 Running database scalability tests...');
    
    const scalabilityTests = [
      {
        name: 'Horizontal Scaling',
        command: 'npx jest --testPathPattern="database" --testNamePattern="horizontal-scaling"',
        description: 'Tests for horizontal scaling'
      },
      {
        name: 'Vertical Scaling',
        command: 'npx jest --testPathPattern="database" --testNamePattern="vertical-scaling"',
        description: 'Tests for vertical scaling'
      },
      {
        name: 'Load Balancing',
        command: 'npx jest --testPathPattern="database" --testNamePattern="load-balancing"',
        description: 'Tests for load balancing'
      },
      {
        name: 'Sharding',
        command: 'npx jest --testPathPattern="database" --testNamePattern="sharding"',
        description: 'Tests for database sharding'
      },
      {
        name: 'Replication',
        command: 'npx jest --testPathPattern="database" --testNamePattern="replication"',
        description: 'Tests for database replication'
      }
    ];
    
    for (const test of scalabilityTests) {
      try {
        console.log(`📏 Running ${test.name}...`);
        execSync(test.command, { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        
        this.databaseResults.scalabilityTests.push({
          name: test.name,
          status: 'passed',
          description: test.description
        });
        
        console.log(`✅ ${test.name} passed`);
        
      } catch (error) {
        this.databaseResults.scalabilityTests.push({
          name: test.name,
          status: 'failed',
          description: test.description,
          error: error.message
        });
        
        console.log(`❌ ${test.name} failed: ${error.message}`);
      }
    }
  }

  async analyzeDatabaseResults() {
    console.log('📊 Analyzing database results...');
    
    // Analyze all test categories
    const testCategories = [
      'connectionTests', 'queryTests', 'transactionTests', 'migrationTests',
      'performanceTests', 'integrityTests', 'securityTests', 'backupTests',
      'recoveryTests', 'scalabilityTests'
    ];
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const category of testCategories) {
      const tests = this.databaseResults[category];
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      
      totalTests += tests.length;
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`📈 ${category}: ${tests.length} tests (${passed} passed, ${failed} failed)`);
    }
    
    // Generate recommendations
    this.generateDatabaseRecommendations();
    
    console.log(`📈 Database Analysis:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    
    if (totalFailed > 0) {
      console.log('⚠️  Database issues found!');
    }
  }

  generateDatabaseRecommendations() {
    const recommendations = [];
    
    // Check for common database issues
    const failedConnectionTests = this.databaseResults.connectionTests.filter(t => t.status === 'failed');
    if (failedConnectionTests.length > 0) {
      recommendations.push('Fix failed connection tests');
    }
    
    const failedQueryTests = this.databaseResults.queryTests.filter(t => t.status === 'failed');
    if (failedQueryTests.length > 0) {
      recommendations.push('Address query test issues');
    }
    
    const failedTransactionTests = this.databaseResults.transactionTests.filter(t => t.status === 'failed');
    if (failedTransactionTests.length > 0) {
      recommendations.push('Fix transaction test issues');
    }
    
    const failedMigrationTests = this.databaseResults.migrationTests.filter(t => t.status === 'failed');
    if (failedMigrationTests.length > 0) {
      recommendations.push('Address migration test issues');
    }
    
    const failedPerformanceTests = this.databaseResults.performanceTests.filter(t => t.status === 'failed');
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Fix performance test issues');
    }
    
    const failedIntegrityTests = this.databaseResults.integrityTests.filter(t => t.status === 'failed');
    if (failedIntegrityTests.length > 0) {
      recommendations.push('Address integrity test issues');
    }
    
    const failedSecurityTests = this.databaseResults.securityTests.filter(t => t.status === 'failed');
    if (failedSecurityTests.length > 0) {
      recommendations.push('Fix security test issues');
    }
    
    const failedBackupTests = this.databaseResults.backupTests.filter(t => t.status === 'failed');
    if (failedBackupTests.length > 0) {
      recommendations.push('Address backup test issues');
    }
    
    const failedRecoveryTests = this.databaseResults.recoveryTests.filter(t => t.status === 'failed');
    if (failedRecoveryTests.length > 0) {
      recommendations.push('Fix recovery test issues');
    }
    
    const failedScalabilityTests = this.databaseResults.scalabilityTests.filter(t => t.status === 'failed');
    if (failedScalabilityTests.length > 0) {
      recommendations.push('Address scalability test issues');
    }
    
    // General database recommendations
    recommendations.push('Implement comprehensive database testing');
    recommendations.push('Add connection testing');
    recommendations.push('Implement query testing');
    recommendations.push('Add transaction testing');
    recommendations.push('Implement migration testing');
    recommendations.push('Add performance testing');
    recommendations.push('Implement integrity testing');
    recommendations.push('Add security testing');
    recommendations.push('Implement backup testing');
    recommendations.push('Add recovery testing');
    recommendations.push('Implement scalability testing');
    recommendations.push('Add database monitoring');
    recommendations.push('Implement database optimization');
    recommendations.push('Add database reporting');
    recommendations.push('Implement database maintenance');
    recommendations.push('Add database documentation');
    recommendations.push('Implement database best practices');
    
    this.databaseResults.recommendations = recommendations;
  }

  generateDatabaseReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0
      },
      connectionTests: this.databaseResults.connectionTests,
      queryTests: this.databaseResults.queryTests,
      transactionTests: this.databaseResults.transactionTests,
      migrationTests: this.databaseResults.migrationTests,
      performanceTests: this.databaseResults.performanceTests,
      integrityTests: this.databaseResults.integrityTests,
      securityTests: this.databaseResults.securityTests,
      backupTests: this.databaseResults.backupTests,
      recoveryTests: this.databaseResults.recoveryTests,
      scalabilityTests: this.databaseResults.scalabilityTests,
      recommendations: this.databaseResults.recommendations,
      status: this.getDatabaseStatus()
    };
    
    // Calculate summary
    const testCategories = [
      'connectionTests', 'queryTests', 'transactionTests', 'migrationTests',
      'performanceTests', 'integrityTests', 'securityTests', 'backupTests',
      'recoveryTests', 'scalabilityTests'
    ];
    
    for (const category of testCategories) {
      const tests = this.databaseResults[category];
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
    fs.writeFileSync('database-test-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown report
    this.generateMarkdownReport(report);
    
    console.log('📄 Database report generated');
  }

  generateMarkdownReport(report) {
    const markdown = `# Database Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration}ms

## Summary
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed}
- **Failed**: ${report.summary.totalFailed}
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Connection Tests
${report.connectionTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Query Tests
${report.queryTests.map(test => `
### ${test.queryType}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Transaction Tests
${report.transactionTests.map(test => `
### ${test.transactionType}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Migration Tests
${report.migrationTests.map(test => `
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

## Integrity Tests
${report.integrityTests.map(test => `
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

## Backup Tests
${report.backupTests.map(test => `
### ${test.name}
- **Status**: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}
- **Description**: ${test.description}
${test.error ? `- **Error**: ${test.error}` : ''}
`).join('')}

## Recovery Tests
${report.recoveryTests.map(test => `
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

## Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Database Status
${report.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}

## Database Testing Checklist
- [ ] Connection testing is implemented
- [ ] Query testing is implemented
- [ ] Transaction testing is implemented
- [ ] Migration testing is implemented
- [ ] Performance testing is implemented
- [ ] Integrity testing is implemented
- [ ] Security testing is implemented
- [ ] Backup testing is implemented
- [ ] Recovery testing is implemented
- [ ] Scalability testing is implemented

## Next Steps
1. Review all failed database tests
2. Implement recommended database improvements
3. Add comprehensive database testing
4. Implement database monitoring
5. Consider database optimization
`;
    
    fs.writeFileSync('database-report.md', markdown);
  }

  getDatabaseStatus() {
    const totalTests = this.databaseResults.connectionTests.length + 
                      this.databaseResults.queryTests.length + 
                      this.databaseResults.transactionTests.length + 
                      this.databaseResults.migrationTests.length + 
                      this.databaseResults.performanceTests.length + 
                      this.databaseResults.integrityTests.length + 
                      this.databaseResults.securityTests.length + 
                      this.databaseResults.backupTests.length + 
                      this.databaseResults.recoveryTests.length + 
                      this.databaseResults.scalabilityTests.length;
    
    const totalFailed = this.databaseResults.connectionTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.queryTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.transactionTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.migrationTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.performanceTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.integrityTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.securityTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.backupTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.recoveryTests.filter(t => t.status === 'failed').length + 
                       this.databaseResults.scalabilityTests.filter(t => t.status === 'failed').length;
    
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
      databaseResults: this.databaseResults
    };
    
    fs.writeFileSync('database-failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Database failure report saved to database-failure-report.json');
  }
}

// Run database tests
const runner = new DatabaseTestRunner();
runner.runDatabaseTests().catch(error => {
  console.error('❌ Database test runner failed:', error);
  process.exit(1);
});