/**
 * Report Controller - Report request handlers
 * Handles report generation, statistics, and data export
 */

import { 
    generateAttendanceReport,
    generateTeacherReport,
    generateStudentReport,
    getSystemStatistics,
    getDashboardStatistics,
    generateMonthlyReport,
    generateWeeklyReport,
    exportToExcel
} from '../services/reportService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Generate attendance report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const generateAttendanceReportController = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    
    const result = await generateAttendanceReport(filters);
    
    return sendSuccess(res, result.data, 'Attendance report generated successfully', 200);
});

/**
 * Generate teacher report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const generateTeacherReportController = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    
    const result = await generateTeacherReport(filters);
    
    return sendSuccess(res, result.data, 'Teacher report generated successfully', 200);
});

/**
 * Generate student report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const generateStudentReportController = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    
    const result = await generateStudentReport(filters);
    
    return sendSuccess(res, result.data, 'Student report generated successfully', 200);
});

/**
 * Get system statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getSystemStats = asyncHandler(async (req, res, next) => {
    const result = await getSystemStatistics();
    
    return sendSuccess(res, result.data, 'System statistics retrieved successfully', 200);
});

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getDashboardStats = asyncHandler(async (req, res, next) => {
    const result = await getDashboardStatistics();
    
    return sendSuccess(res, result.data, 'Dashboard statistics retrieved successfully', 200);
});

/**
 * Generate monthly report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const generateMonthlyReportController = asyncHandler(async (req, res, next) => {
    const { year, month } = req.params;
    
    const result = await generateMonthlyReport(year, month);
    
    return sendSuccess(res, result.data, 'Monthly report generated successfully', 200);
});

/**
 * Generate weekly report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const generateWeeklyReportController = asyncHandler(async (req, res, next) => {
    const { startDate } = req.query;
    
    if (!startDate) {
        return sendError(res, 'Start date is required', 400);
    }
    
    const result = await generateWeeklyReport(startDate);
    
    return sendSuccess(res, result.data, 'Weekly report generated successfully', 200);
});

/**
 * Export report to Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const exportReportToExcel = asyncHandler(async (req, res, next) => {
    const { reportType } = req.params;
    const reportData = req.body;
    
    const result = await exportToExcel(reportData, reportType);
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get report templates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getReportTemplates = asyncHandler(async (req, res, next) => {
    const templates = [
        {
            id: 'attendance',
            name: 'Attendance Report',
            description: 'Generate attendance report for specific period',
            parameters: ['startDate', 'endDate', 'classId', 'teacherId']
        },
        {
            id: 'teacher',
            name: 'Teacher Report',
            description: 'Generate teacher performance report',
            parameters: ['teacherId', 'startDate', 'endDate']
        },
        {
            id: 'student',
            name: 'Student Report',
            description: 'Generate student attendance report',
            parameters: ['studentId', 'startDate', 'endDate']
        },
        {
            id: 'monthly',
            name: 'Monthly Report',
            description: 'Generate monthly summary report',
            parameters: ['year', 'month']
        }
    ];
    
    return sendSuccess(res, templates, 'Report templates retrieved successfully', 200);
});

/**
 * Get report history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getReportHistory = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;
    
    // This would typically query report history from database
    // For now, return placeholder
    const history = {
        reports: [],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
        }
    };
    
    return sendSuccess(res, history, 'Report history retrieved successfully', 200);
});
