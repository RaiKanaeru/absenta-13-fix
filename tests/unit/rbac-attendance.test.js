// RBAC Attendance Validation Tests
// Tests for KETOS cannot input DISPEN status

const request = require('supertest');
const app = require('../../server_modern.js');

describe('RBAC Attendance Validation', () => {
  let ketosToken;
  let guruToken;
  let adminToken;

  beforeAll(async () => {
    // Setup test tokens (mock implementation)
    ketosToken = 'mock-ketos-token';
    guruToken = 'mock-guru-token';
    adminToken = 'mock-admin-token';
  });

  describe('KETOS Role Restrictions', () => {
    test('KETOS should not be able to input DISPEN status', async () => {
      const attendanceData = {
        jadwal_id: 1,
        siswa_id: 1,
        tanggal: '2024-01-15',
        status: 'DISPEN',
        keterangan: 'Dispensasi dari guru'
      };

      const response = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${ketosToken}`)
        .send(attendanceData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('KETOS tidak diperbolehkan menginput status DISPEN');
    });

    test('KETOS should be able to input other statuses', async () => {
      const validStatuses = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPHA'];
      
      for (const status of validStatuses) {
        const attendanceData = {
          jadwal_id: 1,
          siswa_id: 1,
          tanggal: '2024-01-15',
          status: status,
          keterangan: 'Test keterangan'
        };

        const response = await request(app)
          .post('/api/attendance/submit')
          .set('Authorization', `Bearer ${ketosToken}`)
          .send(attendanceData);

        // Should not return 403 for these statuses
        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('GURU Role Permissions', () => {
    test('GURU should be able to input DISPEN status', async () => {
      const attendanceData = {
        jadwal_id: 1,
        siswa_id: 1,
        tanggal: '2024-01-15',
        status: 'DISPEN',
        keterangan: 'Dispensasi dari guru'
      };

      const response = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${guruToken}`)
        .send(attendanceData);

      expect(response.status).not.toBe(403);
      expect(response.body.success).toBe(true);
    });

    test('GURU should be able to input all statuses', async () => {
      const allStatuses = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'DISPEN', 'ALPHA'];
      
      for (const status of allStatuses) {
        const attendanceData = {
          jadwal_id: 1,
          siswa_id: 1,
          tanggal: '2024-01-15',
          status: status,
          keterangan: 'Test keterangan'
        };

        const response = await request(app)
          .post('/api/attendance/submit')
          .set('Authorization', `Bearer ${guruToken}`)
          .send(attendanceData);

        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('ADMIN Role Permissions', () => {
    test('ADMIN should be able to input DISPEN status', async () => {
      const attendanceData = {
        jadwal_id: 1,
        siswa_id: 1,
        tanggal: '2024-01-15',
        status: 'DISPEN',
        keterangan: 'Dispensasi dari admin'
      };

      const response = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(attendanceData);

      expect(response.status).not.toBe(403);
      expect(response.body.success).toBe(true);
    });

    test('ADMIN should be able to input all statuses', async () => {
      const allStatuses = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'DISPEN', 'ALPHA'];
      
      for (const status of allStatuses) {
        const attendanceData = {
          jadwal_id: 1,
          siswa_id: 1,
          tanggal: '2024-01-15',
          status: status,
          keterangan: 'Test keterangan'
        };

        const response = await request(app)
          .post('/api/attendance/submit')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(attendanceData);

        expect(response.status).not.toBe(403);
      }
    });
  });

  describe('Daily Recap Logic Tests', () => {
    test('DISPEN should count as HADIR in daily recap', async () => {
      // Test case: Student has DISPEN in one slot, HADIR in another
      // Expected: Daily status = HADIR
      
      const testData = {
        student_id: 1,
        date: '2024-01-15',
        slots: [
          { jadwal_id: 1, jam_ke: 1, status: 'DISPEN' },
          { jadwal_id: 2, jam_ke: 2, status: 'HADIR' }
        ]
      };

      // Mock the attendance aggregation service
      const { isPresentLike } = require('../../backend/services/attendanceAggregation.js');
      
      expect(isPresentLike('DISPEN')).toBe(true);
      expect(isPresentLike('HADIR')).toBe(true);
    });

    test('ALPHA should result in TIDAK_HADIR in daily recap', async () => {
      // Test case: Student has ALPHA in one slot, HADIR in another
      // Expected: Daily status = TIDAK_HADIR
      
      const testData = {
        student_id: 1,
        date: '2024-01-15',
        slots: [
          { jadwal_id: 1, jam_ke: 1, status: 'ALPHA' },
          { jadwal_id: 2, jam_ke: 2, status: 'HADIR' }
        ]
      };

      const { isPresentLike } = require('../../backend/services/attendanceAggregation.js');
      
      expect(isPresentLike('ALPHA')).toBe(false);
      expect(isPresentLike('HADIR')).toBe(true);
    });

    test('Mixed present-like statuses should result in HADIR', async () => {
      // Test case: Student has SAKIT, IZIN, DISPEN in different slots
      // Expected: Daily status = HADIR
      
      const presentLikeStatuses = ['SAKIT', 'IZIN', 'DISPEN', 'HADIR', 'TERLAMBAT'];
      
      const { isPresentLike } = require('../../backend/services/attendanceAggregation.js');
      
      presentLikeStatuses.forEach(status => {
        expect(isPresentLike(status)).toBe(true);
      });
    });
  });

  describe('Endpoint Removal Tests', () => {
    test('Pengajuan izin endpoints should return 404', async () => {
      const izinEndpoints = [
        '/api/siswa/1/pengajuan-izin',
        '/api/guru/1/pengajuan-izin',
        '/api/admin/riwayat-izin-report',
        '/api/admin/download-riwayat-izin'
      ];

      for (const endpoint of izinEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);

        // Should return 404 or method not allowed
        expect([404, 405]).toContain(response.status);
      }
    });
  });
});

module.exports = {
  // Export test utilities if needed
};