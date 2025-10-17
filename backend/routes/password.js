/**
 * Password Management Routes untuk Absenta System
 * Endpoints untuk password policy, reset, dan security
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../../db.js';
import { 
  checkPasswordStrength, 
  validatePassword, 
  hashPassword, 
  verifyPassword,
  checkPasswordHistory,
  savePasswordHistory,
  checkPasswordExpiry,
  checkPasswordResetLimits,
  logPasswordResetAttempt,
  passwordPolicyConfig
} from '../middleware/passwordPolicy.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/password/policy
 * Mendapatkan informasi password policy
 */
router.get('/policy', (req, res) => {
  try {
    const policyInfo = passwordPolicyConfig.getPolicyInfo();
    
    res.json({
      success: true,
      data: policyInfo,
      message: 'Password policy information retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting password policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get password policy information',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/password/check-strength
 * Mengecek kekuatan password
 */
router.post('/check-strength', [
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { password } = req.body;
    const strengthResult = checkPasswordStrength(password);
    
    res.json({
      success: true,
      data: {
        isValid: strengthResult.isValid,
        strengthScore: strengthResult.strengthScore,
        strengthLevel: strengthResult.strengthLevel,
        errors: strengthResult.errors,
        warnings: strengthResult.warnings,
        requirements: strengthResult.requirements
      },
      message: 'Password strength checked successfully'
    });
  } catch (error) {
    console.error('Error checking password strength:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check password strength',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/password/change
 * Mengubah password user
 */
router.post('/change', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation tidak cocok',
        code: 'PASSWORD_MISMATCH'
      });
    }
    
    // Check password strength
    const strengthResult = checkPasswordStrength(newPassword);
    if (!strengthResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi kriteria keamanan',
        errors: strengthResult.errors,
        warnings: strengthResult.warnings,
        code: 'PASSWORD_POLICY_VIOLATION'
      });
    }
    
    // Get current user data
    const [users] = await db.execute(
      'SELECT password FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak benar',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Check password history
    const historyCheck = await checkPasswordHistory(userId, newPassword, db);
    if (!historyCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: historyCheck.message,
        code: 'PASSWORD_HISTORY_VIOLATION'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password in database
    await db.execute(
      'UPDATE pengguna SET password = ?, password_changed_at = NOW(), password_reset_required = FALSE WHERE id = ?',
      [hashedPassword, userId]
    );
    
    // Save to password history
    await savePasswordHistory(userId, hashedPassword, db);
    
    // Log password change
    console.log(`[PASSWORD CHANGE] User ${userId} changed password from IP ${req.ip}`);
    
    res.json({
      success: true,
      message: 'Password berhasil diubah',
      data: {
        strengthScore: strengthResult.strengthScore,
        strengthLevel: strengthResult.strengthLevel
      }
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/password/reset-request
 * Request password reset
 */
router.post('/reset-request', [
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { username } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');
    
    // Get user data
    const [users] = await db.execute(
      'SELECT id, username, nama, email FROM pengguna WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      // Log failed attempt
      await logPasswordResetAttempt(null, ip, userAgent, db);
      
      // Return success to prevent username enumeration
      return res.json({
        success: true,
        message: 'Jika username valid, reset link akan dikirim ke email'
      });
    }
    
    const user = users[0];
    
    // Check reset limits
    const resetLimits = await checkPasswordResetLimits(user.id, db);
    if (!resetLimits.canReset) {
      return res.status(429).json({
        success: false,
        message: resetLimits.message,
        code: 'RESET_LIMIT_EXCEEDED'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    // Save reset token
    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );
    
    // Log reset attempt
    await logPasswordResetAttempt(user.id, ip, userAgent, db);
    
    // TODO: Send email with reset link
    // For now, just return the token (in production, send via email)
    console.log(`[PASSWORD RESET] Token for user ${user.username}: ${resetToken}`);
    
    res.json({
      success: true,
      message: 'Reset link telah dikirim ke email (jika email terdaftar)',
      data: {
        // Remove this in production
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request password reset',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/password/reset-confirm
 * Confirm password reset with token
 */
router.post('/reset-confirm', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }
    
    const { token, newPassword, confirmPassword } = req.body;
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation tidak cocok',
        code: 'PASSWORD_MISMATCH'
      });
    }
    
    // Check password strength
    const strengthResult = checkPasswordStrength(newPassword);
    if (!strengthResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi kriteria keamanan',
        errors: strengthResult.errors,
        warnings: strengthResult.warnings,
        code: 'PASSWORD_POLICY_VIOLATION'
      });
    }
    
    // Verify reset token
    const [tokens] = await db.execute(
      'SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?',
      [token]
    );
    
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reset token tidak valid',
        code: 'INVALID_RESET_TOKEN'
      });
    }
    
    const resetToken = tokens[0];
    
    // Check if token is expired
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Reset token telah expired',
        code: 'EXPIRED_RESET_TOKEN'
      });
    }
    
    // Check if token is already used
    if (resetToken.used_at) {
      return res.status(400).json({
        success: false,
        message: 'Reset token sudah digunakan',
        code: 'USED_RESET_TOKEN'
      });
    }
    
    const userId = resetToken.user_id;
    
    // Check password history
    const historyCheck = await checkPasswordHistory(userId, newPassword, db);
    if (!historyCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: historyCheck.message,
        code: 'PASSWORD_HISTORY_VIOLATION'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password in database
    await db.execute(
      'UPDATE pengguna SET password = ?, password_changed_at = NOW(), password_reset_required = FALSE WHERE id = ?',
      [hashedPassword, userId]
    );
    
    // Mark token as used
    await db.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    );
    
    // Save to password history
    await savePasswordHistory(userId, hashedPassword, db);
    
    // Log password reset
    console.log(`[PASSWORD RESET] User ${userId} reset password using token`);
    
    res.json({
      success: true,
      message: 'Password berhasil direset',
      data: {
        strengthScore: strengthResult.strengthScore,
        strengthLevel: strengthResult.strengthLevel
      }
    });
  } catch (error) {
    console.error('Error confirming password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm password reset',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/password/expiry
 * Check password expiry status
 */
router.get('/expiry', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const expiryCheck = await checkPasswordExpiry(userId, db);
    
    res.json({
      success: true,
      data: expiryCheck,
      message: 'Password expiry status retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking password expiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check password expiry',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/password/history
 * Get password history (admin only)
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.peran !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
        code: 'ACCESS_DENIED'
      });
    }
    
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }
    
    const [history] = await db.execute(
      'SELECT created_at FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );
    
    res.json({
      success: true,
      data: history,
      message: 'Password history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting password history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get password history',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/password/security-status
 * Get comprehensive password security status
 */
router.get('/security-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user security data
    const [users] = await db.execute(
      'SELECT password_changed_at, password_reset_required, failed_login_attempts, account_locked_until, two_factor_enabled FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    
    // Check password expiry
    const expiryCheck = await checkPasswordExpiry(userId, db);
    
    // Get recent login attempts
    const [loginAttempts] = await db.execute(
      'SELECT success, created_at FROM login_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );
    
    // Get active sessions
    const [sessions] = await db.execute(
      'SELECT ip_address, user_agent, last_activity FROM user_sessions WHERE user_id = ? AND is_active = TRUE ORDER BY last_activity DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        passwordExpiry: expiryCheck,
        passwordResetRequired: user.password_reset_required,
        failedLoginAttempts: user.failed_login_attempts,
        accountLockedUntil: user.account_locked_until,
        twoFactorEnabled: user.two_factor_enabled,
        recentLoginAttempts: loginAttempts,
        activeSessions: sessions,
        securityScore: calculateSecurityScore(user, expiryCheck, loginAttempts)
      },
      message: 'Password security status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting password security status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get password security status',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Calculate security score
 */
function calculateSecurityScore(user, expiryCheck, loginAttempts) {
  let score = 100;
  
  // Password age penalty
  if (expiryCheck.isExpired) {
    score -= 30;
  } else if (expiryCheck.daysRemaining < 7) {
    score -= 15;
  }
  
  // Failed login attempts penalty
  if (user.failed_login_attempts > 0) {
    score -= user.failed_login_attempts * 5;
  }
  
  // Account lockout penalty
  if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
    score -= 50;
  }
  
  // Recent failed attempts penalty
  const recentFailures = loginAttempts.filter(attempt => !attempt.success && 
    new Date(attempt.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;
  
  score -= recentFailures * 10;
  
  // Two-factor authentication bonus
  if (user.two_factor_enabled) {
    score += 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

export default router;
