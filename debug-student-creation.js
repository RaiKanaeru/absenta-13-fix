// Debug Student Creation
import mysql from 'mysql2/promise';
import 'dotenv/config';

const debugStudentCreation = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Debugging student creation...\n');

        // Check siswa table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
            AND TABLE_NAME = 'siswa'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Siswa table columns:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''} ${col.EXTRA || ''}`);
        });

        // Check sample data
        const [sampleData] = await connection.execute(`
            SELECT * FROM siswa LIMIT 3
        `);

        console.log('\n📊 Sample siswa data:');
        sampleData.forEach((row, index) => {
            console.log(`  Row ${index + 1}:`, row);
        });

        // Test the exact insert query
        console.log('\n🧪 Testing insert query...');
        
        const testData = {
            username: 'teststudent',
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
            (id_siswa, user_id, username, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status, dibuat_pada, diperbarui_pada) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW(), NOW())`,
            [nextIdSiswa, userId, testData.username, testData.nis, testData.nama, testData.kelas_id, testData.jabatan, testData.jenis_kelamin, testData.email, testData.alamat, testData.telepon_orangtua, testData.telepon_siswa]
        );
        
        console.log(`   Student created with ID: ${siswaResult.insertId}`);
        console.log('   ✅ Test successful!');

        // Clean up
        await connection.execute('DELETE FROM siswa WHERE id_siswa = ?', [nextIdSiswa]);
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log('   Cleaned up test data');

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

debugStudentCreation();
