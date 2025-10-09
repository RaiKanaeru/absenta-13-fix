// Create Student Directly in Database
import mysql from 'mysql2/promise';
import 'dotenv/config';

const createStudentDirect = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('👨‍🎓 Creating student directly in database...\n');

        const testData = {
            username: 'teststudent' + Date.now(),
            nis: '1234567890',
            nama: 'Test Student',
            kelas_id: 198,
            jabatan: 'Siswa',
            jenis_kelamin: 'L',
            email: 'teststudent@example.com',
            alamat: 'Jl. Test No. 1',
            telepon_orangtua: '08123456789',
            telepon_siswa: '08123456788'
        };

        // First create user
        console.log('   Creating user...');
        const bcrypt = await import('bcrypt');
        const hashedPassword = bcrypt.hashSync('password123', 10);
        const [userResult] = await connection.execute(
            'INSERT INTO users (username, password, role, nama, email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [testData.username, hashedPassword, 'siswa', testData.nama, testData.email, 'aktif']
        );
        
        const userId = userResult.insertId;
        console.log(`   User created with ID: ${userId}`);

        // Get next id_siswa
        const [maxIdResult] = await connection.execute('SELECT MAX(id_siswa) as max_id FROM siswa');
        const nextIdSiswa = (maxIdResult[0].max_id || 0) + 1;
        console.log(`   Next id_siswa: ${nextIdSiswa}`);

        // Create student record
        console.log('   Creating student record...');
        const [siswaResult] = await connection.execute(
            `INSERT INTO siswa 
            (id_siswa, user_id, nama_pengguna, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status, dibuat_pada, diperbarui_pada) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW(), NOW())`,
            [nextIdSiswa, userId, testData.username, testData.nis, testData.nama, testData.kelas_id, testData.jabatan, testData.jenis_kelamin, testData.email, testData.alamat, testData.telepon_orangtua, testData.telepon_siswa]
        );
        
        console.log(`   Student created with ID: ${siswaResult.insertId}`);
        console.log('   ✅ Student created successfully!');

        // Test the update endpoint
        console.log('\n🔄 Testing update endpoint...');
        
        const updateData = {
            nama: testData.nama + ' (Updated)',
            nis: testData.nis,
            username: testData.username,
            kelas_id: testData.kelas_id,
            jabatan: testData.jabatan,
            jenis_kelamin: testData.jenis_kelamin,
            email: testData.email,
            alamat: testData.alamat + ' (Updated)',
            telepon_orangtua: testData.telepon_orangtua,
            telepon_siswa: testData.telepon_siswa,
            status: 'aktif'
        };

        const updateResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${nextIdSiswa}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: JSON.stringify(updateData)
        });

        const updateResult = await updateResponse.json();
        console.log(`   Update response status: ${updateResponse.status}`);
        console.log(`   Update response data:`, JSON.stringify(updateResult, null, 2));

        if (updateResponse.ok && updateResult.success) {
            console.log(`   ✅ Update successful!`);
        } else {
            console.log(`   ❌ Update failed: ${updateResult.error}`);
        }

    } catch (error) {
        console.error('❌ Error creating student:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

const getToken = async () => {
    const loginResponse = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    return loginData.data?.token;
};

createStudentDirect();
