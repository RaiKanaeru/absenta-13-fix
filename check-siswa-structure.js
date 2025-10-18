// Script untuk cek struktur tabel siswa
import mysql from 'mysql2/promise';

async function checkSiswaStructure() {
    console.log('🔍 Checking siswa table structure...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check siswa table structure
        console.log('\n1. Checking siswa table structure...');
        const [siswaStructure] = await connection.execute('DESCRIBE siswa');
        console.log('📊 Siswa table columns:');
        siswaStructure.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type})`);
        });
        
        // Check sample data from siswa table
        console.log('\n2. Checking sample data from siswa table...');
        const [siswaData] = await connection.execute('SELECT * FROM siswa WHERE user_id = 347 LIMIT 1');
        console.log('📊 Siswa data for user_id 347:');
        if (siswaData.length > 0) {
            console.log(JSON.stringify(siswaData[0], null, 2));
        } else {
            console.log('❌ No data found for user_id 347');
        }
        
        // Check kelas table structure
        console.log('\n3. Checking kelas table structure...');
        const [kelasStructure] = await connection.execute('DESCRIBE kelas');
        console.log('📊 Kelas table columns:');
        kelasStructure.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type})`);
        });
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkSiswaStructure();
