/**
 * User-Siswa Validation Middleware
 * 
 * Middleware untuk validasi konsistensi antara tabel users dan siswa
 * setelah full normalization.
 * 
 * @module backend/middleware/userSiswaValidation
 */

import db from '../../db.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

/**
 * Middleware untuk validasi relationship antara users dan siswa
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const validateUserSiswa = async (req, res, next) => {
  try {
    const { userId, siswaId } = req.params;
    
    // Skip validation if both params are not provided
    if (!userId && !siswaId) {
      return next();
    }
    
    // If only userId is provided, check if it's a SISWA account
    if (userId && !siswaId) {
      const [userResult] = await db.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [userId]
      );
      
      if (userResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User tidak ditemukan'
        });
      }
      
      if (userResult[0].role !== 'SISWA') {
        return res.status(400).json({
          success: false,
          error: 'User ini bukan akun siswa'
        });
      }
    }
    
    // If both userId and siswaId are provided, validate relationship
    if (userId && siswaId) {
      const [result] = await db.execute(
        'SELECT 1 FROM siswa WHERE id_siswa = ? AND user_id = ?',
        [siswaId, userId]
      );
      
      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User-Siswa relationship tidak valid'
        });
      }
    }
    
    // If only siswaId is provided, check if siswa exists
    if (siswaId && !userId) {
      const [siswaResult] = await db.execute(
        'SELECT id_siswa FROM siswa WHERE id_siswa = ?',
        [siswaId]
      );
      
      if (siswaResult.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Siswa tidak ditemukan'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed: ' + error.message
    });
  }
};

/**
 * Middleware untuk auto-create user account untuk siswa yang belum punya akun
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const ensureStudentAccount = async (req, res, next) => {
  let connection;
  
  try {
    const { siswa_id } = req.params;
    
    if (!siswa_id) {
      return next();
    }
    
    // Check if siswa exists
    const [siswa] = await db.execute(
      'SELECT id_siswa, user_id, nis, nama, email FROM siswa WHERE id_siswa = ?',
      [siswa_id]
    );
    
    if (siswa.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Siswa tidak ditemukan'
      });
    }
    
    const siswaData = siswa[0];
    
    // If siswa already has user account, continue
    if (siswaData.user_id) {
      return next();
    }
    
    // Get connection for transaction
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    console.log(`🔧 Auto-creating user account for siswa: ${siswaData.nama} (${siswaData.nis})`);
    
    // Create user account
    const username = `siswa_${siswaData.nis}`;
    const password = `${siswaData.nis}@2024`;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const [userResult] = await connection.execute(
      `INSERT INTO users (username, password, role, email, status, created_at)
       VALUES (?, ?, 'SISWA', ?, 'aktif', NOW())`,
      [username, hashedPassword, siswaData.email || null]
    );
    
    const userId = userResult.insertId;
    
    // Update siswa dengan user_id
    await connection.execute(
      'UPDATE siswa SET user_id = ?, updated_at = NOW() WHERE id_siswa = ?',
      [userId, siswa_id]
    );
    
    await connection.commit();
    
    console.log(`✅ User account created successfully: ${username}`);
    
    // Add info to request object
    req.newUserCreated = true;
    req.newUserInfo = {
      userId,
      username,
      defaultPassword: password
    };
    
    next();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    
    console.error('❌ Ensure student account error:', error);
    
    // If duplicate username, try with alternative username
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Username sudah digunakan. Tidak dapat membuat akun otomatis.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to ensure student account: ' + error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Middleware untuk validasi student data integrity
 * Checks for:
 * - Broken user_id relationships
 * - Duplicate NIS
 * - Invalid role assignments
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const validateStudentDataIntegrity = async (req, res, next) => {
  try {
    // Check for broken relationships
    const [brokenRels] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM siswa s
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    
    if (brokenRels[0].count > 0) {
      console.warn(`⚠️ WARNING: ${brokenRels[0].count} broken user-siswa relationships detected!`);
      
      // Add warning to response headers
      res.set('X-Data-Integrity-Warning', `${brokenRels[0].count} broken relationships`);
    }
    
    // Check for invalid role assignments
    const [invalidRoles] = await db.execute(`
      SELECT COUNT(*) as count
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role <> 'SISWA'
    `);
    
    if (invalidRoles[0].count > 0) {
      console.warn(`⚠️ WARNING: ${invalidRoles[0].count} invalid role assignments detected!`);
      
      res.set('X-Role-Integrity-Warning', `${invalidRoles[0].count} invalid roles`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Data integrity check error:', error);
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Middleware untuk auto-fix broken relationships
 * Sets user_id to NULL for siswa with broken relationships
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const autoFixBrokenRelationships = async (req, res, next) => {
  try {
    // Find and fix broken relationships
    const [result] = await db.execute(`
      UPDATE siswa s
      SET s.user_id = NULL, s.updated_at = NOW()
      WHERE s.user_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
    `);
    
    if (result.affectedRows > 0) {
      console.log(`🔧 Auto-fixed ${result.affectedRows} broken relationships`);
      
      res.set('X-Auto-Fixed-Relationships', result.affectedRows.toString());
    }
    
    next();
  } catch (error) {
    console.error('❌ Auto-fix error:', error);
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Middleware untuk validasi bulk operations
 * Ensures data consistency for bulk create/update/delete
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
export const validateBulkOperation = async (req, res, next) => {
  try {
    const { students } = req.body;
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bulk operation data'
      });
    }
    
    // Validate each student data
    const errors = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      if (!student.nis) {
        errors.push(`Student ${i + 1}: NIS is required`);
      }
      
      if (!student.nama) {
        errors.push(`Student ${i + 1}: Nama is required`);
      }
      
      if (!student.kelas_id) {
        errors.push(`Student ${i + 1}: Kelas ID is required`);
      }
      
      // Check for duplicate NIS in the batch
      const duplicates = students.filter(s => s.nis === student.nis);
      if (duplicates.length > 1) {
        errors.push(`Student ${i + 1}: Duplicate NIS in batch: ${student.nis}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bulk operation validation failed',
        details: errors
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Bulk validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk validation failed: ' + error.message
    });
  }
};

/**
 * Health check middleware for user-siswa system
 * Returns statistics about data integrity
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const healthCheckUserSiswa = async (req, res) => {
  try {
    // Get statistics
    const [stats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM siswa) as total_siswa,
        (SELECT COUNT(*) FROM siswa WHERE user_id IS NOT NULL) as siswa_dengan_akun,
        (SELECT COUNT(*) FROM siswa WHERE user_id IS NULL) as siswa_tanpa_akun,
        (SELECT COUNT(*) FROM users WHERE role = 'SISWA') as total_user_siswa,
        (SELECT COUNT(*) FROM siswa s 
         WHERE s.user_id IS NOT NULL 
           AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)) as broken_relationships,
        (SELECT COUNT(*) FROM siswa s
         JOIN users u ON s.user_id = u.id
         WHERE u.role <> 'SISWA') as invalid_roles
    `);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: stats[0],
      issues: {
        broken_relationships: stats[0].broken_relationships > 0,
        invalid_roles: stats[0].invalid_roles > 0
      }
    };
    
    // Determine overall health status
    if (stats[0].broken_relationships > 0 || stats[0].invalid_roles > 0) {
      health.status = 'degraded';
    }
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed: ' + error.message
    });
  }
};

export default {
  validateUserSiswa,
  ensureStudentAccount,
  validateStudentDataIntegrity,
  autoFixBrokenRelationships,
  validateBulkOperation,
  healthCheckUserSiswa
};
