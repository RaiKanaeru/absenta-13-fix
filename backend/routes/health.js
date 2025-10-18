// Health check and monitoring routes
import express from 'express';
import { db } from '../../db.js';
import os from 'os';
import process from 'process';

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});


// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Database health check
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    try {
      const dbStartTime = Date.now();
      await db.execute('SELECT 1 as test');
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: os.loadavg()
      },
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid
    };

    // Database connection pool stats
    let poolStats = {};
    try {
      poolStats = db.getPoolStats();
    } catch (error) {
      console.error('Failed to get pool stats:', error);
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        server: {
          status: 'healthy',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        },
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          poolStats: poolStats
        },
        system: systemMetrics
      },
      message: 'Detailed health check completed'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Database health check
router.get('/health/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test basic query
    const [result] = await db.execute('SELECT 1 as test, NOW() as current_time');
    
    // Test connection pool
    const poolStats = db.getPoolStats();
    
    // Test table access
    const [tableCount] = await db.execute(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        responseTime: responseTime,
        currentTime: result[0].current_time,
        poolStats: poolStats,
        tableCount: tableCount[0].table_count
      },
      message: 'Database is healthy'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database health check failed',
      message: error.message
    });
  }
});

// System metrics
router.get('/health/metrics', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      data: {
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: {
          process: Math.round(process.uptime()) + ' seconds',
          system: Math.round(os.uptime()) + ' seconds'
        },
        loadAverage: os.loadavg(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        pid: process.pid
      },
      message: 'System metrics retrieved successfully'
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Readiness check (for Kubernetes)
router.get('/health/ready', async (req, res) => {
  try {
    // Check if database is accessible
    await db.execute('SELECT 1');
    
    // Check if required environment variables are set
    const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        success: false,
        error: 'Service not ready',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`
      });
    }

    res.json({
      success: true,
      message: 'Service is ready'
    });
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Service not ready',
      message: error.message
    });
  }
});

// Liveness check (for Kubernetes)
router.get('/health/live', (req, res) => {
  res.json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString()
  });
});

// Test database status endpoint
router.get('/db-status', async (req, res) => {
  try {
    // Test basic database connection
    await db.execute('SELECT 1 as test');
    res.json({
      success: true,
      message: 'Database connection working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Database connection failed',
      message: error.message,
      code: error.code
    });
  }
});

// Test JSON response endpoint
router.get('/test-json', (req, res) => {
  res.json({
    success: true,
    message: 'JSON response test',
    timestamp: new Date().toISOString(),
    data: {
      test: 'value',
      number: 123
    }
  });
});

export default router;
