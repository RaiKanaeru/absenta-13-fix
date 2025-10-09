/**
 * Authentication Helper for Tests
 * Utilities untuk testing authentication dan authorization
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthHelper {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';
        this.passwordPepper = process.env.PASSWORD_PEPPER || 'test-pepper';
    }

    /**
     * Generate test JWT token
     * @param {Object} payload - Token payload
     * @param {string} expiresIn - Token expiration
     * @returns {string} JWT token
     */
    generateToken(payload = {}, expiresIn = '1h') {
        const defaultPayload = {
            id: 1,
            username: 'testuser',
            role: 'admin',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(
            { ...defaultPayload, ...payload },
            this.jwtSecret,
            { expiresIn }
        );
    }

    /**
     * Generate admin token
     * @returns {string} Admin JWT token
     */
    generateAdminToken() {
        return this.generateToken({
            id: 1,
            username: 'admin',
            role: 'admin'
        });
    }

    /**
     * Generate teacher token
     * @param {number} guruId - Teacher ID
     * @returns {string} Teacher JWT token
     */
    generateTeacherToken(guruId = 1) {
        return this.generateToken({
            id: 2,
            username: 'guru001',
            role: 'guru',
            guruId: guruId
        });
    }

    /**
     * Generate student token
     * @param {number} siswaId - Student ID
     * @returns {string} Student JWT token
     */
    generateStudentToken(siswaId = 2000) {
        return this.generateToken({
            id: 3,
            username: 'perwakilan2000',
            role: 'siswa',
            siswaId: siswaId
        });
    }

    /**
     * Generate expired token for testing
     * @returns {string} Expired JWT token
     */
    generateExpiredToken() {
        return this.generateToken({}, '-1h');
    }

    /**
     * Generate invalid token
     * @returns {string} Invalid JWT token
     */
    generateInvalidToken() {
        return 'invalid.jwt.token';
    }

    /**
     * Hash password for testing
     * @param {string} password - Plain password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        const saltRounds = 10;
        const pepperedPassword = password + this.passwordPepper;
        return await bcrypt.hash(pepperedPassword, saltRounds);
    }

    /**
     * Verify password for testing
     * @param {string} password - Plain password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Password match
     */
    async verifyPassword(password, hash) {
        const pepperedPassword = password + this.passwordPepper;
        return await bcrypt.compare(pepperedPassword, hash);
    }

    /**
     * Generate test user data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Test user data
     */
    generateTestUser(overrides = {}) {
        return {
            username: 'testuser',
            password: 'testpass123',
            role: 'admin',
            nama: 'Test User',
            email: 'test@example.com',
            status: 'aktif',
            ...overrides
        };
    }

    /**
     * Generate test teacher data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Test teacher data
     */
    generateTestTeacher(overrides = {}) {
        return {
            id_guru: 1,
            user_id: 2,
            username: 'guru001',
            nip: '123456789',
            nama: 'Guru Test',
            email: 'guru@test.com',
            mapel_id: 1,
            status: 'aktif',
            ...overrides
        };
    }

    /**
     * Generate test student data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Test student data
     */
    generateTestStudent(overrides = {}) {
        return {
            id_siswa: 2000,
            user_id: 3,
            username: 'perwakilan2000',
            nis: '2000',
            nama: 'Siswa Test',
            kelas_id: 1,
            status: 'aktif',
            ...overrides
        };
    }

    /**
     * Create test headers with authorization
     * @param {string} token - JWT token
     * @param {Object} additionalHeaders - Additional headers
     * @returns {Object} Headers object
     */
    createAuthHeaders(token, additionalHeaders = {}) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...additionalHeaders
        };
    }

    /**
     * Create test request options
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {string} token - JWT token
     * @returns {Object} Request options
     */
    createRequestOptions(method, url, data = null, token = null) {
        const options = {
            method,
            url,
            headers: token ? this.createAuthHeaders(token) : { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        return options;
    }
}

// Export singleton instance
export const authHelper = new AuthHelper();
export default authHelper;
