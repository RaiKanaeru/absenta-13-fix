/**
 * Auth Service - Authentication business logic
 * Handles login, token generation, and user authentication
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findByUsername } from '../repositories/userRepository.js';
import { findByUserId as findTeacherByUserId } from '../repositories/teacherRepository.js';
import { findByUserId as findStudentByUserId } from '../repositories/studentRepository.js';
import { createOperationalError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
const saltRounds = 10;

/**
 * Authenticate user login
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Authentication result
 */
export const login = async (username, password) => {
    try {
        console.log(`🔐 Login attempt for username: ${username}`);
        
        if (!username || !password) {
            throw createOperationalError('Username dan password wajib diisi', 400, 'VALIDATION_ERROR');
        }

        // Find user by username
        const user = await findByUsername(username);
        if (!user) {
            console.log('❌ Login failed: User not found');
            throw createOperationalError('Username atau password salah', 401, 'AUTHENTICATION_ERROR');
        }
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('❌ Login failed: Invalid password');
            throw createOperationalError('Username atau password salah', 401, 'AUTHENTICATION_ERROR');
        }

        // Get additional user data based on role
        let additionalData = {};
        
        try {
            if (user.role === 'guru' || user.role === 'GURU' || user.role.toLowerCase() === 'guru') {
                console.log('🔍 Debug: Looking for guru data for user_id:', user.id);
                const teacherData = await findTeacherByUserId(user.id);
                if (teacherData) {
                    additionalData = {
                        guru_id: teacherData.id_guru,
                        nip: teacherData.nip,
                        mapel: teacherData.nama_mapel
                    };
                    console.log('🔍 Debug: Additional data set:', additionalData);
                } else {
                    console.log('❌ Debug: No guru data found for user_id:', user.id);
                }
            } else if (user.role === 'siswa' || user.role === 'perwakilan') {
                console.log('🔍 Debug: Looking for siswa data for user_id:', user.id);
                const studentData = await findStudentByUserId(user.id);
                if (studentData) {
                    additionalData = {
                        siswa_id: studentData.id_siswa,
                        nis: studentData.nis,
                        kelas: studentData.nama_kelas,
                        kelas_id: studentData.kelas_id
                    };
                    console.log('🔍 Debug: Siswa additional data set:', additionalData);
                } else {
                    console.log('❌ Debug: No siswa data found for user_id:', user.id);
                }
            }
        } catch (dataError) {
            console.error('❌ Error fetching additional user data:', dataError);
            // Continue with login even if additional data fails
            console.log('⚠️ Continuing login without additional data');
        }

        // Generate JWT token
        const tokenPayload = {
            id: user.id,
            username: user.username,
            nama: user.nama,
            role: (user.role === 'perwakilan' || user.role.toLowerCase() === 'perwakilan') 
                  ? 'siswa' 
                  : user.role.toLowerCase(), // Normalize perwakilan to siswa
            ...additionalData
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        console.log(`✅ Login successful for user: ${user.username} (${user.role})`);
        
        return {
            success: true,
            message: 'Login berhasil',
            user: tokenPayload,
            token
        };

    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token payload
 */
export const verifyToken = async (token) => {
    try {
        if (!token) {
            throw createOperationalError('Token tidak ditemukan', 401, 'AUTHENTICATION_ERROR');
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw createOperationalError('Token telah kedaluwarsa', 401, 'TOKEN_EXPIRED');
        } else if (error.name === 'JsonWebTokenError') {
            throw createOperationalError('Token tidak valid', 401, 'INVALID_TOKEN');
        } else {
            throw createOperationalError('Kesalahan autentikasi', 401, 'AUTHENTICATION_ERROR');
        }
    }
};

/**
 * Generate JWT token
 * @param {Object} user - User data
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
    try {
        const tokenPayload = {
            id: user.id,
            username: user.username,
            nama: user.nama,
            role: user.role.toLowerCase()
        };

        return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    } catch (error) {
        console.error('❌ Error generating token:', error);
        throw createOperationalError('Gagal membuat token', 500, 'TOKEN_GENERATION_ERROR');
    }
};

/**
 * Hash password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error('❌ Error hashing password:', error);
        throw createOperationalError('Gagal mengenkripsi password', 500, 'PASSWORD_HASH_ERROR');
    }
};

/**
 * Compare password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error('❌ Error comparing password:', error);
        throw createOperationalError('Gagal memverifikasi password', 500, 'PASSWORD_COMPARISON_ERROR');
    }
};

/**
 * Validate token and get user info
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User information from token
 */
export const validateToken = async (token) => {
    try {
        const decoded = await verifyToken(token);
        
        // Get fresh user data
        const user = await findByUsername(decoded.username);
        if (!user || user.status !== 'aktif') {
            throw createOperationalError('User tidak ditemukan atau tidak aktif', 401, 'USER_NOT_FOUND');
        }

        return {
            id: user.id,
            username: user.username,
            nama: user.nama,
            role: user.role,
            email: user.email,
            status: user.status
        };
    } catch (error) {
        console.error('❌ Error validating token:', error);
        throw error;
    }
};

/**
 * Refresh token
 * @param {string} token - Current JWT token
 * @returns {Promise<Object>} New token and user info
 */
export const refreshToken = async (token) => {
    try {
        const decoded = await verifyToken(token);
        
        // Generate new token with same payload
        const newToken = jwt.sign(decoded, JWT_SECRET, { expiresIn: '24h' });
        
        return {
            success: true,
            message: 'Token berhasil diperbarui',
            token: newToken,
            user: decoded
        };
    } catch (error) {
        console.error('❌ Error refreshing token:', error);
        throw error;
    }
};

/**
 * Logout user (invalidate token on client side)
 * @returns {Object} Logout result
 */
export const logout = () => {
    return {
        success: true,
        message: 'Logout berhasil'
    };
};
