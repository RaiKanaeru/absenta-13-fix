// Script untuk cek role guru di database
import mysql from 'mysql2/promise';

async function checkGuruRole() {
    console.log('🔍 Checking guru role in database...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check users table for guru1
        console.log('\n1. Checking users table for guru1...');
        const [userData] = await connection.execute('SELECT * FROM users WHERE username = "guru1"');
        if (userData.length > 0) {
            console.log('📊 User data:');
            console.log(JSON.stringify(userData[0], null, 2));
            console.log('📊 Role value:', userData[0].role);
            console.log('📊 Role type:', typeof userData[0].role);
            console.log('📊 Role === "guru":', userData[0].role === 'guru');
            console.log('📊 Role === "GURU":', userData[0].role === 'GURU');
        } else {
            console.log('❌ No user data found for guru1');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkGuruRole();
