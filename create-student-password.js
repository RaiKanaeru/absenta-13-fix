// Script untuk membuat password baru untuk siswa
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function createStudentPassword() {
    console.log('🔍 Creating new password for siswa1...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Hash password 'siswa123'
        const hashedPassword = await bcrypt.hash('siswa123', 10);
        console.log('🔐 Hashed password:', hashedPassword);
        
        // Update password for siswa1 in users table
        console.log('\n1. Updating password for siswa1 in users table...');
        const [updateResult] = await connection.execute(
            'UPDATE users SET password = ? WHERE username = "siswa1"',
            [hashedPassword]
        );
        console.log(`✅ Updated ${updateResult.affectedRows} record in users table`);
        
        // Update password for siswa1 in pengguna table
        console.log('\n2. Updating password for siswa1 in pengguna table...');
        const [updatePenggunaResult] = await connection.execute(
            'UPDATE pengguna SET kata_sandi = ? WHERE nama_pengguna = "siswa1"',
            [hashedPassword]
        );
        console.log(`✅ Updated ${updatePenggunaResult.affectedRows} record in pengguna table`);
        
        // Verify the update
        console.log('\n3. Verifying updated password...');
        const [usersData] = await connection.execute(
            'SELECT username, password FROM users WHERE username = "siswa1"'
        );
        console.log('📊 Users table password:', usersData[0]?.password?.substring(0, 20) + '...');
        
        const [penggunaData] = await connection.execute(
            'SELECT nama_pengguna, kata_sandi FROM pengguna WHERE nama_pengguna = "siswa1"'
        );
        console.log('📊 Pengguna table password:', penggunaData[0]?.kata_sandi?.substring(0, 20) + '...');
        
        await connection.end();
        
        console.log('\n✅ Password updated successfully!');
        
    } catch (error) {
        console.error('❌ Update failed:', error.message);
    }
}

createStudentPassword();
