// Teacher routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiting.js';
import { db } from '../../db.js';

const router = express.Router();

// Apply authentication and rate limiting to all teacher routes
router.use(authenticateToken);
router.use(requireRole(['guru', 'admin']));
router.use(apiLimiter);

// Teacher info endpoint
router.get('/info', async (req, res) => {
  try {
    const [teachers] = await db.execute(`
      SELECT g.*, m.nama_mapel, p.nama_pengguna, p.email as user_email
      FROM guru g 
      LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
      LEFT JOIN pengguna p ON g.id_pengguna = p.id
      WHERE g.id_pengguna = ? AND g.status = "aktif"
    `, [req.user.id]);

    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teachers[0],
      message: 'Teacher info retrieved successfully'
    });
  } catch (error) {
    console.error('Teacher info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Teacher schedule endpoint
router.get('/jadwal', async (req, res) => {
  try {
    const [schedules] = await db.execute(`
      SELECT j.*, k.nama_kelas, m.nama_mapel, m.kode_mapel
      FROM jadwal j
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      WHERE j.guru_id = ? AND j.status = "aktif"
      ORDER BY j.hari, j.jam_ke
    `, [req.user.guru_id]);

    res.json({
      success: true,
      data: schedules,
      message: 'Teacher schedule retrieved successfully'
    });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get students for a specific schedule
router.get('/daftar-siswa/:jadwal_id', async (req, res) => {
  try {
    const { jadwal_id } = req.params;

    const [students] = await db.execute(`
      SELECT s.*, k.nama_kelas
      FROM siswa s
      LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
      WHERE s.kelas_id = (
        SELECT kelas_id FROM jadwal WHERE id_jadwal = ?
      ) AND s.status = "aktif"
      ORDER BY s.nama
    `, [jadwal_id]);

    res.json({
      success: true,
      data: students,
      message: 'Students retrieved successfully'
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Student attendance history
router.get('/student-attendance-history', async (req, res) => {
  try {
    const { jadwal_id, tanggal } = req.query;

    let query = `
      SELECT a.*, s.nama as nama_siswa, s.nis, j.hari, j.jam_ke, m.nama_mapel, k.nama_kelas
      FROM absensi_siswa a
      LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
      LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      WHERE j.guru_id = ?
    `;

    const params = [req.user.guru_id];

    if (jadwal_id) {
      query += ' AND a.jadwal_id = ?';
      params.push(jadwal_id);
    }

    if (tanggal) {
      query += ' AND a.tanggal = ?';
      params.push(tanggal);
    }

    query += ' ORDER BY a.tanggal DESC, s.nama';

    const [attendance] = await db.execute(query, params);

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance history retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
