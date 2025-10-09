import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function createTestStudent() {
  try {
    console.log('🔧 Creating test student...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed');

    // Create user
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
      ['testperwakilan', hashedPassword, 'Test Perwakilan', 'siswa']
    );

    const userId = userResult.insertId;
    console.log('✅ User created with ID:', userId);

    // Create siswa record
    const [siswaResult] = await connection.execute(
      'INSERT INTO siswa (id_siswa, user_id, nama, kelas_id) VALUES (?, ?, ?, ?)',
      [userId, userId, 'Test Perwakilan', 349] // Using existing kelas_id
    );

    console.log('✅ Siswa record created');

    await connection.end();
    console.log('\n🎉 Test student created successfully!');
    console.log('Username: testperwakilan');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestStudent();