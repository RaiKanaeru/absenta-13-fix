// Script untuk memeriksa data login
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

async function checkLogin() {
    let connection;
    
    try {
        console.log('🔍 Checking login data...');
        connection = await mysql.createConnection(dbConfig);
        
        // Get all users
        const [users] = await connection.execute(`
            SELECT id, nama_pengguna, peran, nama, status 
            FROM pengguna 
            ORDER BY id
        `);
        
        console.log('📊 Users in database:');
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Username: ${user.nama_pengguna}, Role: ${user.peran}, Name: ${user.nama}, Status: ${user.status}`);
        });
        
        // Check specific user
        const [testUser] = await connection.execute(`
            SELECT id, nama_pengguna, kata_sandi, peran, nama, status 
            FROM pengguna 
            WHERE nama_pengguna = 'test_guru'
        `);
        
        if (testUser.length > 0) {
            console.log('\n📊 Test user details:');
            console.log(`  - Username: ${testUser[0].nama_pengguna}`);
            console.log(`  - Password hash: ${testUser[0].kata_sandi}`);
            console.log(`  - Role: ${testUser[0].peran}`);
            console.log(`  - Name: ${testUser[0].nama}`);
            console.log(`  - Status: ${testUser[0].status}`);
        } else {
            console.log('\n❌ test_guru user not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkLogin();

