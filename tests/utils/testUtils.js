// tests/utils/testUtils.js - Test utilities for Jest
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

class TestUtils {
  constructor() {
    this.db = null;
    this.testDbName = 'absenta_test';
  }

  // Get test database connection
  async getTestDb() {
    if (!this.db) {
      this.db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: this.testDbName,
        multipleStatements: true
      });
    }
    return this.db;
  }

  // Generate test JWT token
  generateTestToken(payload = {}) {
    const defaultPayload = {
      id: 1,
      username: 'testuser',
      role: 'guru',
      nama: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    const tokenPayload = { ...defaultPayload, ...payload };
    const secret = process.env.JWT_SECRET || 'test-secret-key';
    
    return jwt.sign(tokenPayload, secret);
  }

  // Create test user data
  createTestUser(overrides = {}) {
    return {
      id: 1,
      username: 'testuser',
      password: '$2b$10$test.hash.for.testing',
      role: 'guru',
      nama: 'Test User',
      email: 'test@example.com',
      status: 'aktif',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  // Create test schedule data
  createTestSchedule(overrides = {}) {
    return {
      id_jadwal: 1,
      kelas_id: 1,
      mapel_id: 1,
      guru_id: 1,
      hari: 'Senin',
      jam_ke: 1,
      jam_mulai: '07:00:00',
      jam_selesai: '08:00:00',
      status: 'aktif',
      created_at: new Date(),
      ...overrides
    };
  }

  // Create test attendance data
  createTestAttendance(overrides = {}) {
    return {
      id_absensi: 1,
      jadwal_id: 1,
      guru_id: 1,
      kelas_id: 1,
      siswa_pencatat_id: 1,
      tanggal: new Date().toISOString().split('T')[0],
      jam_ke: 1,
      status: 'Hadir',
      keterangan: null,
      waktu_catat: new Date(),
      metode_absen: 'manual',
      ...overrides
    };
  }

  // Setup test database
  async setupTestDatabase() {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create test database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${this.testDbName}`);
    await connection.end();

    // Connect to test database
    this.db = await this.getTestDb();
  }

  // Cleanup test database
  async cleanup() {
    if (this.db) {
      await this.db.end();
      this.db = null;
    }
  }

  // Seed test data
  async seedTestData() {
    const db = await this.getTestDb();
    
    // Clear existing data
    await db.execute('DELETE FROM absensi_guru');
    await db.execute('DELETE FROM absensi_siswa');
    await db.execute('DELETE FROM jadwal');
    await db.execute('DELETE FROM guru');
    await db.execute('DELETE FROM users');

    // Insert test users
    await db.execute(
      'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['testadmin', '$2b$10$test.hash', 'admin', 'Test Admin', 'admin@test.com', 'aktif']
    );

    await db.execute(
      'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['testguru', '$2b$10$test.hash', 'guru', 'Test Guru', 'guru@test.com', 'aktif']
    );

    // Insert test data
    // Add more seed data as needed
  }
}

module.exports = new TestUtils();