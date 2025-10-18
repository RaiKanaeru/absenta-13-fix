// Script untuk cek kredensial guru yang ada di database
import mysql from 'mysql2/promise';

async function checkGuruCredentials() {
    console.log('🔍 Checking available guru credentials...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check users table for guru
        console.log('\n1. Checking users table for guru...');
        const [users] = await connection.execute('SELECT * FROM users WHERE role = "GURU" LIMIT 5');
        console.log('📊 Users with GURU role:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Status: ${user.status}`);
        });
        
        // Check pengguna table for guru
        console.log('\n2. Checking pengguna table for guru...');
        const [pengguna] = await connection.execute('SELECT * FROM pengguna WHERE peran = "guru" LIMIT 5');
        console.log('📊 Pengguna with guru role:');
        pengguna.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user.id}, Username: ${user.nama_pengguna}, Role: ${user.peran}, Status: ${user.status}`);
        });
        
        // Check guru table
        console.log('\n3. Checking guru table...');
        const [guru] = await connection.execute('SELECT * FROM guru LIMIT 5');
        console.log('📊 Guru table data:');
        guru.forEach((g, index) => {
            console.log(`${index + 1}. ID: ${g.id_guru}, Nama: ${g.nama}, NIP: ${g.nip}, User ID: ${g.user_id}`);
        });
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkGuruCredentials();
