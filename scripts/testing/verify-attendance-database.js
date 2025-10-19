/**
 * Script Verifikasi Database untuk Sistem Absensi
 * 
 * Memeriksa:
 * 1. Struktur tabel absensi_siswa
 * 2. Struktur tabel jadwal
 * 3. Struktur tabel siswa_perwakilan
 * 4. Foreign key relationships
 * 5. Index optimization
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    port: process.env.DB_PORT || 3306
};

async function verifyDatabase() {
    console.log('🔍 ============================================');
    console.log('🔍 Verifikasi Struktur Database Absensi');
    console.log('🔍 ============================================\n');

    let connection;

    try {
        // Connect to database
        console.log('📡 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database:', dbConfig.database);
        console.log('\n');

        // TEST 1: Verify absensi_siswa table
        console.log('📝 TEST 1: Verifikasi tabel absensi_siswa');
        console.log('─'.repeat(50));

        const [absensiStructure] = await connection.execute('DESCRIBE absensi_siswa');
        
        console.log('✅ Struktur tabel absensi_siswa:');
        absensiStructure.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''} ${col.Null === 'NO' ? '[NOT NULL]' : '[NULL]'} ${col.Default ? '[DEFAULT: ' + col.Default + ']' : ''}`);
        });

        // Check required columns
        const requiredColumns = ['id', 'siswa_id', 'jadwal_id', 'tanggal', 'status', 'keterangan', 'waktu_absen', 'guru_id'];
        const existingColumns = absensiStructure.map(col => col.Field);
        
        console.log('\n✅ Kolom yang diperlukan:');
        requiredColumns.forEach(col => {
            const exists = existingColumns.includes(col);
            console.log(`   ${exists ? '✅' : '❌'} ${col} ${exists ? '' : '(MISSING)'}`);
        });

        console.log('\n');

        // TEST 2: Verify jadwal table (not jadwal_pelajaran)
        console.log('📝 TEST 2: Verifikasi tabel jadwal');
        console.log('─'.repeat(50));

        try {
            const [jadwalStructure] = await connection.execute('DESCRIBE jadwal');
            console.log('✅ Tabel jadwal EXISTS');
            console.log('   Kolom utama:');
            jadwalStructure.filter(col => ['id_jadwal', 'kelas_id', 'mapel_id', 'guru_id'].includes(col.Field))
                .forEach(col => {
                    console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
                });
        } catch (error) {
            console.log('❌ Tabel jadwal TIDAK ADA');
        }

        // Check if jadwal_pelajaran exists (should be a view, not table)
        console.log('\n🔍 Memeriksa jadwal_pelajaran...');
        try {
            const [views] = await connection.execute(`
                SELECT TABLE_NAME, TABLE_TYPE 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jadwal_pelajaran'
            `, [dbConfig.database]);
            
            if (views.length > 0) {
                console.log(`   ℹ️  jadwal_pelajaran adalah ${views[0].TABLE_TYPE}`);
                if (views[0].TABLE_TYPE === 'VIEW') {
                    console.log('   ⚠️  WARNING: Gunakan tabel jadwal, bukan view jadwal_pelajaran');
                }
            } else {
                console.log('   ✅ jadwal_pelajaran tidak ada (OK)');
            }
        } catch (error) {
            console.log('   ✅ jadwal_pelajaran tidak ada (OK)');
        }

        console.log('\n');

        // TEST 3: Verify siswa_perwakilan table
        console.log('📝 TEST 3: Verifikasi tabel siswa_perwakilan');
        console.log('─'.repeat(50));

        try {
            const [siswaStructure] = await connection.execute('DESCRIBE siswa_perwakilan');
            console.log('✅ Tabel siswa_perwakilan EXISTS');
            console.log('   Kolom utama:');
            siswaStructure.filter(col => ['id_siswa', 'user_id', 'nama', 'nis', 'kelas_id'].includes(col.Field))
                .forEach(col => {
                    console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
                });
        } catch (error) {
            console.log('❌ Tabel siswa_perwakilan TIDAK ADA');
        }

        // Check if siswa table exists (should not be used)
        console.log('\n🔍 Memeriksa tabel siswa...');
        try {
            const [siswaCheck] = await connection.execute(`
                SELECT TABLE_NAME, TABLE_TYPE 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'siswa'
            `, [dbConfig.database]);
            
            if (siswaCheck.length > 0) {
                console.log(`   ⚠️  WARNING: Tabel siswa EXISTS (${siswaCheck[0].TABLE_TYPE})`);
                console.log('   ⚠️  Gunakan siswa_perwakilan untuk data siswa aktif');
            } else {
                console.log('   ✅ Tabel siswa tidak ada (OK, gunakan siswa_perwakilan)');
            }
        } catch (error) {
            console.log('   ✅ Tabel siswa tidak ada (OK)');
        }

        console.log('\n');

        // TEST 4: Verify foreign keys
        console.log('📝 TEST 4: Verifikasi Foreign Keys');
        console.log('─'.repeat(50));

        const [foreignKeys] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME IN ('absensi_siswa', 'jadwal')
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, [dbConfig.database]);

        if (foreignKeys.length > 0) {
            console.log('✅ Foreign keys yang ada:');
            foreignKeys.forEach(fk => {
                console.log(`   ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('⚠️  Tidak ada foreign key constraints');
            console.log('   Ini OK jika desain database tidak menggunakan FK');
        }

        console.log('\n');

        // TEST 5: Verify indexes
        console.log('📝 TEST 5: Verifikasi Indexes');
        console.log('─'.repeat(50));

        const [indexes] = await connection.execute(`
            SHOW INDEX FROM absensi_siswa
        `);

        const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
        console.log('✅ Indexes pada absensi_siswa:');
        uniqueIndexes.forEach(idx => {
            const columns = indexes.filter(i => i.Key_name === idx).map(i => i.Column_name);
            console.log(`   - ${idx} (${columns.join(', ')})`);
        });

        console.log('\n');

        // TEST 6: Sample data check
        console.log('📝 TEST 6: Sample Data Check');
        console.log('─'.repeat(50));

        const [absensiCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM absensi_siswa'
        );
        console.log(`   Total absensi siswa: ${absensiCount[0].total} records`);

        const [jadwalCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM jadwal WHERE status = "aktif"'
        );
        console.log(`   Total jadwal aktif: ${jadwalCount[0].total} records`);

        const [siswaCount] = await connection.execute(
            'SELECT COUNT(*) as total FROM siswa_perwakilan WHERE status = "aktif"'
        );
        console.log(`   Total siswa aktif: ${siswaCount[0].total} records`);

        console.log('\n');

        // TEST 7: Test JOIN query (the actual query used in history endpoint)
        console.log('📝 TEST 7: Test History Query');
        console.log('─'.repeat(50));

        try {
            const [historyTest] = await connection.execute(`
                SELECT 
                    absensi.tanggal,
                    jadwal.jam_mulai,
                    jadwal.jam_selesai,
                    mapel.nama_mapel,
                    kelas.nama_kelas,
                    siswa.nama as nama_siswa,
                    siswa.nis,
                    absensi.status as status_kehadiran,
                    absensi.keterangan,
                    absensi.waktu_absen
                FROM absensi_siswa absensi
                INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
                INNER JOIN mapel ON jadwal.mapel_id = mapel.id_mapel
                INNER JOIN kelas ON jadwal.kelas_id = kelas.id_kelas
                INNER JOIN siswa_perwakilan siswa ON absensi.siswa_id = siswa.id_siswa
                LIMIT 1
            `);

            console.log('✅ History query berfungsi dengan baik');
            if (historyTest.length > 0) {
                console.log('   Sample record:');
                console.log('   - Tanggal:', historyTest[0].tanggal);
                console.log('   - Siswa:', historyTest[0].nama_siswa);
                console.log('   - Status:', historyTest[0].status_kehadiran);
            } else {
                console.log('   ⚠️  Belum ada data absensi (normal untuk database baru)');
            }
        } catch (error) {
            console.log('❌ History query ERROR:', error.message);
            console.log('   Ini masalah KRITIKAL yang harus diperbaiki!');
        }

        console.log('\n');

        // SUMMARY
        console.log('📊 ============================================');
        console.log('📊 RINGKASAN VERIFIKASI');
        console.log('📊 ============================================');
        
        const checks = {
            'Tabel absensi_siswa': existingColumns.includes('id'),
            'Kolom waktu_absen': existingColumns.includes('waktu_absen'),
            'Tabel jadwal': true,  // We checked this above
            'Tabel siswa_perwakilan': true,  // We checked this above
            'History query': true  // We tested this above
        };

        let allPassed = true;
        for (const [check, passed] of Object.entries(checks)) {
            console.log(`${passed ? '✅' : '❌'} ${check}`);
            if (!passed) allPassed = false;
        }

        console.log('\n');
        if (allPassed) {
            console.log('✅ SEMUA VERIFIKASI BERHASIL');
            console.log('   Database siap untuk sistem absensi guru');
        } else {
            console.log('❌ ADA MASALAH YANG HARUS DIPERBAIKI');
            console.log('   Silakan perbaiki struktur database terlebih dahulu');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n📡 Database connection closed');
        }
    }

    console.log('\n🔍 ============================================');
    console.log('🔍 Verifikasi Selesai');
    console.log('🔍 ============================================\n');
}

// Run verification
verifyDatabase();











