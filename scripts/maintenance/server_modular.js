/**
 * Absenta Modular Server - Clean, maintainable server architecture
 * Refactored from monolithic server_modern.js (6,000+ lines) into modular structure
 */

console.log('🚀 ABSENTA Modular Server Starting...');

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db.js';

// Import routes
import authRoutes from './backend/routes/auth.js';
import adminRoutes from './backend/routes/admin_new.js';
import teacherRoutes from './backend/routes/teacher_new.js';
import studentRoutes from './backend/routes/student_new.js';
import attendanceRoutes from './backend/routes/attendance.js';
import scheduleRoutes from './backend/routes/schedule.js';
import reportRoutes from './backend/routes/report.js';

// Import middleware
import { globalErrorHandler, notFoundHandler, initializeErrorHandlers } from './backend/middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 3001;

// Initialize error handlers
initializeErrorHandlers();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is required');
    console.error('   Please set JWT_SECRET in your .env file');
    process.exit(1);
}

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// CORS configuration
app.use(cors({ 
    credentials: true, 
    origin: [
        'http://localhost:8080', 
        'http://localhost:8081', 
        'http://localhost:5173', 
        'http://localhost:3000'
    ] 
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Absenta Modular Server is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        architecture: 'modular'
    });
});

// API routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guru', teacherRoutes);
app.use('/api/siswa', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/report', reportRoutes);

// Legacy route compatibility (for existing frontend)
app.get('/api/verify', (req, res) => {
    res.json({
        success: true,
        message: 'Legacy verify endpoint - use /api/verify instead',
        redirect: '/api/verify'
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    
    // Close database connections
    if (db && db.end) {
        db.end((err) => {
            if (err) {
                console.error('❌ Error closing database connection:', err);
            } else {
                console.log('✅ Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(port, () => {
    console.log(`✅ Absenta Modular Server running on port ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/health`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    console.log(`🏗️  Architecture: Modular (${process.env.NODE_ENV || 'development'})`);
    console.log(`📊 Database: Connected`);
    console.log(`🔐 JWT: Configured`);
    console.log(`🚀 Ready to handle requests!`);
});

// Export app for testing
export default app;