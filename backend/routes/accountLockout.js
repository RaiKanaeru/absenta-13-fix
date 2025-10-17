/**
 * Account Lockout API Routes
 * Endpoints untuk mengelola account lockout dan security monitoring
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  checkAccountLockout, 
  recordFailedAttempt, 
  recordSuccessfulAttempt, 
  unlockAccount, 
  getLockoutStats 
} from '../middleware/accountLockout.js';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET /api/security/lockout-stats
 * Mendapatkan statistik lockout (admin only)
 */
router.get('/lockout-stats', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses statistik ini.'
      });
    }

    const stats = await getLockoutStats();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik lockout'
      });
    }

    res.json({
      success: true,
      data: stats,
      message: 'Statistik lockout berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting lockout stats:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * GET /api/security/active-lockouts
 * Mendapatkan daftar akun yang sedang terkunci (admin only)
 */
router.get('/active-lockouts', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses data ini.'
      });
    }

    const [lockouts] = await db.execute(`
      SELECT 
        al.id,
        al.username,
        al.ip_address,
        al.attempt_count,
        al.locked_until,
        al.is_permanent,
        al.created_at,
        TIMESTAMPDIFF(MINUTE, NOW(), al.locked_until) as remaining_minutes,
        CASE 
            WHEN al.is_permanent = 1 THEN 'Permanent'
            WHEN al.locked_until > NOW() THEN 'Active'
            ELSE 'Expired'
        END as status
      FROM account_lockouts al
      WHERE al.locked_until > NOW()
      ORDER BY al.created_at DESC
    `);

    res.json({
      success: true,
      data: lockouts,
      message: 'Daftar akun terkunci berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting active lockouts:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * POST /api/security/unlock-account
 * Unlock akun yang terkunci (admin only)
 */
router.post('/unlock-account', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat meng-unlock akun.'
      });
    }

    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username diperlukan'
      });
    }

    const result = await unlockAccount(username, req.user.username);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error unlocking account:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * GET /api/security/login-attempts
 * Mendapatkan riwayat login attempts (admin only)
 */
router.get('/login-attempts', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses data ini.'
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      username, 
      ip_address, 
      success, 
      start_date, 
      end_date 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Build where conditions
    if (username) {
      whereConditions.push('username LIKE ?');
      queryParams.push(`%${username}%`);
    }
    
    if (ip_address) {
      whereConditions.push('ip_address LIKE ?');
      queryParams.push(`%${ip_address}%`);
    }
    
    if (success !== undefined) {
      whereConditions.push('success = ?');
      queryParams.push(success === 'true' ? 1 : 0);
    }
    
    if (start_date) {
      whereConditions.push('created_at >= ?');
      queryParams.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?');
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM login_attempts 
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;

    // Get paginated results
    const [attempts] = await db.execute(`
      SELECT 
        id,
        username,
        ip_address,
        success,
        reason,
        user_agent,
        created_at
      FROM login_attempts 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Riwayat login attempts berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting login attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * GET /api/security/security-events
 * Mendapatkan security events (admin only)
 */
router.get('/security-events', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengakses data ini.'
      });
    }

    const { 
      page = 1, 
      limit = 50, 
      event_type, 
      severity, 
      start_date, 
      end_date 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Build where conditions
    if (event_type) {
      whereConditions.push('event_type = ?');
      queryParams.push(event_type);
    }
    
    if (severity) {
      whereConditions.push('severity = ?');
      queryParams.push(severity);
    }
    
    if (start_date) {
      whereConditions.push('created_at >= ?');
      queryParams.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?');
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total 
      FROM security_events 
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;

    // Get paginated results
    const [events] = await db.execute(`
      SELECT 
        id,
        event_type,
        username,
        ip_address,
        description,
        severity,
        metadata,
        created_at
      FROM security_events 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Security events berhasil diambil'
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * POST /api/security/cleanup
 * Cleanup old records (admin only)
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat melakukan cleanup.'
      });
    }

    // Call cleanup procedure
    await db.execute('CALL CleanupOldLoginAttempts()');

    res.json({
      success: true,
      message: 'Cleanup berhasil dilakukan'
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat cleanup'
    });
  }
});

/**
 * GET /api/security/check-lockout/:username
 * Cek status lockout untuk username tertentu (admin only)
 */
router.get('/check-lockout/:username', authenticateToken, async (req, res) => {
  try {
    // Cek apakah user adalah admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengecek status lockout.'
      });
    }

    const { username } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const lockoutStatus = await checkAccountLockout(username, ipAddress);

    res.json({
      success: true,
      data: lockoutStatus,
      message: 'Status lockout berhasil dicek'
    });
  } catch (error) {
    console.error('Error checking lockout status:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

export default router;
