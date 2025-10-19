/**
 * Teacher Controller - Teacher request handlers
 * Handles teacher info, schedule, and attendance operations
 */

import { getUserInfo, updateProfile } from '../services/userService.js';
import { getSchedulesByTeacher } from '../services/scheduleService.js';
import { getStudentAttendance, submitAttendance } from '../services/attendanceService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get teacher info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getTeacherInfo = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    const teacherInfo = await getUserInfo(userId, 'guru');
    
    return sendSuccess(res, teacherInfo, 'Teacher info retrieved successfully', 200);
});

/**
 * Update teacher profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateTeacherProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { nama, email, no_telepon, mata_pelajaran } = req.body;
    
    const result = await updateProfile(userId, {
        nama,
        email,
        no_telepon,
        mata_pelajaran
    }, 'guru');
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get teacher schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getTeacherSchedule = asyncHandler(async (req, res, next) => {
    const teacherId = req.user.guru_id;
    
    if (!teacherId) {
        return sendError(res, 'Teacher ID not found in token', 400);
    }
    
    const result = await getSchedulesByTeacher(teacherId);
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get students for a specific schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getStudentsForSchedule = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { date } = req.query;
    
    const currentDate = date || new Date().toISOString().split('T')[0];
    
    const students = await getStudentAttendance(id, currentDate);
    
    return sendSuccess(res, students, 'Students retrieved successfully', 200);
});

/**
 * Submit attendance for a schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const submitTeacherAttendance = asyncHandler(async (req, res, next) => {
    const { scheduleId, attendance, notes, ada_tugas, terlambat } = req.body;
    const guruId = req.user.guru_id;
    
    if (!guruId) {
        return sendError(res, 'Teacher ID not found in token', 400);
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
 * Get teacher attendance history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getTeacherAttendanceHistory = asyncHandler(async (req, res, next) => {
    const teacherId = req.user.guru_id;
    const { startDate, endDate } = req.query;
    
    if (!teacherId) {
        return sendError(res, 'Teacher ID not found in token', 400);
    }
    
    // This would typically call attendanceService.getTeacherAttendanceHistory()
    // For now, return placeholder
    const history = {
        teacher_id: teacherId,
        date_range: { start: startDate, end: endDate },
        total_records: 0,
        records: []
    };
    
    return sendSuccess(res, history, 'Teacher attendance history retrieved successfully', 200);
});

/**
 * Get teacher dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    // This would typically call userService.getDashboardData(userId, 'guru')
    // For now, return placeholder
    const dashboardData = {
        user: req.user,
        stats: {
            total_classes: 0,
            total_students: 0,
            attendance_today: 0
        },
        recent_activity: []
    };
    
    return sendSuccess(res, dashboardData, 'Teacher dashboard data retrieved successfully', 200);
});
