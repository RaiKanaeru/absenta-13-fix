const mysql = require('mysql2/promise');

async function fixDatabaseSchema() {
    console.log('🔄 Fixing database schema...');
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        console.log('✅ Connected to database');

        // 1. Buat tabel jadwal_guru
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS jadwal_guru (
                id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                jadwal_id INT(11) NOT NULL,
                guru_id INT(11) NOT NULL,
                status ENUM('aktif','tidak_aktif') DEFAULT 'aktif',
                dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                diperbarui_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id_jadwal) ON DELETE CASCADE,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                UNIQUE KEY unique_jadwal_guru (jadwal_id, guru_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('📝 jadwal_guru table created');

        // 2. Migrate existing data from jadwal to jadwal_guru
        await connection.execute(`
            INSERT IGNORE INTO jadwal_guru (jadwal_id, guru_id, status)
            SELECT j.id_jadwal, j.guru_id, 'aktif'
            FROM jadwal j
            WHERE j.status = 'aktif';
        `);
        console.log('📝 Migrating existing data...');

        // 3. Buat tabel absensi_guru_jadwal (jika belum ada)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS absensi_guru_jadwal (
                id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                jadwal_id INT(11) NOT NULL,
                guru_pencatat_id INT(11) NOT NULL COMMENT 'ID guru yang mencatat absensi',
                tanggal DATE NOT NULL,
                jam_ke INT(11) NOT NULL,
                status ENUM('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
                keterangan TEXT DEFAULT NULL,
                siswa_pencatat_id INT(11) DEFAULT NULL,
                waktu_catat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
                metode_absen ENUM('manual','scan','otomatis') DEFAULT 'manual',
                FOREIGN KEY (jadwal_id) REFERENCES jadwal(id_jadwal),
                FOREIGN KEY (guru_pencatat_id) REFERENCES guru(id_guru),
                FOREIGN KEY (siswa_pencatat_id) REFERENCES siswa(id_siswa),
                UNIQUE KEY unique_jadwal_tanggal (jadwal_id, tanggal)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('📝 absensi_guru_jadwal table created');

        // 4. Buat tabel absensi_guru_mapping (jika belum ada)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS absensi_guru_mapping (
                id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                absensi_guru_jadwal_id INT(11) NOT NULL,
                guru_id INT(11) NOT NULL,
                status ENUM('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
                keterangan TEXT DEFAULT NULL,
                FOREIGN KEY (absensi_guru_jadwal_id) REFERENCES absensi_guru_jadwal(id) ON DELETE CASCADE,
                FOREIGN KEY (guru_id) REFERENCES guru(id_guru),
                UNIQUE KEY unique_absensi_guru_mapping (absensi_guru_jadwal_id, guru_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('📝 absensi_guru_mapping table created');

        // 5. Perbaiki foreign key constraint di absensi_guru
        await connection.execute(`
            ALTER TABLE absensi_guru MODIFY COLUMN siswa_pencatat_id INT(11) NULL;
        `);
        console.log('📝 Fixed foreign key constraint in absensi_guru');

        // 6. Cek hasil
        const [jadwalGuruCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        console.log('📊 Records in jadwal_guru:', jadwalGuruCount[0].count);

        console.log('🎉 Database schema fixed successfully!');

    } catch (error) {
        console.error('❌ Database schema fix failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDatabaseSchema();
