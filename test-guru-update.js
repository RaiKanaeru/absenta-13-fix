import { db } from './db.js';

async function testGuruUpdate() {
    try {
        console.log('🔍 Testing guru update...');
        
        // Test update guru ID 2 (Drs. Budi Santoso)
        const testData = {
            nip: '197001011990031001',
            nama: 'Drs. Budi Santoso, M.M (Test Update)',
            username: 'budi.santoso',
            password: 'password123',
            mapel_id: 1,
            no_telp: '081234567890',
            alamat: 'Jl. Test Update No. 123',
            jenis_kelamin: 'L',
            email: 'budi.test@example.com',
            status: 'aktif'
        };
        
        console.log('📝 Test data:', testData);
        
        // Check current data
        const [currentData] = await db.execute('SELECT * FROM guru WHERE id_guru = 2');
        console.log('📊 Current guru data:', currentData[0]);
        
        // Check user data
        const [userData] = await db.execute('SELECT * FROM users WHERE id = ?', [currentData[0].user_id]);
        console.log('👤 Current user data:', userData[0]);
        
        // Test password hashing
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(testData.password, 10);
        console.log('🔐 Hashed password:', hashedPassword);
        
        console.log('✅ Test completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testGuruUpdate();




