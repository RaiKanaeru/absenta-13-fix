/**
 * User Repository - Database operations for users
 * Handles all user-related database queries
 */

import { db } from '../../db.js';

/**
 * Find user by username
 * @param {string} username - Username to search
 * @returns {Promise<Object|null>} User object or null
 */
export const findByUsername = async (username) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            [username]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding user by username:', error);
        throw error;
    }
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export const findById = async (id) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding user by ID:', error);
        throw error;
    }
};

/**
 * Find all users with pagination
 * @param {Object} filters - Filter options
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Users with pagination info
 */
export const findAll = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // Apply filters
        if (filters.role) {
            whereClause += ' AND role = ?';
            params.push(filters.role);
        }
        
        if (filters.status) {
            whereClause += ' AND status = ?';
            params.push(filters.status);
        }
        
        if (filters.search) {
            whereClause += ' AND (nama LIKE ? OR username LIKE ? OR email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Get total count
        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        const total = countRows[0].total;
        
        // Get users with pagination
        const [rows] = await db.execute(
            `SELECT id, username, nama, email, role, status, created_at, updated_at 
             FROM users ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        
        return {
            users: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('❌ Error finding all users:', error);
        throw error;
    }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export const create = async (userData) => {
    try {
        const {
            username,
            password,
            role,
            nama,
            email,
            nomor_telepon,
            alamat,
            jenis_kelamin,
            status = 'aktif'
        } = userData;
        
        const [result] = await db.execute(
            `INSERT INTO users (username, password, role, nama, email, nomor_telepon, alamat, jenis_kelamin, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, role, nama, email, nomor_telepon, alamat, jenis_kelamin, status]
        );
        
        // Return created user
        return await findById(result.insertId);
    } catch (error) {
        console.error('❌ Error creating user:', error);
        throw error;
    }
};

/**
 * Update user by ID
 * @param {number} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object|null>} Updated user or null
 */
export const update = async (id, userData) => {
    try {
        const {
            username,
            password,
            nama,
            email,
            nomor_telepon,
            alamat,
            jenis_kelamin,
            status
        } = userData;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        if (username !== undefined) {
            updateFields.push('username = ?');
            params.push(username);
        }
        
        if (password !== undefined) {
            updateFields.push('password = ?');
            params.push(password);
        }
        
        if (nama !== undefined) {
            updateFields.push('nama = ?');
            params.push(nama);
        }
        
        if (email !== undefined) {
            updateFields.push('email = ?');
            params.push(email);
        }
        
        if (nomor_telepon !== undefined) {
            updateFields.push('nomor_telepon = ?');
            params.push(nomor_telepon);
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
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await findById(id);
    } catch (error) {
        console.error('❌ Error updating user:', error);
        throw error;
    }
};

/**
 * Delete user by ID
 * @param {number} id - User ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteById = async (id) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
    }
};

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @param {number} excludeId - User ID to exclude from check
 * @returns {Promise<boolean>} True if exists
 */
export const usernameExists = async (username, excludeId = null) => {
    try {
        let query = 'SELECT id FROM users WHERE username = ?';
        const params = [username];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Error checking username existence:', error);
        throw error;
    }
};

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @param {number} excludeId - User ID to exclude from check
 * @returns {Promise<boolean>} True if exists
 */
export const emailExists = async (email, excludeId = null) => {
    try {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Error checking email existence:', error);
        throw error;
    }
};

/**
 * Update user password
 * @param {number} id - User ID
 * @param {string} hashedPassword - New hashed password
 * @returns {Promise<boolean>} True if updated
 */
export const updatePassword = async (id, hashedPassword) => {
    try {
        const [result] = await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error updating password:', error);
        throw error;
    }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export const getStatistics = async () => {
    try {
        const [totalUsers] = await db.execute(
            'SELECT COUNT(*) as total FROM users'
        );
        
        const [activeUsers] = await db.execute(
            'SELECT COUNT(*) as total FROM users WHERE status = "aktif"'
        );
        
        const [usersByRole] = await db.execute(
            `SELECT role, COUNT(*) as count 
             FROM users 
             WHERE status = "aktif" 
             GROUP BY role`
        );
        
        return {
            total: totalUsers[0].total,
            active: activeUsers[0].total,
            byRole: usersByRole
        };
    } catch (error) {
        console.error('❌ Error getting user statistics:', error);
        throw error;
    }
};
