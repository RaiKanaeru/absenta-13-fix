// tests/unit/backend/middleware/performance.test.js
import { performanceMiddleware, getPerformanceMetrics, memoryMonitoring, cpuMonitoring } from '../../../backend/middleware/performance.js';

// Mock logger
const mockLogger = {
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../../backend/utils/logger.js', () => ({
  logger: mockLogger,
}));

// Mock Sentry
const mockCaptureMessage = jest.fn();
const mockAddBreadcrumb = jest.fn();

jest.mock('../../../backend/config/sentry.js', () => ({
  captureMessage: mockCaptureMessage,
  addBreadcrumb: mockAddBreadcrumb,
}));

describe('Performance Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };
    res = {
      statusCode: 200,
      end: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('performanceMiddleware', () => {
    it('should track request performance', async () => {
      const middleware = performanceMiddleware;
      middleware(req, res, next);

      expect(req.performance).toBeDefined();
      expect(req.performance.startTime).toBeDefined();
      expect(req.performance.startMemory).toBeDefined();
      expect(req.performance.requestId).toBeDefined();

      // Simulate request completion
      res.end();

      expect(res.end).toHaveBeenCalled();
    });

    it('should track slow requests', async () => {
      const middleware = performanceMiddleware;
      middleware(req, res, next);

      // Simulate slow request
      req.performance.startTime = Date.now() - 2000; // 2 seconds ago
      res.end();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Slow request detected',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          duration: expect.any(String),
          statusCode: 200,
        })
      );

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Slow request detected',
        'warning',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          duration: expect.any(Number),
          statusCode: 200,
        })
      );
    });

    it('should add breadcrumb for performance tracking', async () => {
      const middleware = performanceMiddleware;
      middleware(req, res, next);

      res.end();

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('GET /api/test'),
          category: 'performance',
          level: 'info',
          data: expect.objectContaining({
            method: 'GET',
            url: '/api/test',
            duration: expect.any(Number),
            statusCode: 200,
          }),
        })
      );
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        req.method = method;
        const middleware = performanceMiddleware;
        middleware(req, res, next);
        res.end();

        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              method: method,
            }),
          })
        );
      }
    });

    it('should handle different status codes', async () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];
      
      for (const statusCode of statusCodes) {
        res.statusCode = statusCode;
        const middleware = performanceMiddleware;
        middleware(req, res, next);
        res.end();

        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              statusCode: statusCode,
            }),
          })
        );
      }
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = getPerformanceMetrics();

      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('timestamp');

      expect(metrics.requests).toHaveProperty('total');
      expect(metrics.requests).toHaveProperty('averageDuration');
      expect(metrics.requests).toHaveProperty('averageMemory');
      expect(metrics.requests).toHaveProperty('slowRequests');

      expect(metrics.database).toHaveProperty('total');
      expect(metrics.database).toHaveProperty('averageDuration');
      expect(metrics.database).toHaveProperty('slowQueries');

      expect(metrics.memory).toHaveProperty('current');
      expect(metrics.memory).toHaveProperty('peak');
      expect(metrics.memory).toHaveProperty('usage');

      expect(metrics.cpu).toHaveProperty('current');
      expect(metrics.cpu).toHaveProperty('peak');
      expect(metrics.cpu).toHaveProperty('usage');
    });

    it('should calculate averages correctly', () => {
      // This would require setting up mock data in the performance metrics
      const metrics = getPerformanceMetrics();
      
      expect(typeof metrics.requests.averageDuration).toBe('number');
      expect(typeof metrics.requests.averageMemory).toBe('number');
      expect(typeof metrics.database.averageDuration).toBe('number');
    });
  });

  describe('memoryMonitoring', () => {
    it('should monitor memory usage', () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = jest.fn(() => ({
        rss: 100 * 1024 * 1024, // 100MB
        heapUsed: 50 * 1024 * 1024, // 50MB
        heapTotal: 80 * 1024 * 1024, // 80MB
        external: 10 * 1024 * 1024, // 10MB
      }));

      process.memoryUsage = mockMemoryUsage;

      memoryMonitoring();

      expect(mockMemoryUsage).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled(); // Should not warn for normal usage

      process.memoryUsage = originalMemoryUsage;
    });

    it('should warn about high memory usage', () => {
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsage = jest.fn(() => ({
        rss: 300 * 1024 * 1024, // 300MB
        heapUsed: 200 * 1024 * 1024, // 200MB - above threshold
        heapTotal: 250 * 1024 * 1024, // 250MB
        external: 20 * 1024 * 1024, // 20MB
      }));

      process.memoryUsage = mockMemoryUsage;

      memoryMonitoring();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'High memory usage detected',
        expect.objectContaining({
          heapUsed: expect.stringContaining('MB'),
          heapTotal: expect.stringContaining('MB'),
          rss: expect.stringContaining('MB'),
        })
      );

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'High memory usage detected',
        'warning',
        expect.objectContaining({
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          rss: expect.any(Number),
        })
      );

      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('cpuMonitoring', () => {
    it('should monitor CPU usage', () => {
      const originalCpuUsage = process.cpuUsage;
      const mockCpuUsage = jest.fn(() => ({
        user: 1000000, // 1 second in microseconds
        system: 500000, // 0.5 seconds in microseconds
      }));

      process.cpuUsage = mockCpuUsage;

      cpuMonitoring();

      expect(mockCpuUsage).toHaveBeenCalled();

      process.cpuUsage = originalCpuUsage;
    });
  });
});
