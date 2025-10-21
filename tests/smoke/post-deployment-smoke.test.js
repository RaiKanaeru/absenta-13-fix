/**
 * Post-Deployment Smoke Tests
 * 
 * Quick validation tests untuk verify bahwa deployment berhasil
 * dan system berfungsi dengan normal.
 * 
 * Run setelah deployment untuk ensure critical functionality working.
 * 
 * @module tests/smoke/post-deployment-smoke.test
 */

import fetch from 'node-fetch';
import db from '../../db.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken = '';
const testResults = [];

/**
 * Record test result
 */
const recordResult = (testName, passed, message = '') => {
  testResults.push({
    test: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    console.log(`✅ ${testName}: PASSED`);
  } else {
    console.error(`❌ ${testName}: FAILED - ${message}`);
  }
};

/**
 * Smoke Test 1: Health Check
 */
const testHealthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      recordResult('Health Check', false, `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.status === 'healthy') {
      recordResult('Health Check', true);
      return true;
    } else {
      recordResult('Health Check', false, `Status: ${data.status}`);
      return false;
    }
  } catch (error) {
    recordResult('Health Check', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 2: Database Connection
 */
const testDatabaseConnection = async () => {
  try {
    await db.execute('SELECT 1');
    recordResult('Database Connection', true);
    return true;
  } catch (error) {
    recordResult('Database Connection', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 3: Database Schema Validation
 */
const testDatabaseSchema = async () => {
  try {
    // Check users table
    const [usersTable] = await db.execute('SHOW TABLES LIKE "users"');
    if (usersTable.length === 0) {
      recordResult('Database Schema - users', false, 'Table not found');
      return false;
    }
    
    // Check siswa table
    const [siswaTable] = await db.execute('SHOW TABLES LIKE "siswa"');
    if (siswaTable.length === 0) {
      recordResult('Database Schema - siswa', false, 'Table not found');
      return false;
    }
    
    // Check users.role enum
    const [usersColumns] = await db.execute('SHOW COLUMNS FROM users LIKE "role"');
    if (!usersColumns[0].Type.includes('SISWA')) {
      recordResult('Database Schema - role enum', false, 'SISWA role not found');
      return false;
    }
    
    recordResult('Database Schema', true);
    return true;
  } catch (error) {
    recordResult('Database Schema', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 4: Data Integrity
 */
const testDataIntegrity = async () => {
  try {
    // Check for broken relationships
    const [brokenRels] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM siswa s
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    
    if (brokenRels[0].count > 0) {
      recordResult('Data Integrity - Broken Relationships', false, 
        `Found ${brokenRels[0].count} broken relationships`);
      return false;
    }
    
    // Check for invalid roles
    const [invalidRoles] = await db.execute(`
      SELECT COUNT(*) as count
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role <> 'SISWA'
    `);
    
    if (invalidRoles[0].count > 0) {
      recordResult('Data Integrity - Invalid Roles', false, 
        `Found ${invalidRoles[0].count} invalid role assignments`);
      return false;
    }
    
    recordResult('Data Integrity', true);
    return true;
  } catch (error) {
    recordResult('Data Integrity', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 5: Admin Login
 */
const testAdminLogin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }),
      timeout: 5000
    });
    
    if (!response.ok) {
      recordResult('Admin Login', false, `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data || !data.data.token) {
      recordResult('Admin Login', false, 'Invalid response structure');
      return false;
    }
    
    adminToken = data.data.token;
    recordResult('Admin Login', true);
    return true;
  } catch (error) {
    recordResult('Admin Login', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 6: Student List Endpoint
 */
const testStudentListEndpoint = async () => {
  try {
    if (!adminToken) {
      recordResult('Student List Endpoint', false, 'No admin token available');
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/admin/siswa-perwakilan`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      timeout: 5000
    });
    
    if (!response.ok) {
      recordResult('Student List Endpoint', false, `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      recordResult('Student List Endpoint', false, 'Invalid response structure');
      return false;
    }
    
    recordResult('Student List Endpoint', true);
    return true;
  } catch (error) {
    recordResult('Student List Endpoint', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 7: Student Login (Test with first active student)
 */
const testStudentLogin = async () => {
  try {
    // Get first active student with user account
    const [students] = await db.execute(`
      SELECT u.username, s.nis
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'aktif' AND u.status = 'aktif' AND u.role = 'SISWA'
      LIMIT 1
    `);
    
    if (students.length === 0) {
      recordResult('Student Login', false, 'No active students found');
      return false;
    }
    
    const student = students[0];
    
    // Try login with default password pattern (NIS@2024)
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: student.username,
        password: `${student.nis}@2024`
      }),
      timeout: 5000
    });
    
    if (!response.ok) {
      recordResult('Student Login', false, `HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data || !data.data.token) {
      recordResult('Student Login', false, 'Invalid response or missing token');
      return false;
    }
    
    if (data.data.role !== 'siswa') {
      recordResult('Student Login', false, `Wrong role: ${data.data.role}`);
      return false;
    }
    
    recordResult('Student Login', true);
    return true;
  } catch (error) {
    recordResult('Student Login', false, error.message);
    return false;
  }
};

/**
 * Smoke Test 8: Performance Check
 */
const testPerformanceCheck = async () => {
  try {
    const startTime = Date.now();
    
    // Test a simple query
    await db.execute('SELECT COUNT(*) FROM siswa');
    
    const queryTime = Date.now() - startTime;
    
    if (queryTime > 1000) {
      recordResult('Performance Check', false, `Query too slow: ${queryTime}ms`);
      return false;
    }
    
    recordResult('Performance Check', true, `Query time: ${queryTime}ms`);
    return true;
  } catch (error) {
    recordResult('Performance Check', false, error.message);
    return false;
  }
};

/**
 * Print summary report
 */
const printSummaryReport = () => {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         POST-DEPLOYMENT SMOKE TEST SUMMARY              ║
╠══════════════════════════════════════════════════════════╣
║  Total Tests: ${totalTests}                                         ║
║  Passed: ${passedTests}                                            ║
║  Failed: ${failedTests}                                            ║
║  Success Rate: ${successRate}%                                 ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
  }
  
  return failedTests === 0;
};

/**
 * Main test execution
 */
const runSmokeTests = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║       POST-DEPLOYMENT SMOKE TESTS                        ║
║       Running critical validation checks...              ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  const startTime = Date.now();
  
  // Run tests sequentially
  await testHealthCheck();
  await testDatabaseConnection();
  await testDatabaseSchema();
  await testDataIntegrity();
  await testAdminLogin();
  await testStudentListEndpoint();
  await testStudentLogin();
  await testPerformanceCheck();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️  Total execution time: ${duration}s`);
  
  // Print summary
  const allPassed = printSummaryReport();
  
  if (allPassed) {
    console.log('\n✅ DEPLOYMENT SUCCESSFUL: All smoke tests passed!');
    console.log('   System is ready for production use.');
    process.exit(0);
  } else {
    console.error('\n❌ DEPLOYMENT ISSUES DETECTED: Some smoke tests failed!');
    console.error('   Please investigate and fix the issues before proceeding.');
    process.exit(1);
  }
};

// Run smoke tests
runSmokeTests().catch((error) => {
  console.error('\n❌ CRITICAL ERROR during smoke tests:', error);
  process.exit(1);
});

