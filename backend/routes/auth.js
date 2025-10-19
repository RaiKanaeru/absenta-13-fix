// Authentication routes
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiting.js';
import { 
    loginUser, 
    logoutUser, 
    verifyUserToken, 
    refreshUserToken, 
    clearToken, 
    debugJWT 
} from '../controllers/authController.js';

const router = express.Router();

// Login endpoint
router.post('/login', loginLimiter, validateLogin, loginUser);

// Logout endpoint
router.post('/logout', authenticateToken, logoutUser);

// Verify token endpoint
router.get('/verify', authenticateToken, verifyUserToken);

// Refresh token endpoint
router.post('/refresh', authenticateToken, refreshUserToken);

// Clear token endpoint (for debugging)
router.post('/clear-token', clearToken);

// Debug JWT endpoint
router.post('/debug-jwt', debugJWT);

// Test endpoint for debugging
router.get('/test-auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

export default router;
