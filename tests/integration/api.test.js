/**
 * Integration Tests untuk API Endpoints
 * Test komprehensif untuk semua API endpoints dengan database integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absenta13',
  port: process.env.DB_PORT || 3306
};

let db;
let authToken;
let testUserId;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Setup database connection
    db = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connected for integration tests');
  });

  afterAll(async () => {
    if (db) {
      await db.end();
      console.log('✅ Database connection closed');
    }
  });

  beforeEach(async () => {
    // Clean test data before each test
    await cleanTestData();
  });

  describe('Authentication API', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data).toHaveProperty('user');
      expect(data.data.user.role).toBe('admin');
      
      authToken = data.data.token;
      testUserId = data.data.user.id;
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid',
          password: 'wrong'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should validate JWT token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
    });

    it('should reject requests without token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('User Management API', () => {
    it('should create new user', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpass123',
        role: 'guru',
        nama: 'Test User',
        email: 'test@example.com'
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.username).toBe(userData.username);
    });

    it('should get all users', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should update user', async () => {
      // First create a user
      const createResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'updatetest',
          password: 'testpass123',
          role: 'guru',
          nama: 'Update Test',
          email: 'update@example.com'
        })
      });

      const createData = await createResponse.json();
      const userId = createData.data.id;

      // Update the user
      const updateResponse = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama: 'Updated Name',
          email: 'updated@example.com'
        })
      });

      const updateData = await updateResponse.json();
      
      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.nama).toBe('Updated Name');
    });

    it('should delete user', async () => {
      // First create a user
      const createResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'deletetest',
          password: 'testpass123',
          role: 'guru',
          nama: 'Delete Test',
          email: 'delete@example.com'
        })
      });

      const createData = await createResponse.json();
      const userId = createData.data.id;

      // Delete the user
      const deleteResponse = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const deleteData = await deleteResponse.json();
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
    });
  });

  describe('Subject Management API', () => {
    it('should create new subject', async () => {
      const subjectData = {
        kode_mapel: 'TEST',
        nama_mapel: 'Test Subject',
        deskripsi: 'Test Description'
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/mapel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subjectData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id_mapel');
      expect(data.data.kode_mapel).toBe(subjectData.kode_mapel);
    });

    it('should get all subjects', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/mapel`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Class Management API', () => {
    it('should create new class', async () => {
      const classData = {
        nama_kelas: 'Test Class',
        tingkat: 'X',
        ruang: 'A1',
        kode_ruang: 'A1',
        jumlah_siswa: 30
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/kelas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id_kelas');
      expect(data.data.nama_kelas).toBe(classData.nama_kelas);
    });
  });

  describe('Schedule Management API', () => {
    it('should create new schedule', async () => {
      const scheduleData = {
        kelas_id: 1,
        mapel_id: 1,
        guru_id: 1,
        ruang_id: 1,
        hari: 'Senin',
        jam_ke: 1,
        jam_mulai: '07:00:00',
        jam_selesai: '08:00:00'
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/jadwal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id_jadwal');
    });
  });

  describe('Attendance API', () => {
    it('should record teacher attendance', async () => {
      const attendanceData = {
        jadwal_id: 1,
        guru_id: 1,
        status: 'Hadir',
        keterangan: 'On time'
      };

      const response = await fetch(`${API_BASE_URL}/api/attendance/teacher`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('should record student attendance', async () => {
      const attendanceData = {
        jadwal_id: 1,
        siswa_id: 1,
        status: 'Hadir',
        keterangan: 'Present'
      };

      const response = await fetch(`${API_BASE_URL}/api/attendance/student`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Permission API', () => {
    it('should create permission request', async () => {
      const permissionData = {
        siswa_id: 1,
        jadwal_id: 1,
        tanggal_izin: '2024-01-15',
        alasan_izin: 'Sakit',
        jenis_izin: 'sakit'
      };

      const response = await fetch(`${API_BASE_URL}/api/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissionData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Dispute API', () => {
    it('should create dispute request', async () => {
      const disputeData = {
        absensi_id: 1,
        siswa_id: 1,
        guru_id: 1,
        jadwal_id: 1,
        tanggal_absen: '2024-01-15',
        status_asli: 'Alpa',
        status_diajukan: 'Hadir',
        alasan_banding: 'Actually present'
      };

      const response = await fetch(`${API_BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(disputeData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
          username: 'test'
        })
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle unauthorized access', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status).toBe(401);
    });

    it('should handle not found errors', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/99999`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });
});

// Helper functions
async function cleanTestData() {
  try {
    // Clean test data in reverse order of dependencies
    await db.execute('DELETE FROM absensi_siswa WHERE siswa_id IN (SELECT id_siswa FROM siswa_perwakilan WHERE nama LIKE "Test%")');
    await db.execute('DELETE FROM absensi_guru WHERE guru_id IN (SELECT id_guru FROM guru WHERE nama LIKE "Test%")');
    await db.execute('DELETE FROM jadwal WHERE guru_id IN (SELECT id_guru FROM guru WHERE nama LIKE "Test%")');
    await db.execute('DELETE FROM guru WHERE nama LIKE "Test%"');
    await db.execute('DELETE FROM siswa_perwakilan WHERE nama LIKE "Test%"');
    await db.execute('DELETE FROM pengguna WHERE nama LIKE "Test%"');
    await db.execute('DELETE FROM mapel WHERE kode_mapel = "TEST"');
    await db.execute('DELETE FROM kelas WHERE nama_kelas LIKE "Test%"');
  } catch (error) {
    console.warn('Warning: Could not clean test data:', error.message);
  }
}
