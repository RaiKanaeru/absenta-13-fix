const mysql = require('mysql2/promise');

async function migrate() {
    let connection;
    
    try {
        console.log('🔄 Starting migration...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Create jadwal_guru table
        console.log('📝 Creating jadwal_guru table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS jadwal_guru (
                id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                jadwal_id int(11) NOT NULL,
                guru_id int(11) NOT NULL,
                status enum('aktif','tidak_aktif') DEFAULT 'aktif',
                dibuat_pada timestamp NULL DEFAULT current_timestamp(),
                diperbarui_pada timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                UNIQUE KEY unique_jadwal_guru (jadwal_id, guru_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ jadwal_guru table created');
        
        // Migrate existing data
        console.log('📝 Migrating existing data...');
        await connection.execute(`
            INSERT IGNORE INTO jadwal_guru (jadwal_id, guru_id, status, dibuat_pada, diperbarui_pada)
            SELECT j.id_jadwal, j.guru_id, 'aktif', j.dibuat_pada, j.dibuat_pada
            FROM jadwal j
            WHERE j.status = 'aktif'
        `);
        console.log('✅ Data migrated');
        
        // Verify
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        console.log('📊 Records:', count[0].count);
        
        console.log('🎉 Migration completed!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
