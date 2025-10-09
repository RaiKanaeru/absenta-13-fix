import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function fixMultiTeacherAttendanceLogic() {
    let connection;
    
    try {
        console.log('🔧 MEMPERBAIKI LOGIC ABSENSI MULTI GURU (3 GURU MENGAJAR BERSAMA)');
        console.log('================================================================');
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Hapus Kolom yang Tidak Diperlukan
        console.log('\n📋 1. MENGHAPUS KOLOM YANG TIDAK DIPERLUKAN');
        console.log('---------------------------------------------');
        
        // Hapus kolom is_perwakilan dan guru_perwakilan_id
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                DROP COLUMN IF EXISTS is_perwakilan
            `);
            console.log('✅ Kolom is_perwakilan dihapus dari absensi_guru');
        } catch (error) {
            console.log(`⚠️  Error dropping is_perwakilan: ${error.message}`);
        }
        
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                DROP COLUMN IF EXISTS guru_perwakilan_id
            `);
            console.log('✅ Kolom guru_perwakilan_id dihapus dari absensi_guru');
        } catch (error) {
            console.log(`⚠️  Error dropping guru_perwakilan_id: ${error.message}`);
        }
        
        // 2. Hapus Table yang Tidak Diperlukan
        console.log('\n📋 2. MENGHAPUS TABLE YANG TIDAK DIPERLUKAN');
        console.log('-------------------------------------------');
        
        try {
            await connection.execute(`DROP TABLE IF EXISTS guru_perwakilan_log`);
            console.log('✅ Table guru_perwakilan_log dihapus');
        } catch (error) {
            console.log(`⚠️  Error dropping guru_perwakilan_log: ${error.message}`);
        }
        
        // 3. Update Constraint untuk Multi-Guru
        console.log('\n📋 3. UPDATE CONSTRAINT UNTUK MULTI-GURU');
        console.log('----------------------------------------');
        
        // Hapus constraint lama
        try {
            const [oldConstraints] = await connection.execute(`
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'absensi_guru' 
                AND CONSTRAINT_NAME LIKE '%unique%'
            `, [dbConfig.database]);
            
            for (const constraint of oldConstraints) {
                try {
                    await connection.execute(`
                        ALTER TABLE absensi_guru DROP INDEX \`${constraint.CONSTRAINT_NAME}\`
                    `);
                } catch (error) {
                    console.log(`⚠️  Error dropping constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`⚠️  Error checking old constraints: ${error.message}`);
        }
        
        // Buat constraint baru yang memungkinkan multiple guru per jadwal per hari
        try {
            await connection.execute(`
                ALTER TABLE absensi_guru 
                ADD CONSTRAINT unique_absensi_guru_guru_harian 
                UNIQUE (guru_id, jadwal_id, tanggal)
            `);
            console.log('✅ Constraint unique_absensi_guru_guru_harian berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating unique constraint: ${error.message}`);
        }
        
        // 4. Update View untuk Multi-Guru
        console.log('\n📋 4. UPDATE VIEW UNTUK MULTI-GURU');
        console.log('-----------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE VIEW v_absensi_guru_multi AS
                SELECT 
                    ag.id_absensi,
                    ag.jadwal_id,
                    ag.guru_id,
                    ag.peran_guru,
                    ag.kelas_id,
                    ag.siswa_pencatat_id,
                    ag.tanggal,
                    ag.jam_ke,
                    ag.status,
                    ag.keterangan,
                    ag.waktu_catat,
                    ag.waktu_scan,
                    ag.metode_absen,
                    ag.jam_terlambat,
                    ag.alasan_terlambat,
                    -- Data guru yang absen
                    g.nama as nama_guru,
                    g.nip as nip_guru,
                    g.mata_pelajaran as mata_pelajaran_guru,
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
                    -- Info peran guru
                    CASE 
                        WHEN ag.peran_guru = 'guru_utama' THEN 'Guru Utama'
                        WHEN ag.peran_guru = 'guru_pendamping_1' THEN 'Guru Pendamping 1'
                        WHEN ag.peran_guru = 'guru_pendamping_2' THEN 'Guru Pendamping 2'
                        ELSE 'Guru'
                    END as peran_guru_text
                FROM absensi_guru ag
                INNER JOIN guru g ON ag.guru_id = g.id_guru
                INNER JOIN jadwal_pelajaran jp ON ag.jadwal_id = jp.id
                INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
                INNER JOIN kelas k ON ag.kelas_id = k.id_kelas
                INNER JOIN siswa s ON ag.siswa_pencatat_id = s.id_siswa
                ORDER BY ag.tanggal DESC, ag.jadwal_id, ag.peran_guru
            `);
            console.log('✅ View v_absensi_guru_multi berhasil diperbarui');
        } catch (error) {
            console.log(`⚠️  Error updating view v_absensi_guru_multi: ${error.message}`);
        }
        
        // 5. Buat View untuk Jadwal Multi-Guru
        console.log('\n📋 5. MEMBUAT VIEW UNTUK JADWAL MULTI-GURU');
        console.log('--------------------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE VIEW v_jadwal_multi_guru AS
                SELECT 
                    jp.id as jadwal_id,
                    jp.hari,
                    jp.jam_mulai,
                    jp.jam_selesai,
                    jp.jam_ke,
                    jp.kelas_id,
                    jp.mapel_id,
                    mp.nama_mapel,
                    k.nama_kelas,
                    k.tingkat,
                    -- Data guru utama
                    g_utama.id_guru as guru_utama_id,
                    g_utama.nama as nama_guru_utama,
                    g_utama.nip as nip_guru_utama,
                    -- Data guru pendamping 1
                    g_pendamping1.id_guru as guru_pendamping1_id,
                    g_pendamping1.nama as nama_guru_pendamping1,
                    g_pendamping1.nip as nip_guru_pendamping1,
                    -- Data guru pendamping 2
                    g_pendamping2.id_guru as guru_pendamping2_id,
                    g_pendamping2.nama as nama_guru_pendamping2,
                    g_pendamping2.nip as nip_guru_pendamping2,
                    -- Status
                    jp.status as status_jadwal,
                    -- Count guru
                    COUNT(gj.guru_id) as total_guru,
                    -- Info multi-guru
                    CASE 
                        WHEN COUNT(gj.guru_id) = 1 THEN 'Single Teacher'
                        WHEN COUNT(gj.guru_id) = 2 THEN 'Dual Teacher'
                        WHEN COUNT(gj.guru_id) = 3 THEN 'Triple Teacher'
                        ELSE 'Multi Teacher'
                    END as tipe_pengajaran
                FROM jadwal_pelajaran jp
                INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
                INNER JOIN kelas k ON jp.kelas_id = k.id_kelas
                LEFT JOIN guru_jadwal gj_utama ON jp.id = gj_utama.jadwal_id AND gj_utama.peran_guru = 'guru_utama' AND gj_utama.status = 'aktif'
                LEFT JOIN guru g_utama ON gj_utama.guru_id = g_utama.id_guru
                LEFT JOIN guru_jadwal gj_pendamping1 ON jp.id = gj_pendamping1.jadwal_id AND gj_pendamping1.peran_guru = 'guru_pendamping_1' AND gj_pendamping1.status = 'aktif'
                LEFT JOIN guru g_pendamping1 ON gj_pendamping1.guru_id = g_pendamping1.id_guru
                LEFT JOIN guru_jadwal gj_pendamping2 ON jp.id = gj_pendamping2.jadwal_id AND gj_pendamping2.peran_guru = 'guru_pendamping_2' AND gj_pendamping2.status = 'aktif'
                LEFT JOIN guru g_pendamping2 ON gj_pendamping2.guru_id = g_pendamping2.id_guru
                LEFT JOIN guru_jadwal gj ON jp.id = gj.jadwal_id AND gj.status = 'aktif'
                WHERE jp.status = 'aktif'
                GROUP BY jp.id, jp.hari, jp.jam_mulai, jp.jam_selesai, jp.jam_ke, jp.kelas_id, jp.mapel_id, mp.nama_mapel, k.nama_kelas, k.tingkat, g_utama.id_guru, g_utama.nama, g_utama.nip, g_pendamping1.id_guru, g_pendamping1.nama, g_pendamping1.nip, g_pendamping2.id_guru, g_pendamping2.nama, g_pendamping2.nip, jp.status
                ORDER BY jp.hari, jp.jam_mulai, jp.id
            `);
            console.log('✅ View v_jadwal_multi_guru berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating view v_jadwal_multi_guru: ${error.message}`);
        }
        
        // 6. Buat Stored Procedure untuk Absensi Multi-Guru
        console.log('\n📋 6. MEMBUAT STORED PROCEDURE UNTUK ABSENSI MULTI-GURU');
        console.log('----------------------------------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE PROCEDURE sp_absen_multi_guru(
                    IN p_jadwal_id INT,
                    IN p_guru_id INT,
                    IN p_kelas_id INT,
                    IN p_siswa_pencatat_id INT,
                    IN p_tanggal DATE,
                    IN p_jam_ke INT,
                    IN p_status ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit'),
                    IN p_keterangan TEXT,
                    IN p_metode_absen ENUM('manual', 'qr_code', 'fingerprint', 'rfid') DEFAULT 'manual'
                )
                BEGIN
                    DECLARE v_peran_guru ENUM('guru_utama', 'guru_pendamping_1', 'guru_pendamping_2');
                    DECLARE EXIT HANDLER FOR SQLEXCEPTION
                    BEGIN
                        ROLLBACK;
                        RESIGNAL;
                    END;
                    
                    START TRANSACTION;
                    
                    -- Cek apakah guru terdaftar dalam jadwal ini
                    SELECT peran_guru INTO v_peran_guru
                    FROM guru_jadwal 
                    WHERE jadwal_id = p_jadwal_id 
                    AND guru_id = p_guru_id 
                    AND status = 'aktif';
                    
                    IF v_peran_guru IS NULL THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guru tidak terdaftar dalam jadwal ini';
                    END IF;
                    
                    -- Cek apakah guru sudah absen untuk jadwal ini di tanggal ini
                    IF EXISTS (
                        SELECT 1 FROM absensi_guru 
                        WHERE jadwal_id = p_jadwal_id 
                        AND tanggal = p_tanggal 
                        AND guru_id = p_guru_id
                    ) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guru sudah melakukan absensi untuk jadwal ini di tanggal ini';
                    END IF;
                    
                    -- Insert absensi guru
                    INSERT INTO absensi_guru (
                        jadwal_id, guru_id, peran_guru, kelas_id, siswa_pencatat_id, 
                        tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen
                    ) VALUES (
                        p_jadwal_id, p_guru_id, v_peran_guru, p_kelas_id, p_siswa_pencatat_id,
                        p_tanggal, p_jam_ke, p_status, p_keterangan, NOW(), p_metode_absen
                    );
                    
                    COMMIT;
                END
            `);
            console.log('✅ Stored procedure sp_absen_multi_guru berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating stored procedure: ${error.message}`);
        }
        
        // 7. Buat Function untuk Cek Status Absensi Multi-Guru
        console.log('\n📋 7. MEMBUAT FUNCTION UNTUK CEK STATUS ABSENSI');
        console.log('--------------------------------------------------');
        
        try {
            await connection.execute(`
                CREATE OR REPLACE FUNCTION fn_get_absensi_status_multi_guru(
                    p_jadwal_id INT,
                    p_tanggal DATE
                ) RETURNS JSON
                READS SQL DATA
                DETERMINISTIC
                BEGIN
                    DECLARE result JSON;
                    
                    SELECT JSON_OBJECT(
                        'jadwal_id', p_jadwal_id,
                        'tanggal', p_tanggal,
                        'total_guru_terdaftar', (
                            SELECT COUNT(*) 
                            FROM guru_jadwal 
                            WHERE jadwal_id = p_jadwal_id AND status = 'aktif'
                        ),
                        'total_guru_absen', (
                            SELECT COUNT(*) 
                            FROM absensi_guru 
                            WHERE jadwal_id = p_jadwal_id AND tanggal = p_tanggal
                        ),
                        'guru_absen', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'guru_id', ag.guru_id,
                                    'nama_guru', g.nama,
                                    'peran_guru', ag.peran_guru,
                                    'status', ag.status,
                                    'waktu_absen', ag.waktu_catat
                                )
                            )
                            FROM absensi_guru ag
                            INNER JOIN guru g ON ag.guru_id = g.id_guru
                            WHERE ag.jadwal_id = p_jadwal_id AND ag.tanggal = p_tanggal
                        ),
                        'guru_belum_absen', (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'guru_id', gj.guru_id,
                                    'nama_guru', g.nama,
                                    'peran_guru', gj.peran_guru
                                )
                            )
                            FROM guru_jadwal gj
                            INNER JOIN guru g ON gj.guru_id = g.id_guru
                            WHERE gj.jadwal_id = p_jadwal_id 
                            AND gj.status = 'aktif'
                            AND NOT EXISTS (
                                SELECT 1 FROM absensi_guru ag
                                WHERE ag.jadwal_id = p_jadwal_id
                                AND ag.tanggal = p_tanggal
                                AND ag.guru_id = gj.guru_id
                            )
                        )
                    ) INTO result;
                    
                    RETURN result;
                END
            `);
            console.log('✅ Function fn_get_absensi_status_multi_guru berhasil dibuat');
        } catch (error) {
            console.log(`⚠️  Error creating function: ${error.message}`);
        }
        
        // 8. Tambahkan Data Multi-Guru untuk Pelajaran Produktif
        console.log('\n📋 8. MENAMBAHKAN DATA MULTI-GURU UNTUK PELAJARAN PRODUKTIF');
        console.log('-------------------------------------------------------------');
        
        // Cek jadwal yang sudah ada
        const [existingJadwal] = await connection.execute(`
            SELECT jp.id, mp.nama_mapel, k.nama_kelas, COUNT(gj.guru_id) as jumlah_guru
            FROM jadwal_pelajaran jp
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            INNER JOIN kelas k ON jp.kelas_id = k.id_kelas
            LEFT JOIN guru_jadwal gj ON jp.id = gj.jadwal_id AND gj.status = 'aktif'
            GROUP BY jp.id, mp.nama_mapel, k.nama_kelas
            HAVING jumlah_guru = 1
            ORDER BY jp.id
            LIMIT 10
        `);
        
        console.log(`📊 Ditemukan ${existingJadwal.length} jadwal dengan 1 guru untuk ditambahkan guru pendamping`);
        
        // Ambil guru yang tersedia
        const [availableGuru] = await connection.execute(`
            SELECT id_guru, nama FROM guru WHERE status = 'aktif' ORDER BY nama
        `);
        
        let addedCount = 0;
        for (let i = 0; i < Math.min(existingJadwal.length, 5); i++) {
            const jadwal = existingJadwal[i];
            
            try {
                // Pilih 2 guru pendamping
                const guruPendamping = availableGuru.filter(guru => 
                    guru.id_guru !== jadwal.guru_id
                ).slice(i * 2, (i * 2) + 2);
                
                if (guruPendamping.length >= 1) {
                    // Tambahkan guru pendamping 1
                    await connection.execute(`
                        INSERT INTO guru_jadwal (guru_id, jadwal_id, peran_guru, status, dibuat_pada)
                        VALUES (?, ?, 'guru_pendamping_1', 'aktif', NOW())
                        ON DUPLICATE KEY UPDATE status = 'aktif'
                    `, [guruPendamping[0].id_guru, jadwal.id]);
                    
                    console.log(`✅ Guru pendamping 1: ${guruPendamping[0].nama} untuk ${jadwal.nama_mapel}`);
                    addedCount++;
                }
                
                if (guruPendamping.length >= 2) {
                    // Tambahkan guru pendamping 2
                    await connection.execute(`
                        INSERT INTO guru_jadwal (guru_id, jadwal_id, peran_guru, status, dibuat_pada)
                        VALUES (?, ?, 'guru_pendamping_2', 'aktif', NOW())
                        ON DUPLICATE KEY UPDATE status = 'aktif'
                    `, [guruPendamping[1].id_guru, jadwal.id]);
                    
                    console.log(`✅ Guru pendamping 2: ${guruPendamping[1].nama} untuk ${jadwal.nama_mapel}`);
                    addedCount++;
                }
                
            } catch (error) {
                console.log(`❌ Error adding pendamping for ${jadwal.nama_mapel}: ${error.message}`);
            }
        }
        
        console.log(`\n📊 Total guru pendamping yang ditambahkan: ${addedCount}`);
        
        // 9. Verifikasi Hasil
        console.log('\n📋 9. VERIFIKASI HASIL');
        console.log('------------------------');
        
        // Cek distribusi peran guru
        const [peranGuruStats] = await connection.execute(`
            SELECT peran_guru, COUNT(*) as total
            FROM guru_jadwal
            WHERE status = 'aktif'
            GROUP BY peran_guru
            ORDER BY peran_guru
        `);
        
        console.log('📊 Distribusi peran guru:');
        peranGuruStats.forEach(stat => {
            console.log(`  - ${stat.peran_guru}: ${stat.total}`);
        });
        
        // Cek jadwal dengan multiple guru
        const [multiGuruJadwal] = await connection.execute(`
            SELECT jp.id, mp.nama_mapel, k.nama_kelas, COUNT(gj.guru_id) as jumlah_guru
            FROM jadwal_pelajaran jp
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            INNER JOIN kelas k ON jp.kelas_id = k.id_kelas
            INNER JOIN guru_jadwal gj ON jp.id = gj.jadwal_id
            WHERE gj.status = 'aktif'
            GROUP BY jp.id, mp.nama_mapel, k.nama_kelas
            HAVING jumlah_guru > 1
            ORDER BY jumlah_guru DESC
        `);
        
        console.log(`\n📊 Jadwal dengan multiple guru: ${multiGuruJadwal.length}`);
        if (multiGuruJadwal.length > 0) {
            console.log('📁 Daftar jadwal dengan multiple guru:');
            multiGuruJadwal.slice(0, 5).forEach((jadwal, index) => {
                console.log(`  ${index + 1}. ${jadwal.nama_mapel} - ${jadwal.nama_kelas} (${jadwal.jumlah_guru} guru)`);
            });
        }
        
        // Cek view
        const [viewData] = await connection.execute(`
            SELECT COUNT(*) as total FROM v_jadwal_multi_guru
        `);
        console.log(`📊 Data di view v_jadwal_multi_guru: ${viewData[0].total} records`);
        
        console.log('\n🎉 PERBAIKAN LOGIC ABSENSI MULTI GURU SELESAI!');
        console.log('✅ SISTEM SUDAH MENDUKUNG 3 GURU MENGAJAR BERSAMA DALAM 1 PELAJARAN!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixMultiTeacherAttendanceLogic();
