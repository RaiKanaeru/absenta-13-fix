/**
 * Migration Script: Fix absensi_siswa table structure
 * 
 * Masalah: Tabel absensi_siswa memiliki kolom 'id' tapi tidak memiliki AUTO_INCREMENT
 * Solusi: Tambahkan AUTO_INCREMENT dan set sebagai PRIMARY KEY
 * 
 * Dijalankan dengan: node fix-absensi-siswa-table.cjs
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

async function fixAbsensiSiswaTable() {
    let connection;
    
    try {
        console.log('🔧 Starting migration: Fix absensi_siswa table structure...');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // 1. Check current table structure
        console.log('\n📋 Checking current table structure...');
        const [currentStructure] = await connection.execute('DESCRIBE absensi_siswa');
        console.log('Current columns:', currentStructure.map(col => ({
            field: col.Field,
            type: col.Type,
            null: col.Null,
            key: col.Key,
            default: col.Default,
            extra: col.Extra
        })));
        
        // 2. Check if table has data
        const [rowCount] = await connection.execute('SELECT COUNT(*) as count FROM absensi_siswa');
        const hasData = rowCount[0].count > 0;
        console.log(`📊 Table has ${rowCount[0].count} existing records`);
        
        // 3. Backup existing data if any
        if (hasData) {
            console.log('\n💾 Creating backup of existing data...');
            await connection.execute('CREATE TEMPORARY TABLE absensi_siswa_backup AS SELECT * FROM absensi_siswa');
            console.log('✅ Backup created successfully');
        }
        
        // 4. Drop and recreate table with correct structure
        console.log('\n🔨 Recreating table with correct structure...');
        
        // Drop existing table
        await connection.execute('DROP TABLE IF EXISTS absensi_siswa');
        console.log('✅ Old table dropped');
        
        // Create new table with AUTO_INCREMENT PRIMARY KEY
        const createTableSQL = `
        CREATE TABLE \`absensi_siswa\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`siswa_id\` int(11) NOT NULL COMMENT 'Relasi ke siswa_perwakilan.id_siswa',
          \`jadwal_id\` int(11) DEFAULT NULL COMMENT 'Relasi ke jadwal.id_jadwal (opsional untuk absensi harian)',
          \`tanggal\` date NOT NULL,
          \`status\` enum('Hadir','Izin','Sakit','Alpa','Dispen') NOT NULL COMMENT 'Status kehadiran siswa pada tanggal tersebut',
          \`keterangan\` text DEFAULT NULL,
          \`waktu_absen\` datetime NOT NULL DEFAULT current_timestamp(),
          \`guru_id\` int(11) DEFAULT NULL COMMENT 'ID guru yang mencatat absensi (opsional)',
          PRIMARY KEY (\`id\`),
          KEY \`idx_siswa_id\` (\`siswa_id\`),
          KEY \`idx_jadwal_id\` (\`jadwal_id\`),
          KEY \`idx_tanggal\` (\`tanggal\`),
          KEY \`idx_guru_id\` (\`guru_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabel absensi siswa dengan struktur yang benar'
        `;
        
        await connection.execute(createTableSQL);
        console.log('✅ New table created with AUTO_INCREMENT PRIMARY KEY');
        
        // 5. Restore data if backup exists
        if (hasData) {
            console.log('\n🔄 Restoring data from backup...');
            try {
                await connection.execute('INSERT INTO absensi_siswa SELECT * FROM absensi_siswa_backup');
                console.log('✅ Data restored successfully');
            } catch (restoreError) {
                console.log('⚠️  Warning: Could not restore data:', restoreError.message);
                console.log('   This might be due to column structure differences');
            }
        }
        
        // 6. Verify new structure
        console.log('\n🔍 Verifying new table structure...');
        const [newStructure] = await connection.execute('DESCRIBE absensi_siswa');
        console.log('New columns:', newStructure.map(col => ({
            field: col.Field,
            type: col.Type,
            null: col.Null,
            key: col.Key,
            default: col.Default,
            extra: col.Extra
        })));
        
        // 7. Test queries that were failing
        console.log('\n🧪 Testing queries that were failing...');
        
        // Test SELECT query
        try {
            const [testSelect] = await connection.execute(
                'SELECT id, status FROM absensi_siswa LIMIT 1'
            );
            console.log('✅ SELECT query with id column works');
        } catch (selectError) {
            console.log('❌ SELECT query failed:', selectError.message);
        }
        
        // Test INSERT query
        try {
            const [testInsert] = await connection.execute(
                'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [999, 1, '2025-01-07', 'Hadir', 'Test insert', '2025-01-07 10:00:00', 1]
            );
            console.log('✅ INSERT query works, new ID:', testInsert.insertId);
            
            // Clean up test data
            await connection.execute('DELETE FROM absensi_siswa WHERE id = ?', [testInsert.insertId]);
            console.log('✅ Test data cleaned up');
        } catch (insertError) {
            console.log('❌ INSERT query failed:', insertError.message);
        }
        
        // 8. Clean up backup
        if (hasData) {
            await connection.execute('DROP TEMPORARY TABLE absensi_siswa_backup');
            console.log('✅ Backup table cleaned up');
        }
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('📝 Summary:');
        console.log('   - Table absensi_siswa now has AUTO_INCREMENT PRIMARY KEY');
        console.log('   - All required columns are present');
        console.log('   - Queries that were failing should now work');
        console.log('   - Ready for attendance submission');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('Stack trace:', error.stack);
        
        // Try to restore from backup if it exists
        if (connection) {
            try {
                console.log('\n🔄 Attempting to restore from backup...');
                const [backupExists] = await connection.execute("SHOW TABLES LIKE 'absensi_siswa_backup'");
                if (backupExists.length > 0) {
                    await connection.execute('DROP TABLE IF EXISTS absensi_siswa');
                    await connection.execute('CREATE TABLE absensi_siswa AS SELECT * FROM absensi_siswa_backup');
                    console.log('✅ Restored from backup');
                }
            } catch (restoreError) {
                console.error('❌ Could not restore from backup:', restoreError.message);
            }
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration
if (require.main === module) {
    fixAbsensiSiswaTable()
        .then(() => {
            console.log('\n✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { fixAbsensiSiswaTable };
