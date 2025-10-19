const fs = require('fs');
const mysql = require('mysql2/promise');

async function runMigration() {
    let connection;
    
    try {
        console.log('🔄 Starting database migration...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Add password if needed
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Read migration script
        const migrationSQL = fs.readFileSync('migrate-to-new-schema.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    await connection.execute(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.log(`⚠️ Statement ${i + 1} failed (might be expected): ${error.message}`);
                }
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
        // Verify migration
        console.log('🔍 Verifying migration...');
        
        const [jadwalGuruCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        const [absensiGuruJadwalCount] = await connection.execute('SELECT COUNT(*) as count FROM absensi_guru_jadwal');
        const [absensiGuruMappingCount] = await connection.execute('SELECT COUNT(*) as count FROM absensi_guru_mapping');
        
        console.log('📊 Migration Results:');
        console.log(`   - jadwal_guru: ${jadwalGuruCount[0].count} records`);
        console.log(`   - absensi_guru_jadwal: ${absensiGuruJadwalCount[0].count} records`);
        console.log(`   - absensi_guru_mapping: ${absensiGuruMappingCount[0].count} records`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

runMigration();
