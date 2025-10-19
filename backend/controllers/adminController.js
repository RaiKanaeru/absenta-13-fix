/**
 * Admin Controller - Admin request handlers
 * Handles admin info, user management, and system operations
 */

import { getUserInfo, updateProfile } from '../services/userService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get admin info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAdminInfo = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    const adminInfo = await getUserInfo(userId, 'admin');
    
    return sendSuccess(res, adminInfo, 'Admin info retrieved successfully', 200);
});

/**
 * Update admin profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateAdminProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { nama, username, email, no_telepon } = req.body;
    
    const result = await updateProfile(userId, {
        nama,
        username,
        email,
        no_telepon
    }, 'admin');
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get all users (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
    // This would typically call userService.getAllUsers()
    // For now, return placeholder
    const users = [];
    
    return sendSuccess(res, users, 'Users retrieved successfully', 200);
});

/**
 * Get user by ID (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getUserById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // This would typically call userService.getUserById(id)
    // For now, return placeholder
    const user = null;
    
    if (!user) {
        return sendNotFound(res, 'User');
    }
    
    return sendSuccess(res, user, 'User retrieved successfully', 200);
});

/**
 * Create new user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createUser = asyncHandler(async (req, res, next) => {
    const userData = req.body;
    
    // This would typically call userService.createUser(userData)
    // For now, return placeholder
    const result = {
        success: true,
        message: 'User created successfully',
        data: userData
    };
    
    return sendSuccess(res, result.data, result.message, 201);
});

/**
 * Update user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userData = req.body;
    
    // This would typically call userService.updateUser(id, userData)
    // For now, return placeholder
    const result = {
        success: true,
        message: 'User updated successfully',
        data: userData
    };
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Delete user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // This would typically call userService.deleteUser(id)
    // For now, return placeholder
    const result = {
        success: true,
        message: 'User deleted successfully'
    };
    
    return sendSuccess(res, null, result.message, 200);
});

/**
 * Get system statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getSystemStats = asyncHandler(async (req, res, next) => {
    // This would typically call reportService.getSystemStatistics()
    // For now, return placeholder
    const stats = {
        total_users: 0,
        total_teachers: 0,
        total_students: 0,
        total_schedules: 0,
        system_status: 'active'
    };
    
    return sendSuccess(res, stats, 'System statistics retrieved successfully', 200);
});

/**
 * Get dashboard data (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getDashboardData = asyncHandler(async (req, res, next) => {
    // This would typically call userService.getDashboardData(userId, 'admin')
    // For now, return placeholder
    const dashboardData = {
        user: req.user,
        stats: {
            total_users: 0,
            total_teachers: 0,
            total_students: 0,
            system_status: 'active'
        },
        recent_activity: []
    };
    
    return sendSuccess(res, dashboardData, 'Dashboard data retrieved successfully', 200);
});
