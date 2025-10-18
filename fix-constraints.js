import { db } from './db.js';

async function fixConstraints() {
    try {
        console.log('🔧 Fixing attendance constraints...');
        
        // Check current constraints
        const [constraints] = await db.execute(`
            SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'absensi_siswa'
            AND CONSTRAINT_TYPE = 'UNIQUE'
        `);
        
        console.log('📋 Current unique constraints:');
        constraints.forEach(c => console.log(`  - ${c.CONSTRAINT_NAME}`));
        
        // Drop old constraint if it exists
        if (constraints.some(c => c.CONSTRAINT_NAME === 'unique_absensi_siswa_harian')) {
            console.log('🗑️  Dropping old constraint unique_absensi_siswa_harian...');
            await db.execute('ALTER TABLE absensi_siswa DROP CONSTRAINT unique_absensi_siswa_harian');
            console.log('✅ Old constraint dropped');
        }
        
        // Check if new constraint exists
        const hasNewConstraint = constraints.some(c => c.CONSTRAINT_NAME === 'uq_absen_slot');
        if (!hasNewConstraint) {
            console.log('➕ Adding new constraint uq_absen_slot...');
            await db.execute('ALTER TABLE absensi_siswa ADD CONSTRAINT uq_absen_slot UNIQUE (siswa_id, tanggal, jadwal_id)');
            console.log('✅ New constraint added');
        } else {
            console.log('✅ New constraint already exists');
        }
        
        // Verify final state
        const [finalConstraints] = await db.execute(`
            SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'absensi_siswa'
            AND CONSTRAINT_TYPE = 'UNIQUE'
        `);
        
        console.log('\n📋 Final unique constraints:');
        finalConstraints.forEach(c => console.log(`  - ${c.CONSTRAINT_NAME}`));
        
        console.log('\n🎉 Constraints fixed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing constraints:', error);
        throw error;
    } finally {
        await db.close();
    }
}

fixConstraints().catch(console.error);
