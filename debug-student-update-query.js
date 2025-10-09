// Debug Student Update Query
import mysql from 'mysql2/promise';
import 'dotenv/config';

const debugStudentUpdateQuery = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Debugging student update query...\n');

        const id = 2035; // This is the id_siswa value from frontend

        // Test the exact query used in the update endpoint
        console.log(`🔍 Testing query: SELECT id, user_id FROM siswa WHERE id_siswa = ?`);
        console.log(`   With id_siswa = ${id}`);
        
        const [existing] = await connection.execute('SELECT id, user_id FROM siswa WHERE id_siswa = ?', [id]);
        console.log(`   Result:`, existing);
        
        if (existing.length === 0) {
            console.log('   ❌ No student found with id_siswa =', id);
            
            // Let's see what id_siswa values exist
            const [allStudents] = await connection.execute('SELECT id_siswa, nama FROM siswa LIMIT 5');
            console.log('   Available id_siswa values:');
            allStudents.forEach(s => {
                console.log(`     - id_siswa: ${s.id_siswa}, nama: ${s.nama}`);
            });
        } else {
            console.log('   ✅ Student found:', existing[0]);
        }

        // Test with different ID values
        console.log('\n🔍 Testing with different ID values:');
        for (let testId of [2030, 2031, 2032, 2033, 2034, 2035]) {
            const [result] = await connection.execute('SELECT id_siswa, nama FROM siswa WHERE id_siswa = ?', [testId]);
            console.log(`   id_siswa = ${testId}: ${result.length > 0 ? result[0].nama : 'Not found'}`);
        }

    } catch (error) {
        console.error('❌ Error debugging student update query:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

debugStudentUpdateQuery();
