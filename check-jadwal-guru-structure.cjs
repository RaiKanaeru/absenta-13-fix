const mysql = require('mysql2/promise');

async function checkJadwalGuruStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    console.log('🔍 Checking jadwal_guru table structure...\n');

    // Show table structure
    const [columns] = await connection.execute('DESCRIBE jadwal_guru');

    console.log('📊 Table Structure: jadwal_guru');
    console.log('═'.repeat(80));
    console.log('Field'.padEnd(20) + 'Type'.padEnd(20) + 'Null'.padEnd(10) + 'Key'.padEnd(10) + 'Default');
    console.log('─'.repeat(80));
    
    columns.forEach(col => {
      console.log(
        col.Field.padEnd(20) +
        col.Type.padEnd(20) +
        col.Null.padEnd(10) +
        (col.Key || '').padEnd(10) +
        (col.Default || 'NULL')
      );
    });

    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkJadwalGuruStructure();


