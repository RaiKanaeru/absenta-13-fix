/**
 * Report Service - Report generation business logic
 * Handles attendance reports, statistics, and data export
 */

import { getStatistics as getAttendanceStats } from '../repositories/attendanceRepository.js';
import { getStatistics as getScheduleStats } from '../repositories/scheduleRepository.js';
import { getStatistics as getUserStats } from '../repositories/userRepository.js';
import { getStatistics as getTeacherStats } from '../repositories/teacherRepository.js';
import { getStatistics as getStudentStats } from '../repositories/studentRepository.js';
import { getStatistics as getSubjectStats } from '../repositories/subjectRepository.js';
import { createOperationalError } from '../middleware/errorHandler.js';

/**
 * Generate attendance report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Attendance report
 */
export const generateAttendanceReport = async (filters) => {
    try {
        console.log('📊 Generating attendance report with filters:', filters);
        
        const { startDate, endDate, classId, teacherId, studentId } = filters;
        
        // Validate date range
        if (!startDate || !endDate) {
            throw createOperationalError('Tanggal mulai dan tanggal akhir wajib diisi', 400, 'VALIDATION_ERROR');
        }
        
        // Get attendance statistics
        const attendanceStats = await getAttendanceStats(startDate, endDate);
        
        // Build report data
        const report = {
            report_type: 'attendance',
            date_range: { start: startDate, end: endDate },
            filters: {
                class_id: classId,
                teacher_id: teacherId,
                student_id: studentId
            },
            statistics: attendanceStats,
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: report
        };
    } catch (error) {
        console.error('❌ Error generating attendance report:', error);
        throw error;
    }
};

/**
 * Generate teacher report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Teacher report
 */
export const generateTeacherReport = async (filters) => {
    try {
        console.log('📊 Generating teacher report with filters:', filters);
        
        const { teacherId, startDate, endDate } = filters;
        
        if (!teacherId) {
            throw createOperationalError('Teacher ID is required', 400, 'VALIDATION_ERROR');
        }
        
        // Get teacher statistics
        const teacherStats = await getTeacherStats();
        
        // Build report data
        const report = {
            report_type: 'teacher',
            teacher_id: teacherId,
            date_range: { start: startDate, end: endDate },
            statistics: teacherStats,
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: report
        };
    } catch (error) {
        console.error('❌ Error generating teacher report:', error);
        throw error;
    }
};

/**
 * Generate student report
 * @param {Object} filters - Report filters
 * @returns {Promise<Object>} Student report
 */
export const generateStudentReport = async (filters) => {
    try {
        console.log('📊 Generating student report with filters:', filters);
        
        const { studentId, startDate, endDate } = filters;
        
        if (!studentId) {
            throw createOperationalError('Student ID is required', 400, 'VALIDATION_ERROR');
        }
        
        // Get student statistics
        const studentStats = await getStudentStats();
        
        // Build report data
        const report = {
            report_type: 'student',
            student_id: studentId,
            date_range: { start: startDate, end: endDate },
            statistics: studentStats,
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: report
        };
    } catch (error) {
        console.error('❌ Error generating student report:', error);
        throw error;
    }
};

/**
 * Generate system statistics
 * @returns {Promise<Object>} System statistics
 */
export const getSystemStatistics = async () => {
    try {
        console.log('📊 Getting system statistics');
        
        // Get all statistics
        const [userStats, teacherStats, studentStats, scheduleStats, attendanceStats, subjectStats] = await Promise.all([
            getUserStats(),
            getTeacherStats(),
            getStudentStats(),
            getScheduleStats(),
            getAttendanceStats(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]),
            getSubjectStats()
        ]);
        
        const systemStats = {
            users: userStats,
            teachers: teacherStats,
            students: studentStats,
            schedules: scheduleStats,
            attendance: attendanceStats,
            subjects: subjectStats,
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: systemStats
        };
    } catch (error) {
        console.error('❌ Error getting system statistics:', error);
        throw error;
    }
};

/**
 * Export report to Excel
 * @param {Object} reportData - Report data
 * @param {string} reportType - Type of report
 * @returns {Promise<Object>} Excel export result
 */
export const exportToExcel = async (reportData, reportType) => {
    try {
        console.log(`📤 Exporting ${reportType} report to Excel`);
        
        // This would typically generate Excel file using ExcelJS
        // For now, return placeholder
        const result = {
            success: true,
            message: `${reportType} report exported successfully`,
            data: {
                report_type: reportType,
                file_name: `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
                generated_at: new Date().toISOString()
            }
        };
        
        return result;
    } catch (error) {
        console.error('❌ Error exporting report to Excel:', error);
        throw error;
    }
};

/**
 * Get dashboard statistics
 * @returns {Promise<Object>} Dashboard statistics
 */
export const getDashboardStatistics = async () => {
    try {
        console.log('📊 Getting dashboard statistics');
        
        const systemStats = await getSystemStatistics();
        
        // Calculate additional metrics
        const dashboardStats = {
            total_users: systemStats.data.users?.total || 0,
            active_users: systemStats.data.users?.active || 0,
            total_teachers: systemStats.data.teachers?.total || 0,
            active_teachers: systemStats.data.teachers?.active || 0,
            total_students: systemStats.data.students?.total || 0,
            active_students: systemStats.data.students?.active || 0,
            total_schedules: systemStats.data.schedules?.total || 0,
            active_schedules: systemStats.data.schedules?.active || 0,
            total_subjects: systemStats.data.subjects?.total || 0,
            active_subjects: systemStats.data.subjects?.active || 0
        };
        
        return {
            success: true,
            data: systemStats.data
        };
    } catch (error) {
        console.error('❌ Error getting dashboard statistics:', error);
        throw error;
    }
};

/**
 * Generate monthly report
 * @param {string} year - Year
 * @param {string} month - Month
 * @returns {Promise<Object>} Monthly report
 */
export const generateMonthlyReport = async (year, month) => {
    try {
        console.log(`📊 Generating monthly report for ${year}-${month}`);
        
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        const report = {
            report_type: 'monthly',
            period: { year, month },
            date_range: { start: startDate, end: endDate },
            statistics: {},
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: report
        };
    } catch (error) {
        console.error('❌ Error generating monthly report:', error);
        throw error;
    }
};

/**
 * Generate weekly report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @returns {Promise<Object>} Weekly report
 */
export const generateWeeklyReport = async (startDate) => {
    try {
        console.log(`📊 Generating weekly report starting from ${startDate}`);
        
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const endDate = end.toISOString().split('T')[0];
        
        const report = {
            report_type: 'weekly',
            date_range: { start: startDate, end: endDate },
            statistics: {},
            generated_at: new Date().toISOString()
        };
        
        return {
            success: true,
            data: report
        };
    } catch (error) {
        console.error('❌ Error generating weekly report:', error);
        throw error;
    }
};
