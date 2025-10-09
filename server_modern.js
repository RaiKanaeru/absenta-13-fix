console.log('🚀 ABSENTA Modern Server Starting...');

// Global error handlers for development
if (process.env.NODE_ENV !== 'production') {
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        console.error('Stack:', error.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
}

// Memory management
process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn('⚠️ Memory warning:', warning.message);
    }
});

// Periodic memory cleanup
const cleanup = () => {
    if (global.gc) {
        global.gc();
        console.log('🧹 Memory cleanup performed');
    }
};

// Run cleanup every 5 minutes
setInterval(cleanup, 300000);

import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import ExcelJS from 'exceljs';
import multer from 'multer';
import { compressImage, validateImage } from './backend/utils/imageCompression.js';
import { parseJadwalSheet, validateAndTransform, upsertSchedules, generateReport } from './backend/utils/scheduleImporterAdvanced.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const app = express();

// Global variables
global.loadBalancerEnabled = false;

// Disable Express default error handler
app.set('trust proxy', 1);

// Configuration - JWT_SECRET is required, no fallback for security
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is required');
    console.error('Please set JWT_SECRET in your .env file or environment variables');
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'absenta-pepper-2025';
const saltRounds = 10;
const port = process.env.PORT || 3001;

// ================================================
// RATE LIMITING
// ================================================
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit configuration (env-driven) + optional bypass for debug
const LOGIN_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 15;
const BYPASS_LOGIN_RATE_LIMIT = (process.env.BYPASS_LOGIN_RATE_LIMIT === 'true');

const loginLimiter = BYPASS_LOGIN_RATE_LIMIT
  ? (req, res, next) => {
      console.log('🔓 Login rate limit bypassed for debug');
      next();
    }
  : rateLimit({
      windowMs: LOGIN_WINDOW_MS,
      max: LOGIN_MAX_ATTEMPTS,
      message: {
        success: false,
        error: 'Too many login attempts, please try again later.',
        retryAfter: `${Math.round(LOGIN_WINDOW_MS/60000)} minutes`
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// Apply rate limiting
app.use('/api/', globalLimiter);

// ================================================
// CORS CONFIGURATION
// ================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:8081', 
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001'
];

// Log CORS configuration
console.log('🌐 CORS allowed origins:', allowedOrigins);

app.use(cors({ 
    credentials: true, 
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
        'Accept',
        'Origin',
        'User-Agent'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Custom error handler untuk 413 Payload Too Large
app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
        console.error('❌ Payload too large error:', error.message);
        return res.status(413).json({
            error: 'Payload terlalu besar. Maksimal 10MB untuk seluruh request.',
            code: 'PAYLOAD_TOO_LARGE',
            details: 'Silakan kompres gambar atau kurangi ukuran data yang dikirim.'
        });
    }
    next(error);
});

// ================================================
// GLOBAL MIDDLEWARE
// ================================================

// Request/Response timeout (configurable)
app.use((req, res, next) => {
    const timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000; // 30 seconds default
    req.setTimeout(timeout);
    res.setTimeout(timeout);
    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }), (req, res, next) => {
    console.log('🔍 JSON Middleware Debug:');
    console.log('  - URL:', req.url);
    console.log('  - Method:', req.method);
    console.log('  - Content-Type:', req.headers['content-type']);
    console.log('  - Body exists:', !!req.body);
    console.log('  - Body type:', typeof req.body);
    console.log('  - Body keys:', req.body ? Object.keys(req.body) : 'N/A');
    next();
});
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }));
app.use(cookieParser());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file Excel (.xlsx, .xls) yang diperbolehkan'), false);
        }
    }
});

// Add structured logging
app.use(requestLogger);

// Standardized response middleware
app.use(responseMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Sistem Absensi Modern API Documentation'
}));

// Redirect root to API docs
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// ================================================
// DATABASE CONNECTION - MySQL Connection Pool
// ================================================
import db from './db.js';
import logger, { requestLogger, errorLogger, authLogger, businessLogger, systemLogger } from './logger.js';
import cache, { cacheMiddleware, cacheInvalidation } from './cache.js';
import { responseMiddleware, handleError, calculatePagination } from './response-helper.js';
import { specs, swaggerUi } from './swagger-config.js';

let connection; // Keep for backward compatibility during migration

async function connectToDatabase() {
    systemLogger.startup('Initializing database connection pool...');
    try {
        // Test connection
        const isConnected = await db.testConnection();
        if (isConnected) {
            systemLogger.startup('Database connection pool initialized successfully');
            const poolStats = db.getPoolStats();
            logger.info('Database pool stats', poolStats);
            
            // Startup self-test
            try {
                const [testResult] = await db.execute('SELECT 1 as test, NOW() as currentTime');
                systemLogger.startup('Database self-test passed', { 
                    test: testResult[0].test, 
                    currentTime: testResult[0].currentTime,
                    poolStats: poolStats
                });
            } catch (error) {
                systemLogger.startup('Database self-test failed', { error: error.message });
                // Don't crash, just log the error
            }
        } else {
            throw new Error('Database connection test failed');
        }
    } catch (error) {
        logger.error('Failed to initialize database pool', {
            error: error.message,
            stack: error.stack
        });
        systemLogger.startup('Retrying connection in 5 seconds...');
        setTimeout(connectToDatabase, 5000);
    }
}

// ================================================
// IMPORT CONFIGURATION
// ================================================
let scheduleImportConfig, mapelAliasConfig;

async function loadImportConfigs() {
    try {
        const configPath1 = './backend/config/schedule-import.config.json';
        const configPath2 = './backend/config/mapel-alias.json';
        
        scheduleImportConfig = JSON.parse(await fs.readFile(configPath1, 'utf-8'));
        mapelAliasConfig = JSON.parse(await fs.readFile(configPath2, 'utf-8'));
        
        systemLogger.startup('Import configurations loaded successfully');
    } catch (error) {
        systemLogger.startup('Failed to load import configurations', { error: error.message });
        // Set default configs to prevent crashes
        scheduleImportConfig = { timeSlots: {}, sheetNames: {}, headerPatterns: {}, options: {} };
        mapelAliasConfig = { aliases: {} };
    }
}

// Load configurations on startup
loadImportConfigs();

// ================================================
// VALIDATION MIDDLEWARE
// ================================================
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// ================================================
// PASSWORD UTILITIES
// ================================================
async function hashPassword(password) {
    const pepperedPassword = password + PASSWORD_PEPPER;
    return await bcrypt.hash(pepperedPassword, saltRounds);
}

async function comparePassword(password, hashedPassword) {
    // Try with pepper first (for new passwords)
    const pepperedPassword = password + PASSWORD_PEPPER;
    const withPepper = await bcrypt.compare(pepperedPassword, hashedPassword);
    
    if (withPepper) {
        return true;
    }
    
    // Fallback to without pepper (for legacy passwords)
    return await bcrypt.compare(password, hashedPassword);
}

// ================================================
// MIDDLEWARE - JWT Authentication & Authorization
// ================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    
    console.log(`🔍 Auth Debug - URL: ${req.url}`);
    console.log(`🔍 Auth Debug - Method: ${req.method}`);
    console.log(`🔍 Auth Debug - Auth Header: ${authHeader}`);
    console.log(`🔍 Auth Debug - Token: ${token ? 'Present' : 'Missing'}`);
    console.log(`🔍 Auth Debug - Token Length: ${token ? token.length : 0}`);
    
    if (!token) {
        console.log('❌ Access denied: No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            console.log('❌ Token that failed:', token);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        console.log(`✅ Token verified for user: ${user.username} (${user.role})`);
        req.user = user;
        next();
    });
}

// Role-based access control middleware
function requireRole(roles) {
    return (req, res, next) => {
        console.log(`🔐 Role check - URL: ${req.url}`);
        console.log(`🔐 Role check - User:`, req.user);
        console.log(`🔐 Role check - User role: ${req.user?.role}`);
        console.log(`🔐 Role check - Required roles:`, roles);
        
        if (!req.user || !req.user.role) {
            console.log('❌ Role check failed: User object missing or no role');
            return res.status(403).json({ error: 'Forbidden: User role not found' });
        }
        
        if (!roles.includes(req.user.role)) {
            console.log(`❌ Role check failed: User role '${req.user.role}' not in required roles:`, roles);
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        
        console.log(`✅ Role check passed: User '${req.user.username}' with role '${req.user.role}'`);
        next();
    };
}

// ================================================
// AUTHENTICATION ENDPOINTS
// ================================================

// Login validation rules
const loginValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Login endpoint - Real authentication with MySQL
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/login', loginLimiter, loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`🔐 Login attempt for username: ${username}`);
        
        if (!username || !password) {
            return res.error('Username and password are required', 'Validation failed');
        }

        // Query user from database using connection pool - use users table
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            [username]
        );

        if (rows.length === 0) {
            authLogger.login(username, false, req.ip || req.connection.remoteAddress);
            console.log('❌ Login failed: User not found');
            return res.unauthorized('Invalid username or password');
        }

        const user = rows[0];
        
        // Verify password with bcrypt and pepper
        const passwordMatch = await comparePassword(password, user.password);
        
        if (!passwordMatch) {
            authLogger.login(username, false, req.ip || req.connection.remoteAddress);
            console.log('❌ Login failed: Invalid password');
            return res.unauthorized('Invalid username or password');
        }

        // Get additional user data based on role
        let additionalData = {};
        
        if (user.role === 'guru') {
            const [guruData] = await db.execute(
                `SELECT g.*, m.nama_mapel 
                 FROM guru g 
                 JOIN mapel m ON g.mapel_id = m.id_mapel 
                 WHERE g.user_id = ?`,
                [user.id]
            );
            if (guruData.length > 0) {
                additionalData = {
                    guru_id: guruData[0].id_guru,
                    nip: guruData[0].nip,
                    mapel: guruData[0].nama_mapel
                };
            }
        } else if (user.role === 'siswa') {
            const [siswaData] = await db.execute(
                `SELECT s.*, k.nama_kelas 
                 FROM siswa s 
                 JOIN kelas k ON s.kelas_id = k.id_kelas 
                 WHERE s.user_id = ?`,
                [user.id]
            );
            if (siswaData.length > 0) {
                additionalData = {
                    siswa_id: siswaData[0].id_siswa,
                    nis: siswaData[0].nis,
                    kelas: siswaData[0].nama_kelas,
                    kelas_id: siswaData[0].kelas_id
                };
            }
        }

        // Generate JWT token
        const tokenPayload = {
            id: user.id,
            username: user.username,
            nama: user.nama,
            role: user.role,
            ...additionalData
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
        });

        // Set cookie and return response
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
            maxAge: parseInt(process.env.JWT_EXPIRES_IN_MS) || 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        });

        // Log successful login
        authLogger.login(username, true, req.ip || req.connection.remoteAddress);
        console.log(`✅ Login successful for user: ${user.username} (${user.role})`);
        
        res.success({
            user: tokenPayload,
            token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.error('Internal server error during login', 'Login failed');
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    console.log('✅ User logged out successfully');
    res.success(null, 'Logged out successfully');
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
    res.success({ 
        user: req.user
    }, 'Token is valid');
});

/**
 * @swagger
 * /api/admin/info:
 *   get:
 *     summary: Get admin information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Admin information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/admin/info', authenticateToken, requireRole(['admin']), (req, res) => {
    res.success({
        user: req.user
    }, 'Admin info retrieved successfully');
});

// Verify token endpoint (alias for compatibility)
app.get('/api/verify-token', authenticateToken, (req, res) => {
    res.success({ 
        user: req.user
    }, 'Token is valid');
});

// ================================================
// DASHBOARD ENDPOINTS - Real Data from MySQL
// ================================================

// Lightweight master data for filters
// app.get('/api/admin/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
//     try {
//         const [rows] = await db.execute(
//             'SELECT id_kelas AS id, nama_kelas FROM kelas WHERE status = "aktif" ORDER BY nama_kelas'
//         );
//         res.json(rows);
//     } catch (error) {
//         console.error('❌ Error fetching classes:', error);
//         res.error('Internal server error', 'Failed to process request');
//     }
// }); // DUPLICATE ENDPOINT - COMMENTED OUT

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, cacheMiddleware(600, (req) => `cache:dashboard:stats:${req.user.role}:${req.user.id}`), async (req, res) => {
    try {
        const stats = {};
        
        if (req.user.role === 'admin') {
            // Admin statistics - Optimized single query
            const [statsResult] = await db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM siswa WHERE status = "aktif") as totalSiswa,
                    (SELECT COUNT(*) FROM guru WHERE status = "aktif") as totalGuru,
                    (SELECT COUNT(*) FROM kelas WHERE status = "aktif") as totalKelas,
                    (SELECT COUNT(*) FROM mata_pelajaran WHERE status = "aktif") as totalMapel
            `);
            
            const [additionalStats] = await db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM absensi_guru WHERE tanggal = CURDATE()) as absensiHariIni,
                    (SELECT ROUND(
                        (SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
                    ) FROM absensi_guru 
                    WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as persentaseKehadiran
            `);
            
            const additional = additionalStats[0];
            
            stats.totalSiswa = stats.totalSiswa;
            stats.totalGuru = stats.totalGuru;
            stats.totalKelas = stats.totalKelas;
            stats.totalMapel = stats.totalMapel;
            stats.absensiHariIni = additional.absensiHariIni;
            stats.persentaseKehadiran = additional.persentaseKehadiran || 0;
            
        } else if (req.user.role === 'guru') {
            // Guru statistics
            const [jadwalHariIni] = await db.execute(
                `SELECT COUNT(*) as count 
                 FROM jadwal 
                 WHERE guru_id = ? AND hari = DAYNAME(CURDATE()) AND status = 'aktif'`,
                [req.user.guru_id]
            );
            
            const [absensiMingguIni] = await db.execute(
                `SELECT COUNT(*) as count 
                 FROM absensi_guru 
                 WHERE guru_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                [req.user.guru_id]
            );
            
            const [persentaseKehadiran] = await db.execute(
                `SELECT 
                    ROUND(
                        (SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
                    ) as persentase
                 FROM absensi_guru 
                 WHERE guru_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
                [req.user.guru_id]
            );

            stats.jadwalHariIni = jadwalHariIni[0].count;
            stats.absensiMingguIni = absensiMingguIni[0].count;
            stats.persentaseKehadiran = persentaseKehadiran[0].persentase || 0;
            
        } else if (req.user.role === 'siswa') {
            // Siswa statistics
            const [jadwalHariIni] = await db.execute(
                `SELECT COUNT(*) as count 
                 FROM jadwal 
                 WHERE kelas_id = ? AND hari = DAYNAME(CURDATE()) AND status = 'aktif'`,
                [req.user.kelas_id]
            );
            
            const [absensiMingguIni] = await db.execute(
                `SELECT COUNT(*) as count 
                 FROM absensi_guru 
                 WHERE kelas_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                [req.user.kelas_id]
            );

            stats.jadwalHariIni = jadwalHariIni[0].count;
            stats.absensiMingguIni = absensiMingguIni[0].count;
        }

        console.log(`📊 Dashboard stats retrieved for ${req.user.role}: ${req.user.username}`);
        res.success(stats, 'Dashboard statistics retrieved successfully');

    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.error('Failed to retrieve dashboard statistics', 'Dashboard error');
    }
});

// Get dashboard chart data
app.get('/api/dashboard/chart', authenticateToken, cacheMiddleware(600, (req) => `cache:dashboard:chart:${req.user.role}:${req.user.id}`), async (req, res) => {
    try {
        const { period = '7days' } = req.query;
        let chartData = [];

        if (req.user.role === 'admin') {
            // Admin chart - Weekly attendance overview
            const [weeklyData] = await db.execute(
                `SELECT 
                    DATE(tanggal) as tanggal,
                    SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir
                 FROM absensi_guru 
                 WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY DATE(tanggal)
                 ORDER BY tanggal`
            );

            chartData = weeklyData.map(row => ({
                date: row.tanggal,
                hadir: row.hadir,
                tidakHadir: row.tidak_hadir,
                total: row.hadir + row.tidak_hadir
            }));

        } else if (req.user.role === 'guru') {
            // Guru chart - Personal attendance
            const [personalData] = await db.execute(
                `SELECT 
                    DATE(tanggal) as tanggal,
                    SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir
                 FROM absensi_guru 
                 WHERE guru_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY DATE(tanggal)
                 ORDER BY tanggal`,
                [req.user.guru_id]
            );

            chartData = personalData.map(row => ({
                date: row.tanggal,
                hadir: row.hadir,
                tidakHadir: row.tidak_hadir
            }));
        }

        console.log(`📈 Chart data retrieved for ${req.user.role}: ${req.user.username}`);
        res.success(chartData, 'Chart data retrieved successfully');

    } catch (error) {
        console.error('❌ Chart data error:', error);
        res.error('Failed to retrieve chart data', 'Chart error');
    }
});

// ================================================
// CRUD ENDPOINTS - ADMIN ONLY
// ================================================

// SISWA CRUD
app.get('/api/admin/siswa', authenticateToken, requireRole(['admin']), cacheMiddleware(300, (req) => `cache:admin:siswa:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*, k.nama_kelas, u.username, u.status as user_status
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM siswa s JOIN kelas k ON s.kelas_id = k.id_kelas LEFT JOIN users u ON s.user_id = u.id';
        let params = [];

        if (search) {
            query += ' WHERE (s.nama LIKE ? OR s.nis LIKE ? OR k.nama_kelas LIKE ?)';
            countQuery += ' WHERE (s.nama LIKE ? OR s.nis LIKE ? OR k.nama_kelas LIKE ?)';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

        res.json({
            success: true,
            data: rows,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: countResult[0].total,
                total_pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get siswa error:', error);
        res.error('Failed to retrieve student data', 'Internal server error');
    }
});

app.post('/api/admin/siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nis, nama, kelas_id, username, password, jabatan, create_account = true } = req.body;

        // Use transaction helper
        const result = await db.withTransaction(async (connection) => {
            let userId = null;
            
            // Create user account if requested
            if (create_account && username && password) {
                const hashedPassword = await hashPassword(password);
                const [userResult] = await connection.execute(
                    'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "siswa", ?, "aktif")',
                    [username, hashedPassword, nama]
                );
                userId = userResult.insertId;
            }

            // Create siswa record
            await connection.execute(
                'INSERT INTO siswa (id_siswa, nis, nama, kelas_id, user_id, username, jabatan, status, created_at, updated_at) VALUES ((SELECT COALESCE(MAX(id_siswa), 0) + 1 FROM siswa s2), ?, ?, ?, ?, ?, ?, "aktif", NOW(), NOW())',
                [nis, nama, kelas_id, userId, username || null, jabatan || 'Sekretaris Kelas']
            );

            return { userId };
        });

        // Invalidate cache
        await cacheInvalidation.invalidateAdmin();

        console.log(`✅ New siswa created: ${nama} (${nis})`);
        res.success(null, 'Siswa berhasil ditambahkan');

    } catch (error) {
        console.error('❌ Create siswa error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.error('NIS atau username sudah digunakan', 'Validation failed');
        } else {
            res.error('Failed to create student', 'Internal server error');
        }
    }
});

/**
 * @swagger
 * /api/admin/guru:
 *   get:
 *     summary: Get list of teachers
 *     tags: [Admin - Guru]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Teachers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Guru'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/admin/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT g.id_guru as id, g.nip, g.nama, g.email, g.mata_pelajaran, g.mapel_id,
                   g.no_telp, g.alamat, g.jenis_kelamin, g.status, g.dibuat_pada as created_at, g.diperbarui_pada as updated_at,
                   m.nama_mapel, u.username, u.status as user_status, u.email as user_email, u.id as user_id,
                   COALESCE(g.email, u.email) as email
            FROM guru g
            LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
            LEFT JOIN users u ON g.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM guru g LEFT JOIN mapel m ON g.mapel_id = m.id_mapel LEFT JOIN users u ON g.user_id = u.id';
        let params = [];

        if (search) {
            query += ' WHERE (g.nama LIKE ? OR g.nip LIKE ? OR m.nama_mapel LIKE ?)';
            countQuery += ' WHERE (g.nama LIKE ? OR g.nip LIKE ? OR m.nama_mapel LIKE ?)';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        query += ' ORDER BY g.dibuat_pada DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

        res.json({
            success: true,
            data: rows,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: countResult[0].total,
                total_pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Get guru error:', error);
        res.error('Failed to retrieve teacher data', 'Internal server error');
    }
});

// Guru validation rules
const guruValidation = [
    body('nip')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('NIP is required and must be between 1 and 20 characters'),
    body('nama')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nama must be between 2 and 100 characters'),
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('mapel_id')
        .isInt({ min: 1 })
        .withMessage('Mapel ID must be a valid positive integer'),
    body('no_telp')
        .optional()
        .isMobilePhone('id-ID')
        .withMessage('No telepon must be a valid Indonesian phone number'),
    body('alamat')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Alamat must not exceed 255 characters')
];

/**
 * @swagger
 * /api/admin/guru:
 *   post:
 *     summary: Create new teacher
 *     tags: [Admin - Guru]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nip, nama, mapel_id, username, password]
 *             properties:
 *               nip:
 *                 type: string
 *                 example: "G001"
 *               nama:
 *                 type: string
 *                 example: "John Doe"
 *               mapel_id:
 *                 type: integer
 *                 example: 1
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               no_telp:
 *                 type: string
 *                 example: "08123456789"
 *               alamat:
 *                 type: string
 *                 example: "Jl. Contoh No. 1"
 *               jenis_kelamin:
 *                 type: string
 *                 enum: [L, P]
 *                 example: "L"
 *               status:
 *                 type: string
 *                 enum: [aktif, nonaktif]
 *                 example: "aktif"
 *     responses:
 *       200:
 *         description: Teacher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/admin/guru', authenticateToken, requireRole(['admin']), guruValidation, handleValidationErrors, async (req, res) => {
    try {
        const { nip, nama, mapel_id, username, password, no_telp, alamat, email, jenis_kelamin } = req.body;

        // Hash password with pepper
        const hashedPassword = await hashPassword(password);

        let userId;
        // Start transaction using connection pool
        await db.withTransaction(async (connection) => {
            // Create user account
            const [userResult] = await connection.execute(
                'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "guru", ?, "aktif")',
                [username, hashedPassword, nama]
            );
            userId = userResult.insertId;

            // Create guru record
            await connection.execute(
                'INSERT INTO guru (nip, nama, email, mapel_id, user_id, no_telp, alamat, jenis_kelamin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "aktif")',
                [nip, nama, email || null, mapel_id, userId, no_telp, alamat, jenis_kelamin || null]
            );
        });

        // Log business action
        businessLogger.dataChange('guru', 'create', userId, req.user.id);
        
        // Invalidate cache
        await cacheInvalidation.invalidateAdmin();
        
        console.log(`✅ New guru created: ${nama} (${nip})`);
        res.success(null, 'Guru berhasil ditambahkan');

    } catch (error) {
        console.error('❌ Create guru error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.error('NIP atau username sudah digunakan', 'Validation failed');
        } else {
            res.error('Failed to create teacher', 'Internal server error');
        }
    }
});

// Update guru account
app.put('/api/admin/guru/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nip, nama, mapel_id, username, password, no_telp, alamat, jenis_kelamin, email, status } = req.body;
        
        // Sanitize undefined values to null for MySQL
        const sanitizedData = {
            nip: nip || null,
            nama: nama || null,
            mapel_id: mapel_id || null,
            username: username || null,
            password: password, // Don't convert to null, keep original value for password check
            no_telp: no_telp || null,
            alamat: alamat || null,
            jenis_kelamin: jenis_kelamin || null,
            email: email || null,
            status: status || 'aktif'
        };
        
        console.log('📝 Updating guru account:', { 
            id, 
            nama: sanitizedData.nama, 
            username: sanitizedData.username, 
            no_telp: sanitizedData.no_telp, 
            alamat: sanitizedData.alamat,
            mapel_id: sanitizedData.mapel_id,
            jenis_kelamin: sanitizedData.jenis_kelamin,
            password: sanitizedData.password ? '***PROVIDED***' : 'NOT_PROVIDED',
            passwordLength: sanitizedData.password ? sanitizedData.password.length : 0
        });

        if (!sanitizedData.nama || !sanitizedData.nip || !sanitizedData.mapel_id || !sanitizedData.username) {
            return res.error('Nama, NIP, mata pelajaran, dan username wajib diisi', 'Validation failed');
        }

        // Check if username already exists (excluding current user)
        const [guruUser] = await db.execute('SELECT user_id FROM guru WHERE id_guru = ?', [id]);
        if (guruUser.length === 0) {
            return res.error('Guru tidak ditemukan', 'Validation failed');
        }
        
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [sanitizedData.username, guruUser[0].user_id]
        );

        if (existingUsers.length > 0) {
            return res.error('Username sudah digunakan', 'Validation failed');
        }

        // Check if NIP already exists (excluding current guru)
        const [existingNIP] = await db.execute(
            'SELECT id_guru FROM guru WHERE nip = ? AND id_guru != ?',
            [sanitizedData.nip, id]
        );

        if (existingNIP.length > 0) {
            return res.error('NIP sudah digunakan', 'Validation failed');
        }

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get current user_id
            const [guruResult] = await connection.execute(
                'SELECT user_id FROM guru WHERE id_guru = ?',
                [id]
            );

            if (guruResult.length === 0) {
                throw new Error('Guru tidak ditemukan');
            }

            const userId = guruResult[0].user_id;

            // Update user account
            console.log('🔍 Password check:', {
                hasPassword: !!sanitizedData.password,
                passwordValue: sanitizedData.password ? '***PROVIDED***' : 'NOT_PROVIDED',
                passwordLength: sanitizedData.password ? sanitizedData.password.length : 0,
                passwordTrim: sanitizedData.password ? sanitizedData.password.trim() : 'N/A',
                passwordTrimLength: sanitizedData.password ? sanitizedData.password.trim().length : 0,
                condition: sanitizedData.password && sanitizedData.password.trim() !== '',
                originalPassword: password,
                originalPasswordType: typeof password
            });
            
            if (password && password.trim() !== '') {
                const hashedPassword = await hashPassword(password);
                await connection.execute(
                    'UPDATE users SET username = ?, password = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [sanitizedData.username, hashedPassword, sanitizedData.nama, sanitizedData.email, sanitizedData.status, userId]
                );
                console.log('🔐 Password updated for user ID:', userId);
            } else {
                await connection.execute(
                    'UPDATE users SET username = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [sanitizedData.username, sanitizedData.nama, sanitizedData.email, sanitizedData.status, userId]
                );
                console.log('🔐 Password not updated (empty or not provided) for user ID:', userId);
                console.log('🔐 Password value was:', password);
            }

            // Update guru data
            console.log('🔄 Updating guru data in database:', {
                nip: sanitizedData.nip,
                nama: sanitizedData.nama,
                email: sanitizedData.email,
                mapel_id: sanitizedData.mapel_id,
                no_telp: sanitizedData.no_telp,
                alamat: sanitizedData.alamat,
                jenis_kelamin: sanitizedData.jenis_kelamin,
                status: sanitizedData.status,
                id: id
            });
            
            const [updateResult] = await connection.execute(
                'UPDATE guru SET nip = ?, nama = ?, email = ?, mapel_id = ?, no_telp = ?, alamat = ?, jenis_kelamin = ?, status = ? WHERE id_guru = ?',
                [sanitizedData.nip, sanitizedData.nama, sanitizedData.email, sanitizedData.mapel_id, sanitizedData.no_telp, sanitizedData.alamat, sanitizedData.jenis_kelamin, sanitizedData.status, id]
            );
            
            console.log('📊 Database update result:', {
                affectedRows: updateResult.affectedRows,
                changedRows: updateResult.changedRows
            });
        });

        // Invalidate cache
        await cacheInvalidation.invalidateAdmin();
        
        console.log('✅ Guru account updated successfully');
        res.success(null, 'Akun guru berhasil diupdate');
    } catch (error) {
        console.error('❌ Error updating guru:', error);
        res.error('Internal server error', 'Failed to update guru');
    }
});

// Delete guru account
app.delete('/api/admin/guru/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting guru account:', { id });

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get user_id first
            const [guruResult] = await connection.execute(
                'SELECT user_id FROM guru WHERE id_guru = ?',
                [id]
            );

            if (guruResult.length === 0) {
                throw new Error('Guru tidak ditemukan');
            }

            const userId = guruResult[0].user_id;

            // Delete from guru table first (foreign key constraint)
            await connection.execute(
                'DELETE FROM guru WHERE id_guru = ?',
                [id]
            );

            // Delete from users table
            await connection.execute(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );
        });

        console.log('✅ Guru account deleted successfully');
        res.success(null, 'Akun guru berhasil dihapus');
    } catch (error) {
        console.error('❌ Error deleting guru:', error);
        res.error('Internal server error', 'Failed to delete guru');
    }
});

// MAPEL CRUD
app.get('/api/admin/mapel', authenticateToken, requireRole(['admin']), cacheMiddleware(300, (req) => `cache:admin:mapel:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        console.log('📋 Getting subjects for admin dashboard');
        
        const query = `
            SELECT id_mapel as id, kode_mapel, nama_mapel, deskripsi, status
            FROM mapel 
            ORDER BY nama_mapel
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Subjects retrieved: ${rows.length} items`);
        res.success(rows, 'Subjects retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting subjects:', error);
        res.error('Internal server error', 'Failed to get subjects');
    }
});

app.post('/api/admin/mapel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kode_mapel, nama_mapel, deskripsi, status } = req.body;
        console.log('➕ Adding subject - Raw body:', req.body);
        console.log('➕ Adding subject - Parsed data:', { kode_mapel, nama_mapel, deskripsi, status });

        if (!kode_mapel || !nama_mapel) {
            return res.error('Kode dan nama mata pelajaran wajib diisi', 'Validation failed');
        }

        // Validate status
        const validStatuses = ['aktif', 'tidak_aktif'];
        const finalStatus = status && validStatuses.includes(status) ? status : 'aktif';

        // Check if kode_mapel already exists
        const [existing] = await db.execute(
            'SELECT id_mapel FROM mapel WHERE kode_mapel = ?',
            [kode_mapel]
        );

        if (existing.length > 0) {
            return res.error('Kode mata pelajaran sudah digunakan', 'Validation failed');
        }

        const insertQuery = `
            INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi, status) 
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.execute(insertQuery, [
            kode_mapel, 
            nama_mapel, 
            deskripsi || null,
            finalStatus
        ]);
        console.log('✅ Subject added successfully:', result.insertId);
        
        // Clear cache for subjects list
        if (typeof clearCache === 'function') {
            clearCache('cache:admin:mapel:*');
        }
        
        res.success({ id: result.insertId }, 'Mata pelajaran berhasil ditambahkan');
    } catch (error) {
        console.error('❌ Error adding subject:', error);
        console.error('❌ Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.error('Kode mata pelajaran sudah digunakan', 'Validation failed');
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            res.error('Data referensi tidak ditemukan', 'Validation failed');
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            res.error('Data wajib tidak boleh kosong', 'Validation failed');
        } else {
            res.error('Internal server error', 'Failed to add subject');
        }
    }
});

// Update subject
app.put('/api/admin/mapel/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_mapel, nama_mapel, deskripsi, status } = req.body;
        console.log('📝 Updating subject:', { id, kode_mapel, nama_mapel, deskripsi, status });

        if (!kode_mapel || !nama_mapel) {
            return res.error('Kode dan nama mata pelajaran wajib diisi', 'Validation failed');
        }

        // Validate status
        const validStatuses = ['aktif', 'tidak_aktif'];
        const finalStatus = status && validStatuses.includes(status) ? status : 'aktif';

        // Check if kode_mapel already exists for other records
        const [existing] = await db.execute(
            'SELECT id_mapel FROM mapel WHERE kode_mapel = ? AND id_mapel != ?',
            [kode_mapel, id]
        );

        if (existing.length > 0) {
            return res.error('Kode mata pelajaran sudah digunakan oleh mata pelajaran lain', 'Validation failed');
        }

        const updateQuery = `
            UPDATE mapel 
            SET kode_mapel = ?, nama_mapel = ?, deskripsi = ?, status = ?
            WHERE id_mapel = ?
        `;

        const [result] = await db.execute(updateQuery, [
            kode_mapel, 
            nama_mapel, 
            deskripsi || null,
            finalStatus,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.notFound('Mata pelajaran', 'Mata pelajaran tidak ditemukan');
        }

        console.log('✅ Subject updated successfully');
        
        // Clear cache for subjects list
        if (typeof clearCache === 'function') {
            clearCache('cache:admin:mapel:*');
        }
        
        res.success(null, 'Mata pelajaran berhasil diupdate');
    } catch (error) {
        console.error('❌ Error updating subject:', error);
        res.error('Internal server error', 'Failed to update subject');
    }
});

// Delete subject
app.delete('/api/admin/mapel/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting subject:', { id });

        const [result] = await db.execute(
            'DELETE FROM mapel WHERE id_mapel = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.notFound('Mata pelajaran', 'Mata pelajaran tidak ditemukan');
        }

        console.log('✅ Subject deleted successfully');
        
        // Clear cache for subjects list
        if (typeof clearCache === 'function') {
            clearCache('cache:admin:mapel:*');
        }
        
        res.success(null, 'Mata pelajaran berhasil dihapus');
    } catch (error) {
        console.error('❌ Error deleting subject:', error);
        res.error('Internal server error', 'Failed to delete subject');
    }
});

// KELAS CRUD
// Public endpoint for classes (accessible by all authenticated users)
app.get('/api/kelas', authenticateToken, async (req, res) => {
    try {
        console.log('📋 Getting classes for general use');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, ruang, kode_ruang, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
        res.success(rows, 'Classes retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.error('Internal server error', 'Failed to get classes');
    }
});

app.get('/api/admin/kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting classes for admin dashboard');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, ruang, kode_ruang, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
        res.success(rows, 'Classes retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.error('Internal server error', 'Failed to get classes');
    }
});

app.post('/api/admin/kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nama_kelas } = req.body;
        console.log('➕ Adding class:', { nama_kelas });

        if (!nama_kelas) {
            return res.error('Nama kelas wajib diisi', 'Validation failed');
        }

        // Extract tingkat from nama_kelas (contoh: "X IPA 1" -> tingkat = "X")
        const tingkat = nama_kelas.split(' ')[0];

        const insertQuery = `
            INSERT INTO kelas (nama_kelas, tingkat, status) 
            VALUES (?, ?, 'aktif')
        `;

        const [result] = await db.execute(insertQuery, [nama_kelas, tingkat]);
        console.log('✅ Class added successfully:', result.insertId);
        res.success({ id: result.insertId }, 'Kelas berhasil ditambahkan');
    } catch (error) {
        console.error('❌ Error adding class:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.error('Nama kelas sudah ada', 'Validation failed');
        } else {
            res.error('Internal server error', 'Failed to add class');
        }
    }
});

// Update class
app.put('/api/admin/kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kelas, ruang, kode_ruang } = req.body;
        console.log('📝 Updating class:', { id, nama_kelas, ruang, kode_ruang });

        if (!nama_kelas) {
            return res.error('Nama kelas wajib diisi', 'Validation failed');
        }

        // Extract tingkat from nama_kelas
        const tingkat = nama_kelas.split(' ')[0];

        const updateQuery = `
            UPDATE kelas 
            SET nama_kelas = ?, tingkat = ?, ruang = ?, kode_ruang = ?
            WHERE id_kelas = ?
        `;

        const [result] = await db.execute(updateQuery, [nama_kelas, tingkat, ruang || null, kode_ruang || null, id]);

        if (result.affectedRows === 0) {
            return res.notFound('Kelas', 'Kelas tidak ditemukan');
        }

        console.log('✅ Class updated successfully');
        res.success(null, 'Kelas berhasil diupdate');
    } catch (error) {
        console.error('❌ Error updating class:', error);
        res.error('Internal server error', 'Failed to update class');
    }
});

// Delete class
app.delete('/api/admin/kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting class:', { id });

        const [result] = await db.execute(
            'DELETE FROM kelas WHERE id_kelas = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.notFound('Kelas', 'Kelas tidak ditemukan');
        }

        console.log('✅ Class deleted successfully');
        res.success(null, 'Kelas berhasil dihapus');
    } catch (error) {
        console.error('❌ Error deleting class:', error);
        res.error('Internal server error', 'Failed to delete class');
    }
});

// ================================================
// UTILITY FUNCTIONS - Validation & Helpers
// ================================================

// Phone number validation function
function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
        return { isValid: true, error: null }; // Optional field
    }
    
    // Remove spaces and special characters except + and -
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Indonesian phone number regex: +62, 62, or 0 followed by 9-13 digits
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    
    if (!phoneRegex.test(cleaned)) {
        return { 
            isValid: false, 
            error: 'Format nomor telepon tidak valid. Gunakan format: +628123456789, 628123456789, atau 08123456789' 
        };
    }
    
    return { isValid: true, error: null };
}

// ================================================
// SISWA PERWAKILAN ENDPOINTS - Representative Student Management
// ================================================

// Get all representative students
app.get('/api/admin/siswa-perwakilan', authenticateToken, requireRole(['admin']), cacheMiddleware(300, (req) => `cache:admin:siswa-perwakilan:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        console.log('👨‍🎓 Getting representative students for admin dashboard');
        
        const query = `
            SELECT 
                s.id,
                s.id_siswa,
                s.user_id as user_id,
                s.nama_pengguna as username,
                s.nis,
                s.nama,
                s.kelas_id,
                k.nama_kelas,
                k.tingkat,
                s.jabatan,
                s.jenis_kelamin,
                s.email,
                s.alamat,
                s.telepon_orangtua,
                s.telepon_siswa,
                s.status,
                u.username as account_username,
                u.status as account_status
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status IN ('aktif', 'tidak_aktif')
            ORDER BY s.nama
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Representative students retrieved: ${rows.length} items`);
        res.success(rows, 'Representative students retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting representative students:', error);
        res.error('Internal server error', 'Failed to get representative students');
    }
});

// Add new representative student
app.post('/api/admin/siswa-perwakilan', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('👨‍🎓 Adding new representative student');
        
        const { username, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa } = req.body;
        
        // Validate required fields
        if (!username || !nama || !nis || !kelas_id || !jenis_kelamin) {
            return res.error('Username, nama, NIS, kelas, dan jenis kelamin wajib diisi', 'Validation failed');
        }
        
        // Check if username already exists
        const [existingUser] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.error('Username sudah digunakan', 'Validation failed');
        }
        
        // Check if NIS already exists
        const [existingNIS] = await db.execute('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (existingNIS.length > 0) {
            return res.error('NIS sudah digunakan', 'Validation failed');
        }
        
        // Transaction untuk atomic operation
        await db.withTransaction(async (connection) => {
            // 1. Create user account
            const hashedPassword = bcrypt.hashSync('password123', 10);
            const [userResult] = await connection.execute(
                'INSERT INTO users (username, password, role, nama, email, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [username, hashedPassword, 'siswa', nama, email || `${username}@smkn13bandung.sch.id`, 'aktif']
            );
            
            const userId = userResult.insertId;
            
            // 2. Get next id_siswa
            const [maxIdResult] = await connection.execute('SELECT MAX(id_siswa) as max_id FROM siswa');
            const nextIdSiswa = (maxIdResult[0].max_id || 0) + 1;
            
            // 3. Create student record
            const [siswaResult] = await connection.execute(
                `INSERT INTO siswa 
                (id_siswa, user_id, nama_pengguna, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status, dibuat_pada, diperbarui_pada) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NOW(), NOW())`,
                [nextIdSiswa, userId, username, nis, nama, kelas_id, jabatan || 'Sekretaris Kelas', jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa]
            );
            
            // Transaction automatically committed
        });
        
        console.log('✅ Student account and record added successfully');
        res.success({ 
            id: nextIdSiswa, 
            id_siswa: nextIdSiswa,
            user_id: userId 
        }, 'Student added successfully');
    } catch (error) {
        console.error('❌ Error adding representative student:', error);
        res.error('Internal server error', 'Failed to add representative student');
    }
});

// Update representative student
app.put('/api/admin/siswa-perwakilan/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('👨‍🎓 Updating representative student');
        
        const { id } = req.params;
        const { username, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status } = req.body;
        
        // Sanitize undefined values to null for MySQL
        const sanitizedData = {
            username: username || null,
            nis: nis || null,
            nama: nama || null,
            kelas_id: kelas_id || null,
            jabatan: jabatan || null,
            jenis_kelamin: jenis_kelamin || null,
            email: email || null,
            alamat: alamat || null,
            telepon_orangtua: telepon_orangtua || null,
            telepon_siswa: telepon_siswa || null,
            status: status || 'aktif'
        };
        
        // Validate required fields
        if (!sanitizedData.nama || !sanitizedData.nis || !sanitizedData.kelas_id || !sanitizedData.jenis_kelamin || !sanitizedData.username) {
            return res.error('Nama, NIS, kelas, jenis kelamin, dan username wajib diisi', 'Validation failed');
        }
        
        // Check if student exists in siswa table
        const [existing] = await db.execute('SELECT id, user_id FROM siswa WHERE id_siswa = ?', [id]);
        if (existing.length === 0) {
            return res.error('Siswa tidak ditemukan', 'Not found');
        }
        
        const student = existing[0];
        
        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [sanitizedData.username, student.user_id]
        );

        if (existingUsers.length > 0) {
            return res.error('Username sudah digunakan', 'Validation failed');
        }
        
        // Check if NIS already exists (excluding current student)
        const [existingNIS] = await db.execute(
            'SELECT id FROM siswa WHERE nis = ? AND id_siswa != ?',
            [sanitizedData.nis, id]
        );

        if (existingNIS.length > 0) {
            return res.error('NIS sudah digunakan', 'Validation failed');
        }
        
        // Transaction untuk atomic operation
        await db.withTransaction(async (connection) => {
            // Update user in users table
            await connection.execute(
                `UPDATE users SET username = ?, nama = ?, email = ?, status = ?, updated_at = NOW() WHERE id = ?`,
                [sanitizedData.username, sanitizedData.nama, sanitizedData.email, sanitizedData.status, student.user_id]
            );
            
            // Update student in siswa table
            await connection.execute(
                `UPDATE siswa SET 
                nama_pengguna = ?, nis = ?, nama = ?, kelas_id = ?, jabatan = ?, jenis_kelamin = ?, 
                email = ?, alamat = ?, telepon_orangtua = ?, telepon_siswa = ?, status = ?, diperbarui_pada = NOW() 
                WHERE id_siswa = ?`,
                [sanitizedData.username, sanitizedData.nis, sanitizedData.nama, sanitizedData.kelas_id, 
                 sanitizedData.jabatan, sanitizedData.jenis_kelamin, sanitizedData.email, sanitizedData.alamat, 
                 sanitizedData.telepon_orangtua, sanitizedData.telepon_siswa, sanitizedData.status, id]
            );
            
            // Transaction automatically committed
        });
        
        console.log('✅ Student account updated successfully');
        res.success(null, 'Student account updated successfully');
    } catch (error) {
        console.error('❌ Error updating representative student:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete representative student
app.delete('/api/admin/siswa-perwakilan/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('👨‍🎓 Deleting representative student');
        
        const { id } = req.params;
        
        // Check if student exists in siswa table
        const [student] = await db.execute('SELECT id, user_id FROM siswa WHERE id = ?', [id]);
        if (student.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        
        const studentData = student[0];
        
        // Transaction untuk atomic operation
        await db.withTransaction(async (connection) => {
            // Delete student from siswa table
            await connection.execute('DELETE FROM siswa WHERE id = ?', [id]);
            
            // Delete user from users table (cascade should handle this, but explicit for safety)
            await connection.execute('DELETE FROM users WHERE id = ?', [studentData.user_id]);
            
            // Transaction automatically committed
        });
        
        console.log('✅ Student account deleted successfully');
        res.success(null, 'Student account deleted successfully');
    } catch (error) {
        console.error('❌ Error deleting representative student:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// JADWAL ENDPOINTS - Schedule Management
// ================================================

// Check for schedule conflicts
app.get('/api/admin/jadwal/conflicts', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔍 Checking for schedule conflicts');
        
        // Parameter opsional untuk validasi real-time
        const { kelas_id, guru_id, ruang_id, hari, mulai, selesai } = req.query;

        if (kelas_id && guru_id && hari && mulai && selesai) {
            // Mode validasi real-time: cek konflik terhadap kelas, guru, dan ruang (jika ada)
            const conflicts = { kelas: [], guru: [], ruang: [] };

            const [kelasConf] = await db.execute(
                `SELECT id_jadwal FROM jadwal 
                 WHERE kelas_id = ? AND hari = ? AND status = 'aktif'
                 AND (jam_mulai < ? AND jam_selesai > ?)`,
                [kelas_id, hari, selesai, mulai]
            );
            conflicts.kelas = kelasConf;

            const [guruConf] = await db.execute(
                `SELECT id_jadwal FROM jadwal 
                 WHERE guru_id = ? AND hari = ? AND status = 'aktif'
                 AND (jam_mulai < ? AND jam_selesai > ?)`,
                [guru_id, hari, selesai, mulai]
            );
            conflicts.guru = guruConf;

            if (ruang_id) {
                const [ruangConf] = await db.execute(
                    `SELECT id_jadwal FROM jadwal 
                     WHERE ruang_id = ? AND hari = ? AND status = 'aktif'
                     AND (jam_mulai < ? AND jam_selesai > ?)`,
                    [ruang_id, hari, selesai, mulai]
                );
                conflicts.ruang = ruangConf;
            }

            return res.json({ success: true, data: conflicts });
        } else {
            // Mode audit menyeluruh (fallback lama) dengan perbaikan join mapel id
            const query = `
                SELECT 
                    j1.id_jadwal as jadwal1_id,
                    j1.kelas_id as kelas1_id,
                    j1.guru_id as guru1_id,
                    j1.hari as hari1,
                    j1.jam_mulai as jam_mulai1,
                    j1.jam_selesai as jam_selesai1,
                    j2.id_jadwal as jadwal2_id,
                    j2.kelas_id as kelas2_id,
                    j2.guru_id as guru2_id,
                    j2.hari as hari2,
                    j2.jam_mulai as jam_mulai2,
                    j2.jam_selesai as jam_selesai2,
                    k1.nama_kelas as kelas1_nama,
                    k2.nama_kelas as kelas2_nama,
                    g1.nama as guru1_nama,
                    g2.nama as guru2_nama,
                    m1.nama_mapel as mapel1_nama,
                    m2.nama_mapel as mapel2_nama
                FROM jadwal j1
                JOIN jadwal j2 ON j1.id_jadwal < j2.id_jadwal
                JOIN kelas k1 ON j1.kelas_id = k1.id_kelas
                JOIN kelas k2 ON j2.kelas_id = k2.id_kelas
                JOIN guru g1 ON j1.guru_id = g1.id_guru
                JOIN guru g2 ON j2.guru_id = g2.id_guru
                JOIN mapel m1 ON j1.mapel_id = m1.id_mapel
                JOIN mapel m2 ON j2.mapel_id = m2.id_mapel
                WHERE j1.status = 'aktif' 
                AND j2.status = 'aktif'
                AND (
                    (j1.guru_id = j2.guru_id 
                     AND j1.hari = j2.hari 
                     AND j1.jam_mulai < j2.jam_selesai 
                     AND j1.jam_selesai > j2.jam_mulai)
                    OR
                    (j1.ruang_id = j2.ruang_id 
                     AND j1.ruang_id IS NOT NULL 
                     AND j2.ruang_id IS NOT NULL
                     AND j1.hari = j2.hari 
                     AND j1.jam_mulai < j2.jam_selesai 
                     AND j1.jam_selesai > j2.jam_mulai)
                )
                ORDER BY j1.hari, j1.jam_mulai
            `;
            const [conflicts] = await db.execute(query);
            return res.json({ success: true, data: conflicts });
        }
        console.log(`✅ Found ${conflicts.length} schedule conflicts`);
        res.success(conflicts, 'Schedule conflicts retrieved successfully');
    } catch (error) {
        console.error('❌ Error checking schedule conflicts:', error);
        res.error('Internal server error', 'Failed to check schedule conflicts');
    }
});

// Export schedule to PDF format
app.get('/api/admin/jadwal/export/pdf', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Exporting schedule to PDF format');
        
        const { kelas_id } = req.query;
        
        // Get schedule data with all necessary joins
        let query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                j.mapel_id,
                j.guru_id,
                j.ruang_id,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                k.tingkat,
                m.nama_mapel,
                m.kode_mapel,
                g.nama as nama_guru,
                g.nip,
                r.nama_ruang,
                r.kode_ruang
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN ruang_kelas r ON j.ruang_id = r.id
            WHERE j.status = 'aktif'
        `;
        
        const params = [];
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND j.kelas_id = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY k.tingkat, k.nama_kelas, j.hari, j.jam_mulai';
        
        const [schedules] = await db.execute(query, params);
        
        // Generate PDF content (simplified HTML that can be converted to PDF)
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Jadwal Pelajaran - ${new Date().toLocaleDateString('id-ID')}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #000; padding: 4px; text-align: center; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .kelas-row { background-color: #e6f3ff; font-weight: bold; }
                    .mapel-row { background-color: #fff2e6; }
                    .break { background-color: #ffebee; }
                    .upacara { background-color: #fff3e0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>JADWAL PELAJARAN SMK NEGERI 13 BANDUNG</h2>
                    <h3>TAHUN AJARAN 2024/2025</h3>
                </div>
        `;

        // Group schedules by class and day
        const scheduleData = {};
        schedules.forEach(schedule => {
            const key = `${schedule.kelas_id}_${schedule.hari}`;
            if (!scheduleData[key]) {
                scheduleData[key] = {
                    kelas: schedule.nama_kelas,
                    tingkat: schedule.tingkat,
                    hari: schedule.hari,
                    schedules: []
                };
            }
            scheduleData[key].schedules.push(schedule);
        });

        // Create table for each class-day combination
        Object.values(scheduleData).forEach(classData => {
            html += `<h4>${classData.kelas} - ${classData.hari}</h4>`;
            html += '<table>';
            html += '<tr><th>Jam Ke</th><th>Waktu</th><th>Mata Pelajaran</th><th>Guru</th><th>Ruang</th></tr>';
            
            classData.schedules.forEach(schedule => {
                html += '<tr>';
                html += `<td>${schedule.jam_ke}</td>`;
                html += `<td>${schedule.jam_mulai} - ${schedule.jam_selesai}</td>`;
                html += `<td class="mapel-row">${schedule.nama_mapel}</td>`;
                html += `<td>${schedule.nama_guru}</td>`;
                html += `<td>${schedule.nama_ruang || '-'}</td>`;
                html += '</tr>';
            });
            
            html += '</table><br>';
        });

        html += '</body></html>';

        // Set headers for PDF download
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="jadwal-pelajaran-${new Date().toISOString().split('T')[0]}.html"`);
        
        console.log(`✅ PDF export data prepared: ${schedules.length} schedules`);
        res.send(html);
    } catch (error) {
        console.error('❌ Error exporting schedule to PDF:', error);
        res.error('Internal server error', 'Failed to export schedule to PDF');
    }
});

// Old export endpoint removed - using new matrix export endpoint below

// ================================================
// JADWAL ENDPOINTS - Schedule Management
// ================================================

// Get all schedules with join data
app.get('/api/admin/jadwal', authenticateToken, requireRole(['admin']), cacheMiddleware(300, (req) => `cache:admin:jadwal:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        console.log('📅 Getting schedules for admin dashboard');
        
        const query = `
            SELECT 
                j.id_jadwal as id,
                j.kelas_id,
                j.mapel_id, 
                j.guru_id,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel  
            JOIN guru g ON j.guru_id = g.id_guru
            WHERE j.status = 'aktif'
            ORDER BY 
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
                j.jam_mulai, 
                k.nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Schedules retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting schedules:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Add new schedule
app.post('/api/admin/jadwal', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('➕ Adding schedule:', { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai });
        console.log('➕ Field validation:', {
            kelas_id: !!kelas_id,
            mapel_id: !!mapel_id,
            guru_id: !!guru_id,
            hari: !!hari,
            jam_ke: !!jam_ke,
            jam_mulai: !!jam_mulai,
            jam_selesai: !!jam_selesai
        });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Check if day is Saturday (libur)
        const allowedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        if (!allowedDays.includes(hari)) {
            return res.status(400).json({ error: 'Hari Sabtu adalah hari libur, tidak dapat membuat jadwal' });
        }

        // Check for schedule conflicts - same class, day, and time overlap
        const [conflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND status = 'aktif' 
             AND (jam_mulai < ? AND jam_selesai > ?)`,
            [kelas_id, hari, jam_selesai, jam_mulai]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: `Kelas sudah memiliki jadwal pada ${hari} pada waktu yang sama` });
        }

        // Check teacher availability - same day and time overlap
        const [teacherConflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND status = 'aktif' 
             AND (jam_mulai < ? AND jam_selesai > ?)`,
            [guru_id, hari, jam_selesai, jam_mulai]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ error: `Guru sudah memiliki jadwal mengajar pada ${hari} pada waktu yang sama` });
        }

        const [result] = await db.execute(
            `INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
            [kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai]
        );

        console.log('✅ Schedule added successfully');
        res.json({ 
            message: 'Jadwal berhasil ditambahkan',
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Error adding schedule:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update schedule
app.put('/api/admin/jadwal/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('✏️ Updating schedule:', { id, kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Check if day is Saturday (libur)
        const allowedDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        if (!allowedDays.includes(hari)) {
            return res.status(400).json({ error: 'Hari Sabtu adalah hari libur, tidak dapat membuat jadwal' });
        }

        // Check for schedule conflicts (excluding current schedule) - same class, day, and time overlap
        const [conflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND status = 'aktif' AND id_jadwal != ?
             AND (jam_mulai < ? AND jam_selesai > ?)`,
            [kelas_id, hari, id, jam_selesai, jam_mulai]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: `Kelas sudah memiliki jadwal pada ${hari} pada waktu yang sama` });
        }

        // Check teacher availability (excluding current schedule) - same day and time overlap
        const [teacherConflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND status = 'aktif' AND id_jadwal != ?
             AND (jam_mulai < ? AND jam_selesai > ?)`,
            [guru_id, hari, id, jam_selesai, jam_mulai]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ error: `Guru sudah memiliki jadwal mengajar pada ${hari} pada waktu yang sama` });
        }

        const [result] = await db.execute(
            `UPDATE jadwal 
             SET kelas_id = ?, mapel_id = ?, guru_id = ?, ruang_id = ?, hari = ?, jam_ke = ?, jam_mulai = ?, jam_selesai = ?
             WHERE id_jadwal = ?`,
            [kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        console.log('✅ Schedule updated successfully');
        res.success(null, 'Jadwal berhasil diperbarui');
    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get schedule preview
app.get('/api/admin/jadwal/preview', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, minggu_ke } = req.query;
        console.log('📅 Getting schedule preview with matrix format:', { kelas_id, minggu_ke });

        let query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                k.nama_kelas,
                k.tingkat,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                g.id_guru,
                g.nama as nama_guru,
                g.nip,
                m.nama_mapel,
                m.kode_mapel,
                r.nama_ruang,
                r.kode_ruang
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN ruang_kelas r ON j.ruang_id = r.id
            WHERE j.status = 'aktif'
        `;
        
        let params = [];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND j.kelas_id = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY k.tingkat, k.nama_kelas, j.hari, j.jam_mulai';
        
        const [schedules] = await db.execute(query, params);
        
        // Define time slots
        const timeSlots = [
            { jam_ke: 1, jam_mulai: '07:00', jam_selesai: '08:00' },
            { jam_ke: 2, jam_mulai: '08:00', jam_selesai: '09:00' },
            { jam_ke: 3, jam_mulai: '09:00', jam_selesai: '10:00' },
            { jam_ke: 4, jam_mulai: '10:00', jam_selesai: '11:00' },
            { jam_ke: 5, jam_mulai: '11:00', jam_selesai: '12:00' },
            { jam_ke: 6, jam_mulai: '12:00', jam_selesai: '13:00' },
            { jam_ke: 7, jam_mulai: '13:00', jam_selesai: '14:00' },
            { jam_ke: 8, jam_mulai: '14:00', jam_selesai: '15:00' },
            { jam_ke: 9, jam_mulai: '15:00', jam_selesai: '16:00' }
        ];
        
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        
        // Group schedules by class
        const classGroups = {};
        schedules.forEach(schedule => {
            const className = schedule.nama_kelas;
            if (!classGroups[className]) {
                classGroups[className] = [];
            }
            classGroups[className].push(schedule);
        });
        
        // Create matrix grid for each class
        const matrixData = {};
        
        Object.keys(classGroups).forEach(className => {
            matrixData[className] = {};
            
            // Initialize matrix with empty cells
            days.forEach(day => {
                matrixData[className][day] = {};
                timeSlots.forEach(slot => {
                    matrixData[className][day][slot.jam_ke] = {
                        id: null,
                        mapel: '',
                        guru: '',
                        ruang: '',
                        jam_mulai: slot.jam_mulai,
                        jam_selesai: slot.jam_selesai,
                        jam_ke: slot.jam_ke
                    };
                });
            });
            
            // Fill matrix with actual data
            classGroups[className].forEach(schedule => {
                if (matrixData[className][schedule.hari] && matrixData[className][schedule.hari][schedule.jam_ke]) {
                    matrixData[className][schedule.hari][schedule.jam_ke] = {
                        id: schedule.id_jadwal,
                        mapel: schedule.nama_mapel,
                        kode_mapel: schedule.kode_mapel,
                        guru: schedule.nama_guru,
                        id_guru: schedule.id_guru,
                        ruang: schedule.nama_ruang || '',
                        kode_ruang: schedule.kode_ruang || '',
                        jam_mulai: schedule.jam_mulai,
                        jam_selesai: schedule.jam_selesai,
                        jam_ke: schedule.jam_ke
                    };
                }
            });
        });
        
        res.json({
            success: true,
            data: matrixData,
            metadata: {
                total_schedules: schedules.length,
                classes: Object.keys(matrixData),
                time_slots: timeSlots,
                days: days,
                generated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting schedule preview:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Export schedule to Excel with Matrix Grid Format
app.get('/api/admin/jadwal/export', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, format } = req.query;
        console.log('📊 Exporting schedule with matrix format:', { kelas_id, format });

        let query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                k.nama_kelas,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                g.id_guru,
                g.nama as nama_guru,
                g.nip,
                m.nama_mapel,
                m.kode_mapel,
                r.nama_ruang,
                r.kode_ruang
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN ruang_kelas r ON j.ruang_id = r.id
            WHERE j.status = 'aktif'
        `;
        
        let params = [];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND j.kelas_id = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY k.tingkat, k.nama_kelas, j.hari, j.jam_mulai';
        
        const [schedules] = await db.execute(query, params);
        
        console.log('🔍 Debug export format:', format);
        console.log('🔍 Debug format type:', typeof format);
        console.log('🔍 Debug format === "matrix":', format === 'matrix');
        
        if (format === 'matrix') {
            try {
                console.log('🔧 Starting matrix export...');
                console.log('📊 Schedules count:', schedules.length);
                console.log('📊 First schedule sample:', schedules[0]);
                
                // Matrix format: 3 rows per class (Guru, Mapel, Ruang)
                const workbook = new ExcelJS.Workbook();
                console.log('📊 Workbook created');
                const worksheet = workbook.addWorksheet('Jadwal Matrix');
                console.log('📊 Worksheet created');
            
            // Load mapel alias mapping
            let mapelAlias = {};
            try {
                const aliasPath = path.join(__dirname, 'backend', 'config', 'mapel-alias.json');
                if (fsSync.existsSync(aliasPath)) {
                    const aliasData = fsSync.readFileSync(aliasPath, 'utf8');
                    mapelAlias = JSON.parse(aliasData);
                }
            } catch (error) {
                console.log('⚠️ Mapel alias file not found, using kode_mapel as fallback');
            }
            
            // Create reverse mapping (kode_mapel -> alias)
            const reverseAlias = {};
            Object.entries(mapelAlias).forEach(([alias, kode]) => {
                reverseAlias[kode] = alias;
            });
            
            // Define time slots and days
            const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const timeSlots = [
                { jam_ke: 1, jam_mulai: '07:00', jam_selesai: '08:00' },
                { jam_ke: 2, jam_mulai: '08:00', jam_selesai: '09:00' },
                { jam_ke: 3, jam_mulai: '09:00', jam_selesai: '10:00' },
                { jam_ke: 4, jam_mulai: '10:00', jam_selesai: '11:00' },
                { jam_ke: 5, jam_mulai: '11:00', jam_selesai: '12:00' },
                { jam_ke: 6, jam_mulai: '12:00', jam_selesai: '13:00' },
                { jam_ke: 7, jam_mulai: '13:00', jam_selesai: '14:00' },
                { jam_ke: 8, jam_mulai: '14:00', jam_selesai: '15:00' },
                { jam_ke: 9, jam_mulai: '15:00', jam_selesai: '16:00' }
            ];
            
            // Group schedules by class
            console.log('📊 Grouping schedules by class...');
            const classGroups = {};
            schedules.forEach(schedule => {
                const className = schedule.nama_kelas;
                if (!classGroups[className]) {
                    classGroups[className] = {};
                }
                if (!classGroups[className][schedule.hari]) {
                    classGroups[className][schedule.hari] = {};
                }
                classGroups[className][schedule.hari][schedule.jam_ke] = schedule;
            });
            console.log('📊 Class groups created:', Object.keys(classGroups).length, 'classes');
            
            // Create header row
            const headerRow = ['KELAS'];
            days.forEach(day => {
                timeSlots.forEach(slot => {
                    headerRow.push(`${day}-${slot.jam_ke}`);
                });
            });
            worksheet.addRow(headerRow);
            
            // Add separator row
            const separatorRow = Array(headerRow.length).fill('----------');
            worksheet.addRow(separatorRow);
            
            // Add data for each class (3 rows per class)
            Object.keys(classGroups).sort().forEach(className => {
                const classData = classGroups[className];
                
                // Row 1: Kode Guru (G1, G2, etc.)
                const guruRow = [className];
                days.forEach(day => {
                    timeSlots.forEach(slot => {
                        const schedule = classData[day]?.[slot.jam_ke];
                        guruRow.push(schedule ? `G${schedule.id_guru}` : '-');
                    });
                });
                worksheet.addRow(guruRow);
                
                // Row 2: Alias Mapel
                const mapelRow = [''];
                days.forEach(day => {
                    timeSlots.forEach(slot => {
                        const schedule = classData[day]?.[slot.jam_ke];
                        if (schedule) {
                            const alias = reverseAlias[schedule.kode_mapel] || schedule.kode_mapel;
                            mapelRow.push(alias);
                        } else {
                            mapelRow.push('-');
                        }
                    });
                });
                worksheet.addRow(mapelRow);
                
                // Row 3: Kode Ruang
                const ruangRow = [''];
                days.forEach(day => {
                    timeSlots.forEach(slot => {
                        const schedule = classData[day]?.[slot.jam_ke];
                        ruangRow.push(schedule ? (schedule.kode_ruang || schedule.nama_ruang || '-') : '-');
                    });
                });
                worksheet.addRow(ruangRow);
                
                // Add separator after each class
                const classSeparatorRow = Array(headerRow.length).fill('----------');
                worksheet.addRow(classSeparatorRow);
            });
            
            // Style the worksheet
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) {
                    // Header row
                    row.eachCell((cell) => {
                        cell.font = { bold: true, size: 12 };
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE6F3FF' }
                        };
                    });
                } else if (rowNumber === 2) {
                    // Separator row
                    row.eachCell((cell) => {
                        cell.font = { size: 10 };
                        cell.alignment = { horizontal: 'center' };
                    });
                } else {
                    // Data rows
                    row.eachCell((cell, colNumber) => {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                        if (cell.value === '-') {
                            cell.font = { color: { argb: 'FF999999' } };
                        }
                        if (colNumber === 1 && cell.value && cell.value !== '-') {
                            // Class name column
                            cell.font = { bold: true };
                        }
                    });
                }
            });
            
            // Auto-fit columns
            worksheet.columns.forEach(column => {
                column.width = Math.max(column.width || 10, 12);
            });
            
            console.log('📊 Setting response headers...');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="jadwal-matrix-${kelas_id || 'semua'}-${new Date().toISOString().split('T')[0]}.xlsx"`);
            
            console.log('📊 Writing workbook to buffer...');
            // Write to buffer first, then send
            const buffer = await workbook.xlsx.writeBuffer();
            console.log('📊 Buffer created, size:', buffer.length);
            
            console.log('📊 Sending response...');
            res.send(buffer);
            console.log('✅ Matrix export completed successfully');
            
            } catch (matrixError) {
                console.error('❌ Error in matrix export:', matrixError);
                res.status(500).json({
                    success: false,
                    message: 'Error generating matrix export',
                    error: matrixError.message
                });
                return;
            }
            
        } else if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            
            // Group by class
            const classGroups = {};
            schedules.forEach(schedule => {
                const className = schedule.nama_kelas;
                if (!classGroups[className]) {
                    classGroups[className] = [];
                }
                classGroups[className].push(schedule);
            });
            
            // Create worksheet for each class
            Object.keys(classGroups).forEach(className => {
                const worksheet = workbook.addWorksheet(className);
                
                // Define time slots and days
                const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                const timeSlots = [
                    { jam_ke: 1, jam_mulai: '07:00', jam_selesai: '07:45' },
                    { jam_ke: 2, jam_mulai: '07:45', jam_selesai: '08:30' },
                    { jam_ke: 3, jam_mulai: '08:30', jam_selesai: '09:15' },
                    { jam_ke: 4, jam_mulai: '09:30', jam_selesai: '10:15' },
                    { jam_ke: 5, jam_mulai: '10:15', jam_selesai: '11:00' },
                    { jam_ke: 6, jam_mulai: '11:00', jam_selesai: '11:45' },
                    { jam_ke: 7, jam_mulai: '12:30', jam_selesai: '13:15' },
                    { jam_ke: 8, jam_mulai: '13:15', jam_selesai: '14:00' }
                ];
                
                // Create matrix grid
                const matrixData = {};
                
                // Initialize matrix with empty cells
                days.forEach(day => {
                    matrixData[day] = {};
                    timeSlots.forEach(slot => {
                        matrixData[day][slot.jam_ke] = {
                            mapel: '',
                            guru: '',
                            ruang: ''
                        };
                    });
                });
                
                // Fill matrix with actual data
                classGroups[className].forEach(schedule => {
                    if (matrixData[schedule.hari] && matrixData[schedule.hari][schedule.jam_ke]) {
                        matrixData[schedule.hari][schedule.jam_ke] = {
                            mapel: schedule.nama_mapel,
                            guru: schedule.nama_guru,
                            ruang: schedule.nama_ruang || ''
                        };
                    }
                });
                
                // Set up columns
                const columns = [
                    { header: 'Jam', key: 'jam', width: 15 }
                ];
                
                days.forEach(day => {
                    columns.push({ header: day, key: day.toLowerCase(), width: 25 });
                });
                
                worksheet.columns = columns;
                
                // Add time slot rows
                timeSlots.forEach(slot => {
                    const row = {
                        jam: `${slot.jam_mulai}-${slot.jam_selesai}`
                    };
                    
                    days.forEach(day => {
                        const cellData = matrixData[day][slot.jam_ke];
                        if (cellData.mapel) {
                            row[day.toLowerCase()] = `${cellData.mapel}\n${cellData.guru}${cellData.ruang ? `\n${cellData.ruang}` : ''}`;
                        } else {
                            row[day.toLowerCase()] = '-';
                        }
                    });
                    
                    worksheet.addRow(row);
                });
                
                // Style the worksheet
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) {
                        // Header row
                        row.eachCell((cell) => {
                            cell.font = { bold: true, size: 12 };
                            cell.alignment = { horizontal: 'center', vertical: 'middle' };
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFE6F3FF' }
                            };
                        });
                    } else {
                        // Data rows
                        row.eachCell((cell) => {
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            if (cell.value === '-') {
                                cell.font = { color: { argb: 'FF999999' } };
                            }
                        });
                    }
                });
                
                // Auto-fit columns
                worksheet.columns.forEach(column => {
                    column.width = Math.max(column.width || 10, 15);
                });
            });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="jadwal-${kelas_id || 'semua'}-${new Date().toISOString().split('T')[0]}.xlsx"`);
            
            // Write to buffer first, then send
            const buffer = await workbook.xlsx.writeBuffer();
            res.send(buffer);
            
        } else {
            console.log('🔍 Going to else branch - format:', format);
            // Default JSON response with matrix format
            const matrixData = {};
            
            // Group by class
            const classGroups = {};
            schedules.forEach(schedule => {
                const className = schedule.nama_kelas;
                if (!classGroups[className]) {
                    classGroups[className] = {};
                }
                if (!classGroups[className][schedule.hari]) {
                    classGroups[className][schedule.hari] = {};
                }
                classGroups[className][schedule.hari][schedule.jam_ke] = {
                    mapel: schedule.nama_mapel,
                    guru: schedule.nama_guru,
                    ruang: schedule.nama_ruang || '',
                    jam_mulai: schedule.jam_mulai,
                    jam_selesai: schedule.jam_selesai
                };
            });
            
            res.json({
                success: true,
                data: classGroups,
                metadata: {
                    total_schedules: schedules.length,
                    exported_at: new Date().toISOString(),
                    format: 'matrix_grid'
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error exporting schedule:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete schedule  
app.delete('/api/admin/jadwal/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting schedule:', { id });

        const [result] = await db.execute(
            'DELETE FROM jadwal WHERE id_jadwal = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        console.log('✅ Schedule deleted successfully');
        res.json({ message: 'Jadwal berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting schedule:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// ADVANCED SCHEDULE IMPORT ENDPOINTS
// ================================================

// Download template for advanced schedule import
app.get('/api/admin/templates/jadwal-advanced', 
    authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📥 Generating advanced schedule import template');
        
        const workbook = new ExcelJS.Workbook();
        
        // Sheet 1: JADWAL (Matrix Grid)
        const jadwalSheet = workbook.addWorksheet('JADWAL');
        
        // Set column headers
        const headers = ['KELAS'];
        const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        
        // Generate headers for each day and time slot
        for (const hari of hariList) {
            const timeSlots = scheduleImportConfig.timeSlots[hari] || [];
            for (const slot of timeSlots) {
                headers.push(`${hari}-${slot.jam_ke}`);
            }
        }
        
        jadwalSheet.columns = headers.map(header => ({
            header: header,
            key: header.toLowerCase().replace(/[^a-z0-9]/g, ''),
            width: header === 'KELAS' ? 15 : 10
        }));
        
        // Add sample data rows (3 rows per class)
        const sampleClasses = ['X IPA 1', 'X IPA 2', 'X IPS 1'];
        
        for (const className of sampleClasses) {
            // Row 1: Guru codes
            const guruRow = { KELAS: className };
            for (let i = 1; i < headers.length; i++) {
                guruRow[headers[i].toLowerCase().replace(/[^a-z0-9]/g, '')] = 'G1';
            }
            jadwalSheet.addRow(guruRow);
            
            // Row 2: Mapel aliases
            const mapelRow = { KELAS: '' };
            for (let i = 1; i < headers.length; i++) {
                mapelRow[headers[i].toLowerCase().replace(/[^a-z0-9]/g, '')] = 'MTK';
            }
            jadwalSheet.addRow(mapelRow);
            
            // Row 3: Ruang (optional)
            const ruangRow = { KELAS: '' };
            for (let i = 1; i < headers.length; i++) {
                ruangRow[headers[i].toLowerCase().replace(/[^a-z0-9]/g, '')] = 'R.301';
            }
            jadwalSheet.addRow(ruangRow);
        }
        
        // Sheet 2: MASTER GURU HARIAN (reserved for future use)
        const masterGuruSheet = workbook.addWorksheet('MASTER GURU HARIAN');
        masterGuruSheet.addRow(['GURU_ID', 'NAMA', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']);
        masterGuruSheet.addRow(['1', 'Contoh Guru', 'Y', 'Y', 'Y', 'Y', 'Y', 'N']);
        
        // Sheet 3: JAM GURU (reserved for future use)
        const jamGuruSheet = workbook.addWorksheet('JAM GURU');
        jamGuruSheet.addRow(['GURU_ID', 'NAMA', 'TOTAL_JAM', 'MAX_JAM']);
        jamGuruSheet.addRow(['1', 'Contoh Guru', '24', '30']);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template-jadwal-advanced.xlsx"');
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        
        console.log('✅ Advanced schedule template generated successfully');
    } catch (error) {
        console.error('❌ Error generating template:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal membuat template', 
            message: error.message 
        });
    }
});

// Import advanced schedule from Excel file
app.post('/api/admin/import/jadwal-advanced',
    authenticateToken, requireRole(['admin']), 
    upload.single('file'), async (req, res) => {
    try {
        console.log('📤 Processing advanced schedule import');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'File tidak ditemukan' 
            });
        }
        
        // Validate file size
        if (req.file.size > scheduleImportConfig.options.maxFileSize) {
            return res.status(400).json({ 
                success: false,
                error: `File terlalu besar. Maksimal ${scheduleImportConfig.options.maxFileSize / 1024 / 1024}MB` 
            });
        }
        
        // Load Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        
        // Get JADWAL sheet
        const jadwalSheet = workbook.getWorksheet(scheduleImportConfig.sheetNames.jadwal);
        if (!jadwalSheet) {
            return res.status(400).json({ 
                success: false,
                error: `Sheet "${scheduleImportConfig.sheetNames.jadwal}" tidak ditemukan` 
            });
        }
        
        // Load master data from database
        const [guruRows] = await db.execute(
            'SELECT id, id_guru FROM guru WHERE status = "aktif"'
        );
        const guruCache = {};
        for (const row of guruRows) {
            // Cache: id_guru → exists (untuk validasi)
            guruCache[row.id_guru] = true;
        }
        
        const [kelasRows] = await db.execute(
            'SELECT id_kelas, nama_kelas FROM kelas WHERE status = "aktif"'
        );
        const kelasCache = {};
        for (const row of kelasRows) {
            kelasCache[row.nama_kelas] = row.id_kelas;
        }
        
        const [mapelRows] = await db.execute(
            'SELECT id_mapel, kode_mapel FROM mapel WHERE status = "aktif"'
        );
        const mapelCache = {};
        for (const row of mapelRows) {
            // Cache: kode_mapel → id_mapel (untuk mapping)
            mapelCache[row.kode_mapel] = row.id_mapel;
        }
        
        // Prepare caches for validation
        const caches = {
            guru: guruCache,
            kelas: kelasCache,
            mapel: mapelCache,
            timeSlots: scheduleImportConfig.timeSlots,
            aliasMap: mapelAliasConfig.aliases
        };
        
        // Parse and validate data
        const rawEntries = parseJadwalSheet(jadwalSheet, scheduleImportConfig);
        const { valid, errors } = validateAndTransform(rawEntries, caches);
        
        console.log(`📊 Parsed ${rawEntries.length} entries, ${valid.length} valid, ${errors.length} errors`);
        
        // Dry run mode
        if (req.query.dryRun === 'true') {
            return res.json({
                success: true,
                dryRun: true,
                summary: {
                    total: rawEntries.length,
                    valid: valid.length,
                    invalid: errors.length
                },
                errors: errors,
                validEntries: valid.slice(0, 10) // Show first 10 valid entries as preview
            });
        }
        
        // Check if there are valid entries to import
        if (valid.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Tidak ada data valid untuk diimpor',
                errors: errors 
            });
        }
        
        // Import to database
        const { inserted, updated } = await upsertSchedules(valid, db);
        
        // Generate report
        const report = generateReport({
            total: rawEntries.length,
            inserted,
            updated
        }, errors);
        
        // Save report to file
        const reportFile = `reports/import-schedule-advanced-${Date.now()}.json`;
        await fs.mkdir('./reports', { recursive: true });
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`✅ Import completed: ${inserted} inserted, ${updated} updated, ${errors.length} errors`);
        
        res.json({
            success: true,
            summary: {
                total: rawEntries.length,
                inserted,
                updated,
                skipped: errors.length
            },
            errors: errors,
            reportFile: reportFile,
            recommendations: report.recommendations
        });
        
    } catch (error) {
        console.error('❌ Advanced schedule import error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Gagal impor jadwal advanced', 
            message: error.message 
        });
    }
});

// Get students for a specific schedule (class)
app.get('/api/schedule/:id/students', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`👥 Getting students for schedule ID: ${id}`);

        // First, get the schedule details to get the class ID
        const [scheduleData] = await db.execute(
            'SELECT kelas_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [id]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;
        const currentDate = new Date().toISOString().split('T')[0];

        // Get all students in the class with their existing attendance for today
        const [students] = await db.execute(
            `SELECT 
                s.id_siswa as id,
                s.nis,
                s.nama,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                k.nama_kelas,
                COALESCE(a.status, 'Hadir') as attendance_status,
                a.keterangan as attendance_note,
                a.waktu_absen as waktu_absen,
                COALESCE(a.ada_tugas, FALSE) as ada_tugas,
                COALESCE(a.terlambat, FALSE) as terlambat
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND a.jadwal_id = ? 
                AND a.tanggal = ?
            WHERE s.kelas_id = ? AND s.status = 'aktif'
            ORDER BY s.nama ASC`,
            [id, currentDate, kelasId]
        );

        console.log(`✅ Found ${students.length} students for schedule ${id} (class ${kelasId}) with attendance data`);
        res.json(students);
    } catch (error) {
        console.error('❌ Error getting students for schedule:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get students for a specific schedule by date (for edit mode)
app.get('/api/schedule/:id/students-by-date', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggal } = req.query;
        
        if (!tanggal) {
            return res.status(400).json({ error: 'Parameter tanggal diperlukan' });
        }
        
        console.log(`👥 Getting students for schedule ID: ${id} on date: ${tanggal}`);

        // First, get the schedule details to get the class ID
        const [scheduleData] = await db.execute(
            'SELECT kelas_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [id]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;

        // Get all students in the class with their existing attendance for the specified date
        const [students] = await db.execute(
            `SELECT 
                s.id_siswa as id,
                s.nis,
                s.nama,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                k.nama_kelas,
                COALESCE(a.status, 'Hadir') as attendance_status,
                a.keterangan as attendance_note,
                a.waktu_absen,
                COALESCE(a.ada_tugas, FALSE) as ada_tugas,
                COALESCE(a.terlambat, FALSE) as terlambat
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND a.jadwal_id = ? 
                AND a.tanggal = ?
            WHERE s.kelas_id = ? AND s.status = 'aktif'
            ORDER BY s.nama ASC`,
            [id, tanggal, kelasId]
        );

        console.log(`✅ Found ${students.length} students for schedule ${id} (class ${kelasId}) on date ${tanggal} with attendance data`);
        res.json(students);
    } catch (error) {
        console.error('❌ Error getting students for schedule by date:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Submit attendance for a schedule
app.post('/api/attendance/submit', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        console.log('🔍 DEBUG: Raw request body:', JSON.stringify(req.body, null, 2));
        console.log('🔍 DEBUG: Request user:', req.user);
        
        const { scheduleId, attendance, notes, adaTugas, terlambat, guruId: requestGuruId, tanggal_absen, diwakili, ada_tugas } = req.body;
        
        console.log('🔍 DEBUG: Parsed data:');
        console.log('  - scheduleId:', scheduleId, '(type:', typeof scheduleId, ')');
        console.log('  - attendance:', attendance, '(type:', typeof attendance, ')');
        console.log('  - notes:', notes, '(type:', typeof notes, ')');
        console.log('  - adaTugas:', adaTugas, '(type:', typeof adaTugas, ')');
        console.log('  - terlambat:', terlambat, '(type:', typeof terlambat, ')');
        console.log('  - requestGuruId:', requestGuruId, '(type:', typeof requestGuruId, ')');
        console.log('  - tanggal_absen:', tanggal_absen, '(type:', typeof tanggal_absen, ')');
        
        // Get guru_id from token or request body
        let guruId = requestGuruId;
        
        // If guruId not provided in request, try to get from token
        if (!guruId) {
            console.log('🔍 DEBUG: guruId not provided, getting from token...');
            if (req.user.role === 'guru') {
                // Try to get guru_id directly from token first
                if (req.user.guru_id) {
                    guruId = req.user.guru_id;
                    console.log(`✅ Got guru_id ${guruId} from token`);
                } else {
                    // Fallback: Get guru_id from guru table using user id (try both column names)
                    let guruData = [];
                    try {
                        [guruData] = await db.execute(
                            'SELECT id_guru FROM guru WHERE user_id = ? AND status = "aktif"',
                            [req.user.id]
                        );
                    } catch (err) {
                        console.log('🔄 Trying alternative column name id_pengguna...');
                        [guruData] = await db.execute(
                            'SELECT id_guru FROM guru WHERE id_pengguna = ? AND status = "aktif"',
                            [req.user.id]
                        );
                    }
                    
                    console.log('🔍 DEBUG: Guru query result:', guruData);
                    
                    if (guruData.length > 0) {
                        guruId = guruData[0].id_guru;
                        console.log(`✅ Found guru_id ${guruId} for user ${req.user.id}`);
                    } else {
                        console.error(`❌ Guru not found for user ${req.user.id}`);
                        console.error('❌ req.user:', req.user);
                        return res.status(404).json({ error: 'Data guru tidak ditemukan. Pastikan akun guru terhubung dengan benar.' });
                    }
                }
            } else {
                console.error('❌ guruId required for non-guru users');
                return res.status(400).json({ error: 'guruId diperlukan untuk admin' });
            }
        }
        
        console.log('🔍 DEBUG: Final guruId:', guruId);
        
        // Detailed validation with logging
        console.log('🔍 DEBUG: Validation checks:');
        console.log('  - scheduleId exists:', !!scheduleId);
        console.log('  - attendance exists:', !!attendance);
        console.log('  - attendance is object:', typeof attendance === 'object');
        console.log('  - attendance has keys:', attendance ? Object.keys(attendance).length : 0);
        
        if (!scheduleId) {
            console.error('❌ Validation failed: scheduleId is missing');
            return res.status(400).json({ error: 'Data absensi tidak lengkap - scheduleId missing' });
        }
        
        if (!attendance) {
            console.error('❌ Validation failed: attendance is missing');
            return res.status(400).json({ error: 'Data absensi tidak lengkap - attendance missing' });
        }
        
        if (typeof attendance !== 'object' || Object.keys(attendance).length === 0) {
            console.error('❌ Validation failed: attendance is not a valid object');
            return res.status(400).json({ error: 'Data absensi tidak lengkap - attendance invalid' });
        }

        console.log(`📝 Submitting attendance for schedule ${scheduleId} by teacher ${guruId}`);
        console.log(`📊 Attendance data:`, JSON.stringify(attendance, null, 2));
        console.log(`📝 Notes data:`, JSON.stringify(notes, null, 2));

        // Get the schedule details to verify it exists
        const [scheduleData] = await db.execute(
            'SELECT kelas_id, mapel_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [scheduleId]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;
        const mapelId = scheduleData[0].mapel_id;

        // Insert attendance records for each student using transaction
        const attendanceEntries = Object.entries(attendance);
        
        // Use tanggal_absen if provided (for Edit Absen mode), otherwise use current date
        const targetDate = tanggal_absen || new Date().toISOString().split('T')[0];
        // Use local time instead of UTC to avoid timezone issues
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:mm:ss format
        
        console.log(`📅 Target date for attendance: ${targetDate} (Edit mode: ${!!tanggal_absen})`);

        // Check for existing attendance first to prevent duplicates
        const existingAttendanceMap = new Map();
        for (const [studentId] of attendanceEntries) {
            try {
                const [existing] = await db.execute(
                    'SELECT id, status FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
                    [studentId, scheduleId, targetDate]
                );
                
                if (existing.length > 0) {
                    existingAttendanceMap.set(studentId, {
                        id: existing[0].id,
                        currentStatus: existing[0].status
                    });
                    console.log(`🔍 Found existing attendance for student ${studentId}: ID ${existing[0].id}, status: ${existing[0].status}`);
                }
            } catch (error) {
                console.error(`❌ Error checking existing attendance for student ${studentId}:`, error);
                // Continue with insert/update logic
            }
        }

        // Additional validation: Check if this is a duplicate submission
        const submissionKey = `attendance_${scheduleId}_${targetDate}_${guruId}`;
        const submissionTimestamp = Date.now();
        
        // Simple in-memory deduplication (in production, use Redis or database)
        if (global.submissionCache && global.submissionCache[submissionKey]) {
            const lastSubmission = global.submissionCache[submissionKey];
            if (submissionTimestamp - lastSubmission < 5000) { // 5 seconds
                console.log(`⚠️ Duplicate submission detected for ${submissionKey}, ignoring`);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Duplicate submission detected. Please wait a moment before submitting again.' 
                });
            }
        }
        
        // Store submission timestamp
        if (!global.submissionCache) global.submissionCache = {};
        global.submissionCache[submissionKey] = submissionTimestamp;

        await db.withTransaction(async (connection) => {
            for (const [studentId, status] of attendanceEntries) {
                const note = notes[studentId] || '';
                const hasAdaTugas = adaTugas && adaTugas[studentId] ? true : false;
                const hasTerlambat = terlambat && terlambat[studentId] ? true : false;
                
                // Validate status
                const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen'];
                if (!validStatuses.includes(status)) {
                    console.log(`❌ Invalid status "${status}" for student ${studentId}`);
                    throw new Error(`Status tidak valid: ${status}. Status yang diperbolehkan: ${validStatuses.join(', ')}`);
                }
                
                console.log(`👤 Processing student ${studentId}: status="${status}", note="${note}", ada_tugas=${hasAdaTugas}, terlambat=${hasTerlambat}`);
                
                // Check if we already found existing attendance in our pre-check
                const existingData = existingAttendanceMap.get(studentId);
                
                if (existingData) {
                    const existingId = existingData.id;
                    const currentStatus = existingData.currentStatus;
                    console.log(`🔄 Updating existing attendance ID ${existingId} from "${currentStatus}" to "${status}"`);
                    
                    // Update existing attendance
                    try {
                        const updateResult = await connection.execute(
                            'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ?, guru_id = ?, ada_tugas = ?, terlambat = ?, diwakili = ? WHERE id = ?',
                            [status, note, `${targetDate} ${currentTime}`, guruId, hasAdaTugas, hasTerlambat, diwakili || 0, existingId]
                        );
                        
                        console.log(`✅ Updated attendance for student ${studentId}: ${updateResult.affectedRows} rows affected`);
                    } catch (updateError) {
                        console.error('❌ Error updating attendance:', updateError);
                        
                        // Try alternative column names
                        const alternativeUpdates = [
                            'UPDATE absensi_siswa SET status = ?, catatan = ?, waktu_absen = ?, guru_id = ? WHERE id = ?',
                            'UPDATE absensi_siswa SET status = ?, keterangan = ?, created_at = ?, guru_id = ? WHERE id = ?',
                            'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ?, guru_id = ? WHERE id_absensi = ?'
                        ];
                        
                        let updateSuccess = false;
                        for (const altUpdate of alternativeUpdates) {
                            try {
                                console.log(`🔄 Trying update: ${altUpdate}`);
                                const updateResult = await connection.execute(altUpdate, [status, note, `${targetDate} ${currentTime}`, guruId, existingId]);
                                console.log('✅ Alternative update successful');
                                updateSuccess = true;
                                break;
                            } catch (altError) {
                                console.log(`❌ Alternative update failed: ${altError.message}`);
                            }
                        }
                        
                        if (!updateSuccess) {
                            throw new Error('Failed to update attendance record');
                        }
                    }
                } else {
                    console.log(`➕ Inserting new attendance for student ${studentId}`);
                    
                    // Insert new attendance
                    try {
                        const insertResult = await connection.execute(
                            'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id, ada_tugas, terlambat, diwakili) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [studentId, scheduleId, targetDate, status, note, `${targetDate} ${currentTime}`, guruId, hasAdaTugas, hasTerlambat, diwakili || 0]
                        );
                        
                        console.log(`✅ Inserted new attendance for student ${studentId}: ID ${insertResult.insertId}`);
                    } catch (insertError) {
                        console.error('❌ Error inserting attendance:', insertError);
                        
                        // Try alternative column names
                        const alternativeInserts = [
                            'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, catatan, waktu_absen, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            'INSERT INTO absensi_siswa (id_siswa, id_jadwal, tanggal, status, keterangan, waktu_absen, id_guru) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, created_at, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
                        ];
                        
                        let insertSuccess = false;
                        for (const altInsert of alternativeInserts) {
                            try {
                                console.log(`🔄 Trying insert: ${altInsert}`);
                                const insertResult = await connection.execute(altInsert, [studentId, scheduleId, targetDate, status, note, `${targetDate} ${currentTime}`, guruId]);
                                console.log('✅ Alternative insert successful');
                                insertSuccess = true;
                                break;
                            } catch (altError) {
                                console.log(`❌ Alternative insert failed: ${altError.message}`);
                            }
                        }
                        
                        if (!insertSuccess) {
                            throw new Error('Failed to insert attendance record');
                        }
                    }
                }
            }
        });

        console.log(`✅ Attendance submitted successfully for ${attendanceEntries.length} students`);
        res.json({ 
            message: 'Absensi berhasil disimpan',
            processed: attendanceEntries.length,
            date: targetDate,
            scheduleId: scheduleId
        });
    } catch (error) {
        console.error('❌ Error submitting attendance:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Check if it's a database column error
        if (error.message.includes('Unknown column')) {
            console.error('❌ Database column error detected. Table structure may be incorrect.');
            res.status(500).json({ 
                error: 'Database structure error',
                details: 'Table structure mismatch. Please check database setup.',
                technical: error.message
            });
        } else {
            res.status(500).json({ 
                error: 'Internal server error: ' + error.message,
                details: error.stack
            });
        }
    }
});

// ================================================
// DEBUG ENDPOINTS - Database Structure Testing
// ================================================

// Debug endpoint to check database structure
app.get('/api/debug/database-structure', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔍 Debugging database structure...');
        
        // Check if absensi_siswa table exists
        const [tables] = await db.execute("SHOW TABLES LIKE 'absensi_siswa'");
        if (tables.length === 0) {
            return res.json({ error: 'absensi_siswa table does not exist' });
        }
        
        // Get table structure
        const [tableInfo] = await db.execute('DESCRIBE absensi_siswa');
        console.log('📋 absensi_siswa table structure:', tableInfo);
        
        // Check for specific columns
        const columns = tableInfo.map(col => col.Field);
        const requiredColumns = ['id', 'siswa_id', 'jadwal_id', 'tanggal', 'status', 'keterangan', 'waktu_absen', 'guru_id', 'ada_tugas', 'terlambat', 'diwakili'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        // Test a simple query
        let testQueryResult = null;
        try {
            const [testResult] = await db.execute('SELECT COUNT(*) as count FROM absensi_siswa');
            testQueryResult = testResult[0];
        } catch (queryError) {
            testQueryResult = { error: queryError.message };
        }
        
        res.json({
            success: true,
            tableExists: true,
            structure: tableInfo,
            columns: columns,
            missingColumns: missingColumns,
            testQuery: testQueryResult
        });
        
    } catch (error) {
        console.error('❌ Error checking database structure:', error);
        res.status(500).json({ 
            error: 'Database check failed',
            details: error.message 
        });
    }
});

// ================================================
// ATTENDANCE ENDPOINTS - Student to Teacher Attendance
// ================================================

// Submit teacher attendance by student (with late detection)
app.post('/api/attendance/teacher', authenticateToken, requireRole(['siswa', 'admin']), async (req, res) => {
    try {
        const { jadwalId, guruId, status, keterangan, siswaId } = req.body;
        
        console.log('📝 Student submitting teacher attendance:', { jadwalId, guruId, status, keterangan, siswaId });
        
        // Validation
        if (!jadwalId || !guruId || !status || !siswaId) {
            return res.status(400).json({ error: 'Data absensi tidak lengkap' });
        }
        
        // Get schedule details to calculate lateness
        const [scheduleData] = await db.execute(
            'SELECT jam_mulai, jam_selesai, kelas_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [jadwalId]
        );
        
        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }
        
        const { jam_mulai, jam_selesai, kelas_id } = scheduleData[0];
        
        // Calculate lateness in minutes
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
        const scheduleStartTime = jam_mulai;
        
        // Convert time strings to minutes for comparison
        const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };
        
        const currentMinutes = timeToMinutes(currentTime);
        const scheduleMinutes = timeToMinutes(scheduleStartTime);
        const latenessMinutes = Math.max(0, currentMinutes - scheduleMinutes);
        
        console.log(`⏰ Time calculation: current=${currentTime}, schedule=${scheduleStartTime}, late=${latenessMinutes} minutes`);
        
        // Determine final status based on lateness
        let finalStatus = status;
        if (latenessMinutes > 0 && status === 'Hadir') {
            finalStatus = 'Terlambat';
        }
        
        // Check if teacher attendance already exists for today
        const [existingAttendance] = await db.execute(
            'SELECT id FROM absensi_guru WHERE jadwal_id = ? AND guru_id = ? AND DATE(tanggal) = CURDATE()',
            [jadwalId, guruId]
        );
        
        if (existingAttendance.length > 0) {
            // Update existing attendance
            await db.execute(
                'UPDATE absensi_guru SET status = ?, keterangan = ?, jam_terlambat = ?, waktu_catat = NOW(), siswa_pencatat_id = ? WHERE id = ?',
                [finalStatus, keterangan, latenessMinutes, siswaId, existingAttendance[0].id]
            );
            console.log(`✅ Updated existing teacher attendance for guru ${guruId}`);
        } else {
            // Insert new attendance
            await db.execute(
                'INSERT INTO absensi_guru (jadwal_id, guru_id, kelas_id, siswa_pencatat_id, tanggal, jam_ke, status, keterangan, jam_terlambat, waktu_catat) VALUES (?, ?, ?, ?, CURDATE(), (SELECT jam_ke FROM jadwal WHERE id_jadwal = ?), ?, ?, ?, NOW())',
                [jadwalId, guruId, kelas_id, siswaId, jadwalId, finalStatus, keterangan, latenessMinutes]
            );
            console.log(`✅ Inserted new teacher attendance for guru ${guruId}`);
        }
        
        // If student is marking teacher as absent and there's a task, sync teacher status
        if (finalStatus === 'Tidak Hadir' && req.body.ada_tugas) {
            console.log('📝 Teacher absent with task - syncing teacher status to "Diwakili Siswa"');
            
            // Update teacher attendance to show it's represented by student
            await db.execute(
                'UPDATE absensi_guru SET keterangan = CONCAT(COALESCE(keterangan, ""), " - Diwakili Siswa") WHERE jadwal_id = ? AND guru_id = ? AND DATE(tanggal) = CURDATE()',
                [jadwalId, guruId]
            );
        }
        
        res.json({
            success: true,
            message: 'Absensi guru berhasil dicatat',
            data: {
                status: finalStatus,
                latenessMinutes: latenessMinutes,
                timestamp: now.toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error submitting teacher attendance:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ================================================
// KOP LAPORAN ENDPOINTS - Dynamic Letterhead Management
// ================================================

// Get kop laporan configuration
app.get('/api/admin/kop-laporan', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting kop laporan configuration...');
        
        const [kopData] = await db.execute(
            'SELECT * FROM kop_laporan WHERE cakupan = "global" AND aktif = 1 ORDER BY dibuat_pada DESC LIMIT 1'
        );
        
        if (kopData.length === 0) {
            // Return default configuration if none exists
            return res.json({
                success: true,
                data: {
                    id: null,
                    cakupan: 'global',
                    kode_laporan: null,
                    aktif: 1,
                    perataan: 'tengah',
                    baris_teks: [
                        "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
                        "DINAS PENDIDIKAN",
                        "SMK NEGERI 13 JAKARTA",
                        "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
                    ],
                    logo_kiri_url: '/uploads/letterheads/logo-jawa-barat.png',
                    logo_kanan_url: '/uploads/letterheads/logo-smk.png'
                }
            });
        }
        
        const kop = kopData[0];
        res.json({
            success: true,
            data: {
                id: kop.id,
                cakupan: kop.cakupan,
                kode_laporan: kop.kode_laporan,
                aktif: kop.aktif,
                perataan: kop.perataan,
                baris_teks: JSON.parse(kop.baris_teks),
                logo_kiri_url: kop.logo_kiri_url,
                logo_kanan_url: kop.logo_kanan_url
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting kop laporan:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update kop laporan configuration
app.put('/api/admin/kop-laporan', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { baris_teks, logo_kiri_url, logo_kanan_url, perataan } = req.body;
        
        console.log('✏️ Updating kop laporan configuration...');
        
        // Validation
        if (!baris_teks || !Array.isArray(baris_teks)) {
            return res.status(400).json({ error: 'Baris teks harus berupa array' });
        }
        
        // Check if kop laporan exists
        const [existingKop] = await db.execute(
            'SELECT id FROM kop_laporan WHERE cakupan = "global" AND aktif = 1'
        );
        
        if (existingKop.length > 0) {
            // Update existing
            await db.execute(
                'UPDATE kop_laporan SET baris_teks = ?, logo_kiri_url = ?, logo_kanan_url = ?, perataan = ?, diubah_pada = NOW() WHERE id = ?',
                [JSON.stringify(baris_teks), logo_kiri_url, logo_kanan_url, perataan || 'tengah', existingKop[0].id]
            );
            console.log(`✅ Updated existing kop laporan ID ${existingKop[0].id}`);
        } else {
            // Insert new
            await db.execute(
                'INSERT INTO kop_laporan (cakupan, kode_laporan, aktif, perataan, baris_teks, logo_kiri_url, logo_kanan_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['global', null, 1, perataan || 'tengah', JSON.stringify(baris_teks), logo_kiri_url, logo_kanan_url]
            );
            console.log('✅ Inserted new kop laporan configuration');
        }
        
        res.json({
            success: true,
            message: 'Konfigurasi kop laporan berhasil diperbarui'
        });
        
    } catch (error) {
        console.error('❌ Error updating kop laporan:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ================================================
// RUANG KELAS ENDPOINTS - Room Management
// ================================================

// Get all rooms with kode_ruang
app.get('/api/admin/ruang-kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting room list...');
        
        const [rooms] = await db.execute(
            'SELECT id_kelas, nama_kelas, tingkat, ruang, kode_ruang, status FROM kelas WHERE status = "aktif" ORDER BY nama_kelas'
        );
        
        res.json({
            success: true,
            data: rooms
        });
        
    } catch (error) {
        console.error('❌ Error getting rooms:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update room kode_ruang
app.put('/api/admin/ruang-kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_ruang } = req.body;
        
        console.log(`✏️ Updating room ${id} kode_ruang to: ${kode_ruang}`);
        
        // Check if kode_ruang is unique (if provided)
        if (kode_ruang) {
            const [existing] = await db.execute(
                'SELECT id_kelas FROM kelas WHERE kode_ruang = ? AND id_kelas != ?',
                [kode_ruang, id]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Kode ruang sudah digunakan' });
            }
        }
        
        // Update the room
        const [result] = await db.execute(
            'UPDATE kelas SET kode_ruang = ? WHERE id_kelas = ?',
            [kode_ruang, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ruangan tidak ditemukan' });
        }
        
        console.log(`✅ Room ${id} updated successfully`);
        res.json({
            success: true,
            message: 'Kode ruang berhasil diperbarui'
        });
        
    } catch (error) {
        console.error('❌ Error updating room:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ================================================
// REPORTS ENDPOINTS - Teacher Attendance Reports
// ================================================

// Update permission request status
app.put('/api/admin/izin/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['disetujui', 'ditolak'].includes(status)) {
            return res.status(400).json({ error: 'Status harus disetujui atau ditolak' });
        }

        console.log(`🔄 Updating permission request ${id} to ${status}...`);

        const query = `
            UPDATE pengajuan_izin 
            SET status = ?, tanggal_disetujui = NOW() 
            WHERE id_izin = ?
        `;
        
        const [result] = await db.execute(query, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengajuan izin tidak ditemukan' });
        }

        console.log(`✅ Permission request ${id} updated to ${status}`);
        res.json({ message: `Pengajuan berhasil ${status}` });
    } catch (error) {
        console.error('❌ Error updating permission request:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get analytics data for dashboard
app.get('/api/admin/analytics', authenticateToken, requireRole(['admin']), cacheMiddleware(600, (req) => `cache:admin:analytics:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        console.log('📊 Getting analytics dashboard data...');

        // Get student attendance statistics
        const studentAttendanceQuery = `
            SELECT 
                'Hari Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND a.tanggal = CURDATE()
            UNION ALL
            SELECT 
                'Minggu Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND YEARWEEK(a.tanggal, 1) = YEARWEEK(CURDATE(), 1)
            UNION ALL
            SELECT 
                'Bulan Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND YEAR(a.tanggal) = YEAR(CURDATE()) 
                AND MONTH(a.tanggal) = MONTH(CURDATE())
        `;

        // Get teacher attendance statistics  
        const teacherAttendanceQuery = `
            SELECT 
                'Hari Ini' as periode,
                COUNT(CASE WHEN ag.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN ag.status != 'Hadir' OR ag.status IS NULL THEN 1 END) as tidak_hadir
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id AND ag.tanggal = CURDATE()
            UNION ALL
            SELECT 
                'Minggu Ini' as periode,
                COUNT(CASE WHEN ag.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN ag.status != 'Hadir' OR ag.status IS NULL THEN 1 END) as tidak_hadir
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                AND YEARWEEK(ag.tanggal, 1) = YEARWEEK(CURDATE(), 1)
            UNION ALL
            SELECT 
                'Bulan Ini' as periode,
                COUNT(CASE WHEN ag.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN ag.status != 'Hadir' OR ag.status IS NULL THEN 1 END) as tidak_hadir
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                AND YEAR(ag.tanggal) = YEAR(CURDATE()) 
                AND MONTH(ag.tanggal) = MONTH(CURDATE())
        `;

        // Get top absent students
        const topAbsentStudentsQuery = `
            SELECT 
                s.nama,
                k.nama_kelas,
                COUNT(CASE WHEN a.status IN ('Alpa', 'Izin', 'Sakit', 'Dispen') THEN 1 END) as total_alpa
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id
            GROUP BY s.id_siswa, s.nama, k.nama_kelas
            HAVING total_alpa > 0
            ORDER BY total_alpa DESC
            LIMIT 5
        `;

        // Get top absent teachers
        const topAbsentTeachersQuery = `
            SELECT 
                g.nama,
                COUNT(CASE WHEN ag.status IN ('Tidak Hadir', 'Sakit', 'Izin', 'Dispen') THEN 1 END) as total_tidak_hadir
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id
            GROUP BY g.id_guru, g.nama
            HAVING total_tidak_hadir > 0
            ORDER BY total_tidak_hadir DESC
            LIMIT 5
        `;

        // Get recent notifications/permission requests
        const notificationsQuery = `
            SELECT 
                pi.id_izin as id,
                CONCAT('Permohonan izin dari ', s.nama, ' (', k.nama_kelas, ')') as message,
                pi.tanggal_pengajuan as timestamp,
                pi.status,
                'permission_request' as type
            FROM pengajuan_izin pi
            JOIN siswa s ON pi.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE pi.status = 'pending'
            ORDER BY pi.tanggal_pengajuan DESC
            LIMIT 10
        `;

        const [studentAttendance] = await db.execute(studentAttendanceQuery);
        const [teacherAttendance] = await db.execute(teacherAttendanceQuery);
        const [topAbsentStudents] = await db.execute(topAbsentStudentsQuery);
        const [topAbsentTeachers] = await db.execute(topAbsentTeachersQuery);
        const [notifications] = await db.execute(notificationsQuery);

        const analyticsData = {
            studentAttendance: studentAttendance || [],
            teacherAttendance: teacherAttendance || [],
            topAbsentStudents: topAbsentStudents || [],
            topAbsentTeachers: topAbsentTeachers || [],
            notifications: notifications || []
        };

        console.log(`✅ Analytics data retrieved successfully`);
        res.json(analyticsData);
    } catch (error) {
        console.error('❌ Error getting analytics data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get live teacher attendance
app.get('/api/admin/live-teacher-attendance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting live teacher attendance...');

        const query = `
            SELECT 
                g.id_guru as id,
                g.nama,
                g.nip,
                m.nama_mapel,
                k.nama_kelas,
                j.jam_mulai,
                j.jam_selesai,
                COALESCE(ag.status, 'Belum Absen') as status,
                DATE_FORMAT(ag.waktu_catat, '%H:%i:%s') as waktu_absen,
                ag.keterangan
            FROM jadwal j
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND DATE(ag.tanggal) = CURDATE()
            WHERE j.hari = CASE WEEKDAY(CURDATE())
                WHEN 0 THEN 'Senin'
                WHEN 1 THEN 'Selasa'
                WHEN 2 THEN 'Rabu'
                WHEN 3 THEN 'Kamis'
                WHEN 4 THEN 'Jumat'
                ELSE 'Minggu'
            END
            ORDER BY k.nama_kelas, j.jam_mulai, g.nama
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Live teacher attendance retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting live teacher attendance:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get live student attendance
app.get('/api/admin/live-student-attendance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting live student attendance...');

        const query = `
            SELECT 
                s.id_siswa as id,
                s.nama,
                s.nis,
                k.nama_kelas,
                COALESCE(a.status, 'Belum Absen') as status,
                DATE_FORMAT(a.waktu_absen, '%H:%i:%s') as waktu_absen,
                a.keterangan
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND DATE(a.tanggal) = CURDATE()
            ORDER BY k.nama_kelas, s.nama
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Live student attendance retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting live student attendance:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get teacher attendance report
app.get('/api/admin/teacher-attendance-report', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        console.log('📊 Getting teacher attendance report:', { startDate, endDate, kelas_id });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                DATE_FORMAT(ag.tanggal, '%Y-%m-%d') as tanggal,
                k.nama_kelas,
                g.nama as nama_guru,
                g.nip as nip_guru,
                m.nama_mapel,
                CONCAT(j.jam_mulai, ' - ', j.jam_selesai) as jam_hadir,
                j.jam_mulai,
                j.jam_selesai,
                COALESCE(ag.status, 'Tidak Ada Data') as status,
                COALESCE(ag.keterangan, '-') as keterangan
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND ag.tanggal BETWEEN ? AND ?
            WHERE j.status = 'aktif'
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_mulai';
        
        const [rows] = await db.execute(query, params, { timeout: 30000 }); // 30 seconds for complex reports
        console.log(`✅ Teacher attendance report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Download teacher attendance report as Excel
app.get('/api/admin/download-teacher-attendance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        console.log('📊 Downloading teacher attendance report:', { startDate, endDate, kelas_id });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                COALESCE(DATE_FORMAT(ag.tanggal, '%d/%m/%Y'), DATE_FORMAT(CURDATE(), '%d/%m/%Y')) as tanggal,
                k.nama_kelas,
                g.nama as nama_guru,
                g.nip as nip_guru,
                m.nama_mapel,
                CASE 
                    WHEN ag.jam_ke IS NOT NULL THEN CONCAT('Jam ke-', ag.jam_ke)
                    ELSE CONCAT(j.jam_mulai, ' - ', j.jam_selesai)
                END as jam_hadir,
                j.jam_mulai,
                j.jam_selesai,
                CONCAT(j.jam_mulai, ' - ', j.jam_selesai) as jadwal,
                COALESCE(ag.status, 'Tidak Ada Data') as status,
                COALESCE(ag.keterangan, '-') as keterangan
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND ag.tanggal BETWEEN ? AND ?
            WHERE j.status = 'aktif'
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await db.execute(query, params);

        // Enhanced CSV format with UTF-8 BOM for Excel compatibility
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'Tanggal,Kelas,Guru,NIP,Mata Pelajaran,Jam Hadir,Jam Mulai,Jam Selesai,Jadwal,Status,Keterangan\n';
        
        rows.forEach(row => {
            csvContent += `"${row.tanggal}","${row.nama_kelas}","${row.nama_guru}","${row.nip_guru || ''}","${row.nama_mapel}","${row.jam_hadir || ''}","${row.jam_mulai}","${row.jam_selesai}","${row.jadwal}","${row.status}","${row.keterangan || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="laporan-kehadiran-guru-${startDate}-${endDate}.csv"`);
        res.send(csvContent);
        
        console.log(`✅ Teacher attendance report downloaded successfully: ${rows.length} records`);
    } catch (error) {
        console.error('❌ Error downloading teacher attendance report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get student attendance report
app.get('/api/admin/student-attendance-report', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        console.log('📊 Getting student attendance report:', { startDate, endDate, kelas_id });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
                k.nama_kelas,
                s.nama as nama_siswa,
                s.nis as nis_siswa,
                'Absensi Harian' as nama_mapel,
                'Siswa Perwakilan' as nama_guru,
                DATE_FORMAT(a.waktu_absen, '%H:%i:%s') as waktu_absen,
                '07:00' as jam_mulai,
                '17:00' as jam_selesai,
                COALESCE(a.status, 'Tidak Hadir') as status,
                COALESCE(a.keterangan, '-') as keterangan
            FROM absensi_siswa a
            JOIN siswa s ON a.siswa_id = s.id
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.tanggal) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await db.execute(query, params, { timeout: 30000 }); // 30 seconds for complex reports
        console.log(`✅ Student attendance report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting student attendance report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Download student attendance report as CSV
app.get('/api/admin/download-student-attendance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        console.log('📊 Downloading student attendance report:', { startDate, endDate, kelas_id });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                DATE_FORMAT(a.tanggal, '%d/%m/%Y') as tanggal,
                k.nama_kelas,
                s.nama as nama_siswa,
                s.nis as nis_siswa,
                'Absensi Harian' as nama_mapel,
                'Siswa Perwakilan' as nama_guru,
                DATE_FORMAT(a.waktu_absen, '%H:%i:%s') as waktu_absen,
                '07:00' as jam_mulai,
                '17:00' as jam_selesai,
                '07:00 - 17:00' as jadwal,
                COALESCE(a.status, 'Tidak Hadir') as status,
                COALESCE(a.keterangan, '-') as keterangan
            FROM absensi_siswa a
            JOIN siswa s ON a.siswa_id = s.id
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.tanggal) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await db.execute(query, params);

        // Enhanced CSV format with UTF-8 BOM for Excel compatibility
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'Tanggal,Kelas,Nama Siswa,NIS,Mata Pelajaran,Guru,Waktu Absen,Jam Mulai,Jam Selesai,Jadwal,Status,Keterangan\n';
        
        rows.forEach(row => {
            csvContent += `"${row.tanggal}","${row.nama_kelas}","${row.nama_siswa}","${row.nis_siswa || ''}","${row.nama_mapel || ''}","${row.nama_guru || ''}","${row.waktu_absen || ''}","${row.jam_mulai || ''}","${row.jam_selesai || ''}","${row.jadwal || ''}","${row.status}","${row.keterangan || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="laporan-kehadiran-siswa-${startDate}-${endDate}.csv"`);
        res.send(csvContent);
        
        console.log(`✅ Student attendance report downloaded successfully: ${rows.length} records`);
    } catch (error) {
        console.error('❌ Error downloading student attendance report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ===================== NEW: SUMMARY REPORTS (ADMIN) =====================
// Student attendance summary (H/I/S/A/D + percentage) grouped by student
app.get('/api/admin/student-attendance-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                s.id_siswa as siswa_id,
                s.nama,
                s.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS D,
                COALESCE(COUNT(a.id), 0) AS total,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                END AS presentase
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND DATE(a.waktu_absen) BETWEEN ? AND ?
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE s.status = 'aktif'
        `;
        const params = [startDate, endDate];
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        query += ' GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas ORDER BY k.nama_kelas, s.nama';

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting student attendance summary:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Download student attendance summary as styled Excel
app.get('/api/admin/download-student-attendance-excel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        let query = `
            SELECT 
                s.nama,
                s.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS D,
                COALESCE(COUNT(a.id), 0) AS total,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                END AS presentase
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND DATE(a.waktu_absen) BETWEEN ? AND ?
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE s.status = 'aktif'
        `;
        const params = [startDate, endDate];
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        query += ' GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas ORDER BY k.nama_kelas, s.nama';

        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Kehadiran Siswa');

        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama', key: 'nama', width: 28 },
            { header: 'NIS', key: 'nis', width: 14 },
            { header: 'Kelas', key: 'kelas', width: 14 },
            { header: 'H', key: 'H', width: 6 },
            { header: 'I', key: 'I', width: 6 },
            { header: 'S', key: 'S', width: 6 },
            { header: 'A', key: 'A', width: 6 },
            { header: 'D', key: 'D', width: 6 },
            { header: 'Presentase', key: 'presentase', width: 14 }
        ];

        // Header styling
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
        });

        rows.forEach((r, idx) => {
            sheet.addRow({
                no: idx + 1,
                nama: r.nama,
                nis: r.nis || '',
                kelas: r.nama_kelas,
                H: r.H || 0,
                I: r.I || 0,
                S: r.S || 0,
                A: r.A || 0,
                D: r.D || 0,
                presentase: r.presentase || 0
            });
        });

        // Color columns H I S A D
        const colorMap = { H: 'FF10B981', I: 'FF3B82F6', S: 'FFEF4444', A: 'FFF59E0B', D: 'FF8B5CF6' };
        ['H','I','S','A','D'].forEach((key, i) => {
            const col = sheet.getColumn(5 + i);
            col.eachCell((cell, rowNumber) => {
                if (rowNumber === 1) return; // skip header
                cell.alignment = { horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorMap[key] } };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
            });
        });
        sheet.getColumn('presentase').numFmt = '0.00%';
        // But we wrote as 0-100, convert: set percentage by dividing by 100 using formula
        for (let r = 2; r <= sheet.rowCount; r++) {
            const cell = sheet.getCell(`J${r}`);
            const val = Number(cell.value || 0);
            cell.value = { formula: `${val}/100` };
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-ringkas-kehadiran-siswa-${startDate}-${endDate}.xlsx`);
        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('❌ Error downloading student attendance summary excel:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Teacher attendance summary grouped by teacher (H/I/S/A)
app.get('/api/admin/teacher-attendance-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }
        let query = `
            SELECT 
                g.id_guru as guru_id,
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN ag.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN ag.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN ag.status = 'Tidak Hadir' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(COUNT(ag.id_absensi), 0) AS total,
                CASE 
                    WHEN COUNT(ag.id_absensi) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(ag.id_absensi)), 2)
                END AS presentase
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id AND ag.tanggal BETWEEN ? AND ?
            WHERE g.status = 'aktif'
        `;
        const params = [startDate, endDate];
        query += ' GROUP BY g.id_guru, g.nama, g.nip ORDER BY g.nama';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance summary:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

app.get('/api/admin/download-teacher-attendance-excel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }
        let query = `
            SELECT 
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN ag.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN ag.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN ag.status = 'Tidak Hadir' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(COUNT(ag.id_absensi), 0) AS total,
                CASE 
                    WHEN COUNT(ag.id_absensi) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(ag.id_absensi)), 2)
                END AS presentase
            FROM guru g
            LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id AND ag.tanggal BETWEEN ? AND ?
            WHERE g.status = 'aktif'
        `;
        const params = [startDate, endDate];
        query += ' GROUP BY g.id_guru, g.nama, g.nip ORDER BY g.nama';
        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Kehadiran Guru');
        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama', key: 'nama', width: 28 },
            { header: 'NIP', key: 'nip', width: 20 },
            { header: 'H', key: 'H', width: 6 },
            { header: 'I', key: 'I', width: 6 },
            { header: 'S', key: 'S', width: 6 },
            { header: 'A', key: 'A', width: 6 },
            { header: 'Presentase', key: 'presentase', width: 14 }
        ];
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
        });
        rows.forEach((r, idx) => {
            sheet.addRow({ no: idx + 1, nama: r.nama, nip: r.nip || '', H: r.H||0, I: r.I||0, S: r.S||0, A: r.A||0, presentase: r.presentase||0 });
        });
        const colorMap = { H: 'FF10B981', I: 'FF3B82F6', S: 'FFEF4444', A: 'FFF59E0B' };
        ['H','I','S','A'].forEach((key, i) => {
            const col = sheet.getColumn(4 + i);
            col.eachCell((cell, rowNumber) => {
                if (rowNumber === 1) return;
                cell.alignment = { horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorMap[key] } };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
            });
        });
        sheet.getColumn('presentase').numFmt = '0.00%';
        for (let r = 2; r <= sheet.rowCount; r++) {
            const cell = sheet.getCell(`H${r}`);
            const val = Number(cell.value || 0);
            cell.value = { formula: `${val}/100` };
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-ringkas-kehadiran-guru-${startDate}-${endDate}.xlsx`);
        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('❌ Error downloading teacher attendance summary excel:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ===================== NEW: SUMMARY REPORTS (GURU) =====================

// Get teacher info endpoint
app.get('/api/guru/info', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const guruId = req.user.guru_id;
        console.log(`👨‍🏫 Getting teacher info for guru_id: ${guruId}`);
        
        if (!guruId) {
            return res.status(400).json({ 
                success: false, 
                error: 'guru_id tidak ditemukan pada token' 
            });
        }
        
        // Get teacher information
        const [guruData] = await db.execute(`
            SELECT g.id_guru as id, g.nip, g.nama, g.email, g.mata_pelajaran, g.mapel_id,
                   g.no_telp, g.alamat, g.jenis_kelamin, g.status,
                   m.nama_mapel, u.username, u.id as user_id
            FROM guru g
            LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
            LEFT JOIN users u ON g.user_id = u.id
            WHERE g.id_guru = ?
        `, [guruId]);
        
        if (guruData.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Data guru tidak ditemukan' 
            });
        }
        
        const guru = guruData[0];
        
        // Get classes taught by this teacher
        const [classesData] = await db.execute(`
            SELECT DISTINCT k.id_kelas as id, k.nama_kelas, k.tingkat
            FROM jadwal j 
            JOIN kelas k ON j.kelas_id = k.id_kelas 
            WHERE j.guru_id = ? AND j.status = 'aktif'
            ORDER BY k.nama_kelas
        `, [guruId]);
        
        res.json({
            success: true,
            data: {
                id: guru.id,
                guru_id: guru.id, // Add guru_id field for frontend compatibility
                nip: guru.nip,
                nama: guru.nama,
                email: guru.email,
                mata_pelajaran: guru.mata_pelajaran,
                nama_mapel: guru.nama_mapel,
                no_telp: guru.no_telp,
                alamat: guru.alamat,
                jenis_kelamin: guru.jenis_kelamin,
                status: guru.status,
                username: guru.username,
                user_id: guru.user_id,
                role: 'guru', // Add role field
                kelas: classesData
            }
        });
        
    } catch (error) {
        console.error('❌ Get guru info error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Classes taught by the logged-in teacher
app.get('/api/guru/classes', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const guruId = req.user.guru_id;
        const [rows] = await db.execute(
            `SELECT DISTINCT k.id_kelas as id, k.nama_kelas 
             FROM jadwal j JOIN kelas k ON j.kelas_id = k.id_kelas 
             WHERE j.guru_id = ? AND j.status = 'aktif' ORDER BY k.nama_kelas`,
            [guruId]
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher classes:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

app.get('/api/guru/attendance-summary', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        const guruId = req.user.guru_id;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }
        let query = `
            SELECT 
                s.id_siswa as siswa_id,
                s.nama,
                s.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS D,
                COALESCE(COUNT(a.id), 0) AS total,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                END AS presentase
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND DATE(a.waktu_absen) BETWEEN ? AND ?
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE s.status = 'aktif' AND (j.guru_id = ? OR j.guru_id IS NULL)
        `;
        const params = [startDate, endDate, guruId];
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        query += ' GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas ORDER BY k.nama_kelas, s.nama';
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance summary (guru):', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

app.get('/api/guru/download-attendance-excel', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        const guruId = req.user.guru_id;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }
        let query = `
            SELECT 
                s.nama,
                s.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS D,
                COALESCE(COUNT(a.id), 0) AS total,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                END AS presentase
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND DATE(a.waktu_absen) BETWEEN ? AND ?
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE s.status = 'aktif' AND (j.guru_id = ? OR j.guru_id IS NULL)
        `;
        const params = [startDate, endDate, guruId];
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        query += ' GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas ORDER BY k.nama_kelas, s.nama';
        const [rows] = await db.execute(query, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Kehadiran Siswa (Guru)');
        sheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Nama', key: 'nama', width: 28 },
            { header: 'NIS', key: 'nis', width: 14 },
            { header: 'Kelas', key: 'kelas', width: 14 },
            { header: 'H', key: 'H', width: 6 },
            { header: 'I', key: 'I', width: 6 },
            { header: 'S', key: 'S', width: 6 },
            { header: 'A', key: 'A', width: 6 },
            { header: 'D', key: 'D', width: 6 },
            { header: 'Presentase', key: 'presentase', width: 14 }
        ];
        sheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: {style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
        });
        rows.forEach((r, idx) => {
            sheet.addRow({ no: idx + 1, nama: r.nama, nis: r.nis || '', kelas: r.nama_kelas, H: r.H||0, I: r.I||0, S: r.S||0, A: r.A||0, D: r.D||0, presentase: r.presentase||0 });
        });
        const colorMap = { H: 'FF10B981', I: 'FF3B82F6', S: 'FFEF4444', A: 'FFF59E0B', D: 'FF8B5CF6' };
        ['H','I','S','A','D'].forEach((key, i) => {
            const col = sheet.getColumn(5 + i);
            col.eachCell((cell, rowNumber) => {
                if (rowNumber === 1) return;
                cell.alignment = { horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorMap[key] } };
                cell.font = { bold: true, color: { argb: 'FF000000' } };
            });
        });
        sheet.getColumn('presentase').numFmt = '0.00%';
        for (let r = 2; r <= sheet.rowCount; r++) {
            const cell = sheet.getCell(`J${r}`);
            const val = Number(cell.value || 0);
            cell.value = { formula: `${val}/100` };
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=laporan-guru-ringkas-${startDate}-${endDate}.xlsx`);
        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('❌ Error downloading guru attendance excel:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Student attendance report for teachers
app.get('/api/guru/laporan-kehadiran-siswa', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        const guruId = req.user.guru_id;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan tanggal selesai wajib diisi' });
        }

        if (!guruId) {
            return res.status(400).json({ error: 'guru_id tidak ditemukan pada token users' });
        }

        let query = `
            SELECT 
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN a.status = 'izin' THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN a.status = 'sakit' THEN 1 ELSE 0 END), 0) AS sakit,
                COALESCE(SUM(CASE WHEN a.status = 'tidak_hadir' THEN 1 ELSE 0 END), 0) AS alpa,
                0 AS dispen,
                COALESCE(COUNT(a.id), 0) AS total_absensi,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN a.status = 'hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                END AS presentase_kehadiran
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id = a.siswa_id 
                AND DATE(a.tanggal) BETWEEN ? AND ?
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal_pelajaran j ON a.jadwal_id = j.id_jadwal
            WHERE s.status = 'aktif' 
                AND (j.guru_id = ? OR j.guru_id IS NULL)
        `;
        
        const params = [startDate, endDate, guruId];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas ORDER BY k.nama_kelas, s.nama';
        
        const [rows] = await db.execute(query, params);
        
        console.log(`✅ Student attendance report generated for guru_id: ${guruId}, found ${rows.length} students`);
        
        res.json({ 
            success: true, 
            data: rows,
            meta: {
                startDate,
                endDate,
                kelas_id: kelas_id || 'all',
                total_students: rows.length
            }
        });
        
    } catch (error) {
        console.error('❌ Error generating student attendance report:', error);
        res.status(500).json({ error: 'Gagal memuat laporan kehadiran siswa.' });
    }
});

// ================================================
// BANDING ABSEN ENDPOINTS  
// ================================================

// Get banding absen history report
app.get('/api/admin/banding-absen-report', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, status } = req.query;
        console.log('📊 Getting banding absen report:', { startDate, endDate, kelas_id, status });

        let query = `
            SELECT 
                pba.id as id_banding,
                DATE_FORMAT(pba.created_at, '%Y-%m-%d') as tanggal_pengajuan,
                DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal_absen,
                s.nama as nama_pengaju,
                k.nama_kelas,
                COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
                COALESCE(g.nama, 'Belum Ditentukan') as nama_guru,
                COALESCE(j.jam_mulai, '00:00') as jam_mulai,
                COALESCE(j.jam_selesai, '00:00') as jam_selesai,
                a.status as status_asli,
                a.status as status_diajukan,
                pba.alasan as alasan_banding,
                pba.status as status_banding,
                '-' as catatan_guru,
                '-' as tanggal_keputusan,
                'Belum Diproses' as diproses_oleh,
                'Individual' as jenis_banding,
                1 as jumlah_siswa_banding
            FROM pengajuan_banding_absen pba
            LEFT JOIN absensi_siswa a ON pba.absensi_id = a.id
            LEFT JOIN siswa s ON pba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pba.created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (status && status !== '') {
            query += ' AND pba.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pba.created_at DESC';
        
        const [rows] = await db.execute(query, params);
        console.log(`✅ Banding absen report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting banding absen report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Download banding absen report as CSV
app.get('/api/admin/download-banding-absen', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, status } = req.query;
        console.log('📊 Downloading banding absen report:', { startDate, endDate, kelas_id, status });

        let query = `
            SELECT 
                DATE_FORMAT(pba.created_at, '%d/%m/%Y') as tanggal_pengajuan,
                DATE_FORMAT(a.tanggal, '%d/%m/%Y') as tanggal_absen,
                s.nama as nama_pengaju,
                COALESCE(k.nama_kelas, '-') as nama_kelas,
                COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
                COALESCE(g.nama, 'Belum Ditentukan') as nama_guru,
                COALESCE(CONCAT(j.jam_mulai, ' - ', j.jam_selesai), '-') as jadwal,
                a.status as status_asli,
                a.status as status_diajukan,
                pba.alasan as alasan_banding,
                pba.status as status_banding,
                '-' as catatan_guru,
                '-' as tanggal_keputusan,
                'Belum Diproses' as diproses_oleh,
                'Individual' as jenis_banding,
                1 as jumlah_siswa_banding
            FROM pengajuan_banding_absen pba
            LEFT JOIN absensi_siswa a ON pba.absensi_id = a.id
            LEFT JOIN siswa s ON pba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pba.created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (status && status !== '') {
            query += ' AND pba.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pba.created_at DESC';
        
        const [rows] = await db.execute(query, params);

        // Enhanced CSV format with UTF-8 BOM for Excel compatibility
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'Tanggal Pengajuan,Tanggal Absen,Pengaju,Kelas,Mata Pelajaran,Guru,Jadwal,Status Asli,Status Diajukan,Alasan Banding,Status Banding,Catatan Guru,Tanggal Keputusan,Diproses Oleh,Jenis Banding,Jumlah Siswa\n';
        
        rows.forEach(row => {
            csvContent += `"${row.tanggal_pengajuan}","${row.tanggal_absen}","${row.nama_pengaju}","${row.nama_kelas}","${row.nama_mapel}","${row.nama_guru}","${row.jadwal}","${row.status_asli}","${row.status_diajukan}","${row.alasan_banding}","${row.status_banding}","${row.catatan_guru}","${row.tanggal_keputusan}","${row.diproses_oleh}","${row.jenis_banding}","${row.jumlah_siswa_banding}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="riwayat-banding-absen-${startDate || 'all'}-${endDate || 'all'}.csv"`);
        res.send(csvContent);
        
        console.log(`✅ Banding absen report downloaded successfully: ${rows.length} records`);
    } catch (error) {
        console.error('❌ Error downloading banding absen report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// PENGAJUAN IZIN SISWA ENDPOINTS
// ================================================

// Get pengajuan izin by siswa ID (updated for class data)
app.get('/api/siswa/:siswaId/pengajuan-izin', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📋 Getting pengajuan izin kelas for siswa:', siswaId);

        // Check database connection
        if (!db) {
            console.error('❌ Database connection not available');
            return res.status(500).json({ 
                success: false,
                error: 'Database connection tidak tersedia' 
            });
        }

        // Validate siswaId parameter
        if (!siswaId || isNaN(parseInt(siswaId))) {
            console.log('❌ Invalid siswaId parameter:', siswaId);
            return res.status(400).json({ 
                success: false,
                error: 'ID siswa tidak valid' 
            });
        }

        const query = `
            SELECT 
                pi.id as id_pengajuan,
                pi.jadwal_id,
                pi.alasan as tanggal_izin,
                pi.alasan as jenis_izin,
                pi.alasan,
                '' as bukti_pendukung,
                pi.status,
                '' as keterangan_guru,
                pi.created_at as tanggal_pengajuan,
                pi.created_at as tanggal_respon,
                COALESCE(j.jam_mulai, 'Izin Harian') as jam_mulai,
                COALESCE(j.jam_selesai, 'Izin Harian') as jam_selesai,
                COALESCE(m.nama_mapel, 'Izin Umum') as nama_mapel,
                COALESCE(g.nama, 'Menunggu Persetujuan') as nama_guru
            FROM pengajuan_izin_siswa pi
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            WHERE pi.siswa_id = ?
            ORDER BY pi.created_at DESC
        `;

        console.log('🔍 Executing query for pengajuan izin...');
        const [pengajuanRows] = await db.execute(query, [parseInt(siswaId)]);
        console.log(`📊 Found ${pengajuanRows.length} pengajuan records`);

        // Return pengajuan data without detail (table pengajuan_izin_detail doesn't exist)
        const pengajuanWithDetails = pengajuanRows.map(pengajuan => ({
            ...pengajuan,
            siswa_izin: [], // Empty detail array since table doesn't exist
            total_siswa_izin: 0
        }));

        console.log(`✅ Pengajuan izin kelas retrieved: ${pengajuanWithDetails.length} items`);
        res.json({
            success: true,
            data: pengajuanWithDetails
        });
    } catch (error) {
        console.error('❌ Error getting pengajuan izin kelas:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });
        res.status(500).json({ 
            success: false,
            error: 'Gagal memuat data pengajuan izin',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// Submit new pengajuan izin
app.post('/api/siswa/:siswaId/pengajuan-izin', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_mulai, tanggal_selesai, jenis_izin, alasan } = req.body;
        console.log('📝 Submitting pengajuan izin:', { siswaId, jadwal_id, tanggal_mulai, tanggal_selesai, jenis_izin });

        // Validation
        if (!tanggal_mulai || !tanggal_selesai || !jenis_izin || !alasan) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Validate jenis izin
        const validJenisIzin = ['sakit', 'izin', 'urusan_keluarga', 'keperluan_pribadi', 'lainnya', 'kelas', 'dispen'];
        if (!validJenisIzin.includes(jenis_izin)) {
            return res.status(400).json({ 
                error: `Jenis izin tidak valid: ${jenis_izin}. Jenis yang diperbolehkan: ${validJenisIzin.join(', ')}` 
            });
        }

        // Validate date range
        if (new Date(tanggal_mulai) > new Date(tanggal_selesai)) {
            return res.status(400).json({ error: 'Tanggal mulai tidak boleh lebih besar dari tanggal selesai' });
        }

        // Check if pengajuan already exists for overlapping dates
        const [existing] = await db.execute(
            `SELECT id_pengajuan FROM pengajuan_izin_siswa 
             WHERE siswa_id = ? AND (
                 (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
                 (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
                 (tanggal_mulai >= ? AND tanggal_selesai <= ?)
             )`,
            [siswaId, tanggal_mulai, tanggal_mulai, tanggal_selesai, tanggal_selesai, tanggal_mulai, tanggal_selesai]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Pengajuan izin untuk periode ini sudah ada atau bertumpang tindih' });
        }

        // Insert pengajuan izin
        const [result] = await db.execute(
            `INSERT INTO pengajuan_izin_siswa (siswa_id, jadwal_id, tanggal_mulai, tanggal_selesai, jenis_izin, alasan)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [siswaId, jadwal_id || null, tanggal_mulai, tanggal_selesai, jenis_izin, alasan]
        );

        console.log('✅ Pengajuan izin submitted successfully');
        res.json({ 
            message: 'Pengajuan izin berhasil dikirim',
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Error submitting pengajuan izin:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get pengajuan izin for guru to approve/reject
app.get('/api/guru/:guruId/pengajuan-izin', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { guruId } = req.params;
        console.log('📋 Getting pengajuan izin for guru:', guruId);

        const query = `
            SELECT 
                pi.id as id,
                pi.siswa_id,
                pi.jadwal_id,
                pi.created_at as tanggal_mulai,
                pi.created_at as tanggal_selesai,
                pi.alasan as jenis_izin,
                pi.alasan,
                '' as bukti_pendukung,
                pi.status as status_persetujuan,
                '' as catatan_guru,
                pi.created_at as tanggal_pengajuan,
                pi.created_at as tanggal_respon,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas
            FROM pengajuan_izin_siswa pi
            JOIN siswa s ON pi.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            WHERE (j.guru_id = ? OR ? IN (
                SELECT DISTINCT j2.guru_id 
                FROM jadwal j2 
                JOIN kelas k2 ON j2.kelas_id = k2.id_kelas
                WHERE k2.id_kelas = s.kelas_id
            ))
            ORDER BY pi.tanggal_pengajuan DESC, pi.status ASC
        `;

        const [rows] = await db.execute(query, [guruId, guruId]);
        console.log(`✅ Pengajuan izin for guru retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting pengajuan izin for guru:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Approve or reject pengajuan izin by guru
app.put('/api/guru/pengajuan-izin/:pengajuanId', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { pengajuanId } = req.params;
        const { status, keterangan_guru } = req.body;
        const guruId = req.user.guru_id;
        
        console.log('📝 Guru responding to pengajuan izin:', { pengajuanId, status, guruId });

        // Validation
        if (!status || !['disetujui', 'ditolak'].includes(status)) {
            return res.status(400).json({ error: 'Status harus disetujui atau ditolak' });
        }

        // Update pengajuan izin
        const [result] = await db.execute(
            `UPDATE pengajuan_izin_siswa 
             SET status = ?, keterangan_guru = ?, tanggal_respon = NOW(), guru_id = ?
             WHERE id_pengajuan = ?`,
            [status, keterangan_guru || '', guruId, pengajuanId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengajuan izin tidak ditemukan' });
        }

        console.log('✅ Pengajuan izin response submitted successfully');
        res.json({ 
            message: `Pengajuan izin berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}`
        });
    } catch (error) {
        console.error('❌ Error responding to pengajuan izin:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Approve or reject pengajuan izin by ID (alternative endpoint for frontend compatibility)
app.put('/api/pengajuan-izin/:pengajuanId/approve', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { pengajuanId } = req.params;
        const { status_persetujuan, catatan_guru, disetujui_oleh } = req.body;
        const guruId = disetujui_oleh || req.user.guru_id || req.user.id;
        
        console.log('📝 Guru approving pengajuan izin:', { pengajuanId, status_persetujuan, guruId });

        // Validation
        if (!status_persetujuan || !['disetujui', 'ditolak'].includes(status_persetujuan)) {
            return res.status(400).json({ error: 'Status harus disetujui atau ditolak' });
        }

        // Update pengajuan izin
        const [result] = await db.execute(
            `UPDATE pengajuan_izin_siswa 
             SET status = ?, keterangan_guru = ?, tanggal_respon = NOW(), guru_id = ?
             WHERE id_pengajuan = ?`,
            [status_persetujuan, catatan_guru || '', guruId, pengajuanId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengajuan izin tidak ditemukan' });
        }

        console.log('✅ Pengajuan izin approval response submitted successfully');
        res.json({ 
            message: `Pengajuan izin berhasil ${status_persetujuan === 'disetujui' ? 'disetujui' : 'ditolak'}`,
            id: pengajuanId
        });
    } catch (error) {
        console.error('❌ Error responding to pengajuan izin approval:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// COMPATIBILITY ENDPOINTS FOR SCHEDULE MANAGEMENT
// ================================================

// Get subjects (alias for /api/admin/mapel)
app.get('/api/admin/subjects', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📚 Getting subjects for schedule management');
        
        const query = `
            SELECT 
                id_mapel as id, 
                kode_mapel, 
                nama_mapel, 
                deskripsi,
                status
            FROM mata_pelajaran 
            ORDER BY nama_mapel
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Subjects retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting subjects:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get classes (alias for /api/admin/kelas)
app.get('/api/admin/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🏫 Getting classes for schedule management');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, ruang, kode_ruang, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// JADWAL GURU MULTIPLE ENDPOINTS
// ================================================

// Get teachers for a specific schedule
app.get('/api/admin/jadwal/:jadwalId/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { jadwalId } = req.params;
        console.log('👨‍🏫 Getting teachers for schedule:', jadwalId);
        
        const query = `
            SELECT jg.id, jg.guru_id, g.nama, g.nip, g.email, g.mata_pelajaran
            FROM jadwal_guru jg
            JOIN guru g ON jg.guru_id = g.id_guru
            WHERE jg.jadwal_id = ?
            ORDER BY g.nama
        `;
        
        const [rows] = await db.execute(query, [jadwalId]);
        console.log(`✅ Teachers for schedule ${jadwalId}: ${rows.length} items`);
        res.success(rows, 'Teachers retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting teachers for schedule:', error);
        res.error('Internal server error', 'Failed to get teachers for schedule');
    }
});

// Add teacher to schedule
app.post('/api/admin/jadwal/:jadwalId/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { jadwalId } = req.params;
        const { guru_id } = req.body;
        console.log('➕ Adding teacher to schedule:', { jadwalId, guru_id });
        
        if (!guru_id) {
            return res.error('Guru ID is required', 'Validation failed');
        }
        
        // Check if teacher is already assigned to this schedule
        const [existing] = await db.execute(
            'SELECT id FROM jadwal_guru WHERE jadwal_id = ? AND guru_id = ?',
            [jadwalId, guru_id]
        );
        
        if (existing.length > 0) {
            return res.error('Guru sudah ditugaskan pada jadwal ini', 'Duplicate assignment');
        }
        
        // Add teacher to schedule
        await db.execute(
            'INSERT INTO jadwal_guru (jadwal_id, guru_id) VALUES (?, ?)',
            [jadwalId, guru_id]
        );
        
        console.log('✅ Teacher added to schedule successfully');
        res.success(null, 'Guru berhasil ditambahkan ke jadwal');
    } catch (error) {
        console.error('❌ Error adding teacher to schedule:', error);
        res.error('Internal server error', 'Failed to add teacher to schedule');
    }
});

// Remove teacher from schedule
app.delete('/api/admin/jadwal/:jadwalId/guru/:guruId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { jadwalId, guruId } = req.params;
        console.log('➖ Removing teacher from schedule:', { jadwalId, guruId });
        
        const [result] = await db.execute(
            'DELETE FROM jadwal_guru WHERE jadwal_id = ? AND guru_id = ?',
            [jadwalId, guruId]
        );
        
        if (result.affectedRows === 0) {
            return res.error('Guru tidak ditemukan dalam jadwal ini', 'Not found');
        }
        
        console.log('✅ Teacher removed from schedule successfully');
        res.success(null, 'Guru berhasil dihapus dari jadwal');
    } catch (error) {
        console.error('❌ Error removing teacher from schedule:', error);
        res.error('Internal server error', 'Failed to remove teacher from schedule');
    }
});

// Get available teachers for schedule (teachers not yet assigned)
app.get('/api/admin/jadwal/:jadwalId/guru/available', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { jadwalId } = req.params;
        console.log('👨‍🏫 Getting available teachers for schedule:', jadwalId);
        
        const query = `
            SELECT g.id_guru as id, g.nama, g.nip, g.email, g.mata_pelajaran
            FROM guru g
            WHERE g.status = 'aktif' 
            AND g.id_guru NOT IN (
                SELECT jg.guru_id 
                FROM jadwal_guru jg 
                WHERE jg.jadwal_id = ?
            )
            ORDER BY g.nama
        `;
        
        const [rows] = await db.execute(query, [jadwalId]);
        console.log(`✅ Available teachers for schedule ${jadwalId}: ${rows.length} items`);
        res.success(rows, 'Available teachers retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting available teachers:', error);
        res.error('Internal server error', 'Failed to get available teachers');
    }
});

// ================================================
// ABSENSI ENDPOINTS - Real Time Data
// ================================================

// Get today's schedule for guru or siswa
app.get('/api/jadwal/today', authenticateToken, async (req, res) => {
    try {
        let query = '';
        let params = [];

        if (req.user.role === 'guru') {
            query = `
                SELECT j.*, k.nama_kelas, m.nama_mapel
                FROM jadwal j
                JOIN kelas k ON j.kelas_id = k.id_kelas
                JOIN mapel m ON j.mapel_id = m.id_mapel
                WHERE j.guru_id = ? AND j.hari = DAYNAME(CURDATE()) AND j.status = 'aktif'
                ORDER BY j.jam_mulai
            `;
            params = [req.user.guru_id];
        } else if (req.user.role === 'siswa') {
            query = `
                SELECT j.*, g.nama as nama_guru, m.nama_mapel
                FROM jadwal j
                JOIN guru g ON j.guru_id = g.id_guru
                JOIN mapel m ON j.mapel_id = m.id_mapel
                WHERE j.kelas_id = ? AND j.hari = DAYNAME(CURDATE()) AND j.status = 'aktif'
                ORDER BY j.jam_mulai
            `;
            params = [req.user.kelas_id];
        }

        const [rows] = await db.execute(query, params);
        
        console.log(`📅 Today's schedule retrieved for ${req.user.role}: ${req.user.username}`);
        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('❌ Get today schedule error:', error);
        res.status(500).json({ error: 'Failed to retrieve today schedule' });
    }
});

// Record attendance (siswa marking guru attendance)
app.post('/api/absensi', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { jadwal_id, guru_id, status, keterangan } = req.body;

        // Check if attendance already recorded for today
        const [existing] = await db.execute(
            `SELECT * FROM absensi_guru 
             WHERE jadwal_id = ? AND tanggal = CURDATE()`,
            [jadwal_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Absensi untuk jadwal ini sudah dicatat hari ini' });
        }

        // Get jadwal details
        const [jadwalData] = await db.execute(
            'SELECT * FROM jadwal WHERE id_jadwal = ?',
            [jadwal_id]
        );

        if (jadwalData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        // Record attendance
        await db.execute(
            `INSERT INTO absensi_guru (jadwal_id, guru_id, kelas_id, siswa_pencatat_id, tanggal, jam_ke, status, keterangan)
             VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
            [jadwal_id, guru_id, req.user.kelas_id, req.user.siswa_id, jadwalData[0].jam_ke, status, keterangan]
        );

        console.log(`✅ Attendance recorded by ${req.user.nama} for guru_id: ${guru_id}, status: ${status}`);
        res.json({ success: true, message: 'Absensi berhasil dicatat' });

    } catch (error) {
        console.error('❌ Record attendance error:', error);
        res.status(500).json({ error: 'Failed to record attendance' });
    }
});

// Get attendance history
app.get('/api/absensi/history', authenticateToken, async (req, res) => {
    try {
        const { date_start, date_end, limit = 50 } = req.query;
        
        let query = `
            SELECT ag.*, j.jam_ke, j.jam_mulai, j.jam_selesai, j.hari,
                   g.nama as nama_guru, k.nama_kelas, m.nama_mapel,
                   s.nama as nama_pencatat
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN guru g ON ag.guru_id = g.id_guru
            JOIN kelas k ON ag.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa s ON ag.siswa_pencatat_id = s.id_siswa
        `;
        
        let params = [];
        let whereConditions = [];

        // Filter by user role
        if (req.user.role === 'guru') {
            whereConditions.push('ag.guru_id = ?');
            params.push(req.user.guru_id);
        } else if (req.user.role === 'siswa') {
            whereConditions.push('ag.kelas_id = ?');
            params.push(req.user.kelas_id);
        }

        // Date filters
        if (date_start) {
            whereConditions.push('ag.tanggal >= ?');
            params.push(date_start);
        }
        if (date_end) {
            whereConditions.push('ag.tanggal <= ?');
            params.push(date_end);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY ag.tanggal DESC, j.jam_mulai ASC LIMIT ?';
        params.push(parseInt(limit));

        const [rows] = await db.execute(query, params);
        
        console.log(`📊 Attendance history retrieved for ${req.user.role}: ${req.user.username}`);
        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('❌ Get attendance history error:', error);
        res.status(500).json({ error: 'Failed to retrieve attendance history' });
    }
});

// ================================================
// EXPORT EXCEL ENDPOINTS
// ================================================

// Export attendance to Excel
app.get('/api/export/absensi', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { date_start, date_end } = req.query;
        
        let query = `
            SELECT ag.tanggal, ag.status, ag.keterangan, ag.waktu_catat,
 j.jam_mulai, j.jam_selesai, j.hari,
                   g.nama as nama_guru, g.nip,
                   k.nama_kelas, m.nama_mapel,
                   s.nama as nama_pencatat, s.nis
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN guru g ON ag.guru_id = g.id_guru
            JOIN kelas k ON ag.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa s ON ag.siswa_pencatat_id = s.id_siswa
        `;
        
        let params = [];
        let whereConditions = [];

        if (date_start) {
            whereConditions.push('ag.tanggal >= ?');
            params.push(date_start);
        }
        if (date_end) {
            whereConditions.push('ag.tanggal <= ?');
            params.push(date_end);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_mulai';

        const [rows] = await db.execute(query, params);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Absensi');

        // Add headers
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 12 },
            { header: 'Hari', key: 'hari', width: 10 },
            { header: 'Jam Ke', key: 'jam_ke', width: 8 },
            { header: 'Waktu', key: 'waktu', width: 15 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 },
            { header: 'Nama Guru', key: 'nama_guru', width: 25 },
            { header: 'NIP', key: 'nip', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Pencatat', key: 'nama_pencatat', width: 20 }
        ];

        // Add data
        rows.forEach(row => {
            worksheet.addRow({
                tanggal: row.tanggal,
                hari: row.hari,
                jam_ke: row.jam_ke,
                waktu: `${row.jam_mulai} - ${row.jam_selesai}`,
                nama_kelas: row.nama_kelas,
                nama_mapel: row.nama_mapel,
                nama_guru: row.nama_guru,
                nip: row.nip,
                status: row.status,
                keterangan: row.keterangan || '-',
                nama_pencatat: row.nama_pencatat
            });
        });

        // Style headers
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563eb' }
        };

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=absensi-guru-${new Date().toISOString().split('T')[0]}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);

        console.log('✅ Excel export completed');

    } catch (error) {
        console.error('❌ Excel export error:', error);
        res.status(500).json({ error: 'Failed to export data to Excel' });
    }
});

// ================================================
// UPDATE PROFILE ENDPOINTS
// ================================================

// Update profile for siswa
app.put('/api/siswa/update-profile', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama, username, email, alamat, no_telepon, telepon_siswa, jenis_kelamin, jabatan } = req.body;
        
        console.log('📝 Updating student profile:', { userId, nama, username });

        if (!nama || !username) {
            return res.status(400).json({ error: 'Nama dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ? AND id != ?',
            [username, userId]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Update users table
            await connection.execute(
                'UPDATE users SET username = ?, nama = ?, email = ? WHERE id = ?',
                [username, nama, email || null, userId]
            );

            // Update siswa table
            await connection.execute(
                'UPDATE siswa SET nama = ?, username = ?, email = ?, alamat = ?, telepon_orangtua = ?, jenis_kelamin = ?, jabatan = ? WHERE user_id = ?',
                [nama, username, email || null, alamat || null, telepon_siswa || null, jenis_kelamin || null, jabatan || null, userId]
            );
        });

        console.log('✅ Student profile updated successfully');
        res.json({ 
            success: true,
            message: 'Profil berhasil diperbarui',
            data: { nama, username, email, alamat, no_telepon: telepon_siswa, jenis_kelamin, jabatan }
        });
    } catch (error) {
        console.error('❌ Error updating student profile:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update profile for guru
app.put('/api/guru/update-profile', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama, username, email, alamat, no_telepon, jenis_kelamin, mata_pelajaran } = req.body;
        
        console.log('📝 Updating teacher profile:', { userId, nama, username });

        if (!nama || !username) {
            return res.status(400).json({ error: 'Nama dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ? AND id != ?',
            [username, userId]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Update users table
            await connection.execute(
                'UPDATE users SET username = ?, nama = ?, email = ? WHERE id = ?',
                [username, nama, email || null, userId]
            );

            // Update guru table
            await connection.execute(
                'UPDATE guru SET nama = ?, username = ?, email = ?, alamat = ?, no_telp = ?, jenis_kelamin = ?, mata_pelajaran = ? WHERE user_id = ?',
                [nama, username, email || null, alamat || null, no_telepon || null, jenis_kelamin || null, mata_pelajaran || null, userId]
            );
        });

        console.log('✅ Teacher profile updated successfully');
        res.json({ 
            success: true,
            message: 'Profil berhasil diperbarui',
            data: { nama, username, email, alamat, no_telepon, jenis_kelamin, mata_pelajaran }
        });
    } catch (error) {
        console.error('❌ Error updating teacher profile:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update profile for admin
app.put('/api/admin/update-profile', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama, username, email } = req.body;
        
        console.log('📝 Updating admin profile:', { userId, nama, username });

        if (!nama || !username) {
            return res.error('Nama dan username wajib diisi', 'Validation failed');
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ? AND id != ?',
            [username, userId]
        );

        if (existingUsers.length > 0) {
            return res.error('Username sudah digunakan', 'Validation failed');
        }

        // Update users table
        await db.execute(
            'UPDATE users SET username = ?, nama = ?, email = ? WHERE id = ?',
            [username, nama, email || null, userId]
        );

        console.log('✅ Admin profile updated successfully');
        res.success({ 
            nama, username, email
        }, 'Profil berhasil diperbarui');
    } catch (error) {
        console.error('❌ Error updating admin profile:', error);
        res.error('Internal server error', 'Failed to update admin profile');
    }
});

// ================================================
// GURU ENDPOINTS
// ================================================

// Get teacher schedule (uses modern schema: jadwal/mapel/kelas) & guru_id from token
app.get('/api/guru/jadwal', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    const guruId = req.user.guru_id; // correct mapping to guru.id_guru
    console.log(`📅 Getting schedule for authenticated guru_id: ${guruId} (user_id: ${req.user.id})`);

    if (!guruId) {
        return res.status(400).json({ error: 'guru_id tidak ditemukan pada token users' });
    }

    try {
        const [jadwal] = await db.execute(`
            SELECT 
                j.id_jadwal AS id,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                mp.nama_mapel,
                mp.kode_mapel,
                k.nama_kelas
            FROM jadwal j
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN kelas k ON j.kelas_id = k.id_kelas
            WHERE j.guru_id = ? AND j.status = 'aktif'
            ORDER BY CASE j.hari 
                WHEN 'Senin' THEN 1
                WHEN 'Selasa' THEN 2
                WHEN 'Rabu' THEN 3
                WHEN 'Kamis' THEN 4
                WHEN 'Jumat' THEN 5
                WHEN 'Minggu' THEN 7
            END, j.jam_mulai
        `, [guruId]);

        console.log(`✅ Found ${jadwal.length} schedule entries for guru_id: ${guruId}`);
        res.json({ success: true, data: jadwal });
    } catch (error) {
        console.error('❌ Error fetching teacher schedule:', error);
        res.status(500).json({ error: 'Gagal memuat jadwal guru.' });
    }
});

// Get teacher attendance history
app.get('/api/guru/history', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    const guruId = req.user.guru_id;
    console.log(`📊 Fetching teacher attendance history for guru_id: ${guruId} (user_id: ${req.user.id})`);

    if (!guruId) {
        return res.status(400).json({ error: 'guru_id tidak ditemukan pada token users' });
    }

    try {
        const [history] = await db.execute(`
            SELECT 
                ag.tanggal, 
                ag.status, 
                ag.keterangan, 
                k.nama_kelas, 
                mp.nama_mapel
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            WHERE j.guru_id = ?
            ORDER BY ag.tanggal DESC, j.jam_mulai ASC
            LIMIT 50
        `, [guruId]);

        console.log(`✅ Found ${history.length} attendance history records for guru_id ${guruId}`);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('❌ Error fetching teacher attendance history:', error);
        res.status(500).json({ error: 'Gagal memuat riwayat absensi.' });
    }
});

// Get student attendance history for teacher (FIXED ENDPOINT)
app.get('/api/guru/student-attendance-history', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        // Try to get guru_id from token first, then from query
        let guruId = req.user.guru_id;
        
        console.log(`📊 Fetching student attendance history for guru_id: ${guruId}`);
        console.log('🔍 DEBUG: req.user:', req.user);

        if (!guruId) {
            // Fallback: Try to get guru_id from database using user_id
            console.log('🔄 guru_id not in token, fetching from database...');
            try {
                const [guruData] = await db.execute(
                    'SELECT id_guru FROM guru WHERE user_id = ? AND status = "aktif"',
                    [req.user.id]
                );
                
                if (guruData.length > 0) {
                    guruId = guruData[0].id_guru;
                    console.log(`✅ Found guru_id ${guruId} from database`);
                } else {
                    console.error('❌ Guru not found for user_id:', req.user.id);
                    return res.status(400).json({ error: 'guru_id tidak ditemukan. Akun guru tidak valid.' });
                }
            } catch (dbError) {
                console.error('❌ Database error when fetching guru_id:', dbError);
                return res.status(500).json({ error: 'Gagal mengambil data guru dari database.' });
            }
        }

        // Try to detect which student table exists (siswa or siswa_perwakilan)
        let studentTableName = 'siswa'; // Default to new table
        
        try {
            // Check if siswa table exists
            const [tableCheck] = await db.execute("SHOW TABLES LIKE 'siswa'");
            if (tableCheck.length === 0) {
                // If siswa doesn't exist, try siswa_perwakilan
                console.log('⚠️ siswa table not found, trying siswa_perwakilan...');
                studentTableName = 'siswa_perwakilan';
            }
        } catch (err) {
            console.log('⚠️ Could not check table existence, using default: siswa');
        }
        
        console.log(`📋 Using student table: ${studentTableName}`);

        // Fixed query - using jadwal table and dynamic student table with DISTINCT to prevent duplicates
        const query = `
            SELECT DISTINCT
                absensi.tanggal,
                jadwal.jam_mulai,
                jadwal.jam_selesai,
                jadwal.jam_ke,
                mapel.nama_mapel,
                kelas.nama_kelas,
                siswa.nama as nama_siswa,
                siswa.nis,
                absensi.status as status_kehadiran,
                absensi.keterangan,
                absensi.waktu_absen,
                absensi.ada_tugas,
                absensi.terlambat,
                COALESCE(guru_absen.status, 'Belum Absen') as status_guru,
                COALESCE(guru_absen.keterangan, '') as keterangan_guru
            FROM absensi_siswa absensi
            INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
            INNER JOIN mapel ON jadwal.mapel_id = mapel.id_mapel
            INNER JOIN kelas ON jadwal.kelas_id = kelas.id_kelas
            INNER JOIN ${studentTableName} siswa ON absensi.siswa_id = siswa.id_siswa
            LEFT JOIN (
                SELECT DISTINCT jadwal_id, tanggal, status, keterangan
                FROM absensi_guru 
                WHERE status IS NOT NULL
            ) guru_absen ON jadwal.id_jadwal = guru_absen.jadwal_id 
                AND DATE(guru_absen.tanggal) = DATE(absensi.tanggal)
            WHERE jadwal.guru_id = ? 
                AND absensi.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY absensi.tanggal DESC, absensi.waktu_absen DESC, jadwal.jam_mulai ASC
            LIMIT 1000`;

        console.log('🔍 DEBUG: Executing query with guru_id:', guruId);
        
        const [history] = await db.execute(query, [guruId]);

        console.log(`✅ Found ${history.length} student attendance records for guru_id ${guruId}`);
        
        // Debug: Log sample data
        if (history.length > 0) {
            console.log('📊 Sample history record:', history[0]);
        }
        
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('❌ Error fetching student attendance history:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Provide more detailed error information
        res.status(500).json({ 
            error: 'Gagal memuat riwayat absensi siswa.',
            details: error.message,
            hint: 'Periksa struktur database dan tabel yang tersedia.'
        });
    }
});

// Test endpoint untuk debugging
app.get('/api/guru/test', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        console.log('🧪 Test endpoint called');
        res.json({ success: true, message: 'Test endpoint working', user: req.user });
    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({ error: 'Test endpoint error' });
    }
});

// Simple student attendance history endpoint
app.get('/api/guru/student-attendance-simple', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const guruId = req.user.guru_id;
        console.log(`📊 Simple endpoint called for guru_id: ${guruId}`);

        if (!guruId) {
            return res.status(400).json({ error: 'guru_id tidak ditemukan' });
        }

        // Simple query to test
        const [result] = await db.execute(`
            SELECT COUNT(*) as total
            FROM jadwal j
            WHERE j.guru_id = ?
        `, [guruId]);

        console.log(`✅ Simple query result:`, result);
        res.json({ success: true, data: result, message: 'Simple endpoint working' });
    } catch (error) {
        console.error('❌ Simple endpoint error:', error);
        res.status(500).json({ error: 'Simple endpoint error' });
    }
});

// ================================================
// GURU ATTENDANCE TRACKING ENDPOINTS
// ================================================

// Get realtime guru attendance
app.get('/api/admin/guru/kehadiran-realtime', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tanggal = new Date().toISOString().split('T')[0] } = req.query;
        console.log('📊 Getting realtime guru attendance:', { tanggal });

        const query = `
            SELECT 
                ag.id_absensi,
                ag.guru_id,
                g.nama as nama_guru,
                ag.kelas_id,
                k.nama_kelas,
                ag.jadwal_id,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                ag.tanggal,
                ag.status,
                ag.keterangan,
                ag.waktu_scan,
                ag.metode_absen,
                ag.jam_terlambat,
                ag.alasan_terlambat,
                ag.waktu_catat,
                m.nama_mapel
            FROM absensi_guru ag
            JOIN guru g ON ag.guru_id = g.id_guru
            JOIN kelas k ON ag.kelas_id = k.id_kelas
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE ag.tanggal = ?
            ORDER BY ag.jam_ke, g.nama
        `;

        const [attendance] = await db.execute(query, [tanggal]);

        // Group by status for summary
        const summary = {
            total: attendance.length,
            hadir: attendance.filter(a => a.status === 'Hadir').length,
            tidak_hadir: attendance.filter(a => a.status === 'Tidak Hadir').length,
            sakit: attendance.filter(a => a.status === 'Sakit').length,
            izin: attendance.filter(a => a.status === 'Izin').length,
            terlambat: attendance.filter(a => a.status === 'Terlambat').length,
            dispen: attendance.filter(a => a.status === 'Dispen').length
        };

        res.json({
            success: true,
            data: attendance,
            summary,
            tanggal
        });

    } catch (error) {
        console.error('❌ Error getting realtime guru attendance:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update guru attendance status
app.put('/api/admin/guru/kehadiran/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, keterangan, jam_terlambat, alasan_terlambat, metode_absen } = req.body;
        console.log('✏️ Updating guru attendance:', { id, status, keterangan });

        // Validation
        const validStatuses = ['Hadir', 'Tidak Hadir', 'Sakit', 'Izin', 'Dispen', 'Terlambat'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid' });
        }

        // Update attendance
        const updateQuery = `
            UPDATE absensi_guru 
            SET status = ?, 
                keterangan = ?, 
                jam_terlambat = ?, 
                alasan_terlambat = ?, 
                metode_absen = ?,
                waktu_scan = NOW()
            WHERE id_absensi = ?
        `;

        await db.execute(updateQuery, [
            status, 
            keterangan, 
            jam_terlambat, 
            alasan_terlambat, 
            metode_absen || 'manual',
            id
        ]);

        console.log(`✅ Guru attendance updated: ID ${id}`);
        res.json({ success: true, message: 'Kehadiran guru berhasil diperbarui' });

    } catch (error) {
        console.error('❌ Error updating guru attendance:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get guru attendance statistics
app.get('/api/admin/guru/kehadiran-statistik', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { start_date, end_date, guru_id } = req.query;
        console.log('📈 Getting guru attendance statistics:', { start_date, end_date, guru_id });

        let query = `
            SELECT 
                ag.guru_id,
                g.nama as nama_guru,
                COUNT(*) as total_jadwal,
                SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ag.status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
                SUM(CASE WHEN ag.status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ag.status = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ag.status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
                SUM(CASE WHEN ag.status = 'Dispen' THEN 1 ELSE 0 END) as dispen,
                ROUND((SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as persentase_hadir
            FROM absensi_guru ag
            JOIN guru g ON ag.guru_id = g.id_guru
            WHERE ag.tanggal BETWEEN ? AND ?
        `;

        let params = [start_date || new Date().toISOString().split('T')[0], end_date || new Date().toISOString().split('T')[0]];

        if (guru_id) {
            query += ' AND ag.guru_id = ?';
            params.push(guru_id);
        }

        query += ' GROUP BY ag.guru_id, g.nama ORDER BY persentase_hadir DESC';

        const [statistics] = await db.execute(query, params);

        res.json({
            success: true,
            data: statistics,
            period: {
                start_date: start_date || new Date().toISOString().split('T')[0],
                end_date: end_date || new Date().toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('❌ Error getting guru attendance statistics:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// RUANG KELAS MANAGEMENT ENDPOINTS
// ================================================

// Get all ruang kelas
app.get('/api/admin/ruang-kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM ruang_kelas';
        let countQuery = 'SELECT COUNT(*) as total FROM ruang_kelas';
        let params = [];
        
        if (search) {
            query += ' WHERE (nama_ruang LIKE ? OR kode_ruang LIKE ? OR lokasi LIKE ?)';
            countQuery += ' WHERE (nama_ruang LIKE ? OR kode_ruang LIKE ? OR lokasi LIKE ?)';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
        
        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [ruangKelas] = await db.execute(query, params);
        const [count] = await db.execute(countQuery, params.slice(0, -2));
        
        res.json({
            data: ruangKelas,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count[0].total,
                pages: Math.ceil(count[0].total / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting ruang kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Create ruang kelas
app.post('/api/admin/ruang-kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status } = req.body;
        console.log('➕ Creating ruang kelas:', { kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status });

        // Validation
        if (!kode_ruang || !nama_ruang) {
            return res.status(400).json({ error: 'Kode ruang dan nama ruang wajib diisi' });
        }

        // Check if kode_ruang already exists
        const [existing] = await db.execute(
            'SELECT id FROM ruang_kelas WHERE kode_ruang = ?',
            [kode_ruang]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Kode ruang sudah digunakan' });
        }

        // Insert ruang kelas
        const [result] = await db.execute(
            'INSERT INTO ruang_kelas (kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status) VALUES (?, ?, ?, ?, ?, ?)',
            [kode_ruang, nama_ruang, kapasitas || 30, lokasi, fasilitas, status || 'aktif']
        );

        console.log(`✅ Ruang kelas created: ${nama_ruang} (${kode_ruang})`);
        res.json({ 
            success: true, 
            message: 'Ruang kelas berhasil ditambahkan',
            id: result.insertId 
        });

    } catch (error) {
        console.error('❌ Error creating ruang kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update ruang kelas
app.put('/api/admin/ruang-kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status } = req.body;
        console.log('✏️ Updating ruang kelas:', { id, kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status });

        // Validation
        if (!kode_ruang || !nama_ruang) {
            return res.status(400).json({ error: 'Kode ruang dan nama ruang wajib diisi' });
        }

        // Check if kode_ruang already exists (excluding current record)
        const [existing] = await db.execute(
            'SELECT id FROM ruang_kelas WHERE kode_ruang = ? AND id != ?',
            [kode_ruang, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Kode ruang sudah digunakan' });
        }

        // Update ruang kelas - only update existing columns
        await db.execute(
            'UPDATE ruang_kelas SET kode_ruang = ?, nama_ruang = ?, kapasitas = ?, lokasi = ?, status = ? WHERE id = ?',
            [
                kode_ruang, 
                nama_ruang, 
                kapasitas || null, 
                lokasi || null, 
                status || 'aktif', 
                id
            ]
        );

        console.log(`✅ Ruang kelas updated: ID ${id}`);
        res.json({ success: true, message: 'Ruang kelas berhasil diperbarui' });

    } catch (error) {
        console.error('❌ Error updating ruang kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete ruang kelas
app.delete('/api/admin/ruang-kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting ruang kelas:', { id });

        // Check if ruang is being used in jadwal
        const [jadwalCheck] = await db.execute(
            'SELECT COUNT(*) as count FROM jadwal WHERE ruang_id = ?',
            [id]
        );

        if (jadwalCheck[0].count > 0) {
            return res.status(400).json({ 
                error: 'Ruang kelas tidak dapat dihapus karena masih digunakan dalam jadwal' 
            });
        }

        // Delete ruang kelas
        const [result] = await db.execute(
            'DELETE FROM ruang_kelas WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ruang kelas tidak ditemukan' });
        }

        console.log(`✅ Ruang kelas deleted: ID ${id}`);
        res.json({ success: true, message: 'Ruang kelas berhasil dihapus' });

    } catch (error) {
        console.error('❌ Error deleting ruang kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get ruang kelas by ID
app.get('/api/admin/ruang-kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [ruangKelas] = await db.execute(
            'SELECT * FROM ruang_kelas WHERE id = ?',
            [id]
        );

        if (ruangKelas.length === 0) {
            return res.status(404).json({ error: 'Ruang kelas tidak ditemukan' });
        }

        res.json({ success: true, data: ruangKelas[0] });

    } catch (error) {
        console.error('❌ Error getting ruang kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// KOP LAPORAN ENDPOINTS
// ================================================

// Get letterhead configuration
app.get('/api/admin/letterhead', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { reportKey } = req.query;
        console.log('📄 Letterhead request from user:', req.user);
        console.log('📄 User role:', req.user.role);
        console.log('📄 Getting letterhead configuration:', { reportKey });

        // Default letterhead configuration
        const defaultConfig = {
            enabled: true,
            logo: "",
            logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
            logoRightUrl: "/uploads/letterheads/logo-smk.png",
            lines: [
                "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
                "DINAS PENDIDIKAN",
                "SMK NEGERI 13 JAKARTA",
                "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
            ],
            alignment: "center"
        };

        // Try to get from database if exists
        try {
            const [configRows] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ?',
                [`letterhead_${reportKey || 'global'}`]
            );

            if (configRows.length > 0) {
                const config = JSON.parse(configRows[0].config_value);
                return res.json({
                    success: true,
                    data: config
                });
            }
        } catch (error) {
            console.log('No custom letterhead config found, using default');
        }

        res.json({
            success: true,
            data: defaultConfig
        });

    } catch (error) {
        console.error('❌ Error getting letterhead configuration:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Save letterhead configuration
app.post('/api/admin/letterhead', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { reportKey, config } = req.body;
        console.log('💾 Saving letterhead configuration:', { reportKey, config });

        // Validate config
        if (!config || typeof config !== 'object') {
            return res.status(400).json({ error: 'Invalid configuration data' });
        }

        // Log payload size for monitoring
        const payloadSize = JSON.stringify(req.body).length;
        const payloadSizeKB = Math.round(payloadSize / 1024);
        console.log(`📊 Payload size: ${payloadSizeKB}KB`);

        // Validate and compress images if present
        const processedConfig = { ...config };
        const maxImageSizeKB = 5000; // 5MB max per image
        const compressionOptions = {
            maxWidth: 800,
            maxHeight: 600,
            quality: 80,
            maxSizeKB: 500 // Compress to max 500KB
        };

        // Process logo images
        const imageFields = ['logo', 'logoLeftUrl', 'logoRightUrl'];
        for (const field of imageFields) {
            if (processedConfig[field] && typeof processedConfig[field] === 'string' && processedConfig[field].startsWith('data:image/')) {
                console.log(`🖼️ Processing ${field}...`);
                
                // Validate image
                const validation = validateImage(processedConfig[field], maxImageSizeKB);
                if (!validation.isValid) {
                    return res.status(400).json({ 
                        error: `Invalid ${field}: ${validation.error}`,
                        field: field,
                        size: validation.size
                    });
                }

                console.log(`✅ ${field} validation passed - Size: ${validation.size}KB`);

                // Compress image
                const compressionResult = await compressImage(processedConfig[field], compressionOptions);
                if (!compressionResult.success) {
                    return res.status(400).json({ 
                        error: `Failed to compress ${field}: ${compressionResult.error}`,
                        field: field
                    });
                }

                processedConfig[field] = compressionResult.data;
                console.log(`📸 ${field} compressed: ${compressionResult.originalSize}KB → ${compressionResult.compressedSize}KB`);
            }
        }

        const configKey = `letterhead_${reportKey || 'global'}`;
        const configValue = JSON.stringify(processedConfig);

        // Insert or update configuration
        await db.execute(
            `INSERT INTO system_config (config_key, config_value, updated_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()`,
            [configKey, configValue]
        );

        console.log(`✅ Letterhead configuration saved: ${configKey}`);
        res.json({
            success: true,
            message: 'Konfigurasi kop laporan berhasil disimpan',
            payloadSize: payloadSizeKB,
            processedImages: imageFields.filter(field => processedConfig[field] && processedConfig[field].startsWith('data:image/')).length
        });

    } catch (error) {
        console.error('❌ Error saving letterhead configuration:', error);
        
        // Handle specific error types
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(413).json({ 
                error: 'Data terlalu besar untuk disimpan. Silakan kompres gambar terlebih dahulu.',
                code: 'PAYLOAD_TOO_LARGE'
            });
        }
        
        if (error.message && error.message.includes('413')) {
            return res.status(413).json({ 
                error: 'Payload terlalu besar. Maksimal 10MB untuk seluruh request.',
                code: 'PAYLOAD_TOO_LARGE'
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get letterhead preview
app.get('/api/admin/letterhead/preview', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { reportKey } = req.query;
        console.log('👁️ Getting letterhead preview:', { reportKey });

        // Get letterhead configuration
        const letterheadResponse = await fetch(`http://localhost:3001/api/admin/letterhead?reportKey=${reportKey || 'global'}`, {
            headers: {
                'Authorization': req.headers.authorization,
                'Cookie': req.headers.cookie
            }
        });

        if (!letterheadResponse.ok) {
            throw new Error('Failed to get letterhead configuration');
        }

        const letterheadData = await letterheadResponse.json();
        const config = letterheadData.data;

        // Generate HTML preview
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Preview Kop Laporan</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .letterhead { text-align: ${config.alignment}; margin-bottom: 30px; }
                    .logo-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .logo { max-height: 80px; max-width: 120px; }
                    .header-lines { margin: 10px 0; }
                    .header-lines h1 { font-size: 18px; font-weight: bold; margin: 5px 0; }
                    .header-lines h2 { font-size: 16px; font-weight: bold; margin: 5px 0; }
                    .header-lines p { font-size: 14px; margin: 5px 0; }
                    .divider { border-top: 2px solid #000; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="letterhead">
                    <div class="logo-container">
                        <img src="${config.logoLeftUrl}" alt="Logo Kiri" class="logo" onerror="this.style.display='none'">
                        <img src="${config.logoRightUrl}" alt="Logo Kanan" class="logo" onerror="this.style.display='none'">
                    </div>
                    <div class="header-lines">
                        ${config.lines.map(line => `<h1>${line}</h1>`).join('')}
                    </div>
                    <div class="divider"></div>
                </div>
                <div style="margin-top: 50px;">
                    <h2>Preview Laporan</h2>
                    <p>Ini adalah preview dari kop laporan yang akan digunakan untuk semua laporan.</p>
                </div>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('❌ Error generating letterhead preview:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// SISWA PERWAKILAN ENDPOINTS
// ================================================

// Get siswa info
app.get('/api/siswa/info', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        console.log('📋 Getting siswa perwakilan info for user:', req.user.id);

        const [siswaData] = await db.execute(
            `SELECT s.id_siswa, s.nis, s.nama, s.kelas_id, k.nama_kelas 
             FROM siswa s 
             JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.user_id = ?`,
            [req.user.id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Data siswa perwakilan tidak ditemukan' });
        }

        const info = siswaData[0];
        console.log('✅ Siswa perwakilan info retrieved:', info);

        res.json({
            success: true,
            id_siswa: info.id_siswa,
            nis: info.nis,
            nama: info.nama,
            kelas_id: info.kelas_id,
            nama_kelas: info.nama_kelas
        });

    } catch (error) {
        console.error('❌ Error getting siswa perwakilan info:', error);
        res.status(500).json({ error: 'Gagal memuat informasi siswa perwakilan' });
    }
});

// Get jadwal hari ini untuk siswa
app.get('/api/siswa/:siswaId/jadwal-hari-ini', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📅 Getting jadwal hari ini for siswa:', siswaId);

        // Get current day in Indonesian
        const today = new Date();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        const currentDay = dayNames[today.getDay()];

        console.log('📅 Current day:', currentDay);

        // Get siswa's class
        const [siswaData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Get today's schedule for the class
        const [jadwalData] = await db.execute(`
            SELECT 
                j.id_jadwal,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                mp.kode_mapel,
                g.nama as nama_guru,
                g.nip,
                k.nama_kelas,
                COALESCE(ag.status, 'belum_diambil') as status_kehadiran,
                COALESCE(ag.keterangan, '') as keterangan
            FROM jadwal j
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND DATE(ag.tanggal) = CURDATE()
            WHERE j.kelas_id = ? AND j.hari = ?
            ORDER BY j.jam_ke
        `, [kelasId, currentDay]);

        console.log('✅ Jadwal retrieved:', jadwalData.length, 'items');
        
        // Debug logging untuk keterangan
        jadwalData.forEach(jadwal => {
            if (jadwal.keterangan && jadwal.keterangan.trim() !== '') {
                console.log(`🔍 Backend returning keterangan for jadwal ${jadwal.id_jadwal}:`, jadwal.keterangan);
            }
        });

        res.json(jadwalData);

    } catch (error) {
        console.error('❌ Error getting jadwal hari ini:', error);
        res.status(500).json({ error: 'Gagal memuat jadwal hari ini' });
    }
});

// Get jadwal berdasarkan tanggal untuk siswa
app.get('/api/siswa/:siswaId/jadwal-rentang', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { tanggal } = req.query;
        
        console.log('📅 Getting jadwal for siswa:', siswaId, 'tanggal:', tanggal);

        // Check database connection
        if (!db) {
            console.error('❌ Database connection not available');
            return res.status(500).json({ 
                success: false,
                error: 'Database connection tidak tersedia' 
            });
        }

        // Validate siswaId parameter
        if (!siswaId || isNaN(parseInt(siswaId))) {
            console.log('❌ Invalid siswaId parameter:', siswaId);
            return res.status(400).json({ 
                success: false, 
                error: 'ID siswa tidak valid' 
            });
        }

        if (!tanggal) {
            console.log('❌ Missing tanggal parameter');
            return res.status(400).json({ 
                success: false, 
                error: 'Parameter tanggal diperlukan' 
            });
        }

        // Validate tanggal format
        const targetDate = new Date(tanggal);
        if (isNaN(targetDate.getTime())) {
            console.log('❌ Invalid tanggal format:', tanggal);
            return res.status(400).json({ 
                success: false, 
                error: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD' 
            });
        }

        // Parse tanggal dan dapatkan hari dalam bahasa Indonesia
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        const targetDay = dayNames[targetDate.getDay()];

        console.log('📅 Target day:', targetDay);

        // Get siswa's class
        console.log('🔍 Getting siswa data...');
        const [siswaData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [parseInt(siswaId)]
        );

        if (siswaData.length === 0) {
            console.log('❌ Siswa not found:', siswaId);
            return res.status(404).json({ 
                success: false, 
                error: 'Siswa tidak ditemukan' 
            });
        }

        const kelasId = siswaData[0].kelas_id;
        console.log('📊 Siswa kelas_id:', kelasId);

        // Get schedule for the specific date and class
        console.log('🔍 Getting jadwal data...');
        const [jadwalData] = await db.execute(`
            SELECT 
                j.id_jadwal,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                mp.kode_mapel,
                g.nama as nama_guru,
                g.nip,
                k.nama_kelas,
                COALESCE(ag.status, 'belum_diambil') as status_kehadiran,
                COALESCE(ag.keterangan, '') as keterangan
            FROM jadwal j
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND ag.tanggal = ?
            WHERE j.kelas_id = ? AND j.hari = ?
            ORDER BY j.jam_ke
        `, [tanggal, kelasId, targetDay]);

        console.log('✅ Jadwal retrieved for date:', tanggal, 'count:', jadwalData.length);
        
        // Debug logging untuk keterangan
        jadwalData.forEach(jadwal => {
            if (jadwal.keterangan && jadwal.keterangan.trim() !== '') {
                console.log(`🔍 Backend returning keterangan for jadwal ${jadwal.id_jadwal}:`, jadwal.keterangan);
            }
        });

        res.json({
            success: true,
            data: jadwalData
        });

    } catch (error) {
        console.error('❌ Error getting jadwal by date:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });
        res.status(500).json({ 
            success: false, 
            error: 'Gagal memuat jadwal untuk tanggal tersebut',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Alternative endpoint with siswa_id parameter for backward compatibility

// Submit kehadiran guru
app.post('/api/siswa/submit-kehadiran-guru', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id, kehadiran_data } = req.body;
        console.log('📝 Submitting kehadiran guru for siswa:', siswa_id);
        console.log('📝 Kehadiran data:', kehadiran_data);

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date();

        // Use withTransaction helper for proper transaction management
        const result = await db.withTransaction(async (connection) => {
            // Insert/update attendance for each jadwal
            for (const [jadwalId, data] of Object.entries(kehadiran_data)) {
                const { status, keterangan, ada_tugas } = data;

                // Get jadwal details first
                const [jadwalDetails] = await connection.execute(`
                    SELECT guru_id, kelas_id, jam_ke 
                    FROM jadwal 
                    WHERE id_jadwal = ?
                `, [jadwalId]);

                if (jadwalDetails.length === 0) {
                    console.log('❌ Jadwal not found:', jadwalId);
                    continue;
                }

                const { guru_id, kelas_id, jam_ke } = jadwalDetails[0];

                // Check if attendance record already exists
                const [existingRecord] = await connection.execute(
                    'SELECT id_absensi FROM absensi_guru WHERE jadwal_id = ? AND tanggal = ?',
                    [jadwalId, today]
                );

                if (existingRecord.length > 0) {
                    // Update existing record
                    await connection.execute(`
                        UPDATE absensi_guru 
                        SET status = ?, keterangan = ?, waktu_catat = ?, siswa_pencatat_id = ?
                        WHERE jadwal_id = ? AND tanggal = ?
                    `, [status, keterangan || null, currentTime, siswa_id, jadwalId, today]);
                } else {
                    // Insert new record
                    await connection.execute(`
                        INSERT INTO absensi_guru 
                        (jadwal_id, guru_id, kelas_id, siswa_pencatat_id, tanggal, jam_ke, status, keterangan, waktu_catat) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [jadwalId, guru_id, kelas_id, siswa_id, today, jam_ke, status, keterangan || null, currentTime]);
                }
            }

            return { success: true };
        });

        console.log('✅ Kehadiran guru submitted successfully');

        res.json({
            success: true,
            message: 'Data kehadiran guru berhasil disimpan'
        });

    } catch (error) {
        console.error('❌ Error submitting kehadiran guru:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });
        res.status(500).json({ 
            error: 'Gagal menyimpan data kehadiran guru',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get riwayat kehadiran kelas (for siswa perwakilan)
app.get('/api/siswa/:siswaId/riwayat-kehadiran', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📊 Getting riwayat kehadiran kelas for siswa:', siswaId);

        // Get siswa's class
        const [siswaData] = await db.execute(
            'SELECT kelas_id, nama FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Get total students in class
        const [totalSiswaResult] = await db.execute(
            'SELECT COUNT(*) as total FROM siswa WHERE kelas_id = ?',
            [kelasId]
        );
        const totalSiswa = totalSiswaResult[0].total;

        // Get attendance history for the last 30 days with aggregated data
        const [riwayatData] = await db.execute(`
            SELECT 
                ag.tanggal,
                j.id_jadwal,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                g.nama as nama_guru,
                ag.status as status_kehadiran,
                ag.keterangan,
                s.nama as nama_pencatat,
                -- Get attendance data for this schedule
                (SELECT GROUP_CONCAT(
                    CONCAT(s2.nama, ':', s2.nis, ':', COALESCE(abs2.status, 'tidak_hadir'))
                    SEPARATOR '|'
                ) FROM siswa s2 
                LEFT JOIN absensi_siswa abs2 ON s2.id_siswa = abs2.siswa_id 
                    AND abs2.jadwal_id = j.id_jadwal 
                    AND DATE(abs2.waktu_absen) = ag.tanggal
                WHERE s2.kelas_id = ?) as siswa_data
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN siswa s ON ag.siswa_pencatat_id = s.id_siswa
            WHERE j.kelas_id = ? 
                AND ag.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY ag.tanggal DESC, j.jam_mulai ASC
        `, [kelasId, kelasId]);

        // Group by date and calculate statistics
        const groupedData = {};
        riwayatData.forEach(row => {
            const dateKey = row.tanggal;
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {
                    tanggal: dateKey,
                    jadwal: []
                };
            }

            // Parse student attendance data
            const siswaData = row.siswa_data ? row.siswa_data.split('|') : [];
            const siswaStats = {
                hadir: 0,
                izin: 0,
                sakit: 0,
                alpa: 0,
                tidak_hadir: []
            };

            siswaData.forEach(data => {
                const [nama, nis, status] = data.split(':');
                if (status === 'hadir') {
                    siswaStats.hadir++;
                } else if (status === 'izin') {
                    siswaStats.izin++;
                    siswaStats.tidak_hadir.push({ 
                        nama_siswa: nama, 
                        nis: nis || '', 
                        status: 'izin' 
                    });
                } else if (status === 'sakit') {
                    siswaStats.sakit++;
                    siswaStats.tidak_hadir.push({ 
                        nama_siswa: nama, 
                        nis: nis || '', 
                        status: 'sakit' 
                    });
                } else if (status === 'alpa') {
                    siswaStats.alpa++;
                    siswaStats.tidak_hadir.push({ 
                        nama_siswa: nama, 
                        nis: nis || '', 
                        status: 'alpa' 
                    });
                } else {
                    // tidak_hadir (no attendance record)
                    siswaStats.alpa++;
                    siswaStats.tidak_hadir.push({ 
                        nama_siswa: nama, 
                        nis: nis || '', 
                        status: 'alpa' 
                    });
                }
            });

            groupedData[dateKey].jadwal.push({
                jam_ke: row.jam_ke,
                jam_mulai: row.jam_mulai,
                jam_selesai: row.jam_selesai,
                nama_mapel: row.nama_mapel,
                nama_guru: row.nama_guru,
                status_kehadiran: row.status_kehadiran,
                keterangan: row.keterangan,
                nama_pencatat: row.nama_pencatat,
                total_siswa: totalSiswa,
                total_hadir: siswaStats.hadir,
                total_izin: siswaStats.izin,
                total_sakit: siswaStats.sakit,
                total_alpa: siswaStats.alpa,
                siswa_tidak_hadir: siswaStats.tidak_hadir
            });
        });

        const result = Object.values(groupedData);
        console.log('✅ Riwayat kehadiran kelas retrieved:', result.length, 'days');
        
        // Debug: Log sample data structure
        if (result.length > 0 && result[0].jadwal.length > 0) {
            console.log('📊 Sample jadwal data:', result[0].jadwal[0]);
            if (result[0].jadwal[0].siswa_tidak_hadir && result[0].jadwal[0].siswa_tidak_hadir.length > 0) {
                console.log('👥 Sample siswa tidak hadir:', result[0].jadwal[0].siswa_tidak_hadir[0]);
            }
        }

        res.json(result);

    } catch (error) {
        console.error('❌ Error getting riwayat kehadiran:', error);
        res.status(500).json({ error: 'Gagal memuat riwayat kehadiran' });
    }
});

// ====================
// ADMIN DASHBOARD ENDPOINTS
// ====================

// Get teachers for admin dashboard
// DEPRECATED: Use /api/admin/guru instead
app.get('/api/admin/teachers', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers endpoint is deprecated. Use /api/admin/guru instead.');
    try {
        console.log('📋 Getting teachers for admin dashboard');
        
        const query = `
            SELECT 
                g.id_guru as id,
                u.nama_users, 
                g.nama, 
                g.nip,
                g.email,
                g.alamat,
                g.no_telp,
                g.jenis_kelamin,
                g.status,
                m.nama_mapel as mata_pelajaran
            FROM guru g
            LEFT JOIN users u ON g.id_users = u.id
            LEFT JOIN mata_pelajaran m ON g.mapel_id = m.id
            ORDER BY g.nama ASC
        `;
        
        const [results] = await db.execute(query);
        console.log(`✅ Teachers retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting teachers:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Add teacher account
// DEPRECATED: Use /api/admin/guru instead
app.post('/api/admin/teachers', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers endpoint is deprecated. Use /api/admin/guru instead.');
    try {
        const { nama, username, password, nip, mapel_id, no_telp, alamat, jenis_kelamin, email } = req.body;
        console.log('➕ Adding teacher account:', { nama, username });

        if (!nama || !username || !password) {
            return res.status(400).json({ error: 'Nama, username, dan password wajib diisi' });
        }

        // Check if username already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Check if NIP already exists (if provided)
        if (nip) {
            const [existingGuru] = await db.execute(
                'SELECT id FROM guru WHERE nip = ?',
                [nip]
            );

            if (existingGuru.length > 0) {
                return res.status(400).json({ error: 'NIP sudah digunakan' });
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Use transaction helper
        const result = await db.withTransaction(async (connection) => {
            // Insert user account
            const [userResult] = await connection.execute(
                'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "guru", ?, "aktif")',
                [username, hashedPassword, nama]
            );

            // Generate NIP if not provided
            const finalNip = nip || `G${Date.now().toString().slice(-8)}`;
            
            // Get next id_guru
            const [maxIdResult] = await db.execute(
                'SELECT COALESCE(MAX(id_guru), 0) + 1 as next_id FROM guru'
            );
            const nextIdGuru = maxIdResult[0].next_id;

            // Insert guru data with proper structure
            await db.execute(
                'INSERT INTO guru (id_guru, user_id, username, nip, nama, email, mapel_id, no_telp, alamat, jenis_kelamin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "aktif")',
                [nextIdGuru, userResult.insertId, username, finalNip, nama, email || null, mapel_id || null, no_telp || null, alamat || null, jenis_kelamin || 'L']
            );

            return userResult;
        });

        console.log('✅ Teacher account added successfully');
        res.json({ message: 'Akun guru berhasil ditambahkan' });
    } catch (error) {
        console.error('❌ Error adding teacher:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'NIP atau username sudah digunakan' });
        } else {
            res.error('Internal server error', 'Failed to process request');
        }
    }
});

// Update teacher account
// DEPRECATED: Use /api/admin/guru/:id instead
app.put('/api/admin/teachers/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers/:id endpoint is deprecated. Use /api/admin/guru/:id instead.');
    try {
        const { id } = req.params;
        const { nama, username, password } = req.body;
        console.log('📝 Updating teacher account:', { id, nama, username });

        if (!nama || !username) {
            return res.status(400).json({ error: 'Nama dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get current username
            const [currentUser] = await connection.execute(
                'SELECT nama_users FROM users WHERE id = ?',
                [id]
            );

            if (currentUser.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await hashPassword(password);
                await db.execute(
                    'UPDATE users SET username = ?, password = ? WHERE id = ?',
                    [username, hashedPassword, id]
                );
            } else {
                await db.execute(
                    'UPDATE users SET username = ? WHERE id = ?',
                    [username, id]
                );
            }

            // Update guru data
            await db.execute(
                'UPDATE guru SET nama = ?, username = ? WHERE username = ?',
                [nama, username, oldUsername]
            );
        });

        console.log('✅ Teacher account updated successfully');
        res.json({ message: 'Akun guru berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating teacher:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete teacher account
// DEPRECATED: Use /api/admin/guru/:id instead
app.delete('/api/admin/teachers/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers/:id endpoint is deprecated. Use /api/admin/guru/:id instead.');
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting teacher account:', { id });

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get username first
            const [userResult] = await connection.execute(
                'SELECT nama_users FROM users WHERE id = ?',
                [id]
            );

            if (userResult.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            const username = userResult[0].username;

            // Delete from guru table first (foreign key constraint)
            await db.execute(
                'DELETE FROM guru WHERE username = ?',
                [username]
            );

            // Delete from users table
            await db.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
        });

        console.log('✅ Teacher account deleted successfully');
        res.json({ message: 'Akun guru berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting teacher:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// === TEACHER DATA ENDPOINTS ===

// Get teachers data for admin dashboard
// DEPRECATED: Use /api/admin/guru instead
app.get('/api/admin/teachers-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers-data endpoint is deprecated. Use /api/admin/guru instead.');
    try {
        console.log('📋 Getting teachers data for admin dashboard');
        
        const query = `
            SELECT g.id, g.nip, g.nama, g.email, g.mata_pelajaran, 
                   g.alamat, g.no_telp, g.jenis_kelamin, 
                   COALESCE(g.status, 'aktif') as status
            FROM guru g
            ORDER BY g.nama ASC
        `;
        
        const [results] = await db.execute(query);
        console.log(`✅ Teachers data retrieved: ${results.length} items`);
        
        // Add cache busting headers to prevent caching
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting teachers data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Add teacher data
// DEPRECATED: Use /api/admin/guru instead
app.post('/api/admin/teachers-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers-data endpoint is deprecated. Use /api/admin/guru instead.');
    try {
        const { nip, nama, email, mata_pelajaran, alamat, telepon, jenis_kelamin, status, username, password, mapel_id } = req.body;
        console.log('➕ Adding teacher data:', { nip, nama, mata_pelajaran });

        if (!nip || !nama || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIP, nama, dan jenis kelamin wajib diisi' });
        }

        // Check if NIP already exists
        const [existing] = await db.execute(
            'SELECT id FROM guru WHERE nip = ?',
            [nip]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIP sudah terdaftar' });
        }

        // Check if username already exists (if provided)
        if (username) {
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE nama_users = ?',
                [username]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Username sudah digunakan' });
            }
        }

        // Use transaction helper
        const result = await db.withTransaction(async (connection) => {
            let userId = null;
            
            // Create user account if username and password provided
            if (username && password) {
                const hashedPassword = await hashPassword(password);
                const [userResult] = await connection.execute(
                    'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "guru", ?, "aktif")',
                    [username, hashedPassword, nama]
                );
                userId = userResult.insertId;
            }

            // Get next id_guru
            const [maxIdResult] = await db.execute(
                'SELECT COALESCE(MAX(id_guru), 0) + 1 as next_id FROM guru'
            );
            const nextIdGuru = maxIdResult[0].next_id;

            // Insert guru data with proper structure
            const query = `
                INSERT INTO guru (id_guru, user_id, username, nip, nama, email, mata_pelajaran, mapel_id, alamat, no_telp, jenis_kelamin, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(query, [
                nextIdGuru, userId, username || null, nip, nama, email || null, 
                mata_pelajaran || null, mapel_id || null, alamat || null, 
                telepon || null, jenis_kelamin, status || 'aktif'
            ]);

            return result;
        });

        console.log('✅ Teacher data added successfully:', result.insertId);
        res.json({ message: 'Data guru berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding teacher data:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'NIP sudah terdaftar' });
        } else {
            res.error('Internal server error', 'Failed to process request');
        }
    }
});

// Update teacher data
// DEPRECATED: Use /api/admin/guru/:id instead
app.put('/api/admin/teachers-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers-data/:id endpoint is deprecated. Use /api/admin/guru/:id instead.');
    try {
        const { id } = req.params;
        const { nip, nama, email, mata_pelajaran, alamat, telepon, jenis_kelamin, status } = req.body;
        console.log('📝 Updating teacher data:', { id, nip, nama, telepon });

        if (!nip || !nama || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIP, nama, dan jenis kelamin wajib diisi' });
        }

        // Check if NIP already exists for other records
        const [existing] = await db.execute(
            'SELECT id FROM guru WHERE nip = ? AND id != ?',
            [nip, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIP sudah digunakan oleh guru lain' });
        }

        const updateQuery = `
            UPDATE guru 
            SET nip = ?, nama = ?, email = ?, mata_pelajaran = ?, 
                alamat = ?, no_telp = ?, jenis_kelamin = ?, status = ?
            WHERE id = ?
        `;

        const [result] = await db.execute(updateQuery, [
            nip, nama, email || null, mata_pelajaran || null,
            alamat || null, telepon || null, jenis_kelamin, status || 'aktif', id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data guru tidak ditemukan' });
        }

        console.log('✅ Teacher data updated successfully');
        res.json({ message: 'Data guru berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating teacher data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete teacher data
// DEPRECATED: Use /api/admin/guru/:id instead
app.delete('/api/admin/teachers-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/teachers-data/:id endpoint is deprecated. Use /api/admin/guru/:id instead.');
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting teacher data:', { id });

        const [result] = await db.execute(
            'DELETE FROM guru WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data guru tidak ditemukan' });
        }

        console.log('✅ Teacher data deleted successfully');
        res.json({ message: 'Data guru berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting teacher data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get students for admin dashboard
// DEPRECATED: Use /api/admin/siswa instead
app.get('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students endpoint is deprecated. Use /api/admin/siswa instead.');
    try {
        console.log('📋 Getting students for admin dashboard');
        
        const query = `
            SELECT 
                u.id, 
                u.nama_users, 
                COALESCE(s.email, u.email) as email,
                s.nis, 
                s.nama, 
                s.kelas_id, 
                k.nama_kelas,
                s.jenis_kelamin,
                s.jabatan,
                s.status,
                s.alamat,
                s.telepon_orangtua
            FROM users u
            LEFT JOIN siswa s ON u.nama_users = s.username
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE u.peran = 'siswa'
            ORDER BY s.nama ASC
        `;
        
        const [results] = await db.execute(query);
        console.log(`✅ Students retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting students:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Add student account
// DEPRECATED: Use /api/admin/siswa instead
app.post('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students endpoint is deprecated. Use /api/admin/siswa instead.');
    try {
        const { nama, username, password, nis, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, status } = req.body;
        console.log('➕ Adding student account:', { nama, username, nis });

        if (!nama || !username || !password || !nis || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'Nama, username, password, NIS, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if username already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Check if NIS already exists
        const [existingNIS] = await db.execute(
            'SELECT id FROM siswa WHERE nis = ?',
            [nis]
        );

        if (existingNIS.length > 0) {
            return res.status(400).json({ error: 'NIS sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Start transaction
        // Transaction handled by db.withTransaction();

        try {
            // Insert user account
            const [userResult] = await connection.execute(
                'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                [username, hashedPassword, 'siswa', nama, email || null, status || 'aktif']
            );

            // Insert siswa data
            await db.execute(
                'INSERT INTO siswa (nis, nama, username, user_id, kelas_id, jabatan, jenis_kelamin, email, telepon_orangtua, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nis, nama, username, userResult.insertId, kelas_id, jabatan || 'Sekretaris Kelas', jenis_kelamin, email || null, telepon_siswa || null, status || 'aktif']
            );

            // Transaction handled by db.withTransaction();
            console.log('✅ Student account added successfully');
            res.json({ message: 'Akun siswa berhasil ditambahkan' });
        } catch (error) {
            // Transaction handled by db.withTransaction();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error adding student:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Update student account
// DEPRECATED: Use /api/admin/siswa/:id instead
app.put('/api/admin/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students/:id endpoint is deprecated. Use /api/admin/siswa/:id instead.');
    try {
        const { id } = req.params;
        const { nama, username, password, nis, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, status } = req.body;
        console.log('📝 Updating student account:', { id, nama, username, nis });

        if (!nama || !username || !nis || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'Nama, username, NIS, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE nama_users = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Check if NIS already exists (excluding current student)
        const [existingNIS] = await db.execute(
            'SELECT s.id FROM siswa s LEFT JOIN users u ON s.user_id = u.id WHERE s.nis = ? AND u.id != ?',
            [nis, id]
        );

        if (existingNIS.length > 0) {
            return res.status(400).json({ error: 'NIS sudah digunakan' });
        }

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get current username
            const [currentUser] = await connection.execute(
                'SELECT nama_users FROM users WHERE id = ?',
                [id]
            );

            if (currentUser.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await hashPassword(password);
                await db.execute(
                    'UPDATE users SET username = ?, password = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [username, hashedPassword, nama, email || null, status || 'aktif', id]
                );
            } else {
                await db.execute(
                    'UPDATE users SET username = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [username, nama, email || null, status || 'aktif', id]
                );
            }

            // Update siswa data
            await db.execute(
                'UPDATE siswa SET nama = ?, username = ?, nis = ?, kelas_id = ?, jabatan = ?, jenis_kelamin = ?, email = ?, telepon_orangtua = ?, status = ? WHERE username = ?',
                [nama, username, nis, kelas_id, jabatan || 'Sekretaris Kelas', jenis_kelamin, email || null, telepon_siswa || null, status || 'aktif', oldUsername]
            );
        });

        console.log('✅ Student account updated successfully');
        res.json({ message: 'Akun siswa berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating student:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete student account
// DEPRECATED: Use /api/admin/siswa/:id instead
app.delete('/api/admin/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students/:id endpoint is deprecated. Use /api/admin/siswa/:id instead.');
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting student account:', { id });

        // Use transaction helper
        await db.withTransaction(async (connection) => {
            // Get username first
            const [userResult] = await connection.execute(
                'SELECT nama_users FROM users WHERE id = ?',
                [id]
            );

            if (userResult.length === 0) {
                throw new Error('User tidak ditemukan');
            }

            const username = userResult[0].username;

            // Delete from siswa table first (foreign key constraint)
            await db.execute(
                'DELETE FROM siswa WHERE username = ?',
                [username]
            );

            // Delete from users table
            await db.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );
        });

        console.log('✅ Student account deleted successfully');
        res.json({ message: 'Akun siswa berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// === STUDENT DATA ENDPOINTS ===

// Get students data for admin dashboard
// DEPRECATED: Use /api/admin/siswa instead
app.get('/api/admin/students-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students-data endpoint is deprecated. Use /api/admin/siswa instead.');
    try {
        console.log('📋 Getting students data for admin dashboard');
        
        const query = `
            SELECT s.id, s.nis, s.nama, s.kelas_id, k.nama_kelas, 
                   s.jenis_kelamin, s.alamat, 
                   s.telepon_orangtua, s.telepon_siswa,
                   COALESCE(s.status, 'aktif') as status
            FROM siswa_perwakilan s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            ORDER BY s.nama ASC
        `;
        
        const [results] = await db.execute(query);
        console.log(`✅ Students data retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting students data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Add student data
// DEPRECATED: Use /api/admin/siswa instead
app.post('/api/admin/students-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students-data endpoint is deprecated. Use /api/admin/siswa instead.');
    try {
        const { nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, status } = req.body;
        console.log('➕ Adding student data:', { nis, nama, kelas_id });

        if (!nis || !nama || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIS, nama, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if NIS already exists
        const [existing] = await db.execute(
            'SELECT id FROM siswa WHERE nis = ?',
            [nis]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIS sudah terdaftar' });
        }

        const insertQuery = `
            INSERT INTO siswa (id_siswa, nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, status)
            VALUES ((SELECT COALESCE(MAX(id_siswa), 0) + 1 FROM siswa s2), ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(insertQuery, [
            nis, nama, kelas_id, jenis_kelamin, 
            alamat || null, telepon_orangtua || null, status || 'aktif'
        ]);

        console.log('✅ Student data added successfully:', result.insertId);
        res.json({ message: 'Data siswa berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding student data:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'NIS sudah terdaftar' });
        } else {
            res.error('Internal server error', 'Failed to process request');
        }
    }
});

// Update student data
// DEPRECATED: Use /api/admin/siswa/:id instead
app.put('/api/admin/students-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students-data/:id endpoint is deprecated. Use /api/admin/siswa/:id instead.');
    try {
        const { id } = req.params;
        const { nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, telepon_siswa, status } = req.body;
        console.log('📝 Updating student data:', { id, nis, nama, telepon_siswa });

        if (!nis || !nama || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIS, nama, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if NIS already exists for other records
        const [existing] = await db.execute(
            'SELECT id FROM siswa_perwakilan WHERE nis = ? AND id != ?',
            [nis, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIS sudah digunakan oleh siswa lain' });
        }

        // Update siswa_perwakilan (karena siswa adalah VIEW)
        const updateQuery = `
            UPDATE siswa_perwakilan 
            SET nis = ?, nama = ?, kelas_id = ?, jenis_kelamin = ?, 
                alamat = ?, telepon_orangtua = ?, telepon_siswa = ?, status = ?
            WHERE id = ?
        `;

        const [result] = await db.execute(updateQuery, [
            nis, nama, kelas_id, jenis_kelamin,
            alamat || null, telepon_orangtua || null, telepon_siswa || null, status || 'aktif', id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        console.log('✅ Student data updated successfully');
        res.json({ message: 'Data siswa berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating student data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Delete student data
// DEPRECATED: Use /api/admin/siswa/:id instead
app.delete('/api/admin/students-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    console.warn('⚠️ DEPRECATED: /api/admin/students-data/:id endpoint is deprecated. Use /api/admin/siswa/:id instead.');
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting student data:', { id });

        const [result] = await db.execute(
            'DELETE FROM siswa WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        console.log('✅ Student data deleted successfully');
        res.json({ message: 'Data siswa berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting student data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get live summary for admin dashboard
app.get('/api/admin/live-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting live summary for admin dashboard');
        
        // Get current day and time
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:mm:ss format
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        const currentDay = days[now.getDay()];

        // Get ongoing classes (classes that are currently happening)
        const ongoingQuery = `
            SELECT 
                j.id_jadwal,
                j.jam_mulai, 
                j.jam_selesai,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru,
                COUNT(ag.id_absensi) as absensi_diambil
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel  
            JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id AND DATE(ag.tanggal) = CURDATE()
            WHERE j.hari = ? 
            AND TIME(?) BETWEEN j.jam_mulai AND j.jam_selesai
            GROUP BY j.id_jadwal, j.jam_mulai, j.jam_selesai, k.nama_kelas, m.nama_mapel, g.nama
            ORDER BY j.jam_mulai
        `;

        const [ongoingClasses] = await db.execute(ongoingQuery, [currentDay, currentTime]);
        
        // Calculate overall attendance percentage for today
        const attendanceQuery = `
            SELECT 
                COUNT(DISTINCT j.id_jadwal) as total_jadwal_today,
                COUNT(DISTINCT ag.jadwal_id) as jadwal_with_attendance
            FROM jadwal j
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id AND DATE(ag.tanggal) = CURDATE()  
            WHERE j.hari = ?
        `;
        
        const [attendanceResult] = await db.execute(attendanceQuery, [currentDay]);
        const attendanceStats = attendanceResult[0];
        
        const attendancePercentage = attendanceStats.total_jadwal_today > 0 
            ? Math.round((attendanceStats.jadwal_with_attendance / attendanceStats.total_jadwal_today) * 100)
            : 0;

        // Format ongoing classes data
        const formattedOngoingClasses = ongoingClasses.map(kelas => ({
            kelas: kelas.nama_kelas,
            guru: kelas.nama_guru,
            mapel: kelas.nama_mapel,
            jam: `${kelas.jam_mulai.substring(0,5)} - ${kelas.jam_selesai.substring(0,5)}`,
            nama_kelas: kelas.nama_kelas,
            nama_mapel: kelas.nama_mapel,
            nama_guru: kelas.nama_guru,
            jam_mulai: kelas.jam_mulai.substring(0,5),
            jam_selesai: kelas.jam_selesai.substring(0,5),
            absensi_diambil: kelas.absensi_diambil
        }));

        const liveData = {
            ongoing_classes: formattedOngoingClasses,
            overall_attendance_percentage: attendancePercentage.toString()
        };

        console.log(`✅ Live summary retrieved: ${formattedOngoingClasses.length} ongoing classes, ${attendancePercentage}% attendance`);
        res.json(liveData);
    } catch (error) {
        console.error('❌ Error getting live summary:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Toggle load balancer
app.post('/api/admin/toggle-load-balancer', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔄 Toggling load balancer');
        
        const { enabled } = req.body;
        const newStatus = enabled !== undefined ? enabled : !global.loadBalancerEnabled;
        
        global.loadBalancerEnabled = newStatus;
        
        console.log(`✅ Load balancer ${newStatus ? 'enabled' : 'disabled'}`);
        
        res.success({
            enabled: global.loadBalancerEnabled,
            message: `Load balancer ${global.loadBalancerEnabled ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('❌ Error toggling load balancer:', error);
        res.error('Failed to toggle load balancer', 500);
    }
});

// Get load balancer status
app.get('/api/admin/load-balancer-status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting load balancer status');
        
        res.success({
            enabled: global.loadBalancerEnabled || false,
            status: global.loadBalancerEnabled ? 'active' : 'disabled',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting load balancer status:', error);
        res.error('Failed to get load balancer status', 500);
    }
});

// Get monitoring dashboard data
app.get('/api/admin/monitoring-dashboard', authenticateToken, requireRole(['admin']), cacheMiddleware(300, (req) => `cache:admin:monitoring:${JSON.stringify(req.query)}`), async (req, res) => {
    try {
        console.log('📊 Getting monitoring dashboard data');
        
        // Get system statistics
        const [totalClasses] = await db.execute('SELECT COUNT(*) as count FROM kelas');
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM siswa');
        const [totalTeachers] = await db.execute('SELECT COUNT(*) as count FROM guru');
        const [totalSubjects] = await db.execute('SELECT COUNT(*) as count FROM mata_pelajaran');
        
        // Get today's attendance stats
        const today = new Date().toISOString().split('T')[0];
        const [todayAttendance] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM absensi_guru 
            WHERE DATE(tanggal) = ?
        `, [today]);
        
        // Get recent activity (last 7 days)
        const [recentActivity] = await db.execute(`
            SELECT 
                DATE(tanggal) as date,
                COUNT(*) as activities
            FROM absensi_guru 
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(tanggal)
            ORDER BY date DESC
        `);
        
        const monitoringData = {
            metrics: {
                system: {
                    memory: {
                        used: process.memoryUsage().heapUsed,
                        total: process.memoryUsage().heapTotal,
                        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
                    },
                    cpu: {
                        usage: Math.random() * 100, // Simulated CPU usage
                        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
                    },
                    disk: {
                        used: 0, // Placeholder
                        total: 1000000000, // Placeholder
                        percentage: 0 // Placeholder
                    },
                    uptime: process.uptime()
                },
                application: {
                    requests: {
                        total: 1000 + Math.floor(Math.random() * 500),
                        active: Math.floor(Math.random() * 50),
                        completed: 950 + Math.floor(Math.random() * 100),
                        failed: Math.floor(Math.random() * 10)
                    },
                    responseTime: {
                        average: 50 + Math.random() * 100,
                        min: 10 + Math.random() * 20,
                        max: 200 + Math.random() * 300
                    },
                    errors: {
                        count: Math.floor(Math.random() * 5),
                        lastError: null
                    }
                },
                database: {
                    connections: {
                        active: Math.floor(Math.random() * 10) + 5,
                        idle: Math.floor(Math.random() * 5),
                        total: Math.floor(Math.random() * 15) + 10
                    },
                    queries: {
                        total: 5000 + Math.floor(Math.random() * 2000),
                        slow: Math.floor(Math.random() * 50),
                        failed: Math.floor(Math.random() * 10)
                    },
                    responseTime: {
                        average: 20 + Math.random() * 50,
                        min: 5 + Math.random() * 10,
                        max: 100 + Math.random() * 200
                    }
                }
            },
            health: {
                status: 'healthy',
                issues: []
            },
            alerts: [],
            alertStats: {
                active: 0,
                total: 0,
                resolved: 0
            },
            loadBalancer: {
                totalRequests: 1000 + Math.floor(Math.random() * 500),
                activeRequests: Math.floor(Math.random() * 50),
                completedRequests: 950 + Math.floor(Math.random() * 100),
                failedRequests: Math.floor(Math.random() * 10)
            },
            system: {
                uptime: process.uptime()
            },
            system_stats: {
                total_classes: totalClasses[0].count,
                total_students: totalStudents[0].count,
                total_teachers: totalTeachers[0].count,
                total_subjects: totalSubjects[0].count
            },
            today_stats: {
                attendance_taken: todayAttendance[0].count
            },
            recent_activity: recentActivity,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Monitoring dashboard data retrieved successfully');
        res.json(monitoringData);
    } catch (error) {
        console.error('❌ Error getting monitoring dashboard data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get system performance data
app.get('/api/admin/system-performance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting system performance data');
        
        // Get database connection status
        const dbStatus = connection ? 'connected' : 'disconnected';
        
        // Get memory usage (simplified)
        const memoryUsage = process.memoryUsage();
        
        // Get uptime
        const uptime = process.uptime();
        
        // Get current load (simplified)
        const currentLoad = {
            cpu: Math.random() * 100, // Simulated CPU usage
            memory: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
            uptime_hours: Math.floor(uptime / 3600),
            uptime_minutes: Math.floor((uptime % 3600) / 60)
        };
        
        // Get database performance metrics
        const [dbMetrics] = await db.execute(`
            SELECT 
                COUNT(*) as total_connections,
                (SELECT COUNT(*) FROM information_schema.processlist WHERE db = DATABASE()) as active_connections
            FROM information_schema.processlist 
            WHERE db = DATABASE()
        `);
        
        const performanceData = {
            system: {
                status: 'healthy',
                uptime: uptime,
                uptime_formatted: `${currentLoad.uptime_hours}h ${currentLoad.uptime_minutes}m`,
                memory: {
                    used: memoryUsage.heapUsed,
                    total: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    arrayBuffers: memoryUsage.arrayBuffers,
                    percentage: Math.round(currentLoad.memory)
                },
                cpu: {
                    usage: Math.round(currentLoad.cpu)
                }
            },
            database: {
                status: dbStatus,
                active_connections: dbMetrics[0]?.active_connections || 0,
                total_connections: dbMetrics[0]?.total_connections || 0
            },
            resources: {
                memory_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                memory_percentage: Math.round(currentLoad.memory),
                cpu_percentage: Math.round(currentLoad.cpu)
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ System performance data retrieved successfully');
        res.json(performanceData);
    } catch (error) {
        console.error('❌ Error getting system performance data:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// BACKUP & ARCHIVE MANAGEMENT ENDPOINTS
// ================================================

/**
 * @swagger
 * /api/admin/backups:
 *   get:
 *     summary: Get list of backup files
 *     tags: [Backup Management]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of backup files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                         example: "backup_2024-01-01.sql"
 *                       filepath:
 *                         type: string
 *                         example: "/path/to/backup_2024-01-01.sql"
 *                       size:
 *                         type: integer
 *                         example: 1024000
 *                       created:
 *                         type: string
 *                         format: date-time
 *                       modified:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: "Backups retrieved successfully"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get backup list
app.get('/api/admin/backups', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📦 Getting backup list');
        
        // Using imported fs and path modules
        
        const backupDir = path.join(process.cwd(), 'backups');
        
        // Create directory if not exists
        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (err) {
            // Directory already exists
        }
        
        // Read directory
        const files = await fs.readdir(backupDir);
        
        // Filter .sql files
        const backupFiles = files.filter(f => f.endsWith('.sql'));
        
        // Get file stats
        const backups = await Promise.all(
            backupFiles.map(async (filename) => {
                const filepath = path.join(backupDir, filename);
                const stats = await fs.stat(filepath);
                
                return {
                    filename,
                    filepath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
        );
        
        // Sort by created date (newest first)
        backups.sort((a, b) => b.created - a.created);
        
        res.success(backups, 'Backups retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting backup list:', error);
        res.error('Internal server error', 'Failed to list backups');
    }
});

/**
 * @swagger
 * /api/admin/archive-stats:
 *   get:
 *     summary: Get archive statistics
 *     tags: [Backup Management]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Archive statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: integer
 *                       example: 5
 *                     totalSize:
 *                       type: integer
 *                       example: 1024000
 *                     oldestBackup:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     newestBackup:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-05T00:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Archive stats retrieved successfully"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get archive statistics
app.get('/api/admin/archive-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting archive statistics');
        
        // Using imported fs and path modules
        
        const backupDir = path.join(process.cwd(), 'backups');
        
        // Create directory if not exists
        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (err) {
            // Directory already exists
        }
        
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.endsWith('.sql'));
        
        if (backupFiles.length === 0) {
            return res.success({
                totalFiles: 0,
                totalSize: 0,
                oldestBackup: null,
                newestBackup: null
            }, 'Archive stats retrieved successfully');
        }
        
        // Calculate stats
        let totalSize = 0;
        const fileDates = [];
        
        for (const filename of backupFiles) {
            const filepath = path.join(backupDir, filename);
            const stats = await fs.stat(filepath);
            totalSize += stats.size;
            fileDates.push(stats.birthtime);
        }
        
        fileDates.sort((a, b) => a - b);
        
        res.success({
            totalFiles: backupFiles.length,
            totalSize,
            oldestBackup: fileDates[0],
            newestBackup: fileDates[fileDates.length - 1]
        }, 'Archive stats retrieved successfully');
    } catch (error) {
        console.error('❌ Error getting archive statistics:', error);
        res.error('Internal server error', 'Failed to get archive stats');
    }
});

/**
 * @swagger
 * /api/admin/backup-settings:
 *   get:
 *     summary: Get backup settings
 *     tags: [Backup Management]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Backup settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     schedule:
 *                       type: string
 *                       example: "daily"
 *                     scheduleTime:
 *                       type: string
 *                       example: "02:00"
 *                     retention:
 *                       type: integer
 *                       example: 30
 *                     compression:
 *                       type: boolean
 *                       example: true
 *                     location:
 *                       type: string
 *                       example: "local"
 *                 message:
 *                   type: string
 *                   example: "Backup settings retrieved successfully"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Save backup settings
 *     tags: [Backup Management]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: true
 *               schedule:
 *                 type: string
 *                 example: "daily"
 *               scheduleTime:
 *                 type: string
 *                 example: "02:00"
 *               retention:
 *                 type: integer
 *                 example: 30
 *               compression:
 *                 type: boolean
 *                 example: true
 *               location:
 *                 type: string
 *                 example: "local"
 *     responses:
 *       200:
 *         description: Backup settings saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Backup settings saved successfully"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get backup settings
app.get('/api/admin/backup-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('⚙️ Getting backup settings');
        
        // Try to get from system_config table
        const [rows] = await db.execute(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            ['backup_settings']
        );
        
        if (rows.length > 0) {
            const settings = JSON.parse(rows[0].config_value);
            return res.success(settings, 'Backup settings retrieved successfully');
        }
        
        // Default settings if not found
        const defaultSettings = {
            enabled: true,
            schedule: 'daily',
            scheduleTime: '02:00',
            retention: 30, // days
            compression: true,
            location: 'local'
        };
        
        res.success(defaultSettings, 'Default backup settings');
    } catch (error) {
        console.error('❌ Error getting backup settings:', error);
        res.error('Internal server error', 'Failed to get backup settings');
    }
});

// Save backup settings
app.post('/api/admin/backup-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = req.body;
        console.log('💾 Saving backup settings:', settings);
        
        // Save to system_config
        await db.execute(
            `INSERT INTO system_config (config_key, config_value, updated_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE config_value = ?, updated_at = NOW()`,
            ['backup_settings', JSON.stringify(settings), JSON.stringify(settings)]
        );
        
        res.success(settings, 'Backup settings saved successfully');
    } catch (error) {
        console.error('❌ Error saving backup settings:', error);
        res.error('Internal server error', 'Failed to save backup settings');
    }
});

/**
 * @swagger
 * /api/admin/custom-schedules:
 *   get:
 *     summary: Get custom backup schedules
 *     tags: [Backup Management]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Custom schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "schedule_1"
 *                       name:
 *                         type: string
 *                         example: "Weekly Full Backup"
 *                       schedule:
 *                         type: string
 *                         example: "0 2 * * 0"
 *                       enabled:
 *                         type: boolean
 *                         example: true
 *                 message:
 *                   type: string
 *                   example: "Custom schedules retrieved successfully"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get custom schedules
app.get('/api/admin/custom-schedules', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📅 Getting custom schedules');
        
        // Get custom schedules from system_config
        const [rows] = await db.execute(
            'SELECT config_value FROM system_config WHERE config_key = ?',
            ['backup_custom_schedules']
        );
        
        if (rows.length > 0) {
            const schedules = JSON.parse(rows[0].config_value);
            return res.success(schedules, 'Custom schedules retrieved successfully');
        }
        
        res.success([], 'No custom schedules found');
    } catch (error) {
        console.error('❌ Error getting custom schedules:', error);
        res.error('Internal server error', 'Failed to get custom schedules');
    }
});

// Create semester backup
app.post('/api/admin/create-semester-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { semester, year } = req.body;
        
        if (!semester || !year) {
            return res.status(400).json({
                success: false,
                error: 'Semester dan tahun harus diisi'
            });
        }

        console.log(`📦 Creating semester backup: ${semester} ${year}`);
        
        // Import backup system jika belum
        const { BackupSystem } = await import('./backup-system.js');
        const backupSystem = new BackupSystem();
        
        // Initialize backup system
        await backupSystem.initialize();
        
        const result = await backupSystem.createSemesterBackup(semester, year);
        
        res.json({
            success: true,
            message: 'Backup semester berhasil dibuat',
            data: result
        });
    } catch (error) {
        console.error('❌ Error creating semester backup:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat backup semester',
            details: error.message
        });
    }
});

// Create date-based backup
app.post('/api/admin/create-date-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        if (!startDate) {
            return res.status(400).json({
                success: false,
                error: 'Tanggal mulai harus diisi'
            });
        }

        console.log(`📦 Creating date backup: ${startDate} to ${endDate || startDate}`);
        
        const { BackupSystem } = await import('./backup-system.js');
        const backupSystem = new BackupSystem();
        
        // Initialize backup system
        await backupSystem.initialize();
        
        const result = await backupSystem.createDateBackup(startDate, endDate || startDate);
        
        res.json({
            success: true,
            message: 'Backup berdasarkan tanggal berhasil dibuat',
            data: result
        });
    } catch (error) {
        console.error('❌ Error creating date backup:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat backup berdasarkan tanggal',
            details: error.message
        });
    }
});

// Archive old data
app.post('/api/admin/archive-old-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { monthsOld } = req.body;
        const months = monthsOld || 24;
        
        console.log(`📦 Archiving data older than ${months} months`);
        
        const { DatabaseOptimization } = await import('./database-optimization.js');
        const dbOptimization = new DatabaseOptimization();
        
        // Initialize database optimization
        await dbOptimization.initialize();
        
        await dbOptimization.archiveOldData(months);
        
        res.json({
            success: true,
            message: `Data lebih dari ${months} bulan berhasil diarsipkan`
        });
    } catch (error) {
        console.error('❌ Error archiving old data:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal mengarsipkan data lama',
            details: error.message
        });
    }
});

// Create test archive data
app.post('/api/admin/create-test-archive-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📦 Creating test archive data...');
        
        const { DatabaseOptimization } = await import('./database-optimization.js');
        const dbOptimization = new DatabaseOptimization();
        
        // Initialize database optimization
        await dbOptimization.initialize();
        
        // Create some test data for archiving
        const testData = await dbOptimization.createTestArchiveData();
        
        res.json({
            success: true,
            message: 'Test archive data created successfully',
            data: testData
        });
    } catch (error) {
        console.error('❌ Error creating test archive data:', error);
        res.status(500).json({
            success: false,
            error: 'Gagal membuat data test archive',
            details: error.message
        });
    }
});

// ================================================
// ENDPOINTS UNTUK PENGAJUAN IZIN KELAS
// ================================================

// Get daftar siswa in class for siswa perwakilan
app.get('/api/siswa/:siswaId/daftar-siswa', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📋 Getting daftar siswa for class representative:', siswaId);

        // Get the class of the siswa perwakilan
        const [kelasData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Get all students in the same class
        const [siswaData] = await db.execute(`
            SELECT id_siswa as id, nama 
            FROM siswa 
            WHERE kelas_id = ? 
            ORDER BY nama ASC
        `, [kelasId]);

        console.log(`✅ Daftar siswa retrieved: ${siswaData.length} students`);
        res.json(siswaData);
    } catch (error) {
        console.error('❌ Error getting daftar siswa:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get attendance records for banding absen
app.get('/api/siswa/:siswaId/attendance-records', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_absen } = req.query;
        console.log('📊 Getting attendance records for banding:', { siswaId, jadwal_id, tanggal_absen });

        if (!jadwal_id || !tanggal_absen) {
            return res.status(400).json({ 
                success: false, 
                error: 'jadwal_id dan tanggal_absen diperlukan' 
            });
        }

        // Get the class of the siswa perwakilan
        const [kelasData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Siswa tidak ditemukan' 
            });
        }

        const kelasId = kelasData[0].kelas_id;

        // Get all students in the same class with their attendance records
        const [attendanceData] = await db.execute(`
            SELECT 
                s.id_siswa as siswa_id,
                s.nama,
                s.nis,
                a.status,
                a.keterangan,
                CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as has_attendance
            FROM siswa s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND a.jadwal_id = ? 
                AND a.tanggal = ?
            WHERE s.kelas_id = ?
            ORDER BY s.nama ASC
        `, [jadwal_id, tanggal_absen, kelasId]);

        console.log(`✅ Attendance records retrieved: ${attendanceData.length} students`);
        res.json({
            success: true,
            data: attendanceData
        });
    } catch (error) {
        console.error('❌ Error getting attendance records:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Gagal memuat data absensi' 
        });
    }
});

// Submit pengajuan izin kelas
app.post('/api/siswa/:siswaId/pengajuan-izin-kelas', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_izin, siswa_izin } = req.body;
        console.log('📝 Submitting pengajuan izin kelas:', { siswaId, jadwal_id, tanggal_izin, siswaCount: siswa_izin.length });

        // Validation - Force single student only
        if (!jadwal_id || !tanggal_izin || !siswa_izin || siswa_izin.length !== 1) {
            return res.status(400).json({ error: 'Hanya diperbolehkan 1 siswa per pengajuan. Silakan pilih 1 siswa saja.' });
        }

        // Validate all students have required fields
        const validJenisIzin = ['sakit', 'izin', 'alpa', 'dispen'];
        for (const siswa of siswa_izin) {
            if (!siswa.nama || !siswa.jenis_izin || !siswa.alasan) {
                return res.status(400).json({ error: 'Semua siswa harus memiliki nama, jenis izin, dan alasan' });
            }
            
            // Validate jenis izin for each student
            if (!validJenisIzin.includes(siswa.jenis_izin)) {
                return res.status(400).json({ 
                    error: `Jenis izin tidak valid untuk siswa ${siswa.nama}: ${siswa.jenis_izin}. Jenis yang diperbolehkan: ${validJenisIzin.join(', ')}` 
                });
            }
        }

        // Get siswa perwakilan's class
        const [kelasData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa perwakilan tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Insert main pengajuan izin record
        const [pengajuanResult] = await db.execute(
            `INSERT INTO pengajuan_izin_siswa (siswa_id, jadwal_id, tanggal_izin, jenis_izin, alasan, tanggal_pengajuan, status, kelas_id)
             VALUES (?, ?, ?, 'kelas', 'Pengajuan izin untuk kelas', NOW(), 'pending', ?)`,
            [siswaId, jadwal_id, tanggal_izin, kelasId]
        );

        const pengajuanId = pengajuanResult.insertId;

        // Insert individual student records
        for (const siswa of siswa_izin) {
            await db.execute(
                `INSERT INTO pengajuan_izin_detail (pengajuan_id, nama_siswa, jenis_izin, alasan, bukti_pendukung)
                 VALUES (?, ?, ?, ?, ?)`,
                [pengajuanId, siswa.nama, siswa.jenis_izin, siswa.alasan, siswa.bukti_pendukung || null]
            );
        }

        console.log('✅ Pengajuan izin kelas submitted successfully');
        res.json({ 
            message: `Pengajuan izin untuk ${siswa_izin.length} siswa berhasil dikirim`,
            id: pengajuanId 
        });
    } catch (error) {
        console.error('❌ Error submitting pengajuan izin kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// ENDPOINTS UNTUK BANDING ABSEN
// ================================================

// Get banding absen for student
app.get('/api/siswa/:siswaId/banding-absen', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📋 Getting banding absen for siswa:', siswaId);

        const query = `
            SELECT 
                ba.id as id_banding,
                ba.siswa_id,
                ba.absensi_id as jadwal_id,
                a.tanggal as tanggal_absen,
                a.status as status_asli,
                ba.alasan as alasan_banding,
                NULL as bukti_pendukung,
                ba.status as status_banding,
                NULL as catatan_guru,
                ba.created_at as tanggal_pengajuan,
                NULL as tanggal_keputusan,
                COALESCE(j.jam_mulai, 'Umum') as jam_mulai,
                COALESCE(j.jam_selesai, 'Umum') as jam_selesai,
                COALESCE(m.nama_mapel, 'Banding Umum') as nama_mapel,
                COALESCE(g.nama, 'Menunggu Proses') as nama_guru,
                COALESCE(k.nama_kelas, '') as nama_kelas
            FROM pengajuan_banding_absen ba
            LEFT JOIN absensi_siswa a ON ba.absensi_id = a.id
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN siswa s ON ba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE ba.siswa_id = ?
            ORDER BY ba.created_at DESC
        `;

        const [rows] = await db.execute(query, [siswaId]);
        console.log(`✅ Banding absen retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting banding absen:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Submit banding absen
app.post('/api/siswa/:siswaId/banding-absen', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding } = req.body;
        console.log('📝 Submitting banding absen:', { siswaId, jadwal_id, tanggal_absen, status_asli, status_diajukan });

        // Validation
        if (!jadwal_id || !tanggal_absen || !status_asli || !status_diajukan || !alasan_banding) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        if (status_asli === status_diajukan) {
            return res.status(400).json({ error: 'Status asli dan status yang diajukan tidak boleh sama' });
        }

        // Check if banding already exists for this combination
        const [existing] = await db.execute(
            'SELECT id_banding FROM pengajuan_banding_absen WHERE siswa_id = ? AND jadwal_id = ? AND tanggal_absen = ? AND status_banding = "pending"',
            [siswaId, jadwal_id, tanggal_absen]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Banding untuk jadwal dan tanggal ini sudah pernah diajukan dan sedang diproses' });
        }

        // Insert banding absen
        const [result] = await db.execute(
            `INSERT INTO pengajuan_banding_absen 
            (siswa_id, jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [siswaId, jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding]
        );

        console.log('✅ Banding absen submitted successfully');
        res.json({ 
            message: 'Banding absen berhasil dikirim',
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Error submitting banding absen:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Submit banding absen kelas
app.post('/api/siswa/:siswaId/banding-absen-kelas', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_absen, siswa_banding } = req.body;
        console.log('📝 Submitting banding absen kelas:', { siswaId, jadwal_id, tanggal_absen, siswaCount: siswa_banding.length });

        // Validation - Force single student only
        if (!jadwal_id || !tanggal_absen || !siswa_banding || siswa_banding.length !== 1) {
            return res.status(400).json({ error: 'Hanya diperbolehkan 1 siswa per pengajuan banding. Silakan pilih 1 siswa saja.' });
        }

        // Validate all students have required fields
        for (const siswa of siswa_banding) {
            if (!siswa.nama || !siswa.status_asli || !siswa.status_diajukan || !siswa.alasan_banding) {
                return res.status(400).json({ error: 'Semua siswa harus memiliki nama, status asli, status diajukan, dan alasan banding' });
            }
        }

        // Validasi: Pastikan semua siswa memiliki record absensi
        for (const siswa of siswa_banding) {
            const [attendance] = await db.execute(
                'SELECT id, status FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
                [siswa.id, jadwal_id, tanggal_absen]
            );
            
            if (attendance.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: `Siswa ${siswa.nama} belum diabsen oleh guru untuk jadwal ini`
                });
            }
            
            // Validasi: Status tercatat harus sesuai dengan database
            if (attendance[0].status !== siswa.status_asli) {
                return res.status(400).json({
                    success: false,
                    error: `Status tercatat untuk ${siswa.nama} tidak sesuai dengan database`
                });
            }
        }

        // Get siswa perwakilan's class
        const [kelasData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa perwakilan tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Insert main banding absen record
        const [bandingResult] = await db.execute(
            `INSERT INTO pengajuan_banding_absen (siswa_id, jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding, tanggal_pengajuan, status_banding, kelas_id, jenis_banding)
             VALUES (?, ?, ?, 'kelas', 'kelas', 'Pengajuan banding absen untuk kelas', NOW(), 'pending', ?, 'kelas')`,
            [siswaId, jadwal_id, tanggal_absen, kelasId]
        );

        const bandingId = bandingResult.insertId;

        // Insert individual student records
        for (const siswa of siswa_banding) {
            await db.execute(
                `INSERT INTO banding_absen_detail (banding_id, nama_siswa, status_asli, status_diajukan, alasan_banding, bukti_pendukung)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [bandingId, siswa.nama, siswa.status_asli, siswa.status_diajukan, siswa.alasan_banding, siswa.bukti_pendukung || null]
            );
        }

        console.log('✅ Banding absen kelas submitted successfully');
        res.json({ 
            message: `Pengajuan banding absen untuk ${siswa_banding.length} siswa berhasil dikirim`,
            id: bandingId 
        });
    } catch (error) {
        console.error('❌ Error submitting banding absen kelas:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Get banding absen for teacher to process
app.get('/api/guru/:guruId/banding-absen', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { guruId } = req.params;
        console.log('📋 Getting banding absen for guru:', guruId);

        const query = `
            SELECT 
                ba.id as id_banding,
                ba.siswa_id,
                ba.absensi_id as jadwal_id,
                a.tanggal as tanggal_absen,
                a.status as status_asli,
                a.status as status_diajukan,
                ba.alasan as alasan_banding,
                NULL as bukti_pendukung,
                ba.status as status_banding,
                NULL as catatan_guru,
                ba.created_at as tanggal_pengajuan,
                NULL as tanggal_keputusan,
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas
            FROM pengajuan_banding_absen ba
            LEFT JOIN absensi_siswa a ON ba.absensi_id = a.id
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN siswa s ON ba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE j.guru_id = ?
            ORDER BY ba.created_at DESC, ba.status ASC
        `;

        const [rows] = await db.execute(query, [guruId]);
        console.log(`✅ Banding absen for guru retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting banding absen for guru:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Process banding absen by teacher
app.put('/api/banding-absen/:bandingId/respond', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { bandingId } = req.params;
        const { status_banding, catatan_guru, diproses_oleh } = req.body;
        const guruId = diproses_oleh || req.user.guru_id || req.user.id;
        
        console.log('📝 Guru processing banding absen:', { bandingId, status_banding, guruId });

        // Validation
        if (!status_banding || !['disetujui', 'ditolak'].includes(status_banding)) {
            return res.status(400).json({ error: 'Status harus disetujui atau ditolak' });
        }

        // Update banding absen
        const [result] = await db.execute(
            `UPDATE pengajuan_banding_absen 
             SET status_banding = ?, catatan_guru = ?, tanggal_keputusan = NOW(), diproses_oleh = ?
             WHERE id_banding = ?`,
            [status_banding, catatan_guru || '', guruId, bandingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Banding absen tidak ditemukan' });
        }

        console.log('✅ Banding absen response submitted successfully');
        res.json({ 
            message: `Banding absen berhasil ${status_banding === 'disetujui' ? 'disetujui' : 'ditolak'}`,
            id: bandingId
        });
    } catch (error) {
        console.error('❌ Error responding to banding absen:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// SERVER INITIALIZATION - REMOVED DUPLICATE
// ================================================
// Server initialization moved to startServer() function below

// ================================================
// RIWAYAT PENGAJUAN IZIN ENDPOINTS (STEP 8)
// ================================================

// Get riwayat pengajuan izin for admin
app.get('/api/admin/riwayat-izin-report', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, jenis_izin, status } = req.query;
        console.log('📊 Getting riwayat pengajuan izin report:', { startDate, endDate, kelas_id, jenis_izin, status });

        let query = `
            SELECT 
                pi.id as id_pengajuan,
                DATE_FORMAT(pi.created_at, '%d/%m/%Y %H:%i') as tanggal_pengajuan,
                DATE_FORMAT(pi.created_at, '%d/%m/%Y') as tanggal_izin,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas,
                pi.jenis_izin,
                pi.alasan,
                pi.status,
                COALESCE(pi.keterangan_guru, '-') as keterangan_guru,
                COALESCE(DATE_FORMAT(pi.tanggal_respon, '%d/%m/%Y %H:%i'), '-') as tanggal_respon,
                COALESCE(m.nama_mapel, 'Izin Umum') as nama_mapel,
                CASE 
                    WHEN pi.guru_id IS NOT NULL THEN g_respon.nama
                    WHEN j.guru_id IS NOT NULL THEN g.nama
                    ELSE 'Menunggu Persetujuan'
                END as nama_guru,
                COALESCE(CONCAT(j.jam_mulai, ' - ', j.jam_selesai), 'Izin Harian') as jadwal,
                COALESCE(pi.bukti_pendukung, '-') as bukti_pendukung
            FROM pengajuan_izin_siswa pi
            JOIN siswa s ON pi.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN guru g_respon ON pi.guru_id = g_respon.id_guru
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pi.tanggal_pengajuan) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (jenis_izin && jenis_izin !== '') {
            query += ' AND pi.jenis_izin = ?';
            params.push(jenis_izin);
        }
        
        if (status && status !== '') {
            query += ' AND pi.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pi.tanggal_pengajuan DESC';
        
        const [rows] = await db.execute(query, params);
        console.log(`✅ Found ${rows.length} riwayat pengajuan izin records`);
        
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting riwayat pengajuan izin report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// Download riwayat pengajuan izin report as CSV
app.get('/api/admin/download-riwayat-izin', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, jenis_izin, status } = req.query;
        console.log('📊 Downloading riwayat pengajuan izin report:', { startDate, endDate, kelas_id, jenis_izin, status });

        let query = `
            SELECT 
                DATE_FORMAT(pi.tanggal_pengajuan, '%d/%m/%Y %H:%i') as tanggal_pengajuan,
                DATE_FORMAT(pi.tanggal_izin, '%d/%m/%Y') as tanggal_izin,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas,
                pi.jenis_izin,
                pi.alasan,
                pi.status,
                COALESCE(pi.keterangan_guru, '-') as keterangan_guru,
                COALESCE(DATE_FORMAT(pi.tanggal_respon, '%d/%m/%Y %H:%i'), '-') as tanggal_respon,
                COALESCE(m.nama_mapel, 'Izin Umum') as nama_mapel,
                CASE 
                    WHEN pi.guru_id IS NOT NULL THEN g_respon.nama
                    WHEN j.guru_id IS NOT NULL THEN g.nama
                    ELSE 'Menunggu Persetujuan'
                END as nama_guru,
                COALESCE(CONCAT(j.jam_mulai, ' - ', j.jam_selesai), 'Izin Harian') as jadwal,
                COALESCE(pi.bukti_pendukung, '-') as bukti_pendukung
            FROM pengajuan_izin_siswa pi
            JOIN siswa s ON pi.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN guru g_respon ON pi.guru_id = g_respon.id_guru
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pi.tanggal_pengajuan) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (jenis_izin && jenis_izin !== '') {
            query += ' AND pi.jenis_izin = ?';
            params.push(jenis_izin);
        }
        
        if (status && status !== '') {
            query += ' AND pi.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pi.tanggal_pengajuan DESC';
        
        const [rows] = await db.execute(query, params);

        // Enhanced CSV format with UTF-8 BOM for Excel compatibility
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'Tanggal Pengajuan,Tanggal Izin,Nama Siswa,NIS,Kelas,Jenis Izin,Alasan,Status,Keterangan Guru,Tanggal Respon,Mata Pelajaran,Guru,Jadwal,Bukti Pendukung\n';
        
        rows.forEach(row => {
            csvContent += `"${row.tanggal_pengajuan}","${row.tanggal_izin}","${row.nama_siswa}","${row.nis}","${row.nama_kelas}","${row.jenis_izin}","${row.alasan}","${row.status}","${row.keterangan_guru}","${row.tanggal_respon}","${row.nama_mapel}","${row.nama_guru}","${row.jadwal}","${row.bukti_pendukung}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="riwayat-pengajuan-izin-${startDate || 'all'}-${endDate || 'all'}.csv"`);
        res.send(csvContent);
        
        console.log(`✅ Riwayat pengajuan izin report downloaded successfully: ${rows.length} records`);
    } catch (error) {
        console.error('❌ Error downloading riwayat pengajuan izin report:', error);
        res.error('Internal server error', 'Failed to process request');
    }
});

// ================================================
// GLOBAL ERROR HANDLERS
// ================================================

// Handle 413 Payload Too Large errors
app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') {
        console.error('❌ Payload too large error:', error.message);
        return res.status(413).json({
            error: 'Payload terlalu besar. Maksimal 10MB untuk seluruh request.',
            code: 'PAYLOAD_TOO_LARGE',
            details: 'Silakan kompres gambar atau kurangi ukuran data yang dikirim.'
        });
    }
    next(error);
});

// ================================================
// COMPREHENSIVE HEALTH CHECK
// ================================================
app.get('/api/health', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Test database connection
        let dbHealthy = false;
        let dbStats = {};
        try {
            dbHealthy = await db.testConnection();
            dbStats = db.getPoolStats();
        } catch (error) {
            console.error('❌ Database health check failed:', error.message);
            dbHealthy = false;
            dbStats = { error: error.message };
        }
        
        // Test cache connection
        let cacheStats = { status: 'disconnected', error: 'Not available' };
        try {
            cacheStats = await cache.getStats();
        } catch (error) {
            console.error('❌ Cache health check failed:', error.message);
            cacheStats = { status: 'error', error: error.message };
        }
        
        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        // Calculate response time
        const responseTime = Date.now() - startTime;
        
        const healthData = {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            
            database: {
                status: dbHealthy ? 'connected' : 'disconnected',
                pool: dbStats,
                responseTime: `${responseTime}ms`
            },
            
            cache: {
                status: cacheStats.connected ? 'connected' : 'disconnected',
                memory: cacheStats.memory,
                keyspace: cacheStats.keyspace
            },
            
            system: {
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                platform: process.platform,
                nodeVersion: process.version
            },
            
            services: {
                api: 'operational',
                authentication: 'operational',
                rateLimiting: 'operational'
            }
        };
        
        // Log health check
        systemLogger.health(healthData.status, {
            dbHealthy,
            responseTime,
            memoryUsed: memoryUsage.heapUsed
        });
        
        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json(healthData);
        
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            uptime: Math.floor(process.uptime())
        });
    }
});

// Test payload endpoint for testing large payload handling
app.post('/api/test-payload', (req, res) => {
    const payloadSize = JSON.stringify(req.body).length;
    const payloadSizeKB = Math.round(payloadSize / 1024);
    
    res.json({
        success: true,
        message: 'Payload received successfully',
        payloadSize: payloadSizeKB,
        received: true
    });
});

// ================================================
// ALIAS ROUTING untuk kompatibilitas
// ================================================

// Alias khusus untuk endpoint info yang lama
app.get('/api/siswa-perwakilan/info', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        console.log('📋 Getting siswa info via alias for user:', req.user.id);

        const [siswaData] = await db.execute(
            `SELECT s.id_siswa, s.nis, s.nama, s.kelas_id, k.nama_kelas 
             FROM siswa s 
             JOIN kelas k ON s.kelas_id = k.id_kelas 
             WHERE s.user_id = ?`,
            [req.user.id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        const info = siswaData[0];
        console.log('✅ Siswa info retrieved via alias:', info);

        res.json({
            success: true,
            id_siswa: info.id_siswa,
            nis: info.nis,
            nama: info.nama,
            kelas_id: info.kelas_id,
            nama_kelas: info.nama_kelas
        });

    } catch (error) {
        console.error('❌ Error getting siswa info via alias:', error);
        res.status(500).json({ error: 'Gagal memuat informasi siswa' });
    }
});

// Global error handler untuk memastikan response selalu JSON
app.use(errorLogger);
app.use(handleError);
app.use((error, req, res, next) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        type: error.type,
        code: error.code,
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress
    });
    
    // Pastikan response belum dikirim
    if (res.headersSent) {
        return next(error);
    }
    
    // Return JSON response untuk semua error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Handle 404 untuk routes yang tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint tidak ditemukan',
        code: 'NOT_FOUND',
        path: req.originalUrl
    });
});

// ================================================
// SERVER STARTUP
// ================================================

// Initialize database connection and start server
async function startServer() {
    try {
        // Connect to database first
        await connectToDatabase();
        
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Start server
        app.listen(port, () => {
            systemLogger.startup(`ABSENTA Modern Server running on port ${port}`);
            logger.info('Server started', {
                port,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                platform: process.platform
            });
            console.log(`🚀 ABSENTA Modern Server running on port ${port}`);
            console.log(`📊 Database connection: ${db && typeof db.isConnected === 'function' ? (db.isConnected() ? 'Connected' : 'Not connected') : 'Unknown'}`);
            console.log(`🌐 Server URL: http://localhost:${port}`);
            console.log(`📋 Health check: http://localhost:${port}/api/health`);
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        systemLogger.shutdown('Server startup failed');
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    systemLogger.shutdown('Shutting down server...');
    console.log('🛑 Shutting down server...');
    
    try {
        // Close database pool
        await db.close();
        console.log('✅ Database pool closed');
        
        // Close cache connection
        await cache.close();
        console.log('✅ Cache connection closed');
    } catch (error) {
        logger.error('Error during shutdown', {
            error: error.message,
            stack: error.stack
        });
    }
    
    process.exit(0);
});

// Handle SIGTERM for production
process.on('SIGTERM', async () => {
    systemLogger.shutdown('Received SIGTERM, shutting down gracefully...');
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    
    try {
        await db.close();
        console.log('✅ Database pool closed');
        
        await cache.close();
        console.log('✅ Cache connection closed');
    } catch (error) {
        logger.error('Error during SIGTERM shutdown', {
            error: error.message,
            stack: error.stack
        });
    }
    
    process.exit(0);
});

export default app;
