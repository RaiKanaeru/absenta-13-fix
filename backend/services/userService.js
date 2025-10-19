/**
 * User Service - User management business logic
 * Handles user profile, authentication, and user operations
 */

import { findById, update, updatePassword } from '../repositories/userRepository.js';
import { findByUserId as findTeacherByUserId } from '../repositories/teacherRepository.js';
import { findByUserId as findStudentByUserId } from '../repositories/studentRepository.js';
import { createOperationalError } from '../middleware/errorHandler.js';

/**
 * Get user information by ID and role
 * @param {number} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<Object>} User information
 */
export const getUserInfo = async (userId, role) => {
    try {
        console.log(`📋 Getting user info for user_id: ${userId}, role: ${role}`);
        
        // Get base user data
        const user = await findById(userId);
        if (!user) {
            throw createOperationalError('User tidak ditemukan', 404, 'USER_NOT_FOUND');
        }

        let additionalData = {};
        
        // Get role-specific data
        if (role === 'guru') {
            const teacherData = await findTeacherByUserId(userId);
            if (teacherData) {
                additionalData = {
                    guru_id: teacherData.id_guru,
                    nip: teacherData.nip,
                    mata_pelajaran: teacherData.nama_mapel,
                    no_telepon: teacherData.no_telp || teacherData.user_no_telepon,
                    alamat: teacherData.alamat,
                    jenis_kelamin: teacherData.jenis_kelamin,
                    status: teacherData.status
                };
            }
        } else if (role === 'siswa') {
            const studentData = await findStudentByUserId(userId);
            if (studentData) {
                additionalData = {
                    siswa_id: studentData.id_siswa,
                    nis: studentData.nis,
                    kelas: studentData.nama_kelas,
                    kelas_id: studentData.kelas_id,
                    alamat: studentData.alamat,
                    telepon_orangtua: studentData.telepon_orangtua || studentData.user_no_telepon,
                    telepon_siswa: studentData.telepon_siswa,
                    jenis_kelamin: studentData.jenis_kelamin,
                    jabatan: studentData.jabatan,
                    status: studentData.status
                };
            }
        }

        return {
            id: user.id,
            username: user.username,
            nama: user.nama,
            email: user.email,
            role: user.role,
            alamat: user.alamat,
            no_telepon: user.nomor_telepon,
            jenis_kelamin: user.jenis_kelamin,
            status: user.status,
            created_at: user.created_at,
            updated_at: user.updated_at,
            ...additionalData
        };
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        throw error;
    }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Updated user information
 */
export const updateProfile = async (userId, profileData, userRole) => {
    try {
        console.log(`📝 Updating profile for user_id: ${userId}, role: ${userRole}`);
        
        const { nama, username, email, no_telepon, alamat, jenis_kelamin } = profileData;
        
        // Prepare user update data
        const userUpdateData = {
            nama,
            email,
            nomor_telepon: no_telepon,
            alamat,
            jenis_kelamin
        };
        
        // Only admin can update username
        if (userRole === 'admin' && username) {
            userUpdateData.username = username;
        }
        
        // Update user record
        const updatedUser = await update(userId, userUpdateData);
        if (!updatedUser) {
            throw createOperationalError('Gagal memperbarui profil user', 500, 'UPDATE_ERROR');
        }
        
        // Update role-specific data if needed
        if (userRole === 'guru') {
            const teacherData = await findTeacherByUserId(userId);
            if (teacherData) {
                // Update teacher-specific fields if needed
                // This would require teacher repository update method
                console.log('📝 Teacher profile updated');
            }
        } else if (userRole === 'siswa') {
            const studentData = await findStudentByUserId(userId);
            if (studentData) {
                // Update student-specific fields if needed
                // This would require student repository update method
                console.log('📝 Student profile updated');
            }
        }
        
        return {
            success: true,
            message: 'Profil berhasil diperbarui',
            data: updatedUser
        };
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
    }
};

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Password change result
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
    try {
        console.log(`🔐 Changing password for user_id: ${userId}`);
        
        // Get current user data
        const user = await findById(userId);
        if (!user) {
            throw createOperationalError('User tidak ditemukan', 404, 'USER_NOT_FOUND');
        }
        
        // Verify old password
        const bcrypt = await import('bcrypt');
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            throw createOperationalError('Password lama tidak sesuai', 400, 'INVALID_PASSWORD');
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        const success = await updatePassword(userId, hashedNewPassword);
        if (!success) {
            throw createOperationalError('Gagal memperbarui password', 500, 'PASSWORD_UPDATE_ERROR');
        }
        
        return {
            success: true,
            message: 'Password berhasil diubah'
        };
    } catch (error) {
        console.error('❌ Error changing password:', error);
        throw error;
    }
};

/**
 * Get user dashboard data
 * @param {number} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<Object>} Dashboard data
 */
export const getDashboardData = async (userId, role) => {
    try {
        console.log(`📊 Getting dashboard data for user_id: ${userId}, role: ${role}`);
        
        const userInfo = await getUserInfo(userId, role);
        
        // Get role-specific dashboard data
        let dashboardData = {
            user: userInfo,
            stats: {},
            recent_activity: []
        };
        
        if (role === 'guru') {
            // Get teacher-specific stats
            dashboardData.stats = {
                total_classes: 0, // Would need to query schedules
                total_students: 0, // Would need to query students
                attendance_today: 0 // Would need to query attendance
            };
        } else if (role === 'siswa') {
            // Get student-specific stats
            dashboardData.stats = {
                attendance_rate: 0, // Would need to query attendance
                total_classes: 0, // Would need to query schedules
                upcoming_classes: 0 // Would need to query schedules
            };
        } else if (role === 'admin') {
            // Get admin-specific stats
            dashboardData.stats = {
                total_users: 0, // Would need to query users
                total_teachers: 0, // Would need to query teachers
                total_students: 0, // Would need to query students
                system_status: 'active'
            };
        }
        
        return dashboardData;
    } catch (error) {
        console.error('❌ Error getting dashboard data:', error);
        throw error;
    }
};

/**
 * Validate user permissions
 * @param {number} userId - User ID
 * @param {string} requiredRole - Required role
 * @param {string} action - Action being performed
 * @returns {Promise<boolean>} True if user has permission
 */
export const validatePermissions = async (userId, requiredRole, action) => {
    try {
        const user = await findById(userId);
        if (!user) {
            return false;
        }
        
        // Admin has all permissions
        if (user.role === 'admin') {
            return true;
        }
        
        // Check role-specific permissions
        if (user.role === requiredRole) {
            return true;
        }
        
        // Additional permission checks can be added here
        return false;
    } catch (error) {
        console.error('❌ Error validating permissions:', error);
        return false;
    }
};

/**
 * Get user activity log
 * @param {number} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} User activity log
 */
export const getUserActivity = async (userId, filters = {}) => {
    try {
        console.log(`📋 Getting user activity for user_id: ${userId}`);
        
        // This would typically query an activity log table
        // For now, return empty array as placeholder
        const activities = [];
        
        return activities;
    } catch (error) {
        console.error('❌ Error getting user activity:', error);
        throw error;
    }
};
