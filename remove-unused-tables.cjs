const mysql = require('mysql2/promise');

async function removeUnusedTables() {
    console.log('🗑️ Removing unused tables from database...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // List of unused tables to remove
        const unusedTables = [
            'absensi_guru_archive',
            'absensi_siswa_archive', 
            'jenis_waktu_khusus',
            'kop_laporan',
            'login_attempt_stats',
            'rekap_kehadiran_harian',
            'users_backup_ketos_migration',
            'users_siswa',
            'warna_mapel'
        ];

        // Check if tables exist and remove them
        for (const tableName of unusedTables) {
            try {
                // Check if table exists
                const [tables] = await connection.execute(
                    `SELECT COUNT(*) as count FROM information_schema.tables 
                     WHERE table_schema = 'absenta13' AND table_name = ?`,
                    [tableName]
                );
                
                if (tables[0].count > 0) {
                    console.log(`🗑️ Dropping table: ${tableName}`);
                    await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                    console.log(`✅ Table ${tableName} removed successfully`);
                } else {
                    console.log(`ℹ️ Table ${tableName} does not exist`);
                }
            } catch (error) {
                console.log(`❌ Error removing table ${tableName}:`, error.message);
            }
        }

        // Handle active_lockouts view separately
        try {
            console.log('🗑️ Dropping view: active_lockouts');
            await connection.execute('DROP VIEW IF EXISTS active_lockouts');
            console.log('✅ View active_lockouts removed successfully');
        } catch (error) {
            console.log('❌ Error removing view active_lockouts:', error.message);
        }

        // Verify remaining tables
        console.log('\n📋 Verifying remaining tables...');
        const [remainingTables] = await connection.execute('SHOW TABLES');
        console.log(`✅ Remaining tables: ${remainingTables.length}`);
        remainingTables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));

        console.log('\n🎉 Database cleanup completed!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

removeUnusedTables();
