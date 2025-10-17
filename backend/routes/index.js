// Main routes index
import express from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import teacherRoutes from './teacher.js';
import studentRoutes from './student.js';
import attendanceRoutes from './attendance.js';
import passwordRoutes from './password.js';
import twoFactorRoutes from './twoFactor.js';
import accountLockoutRoutes from './accountLockout.js';
import healthRoutes from './health.js';
import swaggerRoutes from './swagger.js';

const router = express.Router();

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/guru', teacherRoutes);
router.use('/api/siswa', studentRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api/password', passwordRoutes);
router.use('/api/2fa', twoFactorRoutes);
router.use('/api/security', accountLockoutRoutes);
router.use('/api', healthRoutes);

// Documentation routes
router.use('/docs', swaggerRoutes);

// Public endpoints
router.get('/api/kelas', async (req, res) => {
  try {
    const { db } = await import('../db.js');
    const [classes] = await db.execute('SELECT * FROM kelas WHERE status = "aktif" ORDER BY nama_kelas');
    
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

export default router;
