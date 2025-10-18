// Script untuk cek data kelas
import mysql from 'mysql2/promise';

async function checkKelasData() {
    console.log('🔍 Checking kelas data...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check kelas data
        console.log('\n1. Checking kelas data...');
        const [kelasData] = await connection.execute('SELECT * FROM kelas WHERE id_kelas = 1');
        if (kelasData.length > 0) {
            console.log('📊 Kelas data:');
            console.log(JSON.stringify(kelasData[0], null, 2));
        } else {
            console.log('❌ No kelas data found for id_kelas 1');
        }
        
        // Check all kelas data
        console.log('\n2. Checking all kelas data...');
        const [allKelasData] = await connection.execute('SELECT * FROM kelas LIMIT 5');
        console.log('📊 All kelas data:');
        allKelasData.forEach((kelas, index) => {
            console.log(`${index + 1}. ID: ${kelas.id_kelas}, Nama: ${kelas.nama_kelas}`);
        });
        
        // Test the JOIN query
        console.log('\n3. Testing JOIN query...');
        const [joinData] = await connection.execute(
            `SELECT s.*, k.nama_kelas 
             FROM siswa s 
             JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.user_id = 347`
        );
        
        if (joinData.length > 0) {
            console.log('📊 JOIN query result:');
            console.log(JSON.stringify(joinData[0], null, 2));
        } else {
            console.log('❌ JOIN query failed');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkKelasData();
