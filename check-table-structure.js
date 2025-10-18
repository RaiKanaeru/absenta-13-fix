// Script untuk cek struktur tabel
import mysql from 'mysql2/promise';

async function checkTableStructure() {
    console.log('🔍 Checking table structure...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check users table structure
        console.log('\n1. Checking users table structure...');
        const [usersStructure] = await connection.execute('DESCRIBE users');
        console.log('📊 Users table columns:');
        usersStructure.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type})`);
        });
        
        // Check pengguna table structure
        console.log('\n2. Checking pengguna table structure...');
        const [penggunaStructure] = await connection.execute('DESCRIBE pengguna');
        console.log('📊 Pengguna table columns:');
        penggunaStructure.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type})`);
        });
        
        // Check sample data from users table
        console.log('\n3. Checking sample data from users table...');
        const [usersData] = await connection.execute('SELECT * FROM users WHERE username LIKE "siswa%" LIMIT 3');
        console.log('📊 Users table sample data:');
        usersData.forEach((user, index) => {
            console.log(`${index + 1}. ${JSON.stringify(user, null, 2)}`);
        });
        
        // Check sample data from pengguna table
        console.log('\n4. Checking sample data from pengguna table...');
        const [penggunaData] = await connection.execute('SELECT * FROM pengguna WHERE nama_pengguna LIKE "siswa%" LIMIT 3');
        console.log('📊 Pengguna table sample data:');
        penggunaData.forEach((user, index) => {
            console.log(`${index + 1}. ${JSON.stringify(user, null, 2)}`);
        });
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkTableStructure();
