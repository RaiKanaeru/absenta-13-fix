import { db } from './db.js';

async function checkConstraints() {
    try {
        const [rows] = await db.execute('SHOW CREATE TABLE absensi_siswa');
        const createTable = rows[0]['Create Table'];
        
        console.log('🔍 Checking constraints in absensi_siswa table...');
        
        // Look for unique constraints
        const lines = createTable.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('unique_absensi_siswa_harian') || line.includes('UNIQUE')) {
                console.log(`Line ${i}: ${line.trim()}`);
            }
        });
        
        // Check if the constraint exists
        const hasUniqueConstraint = createTable.includes('unique_absensi_siswa_harian');
        console.log(`\n✅ Has unique_absensi_siswa_harian constraint: ${hasUniqueConstraint}`);
        
        if (hasUniqueConstraint) {
            console.log('⚠️  This constraint prevents multiple attendance records per student per date');
            console.log('⚠️  But the business logic requires multiple records per student per date (one per slot)');
            console.log('⚠️  This is a design conflict that needs to be resolved');
        }
        
    } catch (error) {
        console.error('❌ Error checking constraints:', error);
    } finally {
        await db.close();
    }
}

checkConstraints();

