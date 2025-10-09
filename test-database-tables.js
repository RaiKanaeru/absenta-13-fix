const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔍 Testing database tables...');
    
    // Test mata_pelajaran table
    const [subjects] = await connection.execute('SELECT COUNT(*) as count FROM mata_pelajaran');
    console.log('📚 Mata Pelajaran count:', subjects[0].count);
    
    // Test guru table
    const [teachers] = await connection.execute('SELECT COUNT(*) as count FROM guru');
    console.log('👨‍🏫 Guru count:', teachers[0].count);
    
    // Test kelas table
    const [classes] = await connection.execute('SELECT COUNT(*) as count FROM kelas');
    console.log('🏫 Kelas count:', classes[0].count);
    
    // Test ruang_kelas table
    const [rooms] = await connection.execute('SELECT COUNT(*) as count FROM ruang_kelas');
    console.log('🏠 Ruang Kelas count:', rooms[0].count);
    
    // Test if tables exist
    const [tables] = await connection.execute("SHOW TABLES LIKE 'mata_pelajaran'");
    console.log('📚 Mata Pelajaran table exists:', tables.length > 0);
    
    const [guruTable] = await connection.execute("SHOW TABLES LIKE 'guru'");
    console.log('👨‍🏫 Guru table exists:', guruTable.length > 0);
    
    const [kelasTable] = await connection.execute("SHOW TABLES LIKE 'kelas'");
    console.log('🏫 Kelas table exists:', kelasTable.length > 0);
    
    const [ruangTable] = await connection.execute("SHOW TABLES LIKE 'ruang_kelas'");
    console.log('🏠 Ruang Kelas table exists:', ruangTable.length > 0);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabase();


