// Modular Express Server
// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { globalLimiter } from './backend/middleware/rateLimiting.js';
import routes from './backend/routes/index.js';
import { initSentry, sentryMiddleware } from './backend/config/sentry.js';
import { performanceMiddleware, startPerformanceMonitoring, performanceRoutes } from './backend/middleware/performance.js';

// Initialize Sentry
initSentry();

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry middleware (must be first)
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Global middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8080'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply global rate limiting
app.use(globalLimiter);

// Routes
try {
  console.log('📍 Loading routes...');
  app.use(routes);
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  throw error;
}

// Performance monitoring routes
try {
  console.log('📊 Loading performance monitoring routes...');
  performanceRoutes(app);
  console.log('✅ Performance monitoring routes loaded');
} catch (error) {
  console.error('❌ Error loading performance routes:', error);
  throw error;
}

// Sentry error handler (must be before other error handlers)
app.use(sentryMiddleware.errorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON format'
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler (must be the last route)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start performance monitoring
startPerformanceMonitoring();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Modular Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`⚡ Performance metrics: http://localhost:${PORT}/api/performance/metrics`);
});

export default app;
