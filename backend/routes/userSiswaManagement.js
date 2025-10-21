/**
 * User-Siswa Management Routes
 * Handles user-siswa relationship management
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  validateUserSiswa, 
  requireSiswaAccount, 
  validatePermissions,
  auditUserAction,
  getUserSiswaRelationship,
  linkUserToSiswa,
  unlinkUserFromSiswa,
  getSystemStats,
  cleanupOrphanedRecords
} from '../middleware/userSiswaValidation.js';
import { db } from '../../db.js';

const router = express.Router();

/**
 * Get user-siswa relationship info
 * GET /api/user-siswa/relationship
 */
router.get('/relationship', authenticateToken, async (req, res) => {
  try {
    const relationship = await getUserSiswaRelationship(req.user.id);
    
    if (!relationship) {
      return res.status(404).json({ 
        error: 'User-siswa relationship not found',
        code: 'RELATIONSHIP_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: relationship
    });
  } catch (error) {
    console.error('❌ Get relationship error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Link user to siswa
 * POST /api/user-siswa/link
 */
router.post('/link', 
  authenticateToken, 
  requireRole(['admin']),
  validatePermissions(['can_manage_users']),
  auditUserAction('linked'),
  async (req, res) => {
    try {
      const { user_id, siswa_id } = req.body;
      
      if (!user_id || !siswa_id) {
        return res.status(400).json({ 
          error: 'user_id and siswa_id are required',
          code: 'MISSING_PARAMETERS'
        });
      }
      
      // Validate user exists and has siswa role
      const [user] = await db.execute(
        'SELECT id, role, status FROM users WHERE id = ?',
        [user_id]
      );
      
      if (user.length === 0) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (user[0].role !== 'siswa') {
        return res.status(400).json({ 
          error: 'User must have siswa role',
          code: 'INVALID_USER_ROLE'
        });
      }
      
      if (user[0].status !== 'aktif') {
        return res.status(400).json({ 
          error: 'User must be active',
          code: 'USER_INACTIVE'
        });
      }
      
      // Validate siswa exists
      const [siswa] = await db.execute(
        'SELECT id_siswa, nama, status FROM siswa WHERE id_siswa = ?',
        [siswa_id]
      );
      
      if (siswa.length === 0) {
        return res.status(404).json({ 
          error: 'Siswa not found',
          code: 'SISWA_NOT_FOUND'
        });
      }
      
      if (siswa[0].status !== 'aktif') {
        return res.status(400).json({ 
          error: 'Siswa must be active',
          code: 'SISWA_INACTIVE'
        });
      }
      
      // Check if siswa already has user
      const [existingLink] = await db.execute(
        'SELECT user_id FROM siswa WHERE id_siswa = ? AND user_id IS NOT NULL',
        [siswa_id]
      );
      
      if (existingLink.length > 0) {
        return res.status(400).json({ 
          error: 'Siswa already has a user account',
          code: 'SISWA_ALREADY_LINKED'
        });
      }
      
      // Check if user already has siswa
      const [existingSiswa] = await db.execute(
        'SELECT id_siswa FROM siswa WHERE user_id = ?',
        [user_id]
      );
      
      if (existingSiswa.length > 0) {
        return res.status(400).json({ 
          error: 'User already has a siswa account',
          code: 'USER_ALREADY_LINKED'
        });
      }
      
      // Link user to siswa
      const success = await linkUserToSiswa(user_id, siswa_id, req.user.id);
      
      if (!success) {
        return res.status(500).json({ 
          error: 'Failed to link user to siswa',
          code: 'LINK_FAILED'
        });
      }
      
      res.json({
        success: true,
        message: 'User successfully linked to siswa',
        data: {
          user_id,
          siswa_id,
          siswa_nama: siswa[0].nama
        }
      });
    } catch (error) {
      console.error('❌ Link user-siswa error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Unlink user from siswa
 * DELETE /api/user-siswa/unlink/:siswa_id
 */
router.delete('/unlink/:siswa_id', 
  authenticateToken, 
  requireRole(['admin']),
  validatePermissions(['can_manage_users']),
  auditUserAction('unlinked'),
  async (req, res) => {
    try {
      const { siswa_id } = req.params;
      
      // Validate siswa exists
      const [siswa] = await db.execute(
        'SELECT id_siswa, nama, user_id FROM siswa WHERE id_siswa = ?',
        [siswa_id]
      );
      
      if (siswa.length === 0) {
        return res.status(404).json({ 
          error: 'Siswa not found',
          code: 'SISWA_NOT_FOUND'
        });
      }
      
      if (!siswa[0].user_id) {
        return res.status(400).json({ 
          error: 'Siswa does not have a user account',
          code: 'SISWA_NOT_LINKED'
        });
      }
      
      // Unlink user from siswa
      const success = await unlinkUserFromSiswa(siswa_id, req.user.id);
      
      if (!success) {
        return res.status(500).json({ 
          error: 'Failed to unlink user from siswa',
          code: 'UNLINK_FAILED'
        });
      }
      
      res.json({
        success: true,
        message: 'User successfully unlinked from siswa',
        data: {
          siswa_id,
          siswa_nama: siswa[0].nama
        }
      });
    } catch (error) {
      console.error('❌ Unlink user-siswa error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Get system statistics
 * GET /api/user-siswa/stats
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const stats = await getSystemStats();
      
      if (!stats) {
        return res.status(500).json({ 
          error: 'Failed to get system statistics',
          code: 'STATS_ERROR'
        });
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Get stats error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Get users without siswa accounts
 * GET /api/user-siswa/users-without-siswa
 */
router.get('/users-without-siswa', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const [users] = await db.execute(
        `SELECT u.id, u.username, u.nama, u.email, u.status, u.created_at
         FROM users u
         WHERE u.role = 'siswa' 
           AND u.status = 'aktif'
           AND u.id NOT IN (SELECT user_id FROM siswa WHERE user_id IS NOT NULL)
         ORDER BY u.created_at DESC`
      );
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('❌ Get users without siswa error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Get siswa without user accounts
 * GET /api/user-siswa/siswa-without-users
 */
router.get('/siswa-without-users', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const [siswa] = await db.execute(
        `SELECT s.id_siswa, s.nama, s.nis, s.kelas_id, k.nama_kelas, s.status
         FROM siswa s
         LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
         WHERE s.user_id IS NULL 
           AND s.status = 'aktif'
         ORDER BY s.nama ASC`
      );
      
      res.json({
        success: true,
        data: siswa
      });
    } catch (error) {
      console.error('❌ Get siswa without users error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Cleanup orphaned records
 * POST /api/user-siswa/cleanup
 */
router.post('/cleanup', 
  authenticateToken, 
  requireRole(['admin']),
  validatePermissions(['can_manage_users']),
  async (req, res) => {
    try {
      const success = await cleanupOrphanedRecords();
      
      if (!success) {
        return res.status(500).json({ 
          error: 'Failed to cleanup orphaned records',
          code: 'CLEANUP_FAILED'
        });
      }
      
      res.json({
        success: true,
        message: 'Orphaned records cleaned up successfully'
      });
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Get audit log for user-siswa relationships
 * GET /api/user-siswa/audit
 */
router.get('/audit', 
  authenticateToken, 
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, user_id, siswa_id, action } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (user_id) {
        whereClause += ' AND a.user_id = ?';
        params.push(user_id);
      }
      
      if (siswa_id) {
        whereClause += ' AND a.siswa_id = ?';
        params.push(siswa_id);
      }
      
      if (action) {
        whereClause += ' AND a.action = ?';
        params.push(action);
      }
      
      const [auditLog] = await db.execute(
        `SELECT 
           a.id,
           a.user_id,
           a.siswa_id,
           a.action,
           a.old_values,
           a.new_values,
           a.created_at,
           u.username,
           s.nama as siswa_nama,
           s.nis,
           creator.username as created_by_username
         FROM audit_user_siswa a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
         LEFT JOIN users creator ON a.created_by = creator.id
         ${whereClause}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
      );
      
      const [totalCount] = await db.execute(
        `SELECT COUNT(*) as total FROM audit_user_siswa a ${whereClause}`,
        params
      );
      
      res.json({
        success: true,
        data: auditLog,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].total,
          pages: Math.ceil(totalCount[0].total / limit)
        }
      });
    } catch (error) {
      console.error('❌ Get audit log error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

export default router;


