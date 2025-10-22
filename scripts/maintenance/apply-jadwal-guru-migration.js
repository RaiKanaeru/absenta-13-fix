import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13',
            multipleStatements: true // Allow multiple SQL statements
        });

        console.log('🔗 Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '../../database/migrations/2025-10-21-create-jadwal-guru-table.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        console.log('📄 Reading migration file...');
        console.log('🔧 Applying migration...');

        // Execute migration
        await connection.query(migrationSQL);

        console.log('✅ Migration applied successfully!');
        console.log('\n📊 Tabel yang dibuat:');
        console.log('  1. jadwal_guru - Multi-teacher assignments');
        console.log('  2. absensi_guru_jadwal - Per-schedule teacher attendance');
        console.log('  3. absensi_guru_mapping - Legacy mapping table');

        // Verify tables were created
        console.log('\n🔍 Verifying tables...');
        
        const [tables] = await connection.query(`
            SHOW TABLES LIKE 'jadwal_guru%'
        `);

        if (tables.length > 0) {
            console.log('\n✅ Tables created successfully:');
            tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`  - ${tableName}`);
            });
        } else {
            console.log('⚠️  No tables found (might be already created)');
        }

        // Show table structure
        console.log('\n📋 Table structure for jadwal_guru:');
        const [columns] = await connection.query('DESCRIBE jadwal_guru');
        console.log('='.repeat(80));
        console.log('Field'.padEnd(20), 'Type'.padEnd(25), 'Null', 'Key', 'Default');
        console.log('='.repeat(80));
        columns.forEach(col => {
            console.log(
                col.Field.padEnd(20),
                col.Type.padEnd(25),
                col.Null.padEnd(5),
                (col.Key || '').padEnd(4),
                (col.Default || 'NULL')
            );
        });
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error applying migration:', error);
        
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('\nℹ️  Tables already exist - migration skipped');
        } else {
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

applyMigration();




