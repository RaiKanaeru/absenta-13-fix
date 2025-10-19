/**
 * Student Repository - Database operations for students
 * Handles all student-related database queries
 */

import { db } from '../../db.js';

/**
 * Find all students with pagination
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Students with pagination info
 */
export const findAll = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // Apply filters
        if (filters.status) {
            whereClause += ' AND s.status = ?';
            params.push(filters.status);
        }
        
        if (filters.kelas_id) {
            whereClause += ' AND s.kelas_id = ?';
            params.push(filters.kelas_id);
        }
        
        if (filters.jabatan) {
            whereClause += ' AND s.jabatan = ?';
            params.push(filters.jabatan);
        }
        
        if (filters.search) {
            whereClause += ' AND (s.nama LIKE ? OR s.nis LIKE ? OR u.username LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Get total count
        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total 
             FROM siswa s 
             LEFT JOIN users u ON s.user_id = u.id 
             ${whereClause}`,
            params
        );
        const total = countRows[0].total;
        
        // Get students with pagination
        const [rows] = await db.execute(
            `SELECT 
                s.id_siswa as id,
                s.nis,
                s.nama,
                s.alamat,
                s.telepon_orangtua,
                s.telepon_siswa,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                s.created_at,
                s.updated_at,
                u.username,
                u.email,
                u.nomor_telepon as user_no_telepon,
                k.nama_kelas,
                k.id_kelas as kelas_id
             FROM siswa s 
             LEFT JOIN users u ON s.user_id = u.id 
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas 
             ${whereClause} 
             ORDER BY s.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        return {
            students: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('❌ Error finding all students:', error);
        throw error;
    }
};

/**
 * Find student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object|null>} Student object or null
 */
export const findById = async (id) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                s.*,
                u.username,
                u.email,
                u.nama as user_nama,
                u.nomor_telepon as user_no_telepon,
                k.nama_kelas,
                k.id_kelas as kelas_id
             FROM siswa s 
             LEFT JOIN users u ON s.user_id = u.id 
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.id_siswa = ?`,
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding student by ID:', error);
        throw error;
    }
};

/**
 * Find student by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Student object or null
 */
export const findByUserId = async (userId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                s.*,
                u.username,
                u.email,
                u.nama as user_nama,
                u.nomor_telepon as user_no_telepon,
                k.nama_kelas,
                k.id_kelas as kelas_id
             FROM siswa s 
             LEFT JOIN users u ON s.user_id = u.id 
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.user_id = ?`,
            [userId]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding student by user ID:', error);
        throw error;
    }
};

/**
 * Find students by class ID
 * @param {number} kelasId - Class ID
 * @returns {Promise<Array>} Students in the class
 */
export const findByClassId = async (kelasId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                s.id_siswa as id,
                s.nis,
                s.nama,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                u.username,
                u.email
             FROM siswa s 
             LEFT JOIN users u ON s.user_id = u.id 
             WHERE s.kelas_id = ? AND s.status = "aktif" 
             ORDER BY s.nama`,
            [kelasId]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding students by class:', error);
        throw error;
    }
};

/**
 * Create new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student
 */
export const create = async (studentData) => {
    try {
        const {
            nis,
            nama,
            kelas_id,
            user_id,
            alamat,
            telepon_orangtua,
            telepon_siswa,
            jenis_kelamin,
            jabatan,
            status = 'aktif'
        } = studentData;
        
        const [result] = await db.execute(
            `INSERT INTO siswa (nis, nama, kelas_id, user_id, alamat, telepon_orangtua, telepon_siswa, jenis_kelamin, jabatan, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nis, nama, kelas_id, user_id, alamat, telepon_orangtua, telepon_siswa, jenis_kelamin, jabatan, status]
        );
        
        // Return created student
        return await findById(result.insertId);
    } catch (error) {
        console.error('❌ Error creating student:', error);
        throw error;
    }
};

/**
 * Update student by ID
 * @param {number} id - Student ID
 * @param {Object} studentData - Updated student data
 * @returns {Promise<Object|null>} Updated student or null
 */
export const update = async (id, studentData) => {
    try {
        const {
            nis,
            nama,
            kelas_id,
            alamat,
            telepon_orangtua,
            telepon_siswa,
            jenis_kelamin,
            jabatan,
            status
        } = studentData;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        if (nis !== undefined) {
            updateFields.push('nis = ?');
            params.push(nis);
        }
        
        if (nama !== undefined) {
            updateFields.push('nama = ?');
            params.push(nama);
        }
        
        if (kelas_id !== undefined) {
            updateFields.push('kelas_id = ?');
            params.push(kelas_id);
        }
        
        if (alamat !== undefined) {
            updateFields.push('alamat = ?');
            params.push(alamat);
        }
        
        if (telepon_orangtua !== undefined) {
            updateFields.push('telepon_orangtua = ?');
            params.push(telepon_orangtua);
        }
        
        if (telepon_siswa !== undefined) {
            updateFields.push('telepon_siswa = ?');
            params.push(telepon_siswa);
        }
        
        if (jenis_kelamin !== undefined) {
            updateFields.push('jenis_kelamin = ?');
            params.push(jenis_kelamin);
        }
        
        if (jabatan !== undefined) {
            updateFields.push('jabatan = ?');
            params.push(jabatan);
        }
        
        if (status !== undefined) {
            updateFields.push('status = ?');
            params.push(status);
        }
        
        if (updateFields.length === 0) {
            return await findById(id);
        }
        
        updateFields.push('updated_at = NOW()');
        params.push(id);
        
        const [result] = await db.execute(
            `UPDATE siswa SET ${updateFields.join(', ')} WHERE id_siswa = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await findById(id);
    } catch (error) {
        console.error('❌ Error updating student:', error);
        throw error;
    }
};

/**
 * Delete student by ID
 * @param {number} id - Student ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteById = async (id) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM siswa WHERE id_siswa = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        throw error;
    }
};

/**
 * Check if NIS exists
 * @param {string} nis - NIS to check
 * @param {number} excludeId - Student ID to exclude from check
 * @returns {Promise<boolean>} True if exists
 */
export const nisExists = async (nis, excludeId = null) => {
    try {
        let query = 'SELECT id_siswa FROM siswa WHERE nis = ?';
        const params = [nis];
        
        if (excludeId) {
            query += ' AND id_siswa != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Error checking NIS existence:', error);
        throw error;
    }
};

/**
 * Get students by class with attendance status
 * @param {number} kelasId - Class ID
 * @param {number} scheduleId - Schedule ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Array>} Students with attendance status
 */
export const findByClassWithAttendance = async (kelasId, scheduleId, date) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                s.id_siswa as id,
                s.nis,
                s.nama,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                k.nama_kelas,
                COALESCE(a.status, 'Hadir') as attendance_status,
                a.keterangan as attendance_note,
                a.ada_tugas,
                a.terlambat,
                a.waktu_absen
             FROM siswa s
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
             LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                 AND a.jadwal_id = ? 
                 AND a.tanggal = ?
             WHERE s.kelas_id = ? AND s.status = 'aktif'
             ORDER BY s.nama ASC`,
            [scheduleId, date, kelasId]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding students with attendance:', error);
        throw error;
    }
};

/**
 * Get student statistics
 * @returns {Promise<Object>} Student statistics
 */
export const getStatistics = async () => {
    try {
        const [totalStudents] = await db.execute(
            'SELECT COUNT(*) as total FROM siswa'
        );
        
        const [activeStudents] = await db.execute(
            'SELECT COUNT(*) as total FROM siswa WHERE status = "aktif"'
        );
        
        const [studentsByClass] = await db.execute(
            `SELECT 
                k.nama_kelas,
                COUNT(s.id_siswa) as count 
             FROM siswa s 
             LEFT JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.status = "aktif" 
             GROUP BY s.kelas_id, k.nama_kelas`
        );
        
        const [studentsByPosition] = await db.execute(
            `SELECT 
                jabatan,
                COUNT(*) as count 
             FROM siswa 
             WHERE status = "aktif" 
             GROUP BY jabatan`
        );
        
        return {
            total: totalStudents[0].total,
            active: activeStudents[0].total,
            byClass: studentsByClass,
            byPosition: studentsByPosition
        };
    } catch (error) {
        console.error('❌ Error getting student statistics:', error);
        throw error;
    }
};
