// Script untuk test login secara langsung
import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    charset: 'utf8mb4',
    port: 3306
};

async function testLogin() {
    let connection;
    
    try {
        console.log('🔍 Testing login directly...');
        connection = await mysql.createConnection(dbConfig);
        
        // Test query yang sama dengan server
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND (status IN ("aktif", "active", "1", "1") OR status IS NULL)',
            ['admin']
        );
        
        console.log('📊 Query result:', rows);
        
        if (rows.length > 0) {
            const user = rows[0];
            console.log('📊 User found:');
            console.log(`  - ID: ${user.id}`);
            console.log(`  - Username: ${user.username}`);
            console.log(`  - Role: ${user.role}`);
            console.log(`  - Nama: ${user.nama}`);
            console.log(`  - Status: ${user.status}`);
            console.log(`  - Password hash: ${user.password ? 'Present' : 'Missing'}`);
        } else {
            console.log('❌ No user found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testLogin();
