// Restore Database to Previous State
import 'dotenv/config';
import mysql from 'mysql2/promise';

const restoreDatabase = async () => {
    let connection;
    
    try {
        console.log('🔄 Restoring database to previous state...\n');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta13'
        });
        
        console.log('✅ Connected to database\n');
        
        // 1. Restore pengguna table
        console.log('🔄 RESTORING PENGGUNA TABLE:');
        try {
            await connection.execute(`
                CREATE TABLE pengguna (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    nama_pengguna varchar(50) NOT NULL UNIQUE,
                    kata_sandi varchar(255) NOT NULL,
                    peran enum('admin','guru','siswa') NOT NULL,
                    nama varchar(100) DEFAULT NULL,
                    email varchar(100) DEFAULT NULL,
                    status enum('aktif','tidak_aktif','ditangguhkan') NOT NULL DEFAULT 'aktif',
                    dibuat_pada timestamp NULL DEFAULT current_timestamp(),
                    diperbarui_pada timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            console.log('✅ Created pengguna table');
            
            // Migrate data from users to pengguna
            await connection.execute(`
                INSERT INTO pengguna (id, nama_pengguna, kata_sandi, peran, nama, email, status, dibuat_pada, diperbarui_pada)
                SELECT id, username, password, role, nama, email, status, created_at, updated_at
                FROM users
            `);
            console.log('✅ Migrated data from users to pengguna');
            
        } catch (error) {
            console.log(`❌ Error restoring pengguna: ${error.message}`);
        }
        
        // 2. Restore mata_pelajaran table
        console.log('\n🔄 RESTORING MATA_PELAJARAN TABLE:');
        try {
            await connection.execute(`
                CREATE TABLE mata_pelajaran (
                    id_mapel int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    kode_mapel varchar(20) NOT NULL,
                    nama_mapel varchar(100) NOT NULL,
                    deskripsi text,
                    status enum('aktif','tidak_aktif') NOT NULL DEFAULT 'aktif',
                    created_at timestamp NULL DEFAULT current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            console.log('✅ Created mata_pelajaran table');
            
            // Migrate data from mapel to mata_pelajaran
            await connection.execute(`
                INSERT INTO mata_pelajaran (id_mapel, kode_mapel, nama_mapel, deskripsi, status, created_at)
                SELECT id_mapel, kode_mapel, nama_mapel, NULL as deskripsi, status, created_at
                FROM mapel
            `);
            console.log('✅ Migrated data from mapel to mata_pelajaran');
            
        } catch (error) {
            console.log(`❌ Error restoring mata_pelajaran: ${error.message}`);
        }
        
        // 3. Restore jadwal_pelajaran table
        console.log('\n🔄 RESTORING JADWAL_PELAJARAN TABLE:');
        try {
            await connection.execute(`
                CREATE TABLE jadwal_pelajaran (
                    id_jadwal int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    kelas_id int(11) NOT NULL,
                    mapel_id int(11) NOT NULL,
                    guru_id int(11) NOT NULL,
                    ruang_id int(11) DEFAULT NULL,
                    hari enum('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
                    jam_mulai time NOT NULL,
                    jam_selesai time NOT NULL,
                    status enum('aktif','tidak_aktif') DEFAULT 'aktif',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                    FOREIGN KEY (kelas_id) REFERENCES kelas(id_kelas) ON DELETE CASCADE,
                    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id_mapel) ON DELETE CASCADE,
                    FOREIGN KEY (guru_id) REFERENCES guru(id_guru) ON DELETE CASCADE,
                    FOREIGN KEY (ruang_id) REFERENCES ruang_kelas(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            console.log('✅ Created jadwal_pelajaran table');
            
            // Migrate data from jadwal to jadwal_pelajaran
            await connection.execute(`
                INSERT INTO jadwal_pelajaran (id_jadwal, kelas_id, mapel_id, guru_id, ruang_id, hari, jam_mulai, jam_selesai, status, created_at, updated_at)
                SELECT id_jadwal, kelas_id, mapel_id, guru_id, ruang_id, hari, jam_mulai, jam_selesai, status, created_at, updated_at
                FROM jadwal
            `);
            console.log('✅ Migrated data from jadwal to jadwal_pelajaran');
            
        } catch (error) {
            console.log(`❌ Error restoring jadwal_pelajaran: ${error.message}`);
        }
        
        // 4. Restore empty tables
        console.log('\n🔄 RESTORING EMPTY TABLES:');
        
        const emptyTables = [
            {
                name: 'absensi_siswa',
                sql: `CREATE TABLE absensi_siswa (
                    id_absensi int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    siswa_id int(11) NOT NULL,
                    jadwal_id int(11) NOT NULL,
                    tanggal date NOT NULL,
                    status enum('hadir','tidak_hadir','izin','sakit') NOT NULL,
                    keterangan text,
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
                    FOREIGN KEY (jadwal_id) REFERENCES jadwal_pelajaran(id_jadwal) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'banding_absen_detail',
                sql: `CREATE TABLE banding_absen_detail (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    banding_id int(11) NOT NULL,
                    absensi_id int(11) NOT NULL,
                    status_banding enum('diproses','diterima','ditolak') DEFAULT 'diproses',
                    alasan text,
                    created_at timestamp NULL DEFAULT current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'banding_pengajuan_izin',
                sql: `CREATE TABLE banding_pengajuan_izin (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    pengajuan_id int(11) NOT NULL,
                    status_banding enum('diproses','diterima','ditolak') DEFAULT 'diproses',
                    alasan text,
                    created_at timestamp NULL DEFAULT current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'pengajuan_banding_absen',
                sql: `CREATE TABLE pengajuan_banding_absen (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    siswa_id int(11) NOT NULL,
                    absensi_id int(11) NOT NULL,
                    alasan text NOT NULL,
                    status enum('diproses','diterima','ditolak') DEFAULT 'diproses',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'pengajuan_izin',
                sql: `CREATE TABLE pengajuan_izin (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    siswa_id int(11) NOT NULL,
                    tanggal_mulai date NOT NULL,
                    tanggal_selesai date NOT NULL,
                    alasan text NOT NULL,
                    status enum('diproses','diterima','ditolak') DEFAULT 'diproses',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'pengajuan_izin_siswa',
                sql: `CREATE TABLE pengajuan_izin_siswa (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    siswa_id int(11) NOT NULL,
                    jadwal_id int(11) NOT NULL,
                    alasan text NOT NULL,
                    status enum('diproses','diterima','ditolak') DEFAULT 'diproses',
                    created_at timestamp NULL DEFAULT current_timestamp(),
                    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
                    FOREIGN KEY (jadwal_id) REFERENCES jadwal_pelajaran(id_jadwal) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            }
        ];
        
        for (const table of emptyTables) {
            try {
                await connection.execute(table.sql);
                console.log(`✅ Created ${table.name} table`);
            } catch (error) {
                console.log(`❌ Error creating ${table.name}: ${error.message}`);
            }
        }
        
        // 5. Restore unused tables
        console.log('\n🔄 RESTORING UNUSED TABLES:');
        
        const unusedTables = [
            {
                name: 'jam_pelajaran',
                sql: `CREATE TABLE jam_pelajaran (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    jam_ke int(11) NOT NULL,
                    jam_mulai time NOT NULL,
                    jam_selesai time NOT NULL,
                    status enum('aktif','tidak_aktif') DEFAULT 'aktif'
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'kop_laporan',
                sql: `CREATE TABLE kop_laporan (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    nama_sekolah varchar(100) NOT NULL,
                    alamat text,
                    logo_path varchar(255),
                    created_at timestamp NULL DEFAULT current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            },
            {
                name: 'tahun_ajaran',
                sql: `CREATE TABLE tahun_ajaran (
                    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    tahun_ajaran varchar(20) NOT NULL,
                    semester int(11) NOT NULL,
                    status enum('aktif','tidak_aktif') DEFAULT 'aktif',
                    created_at timestamp NULL DEFAULT current_timestamp()
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
            }
        ];
        
        for (const table of unusedTables) {
            try {
                await connection.execute(table.sql);
                console.log(`✅ Created ${table.name} table`);
            } catch (error) {
                console.log(`❌ Error creating ${table.name}: ${error.message}`);
            }
        }
        
        // 6. Add back foreign key references
        console.log('\n🔄 RESTORING FOREIGN KEY REFERENCES:');
        
        try {
            // Add id_pengguna column back to guru
            await connection.execute('ALTER TABLE guru ADD COLUMN id_pengguna int(11) NULL AFTER id_guru');
            await connection.execute('UPDATE guru g JOIN pengguna p ON g.nama = p.nama SET g.id_pengguna = p.id');
            await connection.execute('ALTER TABLE guru ADD CONSTRAINT fk_guru_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE CASCADE');
            console.log('✅ Restored guru.id_pengguna foreign key');
            
            // Add id_pengguna column back to siswa
            await connection.execute('ALTER TABLE siswa ADD COLUMN id_pengguna int(11) NULL AFTER id');
            await connection.execute('UPDATE siswa s JOIN pengguna p ON s.nama = p.nama SET s.id_pengguna = p.id');
            await connection.execute('ALTER TABLE siswa ADD CONSTRAINT fk_siswa_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE CASCADE');
            console.log('✅ Restored siswa.id_pengguna foreign key');
            
        } catch (error) {
            console.log(`❌ Error restoring foreign keys: ${error.message}`);
        }
        
        // 7. Final verification
        console.log('\n📊 FINAL DATABASE STATE:');
        
        const [finalTables] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'absenta13'
            ORDER BY TABLE_NAME
        `);
        
        console.log('Restored tables:');
        finalTables.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} rows`);
        });
        
        console.log(`\n✅ Database restoration complete! ${finalTables.length} tables restored`);
        
    } catch (error) {
        console.error('❌ Error during restoration:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

restoreDatabase();
