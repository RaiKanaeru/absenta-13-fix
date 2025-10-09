import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function checkStudentPasswords() {
  try {
    console.log('🔍 Checking student passwords...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Check users table for students with their passwords
    const [users] = await connection.execute(
      'SELECT id, username, nama, role, password FROM users WHERE role = "siswa" ORDER BY id LIMIT 5'
    );
    
    console.log('📋 Users with role siswa (first 5):');
    for (const user of users) {
      console.log(`Username: ${user.username}, Nama: ${user.nama}`);
      console.log(`Password hash: ${user.password}`);
      
      // Test common passwords
      const commonPasswords = ['admin123', 'password', '123456', 'perwakilan2003', 'siswa123'];
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`✅ Password found: ${testPassword}`);
          break;
        }
      }
      console.log('---');
    }

    await connection.end();
    console.log('\n✅ Password check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStudentPasswords();

