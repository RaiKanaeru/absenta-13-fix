/**
 * Check Database Tables
 * 
 * Cek tabel apa saja yang ada di database dan struktur yang benar
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function checkDatabaseTables() {
    let connection;
    
    try {
        console.log('🔍 Checking database tables...');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // Get all tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 Available tables:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });
        
        // Check specific tables that might be used for attendance
        const relevantTables = ['pengguna', 'guru', 'siswa', 'siswa_perwakilan', 'jadwal', 'absensi_siswa'];
        
        console.log('\n🔍 Checking relevant tables for attendance system:');
        for (const tableName of relevantTables) {
            try {
                const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
                console.log(`\n✅ Table '${tableName}' exists:`);
                structure.forEach(col => {
                    console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Extra || ''}`);
                });
            } catch (error) {
                console.log(`❌ Table '${tableName}' does not exist or error: ${error.message}`);
            }
        }
        
        // Check if there are any user-related tables
        console.log('\n🔍 Looking for user-related tables:');
        const [userTables] = await connection.execute("SHOW TABLES LIKE '%user%'");
        const [penggunaTables] = await connection.execute("SHOW TABLES LIKE '%pengguna%'");
        const [guruTables] = await connection.execute("SHOW TABLES LIKE '%guru%'");
        const [siswaTables] = await connection.execute("SHOW TABLES LIKE '%siswa%'");
        
        console.log('User tables:', userTables.map(t => Object.values(t)[0]));
        console.log('Pengguna tables:', penggunaTables.map(t => Object.values(t)[0]));
        console.log('Guru tables:', guruTables.map(t => Object.values(t)[0]));
        console.log('Siswa tables:', siswaTables.map(t => Object.values(t)[0]));
        
    } catch (error) {
        console.error('❌ Database check failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run check
if (require.main === module) {
    checkDatabaseTables()
        .then(() => {
            console.log('\n✅ Database check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Database check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkDatabaseTables };










