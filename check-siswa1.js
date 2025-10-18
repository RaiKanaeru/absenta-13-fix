import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSiswa1() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking siswa1...');
    
    // Check users table for siswa1
    const [users] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE username = 'siswa1'"
    );
    console.log('👤 User siswa1:', users);
    
    // Check if there's a user with ID 347
    const [user347] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE id = 347"
    );
    console.log('👤 User ID 347:', user347);
    
    // Check all users with username starting with 'siswa'
    const [allSiswa] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE username LIKE 'siswa%' ORDER BY id LIMIT 10"
    );
    console.log('🎓 First 10 siswa users:', allSiswa);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkSiswa1();
