// Authentication routes
import express from 'express';
import { authenticateToken, generateToken, verifyPassword } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiting.js';
import { accountLockoutMiddleware, recordFailedAttempt, recordSuccessfulAttempt } from '../middleware/accountLockout.js';
import { db } from '../db.js';

const router = express.Router();

// Login endpoint
router.post('/login', loginLimiter, accountLockoutMiddleware(), validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user by username
    const [users] = await db.execute(
      'SELECT * FROM pengguna WHERE nama_pengguna = ? AND status = "aktif"',
      [username]
    );

    if (users.length === 0) {
      // Record failed attempt for non-existent user
      await recordFailedAttempt(username, ipAddress, 'user_not_found');
      
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.kata_sandi);
    if (!isValidPassword) {
      // Record failed attempt
      const lockoutResult = await recordFailedAttempt(username, ipAddress, 'invalid_password');
      
      // Check if account is now locked
      if (lockoutResult.isLocked) {
        return res.status(423).json({
          success: false,
          error: lockoutResult.message,
          code: 'ACCOUNT_LOCKED',
          data: {
            lockedUntil: lockoutResult.lockedUntil,
            attempts: lockoutResult.attempts,
            isPermanent: lockoutResult.isPermanent
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        data: {
          remainingAttempts: lockoutResult.remainingAttempts
        }
      });
    }

    // Record successful login
    await recordSuccessfulAttempt(username, ipAddress);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.nama_pengguna,
          nama: user.nama,
          role: user.peran,
          email: user.email
        },
        token
      },
      message: 'Success'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  // JWT is stateless, so logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    },
    message: 'Token is valid'
  });
});

export default router;
