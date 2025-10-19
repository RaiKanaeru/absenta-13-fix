// Remove Unused Tables
import 'dotenv/config';
import mysql from 'mysql2/promise';

const removeUnusedTables = async () => {
    let connection;
    
    try {
        console.log('🗑️ Removing unused tables...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Remove pengguna table (replaced by users)
        console.log('🗑️ REMOVING PENGGUNA TABLE:');
        try {
            // First, remove foreign key constraints that reference pengguna
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = 'pengguna'
            `);
            
            console.log(`Found ${constraints.length} foreign key constraints referencing pengguna`);
            
            for (const constraint of constraints) {
                try {
                    console.log(`  Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                    await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                } catch (error) {
                    console.log(`  ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
            
            // Remove pengguna table
            await connection.execute('DROP TABLE IF EXISTS pengguna');
            console.log('✅ Removed: pengguna table');
        } catch (error) {
            console.log(`❌ Error removing pengguna: ${error.message}`);
        }
        
        // 2. Remove mata_pelajaran table (duplicate of mapel)
        console.log('\n🗑️ REMOVING MATA_PELAJARAN TABLE:');
        try {
            // First, remove foreign key constraints
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = 'mata_pelajaran'
            `);
            
            console.log(`Found ${constraints.length} foreign key constraints referencing mata_pelajaran`);
            
            for (const constraint of constraints) {
                try {
                    console.log(`  Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                    await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                } catch (error) {
                    console.log(`  ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
            
            // Remove mata_pelajaran table
            await connection.execute('DROP TABLE IF EXISTS mata_pelajaran');
            console.log('✅ Removed: mata_pelajaran table');
        } catch (error) {
            console.log(`❌ Error removing mata_pelajaran: ${error.message}`);
        }
        
        // 3. Remove jadwal_pelajaran table (duplicate of jadwal)
        console.log('\n🗑️ REMOVING JADWAL_PELAJARAN TABLE:');
        try {
            // First, remove foreign key constraints
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = 'jadwal_pelajaran'
            `);
            
            console.log(`Found ${constraints.length} foreign key constraints referencing jadwal_pelajaran`);
            
            for (const constraint of constraints) {
                try {
                    console.log(`  Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                    await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                } catch (error) {
                    console.log(`  ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
            
            // Remove jadwal_pelajaran table
            await connection.execute('DROP TABLE IF EXISTS jadwal_pelajaran');
            console.log('✅ Removed: jadwal_pelajaran table');
        } catch (error) {
            console.log(`❌ Error removing jadwal_pelajaran: ${error.message}`);
        }
        
        // 4. Remove empty/unused tables
        console.log('\n🗑️ REMOVING EMPTY/UNUSED TABLES:');
        
        const unusedTables = [
            'absensi_siswa',
            'banding_absen_detail',
            'banding_pengajuan_izin',
            'pengajuan_banding_absen',
            'pengajuan_izin',
            'pengajuan_izin_siswa',
            'jam_pelajaran',
            'kop_laporan',
            'tahun_ajaran',
            'hari_libur'
        ];
        
        for (const tableName of unusedTables) {
            try {
                console.log(`Removing table: ${tableName}`);
                await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                console.log(`✅ Removed: ${tableName}`);
            } catch (error) {
                console.log(`❌ Error removing ${tableName}: ${error.message}`);
            }
        }
        
        // 5. Clean up orphaned columns
        console.log('\n🔧 CLEANING UP ORPHANED COLUMNS:');
        
        // Remove id_pengguna columns if they exist
        try {
            const [guruColumns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = 'guru' 
                AND COLUMN_NAME = 'id_pengguna'
            `);
            
            if (guruColumns.length > 0) {
                console.log('  Removing id_pengguna column from guru table');
                await connection.execute('ALTER TABLE guru DROP COLUMN id_pengguna');
                console.log('  ✅ Removed id_pengguna from guru');
            }
        } catch (error) {
            console.log(`  ⚠️  Could not remove id_pengguna from guru: ${error.message}`);
        }
        
        try {
            const [siswaColumns] = await connection.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = 'siswa' 
                AND COLUMN_NAME = 'id_pengguna'
            `);
            
            if (siswaColumns.length > 0) {
                console.log('  Removing id_pengguna column from siswa table');
                await connection.execute('ALTER TABLE siswa DROP COLUMN id_pengguna');
                console.log('  ✅ Removed id_pengguna from siswa');
            }
        } catch (error) {
            console.log(`  ⚠️  Could not remove id_pengguna from siswa: ${error.message}`);
        }
        
        // 6. Final verification
        console.log('\n📊 FINAL DATABASE STATE:');
        
        const [finalTables] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13'
            ORDER BY TABLE_NAME
        `);
        
        console.log('Remaining tables:');
        finalTables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} rows`);
        });
        
        console.log(`\n✅ Table removal complete! ${finalTables.length} tables remaining`);
        
        // 7. Show what was removed
        const removedTables = [
            'pengguna', 'mata_pelajaran', 'jadwal_pelajaran',
            'absensi_siswa', 'banding_absen_detail', 'banding_pengajuan_izin',
            'pengajuan_banding_absen', 'pengajuan_izin', 'pengajuan_izin_siswa',
            'jam_pelajaran', 'kop_laporan', 'tahun_ajaran', 'hari_libur'
        ];
        
        console.log('\n🗑️ REMOVED TABLES:');
        removedTables.forEach(table => {
            console.log(`  - ${table}`);
        });
        
        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('💡 The database now only contains essential tables.');
        
    } catch (error) {
        console.error('❌ Error during table removal:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

removeUnusedTables();
