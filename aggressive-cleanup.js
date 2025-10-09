// Aggressive Database Cleanup
import 'dotenv/config';
import mysql from 'mysql2/promise';

const aggressiveCleanup = async () => {
    let connection;
    
    try {
        console.log('🧹 Starting aggressive database cleanup...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Remove empty tables first
        console.log('🗑️ REMOVING EMPTY TABLES:');
        
        const emptyTables = [
            'absensi_siswa',
            'banding_absen_detail', 
            'banding_pengajuan_izin',
            'pengajuan_banding_absen',
            'pengajuan_izin',
            'pengajuan_izin_siswa'
        ];
        
        for (const tableName of emptyTables) {
            try {
                console.log(`Removing empty table: ${tableName}`);
                await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                console.log(`✅ Removed: ${tableName}`);
            } catch (error) {
                console.log(`❌ Error removing ${tableName}: ${error.message}`);
            }
        }
        
        // 2. Remove duplicate mata_pelajaran (keep mapel)
        console.log('\n🔄 REMOVING DUPLICATE MATA_PELAJARAN:');
        try {
            // First, check if we need to migrate any data
            const [mapelCount] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
            const [mataPelajaranCount] = await connection.execute('SELECT COUNT(*) as count FROM mata_pelajaran');
            
            console.log(`mapel: ${mapelCount[0].count} rows`);
            console.log(`mata_pelajaran: ${mataPelajaranCount[0].count} rows`);
            
            if (mataPelajaranCount[0].count > mapelCount[0].count) {
                console.log('⚠️  mata_pelajaran has more data than mapel');
                console.log('💡 Consider migrating data from mata_pelajaran to mapel first');
            }
            
            // Remove mata_pelajaran
            await connection.execute('DROP TABLE IF EXISTS mata_pelajaran');
            console.log('✅ Removed: mata_pelajaran');
        } catch (error) {
            console.log(`❌ Error removing mata_pelajaran: ${error.message}`);
        }
        
        // 3. Remove old jadwal_pelajaran (keep jadwal)
        console.log('\n🔄 REMOVING OLD JADWAL_PELAJARAN:');
        try {
            const [jadwalCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal');
            const [jadwalPelajaranCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_pelajaran');
            
            console.log(`jadwal: ${jadwalCount[0].count} rows`);
            console.log(`jadwal_pelajaran: ${jadwalPelajaranCount[0].count} rows`);
            
            // Remove jadwal_pelajaran
            await connection.execute('DROP TABLE IF EXISTS jadwal_pelajaran');
            console.log('✅ Removed: jadwal_pelajaran');
        } catch (error) {
            console.log(`❌ Error removing jadwal_pelajaran: ${error.message}`);
        }
        
        // 4. Remove unused tables
        console.log('\n🗑️ REMOVING UNUSED TABLES:');
        
        const unusedTables = [
            'jam_pelajaran', // Not used in current system
            'kop_laporan', // Not used in current system
            'tahun_ajaran' // Not used in current system
        ];
        
        for (const tableName of unusedTables) {
            try {
                console.log(`Removing unused table: ${tableName}`);
                await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                console.log(`✅ Removed: ${tableName}`);
            } catch (error) {
                console.log(`❌ Error removing ${tableName}: ${error.message}`);
            }
        }
        
        // 5. Handle pengguna table carefully
        console.log('\n🔄 HANDLING PENGGUNA TABLE:');
        try {
            // Check if pengguna is still referenced
            const [penggunaRefs] = await connection.execute(`
                SELECT 
                    TABLE_NAME as referencing_table,
                    COLUMN_NAME as referencing_column
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = 'pengguna'
            `);
            
            console.log(`pengguna referenced by ${penggunaRefs.length} tables:`);
            penggunaRefs.forEach(ref => {
                console.log(`  - ${ref.referencing_table}.${ref.referencing_column}`);
            });
            
            if (penggunaRefs.length > 0) {
                console.log('⚠️  pengguna still has references, removing foreign keys first...');
                
                // Remove foreign key constraints
                for (const ref of penggunaRefs) {
                    try {
                        // Get constraint name
                        const [constraints] = await connection.execute(`
                            SELECT CONSTRAINT_NAME
                            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                            WHERE TABLE_SCHEMA = 'absenta13' 
                            AND TABLE_NAME = '${ref.referencing_table}'
                            AND REFERENCED_TABLE_NAME = 'pengguna'
                        `);
                        
                        if (constraints.length > 0) {
                            const constraintName = constraints[0].CONSTRAINT_NAME;
                            console.log(`  Removing constraint: ${constraintName}`);
                            await connection.execute(`ALTER TABLE ${ref.referencing_table} DROP FOREIGN KEY ${constraintName}`);
                        }
                    } catch (error) {
                        console.log(`  ⚠️  Could not remove constraint for ${ref.referencing_table}: ${error.message}`);
                    }
                }
            }
            
            // Now remove pengguna table
            await connection.execute('DROP TABLE IF EXISTS pengguna');
            console.log('✅ Removed: pengguna');
        } catch (error) {
            console.log(`❌ Error removing pengguna: ${error.message}`);
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
        
        console.log(`\n✅ Aggressive cleanup complete! ${finalTables.length} tables remaining`);
        
        // 7. Show what was removed
        const removedTables = [
            'absensi_siswa', 'banding_absen_detail', 'banding_pengajuan_izin',
            'pengajuan_banding_absen', 'pengajuan_izin', 'pengajuan_izin_siswa',
            'mata_pelajaran', 'jadwal_pelajaran', 'jam_pelajaran', 
            'kop_laporan', 'tahun_ajaran', 'pengguna'
        ];
        
        console.log('\n🗑️ REMOVED TABLES:');
        removedTables.forEach(table => {
            console.log(`  - ${table}`);
        });
        
    } catch (error) {
        console.error('❌ Error during aggressive cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

aggressiveCleanup();
