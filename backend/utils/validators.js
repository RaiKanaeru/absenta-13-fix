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
