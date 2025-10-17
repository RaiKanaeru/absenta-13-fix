/**
 * Two-Factor Authentication Routes untuk Absenta System
 * API endpoints untuk 2FA setup, verification, dan management
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import {
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
  getTwoFactorStatus,
  regenerateBackupCodes,
  verifyTwoFactorSession
} from '../middleware/twoFactorAuth.js';
import { db } from '../../db.js';

const router = express.Router();

/**
 * POST /api/2fa/setup
 * Setup 2FA for authenticated user
 */
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    
    // Check if 2FA is already enabled
    const status = await getTwoFactorStatus(userId);
    if (status.enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this account',
        code: 'ALREADY_ENABLED'
      });
    }
    
    // Setup 2FA
    const twoFactorData = await setupTwoFactor(userId, username);
    
    res.json({
      success: true,
      data: {
        qrCodeUrl: twoFactorData.qrCodeUrl,
        qrCodeDataURL: twoFactorData.qrCodeDataURL,
        manualEntryKey: twoFactorData.manualEntryKey,
        backupCodes: twoFactorData.backupCodes
      },
      message: '2FA setup initiated. Please scan QR code or enter manual key.'
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/2fa/verify
 * Verify and enable 2FA
 */
router.post('/verify', authenticateToken, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits'),
  body('backupCodes').isArray({ min: 10, max: 10 }).withMessage('Must provide exactly 10 backup codes')
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
    
    const { token, backupCodes } = req.body;
    const userId = req.user.id;
    
    // Verify and enable 2FA
    const result = await verifyAndEnableTwoFactor(userId, token, backupCodes);
    
    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes: backupCodes
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify 2FA',
      code: 'VERIFICATION_FAILED'
    });
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA for authenticated user
 */
router.post('/disable', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
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
    
    const { password } = req.body;
    const userId = req.user.id;
    
    // Disable 2FA
    const result = await disableTwoFactor(userId, password);
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to disable 2FA',
      code: 'DISABLE_FAILED'
    });
  }
});

/**
 * POST /api/2fa/verify-login
 * Verify 2FA token during login
 */
router.post('/verify-login', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('token').notEmpty().withMessage('Token is required')
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
    
    const { userId, token } = req.body;
    
    // Verify 2FA token
    const result = await verifyTwoFactorLogin(userId, token);
    
    if (result.verified) {
      // Set 2FA verified in session
      req.session.twoFactorVerified = true;
      req.session.twoFactorMethod = result.method;
      
      res.json({
        success: true,
        message: '2FA verification successful',
        data: {
          method: result.method
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid 2FA token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA token',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/2fa/status
 * Get 2FA status for authenticated user
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await getTwoFactorStatus(userId);
    
    res.json({
      success: true,
      data: status,
      message: '2FA status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/2fa/regenerate-backup-codes
 * Regenerate backup codes for authenticated user
 */
router.post('/regenerate-backup-codes', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
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
    
    const { password } = req.body;
    const userId = req.user.id;
    
    // Regenerate backup codes
    const result = await regenerateBackupCodes(userId, password);
    
    res.json({
      success: true,
      data: {
        backupCodes: result.backupCodes
      },
      message: 'Backup codes regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to regenerate backup codes',
      code: 'REGENERATION_FAILED'
    });
  }
});

/**
 * GET /api/2fa/backup-codes
 * Get remaining backup codes count
 */
router.get('/backup-codes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await getTwoFactorStatus(userId);
    
    res.json({
      success: true,
      data: {
        remaining: status.backupCodesRemaining,
        hasBackupCodes: status.hasBackupCodes
      },
      message: 'Backup codes status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting backup codes status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup codes status',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/2fa/verify-session
 * Verify 2FA for current session
 */
router.post('/verify-session', authenticateToken, [
  body('token').notEmpty().withMessage('Token is required')
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
    
    const { token } = req.body;
    const userId = req.user.id;
    
    // Verify 2FA token
    const result = await verifyTwoFactorLogin(userId, token);
    
    if (result.verified) {
      // Set 2FA verified in session
      req.session.twoFactorVerified = true;
      req.session.twoFactorMethod = result.method;
      
      res.json({
        success: true,
        message: '2FA session verified successfully',
        data: {
          method: result.method
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid 2FA token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Error verifying 2FA session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA session',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/2fa/logout
 * Logout and clear 2FA session
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Clear 2FA session
    req.session.twoFactorVerified = false;
    req.session.twoFactorMethod = null;
    
    res.json({
      success: true,
      message: '2FA session cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing 2FA session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear 2FA session',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/2fa/required
 * Check if 2FA is required for user
 */
router.get('/required', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await getTwoFactorStatus(userId);
    
    res.json({
      success: true,
      data: {
        required: status.enabled,
        verified: req.session?.twoFactorVerified || false
      },
      message: '2FA requirement status retrieved successfully'
    });
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check 2FA requirement',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
