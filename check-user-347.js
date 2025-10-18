import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUser347() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking user ID 347...');
    
    // Check users table for ID 347
    const [users] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE id = 347"
    );
    console.log('👤 User ID 347:', users);
    
    // Check all users with role ketos
    const [ketosUsers] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE role = 'ketos'"
    );
    console.log('🎓 All ketos users:', ketosUsers);
    
    // Check all users with role siswa
    const [siswaUsers] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE role = 'siswa'"
    );
    console.log('🎓 All siswa users:', siswaUsers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkUser347();
