// ===============================================
// UPDATE APPLICATION CODE FOR NEW GURU SCHEMA
// ===============================================

// 1. UPDATE NORMALIZE GURU DATA HELPER
function normalizeGuruData(requestBody) {
    const { guru_ids, guru_id } = requestBody;
    
    // Normalize guru IDs array
    let normalizedGuruIds = [];
    
    if (guru_ids && Array.isArray(guru_ids) && guru_ids.length > 0) {
        normalizedGuruIds = guru_ids.map(id => {
            const parsed = parseInt(id);
            if (isNaN(parsed) || parsed <= 0) {
                throw new Error(`Invalid guru_id: ${id}`);
            }
            return parsed;
        });
    } else if (guru_id) {
        const parsed = parseInt(guru_id);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error(`Invalid guru_id: ${guru_id}`);
        }
        normalizedGuruIds = [parsed];
    } else {
        throw new Error('guru_ids atau guru_id harus diisi');
    }
    
    return {
        guru_ids: normalizedGuruIds,
        primary_guru_id: normalizedGuruIds[0] // Untuk backward compatibility
    };
}

// 2. UPDATE CREATE JADWAL ENDPOINT
async function createJadwal(req, res) {
    try {
        const { kelas_id, mapel_id, guru_ids, hari, jam_ke, jam_mulai, jam_selesai, ruang_id } = req.body;
        
        // Normalize guru data
        const normalizedGuru = normalizeGuruData(req.body);
        const guruIds = normalizedGuru.guru_ids;
        const primaryGuruId = normalizedGuru.primary_guru_id;
        
        // Insert jadwal dengan primary guru (untuk backward compatibility)
        const [result] = await db.execute(
            `INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
            [kelas_id, mapel_id, primaryGuruId, ruang_id || null, hari, jam_ke, jam_mulai, jam_selesai]
        );
        
        const jadwalId = result.insertId;
        
        // Insert semua guru ke jadwal_guru
        for (const guruId of guruIds) {
            await db.execute(
                'INSERT INTO jadwal_guru (jadwal_id, guru_id, status) VALUES (?, ?, ?)',
                [jadwalId, guruId, 'aktif']
            );
        }
        
        console.log('✅ Jadwal created with multiple teachers:', guruIds);
        res.json({ 
            message: 'Jadwal berhasil ditambahkan',
            id: jadwalId,
            guru_ids: guruIds
        });
    } catch (error) {
        console.error('❌ Error creating jadwal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 3. UPDATE GET JADWAL ENDPOINT
async function getJadwal(req, res) {
    try {
        const query = `
            SELECT 
                j.id_jadwal as id,
                j.kelas_id,
                j.mapel_id,
                j.guru_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                m.nama_mapel,
                v.nama_guru_semua,
                v.guru_ids,
                v.jumlah_guru
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN v_jadwal_guru_lengkap v ON j.id_jadwal = v.id_jadwal
            WHERE j.status = 'aktif'
            ORDER BY 
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'),
                j.jam_ke, 
                k.nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        
        // Process results untuk backward compatibility
        for (const schedule of rows) {
            schedule.nama_guru = schedule.nama_guru_semua; // Backward compatibility
            schedule.guru_list = schedule.guru_ids.split(',').map(id => ({
                id_guru: parseInt(id),
                nama: schedule.nama_guru_semua.split(', ')[schedule.guru_ids.split(',').indexOf(id)]
            }));
        }
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error getting jadwal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 4. UPDATE SUBMIT ATTENDANCE ENDPOINT
async function submitAttendance(req, res) {
    try {
        const { jadwal_id, tanggal, status, keterangan, guru_ids } = req.body;
        const guruPencatatId = req.user.id_guru; // Guru yang melakukan pencatatan
        
        // Cek apakah jadwal ada dan guru termasuk dalam jadwal
        const [jadwalData] = await db.execute(
            `SELECT j.*, jg.guru_id as guru_jadwal_id
             FROM jadwal j
             JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id
             WHERE j.id_jadwal = ? AND jg.guru_id = ? AND jg.status = 'aktif'`,
            [jadwal_id, guruPencatatId]
        );
        
        if (jadwalData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan atau Anda tidak termasuk dalam jadwal ini' });
        }
        
        // Insert absensi guru jadwal
        const [result] = await db.execute(
            `INSERT INTO absensi_guru_jadwal (jadwal_id, guru_pencatat_id, tanggal, jam_ke, status, keterangan, metode_absen)
             VALUES (?, ?, ?, ?, ?, ?, 'manual')`,
            [jadwal_id, guruPencatatId, tanggal, jadwalData[0].jam_ke, status, keterangan]
        );
        
        const absensiId = result.insertId;
        
        // Insert mapping untuk semua guru
        const allGuruIds = guru_ids || [guruPencatatId];
        for (const guruId of allGuruIds) {
            await db.execute(
                'INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan) VALUES (?, ?, ?, ?)',
                [absensiId, guruId, status, keterangan]
            );
        }
        
        console.log('✅ Attendance submitted for all teachers:', allGuruIds);
        res.json({ 
            message: 'Absensi berhasil disimpan untuk semua guru',
            absensi_id: absensiId,
            guru_ids: allGuruIds
        });
    } catch (error) {
        console.error('❌ Error submitting attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 5. UPDATE GET ATTENDANCE HISTORY
async function getAttendanceHistory(req, res) {
    try {
        const { jadwal_id, tanggal_mulai, tanggal_selesai } = req.query;
        
        let query = `
            SELECT 
                agj.*,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                k.nama_kelas,
                m.nama_mapel,
                gp.nama as nama_guru_pencatat,
                v.nama_guru_semua,
                v.jumlah_guru_tercatat
            FROM absensi_guru_jadwal agj
            JOIN jadwal j ON agj.jadwal_id = j.id_jadwal
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN guru gp ON agj.guru_pencatat_id = gp.id_guru
            JOIN v_absensi_guru_lengkap v ON agj.id = v.id
            WHERE 1=1
        `;
        
        let params = [];
        
        if (jadwal_id) {
            query += ' AND agj.jadwal_id = ?';
            params.push(jadwal_id);
        }
        
        if (tanggal_mulai && tanggal_selesai) {
            query += ' AND agj.tanggal BETWEEN ? AND ?';
            params.push(tanggal_mulai, tanggal_selesai);
        }
        
        query += ' ORDER BY agj.tanggal DESC, j.jam_ke ASC';
        
        const [rows] = await db.execute(query, params);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error getting attendance history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 6. UPDATE GET JADWAL FOR TEACHER
async function getJadwalForTeacher(req, res) {
    try {
        const guruId = req.user.id_guru;
        
        const query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                j.mapel_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                m.nama_mapel,
                v.nama_guru_semua,
                v.guru_ids,
                v.jumlah_guru
            FROM jadwal j
            JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN v_jadwal_guru_lengkap v ON j.id_jadwal = v.id_jadwal
            WHERE jg.guru_id = ? AND jg.status = 'aktif' AND j.status = 'aktif'
            ORDER BY 
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'),
                j.jam_ke
        `;
        
        const [rows] = await db.execute(query, [guruId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error getting jadwal for teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 7. UPDATE STUDENT SUBMIT TEACHER ATTENDANCE
async function submitTeacherAttendance(req, res) {
    try {
        const { siswa_id, kehadiran_data, tanggal_absen } = req.body;
        
        // Process each jadwal
        for (const [jadwalId, data] of Object.entries(kehadiran_data)) {
            const { status, keterangan } = data;
            
            // Get jadwal info
            const [jadwalData] = await db.execute(
                'SELECT kelas_id, jam_ke FROM jadwal WHERE id_jadwal = ?',
                [jadwalId]
            );
            
            if (jadwalData.length === 0) {
                continue; // Skip invalid jadwal
            }
            
            const tanggal = tanggal_absen || new Date().toISOString().split('T')[0];
            
            // Insert absensi guru jadwal
            const [result] = await db.execute(
                `INSERT INTO absensi_guru_jadwal (jadwal_id, guru_pencatat_id, tanggal, jam_ke, status, keterangan, siswa_pencatat_id, metode_absen)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
                [jadwalId, null, tanggal, jadwalData[0].jam_ke, status, keterangan, siswa_id]
            );
            
            const absensiId = result.insertId;
            
            // Get all teachers for this jadwal
            const [guruData] = await db.execute(
                'SELECT guru_id FROM jadwal_guru WHERE jadwal_id = ? AND status = "aktif"',
                [jadwalId]
            );
            
            // Insert mapping untuk semua guru
            for (const guru of guruData) {
                await db.execute(
                    'INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan) VALUES (?, ?, ?, ?)',
                    [absensiId, guru.guru_id, status, keterangan]
                );
            }
        }
        
        console.log('✅ Teacher attendance submitted by student');
        res.json({ 
            message: 'Kehadiran guru berhasil disimpan',
            data: kehadiran_data
        });
    } catch (error) {
        console.error('❌ Error submitting teacher attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// 8. EXPORT FUNCTIONS
module.exports = {
    normalizeGuruData,
    createJadwal,
    getJadwal,
    submitAttendance,
    getAttendanceHistory,
    getJadwalForTeacher,
    submitTeacherAttendance
};
