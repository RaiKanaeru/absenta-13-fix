/**
 * Attendance Service - Attendance business logic
 * Handles attendance submission, queries, and statistics
 */

import { 
    findByScheduleAndDate, 
    createOrUpdate, 
    createTeacherAttendance,
    findStudentHistory,
    findTeacherHistory,
    getStatistics
} from '../repositories/attendanceRepository.js';
import { findByClassWithAttendance } from '../repositories/studentRepository.js';
import { findById as findScheduleById } from '../repositories/scheduleRepository.js';
import { createOperationalError } from '../middleware/errorHandler.js';

/**
 * Submit attendance for a schedule
 * @param {Object} attendanceData - Attendance submission data
 * @returns {Promise<Object>} Submission result
 */
export const submitAttendance = async (attendanceData) => {
    try {
        const { 
            scheduleId, 
            attendance, 
            notes = {}, 
            guruId, 
            ada_tugas = {}, 
            terlambat = {} 
        } = attendanceData;
        
        console.log(`📝 Submitting attendance for schedule ${scheduleId} by teacher ${guruId}`);
        
        if (!scheduleId || !attendance || !guruId) {
            throw createOperationalError('Data absensi tidak lengkap', 400, 'VALIDATION_ERROR');
        }

        // Get schedule details to verify it exists
        const schedule = await findScheduleById(scheduleId);
        if (!schedule) {
            throw createOperationalError('Jadwal tidak ditemukan', 404, 'SCHEDULE_NOT_FOUND');
        }

        const { kelas_id, mapel_id, guru_id, guru_ids, is_multi_guru } = schedule;
        
        // Determine all teachers involved
        let allGuruIds = [];
        if (guru_ids && is_multi_guru) {
            allGuruIds = JSON.parse(guru_ids);
        } else {
            allGuruIds = [guru_id];
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toISOString().slice(11, 19);
        const results = [];

        // Process each student attendance
        for (const [studentId, status] of Object.entries(attendance)) {
            const note = notes[studentId] || '';
            const studentAdaTugas = ada_tugas[studentId] || false;
            const studentTerlambat = terlambat[studentId] || false;
            
            // Validate status
            const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen'];
            if (!validStatuses.includes(status)) {
                throw createOperationalError(
                    `Status tidak valid: ${status}. Status yang diperbolehkan: ${validStatuses.join(', ')}`, 
                    400, 
                    'INVALID_STATUS'
                );
            }
            
            console.log(`👤 Processing student ${studentId}: status="${status}", note="${note}", ada_tugas=${studentAdaTugas}, terlambat=${studentTerlambat}`);
            
            // Create or update attendance record
            const attendanceRecord = {
                siswa_id: studentId,
                jadwal_id: scheduleId,
                tanggal: currentDate,
                status,
                keterangan: note,
                guru_id,
                ada_tugas: studentAdaTugas,
                terlambat: studentTerlambat,
                waktu_absen: `${currentDate} ${currentTime}`
            };
            
            const result = await createOrUpdate(attendanceRecord);
            results.push({
                student_id: studentId,
                status,
                action: result.action,
                attendance_id: result.id
            });
        }

        // Create teacher attendance records for all teachers
        console.log(`🔄 Creating teacher attendance for ${allGuruIds.length} teachers: ${allGuruIds.join(', ')}`);
        
        for (const currentGuruId of allGuruIds) {
            const teacherAttendanceData = {
                guru_id: currentGuruId,
                jadwal_id: scheduleId,
                tanggal: currentDate,
                status: 'Hadir', // Teacher is present when submitting attendance
                keterangan: 'Hadir mengajar',
                waktu_absen: `${currentDate} ${currentTime}`
            };
            
            await createTeacherAttendance(teacherAttendanceData);
        }

        console.log(`✅ Attendance submitted successfully for ${results.length} students`);
        
        return {
            success: true,
            message: 'Absensi berhasil disimpan',
            data: {
                schedule_id: scheduleId,
                date: currentDate,
                students_processed: results.length,
                results
            }
        };
    } catch (error) {
        console.error('❌ Error submitting attendance:', error);
        throw error;
    }
};

/**
 * Get student attendance for a schedule
 * @param {number} scheduleId - Schedule ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Array>} Student attendance list
 */
export const getStudentAttendance = async (scheduleId, date) => {
    try {
        console.log(`👥 Getting student attendance for schedule ${scheduleId} on ${date}`);
        
        // Get schedule details
        const schedule = await findScheduleById(scheduleId);
        if (!schedule) {
            throw createOperationalError('Jadwal tidak ditemukan', 404, 'SCHEDULE_NOT_FOUND');
        }

        // Get students with attendance status
        const students = await findByClassWithAttendance(schedule.kelas_id, scheduleId, date);
        
        return students;
    } catch (error) {
        console.error('❌ Error getting student attendance:', error);
        throw error;
    }
};

/**
 * Get student attendance history
 * @param {number} studentId - Student ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Student attendance history
 */
export const getStudentAttendanceHistory = async (studentId, startDate, endDate) => {
    try {
        console.log(`📋 Getting attendance history for student ${studentId} from ${startDate} to ${endDate}`);
        
        const history = await findStudentHistory(studentId, startDate, endDate);
        
        return {
            student_id: studentId,
            date_range: { start: startDate, end: endDate },
            total_records: history.length,
            records: history
        };
    } catch (error) {
        console.error('❌ Error getting student attendance history:', error);
        throw error;
    }
};

/**
 * Get teacher attendance history
 * @param {number} teacherId - Teacher ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Teacher attendance history
 */
export const getTeacherAttendanceHistory = async (teacherId, startDate, endDate) => {
    try {
        console.log(`📋 Getting attendance history for teacher ${teacherId} from ${startDate} to ${endDate}`);
        
        const history = await findTeacherHistory(teacherId, startDate, endDate);
        
        return {
            teacher_id: teacherId,
            date_range: { start: startDate, end: endDate },
            total_records: history.length,
            records: history
        };
    } catch (error) {
        console.error('❌ Error getting teacher attendance history:', error);
        throw error;
    }
};

/**
 * Get attendance statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Attendance statistics
 */
export const getAttendanceStatistics = async (startDate, endDate) => {
    try {
        console.log(`📊 Getting attendance statistics from ${startDate} to ${endDate}`);
        
        const stats = await getStatistics(startDate, endDate);
        
        return {
            date_range: { start: startDate, end: endDate },
            statistics: stats
        };
    } catch (error) {
        console.error('❌ Error getting attendance statistics:', error);
        throw error;
    }
};

/**
 * Get attendance summary for a class
 * @param {number} classId - Class ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Class attendance summary
 */
export const getClassAttendanceSummary = async (classId, startDate, endDate) => {
    try {
        console.log(`📊 Getting attendance summary for class ${classId} from ${startDate} to ${endDate}`);
        
        // This would typically aggregate attendance data by class
        // For now, return placeholder data
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
        
        return summary;
    } catch (error) {
        console.error('❌ Error getting class attendance summary:', error);
        throw error;
    }
};

/**
 * Validate attendance data
 * @param {Object} attendanceData - Attendance data to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateAttendanceData = async (attendanceData) => {
    try {
        const { scheduleId, attendance, guruId } = attendanceData;
        const errors = [];
        
        if (!scheduleId) {
            errors.push('Schedule ID is required');
        }
        
        if (!attendance || typeof attendance !== 'object') {
            errors.push('Attendance data is required');
        }
        
        if (!guruId) {
            errors.push('Teacher ID is required');
        }
        
        // Validate each student's attendance status
        if (attendance) {
            const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen'];
            for (const [studentId, status] of Object.entries(attendance)) {
                if (!validStatuses.includes(status)) {
                    errors.push(`Invalid status "${status}" for student ${studentId}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        console.error('❌ Error validating attendance data:', error);
        throw error;
    }
};
