// Test script untuk verifikasi multiple students dengan same user_id
import mysql from 'mysql2/promise';
import fs from 'fs';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  port: process.env.DB_PORT || 3306
};

async function testMultiStudentConstraint() {
  console.log('🧪 TESTING MULTI-STUDENT CONSTRAINT REMOVAL');
  console.log('==========================================');
  
  let connection;
  
  try {
    // 1. Connect to database
    console.log('\n1. Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful');
    
    // 2. Check current constraint status
    console.log('\n2. Checking current constraint status...');
    const [constraints] = await connection.execute(`
      SELECT 
        tc.CONSTRAINT_NAME,
        tc.CONSTRAINT_TYPE,
        kcu.COLUMN_NAME
      FROM information_schema.TABLE_CONSTRAINTS tc
      JOIN information_schema.KEY_COLUMN_USAGE kcu 
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
      WHERE tc.TABLE_SCHEMA = ? 
        AND tc.TABLE_NAME = 'siswa'
        AND tc.CONSTRAINT_NAME = 'idx_siswa_user_id'
        AND tc.CONSTRAINT_TYPE = 'UNIQUE'
    `, [config.database]);
    
    if (constraints.length === 0) {
      console.log('✅ UNIQUE constraint idx_siswa_user_id has been removed');
    } else {
      console.log('❌ UNIQUE constraint idx_siswa_user_id still exists');
      console.log('Constraints found:', constraints);
    }
    
    // 3. Test multiple students with same user_id
    console.log('\n3. Testing multiple students with same user_id...');
    
    // First, check if we have any existing students
    const [existingStudents] = await connection.execute(`
      SELECT id_siswa, nama, user_id FROM siswa LIMIT 5
    `);
    
    if (existingStudents.length === 0) {
      console.log('❌ No students found in database. Cannot test constraint removal.');
      return;
    }
    
    console.log(`Found ${existingStudents.length} existing students`);
    
    // Try to update multiple students to have the same user_id
    const testUserId = 999; // Use a test user_id that's unlikely to exist
    
    // Update first two students to have the same user_id
    const [updateResult] = await connection.execute(`
      UPDATE siswa 
      SET user_id = ? 
      WHERE id_siswa IN (?, ?)
    `, [testUserId, existingStudents[0].id_siswa, existingStudents[1].id_siswa]);
    
    console.log(`✅ Successfully updated ${updateResult.affectedRows} students to have same user_id (${testUserId})`);
    
    // Verify the update worked
    const [verifyResult] = await connection.execute(`
      SELECT id_siswa, nama, user_id 
      FROM siswa 
      WHERE user_id = ?
    `, [testUserId]);
    
    console.log(`✅ Verification: Found ${verifyResult.length} students with user_id ${testUserId}`);
    verifyResult.forEach(student => {
      console.log(`   - Student ${student.id_siswa}: ${student.nama} (user_id: ${student.user_id})`);
    });
    
    // 4. Clean up test data
    console.log('\n4. Cleaning up test data...');
    await connection.execute(`
      UPDATE siswa 
      SET user_id = NULL 
      WHERE user_id = ?
    `, [testUserId]);
    
    console.log('✅ Test data cleaned up');
    
    // 5. Final verification
    console.log('\n5. Final verification...');
    const [finalCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM siswa 
      WHERE user_id = ?
    `, [testUserId]);
    
    if (finalCheck[0].count === 0) {
      console.log('✅ Cleanup successful - no students with test user_id remain');
    } else {
      console.log('❌ Cleanup failed - some test data remains');
    }
    
    console.log('\n🎉 MULTI-STUDENT CONSTRAINT TEST COMPLETED SUCCESSFULLY');
    console.log('The database now supports multiple students sharing the same user_id');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('This indicates the UNIQUE constraint still exists and needs to be removed');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Database or table does not exist. Please check your database configuration.');
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the test
testMultiStudentConstraint();
