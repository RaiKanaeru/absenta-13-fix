const mysql = require('mysql2/promise');

async function finalCleanup() {
    console.log('🧹 Final cleanup of remaining unused tables...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // Check remaining tables that might be unused
        const potentiallyUnusedTables = [
            'banding_absen_detail',
            'jenis_waktu_khusus', 
            'login_attempt_stats',
            'pengajuan_banding_absen',
            'ruang_kelas',
            'system_config'
        ];

        for (const tableName of potentiallyUnusedTables) {
            try {
                // Check if table has data
                const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                const count = countResult[0].count;
                
                console.log(`📊 Table ${tableName}: ${count} records`);
                
                if (count === 0) {
                    console.log(`🗑️ Dropping empty table: ${tableName}`);
                    await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                    console.log(`✅ Table ${tableName} removed successfully`);
                } else {
                    console.log(`ℹ️ Keeping table ${tableName} (has data)`);
                }
            } catch (error) {
                console.log(`❌ Error checking table ${tableName}:`, error.message);
            }
        }

        // Final verification
        console.log('\n📋 Final table list:');
        const [finalTables] = await connection.execute('SHOW TABLES');
        console.log(`✅ Total tables: ${finalTables.length}`);
        finalTables.forEach(row => console.log(`  - ${Object.values(row)[0]}`));

        console.log('\n🎉 Final cleanup completed!');

    } catch (error) {
        console.error('❌ Error during final cleanup:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

finalCleanup();
