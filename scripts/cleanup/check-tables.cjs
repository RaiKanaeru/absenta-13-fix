const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
  });
  
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('📋 Tables yang ada di database:');
  tables.forEach((row, index) => {
    const tableName = Object.values(row)[0];
    console.log(`   ${index + 1}. ${tableName}`);
  });
  
  await connection.end();
}

checkTables().catch(console.error);




