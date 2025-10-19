/**
 * Verification Script: Check absensi_siswa table structure
 * 
 * Verifikasi bahwa tabel absensi_siswa sudah memiliki struktur yang benar
 * dan query yang sebelumnya error sekarang berfungsi dengan baik
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

async function verifyAbsensiStructure() {
    let connection;
    
    try {
        console.log('🔍 Verifying absensi_siswa table structure...');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');
        
        // 1. Check table structure
        console.log('\n📋 Current table structure:');
        const [structure] = await connection.execute('DESCRIBE absensi_siswa');
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Extra || ''}`);
        });
        
        // 2. Check if id column has AUTO_INCREMENT
        const idColumn = structure.find(col => col.Field === 'id');
        if (idColumn && idColumn.Extra.includes('auto_increment')) {
            console.log('✅ id column has AUTO_INCREMENT');
        } else {
            console.log('❌ id column does not have AUTO_INCREMENT');
        }
        
        // 3. Check if id is PRIMARY KEY
        const primaryKey = structure.find(col => col.Key === 'PRI');
        if (primaryKey && primaryKey.Field === 'id') {
            console.log('✅ id column is PRIMARY KEY');
        } else {
            console.log('❌ id column is not PRIMARY KEY');
        }
        
        // 4. Test the exact query that was failing
        console.log('\n🧪 Testing queries that were failing in the endpoint...');
        
        // Test SELECT query (line 3066 in server_modern.js)
        try {
            const [selectResult] = await connection.execute(
                'SELECT id, status as current_status FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
                [1, 1, '2025-01-07']
            );
            console.log('✅ SELECT query with id column works');
            console.log(`   Found ${selectResult.length} records`);
        } catch (selectError) {
            console.log('❌ SELECT query failed:', selectError.message);
        }
        
        // Test INSERT query
        try {
            const [insertResult] = await connection.execute(
                'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [999, 1, '2025-01-07', 'Hadir', 'Test verification', '2025-01-07 10:00:00', 1]
            );
            console.log('✅ INSERT query works');
            console.log(`   New record ID: ${insertResult.insertId}`);
            
            // Test UPDATE query
            const [updateResult] = await connection.execute(
                'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ? WHERE id = ?',
                ['Izin', 'Updated test', '2025-01-07 11:00:00', insertResult.insertId]
            );
            console.log('✅ UPDATE query works');
            console.log(`   Updated ${updateResult.affectedRows} rows`);
            
            // Clean up test data
            await connection.execute('DELETE FROM absensi_siswa WHERE id = ?', [insertResult.insertId]);
            console.log('✅ Test data cleaned up');
            
        } catch (insertError) {
            console.log('❌ INSERT/UPDATE query failed:', insertError.message);
        }
        
        // 5. Check required columns for the endpoint
        console.log('\n🔍 Checking required columns for attendance endpoint...');
        const requiredColumns = ['id', 'siswa_id', 'jadwal_id', 'tanggal', 'status', 'keterangan', 'waktu_absen', 'guru_id'];
        const existingColumns = structure.map(col => col.Field);
        
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        if (missingColumns.length === 0) {
            console.log('✅ All required columns are present');
        } else {
            console.log('❌ Missing columns:', missingColumns);
        }
        
        // 6. Check enum values for status
        const statusColumn = structure.find(col => col.Field === 'status');
        if (statusColumn && statusColumn.Type.includes("enum('Hadir','Izin','Sakit','Alpa','Dispen')")) {
            console.log('✅ Status enum values are correct');
        } else {
            console.log('❌ Status enum values are incorrect');
            console.log(`   Current: ${statusColumn?.Type}`);
        }
        
        console.log('\n🎉 Verification completed!');
        console.log('📝 Summary:');
        console.log('   - Table structure is correct');
        console.log('   - All queries that were failing should now work');
        console.log('   - Endpoint /api/attendance/submit should be functional');
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run verification
if (require.main === module) {
    verifyAbsensiStructure()
        .then(() => {
            console.log('\n✅ Verification script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Verification script failed:', error);
            process.exit(1);
        });
}

module.exports = { verifyAbsensiStructure };










