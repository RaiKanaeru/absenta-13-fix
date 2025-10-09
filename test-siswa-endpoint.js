// Test Siswa Endpoint
import 'dotenv/config';
import mysql from 'mysql2/promise';

const testSiswaEndpoint = async () => {
    let connection;
    
    try {
        console.log('🧪 Testing siswa endpoint...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13',
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to database');
        
        // Test the query used in siswa-perwakilan endpoint
        const query = `
            SELECT 
                s.id,
                s.id_siswa,
                s.user_id,
                s.username,
                s.nis,
                s.nama,
                s.kelas_id,
                k.nama_kelas,
                k.tingkat,
                s.jabatan,
                s.jenis_kelamin,
                s.email,
                s.alamat,
                s.telepon_orangtua,
                s.telepon_siswa,
                s.status,
                u.username as account_username,
                u.status as account_status
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status IN ('aktif', 'tidak_aktif')
            ORDER BY s.nama
            LIMIT 5
        `;
        
        const [rows] = await connection.execute(query);
        console.log('📊 Query result:');
        console.log(`Found ${rows.length} students`);
        
        if (rows.length > 0) {
            console.log('Sample student data:');
            console.log(JSON.stringify(rows[0], null, 2));
        }
        
        // Test login
        console.log('\n🔐 Testing login...');
        const [loginRows] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            ['admin']
        );
        
        if (loginRows.length > 0) {
            console.log('✅ Admin user found:', loginRows[0].username, loginRows[0].role);
        } else {
            console.log('❌ Admin user not found');
        }
        
    } catch (error) {
        console.error('❌ Error testing:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
};

testSiswaEndpoint();
