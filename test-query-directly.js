// Test query langsung di database
import mysql from 'mysql2/promise';

async function testQuery() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('🔍 Testing query directly...');
        
        // Test the exact query from server
        const query = `
            SELECT s.*, k.nama_kelas, u.username, u.status as user_status
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC LIMIT 10 OFFSET 0
        `;
        
        console.log('📋 Executing query...');
        const [rows] = await connection.execute(query);
        console.log('✅ Query successful!');
        console.log('📊 Result count:', rows.length);
        console.log('📊 Sample data:', rows[0]);
        
        // Test count query
        const countQuery = 'SELECT COUNT(*) as total FROM siswa s JOIN kelas k ON s.kelas_id = k.id_kelas LEFT JOIN users u ON s.user_id = u.id';
        const [countResult] = await connection.execute(countQuery);
        console.log('📊 Total count:', countResult[0].total);
        
    } catch (error) {
        console.error('❌ Query failed:', error.message);
        console.error('❌ SQL State:', error.sqlState);
        console.error('❌ Error Code:', error.errno);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testQuery();
