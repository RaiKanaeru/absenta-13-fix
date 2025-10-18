import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsersStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔍 Checking users table structure...');
    
    // Check table structure
    const [structure] = await connection.execute(
      "DESCRIBE users"
    );
    console.log('📋 Users table structure:', structure);
    
    // Check sample user data
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE username = 'siswa2' LIMIT 1"
    );
    console.log('👤 Sample user data:', users[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

checkUsersStructure();
