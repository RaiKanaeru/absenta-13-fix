// Remove Specific Tables (pengguna and kategori_izin)
import 'dotenv/config';
import mysql from 'mysql2/promise';

const removeSpecificTables = async () => {
    let connection;
    
    try {
        console.log('🗑️ Removing specific tables (pengguna and kategori_izin)...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Remove pengguna table
        console.log('🗑️ REMOVING PENGGUNA TABLE:');
        try {
            // First, check if pengguna table exists
            const [exists] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = 'pengguna'
            `);
            
            if (exists[0].count === 0) {
                console.log('  ⚠️  pengguna table does not exist, skipping');
            } else {
                // Check for foreign key constraints that reference pengguna
                const [constraints] = await connection.execute(`
                    SELECT 
                        TABLE_NAME,
                        CONSTRAINT_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'absenta13' 
                    AND REFERENCED_TABLE_NAME = 'pengguna'
                `);
                
                console.log(`  Found ${constraints.length} foreign key constraints referencing pengguna`);
                
                // Remove foreign key constraints
                for (const constraint of constraints) {
                    try {
                        console.log(`    Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                        await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                    } catch (error) {
                        console.log(`    ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                    }
                }
                
                // Remove pengguna table
                await connection.execute('DROP TABLE pengguna');
                console.log('  ✅ Removed: pengguna table');
            }
        } catch (error) {
            console.log(`  ❌ Error removing pengguna: ${error.message}`);
        }
        
        // 2. Remove kategori_izin table
        console.log('\n🗑️ REMOVING KATEGORI_IZIN TABLE:');
        try {
            // First, check if kategori_izin table exists
            const [exists] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = 'kategori_izin'
            `);
            
            if (exists[0].count === 0) {
                console.log('  ⚠️  kategori_izin table does not exist, skipping');
            } else {
                // Check for foreign key constraints that reference kategori_izin
                const [constraints] = await connection.execute(`
                    SELECT 
                        TABLE_NAME,
                        CONSTRAINT_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'absenta13' 
                    AND REFERENCED_TABLE_NAME = 'kategori_izin'
                `);
                
                console.log(`  Found ${constraints.length} foreign key constraints referencing kategori_izin`);
                
                // Remove foreign key constraints
                for (const constraint of constraints) {
                    try {
                        console.log(`    Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                        await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                    } catch (error) {
                        console.log(`    ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                    }
                }
                
                // Remove kategori_izin table
                await connection.execute('DROP TABLE kategori_izin');
                console.log('  ✅ Removed: kategori_izin table');
            }
        } catch (error) {
            console.log(`  ❌ Error removing kategori_izin: ${error.message}`);
        }
        
        // 3. Remove tahun_ajaran table
        console.log('\n🗑️ REMOVING TAHUN_AJARAN TABLE:');
        try {
            // First, check if tahun_ajaran table exists
            const [exists] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = 'tahun_ajaran'
            `);
            
            if (exists[0].count === 0) {
                console.log('  ⚠️  tahun_ajaran table does not exist, skipping');
            } else {
                // Check for foreign key constraints that reference tahun_ajaran
                const [constraints] = await connection.execute(`
                    SELECT 
                        TABLE_NAME,
                        CONSTRAINT_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'absenta13' 
                    AND REFERENCED_TABLE_NAME = 'tahun_ajaran'
                `);
                
                console.log(`  Found ${constraints.length} foreign key constraints referencing tahun_ajaran`);
                
                // Remove foreign key constraints
                for (const constraint of constraints) {
                    try {
                        console.log(`    Removing constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`);
                        await connection.execute(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
                    } catch (error) {
                        console.log(`    ⚠️  Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                    }
                }
                
                // Remove tahun_ajaran table
                await connection.execute('DROP TABLE tahun_ajaran');
                console.log('  ✅ Removed: tahun_ajaran table');
            }
        } catch (error) {
            console.log(`  ❌ Error removing tahun_ajaran: ${error.message}`);
        }
        
        // 3. Clean up orphaned columns
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
            } else {
                console.log('  id_pengguna column not found in guru table');
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
            } else {
                console.log('  id_pengguna column not found in siswa table');
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
        
        console.log(`\n✅ Table removal complete! ${finalTables.length} tables remaining`);
        
        console.log('\n🗑️ REMOVED TABLES:');
        console.log('  - pengguna (replaced by users)');
        console.log('  - kategori_izin (unused)');
        console.log('  - tahun_ajaran (unused)');
        
        console.log('\n🎉 Specific table removal completed successfully!');
        console.log('💡 The database now uses users table as the main user table.');
        
    } catch (error) {
        console.error('❌ Error during table removal:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

removeSpecificTables();
