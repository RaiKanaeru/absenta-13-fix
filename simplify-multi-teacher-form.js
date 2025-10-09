import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function simplifyMultiTeacherForm() {
    let connection;
    
    try {
        console.log('🔧 MENYEDERHANAKAN FORM MULTI GURU (3 GURU DALAM 1 FORM)');
        console.log('=======================================================');
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Hapus Table yang Tidak Diperlukan
        console.log('\n📋 1. MENGHAPUS TABLE YANG TIDAK DIPERLUKAN');
        console.log('-------------------------------------------');
        
        try {
            await connection.execute(`DROP TABLE IF EXISTS guru_jadwal`);
            console.log('✅ Table guru_jadwal dihapus');
        } catch (error) {
            console.log(`⚠️  Error dropping guru_jadwal: ${error.message}`);
        }
        
        // 2. Modifikasi Table Absensi Guru untuk Multi-Guru
        console.log('\n📋 2. MODIFIKASI TABLE ABSENSI GURU');
        console.log('------------------------------------');
        
        // Tambahkan kolom untuk guru 2 dan guru 3
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN guru_id_2 INT NULL AFTER guru_id
            `);
            console.log('✅ Kolom guru_id_2 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom guru_id_2 sudah ada');
            } else {
                console.log(`⚠️  Error adding guru_id_2: ${error.message}`);
            }
        }
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN guru_id_3 INT NULL AFTER guru_id_2
            `);
            console.log('✅ Kolom guru_id_3 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom guru_id_3 sudah ada');
            } else {
                console.log(`⚠️  Error adding guru_id_3: ${error.message}`);
            }
        }
        
        // Tambahkan kolom status untuk guru 2 dan guru 3
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN status_guru_2 ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit') NULL AFTER status
            `);
            console.log('✅ Kolom status_guru_2 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom status_guru_2 sudah ada');
            } else {
                console.log(`⚠️  Error adding status_guru_2: ${error.message}`);
            }
        }
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN status_guru_3 ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit') NULL AFTER status_guru_2
            `);
            console.log('✅ Kolom status_guru_3 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom status_guru_3 sudah ada');
            } else {
                console.log(`⚠️  Error adding status_guru_3: ${error.message}`);
            }
        }
        
        // Tambahkan kolom keterangan untuk guru 2 dan guru 3
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN keterangan_guru_2 TEXT NULL AFTER keterangan
            `);
            console.log('✅ Kolom keterangan_guru_2 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom keterangan_guru_2 sudah ada');
            } else {
                console.log(`⚠️  Error adding keterangan_guru_2: ${error.message}`);
            }
        }
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD COLUMN keterangan_guru_3 TEXT NULL AFTER keterangan_guru_2
            `);
            console.log('✅ Kolom keterangan_guru_3 ditambahkan');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Kolom keterangan_guru_3 sudah ada');
            } else {
                console.log(`⚠️  Error adding keterangan_guru_3: ${error.message}`);
            }
        }
        
        // 3. Hapus Kolom yang Tidak Diperlukan
        console.log('\n📋 3. MENGHAPUS KOLOM YANG TIDAK DIPERLUKAN');
        console.log('---------------------------------------------');
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                DROP COLUMN IF EXISTS peran_guru
            `);
            console.log('✅ Kolom peran_guru dihapus');
        } catch (error) {
            console.log(`⚠️  Error dropping peran_guru: ${error.message}`);
        }
        
        // 4. Update Foreign Key Constraints
        console.log('\n📋 4. UPDATE FOREIGN KEY CONSTRAINTS');
        console.log('-------------------------------------');
        
        // Hapus constraint lama
        try {
            const [oldConstraints] = await connection.execute(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'absensi_guru' 
                AND CONSTRAINT_NAME LIKE '%guru%'
            `, [dbConfig.database]);
            
            for (const constraint of oldConstraints) {
                try {
                    await connection.execute(`
                        ALTER TABLE absensi_guru DROP FOREIGN KEY \`${constraint.CONSTRAINT_NAME}\`
                    `);
                } catch (error) {
                    console.log(`⚠️  Error dropping constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`⚠️  Error checking old constraints: ${error.message}`);
        }
        
        // Tambahkan foreign key untuk guru_id_2 dan guru_id_3
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD CONSTRAINT fk_absensi_guru_2 
                FOREIGN KEY (guru_id_2) REFERENCES guru(id_guru) 
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('✅ Foreign key untuk guru_id_2 berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating FK for guru_id_2: ${error.message}`);
        }
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD CONSTRAINT fk_absensi_guru_3 
                FOREIGN KEY (guru_id_3) REFERENCES guru(id_guru) 
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('✅ Foreign key untuk guru_id_3 berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating FK for guru_id_3: ${error.message}`);
        }
        
        // 5. Update Constraint Unique
        console.log('\n📋 5. UPDATE CONSTRAINT UNIQUE');
        console.log('-------------------------------');
        
        // Hapus constraint lama
        try {
            const [oldUniqueConstraints] = await connection.execute(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'absensi_guru' 
                AND CONSTRAINT_NAME LIKE '%unique%'
            `, [dbConfig.database]);
            
            for (const constraint of oldUniqueConstraints) {
                try {
                    await connection.execute(`
                        ALTER TABLE absensi_guru DROP INDEX \`${constraint.CONSTRAINT_NAME}\`
                    `);
                } catch (error) {
                    console.log(`⚠️  Error dropping unique constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`⚠️  Error checking old unique constraints: ${error.message}`);
        }
        
        // Buat constraint baru
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD CONSTRAINT unique_absensi_jadwal_tanggal 
                UNIQUE (jadwal_id, tanggal)
            `);
            console.log('✅ Constraint unique_absensi_jadwal_tanggal berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating unique constraint: ${error.message}`);
        }
        
        // 6. Buat View untuk Form Multi-Guru
        console.log('\n📋 6. MEMBUAT VIEW UNTUK FORM MULTI-GURU');
        console.log('----------------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE VIEW v_absensi_guru_form AS
                SELECT 
                    ag.id_absensi,
                    ag.jadwal_id,
                    ag.tanggal,
                    ag.jam_ke,
                    ag.kelas_id,
                    ag.siswa_pencatat_id,
                    ag.keterangan,
                    ag.waktu_catat,
                    ag.waktu_scan,
                    ag.metode_absen,
                    ag.jam_terlambat,
                    ag.alasan_terlambat,
                    -- Data jadwal
                    jp.hari,
                    jp.jam_mulai,
                    jp.jam_selesai,
                    mp.nama_mapel,
                    k.nama_kelas,
                    k.tingkat,
                    -- Data siswa pencatat
                    s.nama as nama_siswa_pencatat,
                    s.nis as nis_siswa_pencatat,
                    -- Data guru 1
                    ag.guru_id as guru_1_id,
                    g1.nama as nama_guru_1,
                    g1.nip as nip_guru_1,
                    ag.status as status_guru_1,
                    ag.keterangan as keterangan_guru_1,
                    -- Data guru 2
                    ag.guru_id_2 as guru_2_id,
                    g2.nama as nama_guru_2,
                    g2.nip as nip_guru_2,
                    ag.status_guru_2,
                    ag.keterangan_guru_2,
                    -- Data guru 3
                    ag.guru_id_3 as guru_3_id,
                    g3.nama as nama_guru_3,
                    g3.nip as nip_guru_3,
                    ag.status_guru_3,
                    ag.keterangan_guru_3,
                    -- Info jumlah guru
                    CASE 
                        WHEN ag.guru_id_3 IS NOT NULL THEN 3
                        WHEN ag.guru_id_2 IS NOT NULL THEN 2
                        WHEN ag.guru_id IS NOT NULL THEN 1
                        ELSE 0
                    END as jumlah_guru
                FROM absensi_guru ag
                INNER JOIN jadwal_pelajaran jp ON ag.jadwal_id = jp.id
                INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
                INNER JOIN kelas k ON ag.kelas_id = k.id_kelas
                INNER JOIN siswa s ON ag.siswa_pencatat_id = s.id_siswa
                LEFT JOIN guru g1 ON ag.guru_id = g1.id_guru
                LEFT JOIN guru g2 ON ag.guru_id_2 = g2.id_guru
                LEFT JOIN guru g3 ON ag.guru_id_3 = g3.id_guru
                ORDER BY ag.tanggal DESC, ag.jadwal_id
            `);
            console.log('✅ View v_absensi_guru_form berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating view v_absensi_guru_form: ${error.message}`);
        }
        
        // 7. Buat Stored Procedure untuk Absensi Multi-Guru
        console.log('\n📋 7. MEMBUAT STORED PROCEDURE UNTUK ABSENSI MULTI-GURU');
        console.log('----------------------------------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE PROCEDURE sp_absen_multi_guru_form(
                    IN p_jadwal_id INT,
                    IN p_guru_1_id INT,
                    IN p_guru_2_id INT,
                    IN p_guru_3_id INT,
                    IN p_kelas_id INT,
                    IN p_siswa_pencatat_id INT,
                    IN p_tanggal DATE,
                    IN p_jam_ke INT,
                    IN p_status_guru_1 ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit'),
                    IN p_status_guru_2 ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit'),
                    IN p_status_guru_3 ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit'),
                    IN p_keterangan_guru_1 TEXT,
                    IN p_keterangan_guru_2 TEXT,
                    IN p_keterangan_guru_3 TEXT,
                    IN p_keterangan TEXT,
                    IN p_metode_absen ENUM('manual', 'qr_code', 'fingerprint', 'rfid')
                )
                BEGIN
                    DECLARE EXIT HANDLER FOR SQLEXCEPTION
                    BEGIN
                        ROLLBACK;
                        RESIGNAL;
                    END;
                    
                    START TRANSACTION;
                    
                    -- Cek apakah sudah ada absensi untuk jadwal ini di tanggal ini
                    IF EXISTS (
                        SELECT 1 FROM absensi_guru 
                        WHERE jadwal_id = p_jadwal_id AND tanggal = p_tanggal
                    ) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sudah ada absensi untuk jadwal ini di tanggal ini';
                    END IF;
                    
                    -- Insert absensi multi-guru
                    INSERT INTO absensi_guru (
                        jadwal_id, guru_id, guru_id_2, guru_id_3,
                        kelas_id, siswa_pencatat_id, tanggal, jam_ke,
                        status, status_guru_2, status_guru_3,
                        keterangan, keterangan_guru_2, keterangan_guru_3,
                        waktu_catat, metode_absen
                    ) VALUES (
                        p_jadwal_id, p_guru_1_id, p_guru_2_id, p_guru_3_id,
                        p_kelas_id, p_siswa_pencatat_id, p_tanggal, p_jam_ke,
                        p_status_guru_1, p_status_guru_2, p_status_guru_3,
                        p_keterangan_guru_1, p_keterangan_guru_2, p_keterangan_guru_3,
                        NOW(), p_metode_absen
                    );
                    
                    COMMIT;
                END
            `);
            console.log('✅ Stored procedure sp_absen_multi_guru_form berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating stored procedure: ${error.message}`);
        }
        
        // 8. Test Form Multi-Guru
        console.log('\n📋 8. TEST FORM MULTI-GURU');
        console.log('----------------------------');
        
        // Ambil jadwal untuk testing
        const [jadwalTest] = await connection.execute(`
            SELECT jp.id, jp.kelas_id, mp.nama_mapel, k.nama_kelas
            FROM jadwal_pelajaran jp
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            INNER JOIN kelas k ON jp.kelas_id = k.id_kelas
            WHERE jp.status = 'aktif'
            LIMIT 1
        `);
        
        if (jadwalTest.length > 0) {
            const jadwal = jadwalTest[0];
            
            // Ambil 3 guru untuk testing
            const [guruTest] = await connection.execute(`
                SELECT id_guru, nama FROM guru WHERE status = 'aktif' LIMIT 3
            `);
            
            // Ambil siswa untuk pencatat
            const [siswaTest] = await connection.execute(`
                SELECT id_siswa, nama FROM siswa WHERE status = 'aktif' LIMIT 1
            `);
            
            if (guruTest.length >= 3 && siswaTest.length > 0) {
                const tanggal = new Date().toISOString().split('T')[0];
                
                try {
                    // Test insert absensi multi-guru
                    await connection.execute(`
                        INSERT INTO absensi_guru (
                            jadwal_id, guru_id, guru_id_2, guru_id_3,
                            kelas_id, siswa_pencatat_id, tanggal, jam_ke,
                            status, status_guru_2, status_guru_3,
                            keterangan, keterangan_guru_2, keterangan_guru_3,
                            waktu_catat, metode_absen
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                    `, [
                        jadwal.id, guruTest[0].id_guru, guruTest[1].id_guru, guruTest[2].id_guru,
                        jadwal.kelas_id, siswaTest[0].id_siswa, tanggal, 1,
                        'Hadir', 'Hadir', 'Izin',
                        'Guru 1 hadir', 'Guru 2 hadir', 'Guru 3 izin',
                        'manual'
                    ]);
                    
                    console.log('✅ Test absensi multi-guru berhasil');
                    
                    // Cek hasil
                    const [hasilTest] = await connection.execute(`
                        SELECT 
                            nama_guru_1, status_guru_1, keterangan_guru_1,
                            nama_guru_2, status_guru_2, keterangan_guru_2,
                            nama_guru_3, status_guru_3, keterangan_guru_3,
                            jumlah_guru
                        FROM v_absensi_guru_form
                        WHERE jadwal_id = ? AND tanggal = ?
                    `, [jadwal.id, tanggal]);
                    
                    if (hasilTest.length > 0) {
                        const hasil = hasilTest[0];
                        console.log('\n📊 Hasil test form multi-guru:');
                        console.log(`  Guru 1: ${hasil.nama_guru_1} - ${hasil.status_guru_1} (${hasil.keterangan_guru_1})`);
                        console.log(`  Guru 2: ${hasil.nama_guru_2} - ${hasil.status_guru_2} (${hasil.keterangan_guru_2})`);
                        console.log(`  Guru 3: ${hasil.nama_guru_3} - ${hasil.status_guru_3} (${hasil.keterangan_guru_3})`);
                        console.log(`  Total guru: ${hasil.jumlah_guru}`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error testing multi-guru form: ${error.message}`);
                }
            }
        }
        
        // 9. Verifikasi Final
        console.log('\n📋 9. VERIFIKASI FINAL');
        console.log('------------------------');
        
        // Cek struktur table yang sudah diperbarui
        const [updatedStructure] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'absensi_guru'
            AND COLUMN_NAME IN ('guru_id_2', 'guru_id_3', 'status_guru_2', 'status_guru_3', 'keterangan_guru_2', 'keterangan_guru_3')
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.log('📊 Kolom baru di absensi_guru:');
        updatedStructure.forEach(col => {
            const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}${defaultVal}`);
        });
        
        // Cek view
        const [viewData] = await connection.execute(`
            SELECT COUNT(*) as total FROM v_absensi_guru_form
        `);
        console.log(`📊 Data di view v_absensi_guru_form: ${viewData[0].total} records`);
        
        console.log('\n🎉 PENYEDERHANAAN FORM MULTI GURU SELESAI!');
        console.log('✅ SEKARANG 1 FORM BISA MENGISI 3 GURU SEKALIGUS!');
        console.log('✅ TIDAK PERLU TABLE TAMBAHAN, SEMUA DALAM 1 TABLE ABSENSI_GURU!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

simplifyMultiTeacherForm();
