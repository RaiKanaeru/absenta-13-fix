/**
 * Two-Factor Authentication Middleware untuk Absenta System
 * Implementasi 2FA menggunakan TOTP (Time-based One-Time Password)
 */

import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '../../db.js';

/**
 * 2FA Configuration
 */
export const twoFactorConfig = {
  issuer: 'Absenta System',
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 1,
  encoding: 'base32'
};

/**
 * Generate 2FA Secret for User
 */
export const generateTwoFactorSecret = (userId, username) => {
  const secret = speakeasy.generateSecret({
    name: `${username} (${twoFactorConfig.issuer})`,
    issuer: twoFactorConfig.issuer,
    length: 32
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url,
    manualEntryKey: secret.base32
  };
};

/**
 * Generate QR Code for 2FA Setup
 */
export const generateQRCode = async (secret) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(secret);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify TOTP Token
 */
export const verifyTOTPToken = (token, secret) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: twoFactorConfig.encoding,
      token: token,
      window: twoFactorConfig.window,
      time: Math.floor(Date.now() / 1000)
    });

    return {
      verified,
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return {
      verified: false,
      error: error.message
    };
  }
};

/**
 * Generate Backup Codes
 */
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Hash Backup Codes for Storage
 */
export const hashBackupCodes = (codes) => {
  return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
};

/**
 * Verify Backup Code
 */
export const verifyBackupCode = (code, hashedCodes) => {
  const hashedCode = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  return hashedCodes.includes(hashedCode);
};

/**
 * Setup 2FA for User
 */
export const setupTwoFactor = async (userId, username) => {
  try {
    // Generate 2FA secret
    const twoFactorData = generateTwoFactorSecret(userId, username);
    
    // Generate QR code
    const qrCodeDataURL = await generateQRCode(twoFactorData.qrCodeUrl);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = hashBackupCodes(backupCodes);
    
    // Store in database (temporary until verified)
    await db.execute(
      'UPDATE pengguna SET two_factor_secret = ?, two_factor_enabled = FALSE WHERE id = ?',
      [twoFactorData.secret, userId]
    );
    
    return {
      secret: twoFactorData.secret,
      qrCodeUrl: twoFactorData.qrCodeUrl,
      qrCodeDataURL,
      backupCodes,
      manualEntryKey: twoFactorData.manualEntryKey
    };
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    throw new Error('Failed to setup 2FA');
  }
};

/**
 * Verify and Enable 2FA
 */
export const verifyAndEnableTwoFactor = async (userId, token, backupCodes) => {
  try {
    // Get user's 2FA secret
    const [users] = await db.execute(
      'SELECT two_factor_secret FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const secret = users[0].two_factor_secret;
    if (!secret) {
      throw new Error('2FA secret not found');
    }
    
    // Verify TOTP token
    const verification = verifyTOTPToken(token, secret);
    if (!verification.verified) {
      throw new Error('Invalid 2FA token');
    }
    
    // Hash backup codes
    const hashedBackupCodes = hashBackupCodes(backupCodes);
    
    // Enable 2FA and store backup codes
    await db.execute(
      'UPDATE pengguna SET two_factor_enabled = TRUE, two_factor_backup_codes = ? WHERE id = ?',
      [JSON.stringify(hashedBackupCodes), userId]
    );
    
    return {
      success: true,
      message: '2FA enabled successfully'
    };
  } catch (error) {
    console.error('Error verifying and enabling 2FA:', error);
    throw error;
  }
};

/**
 * Disable 2FA for User
 */
export const disableTwoFactor = async (userId, password) => {
  try {
    // Verify user password first
    const [users] = await db.execute(
      'SELECT password FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, users[0].password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // Disable 2FA
    await db.execute(
      'UPDATE pengguna SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_backup_codes = NULL WHERE id = ?',
      [userId]
    );
    
    return {
      success: true,
      message: '2FA disabled successfully'
    };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    throw error;
  }
};

/**
 * Verify 2FA Token for Login
 */
export const verifyTwoFactorLogin = async (userId, token) => {
  try {
    // Get user's 2FA data
    const [users] = await db.execute(
      'SELECT two_factor_enabled, two_factor_secret, two_factor_backup_codes FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const user = users[0];
    
    // Check if 2FA is enabled
    if (!user.two_factor_enabled) {
      return {
        verified: true,
        method: 'none',
        message: '2FA not enabled'
      };
    }
    
    // Check if token is a backup code
    if (user.two_factor_backup_codes) {
      const backupCodes = JSON.parse(user.two_factor_backup_codes);
      const isBackupCode = verifyBackupCode(token, backupCodes);
      
      if (isBackupCode) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(code => 
          !verifyBackupCode(token, [code])
        );
        
        await db.execute(
          'UPDATE pengguna SET two_factor_backup_codes = ? WHERE id = ?',
          [JSON.stringify(updatedCodes), userId]
        );
        
        return {
          verified: true,
          method: 'backup_code',
          message: 'Backup code verified'
        };
      }
    }
    
    // Verify TOTP token
    if (user.two_factor_secret) {
      const verification = verifyTOTPToken(token, user.two_factor_secret);
      if (verification.verified) {
        return {
          verified: true,
          method: 'totp',
          message: 'TOTP token verified'
        };
      }
    }
    
    return {
      verified: false,
      method: 'invalid',
      message: 'Invalid 2FA token'
    };
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    throw error;
  }
};

/**
 * Get 2FA Status for User
 */
export const getTwoFactorStatus = async (userId) => {
  try {
    const [users] = await db.execute(
      'SELECT two_factor_enabled, two_factor_backup_codes FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const user = users[0];
    const backupCodes = user.two_factor_backup_codes ? 
      JSON.parse(user.two_factor_backup_codes) : [];
    
    return {
      enabled: user.two_factor_enabled,
      backupCodesRemaining: backupCodes.length,
      hasBackupCodes: backupCodes.length > 0
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    throw error;
  }
};

/**
 * Regenerate Backup Codes
 */
export const regenerateBackupCodes = async (userId, password) => {
  try {
    // Verify user password
    const [users] = await db.execute(
      'SELECT password FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, users[0].password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = hashBackupCodes(backupCodes);
    
    // Update database
    await db.execute(
      'UPDATE pengguna SET two_factor_backup_codes = ? WHERE id = ?',
      [JSON.stringify(hashedBackupCodes), userId]
    );
    
    return {
      success: true,
      backupCodes,
      message: 'Backup codes regenerated successfully'
    };
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw error;
  }
};

/**
 * 2FA Middleware for Protected Routes
 */
export const requireTwoFactor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  // Check if 2FA is enabled for user
  if (req.user.two_factor_enabled) {
    // Check if 2FA is verified in this session
    if (!req.session?.twoFactorVerified) {
      return res.status(403).json({
        success: false,
        message: 'Two-factor authentication required',
        code: 'TWO_FACTOR_REQUIRED',
        requiresTwoFactor: true
      });
    }
  }
  
  next();
};

/**
 * 2FA Verification Middleware
 */
export const verifyTwoFactorSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Check if 2FA is enabled
    const status = await getTwoFactorStatus(req.user.id);
    if (status.enabled) {
      // Check if 2FA is verified in this session
      if (!req.session?.twoFactorVerified) {
        return res.status(403).json({
          success: false,
          message: 'Two-factor authentication required',
          code: 'TWO_FACTOR_REQUIRED',
          requiresTwoFactor: true
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error verifying 2FA session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export default {
  twoFactorConfig,
  generateTwoFactorSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  setupTwoFactor,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorLogin,
  getTwoFactorStatus,
  regenerateBackupCodes,
  requireTwoFactor,
  verifyTwoFactorSession
};
