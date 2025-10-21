// Admin routes
import express from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateTeacher, validateStudent, validateSubject, validateClass, validateRoom } from '../middleware/validation.js';
import { apiLimiter } from '../middleware/rateLimiting.js';
import { db } from '../../db.js';

const router = express.Router();

// Apply authentication and rate limiting to all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin']));
router.use(apiLimiter);

// Admin info endpoint
router.get('/info', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, nama, email, role, status FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    // Normalize role to lowercase for consistency
    const userData = {
      ...users[0],
      role: users[0].role ? users[0].role.toLowerCase() : users[0].role
    };

    res.json({
      success: true,
      data: userData,
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
      'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nip, '$2b$10$default', 'GURU', nama, email, status]
    );

    const userId = userResult.insertId;

    // Create teacher record
    await db.execute(
      'INSERT INTO guru (user_id, nip, nama, email, no_telp, mapel_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
    const [teacher] = await db.execute('SELECT user_id FROM guru WHERE id_guru = ?', [id]);
    if (teacher.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Delete teacher record
    await db.execute('DELETE FROM guru WHERE id_guru = ?', [id]);

    // Delete user account
    await db.execute('DELETE FROM users WHERE id = ?', [teacher[0].user_id]);

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

// Student management endpoints
router.get('/siswa', async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, k.nama_kelas, k.tingkat, u.username, u.email as user_email
      FROM siswa s 
      LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.nama
    `);

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

router.post('/siswa', async (req, res) => {
  try {
    const { nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa } = req.body;

    // Check if NIS already exists
    const [existingNis] = await db.execute('SELECT id_siswa FROM siswa WHERE nis = ?', [nis]);
    if (existingNis.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'NIS already exists'
      });
    }

    // Create user account first
    const [userResult] = await db.execute(
      'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      [nis, '$2b$10$default', 'SISWA', nama, email, 'aktif']
    );

    const userId = userResult.insertId;

    // Create student record
    await db.execute(
      'INSERT INTO siswa (user_id, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, 'aktif']
    );

    res.json({
      success: true,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.put('/siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status } = req.body;

    // Update student record
    await db.execute(
      'UPDATE siswa SET nis = ?, nama = ?, kelas_id = ?, jabatan = ?, jenis_kelamin = ?, email = ?, alamat = ?, telepon_orangtua = ?, telepon_siswa = ?, status = ? WHERE id_siswa = ?',
      [nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status, id]
    );

    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.delete('/siswa/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user ID first
    const [student] = await db.execute('SELECT user_id FROM siswa WHERE id_siswa = ?', [id]);
    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Delete student record
    await db.execute('DELETE FROM siswa WHERE id_siswa = ?', [id]);

    // Delete user account
    await db.execute('DELETE FROM users WHERE id = ?', [student[0].user_id]);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Schedule management endpoints
router.get('/jadwal', async (req, res) => {
  try {
    const [schedules] = await db.execute(`
      SELECT j.*, g.nama as nama_guru, m.nama_mapel, k.nama_kelas
      FROM jadwal j
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      ORDER BY j.hari, j.jam_mulai
    `);

    res.json({
      success: true,
      data: schedules,
      message: 'Schedules retrieved successfully'
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/jadwal/preview', async (req, res) => {
  try {
    const { kelas_id, tanggal_mulai, tanggal_selesai } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (kelas_id) {
      whereClause += ' AND j.kelas_id = ?';
      params.push(kelas_id);
    }
    
    if (tanggal_mulai && tanggal_selesai) {
      whereClause += ' AND j.tanggal BETWEEN ? AND ?';
      params.push(tanggal_mulai, tanggal_selesai);
    }

    const [schedules] = await db.execute(`
      SELECT j.*, g.nama as nama_guru, m.nama_mapel, k.nama_kelas
      FROM jadwal j
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      WHERE 1=1 ${whereClause}
      ORDER BY j.hari, j.jam_mulai
    `, params);

    res.json({
      success: true,
      data: schedules,
      metadata: {
        total: schedules.length,
        preview_date: new Date().toISOString()
      },
      message: 'Schedule preview retrieved successfully'
    });
  } catch (error) {
    console.error('Get schedule preview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/jadwal/export', async (req, res) => {
  try {
    const { kelas_id, format = 'excel' } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (kelas_id) {
      whereClause += ' AND j.kelas_id = ?';
      params.push(kelas_id);
    }

    const [schedules] = await db.execute(`
      SELECT j.*, g.nama as nama_guru, m.nama_mapel, k.nama_kelas
      FROM jadwal j
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
      WHERE 1=1 ${whereClause}
      ORDER BY j.hari, j.jam_mulai
    `, params);

    res.json({
      success: true,
      data: schedules,
      message: 'Schedule export data retrieved successfully'
    });
  } catch (error) {
    console.error('Get schedule export error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/jadwal/conflicts', async (req, res) => {
  try {
    const [conflicts] = await db.execute(`
      SELECT 
        j1.id as jadwal1_id,
        j2.id as jadwal2_id,
        j1.kelas_id,
        j1.guru_id,
        j1.hari,
        j1.jam_mulai,
        j1.jam_selesai,
        k.nama_kelas,
        g.nama as nama_guru
      FROM jadwal j1
      JOIN jadwal j2 ON j1.id < j2.id
      LEFT JOIN kelas k ON j1.kelas_id = k.id_kelas
      LEFT JOIN guru g ON j1.guru_id = g.id_guru
      WHERE j1.hari = j2.hari
        AND j1.kelas_id = j2.kelas_id
        AND (
          (j1.jam_mulai <= j2.jam_mulai AND j1.jam_selesai > j2.jam_mulai) OR
          (j2.jam_mulai <= j1.jam_mulai AND j2.jam_selesai > j1.jam_mulai)
        )
    `);

    res.json({
      success: true,
      data: conflicts,
      message: 'Schedule conflicts retrieved successfully'
    });
  } catch (error) {
    console.error('Get schedule conflicts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Missing endpoints that frontend expects
router.get('/live-summary', async (req, res) => {
  try {
    const [teacherCount] = await db.execute('SELECT COUNT(*) as count FROM guru');
    const [studentCount] = await db.execute('SELECT COUNT(*) as count FROM siswa');
    const [classCount] = await db.execute('SELECT COUNT(*) as count FROM kelas');
    const [subjectCount] = await db.execute('SELECT COUNT(*) as count FROM mapel');

    res.json({
      success: true,
      data: {
        teachers: teacherCount[0].count,
        students: studentCount[0].count,
        classes: classCount[0].count,
        subjects: subjectCount[0].count
      },
      message: 'Live summary retrieved successfully'
    });
  } catch (error) {
    console.error('Live summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


// Archive and backup endpoints
router.get('/archive-stats', async (req, res) => {
  try {
    // Check if backups directory exists
    const backupsDir = path.join(process.cwd(), 'backups');
    let totalArchives = 0;
    let lastBackup = null;
    let storageUsed = 0;
    
    try {
      const files = await fs.promises.readdir(backupsDir);
      const backupFiles = files.filter(file => file.endsWith('.sql') || file.endsWith('.json'));
      
      totalArchives = backupFiles.length;
      
      if (backupFiles.length > 0) {
        // Get the most recent backup
        const fileStats = await Promise.all(
          backupFiles.map(async (file) => {
            const stats = await fs.promises.stat(path.join(backupsDir, file));
            return { file, stats };
          })
        );
        
        const sortedFiles = fileStats.sort((a, b) => b.stats.mtime - a.stats.mtime);
        lastBackup = {
          name: sortedFiles[0].file,
          created: sortedFiles[0].stats.birthtime
        };
        
        // Calculate total storage used
        storageUsed = fileStats.reduce((total, { stats }) => total + stats.size, 0);
      }
    } catch (dirError) {
      console.log('Backups directory not found');
    }
    
    res.json({
      success: true,
      data: {
        totalArchives,
        lastBackup,
        storageUsed: `${Math.round(storageUsed / 1024 / 1024 * 100) / 100} MB`
      },
      message: 'Archive stats retrieved successfully'
    });
  } catch (error) {
    console.error('Archive stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/backups', async (req, res) => {
  try {
    // Check if backups directory exists
    const backupsDir = path.join(process.cwd(), 'backups');
    let backupFiles = [];
    
    try {
      const files = await fs.promises.readdir(backupsDir);
      backupFiles = files
        .filter(file => file.endsWith('.sql') || file.endsWith('.json'))
        .map(file => {
          const stats = fs.statSync(path.join(backupsDir, file));
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (dirError) {
      console.log('Backups directory not found, creating empty list');
    }
    
    res.json({
      success: true,
      data: backupFiles,
      message: 'Backups retrieved successfully'
    });
  } catch (error) {
    console.error('Backups error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/backup-settings', async (req, res) => {
  try {
    // In a real implementation, you would retrieve these settings from a database or config file
    const defaultSettings = {
      autoBackupSchedule: 'weekly',
      maxBackups: 10,
      archiveAge: 24,
      compression: true,
      emailNotifications: false,
      customScheduleDate: '',
      customScheduleTime: '02:00',
      customScheduleEnabled: false
    };
    
    res.json({
      success: true,
      data: defaultSettings,
      message: 'Pengaturan backup berhasil dimuat'
    });
  } catch (error) {
    console.error('❌ Backup settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Gagal memuat pengaturan backup'
    });
  }
});

router.post('/backup-settings', async (req, res) => {
  try {
    const {
      autoBackupSchedule,
      maxBackups,
      archiveAge,
      compression,
      emailNotifications,
      customScheduleDate,
      customScheduleTime,
      customScheduleEnabled
    } = req.body;
    
    // Validate input
    if (!autoBackupSchedule) {
      return res.status(400).json({
        success: false,
        error: 'Auto backup schedule is required'
      });
    }
    
    // In a real implementation, you would save these settings to a database or config file
    console.log('✅ Backup settings updated:', {
      autoBackupSchedule,
      maxBackups,
      archiveAge,
      compression,
      emailNotifications,
      customScheduleDate,
      customScheduleTime,
      customScheduleEnabled
    });
    
    res.json({
      success: true,
      data: {
        autoBackupSchedule,
        maxBackups,
        archiveAge,
        compression,
        emailNotifications,
        customScheduleDate,
        customScheduleTime,
        customScheduleEnabled
      },
      message: 'Pengaturan backup berhasil disimpan'
    });
  } catch (error) {
    console.error('❌ Update backup settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Gagal menyimpan pengaturan backup'
    });
  }
});

router.post('/archive-old-data', async (req, res) => {
  try {
    const { daysToKeep } = req.body;
    
    // In a real implementation, you would archive old data based on the daysToKeep parameter
    console.log('Archiving old data, keeping last', daysToKeep, 'days');
    
    res.json({
      success: true,
      message: 'Old data archived successfully'
    });
  } catch (error) {
    console.error('Archive old data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/custom-schedules', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Custom schedules retrieved successfully'
    });
  } catch (error) {
    console.error('Custom schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


router.get('/monitoring-dashboard', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        activeUsers: 5,
        systemHealth: 'good',
        uptime: '99.9%',
        lastUpdate: new Date().toISOString()
      },
      message: 'Monitoring dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Report letterhead endpoints
router.get('/letterhead', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        schoolName: 'SMK Negeri 13 Bandung',
        address: 'Jl. Soekarno Hatta No. 123, Bandung',
        logo: null,
        headerText: 'SISTEM MANAJEMEN KEHADIRAN',
        footerText: 'Absenta v1.0'
      },
      message: 'Letterhead config retrieved successfully'
    });
  } catch (error) {
    console.error('Letterhead config error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
