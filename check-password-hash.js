import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function checkPasswordHash() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking password hash for siswa2...');
    
    // Check users table for siswa2
    const [users] = await connection.execute(
      "SELECT id, username, nama, role, password_hash FROM users WHERE username = 'siswa2'"
    );
    console.log('👤 User siswa2:', users[0]);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('🔐 Password hash:', user.password_hash);
      
      // Test common passwords
      const testPasswords = ['siswa123', 'siswa2', 'password', '123456', 'siswa'];
      
      for (const password of testPasswords) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log(`🔑 Testing password '${password}': ${isValid ? '✅' : '❌'}`);
        if (isValid) break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkPasswordHash();
