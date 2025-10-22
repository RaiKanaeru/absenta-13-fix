const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAbsensiGuruStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
  });
  
  console.log('📋 Struktur table absensi_guru:');
  const [columns] = await connection.execute('DESCRIBE absensi_guru');
  columns.forEach((col) => {
    console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
  });
  
  await connection.end();
}

checkAbsensiGuruStructure().catch(console.error);




