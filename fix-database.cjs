const mysql = require('mysql2/promise');

async function fixDatabase() {
    let connection;
    
    try {
        console.log('🔄 Fixing database schema...');
        
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // Check if jadwal_guru exists
        const [tables] = await connection.execute('SHOW TABLES LIKE "jadwal_guru"');
        
        if (tables.length === 0) {
            console.log('📝 Creating jadwal_guru table...');
            await connection.execute(`
                CREATE TABLE jadwal_guru (
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
                INSERT IGNORE INTO jadwal_guru (jadwal_id, guru_id, status)
                SELECT id_jadwal, guru_id, 'aktif'
                FROM jadwal
                WHERE status = 'aktif'
            `);
            console.log('✅ Data migrated');
        } else {
            console.log('✅ jadwal_guru table already exists');
        }
        
        // Check if absensi_guru_jadwal exists
        const [absensiTables] = await connection.execute('SHOW TABLES LIKE "absensi_guru_jadwal"');
        
        if (absensiTables.length === 0) {
            console.log('📝 Creating absensi_guru_jadwal table...');
            await connection.execute(`
                CREATE TABLE absensi_guru_jadwal (
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
        } else {
            console.log('✅ absensi_guru_jadwal table already exists');
        }
        
        // Check if absensi_guru_mapping exists
        const [mappingTables] = await connection.execute('SHOW TABLES LIKE "absensi_guru_mapping"');
        
        if (mappingTables.length === 0) {
            console.log('📝 Creating absensi_guru_mapping table...');
            await connection.execute(`
                CREATE TABLE absensi_guru_mapping (
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
        } else {
            console.log('✅ absensi_guru_mapping table already exists');
        }
        
        // Verify tables
        const [jadwalGuruCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        console.log('📊 Records in jadwal_guru:', jadwalGuruCount[0].count);
        
        console.log('🎉 Database schema fixed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDatabase();
