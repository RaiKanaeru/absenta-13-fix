// Script untuk debug guru login di server
import mysql from 'mysql2/promise';

async function debugGuruLoginServer() {
    console.log('🔍 Debugging guru login server logic...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Simulate login logic for guru1 (user_id 422)
        const user_id = 422;
        
        console.log('\n1. Checking guru data for user_id:', user_id);
        const [guruData] = await connection.execute(
            `SELECT g.*, m.nama_mapel 
             FROM guru g 
             JOIN mapel m ON g.mapel_id = m.id_mapel 
             WHERE g.user_id = ?`,
            [user_id]
        );
        
        console.log('📊 Guru data query result:');
        if (guruData.length > 0) {
            console.log(JSON.stringify(guruData[0], null, 2));
            
            const additionalData = {
                guru_id: guruData[0].id_guru,
                nip: guruData[0].nip,
                mapel: guruData[0].nama_mapel
            };
            
            console.log('\n📊 Additional data that should be in token:');
            console.log(JSON.stringify(additionalData, null, 2));
        } else {
            console.log('❌ No guru data found');
        }
        
        // Check if there's a mismatch in mapel_id
        console.log('\n2. Checking if there are any issues with the query...');
        
        // Check guru table directly
        const [guruTableData] = await connection.execute(
            'SELECT * FROM guru WHERE user_id = ?',
            [user_id]
        );
        
        if (guruTableData.length > 0) {
            console.log('📊 Guru table data:');
            console.log(JSON.stringify(guruTableData[0], null, 2));
            
            // Check if mapel exists
            const mapel_id = guruTableData[0].mapel_id;
            const [mapelData] = await connection.execute(
                'SELECT * FROM mapel WHERE id_mapel = ?',
                [mapel_id]
            );
            
            if (mapelData.length > 0) {
                console.log('📊 Mapel data exists:');
                console.log(JSON.stringify(mapelData[0], null, 2));
            } else {
                console.log('❌ Mapel data not found for id:', mapel_id);
            }
        } else {
            console.log('❌ No guru data found in guru table');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugGuruLoginServer();
