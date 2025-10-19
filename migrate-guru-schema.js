const mysql = require('mysql2/promise');

async function migrateGuruSchema() {
    let connection;
    
    try {
        console.log('🔄 Starting guru schema migration...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Add password if needed
            database: 'absenta13'
        });
        
        console.log('✅ Connected to database');
        
        // 1. Create jadwal_guru table
        console.log('📝 Creating jadwal_guru table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`jadwal_guru\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              \`jadwal_id\` int(11) NOT NULL,
              \`guru_id\` int(11) NOT NULL,
              \`status\` enum('aktif','tidak_aktif') DEFAULT 'aktif',
              \`dibuat_pada\` timestamp NULL DEFAULT current_timestamp(),
              \`diperbarui_pada\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              
              FOREIGN KEY (\`jadwal_id\`) REFERENCES \`jadwal\`(\`id_jadwal\`) ON DELETE CASCADE,
              FOREIGN KEY (\`guru_id\`) REFERENCES \`guru\`(\`id_guru\`) ON DELETE CASCADE,
              UNIQUE KEY \`unique_jadwal_guru\` (\`jadwal_id\`, \`guru_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ jadwal_guru table created');
        
        // 2. Create absensi_guru_jadwal table
        console.log('📝 Creating absensi_guru_jadwal table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`absensi_guru_jadwal\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              \`jadwal_id\` int(11) NOT NULL,
              \`guru_pencatat_id\` int(11) NOT NULL COMMENT 'Guru yang melakukan pencatatan absensi',
              \`tanggal\` date NOT NULL,
              \`jam_ke\` int(11) NOT NULL,
              \`status\` enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
              \`keterangan\` text DEFAULT NULL,
              \`waktu_catat\` timestamp NOT NULL DEFAULT current_timestamp(),
              \`metode_absen\` enum('manual','scan','otomatis') DEFAULT 'manual',
              \`siswa_pencatat_id\` int(11) DEFAULT NULL COMMENT 'Siswa yang mencatat (jika dari siswa)',
              
              FOREIGN KEY (\`jadwal_id\`) REFERENCES \`jadwal\`(\`id_jadwal\`) ON DELETE CASCADE,
              FOREIGN KEY (\`guru_pencatat_id\`) REFERENCES \`guru\`(\`id_guru\`) ON DELETE CASCADE,
              FOREIGN KEY (\`siswa_pencatat_id\`) REFERENCES \`siswa\`(\`id_siswa\`) ON DELETE SET NULL,
              UNIQUE KEY \`unique_jadwal_tanggal\` (\`jadwal_id\`, \`tanggal\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ absensi_guru_jadwal table created');
        
        // 3. Create absensi_guru_mapping table
        console.log('📝 Creating absensi_guru_mapping table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`absensi_guru_mapping\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              \`absensi_guru_jadwal_id\` int(11) NOT NULL,
              \`guru_id\` int(11) NOT NULL,
              \`status\` enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
              \`keterangan\` text DEFAULT NULL,
              \`dibuat_pada\` timestamp NULL DEFAULT current_timestamp(),
              
              FOREIGN KEY (\`absensi_guru_jadwal_id\`) REFERENCES \`absensi_guru_jadwal\`(\`id\`) ON DELETE CASCADE,
              FOREIGN KEY (\`guru_id\`) REFERENCES \`guru\`(\`id_guru\`) ON DELETE CASCADE,
              UNIQUE KEY \`unique_absensi_guru\` (\`absensi_guru_jadwal_id\`, \`guru_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ absensi_guru_mapping table created');
        
        // 4. Migrate existing data
        console.log('📝 Migrating existing data...');
        await connection.execute(`
            INSERT IGNORE INTO jadwal_guru (jadwal_id, guru_id, status, dibuat_pada, diperbarui_pada)
            SELECT j.id_jadwal, j.guru_id, 'aktif', j.dibuat_pada, j.dibuat_pada
            FROM jadwal j
            WHERE j.status = 'aktif'
        `);
        console.log('✅ Existing data migrated');
        
        // 5. Create indexes
        console.log('📝 Creating indexes...');
        await connection.execute('CREATE INDEX IF NOT EXISTS `idx_jadwal_guru_jadwal_id` ON `jadwal_guru`(`jadwal_id`)');
        await connection.execute('CREATE INDEX IF NOT EXISTS `idx_jadwal_guru_guru_id` ON `jadwal_guru`(`guru_id`)');
        await connection.execute('CREATE INDEX IF NOT EXISTS `idx_absensi_guru_jadwal_tanggal` ON `absensi_guru_jadwal`(`tanggal`)');
        await connection.execute('CREATE INDEX IF NOT EXISTS `idx_absensi_guru_jadwal_jadwal_id` ON `absensi_guru_jadwal`(`jadwal_id`)');
        await connection.execute('CREATE INDEX IF NOT EXISTS `idx_absensi_guru_mapping_absensi_id` ON `absensi_guru_mapping`(`absensi_guru_jadwal_id`)');
        console.log('✅ Indexes created');
        
        // 6. Create views
        console.log('📝 Creating views...');
        await connection.execute(`
            CREATE OR REPLACE VIEW \`v_jadwal_guru_lengkap\` AS
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                j.mapel_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status as jadwal_status,
                k.nama_kelas,
                m.nama_mapel,
                GROUP_CONCAT(DISTINCT g.nama ORDER BY g.nama SEPARATOR ', ') as nama_guru_semua,
                GROUP_CONCAT(DISTINCT g.id_guru ORDER BY g.id_guru SEPARATOR ',') as guru_ids,
                COUNT(DISTINCT jg.guru_id) as jumlah_guru
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
            JOIN guru g ON jg.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            GROUP BY j.id_jadwal
        `);
        console.log('✅ Views created');
        
        // 7. Verify migration
        console.log('🔍 Verifying migration...');
        const [jadwalGuruCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal_guru');
        const [jadwalCount] = await connection.execute('SELECT COUNT(*) as count FROM jadwal WHERE status = "aktif"');
        
        console.log('📊 Migration Results:');
        console.log(`   - jadwal_guru: ${jadwalGuruCount[0].count} records`);
        console.log(`   - jadwal: ${jadwalCount[0].count} records`);
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

migrateGuruSchema();