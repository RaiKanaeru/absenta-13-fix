// Script untuk membuat data siswa untuk user_id 347
import mysql from 'mysql2/promise';

async function createSiswaData() {
    console.log('🔍 Creating siswa data for user_id 347...');
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Create siswa data for user_id 347
        console.log('\n1. Creating siswa data...');
        const [insertResult] = await connection.execute(
            `INSERT INTO siswa (id_siswa, user_id, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [347, 347, '2024011347', 'Qori Sari', 1, 'Ketua Kelas', 'P', 'qori.sari@student.smkn13bandung.sch.id', 'Jl. Contoh No. 347, Bandung', '081234567890', '081234567891', 'aktif']
        );
        
        console.log(`✅ Created siswa data with ID: ${insertResult.insertId}`);
        
        // Verify the insert
        console.log('\n2. Verifying created data...');
        const [siswaData] = await connection.execute('SELECT * FROM siswa WHERE user_id = 347');
        if (siswaData.length > 0) {
            console.log('📊 Created siswa data:');
            console.log(JSON.stringify(siswaData[0], null, 2));
        } else {
            console.log('❌ No data found after insert');
        }
        
        await connection.end();
        
        console.log('\n✅ Siswa data created successfully!');
        
    } catch (error) {
        console.error('❌ Create failed:', error.message);
    }
}

createSiswaData();
