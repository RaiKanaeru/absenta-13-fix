/**
 * Integration Tests for Users-Siswa Normalization
 * 
 * Comprehensive test suite untuk validasi full normalization
 * antara tabel users dan siswa.
 * 
 * @module tests/integration/users-siswa-integration.test
 */

import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import db from '../../db.js';

const API_BASE_URL = 'http://localhost:3001';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

let adminToken = '';
let testUserId = null;
let testSiswaId = null;
let connection;

/**
 * Login as admin to get authentication token
 */
const loginAsAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: ADMIN_USERNAME, 
        password: ADMIN_PASSWORD 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      adminToken = data.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.error('❌ Admin login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Fatal Error during login:', error.message);
    return false;
  }
};

/**
 * Cleanup test data
 */
const cleanup = async () => {
  if (testUserId) {
    try {
      console.log(`🧹 Cleaning up test data (User ID: ${testUserId})...`);
      
      connection = await db.getConnection();
      await connection.beginTransaction();
      
      // Delete siswa first (foreign key dependency)
      await connection.execute(
        'DELETE FROM siswa WHERE user_id = ?',
        [testUserId]
      );
      
      // Delete user account
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [testUserId]
      );
      
      await connection.commit();
      console.log(`✅ Test data cleaned up successfully`);
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error during cleanup:', error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

/**
 * Main test suite
 */
const runIntegrationTests = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   USERS-SISWA NORMALIZATION INTEGRATION TEST SUITE      ║
║   Testing Full Normalization Implementation             ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  // =============================================
  // TEST 1: Admin Login & Authentication
  // =============================================
  console.log('\n📋 TEST 1: Admin Authentication');
  const loginSuccess = await loginAsAdmin();
  
  if (!loginSuccess) {
    console.error('❌ TEST SUITE ABORTED: Cannot proceed without authentication');
    process.exit(1);
  }
  
  // =============================================
  // TEST 2: Create Student with Auto User Account
  // =============================================
  console.log('\n📋 TEST 2: Create Student with Auto User Account');
  
  const newStudentData = {
    nis: 'TEST2025001',
    nama: 'Integration Test Student',
    kelas_id: 1, // Assuming kelas_id 1 exists
    username: 'test_student_2025',
    password: 'test123',
    email: 'test.student@integration.test',
    jenis_kelamin: 'L',
    alamat: 'Jl. Integration Test No. 1',
    telepon_orangtua: '081234567890',
    telepon_siswa: '089876543210',
    jabatan: 'Ketua Kelas'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/siswa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newStudentData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ POST /api/admin/siswa successful');
      console.log(`   User ID: ${data.data.user_id}`);
      console.log(`   Username: ${data.data.username}`);
      console.log(`   Default Password: ${data.data.default_password}`);
      
      testUserId = data.data.user_id;
      
      // Verify in database
      connection = await db.getConnection();
      
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      
      const [siswaRows] = await connection.execute(
        'SELECT * FROM siswa WHERE user_id = ?',
        [testUserId]
      );
      
      connection.release();
      
      if (userRows.length === 0) {
        console.error('❌ FAILED: User record not found in database');
        process.exit(1);
      }
      
      if (siswaRows.length === 0) {
        console.error('❌ FAILED: Siswa record not found in database');
        process.exit(1);
      }
      
      testSiswaId = siswaRows[0].id_siswa;
      
      // Validate data integrity
      if (userRows[0].role !== 'SISWA') {
        console.error('❌ FAILED: User role is not SISWA');
        process.exit(1);
      }
      
      if (siswaRows[0].user_id !== testUserId) {
        console.error('❌ FAILED: Siswa user_id does not match user ID');
        process.exit(1);
      }
      
      if (userRows[0].username !== newStudentData.username) {
        console.error('❌ FAILED: Username mismatch');
        process.exit(1);
      }
      
      if (siswaRows[0].nis !== newStudentData.nis) {
        console.error('❌ FAILED: NIS mismatch');
        process.exit(1);
      }
      
      console.log('✅ Database verification successful: User and Siswa records are consistent');
      
    } else {
      console.error('❌ FAILED: POST /api/admin/siswa failed');
      console.error(`   Error: ${data.error || response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAILED: Exception during student creation');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // =============================================
  // TEST 3: Student Login with New Account
  // =============================================
  console.log('\n📋 TEST 3: Student Login with New Account');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newStudentData.username,
        password: newStudentData.password
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Student login successful');
      console.log(`   Role: ${data.data.role}`);
      console.log(`   Token received: ${data.data.token ? 'Yes' : 'No'}`);
      
      if (data.data.role !== 'siswa') {
        console.error('❌ FAILED: Login role is not siswa');
        process.exit(1);
      }
      
      if (!data.data.siswa_id) {
        console.error('❌ FAILED: siswa_id not included in login response');
        process.exit(1);
      }
      
    } else {
      console.error('❌ FAILED: Student login failed');
      console.error(`   Error: ${data.error || response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAILED: Exception during student login');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // =============================================
  // TEST 4: Update Student Data
  // =============================================
  console.log('\n📋 TEST 4: Update Student Data');
  
  const updatedStudentData = {
    nis: 'TEST2025001_UPDATED',
    nama: 'Integration Test Student Updated',
    kelas_id: 2, // Assuming kelas_id 2 exists
    username: 'test_student_2025_updated',
    email: 'test.student.updated@integration.test',
    jenis_kelamin: 'P',
    alamat: 'Jl. Integration Test No. 2',
    telepon_orangtua: '081111111111',
    telepon_siswa: '089999999999',
    jabatan: 'Sekretaris Kelas',
    status: 'aktif'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/students/${testUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updatedStudentData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ PUT /api/admin/students/:id successful');
      
      // Verify in database
      connection = await db.getConnection();
      
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      
      const [siswaRows] = await connection.execute(
        'SELECT * FROM siswa WHERE user_id = ?',
        [testUserId]
      );
      
      connection.release();
      
      if (userRows.length === 0 || siswaRows.length === 0) {
        console.error('❌ FAILED: User or Siswa record not found after update');
        process.exit(1);
      }
      
      // Validate updates
      if (userRows[0].username !== updatedStudentData.username) {
        console.error('❌ FAILED: Username not updated');
        process.exit(1);
      }
      
      if (siswaRows[0].nis !== updatedStudentData.nis) {
        console.error('❌ FAILED: NIS not updated');
        process.exit(1);
      }
      
      if (siswaRows[0].nama !== updatedStudentData.nama) {
        console.error('❌ FAILED: Nama not updated');
        process.exit(1);
      }
      
      console.log('✅ Database verification successful: Updates are consistent');
      
    } else {
      console.error('❌ FAILED: PUT /api/admin/students/:id failed');
      console.error(`   Error: ${data.error || response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAILED: Exception during student update');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // =============================================
  // TEST 5: Data Integrity Validation
  // =============================================
  console.log('\n📋 TEST 5: Data Integrity Validation');
  
  try {
    connection = await db.getConnection();
    
    // Check for broken relationships
    const [brokenRels] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM siswa s
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    
    if (brokenRels[0].count > 0) {
      console.error(`❌ FAILED: ${brokenRels[0].count} broken relationships detected`);
      process.exit(1);
    }
    
    console.log('✅ No broken relationships detected');
    
    // Check for invalid roles
    const [invalidRoles] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role <> 'SISWA'
    `);
    
    if (invalidRoles[0].count > 0) {
      console.error(`❌ FAILED: ${invalidRoles[0].count} invalid role assignments detected`);
      process.exit(1);
    }
    
    console.log('✅ No invalid role assignments detected');
    
    // Check for duplicate usernames
    const [dupUsernames] = await connection.execute(`
      SELECT username, COUNT(*) as count
      FROM users
      GROUP BY username
      HAVING count > 1
    `);
    
    if (dupUsernames.length > 0) {
      console.error(`❌ FAILED: ${dupUsernames.length} duplicate usernames detected`);
      process.exit(1);
    }
    
    console.log('✅ No duplicate usernames detected');
    
    // Check for duplicate NIS
    const [dupNIS] = await connection.execute(`
      SELECT nis, COUNT(*) as count
      FROM siswa
      GROUP BY nis
      HAVING count > 1
    `);
    
    if (dupNIS.length > 0) {
      console.error(`❌ FAILED: ${dupNIS.length} duplicate NIS detected`);
      process.exit(1);
    }
    
    console.log('✅ No duplicate NIS detected');
    
    connection.release();
    
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error('❌ FAILED: Exception during data integrity validation');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // =============================================
  // TEST 6: Delete Student Account
  // =============================================
  console.log('\n📋 TEST 6: Delete Student Account');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/students/${testUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ DELETE /api/admin/students/:id successful');
      console.log(`   Action taken: ${data.action}`);
      
      // Verify deletion in database
      connection = await db.getConnection();
      
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      
      const [siswaRows] = await connection.execute(
        'SELECT * FROM siswa WHERE user_id = ?',
        [testUserId]
      );
      
      connection.release();
      
      // Check if records are deleted or deactivated
      if (data.action === 'deleted') {
        if (userRows.length > 0 || siswaRows.length > 0) {
          console.error('❌ FAILED: Records still exist after deletion');
          process.exit(1);
        }
        console.log('✅ Records successfully deleted from database');
      } else if (data.action === 'deactivated') {
        if (userRows.length === 0 || siswaRows.length === 0) {
          console.error('❌ FAILED: Records deleted instead of deactivated');
          process.exit(1);
        }
        
        if (userRows[0].status !== 'tidak_aktif' || siswaRows[0].status !== 'tidak_aktif') {
          console.error('❌ FAILED: Records not properly deactivated');
          process.exit(1);
        }
        console.log('✅ Records successfully deactivated in database');
      }
      
      // Reset test IDs as data is deleted
      testUserId = null;
      testSiswaId = null;
      
    } else {
      console.error('❌ FAILED: DELETE /api/admin/students/:id failed');
      console.error(`   Error: ${data.error || response.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ FAILED: Exception during student deletion');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // =============================================
  // TEST 7: System Statistics
  // =============================================
  console.log('\n📋 TEST 7: System Statistics');
  
  try {
    connection = await db.getConnection();
    
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM siswa) as total_siswa,
        (SELECT COUNT(*) FROM siswa WHERE user_id IS NOT NULL) as siswa_dengan_akun,
        (SELECT COUNT(*) FROM siswa WHERE user_id IS NULL) as siswa_tanpa_akun,
        (SELECT COUNT(*) FROM users WHERE role = 'SISWA') as total_user_siswa
    `);
    
    console.log('📊 System Statistics:');
    console.log(`   Total Siswa: ${stats[0].total_siswa}`);
    console.log(`   Siswa dengan akun: ${stats[0].siswa_dengan_akun}`);
    console.log(`   Siswa tanpa akun: ${stats[0].siswa_tanpa_akun}`);
    console.log(`   Total User SISWA: ${stats[0].total_user_siswa}`);
    
    connection.release();
    
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error('❌ WARNING: Exception during statistics collection');
    console.error(`   Error: ${error.message}`);
  }
  
  // =============================================
  // FINAL SUMMARY
  // =============================================
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              🎉 ALL TESTS PASSED! 🎉                    ║
╠══════════════════════════════════════════════════════════╣
║  Users-Siswa Normalization is working correctly         ║
║  System is ready for production deployment              ║
╚══════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n✅ Test Summary:');
  console.log('   ✅ Admin Authentication');
  console.log('   ✅ Create Student with Auto User Account');
  console.log('   ✅ Student Login');
  console.log('   ✅ Update Student Data');
  console.log('   ✅ Data Integrity Validation');
  console.log('   ✅ Delete Student Account');
  console.log('   ✅ System Statistics');
  
  console.log('\n📈 Success Rate: 100%');
  console.log('⏱️  Total Test Time: ' + ((Date.now() - startTime) / 1000).toFixed(2) + 's');
};

// Track test execution time
const startTime = Date.now();

// Run tests and cleanup
runIntegrationTests()
  .then(() => cleanup())
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed with error:', error);
    cleanup().finally(() => process.exit(1));
  });

