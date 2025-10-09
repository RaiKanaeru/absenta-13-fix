// Script untuk memeriksa database dan tabel
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

async function checkDatabase() {
    let connection;
    
    try {
        console.log('🔍 Checking database connection...');
        console.log('Database config:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port
        });
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful');
        
        // Check if database exists
        const [databases] = await connection.execute('SHOW DATABASES');
        const dbExists = databases.some(db => db.Database === dbConfig.database);
        console.log(`📊 Database '${dbConfig.database}' exists:`, dbExists);
        
        if (!dbExists) {
            console.log('❌ Database does not exist. Creating...');
            await connection.execute(`CREATE DATABASE ${dbConfig.database}`);
            console.log('✅ Database created successfully');
        }
        
        // Check tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Total tables: ${tables.length}`);
        console.log('📋 Tables:', tables.map(t => Object.values(t)[0]));
        
        // Check specific tables
        const importantTables = ['users', 'siswa_perwakilan', 'mapel', 'kelas'];
        for (const table of importantTables) {
            const [tableExists] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            `, [dbConfig.database, table]);
            
            console.log(`📊 Table '${table}' exists:`, tableExists[0].count > 0);
        }
        
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

checkDatabase();

