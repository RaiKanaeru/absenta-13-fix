/**
 * Password Policy Middleware untuk Absenta System
 * Implementasi strong password policy dan validation
 */

import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

/**
 * Password Strength Requirements
 */
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  forbiddenPatterns: [
    /password/i,
    /123456/i,
    /qwerty/i,
    /admin/i,
    /user/i,
    /login/i,
    /absenta/i
  ],
  maxRepeatingChars: 3,
  maxSequentialChars: 3
};

/**
 * Password Strength Checker
 */
export const checkPasswordStrength = (password) => {
  const errors = [];
  const warnings = [];
  
  // Length check
  if (password.length < passwordRequirements.minLength) {
    errors.push(`Password harus minimal ${passwordRequirements.minLength} karakter`);
  }
  
  if (password.length > passwordRequirements.maxLength) {
    errors.push(`Password maksimal ${passwordRequirements.maxLength} karakter`);
  }
  
  // Character type checks
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }
  
  if (passwordRequirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }
  
  if (passwordRequirements.requireSpecialChars) {
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (!specialChars.test(password)) {
      errors.push('Password harus mengandung minimal 1 karakter khusus');
    }
    
    const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []).length;
    if (specialCharCount < passwordRequirements.minSpecialChars) {
      errors.push(`Password harus mengandung minimal ${passwordRequirements.minSpecialChars} karakter khusus`);
    }
  }
  
  // Forbidden patterns check
  for (const pattern of passwordRequirements.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('Password tidak boleh mengandung kata-kata yang mudah ditebak');
    }
  }
  
  // Repeating characters check
  const repeatingChars = /(.)\1{2,}/;
  if (repeatingChars.test(password)) {
    errors.push(`Password tidak boleh mengandung karakter yang berulang lebih dari ${passwordRequirements.maxRepeatingChars} kali`);
  }
  
  // Sequential characters check
  const sequentialPatterns = [
    /123|234|345|456|567|678|789/,
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i,
    /qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm/i
  ];
  
  for (const pattern of sequentialPatterns) {
    if (pattern.test(password)) {
      warnings.push('Password mengandung karakter berurutan yang mudah ditebak');
    }
  }
  
  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'hello', 'login', 'princess',
    'rockyou', '1234567890', 'password1', '123123', 'welcome123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password terlalu umum dan mudah ditebak');
  }
  
  // Calculate strength score
  let strengthScore = 0;
  
  // Length score (0-25 points)
  if (password.length >= 12) strengthScore += 25;
  else if (password.length >= 8) strengthScore += 15;
  else if (password.length >= 6) strengthScore += 10;
  
  // Character variety score (0-25 points)
  let varietyScore = 0;
  if (/[a-z]/.test(password)) varietyScore += 5;
  if (/[A-Z]/.test(password)) varietyScore += 5;
  if (/[0-9]/.test(password)) varietyScore += 5;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) varietyScore += 10;
  strengthScore += varietyScore;
  
  // Complexity score (0-25 points)
  let complexityScore = 0;
  const specialCharCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []).length;
  if (specialCharCount >= 3) complexityScore += 15;
  else if (specialCharCount >= 2) complexityScore += 10;
  else if (specialCharCount >= 1) complexityScore += 5;
  
  const numberCount = (password.match(/[0-9]/g) || []).length;
  if (numberCount >= 3) complexityScore += 10;
  else if (numberCount >= 2) complexityScore += 5;
  
  strengthScore += complexityScore;
  
  // Uniqueness score (0-25 points)
  const uniqueChars = new Set(password.toLowerCase()).size;
  const uniquenessRatio = uniqueChars / password.length;
  if (uniquenessRatio >= 0.8) strengthScore += 25;
  else if (uniquenessRatio >= 0.6) strengthScore += 15;
  else if (uniquenessRatio >= 0.4) strengthScore += 10;
  
  // Determine strength level
  let strengthLevel = 'weak';
  if (strengthScore >= 80) strengthLevel = 'very-strong';
  else if (strengthScore >= 60) strengthLevel = 'strong';
  else if (strengthScore >= 40) strengthLevel = 'medium';
  else if (strengthScore >= 20) strengthLevel = 'weak';
  else strengthLevel = 'very-weak';
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strengthScore,
    strengthLevel,
    requirements: passwordRequirements
  };
};

/**
 * Password Validation Middleware
 */
export const validatePassword = [
  body('password')
    .isLength({ min: passwordRequirements.minLength, max: passwordRequirements.maxLength })
    .withMessage(`Password harus ${passwordRequirements.minLength}-${passwordRequirements.maxLength} karakter`)
    .custom((value) => {
      const result = checkPasswordStrength(value);
      if (!result.isValid) {
        throw new Error(result.errors.join(', '));
      }
      return true;
    }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Password tidak memenuhi kriteria keamanan',
        errors: errors.array(),
        code: 'PASSWORD_POLICY_VIOLATION'
      });
    }
    next();
  }
];

/**
 * Password Strength Checker Middleware
 */
export const checkPasswordStrengthMiddleware = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return next();
  }
  
  const result = checkPasswordStrength(password);
  
  // Add strength info to request
  req.passwordStrength = result;
  
  // If password is too weak, return error
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password tidak memenuhi kriteria keamanan',
      errors: result.errors,
      warnings: result.warnings,
      strengthScore: result.strengthScore,
      strengthLevel: result.strengthLevel,
      code: 'PASSWORD_POLICY_VIOLATION'
    });
  }
  
  next();
};

/**
 * Password Hashing with Salt Rounds
 */
export const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Password Verification
 */
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Password History Check
 * Mencegah penggunaan password yang sama dalam 5 password terakhir
 */
export const checkPasswordHistory = async (userId, newPassword, db) => {
  try {
    // Get password history (last 5 passwords)
    const [history] = await db.execute(
      'SELECT password FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    
    // Check if new password matches any previous password
    for (const record of history) {
      const isMatch = await verifyPassword(newPassword, record.password);
      if (isMatch) {
        return {
          isValid: false,
          message: 'Password tidak boleh sama dengan 5 password sebelumnya'
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error checking password history:', error);
    return { isValid: true }; // Allow if history check fails
  }
};

/**
 * Save Password to History
 */
export const savePasswordHistory = async (userId, hashedPassword, db) => {
  try {
    await db.execute(
      'INSERT INTO password_history (user_id, password, created_at) VALUES (?, ?, NOW())',
      [userId, hashedPassword]
    );
    
    // Keep only last 5 passwords
    await db.execute(
      'DELETE FROM password_history WHERE user_id = ? AND id NOT IN (SELECT id FROM (SELECT id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5) AS keep)',
      [userId, userId]
    );
  } catch (error) {
    console.error('Error saving password history:', error);
  }
};

/**
 * Password Expiry Check
 */
export const checkPasswordExpiry = async (userId, db) => {
  try {
    const [result] = await db.execute(
      'SELECT password_changed_at FROM pengguna WHERE id = ?',
      [userId]
    );
    
    if (result.length === 0) {
      return { isExpired: false };
    }
    
    const passwordChangedAt = new Date(result[0].password_changed_at);
    const now = new Date();
    const daysSinceChange = Math.floor((now - passwordChangedAt) / (1000 * 60 * 60 * 24));
    
    const maxAge = parseInt(process.env.PASSWORD_MAX_AGE_DAYS) || 90; // 90 days default
    
    return {
      isExpired: daysSinceChange >= maxAge,
      daysSinceChange,
      maxAge,
      daysRemaining: maxAge - daysSinceChange
    };
  } catch (error) {
    console.error('Error checking password expiry:', error);
    return { isExpired: false };
  }
};

/**
 * Password Reset Requirements
 */
export const passwordResetRequirements = {
  minTimeBetweenResets: 15 * 60 * 1000, // 15 minutes
  maxResetsPerDay: 3,
  resetTokenExpiry: 30 * 60 * 1000 // 30 minutes
};

/**
 * Check Password Reset Limits
 */
export const checkPasswordResetLimits = async (userId, db) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check resets today
    const [todayResets] = await db.execute(
      'SELECT COUNT(*) as count FROM password_reset_attempts WHERE user_id = ? AND DATE(created_at) = DATE(?)',
      [userId, today]
    );
    
    if (todayResets[0].count >= passwordResetRequirements.maxResetsPerDay) {
      return {
        canReset: false,
        message: 'Maksimal 3 reset password per hari',
        resetCount: todayResets[0].count,
        maxResets: passwordResetRequirements.maxResetsPerDay
      };
    }
    
    // Check time since last reset
    const [lastReset] = await db.execute(
      'SELECT created_at FROM password_reset_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (lastReset.length > 0) {
      const lastResetTime = new Date(lastReset[0].created_at);
      const timeSinceLastReset = now - lastResetTime;
      
      if (timeSinceLastReset < passwordResetRequirements.minTimeBetweenResets) {
        const remainingTime = Math.ceil((passwordResetRequirements.minTimeBetweenResets - timeSinceLastReset) / (1000 * 60));
        return {
          canReset: false,
          message: `Tunggu ${remainingTime} menit sebelum reset password lagi`,
          remainingTime
        };
      }
    }
    
    return { canReset: true };
  } catch (error) {
    console.error('Error checking password reset limits:', error);
    return { canReset: true };
  }
};

/**
 * Log Password Reset Attempt
 */
export const logPasswordResetAttempt = async (userId, ip, userAgent, db) => {
  try {
    await db.execute(
      'INSERT INTO password_reset_attempts (user_id, ip_address, user_agent, created_at) VALUES (?, ?, ?, NOW())',
      [userId, ip, userAgent]
    );
  } catch (error) {
    console.error('Error logging password reset attempt:', error);
  }
};

/**
 * Password Policy Configuration
 */
export const passwordPolicyConfig = {
  requirements: passwordRequirements,
  resetRequirements: passwordResetRequirements,
  
  // Get policy info for frontend
  getPolicyInfo: () => ({
    minLength: passwordRequirements.minLength,
    maxLength: passwordRequirements.maxLength,
    requireUppercase: passwordRequirements.requireUppercase,
    requireLowercase: passwordRequirements.requireLowercase,
    requireNumbers: passwordRequirements.requireNumbers,
    requireSpecialChars: passwordRequirements.requireSpecialChars,
    minSpecialChars: passwordRequirements.minSpecialChars,
    maxRepeatingChars: passwordRequirements.maxRepeatingChars,
    maxSequentialChars: passwordRequirements.maxSequentialChars,
    maxAge: parseInt(process.env.PASSWORD_MAX_AGE_DAYS) || 90,
    maxResetsPerDay: passwordResetRequirements.maxResetsPerDay,
    minTimeBetweenResets: passwordResetRequirements.minTimeBetweenResets / (1000 * 60) // in minutes
  })
};

export default {
  checkPasswordStrength,
  validatePassword,
  checkPasswordStrengthMiddleware,
  hashPassword,
  verifyPassword,
  checkPasswordHistory,
  savePasswordHistory,
  checkPasswordExpiry,
  checkPasswordResetLimits,
  logPasswordResetAttempt,
  passwordPolicyConfig
};
