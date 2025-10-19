/**
 * Error Handler Middleware - Global error handling
 * Centralized error processing and response formatting
 */

import { 
    mapDatabaseError, 
    mapJWTError, 
    mapValidationError, 
    mapFileError,
    logError,
    isOperationalError,
    createOperationalError
} from '../utils/errorHelper.js';
import { sendError } from '../utils/responseHelper.js';

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (error, req, res, next) => {
    // Log error with context
    logError(error, req, 'error');
    
    // Handle different types of errors
    let errorResponse;
    
    // Database errors
    if (error.code && error.code.startsWith('ER_')) {
        errorResponse = mapDatabaseError(error);
    }
    // JWT errors
    else if (error.name && ['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
        errorResponse = mapJWTError(error);
    }
    // Validation errors
    else if (error.name === 'ValidationError' || error.type === 'validation') {
        errorResponse = mapValidationError(error);
    }
    // File upload errors
    else if (error.code && ['LIMIT_FILE_SIZE', 'LIMIT_UNEXPECTED_FILE'].includes(error.code)) {
        errorResponse = mapFileError(error);
    }
    // Operational errors (expected)
    else if (isOperationalError(error)) {
        errorResponse = {
            message: error.message,
            statusCode: error.statusCode || 400,
            type: error.type || 'OPERATIONAL_ERROR'
        };
    }
    // Programming errors (unexpected)
    else {
        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        errorResponse = {
            message: isDevelopment ? error.message : 'Terjadi kesalahan internal server',
            statusCode: 500,
            type: 'INTERNAL_ERROR',
            ...(isDevelopment && { stack: error.stack })
        };
    }
    
    // Send error response
    return sendError(
        res, 
        errorResponse.message, 
        errorResponse.statusCode, 
        errorResponse.details || errorResponse.stack
    );
};

/**
 * Handle 404 Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
    const error = createOperationalError(
        `Route ${req.method} ${req.url} tidak ditemukan`,
        404,
        'NOT_FOUND'
    );
    next(error);
};

/**
 * Handle async errors
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Handle uncaught exceptions
 * Process uncaught exceptions
 */
export const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        console.error('❌ UNCAUGHT EXCEPTION:', error);
        console.error('Stack:', error.stack);
        
        // Log to file or external service
        // TODO: Implement proper logging service
        
        // Graceful shutdown
        process.exit(1);
    });
};

/**
 * Handle unhandled promise rejections
 * Process unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ UNHANDLED REJECTION at:', promise);
        console.error('Reason:', reason);
        
        // Log to file or external service
        // TODO: Implement proper logging service
        
        // Graceful shutdown
        process.exit(1);
    });
};

/**
 * Handle SIGTERM signal
 * Graceful shutdown on SIGTERM
 */
export const handleSIGTERM = () => {
    process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, shutting down gracefully');
        
        // Close database connections
        // TODO: Implement database cleanup
        
        process.exit(0);
    });
};

/**
 * Handle SIGINT signal
 * Graceful shutdown on SIGINT (Ctrl+C)
 */
export const handleSIGINT = () => {
    process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, shutting down gracefully');
        
        // Close database connections
        // TODO: Implement database cleanup
        
        process.exit(0);
    });
};

/**
 * Initialize all error handlers
 * Call this function to set up all error handling
 */
export const initializeErrorHandlers = () => {
    handleUncaughtException();
    handleUnhandledRejection();
    handleSIGTERM();
    handleSIGINT();
    
    console.log('✅ Error handlers initialized');
};

/**
 * Custom error classes for specific scenarios
 */
export class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.type = 'validation';
        this.details = details;
        this.isOperational = true;
    }
}

export class DatabaseError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'DatabaseError';
        this.code = code;
        this.isOperational = true;
    }
}

export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.type = 'authentication';
        this.isOperational = true;
    }
}

export class AuthorizationError extends Error {
    constructor(message = 'Insufficient permissions') {
        super(message);
        this.name = 'AuthorizationError';
        this.type = 'authorization';
        this.isOperational = true;
    }
}

export class NotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
        this.type = 'not_found';
        this.isOperational = true;
    }
}

export class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        this.type = 'conflict';
        this.isOperational = true;
    }
}
