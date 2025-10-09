import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function checkPenggunaTable() {
    let connection;
    
    try {
        console.log('🔍 Checking pengguna table...');
        connection = await mysql.createConnection(dbConfig);
        
        // Get table structure
        const [columns] = await connection.execute("DESCRIBE pengguna");
        console.log('📊 Pengguna table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
        });
        
        // Get sample data
        const [rows] = await connection.execute("SELECT * FROM pengguna LIMIT 3");
        console.log('📊 Sample data:');
        console.log(JSON.stringify(rows, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkPenggunaTable();
