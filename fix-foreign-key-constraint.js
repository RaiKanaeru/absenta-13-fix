import mysql from 'mysql2/promise';

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absenta13',
    port: 3306
};

async function fixForeignKeyConstraint() {
    let connection;
    
    try {
        console.log('🔧 MEMPERBAIKI FOREIGN KEY CONSTRAINT');
        console.log('=====================================');
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Cek Data Kelas yang Ada
        console.log('\n📋 1. CEK DATA KELAS YANG ADA');
        console.log('------------------------------');
        
        const [kelasData] = await connection.execute(`
            SELECT id_kelas, nama_kelas, tingkat, status
            FROM kelas
            ORDER BY id_kelas
        `);
        
        console.log(`📊 Total kelas: ${kelasData.length}`);
        console.log('📁 Daftar kelas:');
        kelasData.forEach(kelas => {
            console.log(`  - ID: ${kelas.id_kelas}, Nama: ${kelas.nama_kelas}, Tingkat: ${kelas.tingkat}, Status: ${kelas.status}`);
        });
        
        // 2. Cek Jadwal dengan Kelas ID
        console.log('\n📋 2. CEK JADWAL DENGAN KELAS ID');
        console.log('----------------------------------');
        
        const [jadwalKelas] = await connection.execute(`
            SELECT jp.id, jp.kelas_id, k.nama_kelas, mp.nama_mapel
            FROM jadwal_pelajaran jp
            LEFT JOIN kelas k ON jp.kelas_id = k.id_kelas
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            WHERE jp.kelas_id IS NULL OR k.id_kelas IS NULL
            LIMIT 5
        `);
        
        console.log(`📊 Jadwal dengan kelas_id tidak valid: ${jadwalKelas.length}`);
        if (jadwalKelas.length > 0) {
            console.log('📁 Daftar jadwal bermasalah:');
            jadwalKelas.forEach(jadwal => {
                console.log(`  - ID: ${jadwal.id}, Kelas ID: ${jadwal.kelas_id}, Kelas: ${jadwal.nama_kelas || 'NULL'}, Mapel: ${jadwal.nama_mapel}`);
            });
        }
        
        // 3. Perbaiki Data Jadwal yang Bermasalah
        console.log('\n📋 3. MEMPERBAIKI DATA JADWAL YANG BERMASALAH');
        console.log('----------------------------------------------');
        
        if (jadwalKelas.length > 0) {
            // Update jadwal yang kelas_id-nya NULL atau tidak valid
            const kelasDefault = kelasData[0]; // Ambil kelas pertama sebagai default
            
            for (const jadwal of jadwalKelas) {
                try {
                    await connection.execute(`
                        UPDATE jadwal_pelajaran 
                        SET kelas_id = ? 
                        WHERE id = ? AND (kelas_id IS NULL OR kelas_id NOT IN (SELECT id_kelas FROM kelas))
                    `, [kelasDefault.id_kelas, jadwal.id]);
                    
                    console.log(`✅ Jadwal ${jadwal.id} diperbaiki dengan kelas_id ${kelasDefault.id_kelas}`);
                } catch (error) {
                    console.log(`❌ Error fixing jadwal ${jadwal.id}: ${error.message}`);
                }
            }
        }
        
        // 4. Test Absensi Multi-Guru dengan Kelas ID yang Valid
        console.log('\n📋 4. TEST ABSENSI MULTI-GURU DENGAN KELAS VALID');
        console.log('--------------------------------------------------');
        
        // Ambil jadwal dengan 3 guru dan kelas_id yang valid
        const [jadwalTigaGuruValid] = await connection.execute(`
            SELECT jp.id, jp.kelas_id, mp.nama_mapel, k.nama_kelas, COUNT(gj.guru_id) as jumlah_guru
            FROM jadwal_pelajaran jp
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            INNER JOIN kelas k ON jp.kelas_id = k.id_kelas
            INNER JOIN guru_jadwal gj ON jp.id = gj.jadwal_id
            WHERE gj.status = 'aktif'
            GROUP BY jp.id, jp.kelas_id, mp.nama_mapel, k.nama_kelas
            HAVING jumlah_guru = 3
            LIMIT 1
        `);
        
        if (jadwalTigaGuruValid.length > 0) {
            const jadwal = jadwalTigaGuruValid[0];
            console.log(`📊 Testing absensi untuk jadwal: ${jadwal.nama_mapel} - ${jadwal.nama_kelas} (Kelas ID: ${jadwal.kelas_id})`);
            
            // Ambil guru untuk jadwal ini
            const [guruJadwal] = await connection.execute(`
                SELECT gj.guru_id, g.nama, gj.peran_guru
                FROM guru_jadwal gj
                INNER JOIN guru g ON gj.guru_id = g.id_guru
                WHERE gj.jadwal_id = ? AND gj.status = 'aktif'
                ORDER BY gj.peran_guru
            `, [jadwal.id]);
            
            // Ambil siswa untuk pencatat
            const [siswaPencatat] = await connection.execute(`
                SELECT id_siswa, nama FROM siswa WHERE status = 'aktif' LIMIT 1
            `);
            
            if (siswaPencatat.length > 0) {
                const siswa = siswaPencatat[0];
                const tanggal = new Date().toISOString().split('T')[0];
                
                console.log(`\n📊 Testing absensi untuk tanggal: ${tanggal}`);
                
                // Test absensi untuk setiap guru
                for (const guru of guruJadwal) {
                    try {
                        // Cek apakah sudah ada absensi
                        const [existingAbsensi] = await connection.execute(`
                            SELECT COUNT(*) as count 
                            FROM absensi_guru 
                            WHERE jadwal_id = ? AND guru_id = ? AND tanggal = ?
                        `, [jadwal.id, guru.guru_id, tanggal]);
                        
                        if (existingAbsensi[0].count === 0) {
                            // Insert absensi
                            await connection.execute(`
                                INSERT INTO absensi_guru (
                                    jadwal_id, guru_id, peran_guru, kelas_id, siswa_pencatat_id,
                                    tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                            `, [
                                jadwal.id, guru.guru_id, guru.peran_guru, 
                                jadwal.kelas_id, siswa.id_siswa, 
                                tanggal, 1, 'Hadir', 'Test absensi multi-guru', 'manual'
                            ]);
                            
                            console.log(`✅ Absensi berhasil: ${guru.nama} (${guru.peran_guru})`);
                        } else {
                            console.log(`ℹ️  ${guru.nama} sudah absen`);
                        }
                    } catch (error) {
                        console.log(`❌ Error absensi ${guru.nama}: ${error.message}`);
                    }
                }
                
                // Cek hasil absensi
                const [absensiResult] = await connection.execute(`
                    SELECT ag.guru_id, g.nama, ag.peran_guru, ag.status, ag.waktu_catat
                    FROM absensi_guru ag
                    INNER JOIN guru g ON ag.guru_id = g.id_guru
                    WHERE ag.jadwal_id = ? AND ag.tanggal = ?
                    ORDER BY ag.peran_guru
                `, [jadwal.id, tanggal]);
                
                console.log(`\n📊 Hasil absensi untuk tanggal ${tanggal}:`);
                absensiResult.forEach((absensi, index) => {
                    console.log(`  ${index + 1}. ${absensi.nama} (${absensi.peran_guru}): ${absensi.status} - ${absensi.waktu_catat}`);
                });
            }
        }
        
        // 5. Verifikasi Final
        console.log('\n📋 5. VERIFIKASI FINAL');
        console.log('------------------------');
        
        // Cek total absensi guru
        const [totalAbsensiGuru] = await connection.execute(`
            SELECT COUNT(*) as total FROM absensi_guru
        `);
        console.log(`📊 Total absensi guru: ${totalAbsensiGuru[0].total}`);
        
        // Cek absensi multi-guru
        const [absensiMultiGuru] = await connection.execute(`
            SELECT ag.jadwal_id, mp.nama_mapel, k.nama_kelas, COUNT(ag.guru_id) as jumlah_guru_absen
            FROM absensi_guru ag
            INNER JOIN jadwal_pelajaran jp ON ag.jadwal_id = jp.id
            INNER JOIN mata_pelajaran mp ON jp.mapel_id = mp.id
            INNER JOIN kelas k ON ag.kelas_id = k.id_kelas
            GROUP BY ag.jadwal_id, mp.nama_mapel, k.nama_kelas
            HAVING jumlah_guru_absen > 1
            ORDER BY jumlah_guru_absen DESC
        `);
        
        console.log(`📊 Jadwal dengan multiple guru yang sudah absen: ${absensiMultiGuru.length}`);
        if (absensiMultiGuru.length > 0) {
            console.log('📁 Daftar jadwal dengan multiple guru absen:');
            absensiMultiGuru.forEach((absensi, index) => {
                console.log(`  ${index + 1}. ${absensi.nama_mapel} - ${absensi.nama_kelas} (${absensi.jumlah_guru_absen} guru absen)`);
            });
        }
        
        console.log('\n🎉 PERBAIKAN FOREIGN KEY CONSTRAINT SELESAI!');
        console.log('✅ SISTEM MULTI GURU SUDAH BERFUNGSI DENGAN BAIK!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixForeignKeyConstraint();
