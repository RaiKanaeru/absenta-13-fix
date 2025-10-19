/**
 * Logger Utility - Centralized logging system
 * Provides structured logging with different levels and formats
 */

import fs from 'fs';
import path from 'path';

/**
 * Log levels
 */
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

/**
 * Logger class
 */
class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.format = options.format || 'combined';
        this.file = options.file || null;
        this.console = options.console !== false;
        
        // Create logs directory if file logging is enabled
        if (this.file) {
            const logDir = path.dirname(this.file);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }

    /**
     * Get current timestamp
     * @returns {string} Formatted timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @returns {string} Formatted log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = this.getTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        
        switch (this.format) {
            case 'json':
                return JSON.stringify({
                    timestamp,
                    level,
                    message,
                    ...meta
                });
                
            case 'combined':
                return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
                
            case 'simple':
                return `[${level.toUpperCase()}] ${message}`;
                
            default:
                return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        }
    }

    /**
     * Write log to file
     * @param {string} message - Formatted log message
     */
    writeToFile(message) {
        if (this.file) {
            try {
                fs.appendFileSync(this.file, message + '\n');
            } catch (error) {
                console.error('❌ Error writing to log file:', error);
            }
        }
    }

    /**
     * Write log to console
     * @param {string} level - Log level
     * @param {string} message - Formatted log message
     */
    writeToConsole(level, message) {
        if (this.console) {
            const colors = {
                error: '\x1b[31m', // Red
                warn: '\x1b[33m',  // Yellow
                info: '\x1b[36m',  // Cyan
                debug: '\x1b[90m'  // Gray
            };
            
            const reset = '\x1b[0m';
            const color = colors[level] || '';
            
            console.log(`${color}${message}${reset}`);
        }
    }

    /**
     * Log message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    log(level, message, meta = {}) {
        const currentLevel = LOG_LEVELS[this.level.toUpperCase()] || LOG_LEVELS.INFO;
        const messageLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
        
        if (messageLevel <= currentLevel) {
            const formattedMessage = this.formatMessage(level, message, meta);
            
            this.writeToConsole(level, formattedMessage);
            this.writeToFile(formattedMessage);
        }
    }

    /**
     * Error log
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    /**
     * Warning log
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * Info log
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * Debug log
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * HTTP request log
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} responseTime - Response time in ms
     */
    http(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        const level = res.statusCode >= 400 ? 'error' : 'info';
        this.log(level, `${req.method} ${req.url} ${res.statusCode}`, meta);
    }

    /**
     * Database query log
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @param {number} duration - Query duration in ms
     */
    query(query, params = [], duration = 0) {
        const meta = {
            query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
            params: params.length > 0 ? params : undefined,
            duration: `${duration}ms`
        };
        
        this.debug('Database query executed', meta);
    }

    /**
     * Authentication log
     * @param {string} action - Auth action
     * @param {string} username - Username
     * @param {string} ip - IP address
     * @param {boolean} success - Success status
     */
    auth(action, username, ip, success = true) {
        const meta = {
            action,
            username,
            ip,
            success,
            timestamp: this.getTimestamp()
        };
        
        const level = success ? 'info' : 'warn';
        this.log(level, `Auth ${action}: ${username}`, meta);
    }

    /**
     * Performance log
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in ms
     * @param {Object} meta - Additional metadata
     */
    performance(operation, duration, meta = {}) {
        const level = duration > 1000 ? 'warn' : 'info';
        this.log(level, `Performance: ${operation}`, {
            duration: `${duration}ms`,
            ...meta
        });
    }
}

/**
 * Create logger instance
 * @param {Object} options - Logger options
 * @returns {Logger} Logger instance
 */
export const createLogger = (options = {}) => {
    return new Logger(options);
};

/**
 * Default logger instance
 */
export const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || './logs/app.log',
    console: true
});

/**
 * Request logger middleware
 * @param {Logger} loggerInstance - Logger instance
 * @returns {Function} Express middleware
 */
export const requestLogger = (loggerInstance = logger) => {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            loggerInstance.http(req, res, responseTime);
        });
        
        next();
    };
};

/**
 * Error logger middleware
 * @param {Logger} loggerInstance - Logger instance
 * @returns {Function} Express middleware
 */
export const errorLogger = (loggerInstance = logger) => {
    return (error, req, res, next) => {
        loggerInstance.error('Unhandled error', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        next(error);
    };
};

export default logger;