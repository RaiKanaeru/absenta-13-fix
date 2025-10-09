import { db } from './db.js';

async function checkGuruData() {
    try {
        console.log('🔍 Checking guru data...');
        
        const [rows] = await db.execute('SELECT id_guru, nama, user_id FROM guru ORDER BY id_guru');
        
        console.log('📊 Guru data:');
        rows.forEach(g => {
            console.log(`ID: ${g.id_guru}, Nama: ${g.nama}, User ID: ${g.user_id}`);
        });
        
        console.log(`\n📈 Total guru: ${rows.length}`);
        
        // Check if ID 433 exists
        const [guru433] = await db.execute('SELECT * FROM guru WHERE id_guru = 433');
        if (guru433.length > 0) {
            console.log('\n✅ Guru ID 433 found:', guru433[0]);
        } else {
            console.log('\n❌ Guru ID 433 not found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkGuruData();
