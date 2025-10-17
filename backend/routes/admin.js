// Admin routes
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateTeacher, validateStudent, validateSubject, validateClass, validateRoom } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiting.js';
import { db } from '../db.js';

const router = express.Router();

// Apply authentication and rate limiting to all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(apiLimiter);

// Admin info endpoint
router.get('/info', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, nama_pengguna, nama, email, peran, status FROM pengguna WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: users[0],
      message: 'Admin info retrieved successfully'
    });
  } catch (error) {
    console.error('Admin info error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Teacher management endpoints
router.get('/guru', async (req, res) => {
  try {
    const [teachers] = await db.execute(`
      SELECT g.*, m.nama_mapel 
      FROM guru g 
      LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
      ORDER BY g.nama
    `);

    res.json({
      success: true,
      data: teachers,
      message: 'Teachers retrieved successfully'
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/guru', validateTeacher, async (req, res) => {
  try {
    const { nama, nip, email, no_telp, mapel_id, status } = req.body;

    // Check if NIP already exists
    const [existingNip] = await db.execute('SELECT id_guru FROM guru WHERE nip = ?', [nip]);
    if (existingNip.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'NIP already exists'
      });
    }

    // Create user account first
    const [userResult] = await db.execute(
      'INSERT INTO pengguna (nama_pengguna, kata_sandi, peran, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nip, '$2b$10$default', 'guru', nama, email, status]
    );

    const userId = userResult.insertId;

    // Create teacher record
    await db.execute(
      'INSERT INTO guru (id_pengguna, nip, nama, email, no_telp, mapel_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, nip, nama, email, no_telp, mapel_id, status]
    );

    res.json({
      success: true,
      message: 'Teacher created successfully'
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.put('/guru/:id', validateTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nip, email, no_telp, mapel_id, status } = req.body;

    // Update teacher record
    await db.execute(
      'UPDATE guru SET nama = ?, nip = ?, email = ?, no_telp = ?, mapel_id = ?, status = ? WHERE id_guru = ?',
      [nama, nip, email, no_telp, mapel_id, status, id]
    );

    res.json({
      success: true,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.delete('/guru/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user ID first
    const [teacher] = await db.execute('SELECT id_pengguna FROM guru WHERE id_guru = ?', [id]);
    if (teacher.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Delete teacher record
    await db.execute('DELETE FROM guru WHERE id_guru = ?', [id]);

    // Delete user account
    await db.execute('DELETE FROM pengguna WHERE id = ?', [teacher[0].id_pengguna]);

    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Subject management endpoints
router.get('/mapel', async (req, res) => {
  try {
    const [subjects] = await db.execute('SELECT * FROM mapel ORDER BY nama_mapel');

    res.json({
      success: true,
      data: subjects,
      message: 'Subjects retrieved successfully'
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/mapel', validateSubject, async (req, res) => {
  try {
    const { kode_mapel, nama_mapel, status } = req.body;

    await db.execute(
      'INSERT INTO mapel (kode_mapel, nama_mapel, status) VALUES (?, ?, ?)',
      [kode_mapel, nama_mapel, status]
    );

    res.json({
      success: true,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.put('/mapel/:id', validateSubject, async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_mapel, nama_mapel, status } = req.body;

    await db.execute(
      'UPDATE mapel SET kode_mapel = ?, nama_mapel = ?, status = ? WHERE id_mapel = ?',
      [kode_mapel, nama_mapel, status, id]
    );

    res.json({
      success: true,
      message: 'Subject updated successfully'
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.delete('/mapel/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM mapel WHERE id_mapel = ?', [id]);

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Class management endpoints
router.get('/kelas', async (req, res) => {
  try {
    const [classes] = await db.execute('SELECT * FROM kelas ORDER BY nama_kelas');

    res.json({
      success: true,
      data: classes,
      message: 'Classes retrieved successfully'
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/kelas', validateClass, async (req, res) => {
  try {
    const { nama_kelas, tingkat, ruang, kapasitas, status } = req.body;

    await db.execute(
      'INSERT INTO kelas (nama_kelas, tingkat, ruang, kapasitas, status) VALUES (?, ?, ?, ?, ?)',
      [nama_kelas, tingkat, ruang, kapasitas, status]
    );

    res.json({
      success: true,
      message: 'Class created successfully'
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.put('/kelas/:id', validateClass, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, tingkat, ruang, kapasitas, status } = req.body;

    await db.execute(
      'UPDATE kelas SET nama_kelas = ?, tingkat = ?, ruang = ?, kapasitas = ?, status = ? WHERE id_kelas = ?',
      [nama_kelas, tingkat, ruang, kapasitas, status, id]
    );

    res.json({
      success: true,
      message: 'Class updated successfully'
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.delete('/kelas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM kelas WHERE id_kelas = ?', [id]);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Room management endpoints
router.get('/ruang-kelas', async (req, res) => {
  try {
    const [rooms] = await db.execute('SELECT * FROM ruang_kelas ORDER BY nama_ruang');

    res.json({
      success: true,
      data: rooms,
      message: 'Rooms retrieved successfully'
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.post('/ruang-kelas', validateRoom, async (req, res) => {
  try {
    const { nama_ruang, kode_ruang, kapasitas, lokasi } = req.body;

    await db.execute(
      'INSERT INTO ruang_kelas (nama_ruang, kode_ruang, kapasitas, lokasi, status) VALUES (?, ?, ?, ?, "aktif")',
      [nama_ruang, kode_ruang, kapasitas, lokasi]
    );

    res.json({
      success: true,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.put('/ruang-kelas/:id', validateRoom, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_ruang, kode_ruang, kapasitas, lokasi } = req.body;

    await db.execute(
      'UPDATE ruang_kelas SET nama_ruang = ?, kode_ruang = ?, kapasitas = ?, lokasi = ? WHERE id = ?',
      [nama_ruang, kode_ruang, kapasitas, lokasi, id]
    );

    res.json({
      success: true,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.delete('/ruang-kelas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM ruang_kelas WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
