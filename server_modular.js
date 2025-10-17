// Modular Express Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { globalLimiter } from './backend/middleware/rateLimiting.js';
import routes from './backend/routes/index.js';
import { initSentry, sentryMiddleware } from './backend/config/sentry.js';
import { performanceMiddleware, startPerformanceMonitoring, performanceRoutes } from './backend/middleware/performance.js';

// Load environment variables
dotenv.config();

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
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply global rate limiting
app.use(globalLimiter);

// Routes
app.use(routes);

// Performance monitoring routes
performanceRoutes(app);

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
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
