import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking all users...');
    
    // Check all users
    const [users] = await connection.execute(
      "SELECT id, username, nama, role FROM users ORDER BY id"
    );
    console.log('👤 All users:', users);
    
    // Check role distribution
    const [roleDist] = await connection.execute(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );
    console.log('📊 Role distribution:', roleDist);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkAllUsers();
