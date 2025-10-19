/**
 * Schedule Repository - Database operations for schedules
 * Handles all schedule-related database queries
 */

import { db } from '../../db.js';

/**
 * Find all schedules with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Schedules
 */
export const findAll = async (filters = {}) => {
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        // Apply filters
        if (filters.status) {
            whereClause += ' AND j.status = ?';
            params.push(filters.status);
        }
        
        if (filters.hari) {
            whereClause += ' AND j.hari = ?';
            params.push(filters.hari);
        }
        
        if (filters.kelas_id) {
            whereClause += ' AND j.kelas_id = ?';
            params.push(filters.kelas_id);
        }
        
        if (filters.mapel_id) {
            whereClause += ' AND j.mapel_id = ?';
            params.push(filters.mapel_id);
        }
        
        if (filters.guru_id) {
            whereClause += ' AND (j.guru_id = ? OR JSON_CONTAINS(j.guru_ids, ?))';
            params.push(filters.guru_id, JSON.stringify(filters.guru_id));
        }
        
        if (filters.jam_ke) {
            whereClause += ' AND j.jam_ke = ?';
            params.push(filters.jam_ke);
        }
        
        const [rows] = await db.execute(
            `SELECT 
                j.id_jadwal as id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                j.is_multi_guru,
                j.guru_ids,
                j.created_at,
                j.updated_at,
                k.nama_kelas,
                k.id_kelas as kelas_id,
                m.nama_mapel,
                m.kode_mapel,
                m.id_mapel as mapel_id,
                g.nama as guru_nama,
                g.nip as guru_nip,
                g.id_guru as guru_id
             FROM jadwal j
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON j.guru_id = g.id_guru
             ${whereClause}
             ORDER BY j.hari, j.jam_ke`,
            params
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding all schedules:', error);
        throw error;
    }
};

/**
 * Find schedule by ID
 * @param {number} id - Schedule ID
 * @returns {Promise<Object|null>} Schedule object or null
 */
export const findById = async (id) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                j.*,
                k.nama_kelas,
                k.id_kelas as kelas_id,
                m.nama_mapel,
                m.kode_mapel,
                m.id_mapel as mapel_id,
                g.nama as guru_nama,
                g.nip as guru_nip,
                g.id_guru as guru_id
             FROM jadwal j
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON j.guru_id = g.id_guru
             WHERE j.id_jadwal = ?`,
            [id]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('❌ Error finding schedule by ID:', error);
        throw error;
    }
};

/**
 * Find schedules by teacher
 * @param {number} teacherId - Teacher ID
 * @returns {Promise<Array>} Teacher's schedules
 */
export const findByTeacher = async (teacherId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                j.id_jadwal as id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                j.is_multi_guru,
                j.guru_ids,
                k.nama_kelas,
                k.id_kelas as kelas_id,
                m.nama_mapel,
                m.kode_mapel,
                m.id_mapel as mapel_id
             FROM jadwal j
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             WHERE (j.guru_id = ? OR JSON_CONTAINS(j.guru_ids, ?)) 
                 AND j.status = "aktif"
             ORDER BY j.hari, j.jam_ke`,
            [teacherId, JSON.stringify(teacherId)]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding schedules by teacher:', error);
        throw error;
    }
};

/**
 * Find schedules by class
 * @param {number} classId - Class ID
 * @returns {Promise<Array>} Class schedules
 */
export const findByClass = async (classId) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                j.id_jadwal as id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                j.is_multi_guru,
                j.guru_ids,
                m.nama_mapel,
                m.kode_mapel,
                m.id_mapel as mapel_id,
                g.nama as guru_nama,
                g.nip as guru_nip,
                g.id_guru as guru_id
             FROM jadwal j
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON j.guru_id = g.id_guru
             WHERE j.kelas_id = ? AND j.status = "aktif"
             ORDER BY j.hari, j.jam_ke`,
            [classId]
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error finding schedules by class:', error);
        throw error;
    }
};

/**
 * Create new schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} Created schedule
 */
export const create = async (scheduleData) => {
    try {
        const {
            hari,
            jam_ke,
            jam_mulai,
            jam_selesai,
            kelas_id,
            mapel_id,
            guru_id,
            guru_ids = null,
            is_multi_guru = false,
            status = 'aktif'
        } = scheduleData;
        
        const [result] = await db.execute(
            `INSERT INTO jadwal 
                (hari, jam_ke, jam_mulai, jam_selesai, kelas_id, mapel_id, guru_id, guru_ids, is_multi_guru, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [hari, jam_ke, jam_mulai, jam_selesai, kelas_id, mapel_id, guru_id, guru_ids, is_multi_guru, status]
        );
        
        // Return created schedule
        return await findById(result.insertId);
    } catch (error) {
        console.error('❌ Error creating schedule:', error);
        throw error;
    }
};

/**
 * Update schedule by ID
 * @param {number} id - Schedule ID
 * @param {Object} scheduleData - Updated schedule data
 * @returns {Promise<Object|null>} Updated schedule or null
 */
export const update = async (id, scheduleData) => {
    try {
        const {
            hari,
            jam_ke,
            jam_mulai,
            jam_selesai,
            kelas_id,
            mapel_id,
            guru_id,
            guru_ids,
            is_multi_guru,
            status
        } = scheduleData;
        
        // Build dynamic update query
        const updateFields = [];
        const params = [];
        
        if (hari !== undefined) {
            updateFields.push('hari = ?');
            params.push(hari);
        }
        
        if (jam_ke !== undefined) {
            updateFields.push('jam_ke = ?');
            params.push(jam_ke);
        }
        
        if (jam_mulai !== undefined) {
            updateFields.push('jam_mulai = ?');
            params.push(jam_mulai);
        }
        
        if (jam_selesai !== undefined) {
            updateFields.push('jam_selesai = ?');
            params.push(jam_selesai);
        }
        
        if (kelas_id !== undefined) {
            updateFields.push('kelas_id = ?');
            params.push(kelas_id);
        }
        
        if (mapel_id !== undefined) {
            updateFields.push('mapel_id = ?');
            params.push(mapel_id);
        }
        
        if (guru_id !== undefined) {
            updateFields.push('guru_id = ?');
            params.push(guru_id);
        }
        
        if (guru_ids !== undefined) {
            updateFields.push('guru_ids = ?');
            params.push(guru_ids);
        }
        
        if (is_multi_guru !== undefined) {
            updateFields.push('is_multi_guru = ?');
            params.push(is_multi_guru);
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
            `UPDATE jadwal SET ${updateFields.join(', ')} WHERE id_jadwal = ?`,
            params
        );
        
        if (result.affectedRows === 0) {
            return null;
        }
        
        return await findById(id);
    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        throw error;
    }
};

/**
 * Delete schedule by ID
 * @param {number} id - Schedule ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteById = async (id) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM jadwal WHERE id_jadwal = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        throw error;
    }
};

/**
 * Check for schedule conflicts
 * @param {Object} scheduleData - Schedule data to check
 * @param {number} excludeId - Schedule ID to exclude from conflict check
 * @returns {Promise<Array>} Conflicting schedules
 */
export const checkConflicts = async (scheduleData, excludeId = null) => {
    try {
        const { hari, jam_ke, kelas_id, guru_id, guru_ids } = scheduleData;
        
        let whereClause = 'WHERE hari = ? AND jam_ke = ? AND status = "aktif"';
        const params = [hari, jam_ke];
        
        // Check class conflicts
        whereClause += ' AND kelas_id = ?';
        params.push(kelas_id);
        
        // Check teacher conflicts
        whereClause += ' AND (guru_id = ? OR JSON_CONTAINS(guru_ids, ?))';
        params.push(guru_id, JSON.stringify(guru_id));
        
        // Exclude current schedule if updating
        if (excludeId) {
            whereClause += ' AND id_jadwal != ?';
            params.push(excludeId);
        }
        
        const [rows] = await db.execute(
            `SELECT 
                j.id_jadwal,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as guru_nama
             FROM jadwal j
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
             LEFT JOIN guru g ON j.guru_id = g.id_guru
             ${whereClause}`,
            params
        );
        
        return rows;
    } catch (error) {
        console.error('❌ Error checking schedule conflicts:', error);
        throw error;
    }
};

/**
 * Get schedule statistics
 * @returns {Promise<Object>} Schedule statistics
 */
export const getStatistics = async () => {
    try {
        const [totalSchedules] = await db.execute(
            'SELECT COUNT(*) as total FROM jadwal'
        );
        
        const [activeSchedules] = await db.execute(
            'SELECT COUNT(*) as total FROM jadwal WHERE status = "aktif"'
        );
        
        const [schedulesByDay] = await db.execute(
            `SELECT 
                hari,
                COUNT(*) as count 
             FROM jadwal 
             WHERE status = "aktif" 
             GROUP BY hari`
        );
        
        const [schedulesByClass] = await db.execute(
            `SELECT 
                k.nama_kelas,
                COUNT(j.id_jadwal) as count 
             FROM jadwal j
             LEFT JOIN kelas k ON j.kelas_id = k.id_kelas
             WHERE j.status = "aktif" 
             GROUP BY j.kelas_id, k.nama_kelas`
        );
        
        return {
            total: totalSchedules[0].total,
            active: activeSchedules[0].total,
            byDay: schedulesByDay,
            byClass: schedulesByClass
        };
    } catch (error) {
        console.error('❌ Error getting schedule statistics:', error);
        throw error;
    }
};
