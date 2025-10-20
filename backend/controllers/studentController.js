/**
 * Student Controller - Student request handlers
 * Handles student info, schedule, and attendance history
 */

import { getUserInfo, updateProfile } from '../services/userService.js';
import { getSchedulesByClass } from '../services/scheduleService.js';
import { getStudentAttendanceHistory as fetchStudentAttendanceHistory } from '../services/attendanceService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get student info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentInfo = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    const studentInfo = await getUserInfo(userId, 'siswa');
    
    return sendSuccess(res, studentInfo, 'Student info retrieved successfully', 200);
});

/**
 * Update student profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateStudentProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { nama, email, no_telepon, alamat } = req.body;
    
    const result = await updateProfile(userId, {
        nama,
        email,
        no_telepon,
        alamat
    }, 'siswa');
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get student schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentSchedule = asyncHandler(async (req, res, next) => {
    const kelasId = req.user.kelas_id;
    
    if (!kelasId) {
        return sendError(res, 'Class ID not found in token', 400);
    }
    
    const result = await getSchedulesByClass(kelasId);
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get student attendance history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentAttendanceHistory = asyncHandler(async (req, res, next) => {
    const siswaId = req.user.siswa_id;
    const { startDate, endDate } = req.query;
    
    if (!siswaId) {
        return sendError(res, 'Student ID not found in token', 400);
    }
    
    const defaultEndDate = endDate || new Date().toISOString().split('T')[0];
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const result = await fetchStudentAttendanceHistory(siswaId, defaultStartDate, defaultEndDate);
    
    return sendSuccess(res, result, 'Student attendance history retrieved successfully', 200);
});

/**
 * Get student dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentDashboard = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    // This would typically call userService.getDashboardData(userId, 'siswa')
    // For now, return placeholder
    const dashboardData = {
        user: req.user,
        stats: {
            attendance_rate: 0,
            total_classes: 0,
            upcoming_classes: 0
        },
        recent_activity: []
    };
    
    return sendSuccess(res, dashboardData, 'Student dashboard data retrieved successfully', 200);
});

/**
 * Get student attendance summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentAttendanceSummary = asyncHandler(async (req, res, next) => {
    const siswaId = req.user.siswa_id;
    const { period } = req.query; // 'week', 'month', 'semester'
    
    if (!siswaId) {
        return sendError(res, 'Student ID not found in token', 400);
    }
    
    // Calculate date range based on period
    let startDate, endDate;
    const today = new Date();
    
    switch (period) {
        case 'week':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = today;
            break;
        case 'month':
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = today;
            break;
        case 'semester':
            startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
            endDate = today;
            break;
        default:
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = today;
    }
    
    const result = await fetchStudentAttendanceHistory(
        siswaId, 
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0]
    );
    
    // Calculate summary statistics
    const summary = {
        student_id: siswaId,
        period,
        date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        },
        total_records: result.total_records,
        attendance_rate: 0, // Would calculate from records
        by_status: {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0
        }
    };
    
    return sendSuccess(res, summary, 'Student attendance summary retrieved successfully', 200);
});
