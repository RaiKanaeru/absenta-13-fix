import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function createStudentPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔧 Creating password for siswa2...');
    
    // Create new password hash
    const newPassword = 'siswa123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔐 New password hash:', hashedPassword);
    
    // Update password in database
    const [result] = await connection.execute(
      "UPDATE users SET password = ? WHERE username = 'siswa2'",
      [hashedPassword]
    );
    
    console.log(`✅ Updated password for siswa2: ${result.affectedRows} rows affected`);
    
    // Verify the password works
    const [users] = await connection.execute(
      "SELECT id, username, password FROM users WHERE username = 'siswa2'"
    );
    
    if (users.length > 0) {
      const isValid = await bcrypt.compare(newPassword, users[0].password);
      console.log(`🔑 Password verification: ${isValid ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

createStudentPassword();
