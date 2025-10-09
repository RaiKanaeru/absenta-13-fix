const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absenta13',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkSiswaTable() {
  try {
    console.log('🔍 Checking siswa table structure...');
    
    const [rows] = await db.execute('DESCRIBE siswa');
    console.log('📋 Struktur tabel siswa:');
    console.table(rows);
    
    // Check if id_pengguna exists
    const hasIdPengguna = rows.some(row => row.Field === 'id_pengguna');
    console.log(`\n🔍 Field 'id_pengguna' exists: ${hasIdPengguna}`);
    
    // Check if user_id exists
    const hasUserId = rows.some(row => row.Field === 'user_id');
    console.log(`🔍 Field 'user_id' exists: ${hasUserId}`);
    
    // Show sample data
    const [sampleData] = await db.execute('SELECT * FROM siswa LIMIT 3');
    console.log('\n📊 Sample data from siswa table:');
    console.table(sampleData);
    
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSiswaTable();




