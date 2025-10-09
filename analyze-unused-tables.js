// Analyze Unused Tables
import 'dotenv/config';
import mysql from 'mysql2/promise';

const analyzeUnusedTables = async () => {
    let connection;
    
    try {
        console.log('🔍 Analyzing unused tables in absenta13 database...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Get all tables
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13'
            ORDER BY TABLE_NAME
        `);
        
        console.log('📋 ALL TABLES IN DATABASE:');
        tables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        // 2. Check table usage and data
        console.log('\n🔍 ANALYZING TABLE USAGE:');
        
        const tableAnalysis = [];
        
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            
            // Get row count
            const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const rowCount = countResult[0].count;
            
            // Check if table has foreign key references
            const [fkResult] = await connection.execute(`
                SELECT 
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND TABLE_NAME = '${tableName}' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            `);
            
            // Check if table is referenced by other tables
            const [referencedBy] = await connection.execute(`
                SELECT 
                    TABLE_NAME as referencing_table,
                    COLUMN_NAME as referencing_column
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = 'absenta13' 
                AND REFERENCED_TABLE_NAME = '${tableName}'
            `);
            
            tableAnalysis.push({
                name: tableName,
                rowCount,
                hasForeignKeys: fkResult.length > 0,
                foreignKeys: fkResult,
                referencedBy: referencedBy.length,
                referencingTables: referencedBy
            });
        }
        
        // 3. Identify unused tables
        console.log('\n📊 TABLE ANALYSIS RESULTS:');
        
        const unusedTables = [];
        const duplicateTables = [];
        const emptyTables = [];
        
        tableAnalysis.forEach(table => {
            console.log(`\n📋 ${table.name}:`);
            console.log(`  - Rows: ${table.rowCount}`);
            console.log(`  - Has Foreign Keys: ${table.hasForeignKeys ? 'Yes' : 'No'}`);
            console.log(`  - Referenced by: ${table.referencedBy} tables`);
            
            // Check for duplicates
            if (table.name === 'mapel' || table.name === 'mata_pelajaran') {
                duplicateTables.push(table);
            }
            
            // Check for empty tables
            if (table.rowCount === 0) {
                emptyTables.push(table);
            }
            
            // Check for unused tables (no data, no references)
            if (table.rowCount === 0 && table.referencedBy === 0) {
                unusedTables.push(table);
            }
        });
        
        // 4. Identify specific tables to remove
        console.log('\n🗑️ TABLES TO REMOVE:');
        
        // Tables that are definitely unused/duplicate
        const tablesToRemove = [
            'pengguna', // Replaced by 'users'
            'mata_pelajaran', // Duplicate of 'mapel'
            'jadwal_pelajaran', // Duplicate of 'jadwal'
            'jam_pelajaran', // Not used in current system
            'hari_libur', // Not implemented yet
            'kop_laporan', // Not used in current system
            'tahun_ajaran' // Not used in current system
        ];
        
        console.log('Definitely unused tables:');
        tablesToRemove.forEach(tableName => {
            const table = tableAnalysis.find(t => t.name === tableName);
            if (table) {
                console.log(`  - ${tableName}: ${table.rowCount} rows, referenced by ${table.referencedBy} tables`);
            } else {
                console.log(`  - ${tableName}: Not found in database`);
            }
        });
        
        // 5. Check for tables with no data
        console.log('\n📊 EMPTY TABLES:');
        emptyTables.forEach(table => {
            console.log(`  - ${table.name}: 0 rows`);
        });
        
        // 6. Check for tables that might be unused
        console.log('\n⚠️ POTENTIALLY UNUSED TABLES:');
        const potentiallyUnused = tableAnalysis.filter(table => 
            table.rowCount === 0 && 
            table.referencedBy === 0 && 
            !tablesToRemove.includes(table.name)
        );
        
        potentiallyUnused.forEach(table => {
            console.log(`  - ${table.name}: 0 rows, no references`);
        });
        
        // 7. Generate cleanup script
        console.log('\n🔧 GENERATING CLEANUP SCRIPT...');
        
        const cleanupScript = `
-- Database Cleanup Script for absenta13
-- Generated on: ${new Date().toISOString()}

-- WARNING: This script will permanently delete tables and data!
-- Make sure to backup your database before running this script.

-- 1. Remove unused/duplicate tables
DROP TABLE IF EXISTS pengguna;
DROP TABLE IF EXISTS mata_pelajaran;
DROP TABLE IF EXISTS jadwal_pelajaran;
DROP TABLE IF EXISTS jam_pelajaran;
DROP TABLE IF EXISTS hari_libur;
DROP TABLE IF EXISTS kop_laporan;
DROP TABLE IF EXISTS tahun_ajaran;

-- 2. Remove empty tables (if any)
${emptyTables.map(table => `DROP TABLE IF EXISTS ${table.name};`).join('\n')}

-- 3. Verify remaining tables
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'absenta13'
ORDER BY TABLE_NAME;
`;
        
        console.log(cleanupScript);
        
        // 8. Summary
        console.log('\n📋 SUMMARY:');
        console.log(`- Total tables: ${tables.length}`);
        console.log(`- Tables to remove: ${tablesToRemove.length}`);
        console.log(`- Empty tables: ${emptyTables.length}`);
        console.log(`- Potentially unused: ${potentiallyUnused.length}`);
        
        console.log('\n✅ Analysis complete!');
        
    } catch (error) {
        console.error('❌ Error analyzing tables:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

analyzeUnusedTables();
