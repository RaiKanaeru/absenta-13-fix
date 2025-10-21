import { db } from '../db.js';

async function checkStructure() {
    try {
        const [columns] = await db.execute('DESCRIBE guru');
        console.log('\n📊 Struktur Tabel GURU:');
        console.log('='.repeat(60));
        columns.forEach(col => {
            console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
        });
        console.log('='.repeat(60));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkStructure();


