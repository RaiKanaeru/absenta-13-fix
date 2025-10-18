// Script untuk cek database users langsung
import mysql from 'mysql2/promise';

async function checkDatabaseUsers() {
    console.log('🔍 Checking database users directly...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check users table
        console.log('\n1. Checking users table...');
        const [users] = await connection.execute('SELECT * FROM users LIMIT 10');
        console.log('📊 Users table data:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Status: ${user.status}`);
        });
        
        // Check pengguna table
        console.log('\n2. Checking pengguna table...');
        const [pengguna] = await connection.execute('SELECT * FROM pengguna LIMIT 10');
        console.log('📊 Pengguna table data:');
        pengguna.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.nama_pengguna}, Role: ${user.peran}, Status: ${user.status}`);
        });
        
        // Check siswa table
        console.log('\n3. Checking siswa table...');
        const [siswa] = await connection.execute('SELECT * FROM siswa LIMIT 5');
        console.log('📊 Siswa table data:');
        siswa.forEach((s, index) => {
            console.log(`${index + 1}. ID: ${s.id}, Nama: ${s.nama}, NIS: ${s.nis}, User ID: ${s.user_id}`);
        });
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkDatabaseUsers();
