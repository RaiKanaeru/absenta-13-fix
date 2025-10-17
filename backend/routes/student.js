// Student routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiting.js';
import { db } from '../db.js';

const router = express.Router();

// Apply authentication and rate limiting to all student routes
router.use(authenticateToken);
router.use(requireRole(['siswa', 'admin']));
router.use(apiLimiter);

// Student info endpoint
router.get('/info', async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, k.nama_kelas, p.nama_pengguna, p.email as user_email
      FROM siswa s 
      LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
      LEFT JOIN pengguna p ON s.id_pengguna = p.id
      WHERE s.id_pengguna = ? AND s.status = "aktif"
    `, [req.user.id]);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: students[0],
      message: 'Student info retrieved successfully'
    });
  } catch (error) {
    console.error('Student info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Student schedule endpoint
router.get('/jadwal', async (req, res) => {
  try {
    const [schedules] = await db.execute(`
      SELECT j.*, k.nama_kelas, m.nama_mapel, m.kode_mapel, g.nama as nama_guru
      FROM jadwal j
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      WHERE j.kelas_id = ? AND j.status = "aktif"
      ORDER BY j.hari, j.jam_ke
    `, [req.user.kelas_id]);

    res.json({
      success: true,
      data: schedules,
      message: 'Student schedule retrieved successfully'
    });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Student attendance records
router.get('/absen', async (req, res) => {
  try {
    const { tanggal } = req.query;

    let query = `
      SELECT a.*, j.hari, j.jam_ke, m.nama_mapel, k.nama_kelas, g.nama as nama_guru
      FROM absensi_siswa a
      LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      WHERE a.siswa_id = ?
    `;

    const params = [req.user.siswa_id];

    if (tanggal) {
      query += ' AND a.tanggal = ?';
      params.push(tanggal);
    }

    query += ' ORDER BY a.tanggal DESC, j.hari, j.jam_ke';

    const [attendance] = await db.execute(query, params);

    res.json({
      success: true,
      data: attendance,
      message: 'Student attendance retrieved successfully'
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Permission requests
router.get('/pengajuan-izin-kelas', async (req, res) => {
  try {
    const [permissions] = await db.execute(`
      SELECT p.*, j.hari, j.jam_ke, m.nama_mapel, k.nama_kelas, g.nama as nama_guru
      FROM pengajuan_izin_siswa p
      LEFT JOIN jadwal j ON p.jadwal_id = j.id_jadwal
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      WHERE p.siswa_id = ?
      ORDER BY p.tanggal_izin DESC
    `, [req.user.siswa_id]);

    res.json({
      success: true,
      data: permissions,
      message: 'Permission requests retrieved successfully'
    });
  } catch (error) {
    console.error('Get permission requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/pengajuan-izin-kelas', async (req, res) => {
  try {
    const { jadwal_id, tanggal_izin, alasan } = req.body;

    await db.execute(
      'INSERT INTO pengajuan_izin_siswa (siswa_id, jadwal_id, tanggal_izin, alasan, status) VALUES (?, ?, ?, ?, "pending")',
      [req.user.siswa_id, jadwal_id, tanggal_izin, alasan]
    );

    res.json({
      success: true,
      message: 'Permission request submitted successfully'
    });
  } catch (error) {
    console.error('Submit permission request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Attendance disputes
router.get('/pengajuan-banding-kelas', async (req, res) => {
  try {
    const [disputes] = await db.execute(`
      SELECT b.*, j.hari, j.jam_ke, m.nama_mapel, k.nama_kelas, g.nama as nama_guru
      FROM pengajuan_banding_absen b
      LEFT JOIN jadwal j ON b.jadwal_id = j.id_jadwal
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      WHERE b.siswa_id = ?
      ORDER BY b.tanggal_absen DESC
    `, [req.user.siswa_id]);

    res.json({
      success: true,
      data: disputes,
      message: 'Attendance disputes retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance disputes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/pengajuan-banding-kelas', async (req, res) => {
  try {
    const { jadwal_id, tanggal_absen, alasan_banding } = req.body;

    await db.execute(
      'INSERT INTO pengajuan_banding_absen (siswa_id, jadwal_id, tanggal_absen, alasan_banding, status) VALUES (?, ?, ?, ?, "pending")',
      [req.user.siswa_id, jadwal_id, tanggal_absen, alasan_banding]
    );

    res.json({
      success: true,
      message: 'Attendance dispute submitted successfully'
    });
  } catch (error) {
    console.error('Submit attendance dispute error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
