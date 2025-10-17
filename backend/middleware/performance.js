// backend/middleware/performance.js
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger.js';
import { captureMessage, addBreadcrumb } from '../config/sentry.js';

// Performance metrics storage
const performanceMetrics = {
  requests: new Map(),
  database: new Map(),
  memory: {
    usage: [],
    peak: 0,
  },
  cpu: {
    usage: [],
    peak: 0,
  },
};

// Performance monitoring middleware
export const performanceMiddleware = (req, res, next) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  // Add performance context
  req.performance = {
    startTime,
    startMemory,
    requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    
    // Calculate memory delta
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    // Store performance metrics
    const metrics = {
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      duration,
      memory: {
        start: startMemory,
        end: endMemory,
        delta: memoryDelta,
      },
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // Store in memory (with cleanup)
    performanceMetrics.requests.set(req.performance.requestId, metrics);
    
    // Cleanup old metrics (keep last 1000)
    if (performanceMetrics.requests.size > 1000) {
      const oldestKey = performanceMetrics.requests.keys().next().value;
      performanceMetrics.requests.delete(oldestKey);
    }

    // Log slow requests
    if (duration > 1000) { // 1 second
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memory: memoryDelta,
      });

      // Send to Sentry
      captureMessage('Slow request detected', 'warning', {
        method: req.method,
        url: req.path,
        duration: duration,
        statusCode: res.statusCode,
        memory: memoryDelta,
      });
    }

    // Add breadcrumb for performance tracking
    addBreadcrumb({
      message: `${req.method} ${req.path} - ${duration.toFixed(2)}ms`,
      category: 'performance',
      level: duration > 1000 ? 'warning' : 'info',
      data: {
        method: req.method,
        url: req.path,
        duration: duration,
        statusCode: res.statusCode,
        memory: memoryDelta,
      },
    });

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database performance monitoring
export const databasePerformanceMiddleware = (query, params, startTime, endTime) => {
  const duration = endTime - startTime;
  
  const dbMetrics = {
    query: query.substring(0, 100), // Truncate long queries
    duration,
    timestamp: new Date().toISOString(),
    params: params ? params.length : 0,
  };

  // Store database metrics
  performanceMetrics.database.set(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, dbMetrics);

  // Cleanup old database metrics
  if (performanceMetrics.database.size > 500) {
    const oldestKey = performanceMetrics.database.keys().next().value;
    performanceMetrics.database.delete(oldestKey);
  }

  // Log slow queries
  if (duration > 100) { // 100ms
    logger.warn('Slow database query detected', {
      query: query.substring(0, 100),
      duration: `${duration.toFixed(2)}ms`,
      params: params ? params.length : 0,
    });

    // Send to Sentry
    captureMessage('Slow database query detected', 'warning', {
      query: query.substring(0, 100),
      duration: duration,
      params: params ? params.length : 0,
    });
  }

  // Add breadcrumb
  addBreadcrumb({
    message: `Database query - ${duration.toFixed(2)}ms`,
    category: 'database',
    level: duration > 100 ? 'warning' : 'info',
    data: {
      query: query.substring(0, 100),
      duration: duration,
      params: params ? params.length : 0,
    },
  });
};

// Memory monitoring
export const memoryMonitoring = () => {
  const memoryUsage = process.memoryUsage();
  const timestamp = new Date().toISOString();

  // Store memory metrics
  performanceMetrics.memory.usage.push({
    timestamp,
    rss: memoryUsage.rss,
    heapUsed: memoryUsage.heapUsed,
    heapTotal: memoryUsage.heapTotal,
    external: memoryUsage.external,
  });

  // Keep only last 100 memory snapshots
  if (performanceMetrics.memory.usage.length > 100) {
    performanceMetrics.memory.usage.shift();
  }

  // Track peak memory
  if (memoryUsage.heapUsed > performanceMetrics.memory.peak) {
    performanceMetrics.memory.peak = memoryUsage.heapUsed;
  }

  // Log high memory usage
  if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    logger.warn('High memory usage detected', {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
    });

    // Send to Sentry
    captureMessage('High memory usage detected', 'warning', {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
    });
  }
};

// CPU monitoring
export const cpuMonitoring = () => {
  const cpuUsage = process.cpuUsage();
  const timestamp = new Date().toISOString();

  // Store CPU metrics
  performanceMetrics.cpu.usage.push({
    timestamp,
    user: cpuUsage.user,
    system: cpuUsage.system,
  });

  // Keep only last 100 CPU snapshots
  if (performanceMetrics.cpu.usage.length > 100) {
    performanceMetrics.cpu.usage.shift();
  }

  // Track peak CPU
  const totalCpu = cpuUsage.user + cpuUsage.system;
  if (totalCpu > performanceMetrics.cpu.peak) {
    performanceMetrics.cpu.peak = totalCpu;
  }
};

// Get performance metrics
export const getPerformanceMetrics = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Filter recent requests
  const recentRequests = Array.from(performanceMetrics.requests.values())
    .filter(metric => new Date(metric.timestamp) > oneHourAgo);

  // Calculate averages
  const avgDuration = recentRequests.length > 0 
    ? recentRequests.reduce((sum, metric) => sum + metric.duration, 0) / recentRequests.length 
    : 0;

  const avgMemory = recentRequests.length > 0
    ? recentRequests.reduce((sum, metric) => sum + metric.memory.delta.heapUsed, 0) / recentRequests.length
    : 0;

  // Filter recent database queries
  const recentDbQueries = Array.from(performanceMetrics.database.values())
    .filter(metric => new Date(metric.timestamp) > oneHourAgo);

  const avgDbDuration = recentDbQueries.length > 0
    ? recentDbQueries.reduce((sum, metric) => sum + metric.duration, 0) / recentDbQueries.length
    : 0;

  return {
    requests: {
      total: recentRequests.length,
      averageDuration: avgDuration,
      averageMemory: avgMemory,
      slowRequests: recentRequests.filter(r => r.duration > 1000).length,
    },
    database: {
      total: recentDbQueries.length,
      averageDuration: avgDbDuration,
      slowQueries: recentDbQueries.filter(q => q.duration > 100).length,
    },
    memory: {
      current: process.memoryUsage(),
      peak: performanceMetrics.memory.peak,
      usage: performanceMetrics.memory.usage.slice(-10), // Last 10 snapshots
    },
    cpu: {
      current: process.cpuUsage(),
      peak: performanceMetrics.cpu.peak,
      usage: performanceMetrics.cpu.usage.slice(-10), // Last 10 snapshots
    },
    timestamp: now.toISOString(),
  };
};

// Start monitoring
export const startPerformanceMonitoring = () => {
  // Monitor memory every 30 seconds
  setInterval(memoryMonitoring, 30000);
  
  // Monitor CPU every 30 seconds
  setInterval(cpuMonitoring, 30000);

  logger.info('Performance monitoring started');
};

// Performance monitoring routes
export const performanceRoutes = (app) => {
  // Get performance metrics endpoint
  app.get('/api/performance/metrics', (req, res) => {
    try {
      const metrics = getPerformanceMetrics();
      res.json({
        success: true,
        data: metrics,
        message: 'Performance metrics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error retrieving performance metrics', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  });

  // Get performance health endpoint
  app.get('/api/performance/health', (req, res) => {
    try {
      const metrics = getPerformanceMetrics();
      const memoryUsage = process.memoryUsage();
      
      // Determine health status
      let status = 'healthy';
      let issues = [];

      // Check memory usage
      if (memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
        status = 'warning';
        issues.push('High memory usage');
      }

      // Check for slow requests
      if (metrics.requests.slowRequests > 10) {
        status = 'warning';
        issues.push('Multiple slow requests detected');
      }

      // Check for slow database queries
      if (metrics.database.slowQueries > 5) {
        status = 'warning';
        issues.push('Multiple slow database queries detected');
      }

      res.json({
        success: true,
        data: {
          status,
          issues,
          metrics: {
            memory: memoryUsage,
            requests: metrics.requests,
            database: metrics.database,
          },
        },
        message: 'Performance health check completed'
      });
    } catch (error) {
      logger.error('Error checking performance health', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to check performance health'
      });
    }
  });
};

export default {
  performanceMiddleware,
  databasePerformanceMiddleware,
  memoryMonitoring,
  cpuMonitoring,
  getPerformanceMetrics,
  startPerformanceMonitoring,
  performanceRoutes,
};
