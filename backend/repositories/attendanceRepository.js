/**
 * Attendance Repository - Database operations for attendance
 * Handles all attendance-related database queries
 */

import { db } from '../../db.js';

/**
 * Find attendance by schedule and date
 * @param {number} scheduleId - Schedule ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Array>} Attendance records
 */
export const findByScheduleAndDate = async (scheduleId, date) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                a.*,
                s.nama as siswa_nama,
                s.nis,
                k.nama_kelas
             FROM absensi_siswa a
             LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
             WHERE a.jadwal_id = ? AND a.tanggal = ?
             ORDER BY s.nama`,
            [scheduleId, date]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding attendance by schedule and date:', error);
        throw error;
    }
};

/**
 * Find student attendance history
 * @param {number} studentId - Student ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Student attendance history
 */
export const findStudentHistory = async (studentId, startDate, endDate) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                a.*,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                g.nama as guru_nama
             FROM absensi_siswa a
             LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON j.guru_id = g.id_guru
             WHERE a.siswa_id = ? 
                 AND a.tanggal BETWEEN ? AND ?
             ORDER BY a.tanggal DESC, j.jam_mulai`,
            [studentId, startDate, endDate]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding student attendance history:', error);
        throw error;
    }
};

/**
 * Find teacher attendance history
 * @param {number} teacherId - Teacher ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Teacher attendance history
 */
export const findTeacherHistory = async (teacherId, startDate, endDate) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                a.*,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                k.nama_kelas,
                s.nama as siswa_nama,
                s.nis
             FROM absensi_siswa a
             LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
             WHERE a.guru_id = ? 
                 AND a.tanggal BETWEEN ? AND ?
             ORDER BY a.tanggal DESC, j.jam_mulai`,
            [teacherId, startDate, endDate]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding teacher attendance history:', error);
        throw error;
    }
};

/**
 * Create or update attendance record
 * @param {Object} attendanceData - Attendance data
 * @returns {Promise<Object>} Created or updated attendance record
 */
export const createOrUpdate = async (attendanceData) => {
    try {
        const {
            siswa_id,
            jadwal_id,
            tanggal,
            status,
            keterangan,
            guru_id,
            ada_tugas = false,
            terlambat = false,
            waktu_absen
        } = attendanceData;
        
        // Check if attendance already exists
        const [existing] = await db.execute(
            'SELECT id FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
            [siswa_id, jadwal_id, tanggal]
        );
        
        if (existing.length > 0) {
            // Update existing record
            const [result] = await db.execute(
                `UPDATE absensi_siswa SET 
                    status = ?, 
                    keterangan = ?, 
                    guru_id = ?, 
                    ada_tugas = ?, 
                    terlambat = ?, 
                    waktu_absen = ?,
                    updated_at = NOW()
                 WHERE id = ?`,
                [status, keterangan, guru_id, ada_tugas, terlambat, waktu_absen, existing[0].id]
            );
            
            return {
                id: existing[0].id,
                action: 'updated',
                affectedRows: result.affectedRows
            };
        } else {
            // Create new record
            const [result] = await db.execute(
                `INSERT INTO absensi_siswa 
                    (siswa_id, jadwal_id, tanggal, status, keterangan, guru_id, ada_tugas, terlambat, waktu_absen) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [siswa_id, jadwal_id, tanggal, status, keterangan, guru_id, ada_tugas, terlambat, waktu_absen]
            );
            
            return {
                id: result.insertId,
                action: 'created',
                affectedRows: result.affectedRows
            };
        }
    } catch (error) {
        console.error('❌ Error creating/updating attendance:', error);
        throw error;
    }
};

/**
 * Create teacher attendance record
 * @param {Object} teacherAttendanceData - Teacher attendance data
 * @returns {Promise<Object>} Created teacher attendance record
 */
export const createTeacherAttendance = async (teacherAttendanceData) => {
    try {
        const {
            guru_id,
            jadwal_id,
            tanggal,
            status,
            keterangan,
            waktu_absen
        } = teacherAttendanceData;
        
        // Check if teacher attendance already exists
        const [existing] = await db.execute(
            'SELECT id_absensi FROM absensi_guru WHERE guru_id = ? AND jadwal_id = ? AND tanggal = ?',
            [guru_id, jadwal_id, tanggal]
        );
        
        if (existing.length > 0) {
            // Update existing record
            const [result] = await db.execute(
                `UPDATE absensi_guru SET 
                    status = ?, 
                    keterangan = ?, 
                    waktu_absen = ?,
                    updated_at = NOW()
                 WHERE id_absensi = ?`,
                [status, keterangan, waktu_absen, existing[0].id_absensi]
            );
            
            return {
                id: existing[0].id_absensi,
                action: 'updated',
                affectedRows: result.affectedRows
            };
        } else {
            // Create new record
            const [result] = await db.execute(
                `INSERT INTO absensi_guru 
                    (guru_id, jadwal_id, tanggal, status, keterangan, waktu_absen) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [guru_id, jadwal_id, tanggal, status, keterangan, waktu_absen]
            );
            
            return {
                id: result.insertId,
                action: 'created',
                affectedRows: result.affectedRows
            };
        }
    } catch (error) {
        console.error('❌ Error creating teacher attendance:', error);
        throw error;
    }
};

/**
 * Get attendance statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Attendance statistics
 */
export const getStatistics = async (startDate, endDate) => {
    try {
        // Student attendance statistics
        const [studentStats] = await db.execute(
            `SELECT 
                status,
                COUNT(*) as count
             FROM absensi_siswa 
             WHERE tanggal BETWEEN ? AND ?
             GROUP BY status`,
            [startDate, endDate]
        );
        
        // Teacher attendance statistics
        const [teacherStats] = await db.execute(
            `SELECT 
                status,
                COUNT(*) as count
             FROM absensi_guru 
             WHERE tanggal BETWEEN ? AND ?
             GROUP BY status`,
            [startDate, endDate]
        );
        
        // Daily attendance summary
        const [dailyStats] = await db.execute(
            `SELECT 
                tanggal,
                COUNT(*) as total_students,
                SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status = 'Alpa' THEN 1 ELSE 0 END) as alpa
             FROM absensi_siswa 
             WHERE tanggal BETWEEN ? AND ?
             GROUP BY tanggal
             ORDER BY tanggal`,
            [startDate, endDate]
        );
        
        return {
            student: studentStats,
            teacher: teacherStats,
            daily: dailyStats
        };
    } catch (error) {
        console.error('❌ Error getting attendance statistics:', error);
        throw error;
    }
};

/**
 * Get attendance by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Attendance records
 */
export const findByDateRange = async (startDate, endDate, filters = {}) => {
    try {
        let whereClause = 'WHERE a.tanggal BETWEEN ? AND ?';
        const params = [startDate, endDate];
        
        // Apply additional filters
        if (filters.siswa_id) {
            whereClause += ' AND a.siswa_id = ?';
            params.push(filters.siswa_id);
        }
        
        if (filters.guru_id) {
            whereClause += ' AND a.guru_id = ?';
            params.push(filters.guru_id);
        }
        
        if (filters.jadwal_id) {
            whereClause += ' AND a.jadwal_id = ?';
            params.push(filters.jadwal_id);
        }
        
        if (filters.status) {
            whereClause += ' AND a.status = ?';
            params.push(filters.status);
        }
        
        const [rows] = await db.execute(
            `SELECT 
                a.*,
                s.nama as siswa_nama,
                s.nis,
                k.nama_kelas,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                g.nama as guru_nama
             FROM absensi_siswa a
             LEFT JOIN siswa s ON a.siswa_id = s.id_siswa
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
             LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON a.guru_id = g.id_guru
             ${whereClause}
             ORDER BY a.tanggal DESC, j.jam_mulai`,
            params
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding attendance by date range:', error);
        throw error;
    }
};
