/**
 * Error Helper - Centralized error handling utilities
 * Provides error mapping, logging, and standardized error responses
 */

/**
 * Database error codes mapping
 */
export const DB_ERROR_CODES = {
    DUPLICATE_ENTRY: 'ER_DUP_ENTRY',
    FOREIGN_KEY_CONSTRAINT: 'ER_NO_REFERENCED_ROW_2',
    INVALID_DATA: 'ER_TRUNCATED_WRONG_VALUE',
    CONNECTION_LOST: 'PROTOCOL_CONNECTION_LOST',
    TIMEOUT: 'ETIMEDOUT'
};

/**
 * Map database error to user-friendly message
 * @param {Error} error - Database error
 * @returns {Object} Mapped error with message and status code
 */
export const mapDatabaseError = (error) => {
    console.error('🔍 Database Error:', error);
    
    switch (error.code) {
        case DB_ERROR_CODES.DUPLICATE_ENTRY:
            return {
                message: 'Data sudah ada dalam sistem',
                statusCode: 409,
                type: 'DUPLICATE_ENTRY'
            };
            
        case DB_ERROR_CODES.FOREIGN_KEY_CONSTRAINT:
            return {
                message: 'Data yang dirujuk tidak ditemukan',
                statusCode: 400,
                type: 'FOREIGN_KEY_CONSTRAINT'
            };
            
        case DB_ERROR_CODES.INVALID_DATA:
            return {
                message: 'Format data tidak valid',
                statusCode: 400,
                type: 'INVALID_DATA'
            };
            
        case DB_ERROR_CODES.CONNECTION_LOST:
        case DB_ERROR_CODES.TIMEOUT:
            return {
                message: 'Koneksi database terputus, silakan coba lagi',
                statusCode: 503,
                type: 'CONNECTION_ERROR'
            };
            
        default:
            return {
                message: 'Terjadi kesalahan pada database',
                statusCode: 500,
                type: 'DATABASE_ERROR'
            };
    }
};

/**
 * Map JWT error to user-friendly message
 * @param {Error} error - JWT error
 * @returns {Object} Mapped error with message and status code
 */
export const mapJWTError = (error) => {
    console.error('🔍 JWT Error:', error);
    
    switch (error.name) {
        case 'TokenExpiredError':
            return {
                message: 'Token telah kedaluwarsa',
                statusCode: 401,
                type: 'TOKEN_EXPIRED'
            };
            
        case 'JsonWebTokenError':
            return {
                message: 'Token tidak valid',
                statusCode: 401,
                type: 'INVALID_TOKEN'
            };
            
        case 'NotBeforeError':
            return {
                message: 'Token belum aktif',
                statusCode: 401,
                type: 'TOKEN_NOT_ACTIVE'
            };
            
        default:
            return {
                message: 'Kesalahan autentikasi',
                statusCode: 401,
                type: 'AUTH_ERROR'
            };
    }
};

/**
 * Map validation error to user-friendly message
 * @param {Error} error - Validation error
 * @returns {Object} Mapped error with message and status code
 */
export const mapValidationError = (error) => {
    console.error('🔍 Validation Error:', error);
    
    if (error.name === 'ValidationError') {
        return {
            message: 'Data tidak valid',
            statusCode: 400,
            type: 'VALIDATION_ERROR',
            details: error.details || error.message
        };
    }
    
    return {
        message: 'Format data tidak sesuai',
        statusCode: 400,
        type: 'INVALID_FORMAT'
    };
};

/**
 * Map file upload error to user-friendly message
 * @param {Error} error - File upload error
 * @returns {Object} Mapped error with message and status code
 */
export const mapFileError = (error) => {
    console.error('🔍 File Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return {
            message: 'Ukuran file terlalu besar',
            statusCode: 413,
            type: 'FILE_TOO_LARGE'
        };
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return {
            message: 'Jenis file tidak diizinkan',
            statusCode: 400,
            type: 'INVALID_FILE_TYPE'
        };
    }
    
    return {
        message: 'Kesalahan upload file',
        statusCode: 500,
        type: 'FILE_UPLOAD_ERROR'
    };
};

/**
 * Get error context for logging
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @returns {Object} Error context
 */
export const getErrorContext = (error, req) => {
    return {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    };
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {string} level - Log level (error, warn, info)
 */
export const logError = (error, req, level = 'error') => {
    const context = getErrorContext(error, req);
    
    console[level](`❌ ${level.toUpperCase()}:`, {
        ...context,
        error: error.name,
        code: error.code
    });
};

/**
 * Check if error is operational (expected) or programming (unexpected)
 * @param {Error} error - Error object
 * @returns {boolean} True if operational error
 */
export const isOperationalError = (error) => {
    if (error.isOperational) {
        return true;
    }
    
    // Database errors are usually operational
    if (error.code && Object.values(DB_ERROR_CODES).includes(error.code)) {
        return true;
    }
    
    // JWT errors are operational
    if (error.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
        return true;
    }
    
    return false;
};

/**
 * Create operational error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} type - Error type
 * @returns {Error} Operational error
 */
export const createOperationalError = (message, statusCode = 500, type = 'OPERATIONAL_ERROR') => {
    const error = new Error(message);
    error.isOperational = true;
    error.statusCode = statusCode;
    error.type = type;
    return error;
};
