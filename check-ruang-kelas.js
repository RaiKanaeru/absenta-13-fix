import mysql from 'mysql2/promise';

async function checkRuangKelas() {
  try {
    console.log('🔍 Checking ruang_kelas table...\n');

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Check ruang_kelas table
    const [ruangRows] = await connection.execute('SELECT * FROM ruang_kelas ORDER BY id');
    console.log('📋 Ruang Kelas data:');
    console.log(JSON.stringify(ruangRows, null, 2));

    // Check kelas table
    const [kelasRows] = await connection.execute('SELECT * FROM kelas ORDER BY id_kelas LIMIT 5');
    console.log('\n📋 Kelas data (first 5):');
    console.log(JSON.stringify(kelasRows, null, 2));

    // Check mapel table
    const [mapelRows] = await connection.execute('SELECT * FROM mapel ORDER BY id_mapel LIMIT 5');
    console.log('\n📋 Mapel data (first 5):');
    console.log(JSON.stringify(mapelRows, null, 2));

    // Check guru table
    const [guruRows] = await connection.execute('SELECT * FROM guru ORDER BY id_guru LIMIT 5');
    console.log('\n📋 Guru data (first 5):');
    console.log(JSON.stringify(guruRows, null, 2));

    await connection.end();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRuangKelas();

