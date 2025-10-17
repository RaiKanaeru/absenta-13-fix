/**
 * Account Lockout Middleware
 * Melindungi sistem dari serangan brute force dengan mengunci akun
 * setelah beberapa percobaan login yang gagal
 */

import { db } from '../db.js';

// Konfigurasi lockout
const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,           // Maksimal percobaan login
  LOCKOUT_DURATION: 15,      // Durasi lockout dalam menit
  WINDOW_DURATION: 30,       // Window waktu untuk menghitung percobaan dalam menit
  PERMANENT_LOCKOUT_AFTER: 10 // Lockout permanen setelah berapa kali lockout
};

/**
 * Cek apakah akun terkunci
 * @param {string} username - Username yang akan dicek
 * @param {string} ipAddress - IP address pengguna
 * @returns {Promise<Object>} Status lockout
 */
export async function checkAccountLockout(username, ipAddress) {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (LOCKOUT_CONFIG.WINDOW_DURATION * 60 * 1000));
    
    // Cek lockout berdasarkan username
    const [userLockouts] = await db.execute(`
      SELECT * FROM account_lockouts 
      WHERE username = ? AND locked_until > ?
      ORDER BY created_at DESC 
      LIMIT 1
    `, [username, now]);

    if (userLockouts.length > 0) {
      const lockout = userLockouts[0];
      const remainingTime = Math.ceil((new Date(lockout.locked_until) - now) / 60000);
      
      return {
        isLocked: true,
        reason: 'account_locked',
        message: `Akun terkunci. Coba lagi dalam ${remainingTime} menit.`,
        lockedUntil: lockout.locked_until,
        attempts: lockout.attempt_count
      };
    }

    // Cek lockout berdasarkan IP
    const [ipLockouts] = await db.execute(`
      SELECT * FROM account_lockouts 
      WHERE ip_address = ? AND locked_until > ?
      ORDER BY created_at DESC 
      LIMIT 1
    `, [ipAddress, now]);

    if (ipLockouts.length > 0) {
      const lockout = ipLockouts[0];
      const remainingTime = Math.ceil((new Date(lockout.locked_until) - now) / 60000);
      
      return {
        isLocked: true,
        reason: 'ip_locked',
        message: `IP address terkunci. Coba lagi dalam ${remainingTime} menit.`,
        lockedUntil: lockout.locked_until,
        attempts: lockout.attempt_count
      };
    }

    return { isLocked: false };
  } catch (error) {
    console.error('Error checking account lockout:', error);
    return { isLocked: false };
  }
}

/**
 * Record failed login attempt
 * @param {string} username - Username yang gagal login
 * @param {string} ipAddress - IP address pengguna
 * @param {string} reason - Alasan kegagalan
 * @returns {Promise<Object>} Status lockout setelah record
 */
export async function recordFailedAttempt(username, ipAddress, reason = 'invalid_credentials') {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (LOCKOUT_CONFIG.WINDOW_DURATION * 60 * 1000));
    
    // Hitung percobaan dalam window waktu
    const [recentAttempts] = await db.execute(`
      SELECT COUNT(*) as attempt_count FROM login_attempts 
      WHERE (username = ? OR ip_address = ?) 
      AND created_at > ? 
      AND success = 0
    `, [username, ipAddress, windowStart]);

    const attemptCount = recentAttempts[0].attempt_count + 1;

    // Record attempt
    await db.execute(`
      INSERT INTO login_attempts (username, ip_address, success, reason, created_at)
      VALUES (?, ?, 0, ?, ?)
    `, [username, ipAddress, reason, now]);

    // Cek apakah perlu lockout
    if (attemptCount >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
      const lockoutDuration = LOCKOUT_CONFIG.LOCKOUT_DURATION;
      const lockedUntil = new Date(now.getTime() + (lockoutDuration * 60 * 1000));
      
      // Cek apakah ini lockout berulang
      const [previousLockouts] = await db.execute(`
        SELECT COUNT(*) as lockout_count FROM account_lockouts 
        WHERE username = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, [username]);

      const lockoutCount = previousLockouts[0].lockout_count;
      const isPermanent = lockoutCount >= LOCKOUT_CONFIG.PERMANENT_LOCKOUT_AFTER;

      // Buat lockout record
      await db.execute(`
        INSERT INTO account_lockouts (username, ip_address, attempt_count, locked_until, is_permanent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [username, ipAddress, attemptCount, lockedUntil, isPermanent, now]);

      return {
        isLocked: true,
        isPermanent,
        message: isPermanent 
          ? 'Akun terkunci permanen karena terlalu banyak percobaan login yang gagal. Hubungi administrator.'
          : `Akun terkunci selama ${lockoutDuration} menit karena terlalu banyak percobaan login yang gagal.`,
        lockedUntil,
        attempts: attemptCount
      };
    }

    return {
      isLocked: false,
      attempts: attemptCount,
      remainingAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS - attemptCount
    };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    return { isLocked: false };
  }
}

/**
 * Record successful login attempt
 * @param {string} username - Username yang berhasil login
 * @param {string} ipAddress - IP address pengguna
 */
export async function recordSuccessfulAttempt(username, ipAddress) {
  try {
    const now = new Date();
    
    // Record successful attempt
    await db.execute(`
      INSERT INTO login_attempts (username, ip_address, success, reason, created_at)
      VALUES (?, ?, 1, 'success', ?)
    `, [username, ipAddress, now]);

    // Clear any existing lockouts for this user
    await db.execute(`
      UPDATE account_lockouts 
      SET locked_until = NOW() 
      WHERE username = ? AND locked_until > NOW()
    `, [username]);

  } catch (error) {
    console.error('Error recording successful attempt:', error);
  }
}

/**
 * Middleware untuk mengecek lockout sebelum login
 */
export function accountLockoutMiddleware() {
  return async (req, res, next) => {
    try {
      const { username } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (!username) {
        return next();
      }

      const lockoutStatus = await checkAccountLockout(username, ipAddress);
      
      if (lockoutStatus.isLocked) {
        return res.status(423).json({
          success: false,
          message: lockoutStatus.message,
          code: 'ACCOUNT_LOCKED',
          data: {
            lockedUntil: lockoutStatus.lockedUntil,
            attempts: lockoutStatus.attempts,
            reason: lockoutStatus.reason
          }
        });
      }

      req.lockoutInfo = {
        username,
        ipAddress,
        lockoutStatus
      };

      next();
    } catch (error) {
      console.error('Account lockout middleware error:', error);
      next();
    }
  };
}

/**
 * Unlock account manually (untuk admin)
 * @param {string} username - Username yang akan di-unlock
 * @param {string} adminUsername - Username admin yang melakukan unlock
 */
export async function unlockAccount(username, adminUsername) {
  try {
    await db.execute(`
      UPDATE account_lockouts 
      SET locked_until = NOW(), unlocked_by = ?, unlocked_at = NOW()
      WHERE username = ? AND locked_until > NOW()
    `, [adminUsername, username]);

    // Log unlock action
    await db.execute(`
      INSERT INTO login_attempts (username, ip_address, success, reason, created_at)
      VALUES (?, 'SYSTEM', 1, 'account_unlocked_by_admin', NOW())
    `, [username]);

    return {
      success: true,
      message: `Akun ${username} berhasil di-unlock`
    };
  } catch (error) {
    console.error('Error unlocking account:', error);
    return {
      success: false,
      message: 'Gagal meng-unlock akun'
    };
  }
}

/**
 * Get lockout statistics
 */
export async function getLockoutStats() {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_lockouts,
        COUNT(CASE WHEN is_permanent = 1 THEN 1 END) as permanent_lockouts,
        COUNT(CASE WHEN locked_until > NOW() THEN 1 END) as active_lockouts,
        COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as lockouts_24h
      FROM account_lockouts
    `);

    const [recentAttempts] = await db.execute(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed_attempts,
        COUNT(CASE WHEN success = 1 THEN 1 END) as successful_attempts,
        COUNT(CASE WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as attempts_24h
      FROM login_attempts
    `);

    return {
      lockouts: stats[0],
      attempts: recentAttempts[0]
    };
  } catch (error) {
    console.error('Error getting lockout stats:', error);
    return null;
  }
}

export default {
  checkAccountLockout,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  accountLockoutMiddleware,
  unlockAccount,
  getLockoutStats
};
