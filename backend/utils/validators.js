/**
 * Validators - Input validation utilities
 * Provides reusable validation functions for all endpoints
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format (Indonesian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const isValidPhone = (phone) => {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    return phoneRegex.test(phone);
};

/**
 * Validate NIP format (Teacher ID)
 * @param {string} nip - NIP to validate
 * @returns {boolean} True if valid NIP
 */
export const isValidNIP = (nip) => {
    const nipRegex = /^[0-9]{8,18}$/;
    return nipRegex.test(nip);
};

/**
 * Validate NIS format (Student ID)
 * @param {string} nis - NIS to validate
 * @returns {boolean} True if valid NIS
 */
export const isValidNIS = (nis) => {
    const nisRegex = /^[0-9]{8,15}$/;
    return nisRegex.test(nis);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid username
 */
export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return {
            isValid: false,
            message: 'Password minimal 6 karakter'
        };
    }
    
    if (password.length > 50) {
        return {
            isValid: false,
            message: 'Password maksimal 50 karakter'
        };
    }
    
    return {
        isValid: true,
        message: 'Password valid'
    };
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return false;
    }
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time to validate
 * @returns {boolean} True if valid time
 */
export const isValidTime = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
export const isValidRole = (role) => {
    const validRoles = ['admin', 'guru', 'siswa'];
    return validRoles.includes(role?.toLowerCase());
};

/**
 * Validate attendance status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export const isValidAttendanceStatus = (status) => {
    const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen'];
    return validStatuses.includes(status);
};

/**
 * Validate gender
 * @param {string} gender - Gender to validate
 * @returns {boolean} True if valid gender
 */
export const isValidGender = (gender) => {
    const validGenders = ['Laki-laki', 'Perempuan', 'L', 'P'];
    return validGenders.includes(gender);
};

/**
 * Validate day of week
 * @param {string} day - Day to validate
 * @returns {boolean} True if valid day
 */
export const isValidDay = (day) => {
    const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return validDays.includes(day);
};

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated pagination
 */
export const validatePagination = (params) => {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
};

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return {
            isValid: false,
            message: 'Tanggal mulai dan tanggal akhir harus diisi'
        };
    }
    
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return {
            isValid: false,
            message: 'Format tanggal tidak valid (YYYY-MM-DD)'
        };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        return {
            isValid: false,
            message: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir'
        };
    }
    
    return {
        isValid: true,
        startDate,
        endDate
    };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 255); // Limit length
};

/**
 * Validate file upload
 * @param {Object} file - File object
 * @param {Array} allowedTypes - Allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Object} Validation result
 */
export const validateFile = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
    if (!file) {
        return {
            isValid: false,
            message: 'File tidak ditemukan'
        };
    }
    
    if (file.size > maxSize) {
        return {
            isValid: false,
            message: `Ukuran file terlalu besar. Maksimal ${Math.round(maxSize / 1024 / 1024)}MB`
        };
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return {
            isValid: false,
            message: `Jenis file tidak diizinkan. Hanya ${allowedTypes.join(', ')}`
        };
    }
    
    return {
        isValid: true,
        message: 'File valid'
    };
};

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Required field names
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter(field => {
        const value = data[field];
        return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
        return {
            isValid: false,
            message: `Field yang wajib diisi: ${missingFields.join(', ')}`,
            missingFields
        };
    }
    
    return {
        isValid: true,
        message: 'Semua field wajib terisi'
    };
};

// ========================================================================
// IMPORT VALIDATION FUNCTIONS (Added for Excel/CSV Import Feature)
// ========================================================================

/**
 * Validate Mapel (Subject) row data for import
 * @param {Object} data - Row data object
 * @param {number} rowNumber - Excel row number (for error reporting)
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export const validateMapelRow = (data, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!data.kode_mapel || (typeof data.kode_mapel === 'string' && data.kode_mapel.trim() === '')) {
        errors.push('Kode Mapel wajib diisi');
    }
    
    if (!data.nama_mapel || (typeof data.nama_mapel === 'string' && data.nama_mapel.trim() === '')) {
        errors.push('Nama Mapel wajib diisi');
    }
    
    // Format validation
    if (data.kode_mapel && /\s/.test(data.kode_mapel)) {
        errors.push('Kode Mapel tidak boleh mengandung spasi');
    }
    
    // Length validation
    if (data.kode_mapel && data.kode_mapel.length > 20) {
        errors.push('Kode Mapel maksimal 20 karakter');
    }
    
    if (data.nama_mapel && data.nama_mapel.length > 100) {
        errors.push('Nama Mapel maksimal 100 karakter');
    }
    
    // Status validation
    if (data.status && !['aktif', 'tidak_aktif'].includes(data.status.toLowerCase())) {
        errors.push('Status harus: aktif atau tidak_aktif');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

/**
 * Validate Kelas (Class) row data for import
 * @param {Object} data - Row data object
 * @param {number} rowNumber - Excel row number
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export const validateKelasRow = (data, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!data.nama_kelas || (typeof data.nama_kelas === 'string' && data.nama_kelas.trim() === '')) {
        errors.push('Nama Kelas wajib diisi');
    }
    
    // Length validation
    if (data.nama_kelas && data.nama_kelas.length > 50) {
        errors.push('Nama Kelas maksimal 50 karakter');
    }
    
    if (data.tingkat && data.tingkat.length > 10) {
        errors.push('Tingkat maksimal 10 karakter');
    }
    
    // Status validation
    if (data.status && !['aktif', 'tidak_aktif'].includes(data.status.toLowerCase())) {
        errors.push('Status harus: aktif atau tidak_aktif');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

/**
 * Validate Guru (Teacher) row data for import
 * @param {Object} data - Row data object
 * @param {number} rowNumber - Excel row number
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export const validateGuruRow = (data, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!data.nip || (typeof data.nip === 'string' && data.nip.trim() === '')) {
        errors.push('NIP wajib diisi');
    }
    
    if (!data.nama || (typeof data.nama === 'string' && data.nama.trim() === '')) {
        errors.push('Nama wajib diisi');
    }
    
    // NIP format validation (8-18 digits)
    if (data.nip && !/^\d{8,18}$/.test(String(data.nip))) {
        errors.push('NIP harus 8-18 digit angka');
    }
    
    // Length validation
    if (data.nama && data.nama.length > 100) {
        errors.push('Nama maksimal 100 karakter');
    }
    
    // Gender validation
    if (data.jenis_kelamin && !['L', 'P', 'l', 'p'].includes(data.jenis_kelamin)) {
        errors.push('Jenis Kelamin harus: L atau P');
    }
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Format email tidak valid');
    }
    
    // Phone validation
    if (data.no_telp && !isValidPhone(data.no_telp)) {
        errors.push('Format nomor telepon tidak valid');
    }
    
    // Status validation
    if (data.status && !['aktif', 'tidak_aktif', 'pensiun'].includes(data.status.toLowerCase())) {
        errors.push('Status harus: aktif, tidak_aktif, atau pensiun');
    }
    
    // Username format (if provided)
    if (data.username && !isValidUsername(data.username)) {
        errors.push('Username harus 3-20 karakter alfanumerik dan underscore');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

/**
 * Validate Siswa (Student) row data for import
 * @param {Object} data - Row data object
 * @param {number} rowNumber - Excel row number
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export const validateSiswaRow = (data, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!data.nis || (typeof data.nis === 'string' && data.nis.trim() === '')) {
        errors.push('NIS wajib diisi');
    }
    
    if (!data.nama || (typeof data.nama === 'string' && data.nama.trim() === '')) {
        errors.push('Nama wajib diisi');
    }
    
    if (!data.kelas_id || data.kelas_id === '') {
        errors.push('Kelas ID wajib diisi');
    }
    
    // NIS format validation (8-15 digits)
    if (data.nis && !/^\d{8,15}$/.test(String(data.nis))) {
        errors.push('NIS harus 8-15 digit angka');
    }
    
    // Length validation
    if (data.nama && data.nama.length > 100) {
        errors.push('Nama maksimal 100 karakter');
    }
    
    // Gender validation
    if (data.jenis_kelamin && !['L', 'P', 'l', 'p'].includes(data.jenis_kelamin)) {
        errors.push('Jenis Kelamin harus: L atau P');
    }
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Format email tidak valid');
    }
    
    // Phone validation
    if (data.telepon_siswa && !isValidPhone(data.telepon_siswa)) {
        errors.push('Format telepon siswa tidak valid');
    }
    
    if (data.telepon_orangtua && !isValidPhone(data.telepon_orangtua)) {
        errors.push('Format telepon orang tua tidak valid');
    }
    
    // Status validation
    if (data.status && !['aktif', 'tidak_aktif', 'lulus', 'pindah', 'alumni', 'keluar'].includes(data.status.toLowerCase())) {
        errors.push('Status harus: aktif, tidak_aktif, lulus, pindah, alumni, atau keluar');
    }
    
    // Username format (if provided)
    if (data.username && !isValidUsername(data.username)) {
        errors.push('Username harus 3-20 karakter alfanumerik dan underscore');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

/**
 * Validate Jadwal (Schedule) row data for import
 * @param {Object} data - Row data object
 * @param {number} rowNumber - Excel row number
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
export const validateJadwalRow = (data, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!data.kelas_id || data.kelas_id === '') {
        errors.push('Kelas ID wajib diisi');
    }
    
    if (!data.mapel_id || data.mapel_id === '') {
        errors.push('Mapel ID wajib diisi');
    }
    
    if (!data.guru_id || data.guru_id === '') {
        errors.push('Guru ID wajib diisi');
    }
    
    if (!data.hari || (typeof data.hari === 'string' && data.hari.trim() === '')) {
        errors.push('Hari wajib diisi');
    }
    
    if (!data.jam_ke || data.jam_ke === '') {
        errors.push('Jam Ke wajib diisi');
    }
    
    if (!data.jam_mulai || (typeof data.jam_mulai === 'string' && data.jam_mulai.trim() === '')) {
        errors.push('Jam Mulai wajib diisi');
    }
    
    if (!data.jam_selesai || (typeof data.jam_selesai === 'string' && data.jam_selesai.trim() === '')) {
        errors.push('Jam Selesai wajib diisi');
    }
    
    // Hari validation
    const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    if (data.hari && !validDays.includes(data.hari)) {
        errors.push(`Hari harus salah satu dari: ${validDays.join(', ')}`);
    }
    
    // Jam ke validation (1-12)
    const jamKe = parseInt(data.jam_ke);
    if (isNaN(jamKe) || jamKe < 1 || jamKe > 12) {
        errors.push('Jam Ke harus angka antara 1-12');
    }
    
    // Time format validation (HH:MM:SS or HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (data.jam_mulai && !timeRegex.test(String(data.jam_mulai))) {
        errors.push('Format Jam Mulai harus HH:MM:SS atau HH:MM (contoh: 07:00:00 atau 07:00)');
    }
    
    if (data.jam_selesai && !timeRegex.test(String(data.jam_selesai))) {
        errors.push('Format Jam Selesai harus HH:MM:SS atau HH:MM (contoh: 07:45:00 atau 07:45)');
    }
    
    // Status validation
    if (data.status && !['aktif', 'tidak_aktif'].includes(data.status.toLowerCase())) {
        errors.push('Status harus: aktif atau tidak_aktif');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

console.log('✅ Validator functions loaded (including import validators)');