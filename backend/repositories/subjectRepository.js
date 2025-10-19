/**
 * Subject Repository - Database operations for subjects
 * Handles all subject-related database queries
 */

import { db } from '../../db.js';

/**
 * Find all subjects
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Subjects
 */
export const findAll = async (filters = {}) => {
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // Apply filters
        if (filters.status) {
            whereClause += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.search) {
            whereClause += ' AND (nama_mapel LIKE ? OR kode_mapel LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        const [rows] = await db.execute(
            `SELECT 
                id_mapel as id,
                kode_mapel,
                nama_mapel,
                deskripsi,
                status,
                created_at,
                updated_at
             FROM mapel 
             ${whereClause}
             ORDER BY nama_mapel`,
            params
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding all subjects:', error);
        throw error;
    }
};

/**
 * Find subject by ID
 * @param {number} id - Subject ID
 * @returns {Promise<Object|null>} Subject object or null
 */
export const findById = async (id) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM mapel WHERE id_mapel = ?',
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding subject by ID:', error);
        throw error;
    }
};

/**
 * Find subject by code
 * @param {string} code - Subject code
 * @returns {Promise<Object|null>} Subject object or null
 */
export const findByCode = async (code) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM mapel WHERE kode_mapel = ?',
            [code]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding subject by code:', error);
        throw error;
    }
};

/**
 * Create new subject
 * @param {Object} subjectData - Subject data
 * @returns {Promise<Object>} Created subject
 */
export const create = async (subjectData) => {
    try {
        const {
            kode_mapel,
            nama_mapel,
            deskripsi,
            status = 'aktif'
        } = subjectData;
        
        const [result] = await db.execute(
            `INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi, status) 
             VALUES (?, ?, ?, ?)`,
            [kode_mapel, nama_mapel, deskripsi, status]
        );
        
        // Return created subject
        return await findById(result.insertId);
    } catch (error) {
        console.error('❌ Error creating subject:', error);
        throw error;
    }
};

/**
 * Update subject by ID
 * @param {number} id - Subject ID
 * @param {Object} subjectData - Updated subject data
 * @returns {Promise<Object|null>} Updated subject or null
 */
export const update = async (id, subjectData) => {
    try {
        const {
            kode_mapel,
            nama_mapel,
            deskripsi,
            status
        } = subjectData;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        if (kode_mapel !== undefined) {
            updateFields.push('kode_mapel = ?');
            params.push(kode_mapel);
        }
        
        if (nama_mapel !== undefined) {
            updateFields.push('nama_mapel = ?');
            params.push(nama_mapel);
        }
        
        if (deskripsi !== undefined) {
            updateFields.push('deskripsi = ?');
            params.push(deskripsi);
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
            `UPDATE mapel SET ${updateFields.join(', ')} WHERE id_mapel = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await findById(id);
    } catch (error) {
        console.error('❌ Error updating subject:', error);
        throw error;
    }
};

/**
 * Delete subject by ID
 * @param {number} id - Subject ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteById = async (id) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM mapel WHERE id_mapel = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error deleting subject:', error);
        throw error;
    }
};

/**
 * Check if subject code exists
 * @param {string} code - Subject code to check
 * @param {number} excludeId - Subject ID to exclude from check
 * @returns {Promise<boolean>} True if exists
 */
export const codeExists = async (code, excludeId = null) => {
    try {
        let query = 'SELECT id_mapel FROM mapel WHERE kode_mapel = ?';
        const params = [code];
        
        if (excludeId) {
            query += ' AND id_mapel != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Error checking subject code existence:', error);
        throw error;
    }
};

/**
 * Get subjects with teacher count
 * @returns {Promise<Array>} Subjects with teacher count
 */
export const findAllWithTeacherCount = async () => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                m.id_mapel as id,
                m.kode_mapel,
                m.nama_mapel,
                m.deskripsi,
                m.status,
                COUNT(g.id_guru) as teacher_count
             FROM mapel m
             LEFT JOIN guru g ON m.id_mapel = g.mapel_id AND g.status = "aktif"
             WHERE m.status = "aktif"
             GROUP BY m.id_mapel
             ORDER BY m.nama_mapel`
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding subjects with teacher count:', error);
        throw error;
    }
};

/**
 * Get subject statistics
 * @returns {Promise<Object>} Subject statistics
 */
export const getStatistics = async () => {
    try {
        const [totalSubjects] = await db.execute(
            'SELECT COUNT(*) as total FROM mapel'
        );
        
        const [activeSubjects] = await db.execute(
            'SELECT COUNT(*) as total FROM mapel WHERE status = "aktif"'
        );
        
        const [subjectsWithTeachers] = await db.execute(
            `SELECT COUNT(DISTINCT m.id_mapel) as total 
             FROM mapel m
             LEFT JOIN guru g ON m.id_mapel = g.mapel_id
             WHERE m.status = "aktif" AND g.id_guru IS NOT NULL`
        );
        
        const [teachersBySubject] = await db.execute(
            `SELECT 
                m.nama_mapel,
                COUNT(g.id_guru) as teacher_count
             FROM mapel m
             LEFT JOIN guru g ON m.id_mapel = g.mapel_id AND g.status = "aktif"
             WHERE m.status = "aktif"
             GROUP BY m.id_mapel, m.nama_mapel
             ORDER BY teacher_count DESC`
        );
        
        return {
            total: totalSubjects[0].total,
            active: activeSubjects[0].total,
            withTeachers: subjectsWithTeachers[0].total,
            teachersBySubject
        };
    } catch (error) {
        console.error('❌ Error getting subject statistics:', error);
        throw error;
    }
};
