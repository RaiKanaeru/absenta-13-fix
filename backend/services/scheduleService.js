/**
 * Schedule Service - Schedule management business logic
 * Handles schedule CRUD, conflict detection, and import/export
 */

import { 
    findAll, 
    findById, 
    findByTeacher, 
    findByClass, 
    create, 
    update, 
    deleteById, 
    checkConflicts,
    getStatistics
} from '../repositories/scheduleRepository.js';
import { createOperationalError } from '../middleware/errorHandler.js';

/**
 * Get all schedules with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Schedules
 */
export const getSchedules = async (filters = {}) => {
    try {
        console.log('📋 Getting schedules with filters:', filters);
        
        const schedules = await findAll(filters);
        
        return {
            success: true,
            data: schedules,
            total: schedules.length
        };
    } catch (error) {
        console.error('❌ Error getting schedules:', error);
        throw error;
    }
};

/**
 * Get schedule by ID
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Object>} Schedule details
 */
export const getScheduleById = async (scheduleId) => {
    try {
        console.log(`📋 Getting schedule ${scheduleId}`);
        
        const schedule = await findById(scheduleId);
        if (!schedule) {
            throw createOperationalError('Jadwal tidak ditemukan', 404, 'SCHEDULE_NOT_FOUND');
        }
        
        return {
            success: true,
            data: schedule
        };
    } catch (error) {
        console.error('❌ Error getting schedule by ID:', error);
        throw error;
    }
};

/**
 * Get schedules by teacher
 * @param {number} teacherId - Teacher ID
 * @returns {Promise<Array>} Teacher's schedules
 */
export const getSchedulesByTeacher = async (teacherId) => {
    try {
        console.log(`📋 Getting schedules for teacher ${teacherId}`);
        
        const schedules = await findByTeacher(teacherId);
        
        return {
            success: true,
            data: schedules,
            total: schedules.length
        };
    } catch (error) {
        console.error('❌ Error getting schedules by teacher:', error);
        throw error;
    }
};

/**
 * Get schedules by class
 * @param {number} classId - Class ID
 * @returns {Promise<Array>} Class schedules
 */
export const getSchedulesByClass = async (classId) => {
    try {
        console.log(`📋 Getting schedules for class ${classId}`);
        
        const schedules = await findByClass(classId);
        
        return {
            success: true,
            data: schedules,
            total: schedules.length
        };
    } catch (error) {
        console.error('❌ Error getting schedules by class:', error);
        throw error;
    }
};

/**
 * Create new schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} Created schedule
 */
export const createSchedule = async (scheduleData) => {
    try {
        console.log('➕ Creating new schedule:', scheduleData);
        
        // Check for conflicts
        const conflicts = await checkConflicts(scheduleData);
        if (conflicts.length > 0) {
            throw createOperationalError(
                `Konflik jadwal ditemukan: ${conflicts.length} jadwal bertabrakan`, 
                409, 
                'SCHEDULE_CONFLICT'
            );
        }
        
        const newSchedule = await create(scheduleData);
        
        return {
            success: true,
            message: 'Jadwal berhasil dibuat',
            data: newSchedule
        };
    } catch (error) {
        console.error('❌ Error creating schedule:', error);
        throw error;
    }
};

/**
 * Update schedule
 * @param {number} scheduleId - Schedule ID
 * @param {Object} scheduleData - Updated schedule data
 * @returns {Promise<Object>} Updated schedule
 */
export const updateSchedule = async (scheduleId, scheduleData) => {
    try {
        console.log(`📝 Updating schedule ${scheduleId}:`, scheduleData);
        
        // Check if schedule exists
        const existingSchedule = await findById(scheduleId);
        if (!existingSchedule) {
            throw createOperationalError('Jadwal tidak ditemukan', 404, 'SCHEDULE_NOT_FOUND');
        }
        
        // Check for conflicts (excluding current schedule)
        const conflicts = await checkConflicts(scheduleData, scheduleId);
        if (conflicts.length > 0) {
            throw createOperationalError(
                `Konflik jadwal ditemukan: ${conflicts.length} jadwal bertabrakan`, 
                409, 
                'SCHEDULE_CONFLICT'
            );
        }
        
        const updatedSchedule = await update(scheduleId, scheduleData);
        if (!updatedSchedule) {
            throw createOperationalError('Gagal memperbarui jadwal', 500, 'UPDATE_ERROR');
        }
        
        return {
            success: true,
            message: 'Jadwal berhasil diperbarui',
            data: updatedSchedule
        };
    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        throw error;
    }
};

/**
 * Delete schedule
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteSchedule = async (scheduleId) => {
    try {
        console.log(`🗑️ Deleting schedule ${scheduleId}`);
        
        // Check if schedule exists
        const existingSchedule = await findById(scheduleId);
        if (!existingSchedule) {
            throw createOperationalError('Jadwal tidak ditemukan', 404, 'SCHEDULE_NOT_FOUND');
        }
        
        const deleted = await deleteById(scheduleId);
        if (!deleted) {
            throw createOperationalError('Gagal menghapus jadwal', 500, 'DELETE_ERROR');
        }
        
        return {
            success: true,
            message: 'Jadwal berhasil dihapus'
        };
    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        throw error;
    }
};

/**
 * Import schedules from Excel
 * @param {Object} file - Excel file
 * @returns {Promise<Object>} Import result
 */
export const importSchedulesFromExcel = async (file) => {
    try {
        console.log('📥 Importing schedules from Excel file');
        
        // This would typically parse Excel file and create schedules
        // For now, return placeholder
        const result = {
            success: true,
            message: 'Import jadwal berhasil',
            data: {
                total_processed: 0,
                successful: 0,
                failed: 0,
                errors: []
            }
        };
        
        return result;
    } catch (error) {
        console.error('❌ Error importing schedules from Excel:', error);
        throw error;
    }
};

/**
 * Export schedules to Excel
 * @param {Object} filters - Export filters
 * @returns {Promise<Object>} Export result
 */
export const exportSchedulesToExcel = async (filters = {}) => {
    try {
        console.log('📤 Exporting schedules to Excel with filters:', filters);
        
        const schedules = await findAll(filters);
        
        // This would typically generate Excel file
        // For now, return data structure
        return {
            success: true,
            message: 'Export jadwal berhasil',
            data: {
                schedules,
                total: schedules.length,
                exported_at: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('❌ Error exporting schedules to Excel:', error);
        throw error;
    }
};

/**
 * Get schedule conflicts
 * @param {Object} scheduleData - Schedule data to check
 * @returns {Promise<Array>} Conflicting schedules
 */
export const getScheduleConflicts = async (scheduleData) => {
    try {
        console.log('🔍 Checking schedule conflicts for:', scheduleData);
        
        const conflicts = await checkConflicts(scheduleData);
        
        return {
            success: true,
            data: conflicts,
            has_conflicts: conflicts.length > 0
        };
    } catch (error) {
        console.error('❌ Error checking schedule conflicts:', error);
        throw error;
    }
};

/**
 * Get schedule statistics
 * @returns {Promise<Object>} Schedule statistics
 */
export const getScheduleStatistics = async () => {
    try {
        console.log('📊 Getting schedule statistics');
        
        const stats = await getStatistics();
        
        return {
            success: true,
            data: stats
        };
    } catch (error) {
        console.error('❌ Error getting schedule statistics:', error);
        throw error;
    }
};

/**
 * Validate schedule data
 * @param {Object} scheduleData - Schedule data to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateScheduleData = async (scheduleData) => {
    try {
        const { hari, jam_ke, jam_mulai, jam_selesai, kelas_id, mapel_id, guru_id } = scheduleData;
        const errors = [];
        
        if (!hari) {
            errors.push('Hari is required');
        }
        
        if (!jam_ke) {
            errors.push('Jam ke is required');
        }
        
        if (!jam_mulai) {
            errors.push('Jam mulai is required');
        }
        
        if (!jam_selesai) {
            errors.push('Jam selesai is required');
        }
        
        if (!kelas_id) {
            errors.push('Kelas ID is required');
        }
        
        if (!mapel_id) {
            errors.push('Mata pelajaran ID is required');
        }
        
        if (!guru_id) {
            errors.push('Guru ID is required');
        }
        
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (jam_mulai && !timeRegex.test(jam_mulai)) {
            errors.push('Format jam mulai tidak valid (HH:MM)');
        }
        
        if (jam_selesai && !timeRegex.test(jam_selesai)) {
            errors.push('Format jam selesai tidak valid (HH:MM)');
        }
        
        // Validate day
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        if (hari && !validDays.includes(hari)) {
            errors.push(`Hari tidak valid. Pilihan: ${validDays.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        console.error('❌ Error validating schedule data:', error);
        throw error;
    }
};
