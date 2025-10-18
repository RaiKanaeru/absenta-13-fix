// Script untuk cek password hash di database
import mysql from 'mysql2/promise';

async function checkPasswordHash() {
    console.log('🔍 Checking password hashes in database...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check users table password hashes
        console.log('\n1. Checking users table password hashes...');
        const [users] = await connection.execute('SELECT id, username, password_hash, role FROM users WHERE username LIKE "siswa%" LIMIT 5');
        console.log('📊 Users table password data:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Password Hash: ${user.password_hash?.substring(0, 20)}..., Role: ${user.role}`);
        });
        
        // Check pengguna table password hashes
        console.log('\n2. Checking pengguna table password hashes...');
        const [pengguna] = await connection.execute('SELECT id, nama_pengguna, kata_sandi, peran FROM pengguna WHERE nama_pengguna LIKE "siswa%" LIMIT 5');
        console.log('📊 Pengguna table password data:');
        pengguna.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.nama_pengguna}, Password Hash: ${user.kata_sandi?.substring(0, 20)}..., Role: ${user.peran}`);
        });
        
        // Check if there are any users with role siswa in users table
        console.log('\n3. Checking for users with role siswa...');
        const [siswaUsers] = await connection.execute('SELECT id, username, password_hash, role FROM users WHERE role = "siswa" OR role = "KETOS" LIMIT 5');
        console.log('📊 Users with siswa role:');
        if (siswaUsers.length > 0) {
            siswaUsers.forEach((user, index) => {
                console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Password Hash: ${user.password_hash?.substring(0, 20)}..., Role: ${user.role}`);
            });
        } else {
            console.log('❌ No users found with role siswa or KETOS');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkPasswordHash();
