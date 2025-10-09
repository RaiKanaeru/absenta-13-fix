// Script untuk memeriksa tabel pengguna
import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    charset: 'utf8mb4',
    port: 3306
};

async function checkPenggunaTable() {
    let connection;
    
    try {
        console.log('🔍 Checking pengguna table...');
        connection = await mysql.createConnection(dbConfig);
        
        // Check table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pengguna'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.log('📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
        });
        
        // Check if there are any records
        const [records] = await connection.execute('SELECT COUNT(*) as count FROM pengguna');
        console.log(`📊 Total records in pengguna table: ${records[0].count}`);
        
        // Get sample records
        const [sampleRecords] = await connection.execute('SELECT * FROM pengguna LIMIT 3');
        console.log('📊 Sample records:', sampleRecords);
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkPenggunaTable();

