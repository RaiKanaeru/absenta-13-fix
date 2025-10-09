// Script untuk memeriksa dan memperbaiki tabel mapel
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

async function checkMapelTable() {
    let connection;
    
    try {
        console.log('🔍 Checking mapel table...');
        connection = await mysql.createConnection(dbConfig);
        
        // Check if table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mapel'
        `, [dbConfig.database]);
        
        if (tables.length === 0) {
            console.log('❌ Table mapel does not exist. Creating...');
            
            await connection.execute(`
                CREATE TABLE mapel (
                    id_mapel int(11) NOT NULL AUTO_INCREMENT,
                    kode_mapel varchar(20) NOT NULL,
                    nama_mapel varchar(100) NOT NULL,
                    deskripsi text DEFAULT NULL,
                    status enum('aktif','tidak_aktif') NOT NULL DEFAULT 'aktif',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    PRIMARY KEY (id_mapel),
                    UNIQUE KEY kode_mapel (kode_mapel)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            
            console.log('✅ Table mapel created successfully');
        } else {
            console.log('✅ Table mapel exists');
        }
        
        // Check table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'mapel'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.log('📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
        });
        
        // Check if there are any records
        const [records] = await connection.execute('SELECT COUNT(*) as count FROM mapel');
        console.log(`📊 Total records in mapel table: ${records[0].count}`);
        
        // Test insert
        console.log('🧪 Testing insert...');
        const [insertResult] = await connection.execute(`
            INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi, status) 
            VALUES (?, ?, ?, ?)
        `, ['TEST', 'Test Subject', 'Test description', 'aktif']);
        
        console.log('✅ Test insert successful, ID:', insertResult.insertId);
        
        // Clean up test record
        await connection.execute('DELETE FROM mapel WHERE id_mapel = ?', [insertResult.insertId]);
        console.log('🧹 Test record cleaned up');
        
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

checkMapelTable();

