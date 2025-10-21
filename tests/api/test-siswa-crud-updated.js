/**
 * Test Suite: Siswa CRUD Endpoints (Updated Schema)
 * Tests: POST, PUT, DELETE endpoints untuk sistem users-siswa yang sudah dinormalisasi
 * 
 * Endpoints being tested:
 * - POST /api/admin/siswa
 * - PUT /api/admin/students/:id
 * - DELETE /api/admin/students/:id
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
  adminCredentials: {
    username: 'admin',
    password: 'admin123'
  },
  testStudent: {
    nis: `TEST${Date.now()}`,
    nama: 'Test Siswa Updated Schema',
    kelas_id: 1,
    username: `test_siswa_${Date.now()}`,
    password: 'test123',
    jabatan: 'Sekretaris Kelas',
    email: `test${Date.now()}@test.com`,
    jenis_kelamin: 'L',
    alamat: 'Jl. Test No. 123',
    telepon_orangtua: '08123456789',
    telepon_siswa: '08987654321'
  }
};

// Helper functions
async function login(username, password) {
  console.log(`\n🔐 Logging in as ${username}...`);
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  
  if (!data.data || !data.data.token) {
    throw new Error('Login failed: ' + (data.error || 'Unknown error'));
  }

  console.log(`✅ Logged in successfully as ${data.data.role}`);
  return data.data.token;
}

async function makeAuthRequest(endpoint, method, token, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  return {
    status: response.status,
    data
  };
}

// Test functions
async function testCreateStudent(token) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TEST 1: POST /api/admin/siswa - Create Student');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    console.log('\n📋 Test data:');
    console.log(JSON.stringify(TEST_CONFIG.testStudent, null, 2));

    const result = await makeAuthRequest(
      '/api/admin/siswa',
      'POST',
      token,
      TEST_CONFIG.testStudent
    );

    console.log(`\n📊 Response Status: ${result.status}`);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(result.data, null, 2));

    // Validations
    const checks = [];

    // Check response status
    if (result.status === 200) {
      checks.push({ name: 'Response status 200', passed: true });
    } else {
      checks.push({ name: 'Response status 200', passed: false, got: result.status });
    }

    // Check success flag
    if (result.data.success === true) {
      checks.push({ name: 'Success flag is true', passed: true });
    } else {
      checks.push({ name: 'Success flag is true', passed: false });
    }

    // Check user_id returned
    if (result.data.data && result.data.data.user_id) {
      checks.push({ name: 'User ID returned', passed: true });
      TEST_CONFIG.testStudent.user_id = result.data.data.user_id;
    } else {
      checks.push({ name: 'User ID returned', passed: false });
    }

    // Check username returned
    if (result.data.data && result.data.data.username) {
      checks.push({ name: 'Username returned', passed: true });
    } else {
      checks.push({ name: 'Username returned', passed: false });
    }

    // Check default password returned
    if (result.data.data && result.data.data.default_password) {
      checks.push({ name: 'Default password returned', passed: true });
    } else {
      checks.push({ name: 'Default password returned', passed: false });
    }

    // Print validation results
    console.log('\n✅ Validation Results:');
    checks.forEach(check => {
      if (check.passed) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}${check.got ? ` (got: ${check.got})` : ''}`);
      }
    });

    const allPassed = checks.every(c => c.passed);
    
    if (allPassed) {
      console.log('\n🎉 TEST 1: PASSED');
      return true;
    } else {
      console.log('\n❌ TEST 1: FAILED');
      return false;
    }

  } catch (error) {
    console.error('\n❌ TEST 1: ERROR');
    console.error(error.message);
    return false;
  }
}

async function testUpdateStudent(token) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TEST 2: PUT /api/admin/students/:id - Update Student');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!TEST_CONFIG.testStudent.user_id) {
    console.log('⚠️  Skipping test - No user_id from previous test');
    return false;
  }

  try {
    const updateData = {
      nis: TEST_CONFIG.testStudent.nis,
      nama: TEST_CONFIG.testStudent.nama + ' (Updated)',
      kelas_id: TEST_CONFIG.testStudent.kelas_id,
      username: TEST_CONFIG.testStudent.username,
      email: `updated_${TEST_CONFIG.testStudent.email}`,
      jenis_kelamin: 'P', // Changed
      jabatan: 'Ketua Kelas', // Changed
      alamat: 'Jl. Updated No. 456', // Changed
      telepon_orangtua: '08111111111', // Changed
      telepon_siswa: '08222222222', // Changed
      status: 'aktif'
    };

    console.log('\n📋 Update data:');
    console.log(JSON.stringify(updateData, null, 2));

    const result = await makeAuthRequest(
      `/api/admin/students/${TEST_CONFIG.testStudent.user_id}`,
      'PUT',
      token,
      updateData
    );

    console.log(`\n📊 Response Status: ${result.status}`);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(result.data, null, 2));

    // Validations
    const checks = [];

    // Check response status
    if (result.status === 200) {
      checks.push({ name: 'Response status 200', passed: true });
    } else {
      checks.push({ name: 'Response status 200', passed: false, got: result.status });
    }

    // Check success flag
    if (result.data.success === true) {
      checks.push({ name: 'Success flag is true', passed: true });
    } else {
      checks.push({ name: 'Success flag is true', passed: false });
    }

    // Check message
    if (result.data.message && result.data.message.includes('update')) {
      checks.push({ name: 'Update message returned', passed: true });
    } else {
      checks.push({ name: 'Update message returned', passed: false });
    }

    // Verify update by fetching the data back
    console.log('\n🔍 Verifying update by fetching student data...');
    const verifyResult = await makeAuthRequest(
      '/api/admin/siswa',
      'GET',
      token
    );

    if (verifyResult.status === 200 && verifyResult.data.data) {
      const updatedStudent = verifyResult.data.data.find(s => s.user_id === TEST_CONFIG.testStudent.user_id);
      
      if (updatedStudent) {
        console.log('📊 Updated student data:');
        console.log(JSON.stringify(updatedStudent, null, 2));
        
        checks.push({ name: 'Student data found after update', passed: true });
        
        // Check if nama was updated
        if (updatedStudent.nama && updatedStudent.nama.includes('Updated')) {
          checks.push({ name: 'Nama was updated correctly', passed: true });
        } else {
          checks.push({ name: 'Nama was updated correctly', passed: false });
        }
      } else {
        checks.push({ name: 'Student data found after update', passed: false });
      }
    }

    // Print validation results
    console.log('\n✅ Validation Results:');
    checks.forEach(check => {
      if (check.passed) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}${check.got ? ` (got: ${check.got})` : ''}`);
      }
    });

    const allPassed = checks.every(c => c.passed);
    
    if (allPassed) {
      console.log('\n🎉 TEST 2: PASSED');
      return true;
    } else {
      console.log('\n❌ TEST 2: FAILED');
      return false;
    }

  } catch (error) {
    console.error('\n❌ TEST 2: ERROR');
    console.error(error.message);
    return false;
  }
}

async function testDeleteStudent(token) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TEST 3: DELETE /api/admin/students/:id - Delete Student');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!TEST_CONFIG.testStudent.user_id) {
    console.log('⚠️  Skipping test - No user_id from previous test');
    return false;
  }

  try {
    console.log(`\n🗑️  Attempting to delete student with user_id: ${TEST_CONFIG.testStudent.user_id}`);

    const result = await makeAuthRequest(
      `/api/admin/students/${TEST_CONFIG.testStudent.user_id}`,
      'DELETE',
      token
    );

    console.log(`\n📊 Response Status: ${result.status}`);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(result.data, null, 2));

    // Validations
    const checks = [];

    // Check response status
    if (result.status === 200) {
      checks.push({ name: 'Response status 200', passed: true });
    } else {
      checks.push({ name: 'Response status 200', passed: false, got: result.status });
    }

    // Check success flag
    if (result.data.success === true) {
      checks.push({ name: 'Success flag is true', passed: true });
    } else {
      checks.push({ name: 'Success flag is true', passed: false });
    }

    // Check action (deleted or deactivated)
    if (result.data.action) {
      if (result.data.action === 'deleted') {
        checks.push({ name: 'Action is "deleted" (no attendance)', passed: true });
        console.log('\n📌 Student was hard deleted (no attendance records)');
      } else if (result.data.action === 'deactivated') {
        checks.push({ name: 'Action is "deactivated" (has attendance)', passed: true });
        console.log('\n📌 Student was deactivated (has attendance records)');
      } else {
        checks.push({ name: 'Valid action returned', passed: false, got: result.data.action });
      }
    } else {
      checks.push({ name: 'Action field returned', passed: false });
    }

    // Verify deletion/deactivation
    console.log('\n🔍 Verifying deletion/deactivation...');
    const verifyResult = await makeAuthRequest(
      '/api/admin/siswa',
      'GET',
      token
    );

    if (verifyResult.status === 200 && verifyResult.data.data) {
      const deletedStudent = verifyResult.data.data.find(s => s.user_id === TEST_CONFIG.testStudent.user_id);
      
      if (result.data.action === 'deleted') {
        // Should not be found
        if (!deletedStudent) {
          checks.push({ name: 'Student not found after deletion', passed: true });
        } else {
          checks.push({ name: 'Student not found after deletion', passed: false });
        }
      } else if (result.data.action === 'deactivated') {
        // Should be found but with status tidak_aktif
        if (deletedStudent && deletedStudent.status === 'tidak_aktif') {
          checks.push({ name: 'Student status is "tidak_aktif"', passed: true });
        } else {
          checks.push({ name: 'Student status is "tidak_aktif"', passed: false });
        }
      }
    }

    // Print validation results
    console.log('\n✅ Validation Results:');
    checks.forEach(check => {
      if (check.passed) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}${check.got ? ` (got: ${check.got})` : ''}`);
      }
    });

    const allPassed = checks.every(c => c.passed);
    
    if (allPassed) {
      console.log('\n🎉 TEST 3: PASSED');
      return true;
    } else {
      console.log('\n❌ TEST 3: FAILED');
      return false;
    }

  } catch (error) {
    console.error('\n❌ TEST 3: ERROR');
    console.error(error.message);
    return false;
  }
}

async function testValidationErrors(token) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TEST 4: Validation Errors - Invalid Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tests = [];

  // Test 4.1: Missing required fields
  console.log('\n4.1: Testing missing required fields (NIS)...');
  try {
    const result = await makeAuthRequest(
      '/api/admin/siswa',
      'POST',
      token,
      {
        nama: 'Test',
        kelas_id: 1,
        username: 'test',
        password: 'test'
        // NIS missing
      }
    );

    if (result.status === 400 && result.data.error) {
      console.log('✅ Correctly rejected missing NIS');
      tests.push({ name: 'Missing NIS validation', passed: true });
    } else {
      console.log('❌ Should have rejected missing NIS');
      tests.push({ name: 'Missing NIS validation', passed: false });
    }
  } catch (error) {
    console.log('❌ Error testing missing NIS:', error.message);
    tests.push({ name: 'Missing NIS validation', passed: false });
  }

  // Test 4.2: Duplicate username
  console.log('\n4.2: Testing duplicate username...');
  try {
    const result = await makeAuthRequest(
      '/api/admin/siswa',
      'POST',
      token,
      {
        nis: `DUP${Date.now()}`,
        nama: 'Test Duplicate',
        kelas_id: 1,
        username: 'admin', // Existing username
        password: 'test123'
      }
    );

    if (result.status === 400 && result.data.error && result.data.error.includes('username')) {
      console.log('✅ Correctly rejected duplicate username');
      tests.push({ name: 'Duplicate username validation', passed: true });
    } else {
      console.log('❌ Should have rejected duplicate username');
      tests.push({ name: 'Duplicate username validation', passed: false });
    }
  } catch (error) {
    console.log('❌ Error testing duplicate username:', error.message);
    tests.push({ name: 'Duplicate username validation', passed: false });
  }

  // Print results
  console.log('\n✅ Validation Error Tests:');
  tests.forEach(test => {
    if (test.passed) {
      console.log(`   ✅ ${test.name}`);
    } else {
      console.log(`   ❌ ${test.name}`);
    }
  });

  const allPassed = tests.every(t => t.passed);
  
  if (allPassed) {
    console.log('\n🎉 TEST 4: PASSED');
    return true;
  } else {
    console.log('\n❌ TEST 4: FAILED');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   SISWA CRUD ENDPOINTS TEST SUITE (Updated Schema)        ║');
  console.log('║   Testing: POST, PUT, DELETE with Users-Siswa Normalization║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Login first
    const token = await login(
      TEST_CONFIG.adminCredentials.username,
      TEST_CONFIG.adminCredentials.password
    );

    // Run tests
    const test1 = await testCreateStudent(token);
    results.tests.push({ name: 'POST /api/admin/siswa', passed: test1 });
    results.total++;
    if (test1) results.passed++; else results.failed++;

    const test2 = await testUpdateStudent(token);
    results.tests.push({ name: 'PUT /api/admin/students/:id', passed: test2 });
    results.total++;
    if (test2) results.passed++; else results.failed++;

    const test3 = await testDeleteStudent(token);
    results.tests.push({ name: 'DELETE /api/admin/students/:id', passed: test3 });
    results.total++;
    if (test3) results.passed++; else results.failed++;

    const test4 = await testValidationErrors(token);
    results.tests.push({ name: 'Validation Errors', passed: test4 });
    results.total++;
    if (test4) results.passed++; else results.failed++;

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }

  // Print final summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                     FINAL TEST SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`   ${index + 1}. ${status} ${test.name}`);
  });

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the errors above.`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});


