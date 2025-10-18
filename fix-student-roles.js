import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixStudentRoles() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13'
  });

  try {
    console.log('🔧 Fixing student roles...');
    
    // Update all users with empty role and username starting with 'siswa' to 'ketos'
    const [result] = await connection.execute(
      "UPDATE users SET role = 'ketos' WHERE role = '' AND username LIKE 'siswa%'"
    );
    console.log(`✅ Updated ${result.affectedRows} student roles to 'ketos'`);
    
    // Verify the changes
    const [ketosUsers] = await connection.execute(
      "SELECT id, username, nama, role FROM users WHERE role = 'ketos' LIMIT 5"
    );
    console.log('🎓 Sample ketos users:', ketosUsers);
    
    // Check total count
    const [count] = await connection.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'ketos'"
    );
    console.log(`📊 Total ketos users: ${count[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixStudentRoles();