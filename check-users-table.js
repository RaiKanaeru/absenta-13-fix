import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function checkUsersTable() {
    let connection;
    
    try {
        console.log('🔍 Checking users table...');
        connection = await mysql.createConnection(dbConfig);
        
        // Check if users table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
        console.log('📋 Users table exists:', tables.length > 0);
        
        if (tables.length > 0) {
            // Get table structure
            const [columns] = await connection.execute("DESCRIBE users");
            console.log('📊 Users table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
            });
            
            // Get sample data
            const [rows] = await connection.execute("SELECT * FROM users LIMIT 3");
            console.log('📊 Sample data:');
            console.log(JSON.stringify(rows, null, 2));
        } else {
            // Check what tables exist
            const [allTables] = await connection.execute("SHOW TABLES");
            console.log('📋 Available tables:');
            allTables.forEach(table => {
                console.log(`  - ${Object.values(table)[0]}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkUsersTable();
