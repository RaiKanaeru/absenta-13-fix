import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkStudentData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking student data...');
    
    // Check users table
    const [users] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE username = 'siswa1'"
    );
    console.log('👤 Users table:', users);
    
    // Check siswa table
    const [siswa] = await connection.execute(
      "SELECT id_siswa, nis, nama, user_id FROM siswa WHERE nis = '2024011347'"
    );
    console.log('🎓 Siswa table:', siswa);
    
    // Check if user_id matches
    if (users.length > 0 && siswa.length > 0) {
      console.log('🔗 User-Siswa link check:');
      console.log(`   User ID: ${users[0].id}`);
      console.log(`   Siswa user_id: ${siswa[0].user_id}`);
      console.log(`   Match: ${users[0].id === siswa[0].user_id ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkStudentData();
