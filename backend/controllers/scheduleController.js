/**
 * Schedule Controller - Schedule request handlers
 * Handles schedule CRUD, import/export, and conflict checking
 */

import { 
    getSchedules, 
    getScheduleById, 
    getSchedulesByTeacher, 
    getSchedulesByClass,
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    getScheduleConflicts,
    getScheduleStatistics,
    validateScheduleData
} from '../services/scheduleService.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseHelper.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all schedules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getAllSchedules = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    
    const result = await getSchedules(filters);
    
    return sendSuccess(res, result.data, 'Schedules retrieved successfully', 200);
});

/**
 * Get schedule by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getScheduleByIdController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const result = await getScheduleById(id);
    
    return sendSuccess(res, result.data, 'Schedule retrieved successfully', 200);
});

/**
 * Get schedules by teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getSchedulesByTeacherController = asyncHandler(async (req, res, next) => {
    const { teacherId } = req.params;
    
    const result = await getSchedulesByTeacher(teacherId);
    
    return sendSuccess(res, result.data, 'Teacher schedules retrieved successfully', 200);
});

/**
 * Get schedules by class
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getSchedulesByClassController = asyncHandler(async (req, res, next) => {
    const { classId } = req.params;
    
    const result = await getSchedulesByClass(classId);
    
    return sendSuccess(res, result.data, 'Class schedules retrieved successfully', 200);
});

/**
 * Create new schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createScheduleController = asyncHandler(async (req, res, next) => {
    const scheduleData = req.body;
    
    // Validate schedule data
    const validation = await validateScheduleData(scheduleData);
    if (!validation.isValid) {
        return sendError(res, 'Invalid schedule data', 400, validation.errors);
    }
    
    const result = await createSchedule(scheduleData);
    
    return sendSuccess(res, result.data, result.message, 201);
});

/**
 * Update schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const updateScheduleController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const scheduleData = req.body;
    
    // Validate schedule data
    const validation = await validateScheduleData(scheduleData);
    if (!validation.isValid) {
        return sendError(res, 'Invalid schedule data', 400, validation.errors);
    }
    
    const result = await updateSchedule(id, scheduleData);
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Delete schedule
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const deleteScheduleController = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const result = await deleteSchedule(id);
    
    return sendSuccess(res, null, result.message, 200);
});

/**
 * Check schedule conflicts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const checkScheduleConflicts = asyncHandler(async (req, res, next) => {
    const scheduleData = req.body;
    
    const result = await getScheduleConflicts(scheduleData);
    
    return sendSuccess(res, result.data, 'Schedule conflicts checked successfully', 200);
});

/**
 * Import schedules from Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const importSchedules = asyncHandler(async (req, res, next) => {
    const file = req.file;
    
    if (!file) {
        return sendError(res, 'Excel file is required', 400);
    }
    
    // This would typically call scheduleService.importSchedulesFromExcel(file)
    // For now, return placeholder
    const result = {
        success: true,
        message: 'Schedules imported successfully',
        data: {
            total_processed: 0,
            successful: 0,
            failed: 0,
            errors: []
        }
    };
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Export schedules to Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const exportSchedules = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    
    // This would typically call scheduleService.exportSchedulesToExcel(filters)
    // For now, return placeholder
    const result = {
        success: true,
        message: 'Schedules exported successfully',
        data: {
            schedules: [],
            total: 0,
            exported_at: new Date().toISOString()
        }
    };
    
    return sendSuccess(res, result.data, result.message, 200);
});

/**
 * Get schedule statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getScheduleStats = asyncHandler(async (req, res, next) => {
    const result = await getScheduleStatistics();
    
    return sendSuccess(res, result.data, 'Schedule statistics retrieved successfully', 200);
});

/**
 * Get schedule template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getScheduleTemplate = asyncHandler(async (req, res, next) => {
    // This would typically call excelService.createExcelTemplate('schedule')
    // For now, return placeholder
    const template = {
        success: true,
        message: 'Schedule template generated successfully',
        data: {
            filename: 'schedule_template.xlsx',
            size: 0
        }
    };
    
    return sendSuccess(res, template.data, template.message, 200);
});
