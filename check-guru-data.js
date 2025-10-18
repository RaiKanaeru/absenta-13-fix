// Script untuk cek data guru di database
import mysql from 'mysql2/promise';

async function checkGuruData() {
    console.log('🔍 Checking guru data in database...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check guru data for user_id 422 (guru1)
        console.log('\n1. Checking guru data for user_id 422...');
        const [guruData] = await connection.execute(
            `SELECT g.*, m.nama_mapel 
             FROM guru g 
             JOIN mapel m ON g.mapel_id = m.id_mapel 
             WHERE g.user_id = 422`
        );
        
        if (guruData.length > 0) {
            console.log('📊 Guru data found:');
            console.log(JSON.stringify(guruData[0], null, 2));
        } else {
            console.log('❌ No guru data found for user_id 422');
        }
        
        // Check all guru data
        console.log('\n2. Checking all guru data...');
        const [allGuruData] = await connection.execute(
            `SELECT g.*, m.nama_mapel 
             FROM guru g 
             LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
             LIMIT 5`
        );
        
        console.log('📊 All guru data:');
        allGuruData.forEach((guru, index) => {
            console.log(`${index + 1}. ID: ${guru.id_guru}, Nama: ${guru.nama}, User ID: ${guru.user_id}, Mapel: ${guru.nama_mapel}`);
        });
        
        // Check users table for guru1
        console.log('\n3. Checking users table for guru1...');
        const [userData] = await connection.execute(
            'SELECT * FROM users WHERE username = "guru1"'
        );
        
        if (userData.length > 0) {
            console.log('📊 User data:');
            console.log(JSON.stringify(userData[0], null, 2));
        } else {
            console.log('❌ No user data found for guru1');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkGuruData();