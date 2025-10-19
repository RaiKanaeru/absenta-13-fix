// ================================================
// STRUCTURED LOGGING SYSTEM
// ================================================

import 'dotenv/config';
import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || 'logs';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'absenta-server' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        
        // File transport for errors
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 5242880, // 5MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
        }),
        
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 5242880, // 5MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
        })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'exceptions.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 5242880,
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'rejections.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 5242880,
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
        })
    ]
});

// Add request logging middleware
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });
    
    next();
};

// Add error logging middleware
export const errorLogger = (error, req, res, next) => {
    logger.error('Unhandled Error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress
    });
    
    next(error);
};

// Database operation logger
export const dbLogger = {
    query: (query, params, duration) => {
        logger.debug('Database Query', {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            paramCount: params ? params.length : 0,
            duration: `${duration}ms`
        });
    },
    
    error: (error, query) => {
        logger.error('Database Error', {
            error: error.message,
            code: error.code,
            query: query ? query.substring(0, 100) + '...' : 'N/A'
        });
    },
    
    transaction: (operation, success) => {
        logger.info('Database Transaction', {
            operation,
            success
        });
    }
};

// Authentication logger
export const authLogger = {
    login: (username, success, ip) => {
        logger.info('Authentication', {
            event: 'login_attempt',
            username,
            success,
            ip
        });
    },
    
    logout: (username, ip) => {
        logger.info('Authentication', {
            event: 'logout',
            username,
            ip
        });
    },
    
    tokenRefresh: (username, ip) => {
        logger.debug('Authentication', {
            event: 'token_refresh',
            username,
            ip
        });
    }
};

// Business logic logger
export const businessLogger = {
    userAction: (action, userId, details) => {
        logger.info('Business Logic', {
            event: 'user_action',
            action,
            userId,
            details
        });
    },
    
    dataChange: (table, operation, recordId, userId) => {
        logger.info('Data Change', {
            event: 'data_change',
            table,
            operation,
            recordId,
            userId
        });
    }
};

// System logger
export const systemLogger = {
    startup: (message) => {
        logger.info('System', {
            event: 'startup',
            message
        });
    },
    
    shutdown: (message) => {
        logger.info('System', {
            event: 'shutdown',
            message
        });
    },
    
    health: (status, details) => {
        logger.info('System', {
            event: 'health_check',
            status,
            details
        });
    }
};

export default logger;
