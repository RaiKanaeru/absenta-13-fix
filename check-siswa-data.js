// Script untuk cek data siswa yang ada
import mysql from 'mysql2/promise';

async function checkSiswaData() {
    console.log('🔍 Checking available siswa data...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check all siswa data
        console.log('\n1. Checking all siswa data...');
        const [allSiswaData] = await connection.execute('SELECT * FROM siswa LIMIT 5');
        console.log('📊 All siswa data:');
        allSiswaData.forEach((siswa, index) => {
            console.log(`${index + 1}. ID: ${siswa.id}, User ID: ${siswa.user_id}, Nama: ${siswa.nama}, NIS: ${siswa.nis}`);
        });
        
        // Check users table for siswa1
        console.log('\n2. Checking users table for siswa1...');
        const [userData] = await connection.execute('SELECT * FROM users WHERE username = "siswa1"');
        if (userData.length > 0) {
            console.log('📊 User data:');
            console.log(JSON.stringify(userData[0], null, 2));
        } else {
            console.log('❌ No user data found for siswa1');
        }
        
        // Check if there's a mismatch between users and siswa
        console.log('\n3. Checking for siswa with user_id 347...');
        const [siswaData] = await connection.execute('SELECT * FROM siswa WHERE user_id = 347');
        if (siswaData.length > 0) {
            console.log('📊 Siswa data found:');
            console.log(JSON.stringify(siswaData[0], null, 2));
        } else {
            console.log('❌ No siswa data found for user_id 347');
        }
        
        // Check if there's any siswa with different user_id
        console.log('\n4. Checking for any siswa data...');
        const [anySiswaData] = await connection.execute('SELECT * FROM siswa LIMIT 1');
        if (anySiswaData.length > 0) {
            console.log('📊 Sample siswa data:');
            console.log(JSON.stringify(anySiswaData[0], null, 2));
        } else {
            console.log('❌ No siswa data found at all');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkSiswaData();
