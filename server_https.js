/**
 * HTTPS Server untuk Absenta System
 * Server production dengan SSL/TLS encryption
 */

import express from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import modularized components
import { loadSSLCertificates, httpsConfig } from './backend/config/ssl.js';
import { 
  enforceHTTPS, 
  securityHeaders, 
  authRateLimit, 
  apiRateLimit, 
  uploadRateLimit,
  corsOptions,
  requestSizeLimit,
  securityLogger,
  queryProtection
} from './backend/middleware/security.js';

// Import routes
import routes from './backend/routes/index.js';

// Import database connection
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config/production.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Security Middleware Setup
 */
const setupSecurityMiddleware = () => {
  // HTTPS Enforcement (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.use(enforceHTTPS);
  }
  
  // Security Headers
  app.use(securityHeaders);
  
  // Security Logging
  app.use(securityLogger);
  
  // Query Protection
  app.use(queryProtection);
  
  // Request Size Limiting
  app.use(requestSizeLimit(process.env.UPLOAD_MAX_SIZE || '10mb'));
  
  // CORS Configuration
  app.use(cors(corsOptions));
  
  // Rate Limiting
  app.use('/api/auth', authRateLimit);
  app.use('/api/upload', uploadRateLimit);
  app.use('/api', apiRateLimit);
};

/**
 * Application Middleware Setup
 */
const setupAppMiddleware = () => {
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Static files (if needed)
  app.use('/static', express.static(path.join(__dirname, 'public')));
  
  // Trust proxy (for load balancers)
  app.set('trust proxy', 1);
  
  // Security middleware
  setupSecurityMiddleware();
};

/**
 * Routes Setup
 */
const setupRoutes = () => {
  // API Routes
  app.use('/api', routes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Absenta System API',
      version: process.env.API_VERSION || 'v1',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      ssl: req.secure ? 'enabled' : 'disabled'
    });
  });
  
  // 404 Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      path: req.originalUrl
    });
  });
  
  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    
    // Security: Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      success: false,
      message: isDevelopment ? err.message : 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack })
    });
  });
};

/**
 * SSL Certificate Setup
 */
const setupSSL = () => {
  try {
    const sslOptions = loadSSLCertificates();
    
    if (!sslOptions) {
      console.warn('⚠️  SSL certificates not found. Running in HTTP mode.');
      return null;
    }
    
    console.log('✅ SSL certificates loaded successfully');
    return sslOptions;
  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error.message);
    return null;
  }
};

/**
 * Database Connection Setup
 */
const setupDatabase = async () => {
  try {
    await db.getConnection();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown Handler
 */
const setupGracefulShutdown = (server) => {
  const gracefulShutdown = (signal) => {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connections
      db.end(() => {
        console.log('✅ Database connections closed');
        process.exit(0);
      });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

/**
 * Start HTTPS Server
 */
const startHTTPSServer = (sslOptions) => {
  const server = https.createServer(sslOptions, app);
  
  server.listen(PORT, HOST, () => {
    console.log('🚀 Absenta HTTPS Server Started');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 SSL/TLS: Enabled`);
    console.log(`🌐 Server: https://${HOST}:${PORT}`);
    console.log(`📚 API Docs: https://${HOST}:${PORT}/docs`);
    console.log(`❤️  Health Check: https://${HOST}:${PORT}/api/health`);
    console.log('=====================================');
  });
  
  return server;
};

/**
 * Start HTTP Server (fallback)
 */
const startHTTPServer = () => {
  const server = http.createServer(app);
  
  server.listen(PORT, HOST, () => {
    console.log('🚀 Absenta HTTP Server Started');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚠️  SSL/TLS: Disabled (HTTP only)`);
    console.log(`🌐 Server: http://${HOST}:${PORT}`);
    console.log(`📚 API Docs: http://${HOST}:${PORT}/docs`);
    console.log(`❤️  Health Check: http://${HOST}:${PORT}/api/health`);
    console.log('=====================================');
  });
  
  return server;
};

/**
 * Main Server Initialization
 */
const startServer = async () => {
  try {
    console.log('🔄 Initializing Absenta Server...');
    
    // Setup middleware
    setupAppMiddleware();
    
    // Setup routes
    setupRoutes();
    
    // Setup database
    await setupDatabase();
    
    // Setup SSL
    const sslOptions = setupSSL();
    
    // Start server
    let server;
    if (sslOptions) {
      server = startHTTPSServer(sslOptions);
    } else {
      server = startHTTPServer();
    }
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
