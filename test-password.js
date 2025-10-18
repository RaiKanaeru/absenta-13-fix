import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function testPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Testing password for siswa2...');
    
    // Get user data
    const [users] = await connection.execute(
      "SELECT id, username, password FROM users WHERE username = 'siswa2'"
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User:', user.username);
      console.log('🔐 Password hash:', user.password);
      
      // Test common passwords
      const testPasswords = ['siswa123', 'siswa2', 'password', '123456', 'siswa', 'mira123', 'kurniawan'];
      
      for (const password of testPasswords) {
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`🔑 Testing password '${password}': ${isValid ? '✅' : '❌'}`);
        if (isValid) {
          console.log(`🎉 Found correct password: '${password}'`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testPassword();
