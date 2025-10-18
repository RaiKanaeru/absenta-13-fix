// Attendance routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiting.js';
import { db } from '../../db.js';

const router = express.Router();

// Apply authentication and rate limiting to all attendance routes
router.use(authenticateToken);
router.use(apiLimiter);

// Submit attendance (for teachers and perwakilan)
router.post('/submit', requireRole(['guru', 'admin', 'perwakilan']), async (req, res) => {
  try {
    const { jadwal_id, siswa_id, tanggal, status, keterangan } = req.body;

    // RBAC Validation: Perwakilan tidak boleh input DISPEN
    if (req.user.role === 'perwakilan' && status === 'DISPEN') {
      return res.status(403).json({
        success: false,
        error: 'Perwakilan siswa tidak diperbolehkan menginput status DISPEN. Hanya guru dan admin yang boleh.'
      });
    }

    // Auto-detect guru_id for guru role
    let guruId = req.body.guru_id;
    if (req.user.role === 'guru') {
      const [guru] = await db.execute(
        'SELECT id_guru FROM guru WHERE id_pengguna = ? AND status = "aktif"',
        [req.user.id]
      );
      if (guru.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Teacher not found'
        });
      }
      guruId = guru[0].id_guru;
    }

    // Check if attendance already exists
    const [existing] = await db.execute(
      'SELECT id FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
      [siswa_id, jadwal_id, tanggal]
    );

    if (existing.length > 0) {
      // Update existing record
      await db.execute(
        'UPDATE absensi_siswa SET status = ?, reason_text = ?, created_by = ?, created_by_role = ? WHERE id = ?',
        [status, keterangan, req.user.id, req.user.role, existing[0].id]
      );
    } else {
      // Insert new record
      await db.execute(
        'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, reason_text, created_by, created_by_role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [siswa_id, jadwal_id, tanggal, status, keterangan, req.user.id, req.user.role]
      );
    }

    res.json({
      success: true,
      message: 'Attendance submitted successfully'
    });
  } catch (error) {
    console.error('Submit attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get attendance for a specific schedule and date
router.get('/jadwal/:jadwal_id', async (req, res) => {
  try {
    const { jadwal_id } = req.params;
    const { tanggal } = req.query;

    let query = `
      SELECT a.*, s.nama as nama_siswa, s.nis
      FROM absensi_siswa a
      LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
      WHERE a.jadwal_id = ?
    `;

    const params = [jadwal_id];

    if (tanggal) {
      query += ' AND a.tanggal = ?';
      params.push(tanggal);
    }

    query += ' ORDER BY s.nama';

    const [attendance] = await db.execute(query, params);

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get attendance statistics
router.get('/stats', async (req, res) => {
  try {
    const { tanggal, kelas_id } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_attendance,
        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
        SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
        SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
        SUM(CASE WHEN status = 'Dispen' THEN 1 ELSE 0 END) as dispen,
        SUM(CASE WHEN status = 'Alpa' THEN 1 ELSE 0 END) as alpa
      FROM absensi_siswa a
      LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
      WHERE 1=1
    `;

    const params = [];

    if (tanggal) {
      query += ' AND a.tanggal = ?';
      params.push(tanggal);
    }

    if (kelas_id) {
      query += ' AND j.kelas_id = ?';
      params.push(kelas_id);
    }

    const [stats] = await db.execute(query, params);

    res.json({
      success: true,
      data: stats[0],
      message: 'Attendance statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
