const mysql = require('mysql2/promise');

async function createTables() {
    let connection;
    
    try {
        console.log('🔄 Creating required tables...');
        
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
        
        // Create absensi_guru_jadwal table
        console.log('📝 Creating absensi_guru_jadwal table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS absensi_guru_jadwal (
                id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                jadwal_id int(11) NOT NULL,
                guru_pencatat_id int(11) NOT NULL,
                tanggal date NOT NULL,
                jam_ke int(11) NOT NULL,
                status enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
                keterangan text DEFAULT NULL,
                waktu_catat timestamp NOT NULL DEFAULT current_timestamp(),
                metode_absen enum('manual','scan','otomatis') DEFAULT 'manual',
                siswa_pencatat_id int(11) DEFAULT NULL,
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
                FOREIGN KEY (guru_pencatat_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                FOREIGN KEY (siswa_pencatat_id) REFERENCES siswa(id_siswa) ON DELETE SET NULL,
                UNIQUE KEY unique_jadwal_tanggal (jadwal_id, tanggal)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ absensi_guru_jadwal table created');
        
        // Create absensi_guru_mapping table
        console.log('📝 Creating absensi_guru_mapping table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS absensi_guru_mapping (
                id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                absensi_guru_jadwal_id int(11) NOT NULL,
                guru_id int(11) NOT NULL,
                status enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
                keterangan text DEFAULT NULL,
                dibuat_pada timestamp NULL DEFAULT current_timestamp(),
                FOREIGN KEY (absensi_guru_jadwal_id) REFERENCES absensi_guru_jadwal(id) ON DELETE CASCADE,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                UNIQUE KEY unique_absensi_guru (absensi_guru_jadwal_id, guru_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ absensi_guru_mapping table created');
        
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
        console.log('📊 Records in jadwal_guru:', count[0].count);
        
        console.log('🎉 All tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTables();
