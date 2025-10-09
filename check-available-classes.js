// Check Available Classes
import mysql from 'mysql2/promise';
import 'dotenv/config';

const checkAvailableClasses = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🏫 Checking available classes...\n');

        // Check kelas table
        const [classes] = await connection.execute(`
            SELECT id_kelas, nama_kelas FROM kelas LIMIT 10
        `);

        console.log('📚 Available classes:');
        classes.forEach((kelas, index) => {
            console.log(`  ${index + 1}. ID: ${kelas.id_kelas}, Nama: ${kelas.nama_kelas}`);
        });

        if (classes.length > 0) {
            const firstClass = classes[0];
            console.log(`\n✅ Using class: ${firstClass.nama_kelas} (ID: ${firstClass.id_kelas})`);
            
            // Test creating student with valid class ID
            console.log('\n🧪 Testing student creation with valid class ID...');
            
            const testData = {
                username: 'teststudent' + Date.now(),
                nis: '1234567890',
                nama: 'Test Student',
                kelas_id: firstClass.id_kelas,
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

            // Clean up
            await connection.execute('DELETE FROM siswa WHERE id_siswa = ?', [nextIdSiswa]);
            await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
            console.log('   Cleaned up test data');
        }

    } catch (error) {
        console.error('❌ Error checking classes:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

checkAvailableClasses();
