// Authentication routes
import express from 'express';
import { authenticateToken, generateToken, verifyPassword } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiting.js';
import { db } from '../../db.js';

const router = express.Router();

// Login endpoint
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user by username
        let users;
        try {
          [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            [username]
          );
        } catch (error) {
          if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({
              success: false,
              error: 'Database not initialized',
              message: 'Please contact administrator to set up the database',
              details: 'Required tables are missing'
            });
          }
          throw error; // Re-throw other database errors
        }

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
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role.toLowerCase(), // Convert role to lowercase for frontend compatibility
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

// Test endpoint for debugging
router.get('/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

export default router;
