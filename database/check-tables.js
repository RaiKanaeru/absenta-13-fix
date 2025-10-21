import { db } from '../db.js';

async function checkTables() {
    try {
        const [tables] = await db.execute('SHOW TABLES');
        console.log('\n📊 Tables in absenta13 database:');
        console.log('='.repeat(50));
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`${index + 1}. ${tableName}`);
        });
        console.log('='.repeat(50));
        console.log(`\nTotal: ${tables.length} tables`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkTables();


