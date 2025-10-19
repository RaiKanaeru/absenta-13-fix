/**
 * Teacher Repository - Database operations for teachers
 * Handles all teacher-related database queries
 */

import { db } from '../../db.js';

/**
 * Find all teachers with pagination
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Teachers with pagination info
 */
export const findAll = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // Apply filters
        if (filters.status) {
            whereClause += ' AND g.status = ?';
            params.push(filters.status);
        }
        
        if (filters.mapel_id) {
            whereClause += ' AND g.mapel_id = ?';
            params.push(filters.mapel_id);
        }
        
        if (filters.search) {
            whereClause += ' AND (g.nama LIKE ? OR g.nip LIKE ? OR u.username LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Get total count
        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total 
             FROM guru g 
             LEFT JOIN users u ON g.user_id = u.id 
             ${whereClause}`,
            params
        );
        const total = countRows[0].total;
        
        // Get teachers with pagination
        const [rows] = await db.execute(
            `SELECT 
                g.id_guru as id,
                g.nip,
                g.nama,
                g.no_telp,
                g.alamat,
                g.jenis_kelamin,
                g.status,
                g.created_at,
                g.updated_at,
                u.username,
                u.email,
                u.nomor_telepon as user_no_telepon,
                m.nama_mapel,
                m.kode_mapel
             FROM guru g 
             LEFT JOIN users u ON g.user_id = u.id 
             LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
             ${whereClause} 
             ORDER BY g.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        return {
            teachers: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('❌ Error finding all teachers:', error);
        throw error;
    }
};

/**
 * Find teacher by ID
 * @param {number} id - Teacher ID
 * @returns {Promise<Object|null>} Teacher object or null
 */
export const findById = async (id) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                g.*,
                u.username,
                u.email,
                u.nama as user_nama,
                u.nomor_telepon as user_no_telepon,
                m.nama_mapel,
                m.kode_mapel
             FROM guru g 
             LEFT JOIN users u ON g.user_id = u.id 
             LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
             WHERE g.id_guru = ?`,
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding teacher by ID:', error);
        throw error;
    }
};

/**
 * Find teacher by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Teacher object or null
 */
export const findByUserId = async (userId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                g.*,
                u.username,
                u.email,
                u.nama as user_nama,
                u.nomor_telepon as user_no_telepon,
                m.nama_mapel,
                m.kode_mapel
             FROM guru g 
             LEFT JOIN users u ON g.user_id = u.id 
             LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
             WHERE g.user_id = ?`,
            [userId]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding teacher by user ID:', error);
        throw error;
    }
};

/**
 * Create new teacher
 * @param {Object} teacherData - Teacher data
 * @returns {Promise<Object>} Created teacher
 */
export const create = async (teacherData) => {
    try {
        const {
            nip,
            nama,
            mapel_id,
            user_id,
            no_telp,
            alamat,
            jenis_kelamin,
            status = 'aktif'
        } = teacherData;
        
        const [result] = await db.execute(
            `INSERT INTO guru (nip, nama, mapel_id, user_id, no_telp, alamat, jenis_kelamin, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nip, nama, mapel_id, user_id, no_telp, alamat, jenis_kelamin, status]
        );
        
        // Return created teacher
        return await findById(result.insertId);
    } catch (error) {
        console.error('❌ Error creating teacher:', error);
        throw error;
    }
};

/**
 * Update teacher by ID
 * @param {number} id - Teacher ID
 * @param {Object} teacherData - Updated teacher data
 * @returns {Promise<Object|null>} Updated teacher or null
 */
export const update = async (id, teacherData) => {
    try {
        const {
            nip,
            nama,
            mapel_id,
            no_telp,
            alamat,
            jenis_kelamin,
            status
        } = teacherData;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        if (nip !== undefined) {
            updateFields.push('nip = ?');
            params.push(nip);
        }
        
        if (nama !== undefined) {
            updateFields.push('nama = ?');
            params.push(nama);
        }
        
        if (mapel_id !== undefined) {
            updateFields.push('mapel_id = ?');
            params.push(mapel_id);
        }
        
        if (no_telp !== undefined) {
            updateFields.push('no_telp = ?');
            params.push(no_telp);
        }
        
        if (alamat !== undefined) {
            updateFields.push('alamat = ?');
            params.push(alamat);
        }
        
        if (jenis_kelamin !== undefined) {
            updateFields.push('jenis_kelamin = ?');
            params.push(jenis_kelamin);
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
            `UPDATE guru SET ${updateFields.join(', ')} WHERE id_guru = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await findById(id);
    } catch (error) {
        console.error('❌ Error updating teacher:', error);
        throw error;
    }
};

/**
 * Delete teacher by ID
 * @param {number} id - Teacher ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteById = async (id) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM guru WHERE id_guru = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error deleting teacher:', error);
        throw error;
    }
};

/**
 * Check if NIP exists
 * @param {string} nip - NIP to check
 * @param {number} excludeId - Teacher ID to exclude from check
 * @returns {Promise<boolean>} True if exists
 */
export const nipExists = async (nip, excludeId = null) => {
    try {
        let query = 'SELECT id_guru FROM guru WHERE nip = ?';
        const params = [nip];
        
        if (excludeId) {
            query += ' AND id_guru != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Error checking NIP existence:', error);
        throw error;
    }
};

/**
 * Get teachers by subject
 * @param {number} mapelId - Subject ID
 * @returns {Promise<Array>} Teachers teaching the subject
 */
export const findBySubject = async (mapelId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                g.id_guru as id,
                g.nip,
                g.nama,
                g.no_telp,
                g.status,
                u.username,
                u.email
             FROM guru g 
             LEFT JOIN users u ON g.user_id = u.id 
             WHERE g.mapel_id = ? AND g.status = "aktif" 
             ORDER BY g.nama`,
            [mapelId]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding teachers by subject:', error);
        throw error;
    }
};

/**
 * Get teacher statistics
 * @returns {Promise<Object>} Teacher statistics
 */
export const getStatistics = async () => {
    try {
        const [totalTeachers] = await db.execute(
            'SELECT COUNT(*) as total FROM guru'
        );
        
        const [activeTeachers] = await db.execute(
            'SELECT COUNT(*) as total FROM guru WHERE status = "aktif"'
        );
        
        const [teachersBySubject] = await db.execute(
            `SELECT 
                m.nama_mapel,
                COUNT(g.id_guru) as count 
             FROM guru g 
             LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
             WHERE g.status = "aktif" 
             GROUP BY g.mapel_id, m.nama_mapel`
        );
        
        return {
            total: totalTeachers[0].total,
            active: activeTeachers[0].total,
            bySubject: teachersBySubject
        };
    } catch (error) {
        console.error('❌ Error getting teacher statistics:', error);
        throw error;
    }
};
