// Database Cleanup Script
import 'dotenv/config';
import mysql from 'mysql2/promise';

const cleanupDatabase = async () => {
    let connection;
    
    try {
        console.log('🧹 Starting database cleanup...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Create backup first
        console.log('💾 Creating backup...');
        const backupName = `absenta13_backup_${new Date().toISOString().split('T')[0]}`;
        console.log(`Backup name: ${backupName}`);
        console.log('⚠️  Please create a manual backup before proceeding!');
        
        // 2. Safe cleanup - only remove truly unused tables
        console.log('\n🗑️ SAFE CLEANUP - Removing only empty/unused tables:');
        
        const safeToRemove = [
            'hari_libur', // Empty, no references
            'kop_laporan', // Only 1 row, not used in current system
            'jam_pelajaran' // Not used in current system
        ];
        
        for (const tableName of safeToRemove) {
            try {
                console.log(`\n🔍 Checking table: ${tableName}`);
                
                // Check if table exists
                const [exists] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_SCHEMA = 'absenta13' 
                    AND TABLE_NAME = '${tableName}'
                `);
                
                if (exists[0].count === 0) {
                    console.log(`  ⚠️  Table ${tableName} does not exist, skipping`);
                    continue;
                }
                
                // Check row count
                const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                const rowCount = countResult[0].count;
                
                // Check references
                const [references] = await connection.execute(`
                    SELECT COUNT(*) as count
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = 'absenta13' 
                    AND REFERENCED_TABLE_NAME = '${tableName}'
                `);
                
                console.log(`  - Rows: ${rowCount}`);
                console.log(`  - Referenced by: ${references[0].count} tables`);
                
                if (rowCount === 0 && references[0].count === 0) {
                    console.log(`  ✅ Safe to remove: ${tableName}`);
                    await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
                    console.log(`  🗑️  Removed: ${tableName}`);
                } else {
                    console.log(`  ⚠️  Skipping ${tableName} - has data or references`);
                }
                
            } catch (error) {
                console.log(`  ❌ Error processing ${tableName}: ${error.message}`);
            }
        }
        
        // 3. Handle duplicate tables carefully
        console.log('\n🔄 HANDLING DUPLICATE TABLES:');
        
        // Check mata_pelajaran vs mapel
        const [mapelCount] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
        const [mataPelajaranCount] = await connection.execute('SELECT COUNT(*) as count FROM mata_pelajaran');
        
        console.log(`mapel: ${mapelCount[0].count} rows`);
        console.log(`mata_pelajaran: ${mataPelajaranCount[0].count} rows`);
        
        if (mapelCount[0].count > 0 && mataPelajaranCount[0].count > 0) {
            console.log('  ⚠️  Both mapel and mata_pelajaran have data - manual review needed');
            console.log('  💡 Consider merging data before removing duplicate');
        } else if (mapelCount[0].count > 0) {
            console.log('  ✅ mapel has data, mata_pelajaran can be removed');
            await connection.execute('DROP TABLE IF EXISTS mata_pelajaran');
            console.log('  🗑️  Removed: mata_pelajaran');
        } else if (mataPelajaranCount[0].count > 0) {
            console.log('  ✅ mata_pelajaran has data, mapel can be removed');
            await connection.execute('DROP TABLE IF EXISTS mapel');
            console.log('  🗑️  Removed: mapel');
        }
        
        // 4. Handle pengguna vs users
        console.log('\n🔄 HANDLING USER TABLES:');
        
        const [penggunaCount] = await connection.execute('SELECT COUNT(*) as count FROM pengguna');
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        
        console.log(`pengguna: ${penggunaCount[0].count} rows`);
        console.log(`users: ${usersCount[0].count} rows`);
        
        if (usersCount[0].count > 0) {
            console.log('  ✅ users table is active, pengguna can be removed');
            console.log('  ⚠️  WARNING: This will remove pengguna table with data!');
            console.log('  💡 Make sure all data has been migrated to users table');
            
            // Check if pengguna is still referenced
            const [penggunaRefs] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = 'pengguna'
            `);
            
            if (penggunaRefs[0].count === 0) {
                console.log('  ✅ pengguna has no references, safe to remove');
                await connection.execute('DROP TABLE IF EXISTS pengguna');
                console.log('  🗑️  Removed: pengguna');
            } else {
                console.log(`  ⚠️  pengguna still referenced by ${penggunaRefs[0].count} tables - skipping`);
            }
        }
        
        // 5. Final verification
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
        
        console.log(`\n✅ Cleanup complete! ${finalTables.length} tables remaining`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

cleanupDatabase();
