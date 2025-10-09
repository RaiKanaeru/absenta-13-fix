// Debug Guru Query
import mysql from 'mysql2/promise';
import 'dotenv/config';

const debugGuruQuery = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Debugging guru query...\n');

        const id = 2; // This is the id_guru value from frontend

        // Test the exact query used in the update endpoint
        console.log(`🔍 Testing query: SELECT user_id FROM guru WHERE id_guru = ?`);
        console.log(`   With id_guru = ${id}`);
        
        const [guruUser] = await connection.execute('SELECT user_id FROM guru WHERE id_guru = ?', [id]);
        console.log(`   Result:`, guruUser);
        
        if (guruUser.length === 0) {
            console.log('   ❌ No guru found with id_guru =', id);
            
            // Let's see what id_guru values exist
            const [allGuru] = await connection.execute('SELECT id_guru, nama FROM guru LIMIT 5');
            console.log('   Available id_guru values:');
            allGuru.forEach(g => {
                console.log(`     - id_guru: ${g.id_guru}, nama: ${g.nama}`);
            });
        } else {
            console.log('   ✅ Guru found:', guruUser[0]);
        }

        // Test with different ID values
        console.log('\n🔍 Testing with different ID values:');
        for (let testId of [1, 2, 3, 4, 5]) {
            const [result] = await connection.execute('SELECT id_guru, nama FROM guru WHERE id_guru = ?', [testId]);
            console.log(`   id_guru = ${testId}: ${result.length > 0 ? result[0].nama : 'Not found'}`);
        }

    } catch (error) {
        console.error('❌ Error debugging guru query:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

debugGuruQuery();
