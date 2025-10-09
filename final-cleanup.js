// Final Database Cleanup
import 'dotenv/config';
import mysql from 'mysql2/promise';

const finalCleanup = async () => {
    let connection;
    
    try {
        console.log('🧹 Starting final database cleanup...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Remove mata_pelajaran (has foreign key constraints)
        console.log('🗑️ REMOVING MATA_PELAJARAN WITH CONSTRAINTS:');
        try {
            // First, find and remove foreign key constraints
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME,
                    COLUMN_NAME
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
            
            // Now remove the table
            await connection.execute('DROP TABLE IF EXISTS mata_pelajaran');
            console.log('✅ Removed: mata_pelajaran');
        } catch (error) {
            console.log(`❌ Error removing mata_pelajaran: ${error.message}`);
        }
        
        // 2. Remove jadwal_pelajaran (has foreign key constraints)
        console.log('\n🗑️ REMOVING JADWAL_PELAJARAN WITH CONSTRAINTS:');
        try {
            // First, find and remove foreign key constraints
            const [constraints] = await connection.execute(`
                SELECT 
                    TABLE_NAME,
                    CONSTRAINT_NAME,
                    COLUMN_NAME
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
            
            // Now remove the table
            await connection.execute('DROP TABLE IF EXISTS jadwal_pelajaran');
            console.log('✅ Removed: jadwal_pelajaran');
        } catch (error) {
            console.log(`❌ Error removing jadwal_pelajaran: ${error.message}`);
        }
        
        // 3. Clean up any remaining orphaned columns
        console.log('\n🔧 CLEANING UP ORPHANED COLUMNS:');
        
        // Check if guru table has id_pengguna column
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
        
        // Check if siswa table has id_pengguna column
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
        
        // 4. Final verification
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
        
        console.log(`\n✅ Final cleanup complete! ${finalTables.length} tables remaining`);
        
        // 5. Show summary
        console.log('\n📋 CLEANUP SUMMARY:');
        console.log('✅ Removed empty tables: absensi_siswa, banding_absen_detail, banding_pengajuan_izin, pengajuan_banding_absen, pengajuan_izin, pengajuan_izin_siswa');
        console.log('✅ Removed duplicate tables: mata_pelajaran, jadwal_pelajaran');
        console.log('✅ Removed unused tables: jam_pelajaran, kop_laporan, tahun_ajaran');
        console.log('✅ Removed old user table: pengguna');
        console.log('✅ Cleaned up orphaned columns: id_pengguna');
        
        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('💡 The database is now optimized with only essential tables.');
        
    } catch (error) {
        console.error('❌ Error during final cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

finalCleanup();
