import mysql from 'mysql2/promise';

async function checkStudentData() {
  try {
    console.log('🔍 Checking student data...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Check users table for students
    const [users] = await connection.execute(
      'SELECT id, username, nama, role FROM users WHERE role = "siswa" ORDER BY id LIMIT 10'
    );
    console.log('📋 Users with role siswa:');
    console.log(JSON.stringify(users, null, 2));

    // Check siswa table
    const [siswa] = await connection.execute(
      'SELECT id_siswa, nama, kelas_id FROM siswa ORDER BY id_siswa LIMIT 10'
    );
    console.log('\n📋 Siswa table:');
    console.log(JSON.stringify(siswa, null, 2));

    // Check if there are any students with username perwakilan2000
    const [perwakilan] = await connection.execute(
      'SELECT * FROM users WHERE username = "perwakilan2000"'
    );
    console.log('\n📋 User perwakilan2000:');
    console.log(JSON.stringify(perwakilan, null, 2));

    await connection.end();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStudentData();

