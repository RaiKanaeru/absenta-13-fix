/**
 * Request Logging Middleware
 * Middleware untuk logging HTTP requests dan responses
 */

import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Mencatat semua HTTP requests dengan detail
 */
export function requestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    const { method, url, ip, headers } = req;
    
    // Log request start
    logger.info('api', `Request started: ${method} ${url}`, {
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      contentType: headers['content-type'],
      contentLength: headers['content-length']
    });

    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const { statusCode } = res;
      
      // Log response
      logger.logApi(method, url, statusCode, responseTime, ip, {
        contentLength: res.get('content-length'),
        contentType: res.get('content-type'),
        responseTime
      });

      // Log slow requests
      if (responseTime > 5000) {
        logger.warn('performance', `Slow request detected: ${method} ${url}`, {
          responseTime,
          statusCode,
          ip
        });
      }

      // Log errors
      if (statusCode >= 400) {
        logger.error('api', `HTTP Error: ${statusCode}`, {
          method,
          url,
          statusCode,
          responseTime,
          ip,
          userAgent: headers['user-agent']
        });
      }

      // Call original end
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Error logging middleware
 * Mencatat semua errors yang terjadi
 */
export function errorLogger() {
  return (error, req, res, next) => {
    const { method, url, ip } = req;
    
    logger.error('error', `Unhandled error: ${error.message}`, {
      method,
      url,
      ip,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode || 500
    });

    // Log to security if it's a security-related error
    if (error.statusCode === 401 || error.statusCode === 403) {
      logger.logSecurity('unauthorized_access', 'medium', req.user?.username, ip, {
        method,
        url,
        error: error.message
      });
    }

    next(error);
  };
}

/**
 * Database query logging middleware
 * Mencatat semua database queries
 */
export function databaseLogger() {
  return (req, res, next) => {
    // This would be integrated with database connection
    // For now, we'll create a wrapper function
    next();
  };
}

/**
 * Security event logging middleware
 * Mencatat security-related events
 */
export function securityLogger() {
  return (req, res, next) => {
    // Log authentication attempts
    if (req.path === '/api/auth/login') {
      const originalSend = res.send;
      res.send = function(data) {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            logger.logAuth('login_success', req.body.username, req.ip, true);
          } else {
            logger.logAuth('login_failed', req.body.username, req.ip, false, {
              reason: response.error
            });
          }
        } catch (error) {
          // Ignore parsing errors
        }
        
        originalSend.call(this, data);
      };
    }

    // Log logout attempts
    if (req.path === '/api/auth/logout') {
      logger.logAuth('logout', req.user?.username, req.ip, true);
    }

    next();
  };
}

/**
 * Performance monitoring middleware
 * Mencatat performance metrics
 */
export function performanceLogger() {
  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      logger.logPerformance(`${req.method} ${req.path}`, duration, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode
      });
    });

    next();
  };
}

/**
 * Business logic logging middleware
 * Mencatat business operations
 */
export function businessLogger() {
  return (req, res, next) => {
    // Log specific business operations
    const businessPaths = [
      '/api/admin/siswa-perwakilan',
      '/api/admin/guru',
      '/api/attendance/submit',
      '/api/admin/kelas',
      '/api/admin/mapel'
    ];

    if (businessPaths.some(path => req.path.includes(path))) {
      const originalSend = res.send;
      res.send = function(data) {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            logger.logBusiness(
              `${req.method} ${req.path}`,
              req.path.split('/')[2], // Extract entity type
              req.params.id || 'new',
              {
                userId: req.user?.id,
                username: req.user?.username,
                ip: req.ip
              }
            );
          }
        } catch (error) {
          // Ignore parsing errors
        }
        
        originalSend.call(this, data);
      };
    }

    next();
  };
}

export default {
  requestLogger,
  errorLogger,
  databaseLogger,
  securityLogger,
  performanceLogger,
  businessLogger
};
