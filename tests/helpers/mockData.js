/**
 * Mock Data Factory for Tests
 * Factory functions untuk generate test data
 */

export class MockDataFactory {
    /**
     * Generate test user data
     * @param {Object} overrides - Data overrides
     * @returns {Object} User data
     */
    static createUser(overrides = {}) {
        return {
            username: 'testuser',
            password: 'testpass123',
            role: 'admin',
            nama: 'Test User',
            email: 'test@example.com',
            status: 'aktif',
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test teacher data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Teacher data
     */
    static createTeacher(overrides = {}) {
        return {
            id_guru: 1,
            user_id: 2,
            username: 'guru001',
            nip: '123456789',
            nama: 'Guru Test',
            email: 'guru@test.com',
            mapel_id: 1,
            no_telp: '081234567890',
            alamat: 'Alamat Test',
            jenis_kelamin: 'L',
            status: 'aktif',
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test student data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Student data
     */
    static createStudent(overrides = {}) {
        return {
            id_siswa: 2000,
            user_id: 3,
            username: 'perwakilan2000',
            nis: '2000',
            nama: 'Siswa Test',
            kelas_id: 1,
            jabatan: 'Sekretaris Kelas',
            jenis_kelamin: 'L',
            email: 'siswa@test.com',
            alamat: 'Alamat Test',
            telepon_orangtua: '081234567890',
            telepon_siswa: '081234567891',
            status: 'aktif',
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test class data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Class data
     */
    static createClass(overrides = {}) {
        return {
            id_kelas: 1,
            nama_kelas: 'X IPA 1',
            tingkat: 'X',
            ruang: 'R.301',
            kode_ruang: 'R301',
            jumlah_siswa: 30,
            status: 'aktif',
            created_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test subject data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Subject data
     */
    static createSubject(overrides = {}) {
        return {
            id_mapel: 1,
            kode_mapel: 'MTK-01',
            nama_mapel: 'Matematika',
            deskripsi: 'Mata pelajaran Matematika',
            status: 'aktif',
            created_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test schedule data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Schedule data
     */
    static createSchedule(overrides = {}) {
        return {
            id_jadwal: 1,
            kelas_id: 1,
            mapel_id: 1,
            guru_id: 1,
            ruang_id: 1,
            hari: 'Senin',
            jam_ke: 1,
            jam_mulai: '07:00:00',
            jam_selesai: '07:45:00',
            status: 'aktif',
            created_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate test attendance data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Attendance data
     */
    static createAttendance(overrides = {}) {
        return {
            id_absensi: 1,
            jadwal_id: 1,
            guru_id: 1,
            kelas_id: 1,
            siswa_pencatat_id: 2000,
            tanggal: new Date().toISOString().split('T')[0],
            jam_ke: 1,
            status: 'Hadir',
            keterangan: '',
            waktu_catat: new Date(),
            waktu_scan: null,
            metode_absen: 'manual',
            jam_terlambat: 0,
            alasan_terlambat: '',
            ...overrides
        };
    }

    /**
     * Generate test permission request data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Permission request data
     */
    static createPermissionRequest(overrides = {}) {
        return {
            id_pengajuan: 1,
            siswa_id: 2000,
            jadwal_id: 1,
            tanggal_izin: new Date().toISOString().split('T')[0],
            tanggal_mulai: new Date().toISOString().split('T')[0],
            tanggal_selesai: new Date().toISOString().split('T')[0],
            jenis_izin: 'sakit',
            alasan: 'Sakit demam',
            bukti_pendukung: '',
            status: 'pending',
            keterangan_guru: '',
            tanggal_pengajuan: new Date(),
            tanggal_respon: null,
            tanggal_disetujui: null,
            guru_id: 1,
            ...overrides
        };
    }

    /**
     * Generate test dispute data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Dispute data
     */
    static createDispute(overrides = {}) {
        return {
            id_banding: 1,
            pengajuan_id: 1,
            alasan_banding: 'Saya hadir tapi tidak tercatat',
            bukti_tambahan: '',
            status_banding: 'pending',
            keterangan_admin: '',
            tanggal_banding: new Date(),
            tanggal_keputusan: null,
            admin_id: 1,
            ...overrides
        };
    }

    /**
     * Generate test room data
     * @param {Object} overrides - Data overrides
     * @returns {Object} Room data
     */
    static createRoom(overrides = {}) {
        return {
            id: 1,
            nama_ruang: 'Ruang 301',
            kode_ruang: 'R.301',
            kapasitas: 30,
            lokasi: 'Lantai 3',
            status: 'aktif',
            created_at: new Date(),
            updated_at: new Date(),
            ...overrides
        };
    }

    /**
     * Generate multiple test users
     * @param {number} count - Number of users to generate
     * @param {Object} baseOverrides - Base overrides for all users
     * @returns {Array} Array of user data
     */
    static createMultipleUsers(count = 5, baseOverrides = {}) {
        return Array.from({ length: count }, (_, index) => 
            this.createUser({
                username: `user${index + 1}`,
                email: `user${index + 1}@test.com`,
                ...baseOverrides
            })
        );
    }

    /**
     * Generate multiple test teachers
     * @param {number} count - Number of teachers to generate
     * @param {Object} baseOverrides - Base overrides for all teachers
     * @returns {Array} Array of teacher data
     */
    static createMultipleTeachers(count = 5, baseOverrides = {}) {
        return Array.from({ length: count }, (_, index) => 
            this.createTeacher({
                id_guru: index + 1,
                username: `guru${String(index + 1).padStart(3, '0')}`,
                nip: `12345678${index}`,
                nama: `Guru ${index + 1}`,
                email: `guru${index + 1}@test.com`,
                ...baseOverrides
            })
        );
    }

    /**
     * Generate multiple test students
     * @param {number} count - Number of students to generate
     * @param {Object} baseOverrides - Base overrides for all students
     * @returns {Array} Array of student data
     */
    static createMultipleStudents(count = 5, baseOverrides = {}) {
        return Array.from({ length: count }, (_, index) => 
            this.createStudent({
                id_siswa: 2000 + index,
                username: `perwakilan${2000 + index}`,
                nis: String(2000 + index),
                nama: `Siswa ${index + 1}`,
                email: `siswa${index + 1}@test.com`,
                ...baseOverrides
            })
        );
    }

    /**
     * Generate test API request data
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Object} API request data
     */
    static createApiRequest(endpoint, data = {}, headers = {}) {
        return {
            url: `http://localhost:3001${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(data)
        };
    }

    /**
     * Generate test file upload data
     * @param {string} filename - File name
     * @param {string} mimetype - File MIME type
     * @param {number} size - File size in bytes
     * @returns {Object} File upload data
     */
    static createFileUpload(filename, mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size = 1024) {
        return {
            fieldname: 'file',
            originalname: filename,
            encoding: '7bit',
            mimetype: mimetype,
            size: size,
            buffer: Buffer.alloc(size)
        };
    }
}

// Export singleton instance
export const mockDataFactory = new MockDataFactory();
export default MockDataFactory;
