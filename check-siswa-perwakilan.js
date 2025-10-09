// Script untuk memeriksa dan memperbaiki tabel siswa_perwakilan
import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'absenta13',
    charset: 'utf8mb4',
    port: 3306
};

async function checkSiswaPerwakilan() {
    let connection;
    
    try {
        console.log('🔍 Checking siswa_perwakilan table...');
        connection = await mysql.createConnection(dbConfig);
        
        // Check if table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'siswa_perwakilan'
        `, [dbConfig.database]);
        
        if (tables.length === 0) {
            console.log('❌ Table siswa_perwakilan does not exist. Creating...');
            
            await connection.execute(`
                CREATE TABLE siswa_perwakilan (
                    id int(11) NOT NULL AUTO_INCREMENT,
                    id_siswa int(11) NOT NULL,
                    user_id int(11) NOT NULL,
                    username varchar(50) NOT NULL,
                    nis varchar(30) NOT NULL,
                    nama varchar(100) NOT NULL,
                    kelas_id int(11) NOT NULL,
                    jabatan varchar(50) DEFAULT 'Sekretaris Kelas',
                    jenis_kelamin enum('L','P') DEFAULT NULL,
                    email varchar(100) DEFAULT NULL,
                    alamat text DEFAULT NULL,
                    telepon_orangtua varchar(20) DEFAULT NULL,
                    telepon_siswa varchar(20) DEFAULT NULL,
                    status enum('aktif','tidak_aktif','lulus','pindah','alumni','keluar') NOT NULL DEFAULT 'aktif',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    PRIMARY KEY (id),
                    UNIQUE KEY nis (nis),
                    UNIQUE KEY username (username),
                    KEY user_id (user_id),
                    KEY kelas_id (kelas_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            
            console.log('✅ Table siswa_perwakilan created successfully');
        } else {
            console.log('✅ Table siswa_perwakilan exists');
        }
        
        // Check table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'siswa_perwakilan'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.log('📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
        });
        
        // Check if there are any records
        const [records] = await connection.execute('SELECT COUNT(*) as count FROM siswa_perwakilan');
        console.log(`📊 Total records in siswa_perwakilan table: ${records[0].count}`);
        
        // Check if there are any classes
        const [classes] = await connection.execute('SELECT COUNT(*) as count FROM kelas');
        console.log(`📊 Total records in kelas table: ${classes[0].count}`);
        
        // Check if there are any users with role 'siswa'
        const [users] = await connection.execute("SELECT COUNT(*) as count FROM pengguna WHERE peran = 'siswa'");
        console.log(`📊 Total users with role 'siswa': ${users[0].count}`);
        
        // If no records, create some sample data
        if (records[0].count === 0) {
            console.log('📝 No records found. Creating sample data...');
            
            // Get first class
            const [firstClass] = await connection.execute('SELECT id_kelas, nama_kelas FROM kelas LIMIT 1');
            if (firstClass.length > 0) {
                const kelasId = firstClass[0].id_kelas;
                const namaKelas = firstClass[0].nama_kelas;
                
                console.log(`📝 Creating sample student for class: ${namaKelas}`);
                
                // Create sample user
                const [userResult] = await connection.execute(`
                    INSERT INTO pengguna (nama_pengguna, kata_sandi, peran, nama, email, status, dibuat_pada, diperbarui_pada) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, ['siswa1', '$2b$10$example', 'siswa', 'Siswa Perwakilan 1', 'siswa1@smkn13bandung.sch.id', 'aktif']);
                
                const userId = userResult.insertId;
                
                // Create sample representative student
                const [studentResult] = await connection.execute(`
                    INSERT INTO siswa_perwakilan (id_siswa, user_id, username, nis, nama, kelas_id, jabatan, jenis_kelamin, email, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [userId, userId, 'siswa1', '12345678', 'Siswa Perwakilan 1', kelasId, 'Ketua Kelas', 'L', 'siswa1@smkn13bandung.sch.id', 'aktif']);
                
                console.log('✅ Sample data created successfully');
            } else {
                console.log('❌ No classes found. Please create classes first.');
            }
        }
        
        // Test query
        console.log('🧪 Testing query...');
        const [testRows] = await connection.execute(`
            SELECT 
                s.id,
                s.id_siswa,
                s.user_id,
                s.username,
                s.nis,
                s.nama,
                s.kelas_id,
                s.jabatan,
                s.jenis_kelamin,
                s.email,
                s.alamat,
                s.telepon_orangtua,
                s.telepon_siswa,
                s.status,
                k.nama_kelas,
                k.tingkat
            FROM siswa_perwakilan s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            ORDER BY k.tingkat, k.nama_kelas, s.jabatan, s.nama
        `);
        
        console.log(`✅ Test query successful: ${testRows.length} records found`);
        if (testRows.length > 0) {
            console.log('📊 Sample record:', testRows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkSiswaPerwakilan();
