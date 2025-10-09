// Check Guru Table Structure
import mysql from 'mysql2/promise';
import 'dotenv/config';

const checkGuruTableStructure = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Checking guru table structure...\n');

        // Check table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
            AND TABLE_NAME = 'guru'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Guru table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''} ${col.EXTRA || ''}`);
        });

        // Check sample data
        const [sampleData] = await connection.execute(`
            SELECT * FROM guru LIMIT 3
        `);

        console.log('\n📊 Sample guru data:');
        sampleData.forEach((row, index) => {
            console.log(`  Row ${index + 1}:`, row);
        });

        // Check if id_guru exists
        const [idGuruCheck] = await connection.execute(`
            SELECT id_guru, id, user_id FROM guru LIMIT 1
        `);

        console.log('\n🔍 ID field check:');
        console.log('  Available fields:', Object.keys(idGuruCheck[0] || {}));

    } catch (error) {
        console.error('❌ Error checking guru table:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

checkGuruTableStructure();
