/**
 * Auth Controller - Authentication request handlers
 * Handles login, logout, and token verification
 */

import { login, logout, verifyToken, refreshToken } from '../services/authService.js';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const loginUser = asyncHandler(async (req, res, next) => {
    const { username, password } = req.body;
    
    const result = await login(username, password);
    
    // Set cookie
    res.cookie('token', result.token, { 
        httpOnly: true, 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return sendSuccess(res, result, result.message, 200);
});

/**
 * User logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const logoutUser = asyncHandler(async (req, res, next) => {
    res.clearCookie('token');
    
    const result = logout();
    return sendSuccess(res, result, result.message, 200);
});

/**
 * Verify token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const verifyUserToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    
    if (!token) {
        return sendUnauthorized(res, 'Token tidak ditemukan');
    }
    
    const decoded = await verifyToken(token);
    
    return sendSuccess(res, { user: decoded }, 'Token valid', 200);
});

/**
 * Refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const refreshUserToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    
    if (!token) {
        return sendUnauthorized(res, 'Token tidak ditemukan');
    }
    
    const result = await refreshToken(token);
    
    // Update cookie
    res.cookie('token', result.token, { 
        httpOnly: true, 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    });
    
    return sendSuccess(res, result, result.message, 200);
});

/**
 * Clear token (for debugging)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const clearToken = asyncHandler(async (req, res, next) => {
    res.clearCookie('token');
    
    return sendSuccess(res, null, 'Token berhasil dihapus', 200);
});

/**
 * Debug JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const debugJWT = asyncHandler(async (req, res, next) => {
    const { token } = req.body;
    
    if (!token) {
        return sendError(res, 'Token diperlukan', 400);
    }
    
    let jwtModule;
    
    try {
        jwtModule = await import('jsonwebtoken');
        const decoded = jwtModule.default.decode(token, { complete: true });
        const isValid = jwtModule.default.verify(token, process.env.JWT_SECRET);
        
        return sendSuccess(res, {
            decoded,
            isValid,
            secret: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'Not set'
        }, 'JWT debug info', 200);
    } catch (error) {
        // Use jwtModule if available, otherwise use fallback
        const decoded = jwtModule ? jwtModule.default.decode(token, { complete: true }) : null;
        
        return sendSuccess(res, {
            error: error.message,
            decoded,
            secret: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'Not set'
        }, 'JWT debug info (error)', 200);
    }
});
