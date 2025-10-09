/**
 * Database Helper for Tests
 * Utilities untuk testing database operations
 */

import mysql from 'mysql2/promise';

export class DbHelper {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'absenta_test',
            multipleStatements: true
        };
    }

    /**
     * Create database connection
     * @returns {Promise<Connection>} MySQL connection
     */
    async connect() {
        return await mysql.createConnection(this.config);
    }

    /**
     * Execute query with parameters
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>} Query results
     */
    async query(query, params = []) {
        const connection = await this.connect();
        try {
            const [rows] = await connection.execute(query, params);
            return rows;
        } finally {
            await connection.end();
        }
    }

    /**
     * Execute query with transaction
     * @param {Function} callback - Transaction callback
     * @returns {Promise<any>} Transaction result
     */
    async transaction(callback) {
        const connection = await this.connect();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    }

    /**
     * Clean all test data
     * @returns {Promise<void>}
     */
    async cleanAll() {
        const connection = await this.connect();
        try {
            // Disable foreign key checks
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
            
            // Clean all tables in correct order
            const tables = [
                'absensi_guru', 'absensi_siswa', 'pengajuan_izin_siswa',
                'banding_pengajuan_izin', 'jadwal', 'guru', 'siswa_perwakilan',
                'kelas', 'mapel', 'ruang_kelas', 'users'
            ];
            
            for (const table of tables) {
                await connection.execute(`DELETE FROM ${table}`);
                await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            }
            
            // Re-enable foreign key checks
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        } finally {
            await connection.end();
        }
    }

    /**
     * Seed basic test data
     * @returns {Promise<void>}
     */
    async seedBasicData() {
        const connection = await this.connect();
        try {
            // Insert test users
            await connection.execute(`
                INSERT INTO users (username, password, role, nama, email, status) VALUES
                ('admin', '$2b$10$test.hash.for.admin', 'admin', 'Admin Test', 'admin@test.com', 'aktif'),
                ('guru001', '$2b$10$test.hash.for.guru', 'guru', 'Guru Test', 'guru@test.com', 'aktif'),
                ('perwakilan2000', '$2b$10$test.hash.for.student', 'siswa', 'Siswa Test', 'siswa@test.com', 'aktif')
            `);

            // Insert test class
            await connection.execute(`
                INSERT INTO kelas (id_kelas, nama_kelas, tingkat, status) VALUES
                (1, 'X IPA 1', 'X', 'aktif'),
                (2, 'X IPA 2', 'X', 'aktif'),
                (3, 'XI IPA 1', 'XI', 'aktif')
            `);

            // Insert test subject
            await connection.execute(`
                INSERT INTO mapel (id_mapel, kode_mapel, nama_mapel, status) VALUES
                (1, 'MTK-01', 'Matematika', 'aktif'),
                (2, 'FIS-01', 'Fisika', 'aktif'),
                (3, 'BIO-01', 'Biologi', 'aktif')
            `);

            // Insert test teacher
            await connection.execute(`
                INSERT INTO guru (id_guru, user_id, username, nip, nama, email, mapel_id, status) VALUES
                (1, 2, 'guru001', '123456789', 'Guru Test', 'guru@test.com', 1, 'aktif'),
                (2, 2, 'guru002', '123456790', 'Guru Test 2', 'guru2@test.com', 2, 'aktif')
            `);

            // Insert test student
            await connection.execute(`
                INSERT INTO siswa_perwakilan (id_siswa, user_id, username, nis, nama, kelas_id, status) VALUES
                (2000, 3, 'perwakilan2000', '2000', 'Siswa Test', 1, 'aktif'),
                (2001, 3, 'perwakilan2001', '2001', 'Siswa Test 2', 1, 'aktif')
            `);

            // Insert test room
            await connection.execute(`
                INSERT INTO ruang_kelas (id, nama_ruang, kode_ruang, kapasitas, status) VALUES
                (1, 'Ruang 301', 'R.301', 30, 'aktif'),
                (2, 'Laboratorium Fisika', 'Lab.F', 25, 'aktif')
            `);

        } finally {
            await connection.end();
        }
    }

    /**
     * Get user by username
     * @param {string} username - Username
     * @returns {Promise<Object|null>} User data
     */
    async getUserByUsername(username) {
        const users = await this.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return users[0] || null;
    }

    /**
     * Get teacher by ID
     * @param {number} idGuru - Teacher ID
     * @returns {Promise<Object|null>} Teacher data
     */
    async getTeacherById(idGuru) {
        const teachers = await this.query(
            'SELECT * FROM guru WHERE id_guru = ?',
            [idGuru]
        );
        return teachers[0] || null;
    }

    /**
     * Get student by ID
     * @param {number} idSiswa - Student ID
     * @returns {Promise<Object|null>} Student data
     */
    async getStudentById(idSiswa) {
        const students = await this.query(
            'SELECT * FROM siswa_perwakilan WHERE id_siswa = ?',
            [idSiswa]
        );
        return students[0] || null;
    }

    /**
     * Get schedule by ID
     * @param {number} idJadwal - Schedule ID
     * @returns {Promise<Object|null>} Schedule data
     */
    async getScheduleById(idJadwal) {
        const schedules = await this.query(
            'SELECT * FROM jadwal WHERE id_jadwal = ?',
            [idJadwal]
        );
        return schedules[0] || null;
    }

    /**
     * Get attendance by ID
     * @param {number} idAbsensi - Attendance ID
     * @returns {Promise<Object|null>} Attendance data
     */
    async getAttendanceById(idAbsensi) {
        const attendances = await this.query(
            'SELECT * FROM absensi_guru WHERE id_absensi = ?',
            [idAbsensi]
        );
        return attendances[0] || null;
    }

    /**
     * Count records in table
     * @param {string} table - Table name
     * @param {string} where - WHERE clause (optional)
     * @param {Array} params - WHERE parameters
     * @returns {Promise<number>} Record count
     */
    async countRecords(table, where = '', params = []) {
        const query = `SELECT COUNT(*) as count FROM ${table} ${where}`;
        const result = await this.query(query, params);
        return result[0].count;
    }

    /**
     * Check if record exists
     * @param {string} table - Table name
     * @param {string} column - Column name
     * @param {any} value - Column value
     * @returns {Promise<boolean>} Record exists
     */
    async recordExists(table, column, value) {
        const count = await this.countRecords(table, `WHERE ${column} = ?`, [value]);
        return count > 0;
    }

    /**
     * Get table structure
     * @param {string} table - Table name
     * @returns {Promise<Array>} Table columns
     */
    async getTableStructure(table) {
        return await this.query(`DESCRIBE ${table}`);
    }

    /**
     * Execute raw SQL
     * @param {string} sql - SQL statement
     * @returns {Promise<any>} Query result
     */
    async executeRaw(sql) {
        const connection = await this.connect();
        try {
            const [result] = await connection.execute(sql);
            return result;
        } finally {
            await connection.end();
        }
    }
}

// Export singleton instance
export const dbHelper = new DbHelper();
export default dbHelper;
