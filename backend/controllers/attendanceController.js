/**
 * Attendance Controller - Attendance request handlers
 * Handles attendance submission, queries, and statistics
 */

import { 
    submitAttendance, 
    getStudentAttendance, 
    getStudentAttendanceHistory,
    getTeacherAttendanceHistory,
    getAttendanceStatistics,
    validateAttendanceData
} from '../services/attendanceService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Submit attendance for a schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const submitScheduleAttendance = asyncHandler(async (req, res, next) => {
    const { scheduleId, attendance, notes, ada_tugas, terlambat } = req.body;
    const guruId = req.user.guru_id;
    
    if (!guruId) {
        return sendError(res, 'Teacher ID not found in token', 400);
    }
    
    // Validate attendance data
    const validation = await validateAttendanceData({
        scheduleId,
        attendance,
        guruId
    });
    
    if (!validation.isValid) {
        return sendError(res, 'Invalid attendance data', 400, validation.errors);
    }
    
    const result = await submitAttendance({
        scheduleId,
        attendance,
        notes,
        guruId,
        ada_tugas,
        terlambat
    });
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get student attendance for a schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getScheduleStudentAttendance = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { date } = req.query;
    
    const currentDate = date || new Date().toISOString().split('T')[0];
    
    const students = await getStudentAttendance(id, currentDate);
    
    return sendSuccess(res, students, 'Student attendance retrieved successfully', 200);
});

/**
 * Get student attendance history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentAttendanceHistoryController = asyncHandler(async (req, res, next) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return sendError(res, 'Start date and end date are required', 400);
    }
    
    const result = await getStudentAttendanceHistory(studentId, startDate, endDate);
    
    return sendSuccess(res, result, 'Student attendance history retrieved successfully', 200);
});

/**
 * Get teacher attendance history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getTeacherAttendanceHistoryController = asyncHandler(async (req, res, next) => {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return sendError(res, 'Start date and end date are required', 400);
    }
    
    const result = await getTeacherAttendanceHistory(teacherId, startDate, endDate);
    
    return sendSuccess(res, result, 'Teacher attendance history retrieved successfully', 200);
});

/**
 * Get attendance statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAttendanceStats = asyncHandler(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return sendError(res, 'Start date and end date are required', 400);
    }
    
    const result = await getAttendanceStatistics(startDate, endDate);
    
    return sendSuccess(res, result, 'Attendance statistics retrieved successfully', 200);
});

/**
 * Get class attendance summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getClassAttendanceSummary = asyncHandler(async (req, res, next) => {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return sendError(res, 'Start date and end date are required', 400);
    }
    
    // This would typically call attendanceService.getClassAttendanceSummary()
    // For now, return placeholder
    const summary = {
        class_id: classId,
        date_range: { start: startDate, end: endDate },
        total_students: 0,
        attendance_rate: 0,
        by_status: {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0
        }
    };
    
    return sendSuccess(res, summary, 'Class attendance summary retrieved successfully', 200);
});

/**
 * Get daily attendance report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getDailyAttendanceReport = asyncHandler(async (req, res, next) => {
    const { date } = req.query;
    
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    // This would typically call attendanceService.getDailyAttendanceReport()
    // For now, return placeholder
    const report = {
        date: reportDate,
        total_classes: 0,
        total_students: 0,
        attendance_summary: {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpa: 0
        },
        classes: []
    };
    
    return sendSuccess(res, report, 'Daily attendance report retrieved successfully', 200);
});

/**
 * Get attendance trends
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAttendanceTrends = asyncHandler(async (req, res, next) => {
    const { startDate, endDate, groupBy } = req.query; // groupBy: 'day', 'week', 'month'
    
    if (!startDate || !endDate) {
        return sendError(res, 'Start date and end date are required', 400);
    }
    
    // This would typically call attendanceService.getAttendanceTrends()
    // For now, return placeholder
    const trends = {
        date_range: { start: startDate, end: endDate },
        group_by: groupBy || 'day',
        trends: []
    };
    
    return sendSuccess(res, trends, 'Attendance trends retrieved successfully', 200);
});
