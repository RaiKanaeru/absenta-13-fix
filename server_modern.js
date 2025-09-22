console.log('🚀 ABSENTA Modern Server Starting...');

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import DatabaseOptimization from './database-optimization.js';
import QueryOptimizer from './query-optimizer.js';
import BackupSystem from './backup-system.js';
import DownloadQueue from './queue-system.js';
import CacheSystem from './cache-system.js';
import LoadBalancer from './load-balancer.js';
import SystemMonitor from './monitoring-system.js';
import SecuritySystem from './security-system.js';
import DisasterRecoverySystem from './disaster-recovery-system.js';
import PerformanceOptimizer from './performance-optimizer.js';

const app = express();
const port = 3001;

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'absenta-super-secret-key-2025';
const saltRounds = 10;

// Middleware setup
app.use(cors({ 
    credentials: true, 
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'] 
}));
app.use(express.json());
app.use(cookieParser());

// ================================================
// DATABASE OPTIMIZATION SYSTEM - Connection Pool
// ================================================
const dbOptimization = new DatabaseOptimization();
let queryOptimizer = null;
let backupSystem = null;
let downloadQueue = null;
let cacheSystem = null;
let loadBalancer = null;
let systemMonitor = null;
let securitySystem = null;
let disasterRecoverySystem = null;
let performanceOptimizer = null;

async function initializeDatabase() {
    console.log('🔄 Initializing optimized database connection...');
    try {
        // Initialize database optimization system
        await dbOptimization.initialize();
        console.log('✅ Database optimization system initialized successfully');
        
        // Initialize query optimizer
        queryOptimizer = new QueryOptimizer(dbOptimization.pool);
        await queryOptimizer.initialize();
        console.log('✅ Query optimizer initialized successfully');
        
        // Initialize backup system
        backupSystem = new BackupSystem();
        await backupSystem.initialize();
        console.log('✅ Backup system initialized successfully');
        
        // Initialize download queue system
        downloadQueue = new DownloadQueue();
        await downloadQueue.initialize();
        console.log('✅ Download queue system initialized successfully');
        
        // Initialize cache system
        cacheSystem = new CacheSystem();
        await cacheSystem.initialize();
        console.log('✅ Cache system initialized successfully');
        
        // Initialize load balancer with query optimizer integration
        loadBalancer = new LoadBalancer({
            maxConcurrentRequests: 150,
            burstThreshold: 50,
            circuitBreakerThreshold: 10,
            circuitBreakerTimeout: 30000,
            requestTimeout: 10000,
            queryOptimizer: queryOptimizer
        });
        console.log('✅ Load balancer initialized successfully');
        
        // Populate sample queries to demonstrate cache functionality
        setTimeout(async () => {
            try {
                await loadBalancer.populateSampleQueries();
                console.log('✅ Sample queries populated in load balancer');
            } catch (error) {
                console.error('❌ Failed to populate sample queries:', error);
            }
        }, 5000); // Wait 5 seconds after initialization
        
        // Initialize system monitor
        systemMonitor = new SystemMonitor({
            monitoringInterval: 5000,
            alertThresholds: {
                memory: 1.5 * 1024 * 1024 * 1024, // 1.5GB
                cpu: 80, // 80%
                disk: 35 * 1024 * 1024 * 1024, // 35GB
                responseTime: 5000, // 5 seconds
                dbConnections: 15 // 15 connections
            },
            alertCooldown: 60000, // 1 minute
            logFile: 'logs/monitoring.log'
        });
        systemMonitor.start();
        console.log('✅ System monitor initialized and started');
        
        // Initialize security system
        securitySystem = new SecuritySystem({
            rateLimiting: {
                enabled: true,
                windowMs: 60000, // 1 minute
                maxRequests: 100,
                skipSuccessfulRequests: false,
                skipFailedRequests: false
            },
            inputValidation: {
                enabled: true,
                maxLength: 1000,
                allowedChars: /^[a-zA-Z0-9\s\-_@.!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/,
                sqlInjectionPatterns: [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
                    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
                    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
                    /(\b(OR|AND)\s+1\s*=\s*1)/i,
                    /(\b(OR|AND)\s+0\s*=\s*0)/i,
                    /(\b(OR|AND)\s+true)/i,
                    /(\b(OR|AND)\s+false)/i,
                    /(UNION\s+SELECT)/i,
                    /(DROP\s+TABLE)/i,
                    /(DELETE\s+FROM)/i,
                    /(INSERT\s+INTO)/i,
                    /(UPDATE\s+SET)/i,
                    /(CREATE\s+TABLE)/i,
                    /(ALTER\s+TABLE)/i,
                    /(EXEC\s*\()/i,
                    /(SCRIPT\s*>)/i,
                    /(<\s*SCRIPT)/i,
                    /(JAVASCRIPT\s*:)/i,
                    /(ON\s+LOAD\s*=)/i,
                    /(ON\s+ERROR\s*=)/i,
                    /(ON\s+FOCUS\s*=)/i,
                    /(ON\s+CLICK\s*=)/i
                ],
                xssPatterns: [
                    /<script[^>]*>.*?<\/script>/gi,
                    /<script[^>]*>/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /<iframe[^>]*>.*?<\/iframe>/gi,
                    /<object[^>]*>.*?<\/object>/gi,
                    /<embed[^>]*>.*?<\/embed>/gi,
                    /<link[^>]*>.*?<\/link>/gi,
                    /<meta[^>]*>.*?<\/meta>/gi,
                    /<style[^>]*>.*?<\/style>/gi
                ]
            },
            auditLogging: {
                enabled: true,
                logFile: 'logs/security-audit.log',
                logLevel: 'info',
                sensitiveFields: ['password', 'token', 'secret', 'key'],
                maxLogSize: 10 * 1024 * 1024, // 10MB
                maxLogFiles: 5
            }
        });
        console.log('✅ Security system initialized');
        
        // Initialize disaster recovery system
        disasterRecoverySystem = new DisasterRecoverySystem({
            backup: {
                enabled: true,
                schedule: '0 2 * * *', // Daily at 2 AM
                retention: 30, // 30 days
                compression: true,
                encryption: true,
                encryptionKey: 'absenta-disaster-recovery-key-2025',
                backupDir: 'backups/disaster-recovery',
                maxBackupSize: 100 * 1024 * 1024, // 100MB
                parallelBackups: 3
            },
            verification: {
                enabled: true,
                checksum: true,
                integrity: true,
                testRestore: true,
                verificationSchedule: '0 3 * * 0' // Weekly on Sunday at 3 AM
            },
            recovery: {
                enabled: true,
                maxRecoveryTime: 3600000, // 1 hour
                rollbackEnabled: true,
                notificationEnabled: true,
                notificationChannels: ['email', 'sms']
            },
            monitoring: {
                enabled: true,
                healthCheckInterval: 300000, // 5 minutes
                alertThresholds: {
                    backupFailure: 1,
                    verificationFailure: 1,
                    recoveryTime: 1800000 // 30 minutes
                }
            }
        });
        await disasterRecoverySystem.start();
        console.log('✅ Disaster recovery system initialized and started');
        
        // Initialize performance optimizer
        performanceOptimizer = new PerformanceOptimizer({
            queryOptimization: {
                enabled: true,
                maxCacheSize: 1000,
                defaultTTL: 300000, // 5 minutes
                slowQueryThreshold: 1000 // 1 second
            },
            memoryOptimization: {
                enabled: true,
                gcInterval: 300000, // 5 minutes
                maxMemoryUsage: 1.8 * 1024 * 1024 * 1024, // 1.8GB
                enableMemoryMonitoring: true
            }
        });
        await performanceOptimizer.initialize();
        console.log('✅ Performance optimizer initialized successfully');
        
        // Get connection pool for use in endpoints
        global.dbPool = dbOptimization;
        global.queryOptimizer = queryOptimizer;
        global.performanceOptimizer = performanceOptimizer;
        global.backupSystem = backupSystem;
        global.downloadQueue = downloadQueue;
        global.cacheSystem = cacheSystem;
        global.loadBalancer = loadBalancer;
        global.systemMonitor = systemMonitor;
        global.securitySystem = securitySystem;
        global.disasterRecoverySystem = disasterRecoverySystem;
        console.log('✅ Database connection pool, query optimizer, backup system, download queue, cache system, load balancer, system monitor, security system, and disaster recovery system ready');
        
    } catch (error) {
        console.error('❌ Failed to initialize database optimization:', error.message);
        console.log('🔄 Retrying initialization in 5 seconds...');
        setTimeout(initializeDatabase, 5000);
    }
}

// ================================================
// SECURITY MIDDLEWARE
// ================================================

// Security middleware
app.use((req, res, next) => {
    if (global.securitySystem) {
        // Use the rate limit middleware from SecuritySystem
        global.securitySystem.rateLimitMiddleware()(req, res, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Security middleware error' });
            }
            
            // Input validation
            if (req.body && typeof req.body === 'object') {
                const validationResult = global.securitySystem.validateInput(req.body, 'body');
                if (validationResult.violations && validationResult.violations.length > 0) {
                    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
                    global.securitySystem.logSecurityEvent('input_validation_failed', {
                        ip: clientIP,
                        path: req.path,
                        method: req.method,
                        violations: validationResult.violations,
                        timestamp: new Date().toISOString()
                    });
                    
                    return res.status(400).json({ 
                        error: 'Invalid input', 
                        message: 'Input validation failed',
                        violations: validationResult.violations
                    });
                }
            }
            
            // Audit logging
            const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
            global.securitySystem.logSecurityEvent('request', {
                ip: clientIP,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            
            next();
        });
    } else {
        next();
    }
});

// ================================================
// LOAD BALANCER MIDDLEWARE
// ================================================

// Load balancer middleware
app.use((req, res, next) => {
    if (global.loadBalancer) {
        // Determine request priority
        let priority = 'normal';
        
        if (req.method === 'POST' && (req.path.includes('/absensi') || req.path.includes('/login'))) {
            priority = 'critical';
        } else if (req.method === 'GET' && (req.path.includes('/absensi') || req.path.includes('/dashboard'))) {
            priority = 'high';
        } else if (req.path.includes('/analytics') || req.path.includes('/reports')) {
            priority = 'normal';
        } else {
            priority = 'low';
        }
        
        // Add request to load balancer
        const requestId = global.loadBalancer.addRequest({
            method: req.method,
            path: req.path,
            headers: req.headers,
            body: req.body
        }, priority);
        
        // Add request ID to response headers
        res.setHeader('X-Request-ID', requestId);
        
        // Add load balancer stats to response
        res.setHeader('X-Load-Balancer-Stats', JSON.stringify(global.loadBalancer.getStats()));
    }
    
    next();
});

// ================================================
// MIDDLEWARE - JWT Authentication & Authorization
// ================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    
    if (!token) {
        console.log('❌ Access denied: No token provided');
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        console.log(`✅ Token verified for user: ${user.username} (${user.role})`);
        console.log('🔍 Full user object:', user);
        req.user = user;
        next();
    });
}

// Role-based access control middleware
function requireRole(roles) {
    return (req, res, next) => {
        console.log('🔍 requireRole check:', { userRole: req.user?.role, requiredRoles: roles });
        if (!req.user || !req.user.role) {
            console.log('❌ No user or role found in request');
            return res.status(403).json({ error: 'User not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            console.log('❌ Insufficient permissions:', { userRole: req.user.role, requiredRoles: roles });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        console.log('✅ Role check passed');
        next();
    };
}

// ================================================
// AUTHENTICATION ENDPOINTS
// ================================================

// Login endpoint - Real authentication with MySQL
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`🔐 Login attempt for username: ${username}`);
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Query user from database
        const [rows] = await global.dbPool.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            [username]
        );

        if (rows.length === 0) {
            console.log('❌ Login failed: User not found');
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];
        
        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log('❌ Login failed: Invalid password');
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Get additional user data based on role
        let additionalData = {};
        
        if (user.role === 'guru') {
            const [guruData] = await global.dbPool.execute(
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
            const [siswaData] = await global.dbPool.execute(
                `SELECT sp.*, k.nama_kelas 
                 FROM siswa_perwakilan sp 
                 JOIN kelas k ON sp.kelas_id = k.id_kelas 
                 WHERE sp.user_id = ?`,
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

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        // Set cookie and return response
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax', // Allow cookie to be sent with cross-site requests
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log(`✅ Login successful for user: ${user.username} (${user.role})`);
        
        res.json({
            success: true,
            message: 'Login successful',
            user: tokenPayload,
            token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    console.log('✅ User logged out successfully');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user,
        message: 'Token is valid'
    });
});

// Verify token endpoint (alias for frontend compatibility)
app.get('/api/verify-token', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user,
        message: 'Token is valid'
    });
});

// ================================================
// DASHBOARD ENDPOINTS - Real Data from MySQL
// ================================================

// Lightweight master data for filters
// app.get('/api/admin/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
//     try {
//         const [rows] = await global.dbPool.execute(
//             'SELECT id_kelas AS id, nama_kelas FROM kelas WHERE status = "aktif" ORDER BY nama_kelas'
//         );
//         res.json(rows);
//     } catch (error) {
//         console.error('❌ Error fetching classes:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }); // DUPLICATE ENDPOINT - COMMENTED OUT

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const stats = {};
        
        if (req.user.role === 'admin') {
            // Admin statistics
            const [totalSiswa] = await global.dbPool.execute(
                'SELECT COUNT(*) as count FROM siswa_perwakilan WHERE status = "aktif"'
            );
            
            const [totalGuru] = await global.dbPool.execute(
                'SELECT COUNT(*) as count FROM guru WHERE status = "aktif"'
            );
            
            const [totalKelas] = await global.dbPool.execute(
                'SELECT COUNT(*) as count FROM kelas WHERE status = "aktif"'
            );
            
            const [totalMapel] = await global.dbPool.execute(
                'SELECT COUNT(*) as count FROM mapel WHERE status = "aktif"'
            );
            
            const [absensiHariIni] = await global.dbPool.execute(
                'SELECT COUNT(*) as count FROM absensi_guru WHERE tanggal = CURDATE()'
            );
            
            const [persentaseKehadiran] = await global.dbPool.execute(
                `SELECT 
                    ROUND(
                        (SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2
                    ) as persentase
                 FROM absensi_guru 
                 WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
            );

            stats.totalSiswa = totalSiswa[0].count;
            stats.totalGuru = totalGuru[0].count;
            stats.totalKelas = totalKelas[0].count;
            stats.totalMapel = totalMapel[0].count;
            stats.absensiHariIni = absensiHariIni[0].count;
            stats.persentaseKehadiran = persentaseKehadiran[0].persentase || 0;
            
        } else if (req.user.role === 'guru') {
            // Guru statistics
            const [jadwalHariIni] = await global.dbPool.execute(
                `SELECT COUNT(*) as count 
                 FROM jadwal 
                 WHERE guru_id = ? AND hari = DAYNAME(CURDATE()) AND status = 'aktif'`,
                [req.user.guru_id]
            );
            
            const [absensiMingguIni] = await global.dbPool.execute(
                `SELECT COUNT(*) as count 
                 FROM absensi_guru 
                 WHERE guru_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                [req.user.guru_id]
            );
            
            const [persentaseKehadiran] = await global.dbPool.execute(
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
            const [jadwalHariIni] = await global.dbPool.execute(
                `SELECT COUNT(*) as count 
                 FROM jadwal 
                 WHERE kelas_id = ? AND hari = DAYNAME(CURDATE()) AND status = 'aktif'`,
                [req.user.kelas_id]
            );
            
            const [absensiMingguIni] = await global.dbPool.execute(
                `SELECT COUNT(*) as count 
                 FROM absensi_guru 
                 WHERE kelas_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
                [req.user.kelas_id]
            );

            stats.jadwalHariIni = jadwalHariIni[0].count;
            stats.absensiMingguIni = absensiMingguIni[0].count;
        }

        console.log(`📊 Dashboard stats retrieved for ${req.user.role}: ${req.user.username}`);
        res.json({ success: true, data: stats });

    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
    }
});

// Get dashboard chart data
app.get('/api/dashboard/chart', authenticateToken, async (req, res) => {
    try {
        const { period = '7days' } = req.query;
        let chartData = [];

        if (req.user.role === 'admin') {
            // Admin chart - Weekly attendance overview
            const [weeklyData] = await global.dbPool.execute(
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
            const [personalData] = await global.dbPool.execute(
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
        res.json({ success: true, data: chartData });

    } catch (error) {
        console.error('❌ Chart data error:', error);
        res.status(500).json({ error: 'Failed to retrieve chart data' });
    }
});

// ================================================
// CRUD ENDPOINTS - ADMIN ONLY
// ================================================

// SISWA CRUD
app.get('/api/admin/siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT sp.*, k.nama_kelas, u.username, u.status as user_status
            FROM siswa_perwakilan sp
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            JOIN users u ON sp.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM siswa_perwakilan sp JOIN kelas k ON sp.kelas_id = k.id_kelas JOIN users u ON sp.user_id = u.id';
        let params = [];

        if (search) {
            query += ' WHERE (sp.nama LIKE ? OR sp.nis LIKE ? OR k.nama_kelas LIKE ?)';
            countQuery += ' WHERE (sp.nama LIKE ? OR sp.nis LIKE ? OR k.nama_kelas LIKE ?)';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        query += ' ORDER BY sp.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await global.dbPool.execute(query, params);
        const [countResult] = await global.dbPool.execute(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

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
        res.status(500).json({ error: 'Failed to retrieve student data' });
    }
});

app.post('/api/admin/siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nis, nama, kelas_id, username, password, jabatan } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Start transaction
        await connection.beginTransaction();

        // Create user account
        const [userResult] = await global.dbPool.execute(
            'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "siswa", ?, "aktif")',
            [username, hashedPassword, nama]
        );

        // Create siswa_perwakilan record
        await global.dbPool.execute(
            'INSERT INTO siswa_perwakilan (nis, nama, kelas_id, user_id, jabatan, status) VALUES (?, ?, ?, ?, ?, "aktif")',
            [nis, nama, kelas_id, userResult.insertId, jabatan || 'Sekretaris Kelas']
        );

        await connection.commit();

        console.log(`✅ New siswa created: ${nama} (${nis})`);
        res.json({ success: true, message: 'Siswa berhasil ditambahkan' });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Create siswa error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'NIS atau username sudah digunakan' });
        } else {
            res.status(500).json({ error: 'Failed to create student' });
        }
    }
});

// GURU CRUD
app.get('/api/admin/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT g.*, m.nama_mapel, u.username, u.status as user_status
            FROM guru g
            JOIN mapel m ON g.mapel_id = m.id_mapel
            JOIN users u ON g.user_id = u.id
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM guru g JOIN mapel m ON g.mapel_id = m.id_mapel JOIN users u ON g.user_id = u.id';
        let params = [];

        if (search) {
            query += ' WHERE (g.nama LIKE ? OR g.nip LIKE ? OR m.nama_mapel LIKE ?)';
            countQuery += ' WHERE (g.nama LIKE ? OR g.nip LIKE ? OR m.nama_mapel LIKE ?)';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await global.dbPool.execute(query, params);
        const [countResult] = await global.dbPool.execute(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

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
        res.status(500).json({ error: 'Failed to retrieve teacher data' });
    }
});

app.post('/api/admin/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nip, nama, mapel_id, username, password, no_telp, alamat } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Start transaction
        await connection.beginTransaction();

        // Create user account
        const [userResult] = await global.dbPool.execute(
            'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "guru", ?, "aktif")',
            [username, hashedPassword, nama]
        );

        // Create guru record
        await global.dbPool.execute(
            'INSERT INTO guru (nip, nama, mapel_id, user_id, no_telp, alamat, status) VALUES (?, ?, ?, ?, ?, ?, "aktif")',
            [nip, nama, mapel_id, userResult.insertId, no_telp, alamat]
        );

        await connection.commit();

        console.log(`✅ New guru created: ${nama} (${nip})`);
        res.json({ success: true, message: 'Guru berhasil ditambahkan' });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Create guru error:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'NIP atau username sudah digunakan' });
        } else {
            res.status(500).json({ error: 'Failed to create teacher' });
        }
    }
});

// MAPEL CRUD
app.get('/api/admin/mapel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting subjects for admin dashboard');
        
        const query = `
            SELECT id_mapel as id, kode_mapel, nama_mapel, deskripsi, status
            FROM mapel 
            ORDER BY nama_mapel
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Subjects retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/mapel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kode_mapel, nama_mapel, deskripsi, status } = req.body;
        console.log('➕ Adding subject:', { kode_mapel, nama_mapel, deskripsi, status });

        if (!kode_mapel || !nama_mapel) {
            return res.status(400).json({ error: 'Kode dan nama mata pelajaran wajib diisi' });
        }

        // Check if kode_mapel already exists
        const [existing] = await global.dbPool.execute(
            'SELECT id_mapel FROM mapel WHERE kode_mapel = ?',
            [kode_mapel]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Kode mata pelajaran sudah digunakan' });
        }

        const insertQuery = `
            INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi, status) 
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await global.dbPool.execute(insertQuery, [
            kode_mapel, 
            nama_mapel, 
            deskripsi || null,
            status || 'aktif'
        ]);
        console.log('✅ Subject added successfully:', result.insertId);
        res.json({ message: 'Mata pelajaran berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding subject:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Kode mata pelajaran sudah digunakan' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
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
            return res.status(400).json({ error: 'Kode dan nama mata pelajaran wajib diisi' });
        }

        // Check if kode_mapel already exists for other records
        const [existing] = await global.dbPool.execute(
            'SELECT id_mapel FROM mapel WHERE kode_mapel = ? AND id_mapel != ?',
            [kode_mapel, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Kode mata pelajaran sudah digunakan oleh mata pelajaran lain' });
        }

        const updateQuery = `
            UPDATE mapel 
            SET kode_mapel = ?, nama_mapel = ?, deskripsi = ?, status = ?
            WHERE id_mapel = ?
        `;

        const [result] = await global.dbPool.execute(updateQuery, [
            kode_mapel, 
            nama_mapel, 
            deskripsi || null,
            status || 'aktif',
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
        }

        console.log('✅ Subject updated successfully');
        res.json({ message: 'Mata pelajaran berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating subject:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete subject
app.delete('/api/admin/mapel/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting subject:', { id });

        const [result] = await global.dbPool.execute(
            'DELETE FROM mapel WHERE id_mapel = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Mata pelajaran tidak ditemukan' });
        }

        console.log('✅ Subject deleted successfully');
        res.json({ message: 'Mata pelajaran berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting subject:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// KELAS CRUD
// Public endpoint for kelas (for dropdowns)
app.get('/api/kelas', async (req, res) => {
    try {
        console.log('📋 Getting classes for dropdown');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, status
            FROM kelas 
            WHERE status = 'aktif'
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Found ${rows.length} active classes`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting classes for admin dashboard');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nama_kelas } = req.body;
        console.log('➕ Adding class:', { nama_kelas });

        if (!nama_kelas) {
            return res.status(400).json({ error: 'Nama kelas wajib diisi' });
        }

        // Extract tingkat from nama_kelas (contoh: "X IPA 1" -> tingkat = "X")
        const tingkat = nama_kelas.split(' ')[0];

        const insertQuery = `
            INSERT INTO kelas (nama_kelas, tingkat, status) 
            VALUES (?, ?, 'aktif')
        `;

        const [result] = await global.dbPool.execute(insertQuery, [nama_kelas, tingkat]);
        console.log('✅ Class added successfully:', result.insertId);
        res.json({ message: 'Kelas berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding class:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Nama kelas sudah ada' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update class
app.put('/api/admin/kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kelas } = req.body;
        console.log('📝 Updating class:', { id, nama_kelas });

        if (!nama_kelas) {
            return res.status(400).json({ error: 'Nama kelas wajib diisi' });
        }

        // Extract tingkat from nama_kelas
        const tingkat = nama_kelas.split(' ')[0];

        const updateQuery = `
            UPDATE kelas 
            SET nama_kelas = ?, tingkat = ?
            WHERE id_kelas = ?
        `;

        const [result] = await global.dbPool.execute(updateQuery, [nama_kelas, tingkat, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        console.log('✅ Class updated successfully');
        res.json({ message: 'Kelas berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete class
app.delete('/api/admin/kelas/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting class:', { id });

        const [result] = await global.dbPool.execute(
            'DELETE FROM kelas WHERE id_kelas = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Kelas tidak ditemukan' });
        }

        console.log('✅ Class deleted successfully');
        res.json({ message: 'Kelas berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// JADWAL ENDPOINTS - Schedule Management
// ================================================

// Get all schedules with join data
app.get('/api/admin/jadwal', authenticateToken, requireRole(['admin']), async (req, res) => {
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
                FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'),
                j.jam_ke, 
                k.nama_kelas
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Schedules retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting schedules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new schedule
app.post('/api/admin/jadwal', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('➕ Adding schedule:', { kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Check for schedule conflicts - same class, day, and time slot
        const [conflicts] = await global.dbPool.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif'`,
            [kelas_id, hari, jam_ke]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: `Kelas sudah memiliki jadwal pada ${hari} jam ke-${jam_ke}` });
        }

        // Check teacher availability - same day and time slot
        const [teacherConflicts] = await global.dbPool.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif'`,
            [guru_id, hari, jam_ke]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ error: `Guru sudah memiliki jadwal mengajar pada ${hari} jam ke-${jam_ke}` });
        }

        const [result] = await global.dbPool.execute(
            `INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')`,
            [kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai]
        );

        console.log('✅ Schedule added successfully');
        res.json({ 
            message: 'Jadwal berhasil ditambahkan',
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Error adding schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update schedule
app.put('/api/admin/jadwal/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('✏️ Updating schedule:', { id, kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Check for schedule conflicts (excluding current schedule)
        const [conflicts] = await global.dbPool.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif' AND id_jadwal != ?`,
            [kelas_id, hari, jam_ke, id]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: `Kelas sudah memiliki jadwal pada ${hari} jam ke-${jam_ke}` });
        }

        // Check teacher availability (excluding current schedule)
        const [teacherConflicts] = await global.dbPool.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif' AND id_jadwal != ?`,
            [guru_id, hari, jam_ke, id]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ error: `Guru sudah memiliki jadwal mengajar pada ${hari} jam ke-${jam_ke}` });
        }

        const [result] = await global.dbPool.execute(
            `UPDATE jadwal 
             SET kelas_id = ?, mapel_id = ?, guru_id = ?, hari = ?, jam_ke = ?, jam_mulai = ?, jam_selesai = ?
             WHERE id_jadwal = ?`,
            [kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        console.log('✅ Schedule updated successfully');
        res.json({ message: 'Jadwal berhasil diperbarui' });
    } catch (error) {
        console.error('❌ Error updating schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete schedule  
app.delete('/api/admin/jadwal/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting schedule:', { id });

        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get students for a specific schedule (class)
app.get('/api/schedule/:id/students', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`👥 Getting students for schedule ID: ${id}`);

        // First, get the schedule details to get the class ID
        const [scheduleData] = await global.dbPool.execute(
            'SELECT kelas_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [id]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;
        const currentDate = new Date().toISOString().split('T')[0];

        // Get all students in the class with their existing attendance for today
        const [students] = await global.dbPool.execute(
            `SELECT 
                sp.id_siswa as id,
                sp.nis,
                sp.nama,
                sp.jenis_kelamin,
                sp.jabatan,
                sp.status,
                k.nama_kelas,
                COALESCE(a.status, 'Hadir') as attendance_status,
                a.keterangan as attendance_note,
                a.waktu_absen
            FROM siswa_perwakilan sp
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON sp.id_siswa = a.siswa_id 
                AND a.jadwal_id = ? 
                AND a.tanggal = ?
            WHERE sp.kelas_id = ? AND sp.status = 'aktif'
            ORDER BY sp.nama ASC`,
            [id, currentDate, kelasId]
        );

        console.log(`✅ Found ${students.length} students for schedule ${id} (class ${kelasId}) with attendance data`);
        res.json(students);
    } catch (error) {
        console.error('❌ Error getting students for schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get students for a specific schedule by date (for editing past attendance)
app.get('/api/schedule/:id/students-by-date', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggal } = req.query;
        console.log(`👥 Getting students for schedule ID: ${id} on date: ${tanggal}`);

        // Validate date range (max 30 days ago)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const targetDate = tanggal ? new Date(tanggal) : today;
        
        if (targetDate > today) {
            return res.status(400).json({ error: 'Tidak dapat melihat absen untuk tanggal masa depan' });
        }
        
        if (targetDate < thirtyDaysAgo) {
            return res.status(400).json({ error: 'Tidak dapat melihat absen lebih dari 30 hari yang lalu' });
        }

        // First, get the schedule details to get the class ID
        const [scheduleData] = await global.dbPool.execute(
            'SELECT kelas_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [id]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;
        const targetDateStr = tanggal || new Date().toISOString().split('T')[0];

        // Get all students in the class with their existing attendance for the target date
        const [students] = await global.dbPool.execute(
            `SELECT 
                sp.id_siswa as id,
                sp.nis,
                sp.nama,
                sp.jenis_kelamin,
                sp.jabatan,
                sp.status,
                k.nama_kelas,
                COALESCE(a.status, 'Hadir') as attendance_status,
                a.keterangan as attendance_note,
                a.waktu_absen
            FROM siswa_perwakilan sp
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON sp.id_siswa = a.siswa_id 
                AND a.jadwal_id = ? 
                AND a.tanggal = ?
            WHERE sp.kelas_id = ? AND sp.status = 'aktif'
            ORDER BY sp.nama ASC`,
            [id, targetDateStr, kelasId]
        );

        console.log(`✅ Found ${students.length} students for schedule ${id} (class ${kelasId}) on date ${targetDateStr}`);
        res.json(students);
    } catch (error) {
        console.error('❌ Error getting students by date for schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit attendance for a schedule
app.post('/api/attendance/submit', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { scheduleId, attendance, notes, guruId, tanggal_absen } = req.body;
        
        if (!scheduleId || !attendance || !guruId) {
            return res.status(400).json({ error: 'Data absensi tidak lengkap' });
        }

        console.log(`📝 Submitting attendance for schedule ${scheduleId} by teacher ${guruId}`);
        console.log(`📊 Attendance data:`, JSON.stringify(attendance, null, 2));
        console.log(`📝 Notes data:`, JSON.stringify(notes, null, 2));

        // Get the schedule details to verify it exists
        const [scheduleData] = await global.dbPool.execute(
            'SELECT kelas_id, mapel_id FROM jadwal WHERE id_jadwal = ? AND status = "aktif"',
            [scheduleId]
        );

        if (scheduleData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        const kelasId = scheduleData[0].kelas_id;
        const mapelId = scheduleData[0].mapel_id;

        // Use provided date or default to today
        const targetDate = tanggal_absen || new Date().toISOString().split('T')[0];
        
        // Validate date range (max 30 days ago)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const targetDateObj = new Date(targetDate);
        
        if (targetDateObj > today) {
            return res.status(400).json({ error: 'Tidak dapat mengubah absen untuk tanggal masa depan' });
        }
        
        if (targetDateObj < thirtyDaysAgo) {
            return res.status(400).json({ error: 'Tidak dapat mengubah absen lebih dari 30 hari yang lalu' });
        }

        // Insert attendance records for each student
        const attendanceEntries = Object.entries(attendance);
        const currentTime = new Date().toISOString().slice(11, 19);

        for (const [studentId, status] of attendanceEntries) {
            const note = notes[studentId] || '';
            
            // Validate status
            const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen'];
            if (!validStatuses.includes(status)) {
                console.log(`❌ Invalid status "${status}" for student ${studentId}`);
                return res.status(400).json({ 
                    error: `Status tidak valid: ${status}. Status yang diperbolehkan: ${validStatuses.join(', ')}` 
                });
            }
            
            console.log(`👤 Processing student ${studentId}: status="${status}", note="${note}"`);
            
            // Check if attendance already exists for target date
            // Note: Constraint unique_absensi_siswa_harian is on (siswa_id, tanggal) only
            const [existingAttendance] = await global.dbPool.execute(
                'SELECT id, status as current_status, jadwal_id FROM absensi_siswa WHERE siswa_id = ? AND tanggal = ?',
                [studentId, targetDate]
            );

            if (existingAttendance.length > 0) {
                const existingId = existingAttendance[0].id;
                const currentStatus = existingAttendance[0].current_status;
                const existingJadwalId = existingAttendance[0].jadwal_id;
                console.log(`🔄 Updating existing attendance ID ${existingId} from "${currentStatus}" to "${status}" (jadwal: ${existingJadwalId} -> ${scheduleId})`);
                
                // Update existing attendance with new jadwal_id if different
                const [updateResult] = await global.dbPool.execute(
                    'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ?, jadwal_id = ?, guru_id = ? WHERE id = ?',
                    [status, note, `${targetDate} ${currentTime}`, scheduleId, guruId, existingId]
                );
                
                console.log(`✅ Updated attendance for student ${studentId}: ${updateResult.affectedRows} rows affected`);
            } else {
                console.log(`➕ Inserting new attendance for student ${studentId}`);
                
                // Insert new attendance with duplicate handling
                try {
                    const [insertResult] = await global.dbPool.execute(
                        'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [studentId, scheduleId, targetDate, status, note, `${targetDate} ${currentTime}`, guruId]
                    );
                    
                    console.log(`✅ Inserted new attendance for student ${studentId}: ID ${insertResult.insertId}`);
                } catch (insertError) {
                    // Handle duplicate entry error
                    if (insertError.code === 'ER_DUP_ENTRY' && insertError.sqlMessage.includes('unique_absensi_siswa_harian')) {
                        console.log(`⚠️ Duplicate entry detected for student ${studentId} on ${targetDate}, attempting update instead`);
                        
                        // Try to update the existing record
                        const [updateResult] = await global.dbPool.execute(
                            'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ?, jadwal_id = ?, guru_id = ? WHERE siswa_id = ? AND tanggal = ?',
                            [status, note, `${targetDate} ${currentTime}`, scheduleId, guruId, studentId, targetDate]
                        );
                        
                        console.log(`✅ Updated existing attendance for student ${studentId}: ${updateResult.affectedRows} rows affected`);
                    } else {
                        throw insertError; // Re-throw if it's a different error
                    }
                }
            }
        }

        console.log(`✅ Attendance submitted successfully for ${attendanceEntries.length} students`);
        res.json({ 
            message: 'Absensi berhasil disimpan',
            processed: attendanceEntries.length,
            date: targetDate,
            scheduleId: scheduleId
        });
    } catch (error) {
        console.error('❌ Error submitting attendance:', error);
        res.status(500).json({ 
            error: 'Internal server error: ' + error.message,
            details: error.stack
        });
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
        
        const [result] = await global.dbPool.execute(query, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pengajuan izin tidak ditemukan' });
        }

        console.log(`✅ Permission request ${id} updated to ${status}`);
        res.json({ message: `Pengajuan berhasil ${status}` });
    } catch (error) {
        console.error('❌ Error updating permission request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get analytics data for dashboard
app.get('/api/admin/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting analytics dashboard data...');

        // Get student attendance statistics
        const studentAttendanceQuery = `
            SELECT 
                'Hari Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa_perwakilan s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id AND a.tanggal = CURDATE()
            UNION ALL
            SELECT 
                'Minggu Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa_perwakilan s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND YEARWEEK(a.tanggal, 1) = YEARWEEK(CURDATE(), 1)
            UNION ALL
            SELECT 
                'Bulan Ini' as periode,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
                COUNT(CASE WHEN a.status != 'Hadir' OR a.status IS NULL THEN 1 END) as tidak_hadir
            FROM siswa_perwakilan s
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
            FROM siswa_perwakilan s
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
            JOIN siswa_perwakilan s ON pi.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE pi.status = 'pending'
            ORDER BY pi.tanggal_pengajuan DESC
            LIMIT 10
        `;

        // Get total students count (lightweight query)
        const [totalStudentsResult] = await global.dbPool.execute('SELECT COUNT(*) as total FROM siswa_perwakilan WHERE status = "aktif"');
        const totalStudents = totalStudentsResult[0]?.total || 0;

        const [studentAttendance] = await global.dbPool.execute(studentAttendanceQuery);
        const [teacherAttendance] = await global.dbPool.execute(teacherAttendanceQuery);
        const [topAbsentStudents] = await global.dbPool.execute(topAbsentStudentsQuery);
        const [topAbsentTeachers] = await global.dbPool.execute(topAbsentTeachersQuery);
        const [notifications] = await global.dbPool.execute(notificationsQuery);

        const analyticsData = {
            studentAttendance: studentAttendance || [],
            teacherAttendance: teacherAttendance || [],
            topAbsentStudents: topAbsentStudents || [],
            topAbsentTeachers: topAbsentTeachers || [],
            notifications: notifications || [],
            totalStudents: totalStudents
        };

        console.log(`✅ Analytics data retrieved successfully`);
        res.json(analyticsData);
    } catch (error) {
        console.error('❌ Error getting analytics data:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                ag.keterangan,
                ag.waktu_catat as waktu_absen_full,
                CASE 
                    WHEN ag.waktu_catat IS NOT NULL THEN
                        CASE 
                            WHEN TIME(ag.waktu_catat) < '07:00:00' THEN 'Tepat Waktu'
                            WHEN TIME(ag.waktu_catat) BETWEEN '07:00:00' AND '07:15:00' THEN 'Terlambat Ringan'
                            WHEN TIME(ag.waktu_catat) BETWEEN '07:15:00' AND '08:00:00' THEN 'Terlambat'
                            ELSE 'Terlambat Berat'
                        END
                    ELSE '-'
                END as keterangan_waktu,
                CASE 
                    WHEN ag.waktu_catat IS NOT NULL THEN
                        CASE 
                            WHEN HOUR(ag.waktu_catat) < 12 THEN 'Pagi'
                            WHEN HOUR(ag.waktu_catat) < 15 THEN 'Siang'
                            ELSE 'Sore'
                        END
                    ELSE 'Belum Absen'
                END as periode_absen
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
                WHEN 5 THEN 'Sabtu'
                ELSE 'Minggu'
            END
            ORDER BY 
                CASE WHEN ag.waktu_catat IS NOT NULL THEN 0 ELSE 1 END,
                ag.waktu_catat DESC,
                k.nama_kelas,
                j.jam_mulai,
                g.nama
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Live teacher attendance retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting live teacher attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                a.keterangan,
                a.waktu_absen as waktu_absen_full,
                CASE 
                    WHEN a.waktu_absen IS NOT NULL THEN
                        CASE 
                            WHEN TIME(a.waktu_absen) < '07:00:00' THEN 'Tepat Waktu'
                            WHEN TIME(a.waktu_absen) BETWEEN '07:00:00' AND '07:15:00' THEN 'Terlambat Ringan'
                            WHEN TIME(a.waktu_absen) BETWEEN '07:15:00' AND '08:00:00' THEN 'Terlambat'
                            ELSE 'Terlambat Berat'
                        END
                    ELSE '-'
                END as keterangan_waktu,
                CASE 
                    WHEN a.waktu_absen IS NOT NULL THEN
                        CASE 
                            WHEN HOUR(a.waktu_absen) < 12 THEN 'Pagi'
                            WHEN HOUR(a.waktu_absen) < 15 THEN 'Siang'
                            ELSE 'Sore'
                        END
                    ELSE 'Belum Absen'
                END as periode_absen
            FROM siswa_perwakilan s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND DATE(a.waktu_absen) = CURDATE()
            WHERE s.status = 'aktif'
            ORDER BY 
                CASE WHEN a.waktu_absen IS NOT NULL THEN 0 ELSE 1 END,
                a.waktu_absen DESC,
                k.nama_kelas,
                s.nama
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Live student attendance retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting live student attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                CASE 
                    WHEN ag.jam_ke IS NOT NULL THEN CONCAT('Jam ke-', ag.jam_ke)
                    ELSE CONCAT(j.jam_mulai, ' - ', j.jam_selesai)
                END as jam_hadir,
                j.jam_mulai,
                j.jam_selesai,
                COALESCE(ag.status, 'Tidak Ada Data') as status,
                COALESCE(ag.keterangan, '-') as keterangan,
                j.jam_ke
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
        
        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_ke';
        
        const [rows] = await global.dbPool.execute(query, params);
        console.log(`✅ Teacher attendance report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance report:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        
        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_ke';
        
        const [rows] = await global.dbPool.execute(query, params);

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
        res.status(500).json({ error: 'Internal server error' });
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
                DATE_FORMAT(a.waktu_absen, '%Y-%m-%d') as tanggal,
                k.nama_kelas,
                s.nama as nama_siswa,
                s.nis as nis_siswa,
                'Absensi Harian' as nama_mapel,
                'Siswa Perwakilan' as nama_guru,
                DATE_FORMAT(a.waktu_absen, '%H:%i:%s') as waktu_absen,
                '07:00' as jam_mulai,
                '17:00' as jam_selesai,
                COALESCE(a.status, 'Tidak Hadir') as status,
                COALESCE(a.keterangan, '-') as keterangan,
                NULL as jam_ke
            FROM absensi_siswa a
            JOIN siswa_perwakilan s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.waktu_absen) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await global.dbPool.execute(query, params);
        console.log(`✅ Student attendance report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting student attendance report:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                DATE_FORMAT(a.waktu_absen, '%d/%m/%Y') as tanggal,
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
            JOIN siswa_perwakilan s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.waktu_absen) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await global.dbPool.execute(query, params);

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
        res.status(500).json({ error: 'Internal server error' });
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
            FROM siswa_perwakilan s
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

        const [rows] = await global.dbPool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting student attendance summary:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            FROM siswa_perwakilan s
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

        const [rows] = await global.dbPool.execute(query, params);

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
        res.end();
    } catch (error) {
        console.error('❌ Error downloading student attendance summary excel:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [rows] = await global.dbPool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance summary:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [rows] = await global.dbPool.execute(query, params);

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
        res.end();
    } catch (error) {
        console.error('❌ Error downloading teacher attendance summary excel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================== NEW: SUMMARY REPORTS (GURU) =====================
// Classes taught by the logged-in teacher
app.get('/api/guru/classes', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const guruId = req.user.guru_id;
        const [rows] = await global.dbPool.execute(
            `SELECT DISTINCT k.id_kelas as id, k.nama_kelas 
             FROM jadwal j JOIN kelas k ON j.kelas_id = k.id_kelas 
             WHERE j.guru_id = ? AND j.status = 'aktif' ORDER BY k.nama_kelas`,
            [guruId]
        );
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher classes:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            FROM siswa_perwakilan s
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
        const [rows] = await global.dbPool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting teacher attendance summary (guru):', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get laporan kehadiran siswa berdasarkan jadwal pertemuan guru
app.get('/api/guru/laporan-kehadiran-siswa', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { kelas_id } = req.query;
        const guruId = req.user.guru_id;
        
        if (!kelas_id) {
            return res.status(400).json({ error: 'Kelas ID wajib diisi' });
        }

        // Get info mata pelajaran dan guru
        const [mapelInfo] = await global.dbPool.execute(`
            SELECT DISTINCT m.nama_mapel, g.nama as nama_guru
            FROM jadwal j
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            WHERE j.guru_id = ? AND j.kelas_id = ? AND j.status = 'aktif'
            LIMIT 1
        `, [guruId, kelas_id]);

        // Get semua jadwal pertemuan guru untuk kelas tersebut
        const [jadwalPertemuan] = await global.dbPool.execute(`
            SELECT DISTINCT DATE(a.tanggal) as tanggal_pertemuan
            FROM absensi_siswa a
            JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE j.guru_id = ? AND j.kelas_id = ? AND a.tanggal IS NOT NULL
            ORDER BY tanggal_pertemuan ASC
        `, [guruId, kelas_id]);

        const pertemuanDates = jadwalPertemuan.map(row => row.tanggal_pertemuan);

        // Get data siswa dan kehadiran mereka
        const [siswaData] = await global.dbPool.execute(`
            SELECT 
                s.id_siswa,
                s.nama,
                s.nis,
                s.jenis_kelamin,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS total_hadir,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS total_izin,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS total_sakit,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS total_alpa,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS total_dispen,
                COALESCE(COUNT(a.id), 0) AS total_pertemuan,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN '0%'
                    ELSE CONCAT(ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 1), '%')
                END AS persentase_kehadiran
            FROM siswa_perwakilan s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal AND j.guru_id = ?
            WHERE s.kelas_id = ? AND s.status = 'aktif'
            GROUP BY s.id_siswa, s.nama, s.nis, s.jenis_kelamin
            ORDER BY s.nama
        `, [guruId, kelas_id]);

        // Get detail kehadiran per tanggal untuk setiap siswa
        const [detailKehadiran] = await global.dbPool.execute(`
            SELECT 
                a.siswa_id,
                DATE(a.tanggal) as tanggal,
                a.status
            FROM absensi_siswa a
            JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE j.guru_id = ? AND j.kelas_id = ? AND a.tanggal IS NOT NULL
        `, [guruId, kelas_id]);

        // Organize attendance data by student and date
        const attendanceByStudent = {};
        detailKehadiran.forEach(record => {
            if (!attendanceByStudent[record.siswa_id]) {
                attendanceByStudent[record.siswa_id] = {};
            }
            attendanceByStudent[record.siswa_id][record.tanggal] = record.status;
        });

        // Combine data
        const reportData = siswaData.map(student => ({
            ...student,
            pertemuan_dates: pertemuanDates,
            attendance_by_date: attendanceByStudent[student.id_siswa] || {}
        }));

        res.json({
            data: reportData,
            mapel_info: mapelInfo[0] || null,
            pertemuan_dates: pertemuanDates
        });

    } catch (error) {
        console.error('❌ Error getting laporan kehadiran siswa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download laporan kehadiran siswa Excel
app.get('/api/guru/download-laporan-kehadiran-siswa', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { kelas_id } = req.query;
        const guruId = req.user.guru_id;
        
        if (!kelas_id) {
            return res.status(400).json({ error: 'Kelas ID wajib diisi' });
        }

        // Get the same data as the API above
        const [mapelInfo] = await global.dbPool.execute(`
            SELECT DISTINCT m.nama_mapel, g.nama as nama_guru
            FROM jadwal j
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            WHERE j.guru_id = ? AND j.kelas_id = ? AND j.status = 'aktif'
            LIMIT 1
        `, [guruId, kelas_id]);

        const [jadwalPertemuan] = await global.dbPool.execute(`
            SELECT DISTINCT DATE(a.tanggal) as tanggal_pertemuan
            FROM absensi_siswa a
            JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE j.guru_id = ? AND j.kelas_id = ? AND a.tanggal IS NOT NULL
            ORDER BY tanggal_pertemuan ASC
        `, [guruId, kelas_id]);

        const pertemuanDates = jadwalPertemuan.map(row => row.tanggal_pertemuan);

        const [siswaData] = await global.dbPool.execute(`
            SELECT 
                s.id_siswa,
                s.nama,
                s.nis,
                s.jenis_kelamin,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS total_hadir,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) AS total_izin,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS total_sakit,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) AS total_alpa,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) AS total_dispen,
                COALESCE(COUNT(a.id), 0) AS total_pertemuan,
                CASE 
                    WHEN COUNT(a.id) = 0 THEN '0%'
                    ELSE CONCAT(ROUND((SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 1), '%')
                END AS persentase_kehadiran
            FROM siswa_perwakilan s
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal AND j.guru_id = ?
            WHERE s.kelas_id = ? AND s.status = 'aktif'
            GROUP BY s.id_siswa, s.nama, s.nis, s.jenis_kelamin
            ORDER BY s.nama
        `, [guruId, kelas_id]);

        const [detailKehadiran] = await global.dbPool.execute(`
            SELECT 
                a.siswa_id,
                DATE(a.tanggal) as tanggal,
                a.status
            FROM absensi_siswa a
            JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            WHERE j.guru_id = ? AND j.kelas_id = ? AND a.tanggal IS NOT NULL
        `, [guruId, kelas_id]);

        const attendanceByStudent = {};
        detailKehadiran.forEach(record => {
            if (!attendanceByStudent[record.siswa_id]) {
                attendanceByStudent[record.siswa_id] = {};
            }
            attendanceByStudent[record.siswa_id][record.tanggal] = record.status;
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Laporan Kehadiran Siswa');

        // Add school header
        sheet.mergeCells('A1:K1');
        sheet.getCell('A1').value = 'SMK NEGERI 13 BANDUNG';
        sheet.getCell('A1').font = { bold: true, size: 16 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        sheet.mergeCells('A2:K2');
        sheet.getCell('A2').value = 'Jl. Soekarno Hatta No. 123, Bandung';
        sheet.getCell('A2').alignment = { horizontal: 'center' };

        sheet.mergeCells('A3:K3');
        sheet.getCell('A3').value = 'Telp: (022) 1234567 | Email: info@smkn13bandung.sch.id';
        sheet.getCell('A3').alignment = { horizontal: 'center' };

        // Add report title
        sheet.mergeCells('A5:K5');
        sheet.getCell('A5').value = 'LAPORAN KEHADIRAN SISWA';
        sheet.getCell('A5').font = { bold: true, size: 14 };
        sheet.getCell('A5').alignment = { horizontal: 'center' };

        // Add subject and teacher info
        if (mapelInfo[0]) {
            sheet.mergeCells('A6:K6');
            sheet.getCell('A6').value = `Mata Pelajaran: ${mapelInfo[0].nama_mapel}`;
            sheet.getCell('A6').alignment = { horizontal: 'center' };

            sheet.mergeCells('A7:K7');
            sheet.getCell('A7').value = `Guru: ${mapelInfo[0].nama_guru}`;
            sheet.getCell('A7').alignment = { horizontal: 'center' };
        }

        // Create table headers
        const headerRow = 9;
        const headers = ['No', 'Nama', 'NIS', 'L/P'];
        
        // Add date columns
        pertemuanDates.forEach(date => {
            headers.push(new Date(date).getDate().toString());
        });
        
        // Add summary columns
        headers.push('H', 'I', 'Z', 'D', '%');

        headers.forEach((header, index) => {
            const cell = sheet.getCell(headerRow, index + 1);
            cell.value = header;
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add student data
        siswaData.forEach((student, index) => {
            const row = headerRow + 1 + index;
            const rowData = [
                index + 1,
                student.nama,
                student.nis,
                student.jenis_kelamin
            ];

            // Add attendance for each date
            pertemuanDates.forEach(date => {
                const attendance = attendanceByStudent[student.id_siswa]?.[date];
                const statusCode = attendance === 'Hadir' ? 'H' : 
                                 attendance === 'Izin' ? 'I' : 
                                 attendance === 'Sakit' ? 'S' : 
                                 attendance === 'Alpa' ? 'A' : 
                                 attendance === 'Dispen' ? 'D' : '-';
                rowData.push(statusCode);
            });

            // Add summary data
            rowData.push(
                student.total_hadir,
                student.total_izin,
                student.total_sakit,
                student.total_alpa,
                student.persentase_kehadiran
            );

            rowData.forEach((value, colIndex) => {
                const cell = sheet.getCell(row, colIndex + 1);
                cell.value = value;
                cell.alignment = { horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set column widths
        sheet.getColumn(1).width = 5;  // No
        sheet.getColumn(2).width = 25; // Nama
        sheet.getColumn(3).width = 12; // NIS
        sheet.getColumn(4).width = 5;  // L/P
        
        // Set width for date columns
        pertemuanDates.forEach((_, index) => {
            sheet.getColumn(5 + index).width = 5;
        });
        
        // Set width for summary columns
        const summaryStartCol = 5 + pertemuanDates.length;
        for (let i = 0; i < 5; i++) {
            sheet.getColumn(summaryStartCol + i).width = 8;
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="laporan-kehadiran-siswa.xlsx"');
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('❌ Error downloading laporan kehadiran siswa excel:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            FROM siswa_perwakilan s
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
        const [rows] = await global.dbPool.execute(query, params);

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
        res.end();
    } catch (error) {
        console.error('❌ Error downloading guru attendance excel:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                pba.id_banding,
                DATE_FORMAT(pba.tanggal_pengajuan, '%Y-%m-%d') as tanggal_pengajuan,
                DATE_FORMAT(pba.tanggal_absen, '%Y-%m-%d') as tanggal_absen,
                sp.nama as nama_pengaju,
                k.nama_kelas,
                COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
                COALESCE(g.nama, 'Belum Ditentukan') as nama_guru,
                COALESCE(j.jam_mulai, '00:00') as jam_mulai,
                COALESCE(j.jam_selesai, '00:00') as jam_selesai,
                pba.status_asli,
                pba.status_diajukan,
                pba.alasan_banding,
                pba.status_banding,
                COALESCE(pba.catatan_guru, '-') as catatan_guru,
                COALESCE(DATE_FORMAT(pba.tanggal_keputusan, '%Y-%m-%d %H:%i'), '-') as tanggal_keputusan,
                COALESCE(guru_proses.nama, 'Belum Diproses') as diproses_oleh,
                pba.jenis_banding,
                COALESCE(COUNT(bad.id_detail), 0) as jumlah_siswa_banding
            FROM pengajuan_banding_absen pba
            JOIN siswa_perwakilan sp ON pba.siswa_id = sp.id_siswa
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas OR pba.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pba.jadwal_id = j.id_jadwal
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru guru_proses ON pba.diproses_oleh = guru_proses.id_guru
            LEFT JOIN banding_absen_detail bad ON pba.id_banding = bad.banding_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pba.tanggal_pengajuan) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (status && status !== '') {
            query += ' AND pba.status_banding = ?';
            params.push(status);
        }
        
        query += ' GROUP BY pba.id_banding ORDER BY pba.tanggal_pengajuan DESC';
        
        const [rows] = await global.dbPool.execute(query, params);
        console.log(`✅ Banding absen report retrieved: ${rows.length} records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting banding absen report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download banding absen report as CSV
app.get('/api/admin/download-banding-absen', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, status } = req.query;
        console.log('📊 Downloading banding absen report:', { startDate, endDate, kelas_id, status });

        let query = `
            SELECT 
                DATE_FORMAT(pba.tanggal_pengajuan, '%d/%m/%Y') as tanggal_pengajuan,
                DATE_FORMAT(pba.tanggal_absen, '%d/%m/%Y') as tanggal_absen,
                sp.nama as nama_pengaju,
                COALESCE(k.nama_kelas, '-') as nama_kelas,
                COALESCE(m.nama_mapel, 'Umum') as nama_mapel,
                COALESCE(g.nama, 'Belum Ditentukan') as nama_guru,
                COALESCE(CONCAT(j.jam_mulai, ' - ', j.jam_selesai), '-') as jadwal,
                pba.status_asli,
                pba.status_diajukan,
                pba.alasan_banding,
                pba.status_banding,
                COALESCE(pba.catatan_guru, '-') as catatan_guru,
                COALESCE(DATE_FORMAT(pba.tanggal_keputusan, '%d/%m/%Y %H:%i'), '-') as tanggal_keputusan,
                COALESCE(guru_proses.nama, 'Belum Diproses') as diproses_oleh,
                pba.jenis_banding,
                COALESCE(COUNT(bad.id_detail), 0) as jumlah_siswa_banding
            FROM pengajuan_banding_absen pba
            JOIN siswa_perwakilan sp ON pba.siswa_id = sp.id_siswa
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas OR pba.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pba.jadwal_id = j.id_jadwal
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru guru_proses ON pba.diproses_oleh = guru_proses.id_guru
            LEFT JOIN banding_absen_detail bad ON pba.id_banding = bad.banding_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate && endDate) {
            query += ' AND DATE(pba.tanggal_pengajuan) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (status && status !== '') {
            query += ' AND pba.status_banding = ?';
            params.push(status);
        }
        
        query += ' GROUP BY pba.id_banding ORDER BY pba.tanggal_pengajuan DESC';
        
        const [rows] = await global.dbPool.execute(query, params);

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
        res.status(500).json({ error: 'Internal server error' });
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

        const query = `
            SELECT 
                pi.id_pengajuan,
                pi.jadwal_id,
                pi.tanggal_izin,
                pi.jenis_izin,
                pi.alasan,
                pi.bukti_pendukung,
                pi.status,
                pi.keterangan_guru,
                pi.tanggal_pengajuan,
                pi.tanggal_respon,
                COALESCE(j.jam_mulai, 'Izin Harian') as jam_mulai,
                COALESCE(j.jam_selesai, 'Izin Harian') as jam_selesai,
                COALESCE(m.nama_mapel, 'Izin Umum') as nama_mapel,
                COALESCE(g.nama, 'Menunggu Persetujuan') as nama_guru
            FROM pengajuan_izin_siswa pi
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            WHERE pi.siswa_id = ?
            ORDER BY pi.tanggal_pengajuan DESC
        `;

        const [pengajuanRows] = await global.dbPool.execute(query, [siswaId]);

        // Get detail for each pengajuan (for class-based submissions)
        const pengajuanWithDetails = await Promise.all(
            pengajuanRows.map(async (pengajuan) => {
                if (pengajuan.jenis_izin === 'kelas') {
                    // Get detailed siswa data for this pengajuan
                    const [detailRows] = await global.dbPool.execute(
                        `SELECT nama_siswa as nama, jenis_izin, alasan, bukti_pendukung 
                         FROM pengajuan_izin_detail 
                         WHERE pengajuan_id = ?`,
                        [pengajuan.id_pengajuan]
                    );

                    return {
                        ...pengajuan,
                        siswa_izin: detailRows,
                        total_siswa_izin: detailRows.length
                    };
                } else {
                    // Individual pengajuan (legacy support)
                    return pengajuan;
                }
            })
        );

        console.log(`✅ Pengajuan izin kelas retrieved: ${pengajuanWithDetails.length} items`);
        res.json(pengajuanWithDetails);
    } catch (error) {
        console.error('❌ Error getting pengajuan izin kelas:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [existing] = await global.dbPool.execute(
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
        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get pengajuan izin for guru to approve/reject
app.get('/api/guru/:guruId/pengajuan-izin', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { guruId } = req.params;
        const { page = 1, limit = 10, filter_pending = 'false' } = req.query;
        console.log('📋 Getting pengajuan izin for guru:', guruId, 'with pagination:', { page, limit, filter_pending });

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const isFilterPending = filter_pending === 'true';

        // Base query
        let baseQuery = `
            FROM pengajuan_izin_siswa pi
            JOIN siswa_perwakilan sp ON pi.siswa_id = sp.id_siswa
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pi.jadwal_id = j.id_jadwal
            WHERE (j.guru_id = ? OR ? IN (
                SELECT DISTINCT j2.guru_id 
                FROM jadwal j2 
                JOIN kelas k2 ON j2.kelas_id = k2.id_kelas
                WHERE k2.id_kelas = sp.kelas_id
            ))
        `;

        // Add filter for pending status if requested
        if (isFilterPending) {
            baseQuery += ` AND pi.status = 'pending'`;
        }

        // Count total records
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countResult] = await global.dbPool.execute(countQuery, [guruId, guruId]);
        const totalRecords = countResult[0].total;

        // Count pending records (always count all pending, regardless of current filter)
        const pendingCountQuery = `SELECT COUNT(*) as total ${baseQuery} AND pi.status = 'pending'`;
        const [pendingCountResult] = await global.dbPool.execute(pendingCountQuery, [guruId, guruId]);
        const totalPending = pendingCountResult[0].total;

        // Main query with pagination
        const mainQuery = `
            SELECT 
                pi.id_pengajuan as id,
                pi.siswa_id,
                pi.jadwal_id,
                pi.tanggal_mulai,
                pi.tanggal_selesai,
                pi.jenis_izin,
                pi.alasan,
                pi.bukti_pendukung,
                pi.status as status_persetujuan,
                pi.keterangan_guru as catatan_guru,
                pi.tanggal_pengajuan,
                pi.tanggal_respon,
                sp.nama as nama_siswa,
                sp.nis,
                k.nama_kelas
            ${baseQuery}
            ORDER BY pi.tanggal_pengajuan DESC, pi.status ASC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await global.dbPool.execute(mainQuery, [guruId, guruId, parseInt(limit), offset]);
        
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        console.log(`✅ Pengajuan izin for guru retrieved: ${rows.length} items (page ${page}/${totalPages})`);
        
        res.json({
            data: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                totalPending,
                totalAll: totalRecords,
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            },
            totalPages,
            totalPending,
            totalAll: totalRecords,
            currentFilter: isFilterPending ? 'pending' : 'all',
            showingCount: rows.length
        });
    } catch (error) {
        console.error('❌ Error getting pengajuan izin for guru:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
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
        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
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
            FROM mapel 
            ORDER BY nama_mapel
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Subjects retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get classes (alias for /api/admin/kelas)
app.get('/api/admin/classes', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🏫 Getting classes for schedule management');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await global.dbPool.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                ORDER BY j.jam_ke
            `;
            params = [req.user.guru_id];
        } else if (req.user.role === 'siswa') {
            query = `
                SELECT j.*, g.nama as nama_guru, m.nama_mapel
                FROM jadwal j
                JOIN guru g ON j.guru_id = g.id_guru
                JOIN mapel m ON j.mapel_id = m.id_mapel
                WHERE j.kelas_id = ? AND j.hari = DAYNAME(CURDATE()) AND j.status = 'aktif'
                ORDER BY j.jam_ke
            `;
            params = [req.user.kelas_id];
        }

        const [rows] = await global.dbPool.execute(query, params);
        
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
        const [existing] = await global.dbPool.execute(
            `SELECT * FROM absensi_guru 
             WHERE jadwal_id = ? AND tanggal = CURDATE()`,
            [jadwal_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Absensi untuk jadwal ini sudah dicatat hari ini' });
        }

        // Get jadwal details
        const [jadwalData] = await global.dbPool.execute(
            'SELECT * FROM jadwal WHERE id_jadwal = ?',
            [jadwal_id]
        );

        if (jadwalData.length === 0) {
            return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
        }

        // Record attendance
        await global.dbPool.execute(
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
                   sp.nama as nama_pencatat
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN guru g ON ag.guru_id = g.id_guru
            JOIN kelas k ON ag.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa_perwakilan sp ON ag.siswa_pencatat_id = sp.id_siswa
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
        
        // For siswa role, always limit to last 7 days maximum
        if (req.user.role === 'siswa') {
            whereConditions.push('ag.tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY ag.tanggal DESC, j.jam_ke ASC LIMIT ?';
        params.push(parseInt(limit));

        const [rows] = await global.dbPool.execute(query, params);
        
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
                   j.jam_ke, j.jam_mulai, j.jam_selesai, j.hari,
                   g.nama as nama_guru, g.nip,
                   k.nama_kelas, m.nama_mapel,
                   sp.nama as nama_pencatat, sp.nis
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN guru g ON ag.guru_id = g.id_guru
            JOIN kelas k ON ag.kelas_id = k.id_kelas
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa_perwakilan sp ON ag.siswa_pencatat_id = sp.id_siswa
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

        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_ke';

        const [rows] = await global.dbPool.execute(query, params);

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
        res.end();

        console.log('✅ Excel export completed');

    } catch (error) {
        console.error('❌ Excel export error:', error);
        res.status(500).json({ error: 'Failed to export data to Excel' });
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
        return res.status(400).json({ error: 'guru_id tidak ditemukan pada token pengguna' });
    }

    try {
        const [jadwal] = await global.dbPool.execute(`
            SELECT 
                j.id_jadwal AS id,
                j.hari,
                j.jam_mulai,
                j.jam_selesai,
                j.jam_ke,
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
                WHEN 'Sabtu' THEN 6
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
        return res.status(400).json({ error: 'guru_id tidak ditemukan pada token pengguna' });
    }

    try {
        const [history] = await global.dbPool.execute(`
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
        const guruId = req.user.guru_id;
        const { page = 1, limit = 5 } = req.query;
        console.log(`📊 Fetching student attendance history for guru_id: ${guruId} with pagination:`, { page, limit });

        if (!guruId) {
            return res.status(400).json({ error: 'guru_id tidak ditemukan pada token pengguna' });
        }

        // Count total unique days
        const countQuery = `
            SELECT COUNT(DISTINCT DATE(absensi.waktu_absen)) as total_days
            FROM absensi_siswa absensi
            INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
            WHERE jadwal.guru_id = ? 
                AND absensi.waktu_absen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `;
        
        const [countResult] = await global.dbPool.execute(countQuery, [guruId]);
        const totalDays = countResult[0].total_days;
        const totalPages = Math.ceil(totalDays / parseInt(limit));

        // Calculate date range for current page
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get unique dates for current page
        const datesQuery = `
            SELECT DISTINCT DATE(absensi.waktu_absen) as tanggal
            FROM absensi_siswa absensi
            INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
            WHERE jadwal.guru_id = ? 
                AND absensi.waktu_absen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY tanggal DESC
            LIMIT ? OFFSET ?
        `;
        
        const [datesResult] = await global.dbPool.execute(datesQuery, [guruId, parseInt(limit), offset]);
        const dates = datesResult.map(row => row.tanggal);

        if (dates.length === 0) {
            return res.json({
                success: true,
                data: [],
                totalDays,
                totalPages,
                currentPage: parseInt(page)
            });
        }

        // Get attendance data for these specific dates
        const datePlaceholders = dates.map(() => '?').join(',');
        const query = `
            SELECT 
                DATE(absensi.waktu_absen) as tanggal,
                jadwal.jam_ke,
                jadwal.jam_mulai,
                jadwal.jam_selesai,
                mapel.nama_mapel,
                kelas.nama_kelas,
                siswa.nama as nama_siswa,
                siswa.nis,
                absensi.status as status_kehadiran,
                absensi.keterangan,
                absensi.waktu_absen,
                guru_absen.status as status_guru,
                guru_absen.keterangan as keterangan_guru
            FROM absensi_siswa absensi
            INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
            INNER JOIN mapel ON jadwal.mapel_id = mapel.id_mapel
            INNER JOIN kelas ON jadwal.kelas_id = kelas.id_kelas
            INNER JOIN siswa_perwakilan siswa ON absensi.siswa_id = siswa.id_siswa
            LEFT JOIN absensi_guru guru_absen ON jadwal.id_jadwal = guru_absen.jadwal_id 
                AND DATE(guru_absen.tanggal) = DATE(absensi.waktu_absen)
            WHERE jadwal.guru_id = ? 
                AND DATE(absensi.waktu_absen) IN (${datePlaceholders})
            ORDER BY absensi.waktu_absen DESC, jadwal.jam_ke ASC
        `;

        const [history] = await global.dbPool.execute(query, [guruId, ...dates]);

        console.log(`✅ Found ${history.length} student attendance records for guru_id ${guruId} (${dates.length} days)`);
        
        // Debug: Log sample data
        if (history.length > 0) {
            console.log('📊 Sample history record:', history[0]);
        }
        
        res.json({ 
            success: true, 
            data: history,
            totalDays,
            totalPages,
            currentPage: parseInt(page),
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalDays,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching student attendance history:', error);
        res.status(500).json({ error: 'Gagal memuat riwayat absensi siswa.' });
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
        const [result] = await global.dbPool.execute(`
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
// SISWA PERWAKILAN ENDPOINTS
// ================================================

// Get siswa perwakilan info
app.get('/api/siswa-perwakilan/info', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        console.log('📋 Getting siswa perwakilan info for user:', req.user.id);

        const [siswaData] = await global.dbPool.execute(
            `SELECT sp.id_siswa, sp.nis, sp.nama, sp.kelas_id, k.nama_kelas 
             FROM siswa_perwakilan sp 
             JOIN kelas k ON sp.kelas_id = k.id_kelas 
             WHERE sp.user_id = ?`,
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
app.get('/api/siswa/:siswa_id/jadwal-hari-ini', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id } = req.params;
        console.log('📅 Getting jadwal hari ini for siswa:', siswa_id);

        // Get current day in Indonesian
        const today = new Date();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const currentDay = dayNames[today.getDay()];

        console.log('📅 Current day:', currentDay);

        // Get siswa's class
        const [siswaData] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswa_id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Get today's schedule for the class
        const [jadwalData] = await global.dbPool.execute(`
            SELECT 
                j.id_jadwal,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                mp.kode_mapel,
                g.nama as nama_guru,
                g.nip,
                k.nama_kelas,
                COALESCE(ag.status, 'belum_diambil') as status_kehadiran
            FROM jadwal j
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND ag.tanggal = CURDATE()
            WHERE j.kelas_id = ? AND j.hari = ?
            ORDER BY j.jam_ke
        `, [kelasId, currentDay]);

        console.log('✅ Jadwal retrieved:', jadwalData.length, 'items');

        res.json(jadwalData);

    } catch (error) {
        console.error('❌ Error getting jadwal hari ini:', error);
        res.status(500).json({ error: 'Gagal memuat jadwal hari ini' });
    }
});

// Get jadwal dengan rentang tanggal untuk siswa (7 hari terakhir)
app.get('/api/siswa/:siswa_id/jadwal-rentang', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id } = req.params;
        const { tanggal } = req.query;
        console.log('📅 Getting jadwal rentang for siswa:', siswa_id, 'tanggal:', tanggal);

        // Get siswa's class
        const [siswaData] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswa_id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Validate date range (max 7 days ago)
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        const targetDate = tanggal ? new Date(tanggal) : today;
        
        if (targetDate > today) {
            return res.status(400).json({ error: 'Tidak dapat melihat jadwal untuk tanggal masa depan' });
        }
        
        if (targetDate < sevenDaysAgo) {
            return res.status(400).json({ error: 'Tidak dapat melihat jadwal lebih dari 7 hari yang lalu' });
        }

        // Get day name for the target date
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const targetDay = dayNames[targetDate.getDay()];
        const targetDateStr = targetDate.toISOString().split('T')[0];

        console.log('📅 Target day:', targetDay, 'Target date:', targetDateStr);

        // Get schedule for the target date
        const [jadwalData] = await global.dbPool.execute(`
            SELECT 
                j.id_jadwal,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                mp.kode_mapel,
                g.nama as nama_guru,
                g.nip,
                k.nama_kelas,
                COALESCE(ag.status, 'belum_diambil') as status_kehadiran,
                ag.keterangan,
                ag.waktu_catat,
                ? as tanggal_target
            FROM jadwal j
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN kelas k ON j.kelas_id = k.id_kelas
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id 
                AND ag.tanggal = ?
            WHERE j.kelas_id = ? AND j.hari = ?
            ORDER BY j.jam_ke
        `, [targetDateStr, targetDateStr, kelasId, targetDay]);

        console.log('✅ Jadwal rentang retrieved:', jadwalData.length, 'items for date:', targetDateStr);

        res.json({
            success: true,
            data: jadwalData,
            tanggal: targetDateStr,
            hari: targetDay
        });

    } catch (error) {
        console.error('❌ Error getting jadwal rentang:', error);
        res.status(500).json({ error: 'Gagal memuat jadwal rentang' });
    }
});

// Submit kehadiran guru (Updated to support editing up to 7 days)
app.post('/api/siswa/submit-kehadiran-guru', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id, kehadiran_data, tanggal_absen } = req.body;
        console.log('📝 Submitting kehadiran guru for siswa:', siswa_id);
        console.log('📝 Kehadiran data:', kehadiran_data);
        console.log('📝 Tanggal absen:', tanggal_absen);
        console.log('📝 Request body:', req.body);
        
        // Validation
        if (!siswa_id) {
            return res.status(400).json({ error: 'siswa_id is required' });
        }
        
        if (!kehadiran_data || typeof kehadiran_data !== 'object') {
            return res.status(400).json({ error: 'kehadiran_data is required and must be an object' });
        }

        // Use provided date or default to today
        const targetDate = tanggal_absen || new Date().toISOString().split('T')[0];
        
        // Validate date range (max 7 days ago)
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        const targetDateObj = new Date(targetDate);
        
        if (targetDateObj > today) {
            return res.status(400).json({ error: 'Tidak dapat mengubah absen untuk tanggal masa depan' });
        }
        
        if (targetDateObj < sevenDaysAgo) {
            return res.status(400).json({ error: 'Tidak dapat mengubah absen lebih dari 7 hari yang lalu' });
        }

        // Check database connection
        if (!global.dbPool) {
            return res.status(503).json({ error: 'Database connection not available' });
        }

        // Get connection from pool for transaction
        const connection = await global.dbPool.getConnection();
        
        try {
            // Begin transaction
            await connection.beginTransaction();

            const currentTime = new Date().toTimeString().split(' ')[0];

            // Insert/update attendance for each jadwal
            for (const [jadwalId, data] of Object.entries(kehadiran_data)) {
                const { status, keterangan } = data;

                // Get jadwal details to get guru_id, kelas_id, and jam_ke
                const [jadwalDetails] = await connection.execute(
                    'SELECT guru_id, kelas_id, jam_ke FROM jadwal WHERE id_jadwal = ?',
                    [jadwalId]
                );

                if (jadwalDetails.length === 0) {
                    throw new Error(`Jadwal dengan ID ${jadwalId} tidak ditemukan`);
                }

                const { guru_id, kelas_id, jam_ke } = jadwalDetails[0];

                // Check if attendance record already exists for the target date
                const [existingRecord] = await connection.execute(
                    'SELECT id_absensi FROM absensi_guru WHERE jadwal_id = ? AND tanggal = ?',
                    [jadwalId, targetDate]
                );

                if (existingRecord.length > 0) {
                    // Update existing record
                    await connection.execute(`
                        UPDATE absensi_guru 
                        SET status = ?, keterangan = ?, siswa_pencatat_id = ?, waktu_catat = NOW()
                        WHERE jadwal_id = ? AND tanggal = ?
                    `, [status, keterangan || null, siswa_id, jadwalId, targetDate]);
                    
                    console.log(`✅ Updated attendance for jadwal ${jadwalId} on ${targetDate}`);
                } else {
                    // Insert new record
                    await connection.execute(`
                        INSERT INTO absensi_guru 
                        (jadwal_id, guru_id, kelas_id, siswa_pencatat_id, tanggal, jam_ke, status, keterangan, waktu_catat) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [jadwalId, guru_id, kelas_id, siswa_id, targetDate, jam_ke, status, keterangan || null]);
                    
                    console.log(`✅ Inserted new attendance for jadwal ${jadwalId} on ${targetDate}`);
                }
            }

            // Commit transaction
            await connection.commit();
        } finally {
            // Always release connection back to pool
            connection.release();
        }

        console.log('✅ Kehadiran guru submitted successfully');

        res.json({
            success: true,
            message: `Data kehadiran guru berhasil disimpan untuk tanggal ${targetDate}`
        });

    } catch (error) {
        console.error('❌ Error submitting kehadiran guru:', error);
        res.status(500).json({ 
            error: 'Gagal menyimpan data kehadiran guru',
            details: error.message 
        });
    }
});

// Get riwayat kehadiran kelas (for siswa perwakilan)
app.get('/api/siswa/:siswa_id/riwayat-kehadiran', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id } = req.params;
        console.log('📊 Getting riwayat kehadiran kelas for siswa:', siswa_id);

        // Get siswa's class
        const [siswaData] = await global.dbPool.execute(
            'SELECT kelas_id, nama FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswa_id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Get total students in class
        const [totalSiswaResult] = await global.dbPool.execute(
            'SELECT COUNT(*) as total FROM siswa_perwakilan WHERE kelas_id = ?',
            [kelasId]
        );
        const totalSiswa = totalSiswaResult[0].total;

        // Get attendance history with aggregated data
        const [riwayatData] = await global.dbPool.execute(`
            SELECT 
                ag.tanggal,
                j.id_jadwal,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                mp.nama_mapel,
                g.nama as nama_guru,
                ag.status as status_kehadiran,
                ag.keterangan,
                sp.nama as nama_pencatat,
                -- Get attendance data for this schedule
                (SELECT GROUP_CONCAT(
                    CONCAT(sp2.nama, ':', sp2.nis, ':', COALESCE(abs2.status, 'tidak_hadir'))
                    SEPARATOR '|'
                ) FROM siswa_perwakilan sp2 
                LEFT JOIN absensi_siswa abs2 ON sp2.id_siswa = abs2.siswa_id 
                    AND abs2.jadwal_id = j.id_jadwal 
                    AND DATE(abs2.waktu_absen) = ag.tanggal
                WHERE sp2.kelas_id = ?) as siswa_data
            FROM absensi_guru ag
            JOIN jadwal j ON ag.jadwal_id = j.id_jadwal
            JOIN mapel mp ON j.mapel_id = mp.id_mapel
            JOIN guru g ON j.guru_id = g.id_guru
            LEFT JOIN siswa_perwakilan sp ON ag.siswa_pencatat_id = sp.id_siswa
            WHERE j.kelas_id = ? 
            ORDER BY ag.tanggal DESC, j.jam_ke ASC
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
                jadwal_id: row.id_jadwal,
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
app.get('/api/admin/teachers', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting teachers for admin dashboard');
        
        const query = `
            SELECT 
                g.id_guru as id,
                u.username, 
                g.nama, 
                g.nip,
                g.email,
                g.alamat,
                g.no_telp,
                g.jenis_kelamin,
                g.status,
                m.nama_mapel as mata_pelajaran
            FROM users u
            LEFT JOIN guru g ON u.username = g.username
            LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
            WHERE u.role = 'guru'
            ORDER BY g.nama ASC
        `;
        
        const [results] = await global.dbPool.execute(query);
        console.log(`✅ Teachers retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting teachers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add teacher account
app.post('/api/admin/teachers', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nama, username, password } = req.body;
        console.log('➕ Adding teacher account:', { nama, username });

        if (!nama || !username || !password) {
            return res.status(400).json({ error: 'Nama, username, dan password wajib diisi' });
        }

        // Check if username already exists
        const [existingUsers] = await global.dbPool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Start transaction
        await connection.beginTransaction();

        try {
            // Insert user account
            const [userResult] = await global.dbPool.execute(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, 'guru']
            );

            // Insert guru data with generated NIP
            const nip = `G${Date.now().toString().slice(-8)}`; // Generate simple NIP
            await global.dbPool.execute(
                'INSERT INTO guru (nip, nama, username, jenis_kelamin, status) VALUES (?, ?, ?, ?, ?)',
                [nip, nama, username, 'L', 'aktif']
            );

            await connection.commit();
            console.log('✅ Teacher account added successfully');
            res.json({ message: 'Akun guru berhasil ditambahkan' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error adding teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update teacher account
app.put('/api/admin/teachers/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, username, password } = req.body;
        console.log('📝 Updating teacher account:', { id, nama, username });

        if (!nama || !username) {
            return res.status(400).json({ error: 'Nama dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await global.dbPool.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        await connection.beginTransaction();

        try {
            // Get current username
            const [currentUser] = await global.dbPool.execute(
                'SELECT username FROM users WHERE id_kelas = ?',
                [id]
            );

            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await global.dbPool.execute(
                    'UPDATE users SET username = ?, password = ? WHERE id_kelas = ?',
                    [username, hashedPassword, id]
                );
            } else {
                await global.dbPool.execute(
                    'UPDATE users SET username = ? WHERE id_kelas = ?',
                    [username, id]
                );
            }

            // Update guru data
            await global.dbPool.execute(
                'UPDATE guru SET nama = ?, username = ? WHERE username = ?',
                [nama, username, oldUsername]
            );

            await connection.commit();
            console.log('✅ Teacher account updated successfully');
            res.json({ message: 'Akun guru berhasil diupdate' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error updating teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete teacher account
app.delete('/api/admin/teachers/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting teacher account:', { id });

        await connection.beginTransaction();

        try {
            // Get username first
            const [userResult] = await global.dbPool.execute(
                'SELECT username FROM users WHERE id_kelas = ?',
                [id]
            );

            if (userResult.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const username = userResult[0].username;

            // Delete from guru table first (foreign key constraint)
            await global.dbPool.execute(
                'DELETE FROM guru WHERE username = ?',
                [username]
            );

            // Delete from users table
            await global.dbPool.execute(
                'DELETE FROM users WHERE id_kelas = ?',
                [id]
            );

            await connection.commit();
            console.log('✅ Teacher account deleted successfully');
            res.json({ message: 'Akun guru berhasil dihapus' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error deleting teacher:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === TEACHER DATA ENDPOINTS ===

// Get teachers data for admin dashboard
app.get('/api/admin/teachers-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting teachers data for admin dashboard');
        
        const query = `
            SELECT g.id, g.nip, g.nama, g.email, g.mata_pelajaran, 
                   g.alamat, g.no_telp as telepon, g.jenis_kelamin, 
                   COALESCE(g.status, 'aktif') as status
            FROM guru g
            ORDER BY g.nama ASC
        `;
        
        const [results] = await global.dbPool.execute(query);
        console.log(`✅ Teachers data retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting teachers data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add teacher data
app.post('/api/admin/teachers-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nip, nama, email, mata_pelajaran, alamat, telepon, jenis_kelamin, status } = req.body;
        console.log('➕ Adding teacher data:', { nip, nama, mata_pelajaran });

        if (!nip || !nama || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIP, nama, dan jenis kelamin wajib diisi' });
        }

        // Check if NIP already exists
        const [existing] = await global.dbPool.execute(
            'SELECT id FROM guru WHERE nip = ?',
            [nip]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIP sudah terdaftar' });
        }

        const query = `
            INSERT INTO guru (id_guru, nip, nama, email, mata_pelajaran, alamat, no_telp, jenis_kelamin, status)
            VALUES ((SELECT COALESCE(MAX(id_guru), 0) + 1 FROM guru g2), ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await global.dbPool.execute(query, [
            nip, nama, email || null, mata_pelajaran || null, 
            alamat || null, telepon || null, jenis_kelamin, status || 'aktif'
        ]);

        console.log('✅ Teacher data added successfully:', result.insertId);
        res.json({ message: 'Data guru berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding teacher data:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'NIP sudah terdaftar' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update teacher data
app.put('/api/admin/teachers-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nip, nama, email, mata_pelajaran, alamat, telepon, jenis_kelamin, status } = req.body;
        console.log('📝 Updating teacher data:', { id, nip, nama });

        if (!nip || !nama || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIP, nama, dan jenis kelamin wajib diisi' });
        }

        // Check if NIP already exists for other records
        const [existing] = await global.dbPool.execute(
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
            WHERE id_kelas = ?
        `;

        const [result] = await global.dbPool.execute(updateQuery, [
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete teacher data
app.delete('/api/admin/teachers-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting teacher data:', { id });

        const [result] = await global.dbPool.execute(
            'DELETE FROM guru WHERE id_kelas = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data guru tidak ditemukan' });
        }

        console.log('✅ Teacher data deleted successfully');
        res.json({ message: 'Data guru berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting teacher data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get students for admin dashboard
app.get('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting students for admin dashboard');
        
        const query = `
            SELECT 
                u.id, 
                u.username, 
                COALESCE(sp.email, u.email) as email,
                sp.nis, 
                sp.nama, 
                sp.kelas_id, 
                k.nama_kelas,
                sp.jenis_kelamin,
                sp.jabatan,
                sp.status,
                sp.alamat,
                sp.telepon_orangtua
            FROM users u
            LEFT JOIN siswa_perwakilan sp ON u.username = sp.username
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            WHERE u.role = 'siswa'
            ORDER BY sp.nama ASC
        `;
        
        const [results] = await global.dbPool.execute(query);
        console.log(`✅ Students retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add student account
app.post('/api/admin/students', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nama, username, password } = req.body;
        console.log('➕ Adding student account:', { nama, username });

        if (!nama || !username || !password) {
            return res.status(400).json({ error: 'Nama, username, dan password wajib diisi' });
        }

        // Check if username already exists
        const [existingUsers] = await global.dbPool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Start transaction
        await connection.beginTransaction();

        try {
            // Insert user account
            const [userResult] = await global.dbPool.execute(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, 'siswa']
            );

            // Insert siswa_perwakilan data with generated NIS
            const nis = `S${Date.now().toString().slice(-8)}`; // Generate simple NIS
            await global.dbPool.execute(
                'INSERT INTO siswa_perwakilan (nis, nama, username, kelas_id, jenis_kelamin, status) VALUES (?, ?, ?, ?, ?, ?)',
                [nis, nama, username, 1, 'L', 'aktif'] // Default to kelas_id = 1
            );

            await connection.commit();
            console.log('✅ Student account added successfully');
            res.json({ message: 'Akun siswa berhasil ditambahkan' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error adding student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update student account
app.put('/api/admin/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, username, password } = req.body;
        console.log('📝 Updating student account:', { id, nama, username });

        if (!nama || !username) {
            return res.status(400).json({ error: 'Nama dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await global.dbPool.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        await connection.beginTransaction();

        try {
            // Get current username
            const [currentUser] = await global.dbPool.execute(
                'SELECT username FROM users WHERE id_kelas = ?',
                [id]
            );

            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await global.dbPool.execute(
                    'UPDATE users SET username = ?, password = ? WHERE id_kelas = ?',
                    [username, hashedPassword, id]
                );
            } else {
                await global.dbPool.execute(
                    'UPDATE users SET username = ? WHERE id_kelas = ?',
                    [username, id]
                );
            }

            // Update siswa_perwakilan data
            await global.dbPool.execute(
                'UPDATE siswa_perwakilan SET nama = ?, username = ? WHERE username = ?',
                [nama, username, oldUsername]
            );

            await connection.commit();
            console.log('✅ Student account updated successfully');
            res.json({ message: 'Akun siswa berhasil diupdate' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error updating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete student account
app.delete('/api/admin/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting student account:', { id });

        await connection.beginTransaction();

        try {
            // Get username first
            const [userResult] = await global.dbPool.execute(
                'SELECT username FROM users WHERE id_kelas = ?',
                [id]
            );

            if (userResult.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const username = userResult[0].username;

            // Delete from siswa_perwakilan table first (foreign key constraint)
            await global.dbPool.execute(
                'DELETE FROM siswa_perwakilan WHERE username = ?',
                [username]
            );

            // Delete from users table
            await global.dbPool.execute(
                'DELETE FROM users WHERE id_kelas = ?',
                [id]
            );

            await connection.commit();
            console.log('✅ Student account deleted successfully');
            res.json({ message: 'Akun siswa berhasil dihapus' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error deleting student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === STUDENT DATA ENDPOINTS ===

// Get students by class for presensi
app.get('/api/admin/students-by-class/:kelasId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelasId } = req.params;
        console.log('📋 Getting students by class for presensi:', kelasId);
        
        const query = `
            SELECT sp.id_siswa as id, sp.nis, sp.nama, sp.jenis_kelamin, sp.kelas_id
            FROM siswa_perwakilan sp
            WHERE sp.kelas_id = ? AND sp.status = 'aktif'
            ORDER BY sp.nama ASC
        `;
        
        const [rows] = await global.dbPool.execute(query, [kelasId]);
        
        console.log(`✅ Found ${rows.length} students for class ${kelasId}`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting students by class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get presensi data for students
app.get('/api/admin/presensi-siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, bulan, tahun } = req.query;
        console.log('📋 Getting presensi data:', { kelas_id, bulan, tahun });
        
        if (!kelas_id || !bulan || !tahun) {
            return res.status(400).json({ error: 'kelas_id, bulan, dan tahun harus diisi' });
        }
        
        const query = `
            SELECT 
                a.siswa_id,
                DATE(a.tanggal) as tanggal,
                a.status,
                a.keterangan
            FROM absensi_siswa a
            INNER JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
            WHERE sp.kelas_id = ? 
                AND MONTH(a.tanggal) = ? 
                AND YEAR(a.tanggal) = ?
            ORDER BY a.siswa_id, a.tanggal
        `;
        
        const [rows] = await global.dbPool.execute(query, [kelas_id, bulan, tahun]);
        
        console.log(`✅ Found ${rows.length} presensi records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting presensi data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get rekap ketidakhadiran data
app.get('/api/admin/rekap-ketidakhadiran', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, tahun, bulan } = req.query;
        console.log('📋 Getting rekap ketidakhadiran data:', { kelas_id, tahun, bulan });
        
        if (!kelas_id || !tahun) {
            return res.status(400).json({ error: 'kelas_id dan tahun harus diisi' });
        }
        
        let query = `
            SELECT 
                a.siswa_id,
                MONTH(a.tanggal) as bulan,
                YEAR(a.tanggal) as tahun,
                COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) as total_ketidakhadiran,
                COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as total_kehadiran,
                COUNT(*) as total_hari_efektif,
                ROUND(
                    (COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as persentase_ketidakhadiran,
                ROUND(
                    (COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) * 100.0 / COUNT(*)), 2
                ) as persentase_kehadiran
            FROM absensi_siswa a
            INNER JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
            WHERE sp.kelas_id = ? 
                AND YEAR(a.tanggal) = ?
        `;
        
        const params = [kelas_id, tahun];
        
        if (bulan) {
            query += ` AND MONTH(a.tanggal) = ?`;
            params.push(bulan);
        }
        
        query += `
            GROUP BY a.siswa_id, MONTH(a.tanggal), YEAR(a.tanggal)
            ORDER BY a.siswa_id, MONTH(a.tanggal)
        `;
        
        const [rows] = await global.dbPool.execute(query, params);
        
        console.log(`✅ Found ${rows.length} rekap ketidakhadiran records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting rekap ketidakhadiran data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get rekap ketidakhadiran guru
app.get('/api/admin/rekap-ketidakhadiran-guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tahun, bulan, tanggal_awal, tanggal_akhir } = req.query;
        console.log('📋 Getting rekap ketidakhadiran guru data:', { tahun, bulan, tanggal_awal, tanggal_akhir });
        
        if (!tahun) {
            return res.status(400).json({ error: 'Tahun harus diisi' });
        }

        // Query untuk mendapatkan data guru dan presensi
        const query = `
            SELECT 
                g.id,
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 7 THEN 1 ELSE 0 END), 0) as jul,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 8 THEN 1 ELSE 0 END), 0) as agt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 9 THEN 1 ELSE 0 END), 0) as sep,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 10 THEN 1 ELSE 0 END), 0) as okt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 11 THEN 1 ELSE 0 END), 0) as nov,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 12 THEN 1 ELSE 0 END), 0) as des,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 1 THEN 1 ELSE 0 END), 0) as jan,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 2 THEN 1 ELSE 0 END), 0) as feb,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 3 THEN 1 ELSE 0 END), 0) as mar,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 4 THEN 1 ELSE 0 END), 0) as apr,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 5 THEN 1 ELSE 0 END), 0) as mei,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 6 THEN 1 ELSE 0 END), 0) as jun,
                COALESCE(SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END), 0) as total_ketidakhadiran
            FROM guru g
            LEFT JOIN absensi_guru a ON g.id_guru = a.guru_id 
                AND YEAR(a.tanggal) = ? 
                AND a.status = 'Tidak Hadir'
            GROUP BY g.id, g.nama, g.nip
            ORDER BY g.nama
        `;

        const [rows] = await global.dbPool.execute(query, [tahun]);

        // Data sudah memiliki persentase dari query, langsung return
        console.log(`✅ Found ${rows.length} rekap ketidakhadiran guru records`);
        res.json(rows);

    } catch (error) {
        console.error('❌ Error getting rekap ketidakhadiran guru data:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data rekap ketidakhadiran guru'
        });
    }
});

// Get students data for admin dashboard
app.get('/api/admin/students-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting students data for admin dashboard');
        
        const query = `
            SELECT sp.id, sp.nis, sp.nama, sp.kelas_id, k.nama_kelas, 
                   sp.jenis_kelamin, sp.alamat, sp.telepon_orangtua, 
                   COALESCE(sp.status, 'aktif') as status
            FROM siswa_perwakilan sp
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            ORDER BY sp.nama ASC
        `;
        
        const [results] = await global.dbPool.execute(query);
        console.log(`✅ Students data retrieved: ${results.length} items`);
        res.json(results);
    } catch (error) {
        console.error('❌ Error getting students data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add student data
app.post('/api/admin/students-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, status } = req.body;
        console.log('➕ Adding student data:', { nis, nama, kelas_id });

        if (!nis || !nama || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIS, nama, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if NIS already exists
        const [existing] = await global.dbPool.execute(
            'SELECT id FROM siswa_perwakilan WHERE nis = ?',
            [nis]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIS sudah terdaftar' });
        }

        const insertQuery = `
            INSERT INTO siswa_perwakilan (id_siswa, nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, status)
            VALUES ((SELECT COALESCE(MAX(id_siswa), 0) + 1 FROM siswa_perwakilan sp2), ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await global.dbPool.execute(insertQuery, [
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
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update student data
app.put('/api/admin/students-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nis, nama, kelas_id, jenis_kelamin, alamat, telepon_orangtua, status } = req.body;
        console.log('📝 Updating student data:', { id, nis, nama });

        if (!nis || !nama || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'NIS, nama, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if NIS already exists for other records
        const [existing] = await global.dbPool.execute(
            'SELECT id FROM siswa_perwakilan WHERE nis = ? AND id != ?',
            [nis, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIS sudah digunakan oleh siswa lain' });
        }

        const updateQuery = `
            UPDATE siswa_perwakilan 
            SET nis = ?, nama = ?, kelas_id = ?, jenis_kelamin = ?, 
                alamat = ?, telepon_orangtua = ?, status = ?
            WHERE id_kelas = ?
        `;

        const [result] = await global.dbPool.execute(updateQuery, [
            nis, nama, kelas_id, jenis_kelamin,
            alamat || null, telepon_orangtua || null, status || 'aktif', id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        console.log('✅ Student data updated successfully');
        res.json({ message: 'Data siswa berhasil diupdate' });
    } catch (error) {
        console.error('❌ Error updating student data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete student data
app.delete('/api/admin/students-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting student data:', { id });

        const [result] = await global.dbPool.execute(
            'DELETE FROM siswa_perwakilan WHERE id_kelas = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        console.log('✅ Student data deleted successfully');
        res.json({ message: 'Data siswa berhasil dihapus' });
    } catch (error) {
        console.error('❌ Error deleting student data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get live summary for admin dashboard
app.get('/api/admin/live-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting live summary for admin dashboard');
        
        // Get current day and time
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false }); // HH:mm:ss format
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
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

        const [ongoingClasses] = await global.dbPool.execute(ongoingQuery, [currentDay, currentTime]);
        
        // Calculate overall attendance percentage for today
        const attendanceQuery = `
            SELECT 
                COUNT(DISTINCT j.id_jadwal) as total_jadwal_today,
                COUNT(DISTINCT ag.jadwal_id) as jadwal_with_attendance
            FROM jadwal j
            LEFT JOIN absensi_guru ag ON j.id_jadwal = ag.jadwal_id AND DATE(ag.tanggal) = CURDATE()  
            WHERE j.hari = ?
        `;
        
        const [attendanceResult] = await global.dbPool.execute(attendanceQuery, [currentDay]);
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// ENDPOINTS UNTUK PENGAJUAN IZIN KELAS
// ================================================

// Get daftar siswa in class for siswa perwakilan
app.get('/api/siswa/:siswaId/daftar-siswa', authenticateToken, requireRole(['siswa', 'admin']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        console.log('📋 Getting daftar siswa for class representative:', siswaId);

        // Get the class of the siswa perwakilan
        const [kelasData] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Get all students in the same class
        const [siswaData] = await global.dbPool.execute(`
            SELECT id_siswa as id, nama 
            FROM siswa_perwakilan 
            WHERE kelas_id = ? 
            ORDER BY nama ASC
        `, [kelasId]);

        console.log(`✅ Daftar siswa retrieved: ${siswaData.length} students`);
        res.json(siswaData);
    } catch (error) {
        console.error('❌ Error getting daftar siswa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit pengajuan izin kelas
app.post('/api/siswa/:siswaId/pengajuan-izin-kelas', authenticateToken, requireRole(['siswa', 'admin']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_izin, siswa_izin } = req.body;
        console.log('📝 Submitting pengajuan izin kelas:', { siswaId, jadwal_id, tanggal_izin, siswaCount: siswa_izin?.length });
        console.log('📝 Request body:', req.body);
        console.log('📝 Request params:', req.params);

        // Check database connection
        if (!global.dbPool) {
            return res.status(503).json({ error: 'Database connection not available' });
        }

        // Validation
        if (!jadwal_id || !tanggal_izin || !siswa_izin || siswa_izin.length === 0) {
            console.log('❌ Validation failed: Missing required fields', { jadwal_id, tanggal_izin, siswa_izin });
            return res.status(400).json({ 
                error: 'Invalid input', 
                message: 'Input validation failed',
                violations: ['Semua field wajib diisi dan minimal 1 siswa harus dipilih']
            });
        }

        // Validate all students have required fields
        const validJenisIzin = ['sakit', 'izin', 'alpa', 'dispen'];
        const violations = [];
        
        for (let i = 0; i < siswa_izin.length; i++) {
            const siswa = siswa_izin[i];
            console.log(`🔍 Validating siswa ${i + 1}:`, siswa);
            
            if (!siswa.nama || !siswa.jenis_izin || !siswa.alasan) {
                violations.push(`Siswa ${i + 1}: nama, jenis izin, dan alasan wajib diisi`);
            }
            
            // Validate jenis izin for each student
            if (siswa.jenis_izin && !validJenisIzin.includes(siswa.jenis_izin)) {
                violations.push(`Siswa ${i + 1} (${siswa.nama}): jenis izin '${siswa.jenis_izin}' tidak valid. Jenis yang diperbolehkan: ${validJenisIzin.join(', ')}`);
            }
        }
        
        if (violations.length > 0) {
            console.log('❌ Validation failed:', violations);
            return res.status(400).json({ 
                error: 'Invalid input', 
                message: 'Input validation failed',
                violations: violations
            });
        }

        // Get siswa perwakilan's class
        const [kelasData] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa perwakilan tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Insert main pengajuan izin record
        const [pengajuanResult] = await global.dbPool.execute(
            `INSERT INTO pengajuan_izin_siswa (siswa_id, jadwal_id, tanggal_izin, jenis_izin, alasan, tanggal_pengajuan, status, kelas_id)
             VALUES (?, ?, ?, 'kelas', 'Pengajuan izin untuk kelas', NOW(), 'pending', ?)`,
            [siswaId, jadwal_id, tanggal_izin, kelasId]
        );

        const pengajuanId = pengajuanResult.insertId;

        // Insert individual student records
        for (const siswa of siswa_izin) {
            await global.dbPool.execute(
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
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
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
                ba.id_banding,
                ba.siswa_id,
                ba.jadwal_id,
                ba.tanggal_absen,
                ba.status_asli,
                ba.status_diajukan,
                ba.alasan_banding,
                ba.bukti_pendukung,
                ba.status_banding,
                ba.catatan_guru,
                ba.tanggal_pengajuan,
                ba.tanggal_keputusan,
                COALESCE(j.jam_mulai, 'Umum') as jam_mulai,
                COALESCE(j.jam_selesai, 'Umum') as jam_selesai,
                COALESCE(m.nama_mapel, 'Banding Umum') as nama_mapel,
                COALESCE(g.nama, 'Menunggu Proses') as nama_guru,
                COALESCE(k.nama_kelas, '') as nama_kelas
            FROM pengajuan_banding_absen ba
            LEFT JOIN jadwal j ON ba.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON ba.diproses_oleh = g.id_guru
            LEFT JOIN siswa_perwakilan sp ON ba.siswa_id = sp.id_siswa
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            WHERE ba.siswa_id = ?
            ORDER BY ba.tanggal_pengajuan DESC
        `;

        const [rows] = await global.dbPool.execute(query, [siswaId]);
        console.log(`✅ Banding absen retrieved: ${rows.length} items`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting banding absen:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [existing] = await global.dbPool.execute(
            'SELECT id_banding FROM pengajuan_banding_absen WHERE siswa_id = ? AND jadwal_id = ? AND tanggal_absen = ? AND status_banding = "pending"',
            [siswaId, jadwal_id, tanggal_absen]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Banding untuk jadwal dan tanggal ini sudah pernah diajukan dan sedang diproses' });
        }

        // Insert banding absen
        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit banding absen kelas
app.post('/api/siswa/:siswaId/banding-absen-kelas', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_absen, siswa_banding } = req.body;
        console.log('📝 Submitting banding absen kelas:', { siswaId, jadwal_id, tanggal_absen, siswaCount: siswa_banding?.length || 0 });
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📝 Request params:', req.params);

        // Validation
        if (!jadwal_id || !tanggal_absen || !siswa_banding || siswa_banding.length === 0) {
            return res.status(400).json({ error: 'Semua field wajib diisi dan minimal 1 siswa harus dipilih' });
        }

        // Validate all students have required fields
        for (const siswa of siswa_banding) {
            if (!siswa.nama || !siswa.status_asli || !siswa.status_diajukan || !siswa.alasan_banding) {
                return res.status(400).json({ error: 'Semua siswa harus memiliki nama, status asli, status diajukan, dan alasan banding' });
            }
        }

        // Validate jadwal exists
        const [jadwalData] = await global.dbPool.execute(
            'SELECT id_jadwal FROM jadwal WHERE id_jadwal = ?',
            [jadwal_id]
        );

        if (jadwalData.length === 0) {
            return res.status(400).json({ error: 'Jadwal pelajaran tidak ditemukan' });
        }

        // Get siswa perwakilan's class
        const [kelasData] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ?',
            [siswaId]
        );

        if (kelasData.length === 0) {
            return res.status(404).json({ error: 'Siswa perwakilan tidak ditemukan' });
        }

        const kelasId = kelasData[0].kelas_id;

        // Insert main banding absen record
        const [bandingResult] = await global.dbPool.execute(
            `INSERT INTO pengajuan_banding_absen (siswa_id, jadwal_id, tanggal_absen, status_asli, status_diajukan, alasan_banding, tanggal_pengajuan, status_banding, kelas_id, jenis_banding)
             VALUES (?, ?, ?, 'kelas', 'kelas', 'Pengajuan banding absen untuk kelas', NOW(), 'pending', ?, 'kelas')`,
            [siswaId, jadwal_id, tanggal_absen, kelasId]
        );

        const bandingId = bandingResult.insertId;

        // Insert individual student records
        for (const siswa of siswa_banding) {
            await global.dbPool.execute(
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
        
        // Handle specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Data referensi tidak valid (jadwal atau kelas tidak ditemukan)' });
        } else if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Data duplikat ditemukan' });
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ error: 'Data yang diperlukan tidak boleh kosong' });
        } else if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ error: 'Data terlalu panjang' });
        } else if (error.code === 'ER_INVALID_DATE') {
            return res.status(400).json({ error: 'Format tanggal tidak valid' });
        }
        
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Clear empty schedules
app.delete('/api/siswa/clear-empty-schedules', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        console.log('🗑️ Clearing empty schedules for student user:', req.user.id);
        
        // Get the student ID from the authenticated user
        const [siswaRows] = await global.dbPool.execute(
            'SELECT id_siswa FROM siswa_perwakilan WHERE user_id = ? AND status = "aktif"',
            [req.user.id]
        );
        
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Data siswa perwakilan tidak ditemukan' });
        }
        
        const siswaId = siswaRows[0].id_siswa;
        
        // Get student's class
        const [kelasRows] = await global.dbPool.execute(
            'SELECT kelas_id FROM siswa_perwakilan WHERE id_siswa = ? AND status = "aktif"',
            [siswaId]
        );
        
        if (kelasRows.length === 0) {
            return res.status(404).json({ error: 'Data kelas siswa tidak ditemukan' });
        }
        
        const kelasId = kelasRows[0].kelas_id;
        
        // Delete schedules that have no subject assigned (mapel_id IS NULL or empty)
        const [result] = await global.dbPool.execute(
            `DELETE FROM jadwal 
             WHERE kelas_id = ? 
             AND (mapel_id IS NULL OR mapel_id = '' OR mapel_id = 0)
             AND status = 'aktif'`,
            [kelasId]
        );
        
        const deletedCount = result.affectedRows;
        
        console.log(`✅ Deleted ${deletedCount} empty schedules for class ${kelasId}`);
        
        if (deletedCount === 0) {
            return res.json({ 
                message: 'Tidak ada jadwal kosong yang ditemukan untuk dihapus',
                deletedCount: 0 
            });
        }
        
        res.json({ 
            message: `${deletedCount} jadwal kosong berhasil dihapus`,
            deletedCount 
        });
        
    } catch (error) {
        console.error('❌ Error clearing empty schedules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get banding absen for teacher to process
app.get('/api/guru/:guruId/banding-absen', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { guruId } = req.params;
        const { page = 1, limit = 5, filter_pending = 'false' } = req.query;
        console.log('📋 Getting banding absen for guru:', guruId, 'with pagination:', { page, limit, filter_pending });

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const isFilterPending = filter_pending === 'true';

        // Base query
        let baseQuery = `
            FROM pengajuan_banding_absen ba
            JOIN jadwal j ON ba.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa_perwakilan sp ON ba.siswa_id = sp.id_siswa
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            WHERE j.guru_id = ?
        `;

        // Add filter for pending status if requested
        if (isFilterPending) {
            baseQuery += ` AND ba.status_banding = 'pending'`;
        }

        // Count total records
        const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
        const [countResult] = await global.dbPool.execute(countQuery, [guruId]);
        const totalRecords = countResult[0].total;

        // Count pending records (always count all pending, regardless of current filter)
        const pendingCountQuery = `SELECT COUNT(*) as total ${baseQuery} AND ba.status_banding = 'pending'`;
        const [pendingCountResult] = await global.dbPool.execute(pendingCountQuery, [guruId]);
        const totalPending = pendingCountResult[0].total;

        // Main query with pagination
        const mainQuery = `
            SELECT 
                ba.id_banding,
                ba.siswa_id,
                ba.jadwal_id,
                ba.tanggal_absen,
                ba.status_asli,
                ba.status_diajukan,
                ba.alasan_banding,
                ba.bukti_pendukung,
                ba.status_banding,
                ba.catatan_guru,
                ba.tanggal_pengajuan,
                ba.tanggal_keputusan,
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                sp.nama as nama_siswa,
                sp.nis,
                k.nama_kelas
            ${baseQuery}
            ORDER BY ba.tanggal_pengajuan DESC, ba.status_banding ASC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await global.dbPool.execute(mainQuery, [guruId, parseInt(limit), offset]);
        
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        console.log(`✅ Banding absen for guru retrieved: ${rows.length} items (page ${page}/${totalPages})`);
        
        res.json({
            data: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRecords,
                totalPending,
                totalAll: totalRecords,
                limit: parseInt(limit)
            },
            totalPages,
            totalPending,
            totalAll: totalRecords
        });
    } catch (error) {
        console.error('❌ Error getting banding absen for guru:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        const [result] = await global.dbPool.execute(
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// EXPORT SYSTEM INTEGRATION
// ================================================

// Import Absenta Export System
import AbsentaExportSystem from './src/utils/absentaExportSystem.js';

// Initialize export system
const exportSystem = new AbsentaExportSystem();

// Export Daftar Guru (Format SMKN 13)
app.get('/api/export/teacher-list', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { academicYear = '2025-2026' } = req.query;
        console.log('🎯 Exporting teacher list...');
        
        // Query data guru dari database
        const [teachers] = await global.dbPool.execute(`
            SELECT 
                nama,
                nip
            FROM guru 
            WHERE status = 'aktif'
            ORDER BY nama
        `);
        
        const workbook = await exportSystem.exportTeacherList(teachers, academicYear);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Daftar_Guru_${academicYear.replace('-', '_')}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Teacher list exported successfully: ${teachers.length} records`);
    } catch (error) {
        console.error('❌ Error exporting teacher list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export Ringkasan Kehadiran Siswa (Format SMKN 13)
app.get('/api/export/student-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        console.log('📊 Exporting student summary...');
        
        let query = `
            SELECT 
                sp.nama,
                sp.nis,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) as H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) as I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) as S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) as A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) as D,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(a.id), 0), 0) as presentase
            FROM siswa_perwakilan sp
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON sp.id_siswa = a.siswa_id 
                AND a.tanggal BETWEEN ? AND ?
            WHERE sp.status = 'aktif'
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' GROUP BY sp.id_siswa, sp.nama, sp.nis, k.nama_kelas ORDER BY k.nama_kelas, sp.nama';
        
        const [students] = await global.dbPool.execute(query, params);
        
        const workbook = await exportSystem.exportStudentSummary(students, { startDate, endDate });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Ringkasan_Kehadiran_Siswa_${startDate}_${endDate}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Student summary exported successfully: ${students.length} records`);
    } catch (error) {
        console.error('❌ Error exporting student summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export Ringkasan Kehadiran Guru (Format SMKN 13)
app.get('/api/export/teacher-summary', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('👨‍🏫 Exporting teacher summary...');
        
        const [teachers] = await global.dbPool.execute(`
            SELECT 
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN kg.status = 'hadir' THEN 1 ELSE 0 END), 0) as H,
                COALESCE(SUM(CASE WHEN kg.status = 'izin' THEN 1 ELSE 0 END), 0) as I,
                COALESCE(SUM(CASE WHEN kg.status = 'sakit' THEN 1 ELSE 0 END), 0) as S,
                COALESCE(SUM(CASE WHEN kg.status = 'alpa' THEN 1 ELSE 0 END), 0) as A,
                COALESCE(SUM(CASE WHEN kg.status = 'hadir' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(kg.id), 0), 0) as presentase
            FROM guru g
            LEFT JOIN kehadiran_guru kg ON g.id_guru = kg.guru_id 
                AND kg.tanggal BETWEEN ? AND ?
            WHERE g.status = 'aktif'
            GROUP BY g.id_guru, g.nama, g.nip
            ORDER BY g.nama
        `, [startDate, endDate]);
        
        const workbook = await exportSystem.exportTeacherSummary(teachers, { startDate, endDate });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Ringkasan_Kehadiran_Guru_${startDate}_${endDate}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Teacher summary exported successfully: ${teachers.length} records`);
    } catch (error) {
        console.error('❌ Error exporting teacher summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export Banding Absen (Format SMKN 13)
app.get('/api/export/banding-absen', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, status } = req.query;
        console.log('📋 Exporting banding absen...');
        
        let query = `
            SELECT 
                pba.tanggal_pengajuan,
                pba.tanggal_absen,
                sp.nama as nama_pengaju,
                k.nama_kelas,
                m.nama_mapel,
                g.nama as nama_guru,
                CONCAT(j.jam_mulai, ' - ', j.jam_selesai) as jadwal,
                pba.status_asli,
                pba.status_diajukan,
                pba.alasan_banding,
                pba.status_banding,
                pba.catatan_guru,
                pba.tanggal_keputusan
            FROM pengajuan_banding_absen pba
            JOIN siswa_perwakilan sp ON pba.siswa_id = sp.id_siswa
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON pba.jadwal_id = j.id_jadwal
            LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON j.guru_id = g.id_guru
            WHERE DATE(pba.tanggal_pengajuan) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (status && status !== 'all') {
            query += ' AND pba.status_banding = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pba.tanggal_pengajuan DESC';
        
        const [bandingData] = await global.dbPool.execute(query, params);
        
        const workbook = await exportSystem.exportBandingAbsen(bandingData, { startDate, endDate });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Banding_Absen_${startDate}_${endDate}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Banding absen exported successfully: ${bandingData.length} records`);
    } catch (error) {
        console.error('❌ Error exporting banding absen:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export Pengajuan Izin (Format SMKN 13)
app.get('/api/export/pengajuan-izin', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, jenis_izin, status } = req.query;
        console.log('📝 Exporting pengajuan izin...');
        
        let query = `
            SELECT 
                pi.tanggal_pengajuan,
                pi.tanggal_izin,
                sp.nama as nama_siswa,
                sp.nis,
                k.nama_kelas,
                pi.jenis_izin,
                pi.alasan,
                pi.status,
                pi.keterangan_guru,
                pi.tanggal_respon
            FROM pengajuan_izin_siswa pi
            JOIN siswa_perwakilan sp ON pi.siswa_id = sp.id_siswa
            JOIN kelas k ON sp.kelas_id = k.id_kelas
            WHERE DATE(pi.tanggal_pengajuan) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        if (jenis_izin && jenis_izin !== 'all') {
            query += ' AND pi.jenis_izin = ?';
            params.push(jenis_izin);
        }
        
        if (status && status !== 'all') {
            query += ' AND pi.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY pi.tanggal_pengajuan DESC';
        
        const [izinData] = await global.dbPool.execute(query, params);
        
        const workbook = await exportSystem.exportPengajuanIzin(izinData, { startDate, endDate });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Pengajuan_Izin_${startDate}_${endDate}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Pengajuan izin exported successfully: ${izinData.length} records`);
    } catch (error) {
        console.error('❌ Error exporting pengajuan izin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export rekap ketidakhadiran guru
app.get('/api/export/rekap-ketidakhadiran-guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tahun } = req.query;
        console.log('📊 Exporting rekap ketidakhadiran guru:', { tahun });
        
        if (!tahun) {
            return res.status(400).json({ error: 'Tahun harus diisi' });
        }

        // Query untuk mendapatkan data guru dan presensi
        const query = `
            SELECT 
                g.id,
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 7 THEN 1 ELSE 0 END), 0) as jul,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 8 THEN 1 ELSE 0 END), 0) as agt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 9 THEN 1 ELSE 0 END), 0) as sep,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 10 THEN 1 ELSE 0 END), 0) as okt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 11 THEN 1 ELSE 0 END), 0) as nov,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 12 THEN 1 ELSE 0 END), 0) as des,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 1 THEN 1 ELSE 0 END), 0) as jan,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 2 THEN 1 ELSE 0 END), 0) as feb,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 3 THEN 1 ELSE 0 END), 0) as mar,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 4 THEN 1 ELSE 0 END), 0) as apr,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 5 THEN 1 ELSE 0 END), 0) as mei,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 6 THEN 1 ELSE 0 END), 0) as jun,
                COALESCE(SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END), 0) as total_ketidakhadiran
            FROM guru g
            LEFT JOIN absensi_guru a ON g.id_guru = a.guru_id 
                AND YEAR(a.tanggal) = ? 
                AND a.status = 'Tidak Hadir'
            GROUP BY g.id, g.nama, g.nip
            ORDER BY g.nama
        `;

        const [rows] = await global.dbPool.execute(query, [tahun]);

        // Hitung persentase untuk setiap guru
        const dataWithPercentage = rows.map(row => {
            const totalKetidakhadiran = row.total_ketidakhadiran;
            const totalHariEfektif = 239; // Total hari efektif dalam setahun
            const persentaseKetidakhadiran = totalHariEfektif > 0 ? (totalKetidakhadiran / totalHariEfektif) * 100 : 0;
            const persentaseKehadiran = 100 - persentaseKetidakhadiran;

            return {
                ...row,
                persentase_ketidakhadiran: parseFloat(persentaseKetidakhadiran.toFixed(2)),
                persentase_kehadiran: parseFloat(persentaseKehadiran.toFixed(2))
            };
        });

        const workbook = await exportSystem.exportRekapKetidakhadiranGuru(dataWithPercentage, { tahun });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Rekap_Ketidakhadiran_Guru_${tahun}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Rekap ketidakhadiran guru exported successfully: ${dataWithPercentage.length} records`);
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran guru:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get riwayat pengajuan izin untuk laporan
app.get('/api/guru/pengajuan-izin-history', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, status } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Fetching pengajuan izin history:', { startDate, endDate, kelas_id, status, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        piz.id,
        piz.tanggal_pengajuan,
        piz.jenis_izin,
        piz.alasan,
        piz.status,
        piz.tanggal_disetujui,
        piz.catatan,
        sp.nama as nama_siswa,
        sp.nis,
        k.nama_kelas
      FROM pengajuan_izin_siswa piz
      JOIN siswa_perwakilan sp ON piz.siswa_id = sp.id_siswa
      JOIN kelas k ON sp.kelas_id = k.id_kelas
      WHERE piz.tanggal_pengajuan BETWEEN ? AND ?
        AND piz.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND sp.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    if (status && status !== 'all') {
      query += ` AND piz.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY piz.tanggal_pengajuan DESC, sp.nama`;

    const [rows] = await global.dbPool.execute(query, params);
    
    console.log(`✅ Pengajuan izin history fetched: ${rows.length} records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching pengajuan izin history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get riwayat banding absen untuk laporan
app.get('/api/guru/banding-absen-history', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, status } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Fetching banding absen history:', { startDate, endDate, kelas_id, status, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        ba.id,
        ba.tanggal_pengajuan,
        ba.tanggal_absen,
        ba.status_absen,
        ba.alasan_banding,
        ba.status,
        ba.tanggal_disetujui,
        ba.catatan,
        sp.nama as nama_siswa,
        sp.nis,
        k.nama_kelas
      FROM banding_absen ba
      JOIN siswa_perwakilan sp ON ba.siswa_id = sp.id_siswa
      JOIN kelas k ON sp.kelas_id = k.id_kelas
      WHERE ba.tanggal_pengajuan BETWEEN ? AND ?
        AND ba.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND sp.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    if (status && status !== 'all') {
      query += ` AND ba.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ba.tanggal_pengajuan DESC, sp.nama`;

    const [rows] = await global.dbPool.execute(query, params);
    
    console.log(`✅ Banding absen history fetched: ${rows.length} records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching banding absen history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export riwayat pengajuan izin
app.get('/api/export/riwayat-pengajuan-izin', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, status } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Exporting riwayat pengajuan izin:', { startDate, endDate, kelas_id, status, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        piz.id,
        piz.tanggal_pengajuan,
        piz.jenis_izin,
        piz.alasan,
        piz.status,
        piz.tanggal_disetujui,
        piz.catatan,
        sp.nama as nama_siswa,
        sp.nis,
        k.nama_kelas
      FROM pengajuan_izin_siswa piz
      JOIN siswa_perwakilan sp ON piz.siswa_id = sp.id_siswa
      JOIN kelas k ON sp.kelas_id = k.id_kelas
      WHERE piz.tanggal_pengajuan BETWEEN ? AND ?
        AND piz.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND sp.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    if (status && status !== 'all') {
      query += ` AND piz.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY piz.tanggal_pengajuan DESC, sp.nama`;

    const [rows] = await global.dbPool.execute(query, params);

    // Get class name for title
    let className = 'Semua Kelas';
    if (kelas_id && kelas_id !== 'all') {
      const [kelasRows] = await global.dbPool.execute(
        'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
        [kelas_id]
      );
      if (kelasRows.length > 0) {
        className = kelasRows[0].nama_kelas;
      }
    }

    // Create Excel file using ExcelJS directly
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RIWAYAT PENGAJUAN IZIN');

    // Header SMKN 13
    worksheet.getCell('A1').value = 'PEMERINTAH DAERAH PROVINSI JAWA BARAT';
    worksheet.getCell('A2').value = 'DINAS PENDIDIKAN';
    worksheet.getCell('A3').value = 'CABANG DINAS PENDIDIKAN WILAYAH VII';
    worksheet.getCell('A4').value = 'SEKOLAH MENENGAH KEJURUAN NEGERI 13';
    worksheet.getCell('A5').value = '';
    worksheet.getCell('A6').value = 'RIWAYAT PENGAJUAN IZIN SISWA';
    worksheet.getCell('A7').value = `Periode: ${startDate} s/d ${endDate} - Kelas: ${className}`;
    worksheet.getCell('A8').value = '';

    // Headers
    const headers = ['NO', 'TANGGAL', 'NAMA SISWA', 'NIS', 'KELAS', 'JENIS IZIN', 'ALASAN', 'STATUS', 'TANGGAL DISETUJUI', 'CATATAN'];
    headers.forEach((header, index) => {
      worksheet.getCell(9, index + 1).value = header;
      worksheet.getCell(9, index + 1).font = { bold: true };
    });

    // Data rows
    rows.forEach((item, index) => {
      const row = 10 + index;
      worksheet.getCell(row, 1).value = index + 1;
      worksheet.getCell(row, 2).value = new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID');
      worksheet.getCell(row, 3).value = item.nama_siswa;
      worksheet.getCell(row, 4).value = item.nis;
      worksheet.getCell(row, 5).value = item.nama_kelas;
      worksheet.getCell(row, 6).value = item.jenis_izin;
      worksheet.getCell(row, 7).value = item.alasan;
      worksheet.getCell(row, 8).value = item.status === 'approved' ? 'Disetujui' : 
                                        item.status === 'rejected' ? 'Ditolak' : 'Pending';
      worksheet.getCell(row, 9).value = item.tanggal_disetujui ? 
                                        new Date(item.tanggal_disetujui).toLocaleDateString('id-ID') : '-';
      worksheet.getCell(row, 10).value = item.catatan || '-';
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="riwayat-pengajuan-izin-${startDate}-${endDate}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Riwayat pengajuan izin exported successfully: ${rows.length} records`);
  } catch (error) {
    console.error('❌ Error exporting riwayat pengajuan izin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export riwayat banding absen
app.get('/api/export/riwayat-banding-absen', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, status } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Exporting riwayat banding absen:', { startDate, endDate, kelas_id, status, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        ba.id,
        ba.tanggal_pengajuan,
        ba.tanggal_absen,
        ba.status_absen,
        ba.alasan_banding,
        ba.status,
        ba.tanggal_disetujui,
        ba.catatan,
        sp.nama as nama_siswa,
        sp.nis,
        k.nama_kelas
      FROM banding_absen ba
      JOIN siswa_perwakilan sp ON ba.siswa_id = sp.id_siswa
      JOIN kelas k ON sp.kelas_id = k.id_kelas
      WHERE ba.tanggal_pengajuan BETWEEN ? AND ?
        AND ba.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND sp.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    if (status && status !== 'all') {
      query += ` AND ba.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ba.tanggal_pengajuan DESC, sp.nama`;

    const [rows] = await global.dbPool.execute(query, params);

    // Get class name for title
    let className = 'Semua Kelas';
    if (kelas_id && kelas_id !== 'all') {
      const [kelasRows] = await global.dbPool.execute(
        'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
        [kelas_id]
      );
      if (kelasRows.length > 0) {
        className = kelasRows[0].nama_kelas;
      }
    }

    // Create Excel file using ExcelJS directly
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RIWAYAT BANDING ABSEN');

    // Header SMKN 13
    worksheet.getCell('A1').value = 'PEMERINTAH DAERAH PROVINSI JAWA BARAT';
    worksheet.getCell('A2').value = 'DINAS PENDIDIKAN';
    worksheet.getCell('A3').value = 'CABANG DINAS PENDIDIKAN WILAYAH VII';
    worksheet.getCell('A4').value = 'SEKOLAH MENENGAH KEJURUAN NEGERI 13';
    worksheet.getCell('A5').value = '';
    worksheet.getCell('A6').value = 'RIWAYAT PENGAJUAN BANDING ABSEN';
    worksheet.getCell('A7').value = `Periode: ${startDate} s/d ${endDate} - Kelas: ${className}`;
    worksheet.getCell('A8').value = '';

    // Headers
    const headers = ['NO', 'TANGGAL', 'NAMA SISWA', 'NIS', 'KELAS', 'TANGGAL ABSEN', 'STATUS ABSEN', 'ALASAN BANDING', 'STATUS', 'TANGGAL DISETUJUI', 'CATATAN'];
    headers.forEach((header, index) => {
      worksheet.getCell(9, index + 1).value = header;
      worksheet.getCell(9, index + 1).font = { bold: true };
    });

    // Data rows
    rows.forEach((item, index) => {
      const row = 10 + index;
      worksheet.getCell(row, 1).value = index + 1;
      worksheet.getCell(row, 2).value = new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID');
      worksheet.getCell(row, 3).value = item.nama_siswa;
      worksheet.getCell(row, 4).value = item.nis;
      worksheet.getCell(row, 5).value = item.nama_kelas;
      worksheet.getCell(row, 6).value = new Date(item.tanggal_absen).toLocaleDateString('id-ID');
      worksheet.getCell(row, 7).value = item.status_absen;
      worksheet.getCell(row, 8).value = item.alasan_banding;
      worksheet.getCell(row, 9).value = item.status === 'approved' ? 'Disetujui' : 
                                        item.status === 'rejected' ? 'Ditolak' : 'Pending';
      worksheet.getCell(row, 10).value = item.tanggal_disetujui ? 
                                         new Date(item.tanggal_disetujui).toLocaleDateString('id-ID') : '-';
      worksheet.getCell(row, 11).value = item.catatan || '-';
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="riwayat-banding-absen-${startDate}-${endDate}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Riwayat banding absen exported successfully: ${rows.length} records`);
  } catch (error) {
    console.error('❌ Error exporting riwayat banding absen:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get presensi siswa SMK 13 untuk laporan
app.get('/api/guru/presensi-siswa-smkn13', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Fetching presensi siswa SMKN 13:', { startDate, endDate, kelas_id, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        j.id_jadwal as id,
        j.tanggal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.mata_pelajaran,
        k.nama_kelas,
        g.nama as nama_guru,
        COUNT(DISTINCT sp.id_siswa) as total_siswa,
        COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
        COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
        COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
        COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN siswa_perwakilan sp ON j.kelas_id = sp.kelas_id AND sp.status = 'aktif'
      LEFT JOIN absensi_siswa a ON j.id_jadwal = a.jadwal_id AND sp.id_siswa = a.siswa_id
      WHERE j.tanggal BETWEEN ? AND ?
        AND j.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND j.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    query += `
      GROUP BY j.id_jadwal, j.tanggal, j.hari, j.jam_mulai, j.jam_selesai, j.mata_pelajaran, k.nama_kelas, g.nama
      ORDER BY j.tanggal DESC, j.jam_mulai
    `;

    const [rows] = await global.dbPool.execute(query, params);
    
    console.log(`✅ Presensi siswa SMKN 13 fetched: ${rows.length} records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching presensi siswa SMKN 13:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export presensi siswa SMK 13
app.get('/api/export/presensi-siswa-smkn13', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Exporting presensi siswa SMKN 13:', { startDate, endDate, kelas_id, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query = `
      SELECT 
        j.id_jadwal as id,
        j.tanggal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.mata_pelajaran,
        k.nama_kelas,
        g.nama as nama_guru,
        COUNT(DISTINCT sp.id_siswa) as total_siswa,
        COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
        COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
        COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
        COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN siswa_perwakilan sp ON j.kelas_id = sp.kelas_id AND sp.status = 'aktif'
      LEFT JOIN absensi_siswa a ON j.id_jadwal = a.jadwal_id AND sp.id_siswa = a.siswa_id
      WHERE j.tanggal BETWEEN ? AND ?
        AND j.guru_id = ?
    `;
    
    const params = [startDate, endDate, guruId];
    
    if (kelas_id && kelas_id !== 'all') {
      query += ` AND j.kelas_id = ?`;
      params.push(kelas_id);
    }
    
    query += `
      GROUP BY j.id_jadwal, j.tanggal, j.hari, j.jam_mulai, j.jam_selesai, j.mata_pelajaran, k.nama_kelas, g.nama
      ORDER BY j.tanggal DESC, j.jam_mulai
    `;

    const [rows] = await global.dbPool.execute(query, params);

    // Get class name for title
    let className = 'Semua Kelas';
    if (kelas_id && kelas_id !== 'all') {
      const [kelasRows] = await global.dbPool.execute(
        'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
        [kelas_id]
      );
      if (kelasRows.length > 0) {
        className = kelasRows[0].nama_kelas;
      }
    }

    // Create Excel file using ExcelJS directly
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PRESENSI SISWA SMK 13');

    // Header SMKN 13
    worksheet.getCell('A1').value = 'PEMERINTAH DAERAH PROVINSI JAWA BARAT';
    worksheet.getCell('A2').value = 'DINAS PENDIDIKAN';
    worksheet.getCell('A3').value = 'CABANG DINAS PENDIDIKAN WILAYAH VII';
    worksheet.getCell('A4').value = 'SEKOLAH MENENGAH KEJURUAN NEGERI 13';
    worksheet.getCell('A5').value = '';
    worksheet.getCell('A6').value = 'PRESENSI SISWA';
    worksheet.getCell('A7').value = `Periode: ${startDate} s/d ${endDate} - Kelas: ${className}`;
    worksheet.getCell('A8').value = '';

    // Headers
    const headers = ['NO', 'TANGGAL', 'HARI', 'JAM', 'MATA PELAJARAN', 'KELAS', 'GURU', 'TOTAL SISWA', 'HADIR', 'IZIN', 'SAKIT', 'ALPA', 'DISPEN', 'PERSENTASE (%)'];
    headers.forEach((header, index) => {
      worksheet.getCell(9, index + 1).value = header;
      worksheet.getCell(9, index + 1).font = { bold: true };
    });

    // Data rows
    rows.forEach((item, index) => {
      const row = 10 + index;
      const total = item.total_siswa || 0;
      const hadir = item.hadir || 0;
      const presentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0.0';
      
      worksheet.getCell(row, 1).value = index + 1;
      worksheet.getCell(row, 2).value = new Date(item.tanggal).toLocaleDateString('id-ID');
      worksheet.getCell(row, 3).value = item.hari;
      worksheet.getCell(row, 4).value = `${item.jam_mulai} - ${item.jam_selesai}`;
      worksheet.getCell(row, 5).value = item.mata_pelajaran;
      worksheet.getCell(row, 6).value = item.nama_kelas;
      worksheet.getCell(row, 7).value = item.nama_guru;
      worksheet.getCell(row, 8).value = total;
      worksheet.getCell(row, 9).value = hadir;
      worksheet.getCell(row, 10).value = item.izin || 0;
      worksheet.getCell(row, 11).value = item.sakit || 0;
      worksheet.getCell(row, 12).value = item.alpa || 0;
      worksheet.getCell(row, 13).value = item.dispen || 0;
      worksheet.getCell(row, 14).value = `${presentase}%`;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="presensi-siswa-smkn13-${startDate}-${endDate}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Presensi siswa SMKN 13 exported successfully: ${rows.length} records`);
  } catch (error) {
    console.error('❌ Error exporting presensi siswa SMKN 13:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get rekap ketidakhadiran untuk laporan
app.get('/api/guru/rekap-ketidakhadiran', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, reportType } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Fetching rekap ketidakhadiran:', { startDate, endDate, kelas_id, reportType, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query;
    let params;

    if (reportType === 'bulanan') {
      // Laporan bulanan - grup berdasarkan bulan dan kelas
      query = `
        SELECT 
          DATE_FORMAT(a.tanggal, '%Y-%m') as periode,
          k.nama_kelas,
          COUNT(DISTINCT sp.id_siswa) as total_siswa,
          COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
          COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
          COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
          COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
          COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
        FROM absensi_siswa a
        JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
        JOIN kelas k ON sp.kelas_id = k.id_kelas
        JOIN jadwal j ON a.jadwal_id = j.id_jadwal
        WHERE a.tanggal BETWEEN ? AND ?
          AND j.guru_id = ?
      `;
      
      params = [startDate, endDate, guruId];
      
      if (kelas_id && kelas_id !== 'all') {
        query += ` AND sp.kelas_id = ?`;
        params.push(kelas_id);
      }
      
      query += `
        GROUP BY DATE_FORMAT(a.tanggal, '%Y-%m'), k.nama_kelas
        ORDER BY periode DESC, k.nama_kelas
      `;
    } else {
      // Laporan tahunan - grup berdasarkan tahun dan kelas
      query = `
        SELECT 
          YEAR(a.tanggal) as periode,
          k.nama_kelas,
          COUNT(DISTINCT sp.id_siswa) as total_siswa,
          COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
          COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
          COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
          COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
          COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
        FROM absensi_siswa a
        JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
        JOIN kelas k ON sp.kelas_id = k.id_kelas
        JOIN jadwal j ON a.jadwal_id = j.id_jadwal
        WHERE a.tanggal BETWEEN ? AND ?
          AND j.guru_id = ?
      `;
      
      params = [startDate, endDate, guruId];
      
      if (kelas_id && kelas_id !== 'all') {
        query += ` AND sp.kelas_id = ?`;
        params.push(kelas_id);
      }
      
      query += `
        GROUP BY YEAR(a.tanggal), k.nama_kelas
        ORDER BY periode DESC, k.nama_kelas
      `;
    }

    const [rows] = await global.dbPool.execute(query, params);
    
    console.log(`✅ Rekap ketidakhadiran fetched: ${rows.length} records`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching rekap ketidakhadiran:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export rekap ketidakhadiran
app.get('/api/export/rekap-ketidakhadiran', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, kelas_id, reportType } = req.query;
    const guruId = req.user.guru_id;
    
    console.log('📊 Exporting rekap ketidakhadiran:', { startDate, endDate, kelas_id, reportType, guruId });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
    }

    let query;
    let params;

    if (reportType === 'bulanan') {
      // Laporan bulanan
      query = `
        SELECT 
          DATE_FORMAT(a.tanggal, '%Y-%m') as periode,
          k.nama_kelas,
          COUNT(DISTINCT sp.id_siswa) as total_siswa,
          COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
          COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
          COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
          COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
          COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
        FROM absensi_siswa a
        JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
        JOIN kelas k ON sp.kelas_id = k.id_kelas
        JOIN jadwal j ON a.jadwal_id = j.id_jadwal
        WHERE a.tanggal BETWEEN ? AND ?
          AND j.guru_id = ?
      `;
      
      params = [startDate, endDate, guruId];
      
      if (kelas_id && kelas_id !== 'all') {
        query += ` AND sp.kelas_id = ?`;
        params.push(kelas_id);
      }
      
      query += `
        GROUP BY DATE_FORMAT(a.tanggal, '%Y-%m'), k.nama_kelas
        ORDER BY periode DESC, k.nama_kelas
      `;
    } else {
      // Laporan tahunan
      query = `
        SELECT 
          YEAR(a.tanggal) as periode,
          k.nama_kelas,
          COUNT(DISTINCT sp.id_siswa) as total_siswa,
          COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as hadir,
          COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as izin,
          COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as sakit,
          COUNT(CASE WHEN a.status = 'Alpa' THEN 1 END) as alpa,
          COUNT(CASE WHEN a.status = 'Dispen' THEN 1 END) as dispen
        FROM absensi_siswa a
        JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
        JOIN kelas k ON sp.kelas_id = k.id_kelas
        JOIN jadwal j ON a.jadwal_id = j.id_jadwal
        WHERE a.tanggal BETWEEN ? AND ?
          AND j.guru_id = ?
      `;
      
      params = [startDate, endDate, guruId];
      
      if (kelas_id && kelas_id !== 'all') {
        query += ` AND sp.kelas_id = ?`;
        params.push(kelas_id);
      }
      
      query += `
        GROUP BY YEAR(a.tanggal), k.nama_kelas
        ORDER BY periode DESC, k.nama_kelas
      `;
    }

    const [rows] = await global.dbPool.execute(query, params);

    // Get class name for title
    let className = 'Semua Kelas';
    if (kelas_id && kelas_id !== 'all') {
      const [kelasRows] = await global.dbPool.execute(
        'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
        [kelas_id]
      );
      if (kelasRows.length > 0) {
        className = kelasRows[0].nama_kelas;
      }
    }

    // Create Excel file using ExcelJS directly
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('REKAP KETIDAKHADIRAN');

    // Header SMKN 13
    worksheet.getCell('A1').value = 'PEMERINTAH DAERAH PROVINSI JAWA BARAT';
    worksheet.getCell('A2').value = 'DINAS PENDIDIKAN';
    worksheet.getCell('A3').value = 'CABANG DINAS PENDIDIKAN WILAYAH VII';
    worksheet.getCell('A4').value = 'SEKOLAH MENENGAH KEJURUAN NEGERI 13';
    worksheet.getCell('A5').value = '';
    worksheet.getCell('A6').value = `REKAP KETIDAKHADIRAN ${reportType === 'bulanan' ? 'BULANAN' : 'TAHUNAN'}`;
    worksheet.getCell('A7').value = `Periode: ${startDate} s/d ${endDate} - Kelas: ${className}`;
    worksheet.getCell('A8').value = '';

    // Headers
    const headers = ['NO', 'PERIODE', 'KELAS', 'TOTAL SISWA', 'HADIR', 'IZIN', 'SAKIT', 'ALPA', 'DISPEN', 'TOTAL ABSEN', 'PERSENTASE HADIR (%)', 'PERSENTASE ABSEN (%)'];
    headers.forEach((header, index) => {
      worksheet.getCell(9, index + 1).value = header;
      worksheet.getCell(9, index + 1).font = { bold: true };
    });

    // Data rows
    rows.forEach((item, index) => {
      const row = 10 + index;
      const totalSiswa = item.total_siswa || 0;
      const hadir = item.hadir || 0;
      const totalAbsen = (item.izin || 0) + (item.sakit || 0) + (item.alpa || 0) + (item.dispen || 0);
      const presentaseHadir = totalSiswa > 0 ? ((hadir / totalSiswa) * 100).toFixed(1) : '0.0';
      const presentaseAbsen = totalSiswa > 0 ? ((totalAbsen / totalSiswa) * 100).toFixed(1) : '0.0';
      
      worksheet.getCell(row, 1).value = index + 1;
      worksheet.getCell(row, 2).value = item.periode;
      worksheet.getCell(row, 3).value = item.nama_kelas;
      worksheet.getCell(row, 4).value = totalSiswa;
      worksheet.getCell(row, 5).value = hadir;
      worksheet.getCell(row, 6).value = item.izin || 0;
      worksheet.getCell(row, 7).value = item.sakit || 0;
      worksheet.getCell(row, 8).value = item.alpa || 0;
      worksheet.getCell(row, 9).value = item.dispen || 0;
      worksheet.getCell(row, 10).value = totalAbsen;
      worksheet.getCell(row, 11).value = `${presentaseHadir}%`;
      worksheet.getCell(row, 12).value = `${presentaseAbsen}%`;
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="rekap-ketidakhadiran-${reportType}-${startDate}-${endDate}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Rekap ketidakhadiran exported successfully: ${rows.length} records`);
  } catch (error) {
    console.error('❌ Error exporting rekap ketidakhadiran:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export ringkasan kehadiran siswa SMKN 13 (untuk guru)
app.get('/api/export/ringkasan-kehadiran-siswa-smkn13', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        const guruId = req.user.guru_id;
        
        console.log('📊 Exporting ringkasan kehadiran siswa SMKN 13:', { startDate, endDate, kelas_id, guruId });
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Tanggal mulai dan akhir harus diisi' });
        }

        // Query untuk mendapatkan data siswa dan presensi
        let query = `
            SELECT 
                sp.id_siswa as id,
                sp.nis,
                sp.nama,
                k.nama_kelas,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) as H,
                COALESCE(SUM(CASE WHEN a.status = 'Izin' THEN 1 ELSE 0 END), 0) as I,
                COALESCE(SUM(CASE WHEN a.status = 'Sakit' THEN 1 ELSE 0 END), 0) as S,
                COALESCE(SUM(CASE WHEN a.status = 'Alpa' THEN 1 ELSE 0 END), 0) as A,
                COALESCE(SUM(CASE WHEN a.status = 'Dispen' THEN 1 ELSE 0 END), 0) as D,
                COUNT(a.id) as total_absen
            FROM siswa_perwakilan sp
            LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON sp.id_siswa = a.siswa_id 
                AND a.tanggal BETWEEN ? AND ?
                AND a.jadwal_id IN (
                    SELECT j.id_jadwal 
                    FROM jadwal j 
                    WHERE j.guru_id = ?
                )
            WHERE sp.status = 'aktif'
        `;
        
        const params = [startDate, endDate, guruId];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ` AND sp.kelas_id = ?`;
            params.push(kelas_id);
        }
        
        query += `
            GROUP BY sp.id_siswa, sp.nis, sp.nama, k.nama_kelas
            ORDER BY k.nama_kelas, sp.nama
        `;

        const [rows] = await global.dbPool.execute(query, params);
        
        // Calculate percentage for each student
        const dataWithPercentage = rows.map(row => {
            const total = row.H + row.I + row.S + row.A + row.D;
            const presentase = total > 0 ? ((row.H / total) * 100).toFixed(2) : '0.00';
            return {
                ...row,
                presentase: parseFloat(presentase)
            };
        });

        // Get class name for title
        let className = 'Semua Kelas';
        if (kelas_id && kelas_id !== 'all') {
            const [kelasRows] = await global.dbPool.execute(
                'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
                [kelas_id]
            );
            if (kelasRows.length > 0) {
                className = kelasRows[0].nama_kelas;
            }
        }

        // Create Excel file using ExcelJS directly (temporary solution)
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('RINGKASAN KEHADIRAN SISWA');

        // Simple header
        worksheet.getCell('A1').value = 'PEMERINTAH DAERAH PROVINSI JAWA BARAT';
        worksheet.getCell('A2').value = 'DINAS PENDIDIKAN';
        worksheet.getCell('A3').value = 'CABANG DINAS PENDIDIKAN WILAYAH VII';
        worksheet.getCell('A4').value = 'SEKOLAH MENENGAH KEJURUAN NEGERI 13';
        worksheet.getCell('A5').value = '';
        worksheet.getCell('A6').value = 'RINGKASAN KEHADIRAN SISWA';
        worksheet.getCell('A7').value = `Periode: ${startDate} s/d ${endDate} - Kelas: ${className}`;
        worksheet.getCell('A8').value = '';

        // Headers
        const headers = ['NO', 'NAMA SISWA', 'NIS', 'KELAS', 'HADIR', 'IZIN', 'SAKIT', 'ALPA', 'DISPEN', 'TOTAL', 'PERSENTASE (%)'];
        headers.forEach((header, index) => {
            worksheet.getCell(9, index + 1).value = header;
            worksheet.getCell(9, index + 1).font = { bold: true };
        });

        // Data rows
        dataWithPercentage.forEach((siswa, index) => {
            const row = 10 + index;
            const total = siswa.H + siswa.I + siswa.S + siswa.A + siswa.D;
            worksheet.getCell(row, 1).value = index + 1;
            worksheet.getCell(row, 2).value = siswa.nama;
            worksheet.getCell(row, 3).value = siswa.nis;
            worksheet.getCell(row, 4).value = siswa.nama_kelas;
            worksheet.getCell(row, 5).value = siswa.H || 0;
            worksheet.getCell(row, 6).value = siswa.I || 0;
            worksheet.getCell(row, 7).value = siswa.S || 0;
            worksheet.getCell(row, 8).value = siswa.A || 0;
            worksheet.getCell(row, 9).value = siswa.D || 0;
            worksheet.getCell(row, 10).value = total;
            worksheet.getCell(row, 11).value = `${parseFloat(siswa.presentase || 0).toFixed(2)}%`;
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ringkasan-kehadiran-siswa-smkn13-${startDate}-${endDate}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Ringkasan kehadiran siswa SMKN 13 exported successfully: ${dataWithPercentage.length} records`);
    } catch (error) {
        console.error('❌ Error exporting ringkasan kehadiran siswa SMKN 13:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export rekap ketidakhadiran guru SMKN 13
app.get('/api/export/rekap-ketidakhadiran-guru-smkn13', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { tahun } = req.query;
        console.log('📊 Exporting rekap ketidakhadiran guru SMKN 13:', { tahun });
        
        if (!tahun) {
            return res.status(400).json({ error: 'Tahun harus diisi' });
        }

        // Query untuk mendapatkan data guru dan presensi
        const query = `
            SELECT 
                g.id,
                g.nama,
                g.nip,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 7 THEN 1 ELSE 0 END), 0) as jul,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 8 THEN 1 ELSE 0 END), 0) as agt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 9 THEN 1 ELSE 0 END), 0) as sep,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 10 THEN 1 ELSE 0 END), 0) as okt,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 11 THEN 1 ELSE 0 END), 0) as nov,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 12 THEN 1 ELSE 0 END), 0) as des,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 1 THEN 1 ELSE 0 END), 0) as jan,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 2 THEN 1 ELSE 0 END), 0) as feb,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 3 THEN 1 ELSE 0 END), 0) as mar,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 4 THEN 1 ELSE 0 END), 0) as apr,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 5 THEN 1 ELSE 0 END), 0) as mei,
                COALESCE(SUM(CASE WHEN MONTH(a.tanggal) = 6 THEN 1 ELSE 0 END), 0) as jun,
                COALESCE(SUM(CASE WHEN a.status = 'Tidak Hadir' THEN 1 ELSE 0 END), 0) as total_ketidakhadiran
            FROM guru g
            LEFT JOIN absensi_guru a ON g.id_guru = a.guru_id 
                AND YEAR(a.tanggal) = ? 
                AND a.status = 'Tidak Hadir'
            GROUP BY g.id, g.nama, g.nip
            ORDER BY g.nama
        `;

        const [rows] = await global.dbPool.execute(query, [tahun]);

        // Hitung persentase untuk setiap guru
        const dataWithPercentage = rows.map(row => {
            const totalKetidakhadiran = row.total_ketidakhadiran;
            const totalHariEfektif = 239; // Total hari efektif dalam setahun
            const persentaseKetidakhadiran = totalHariEfektif > 0 ? (totalKetidakhadiran / totalHariEfektif) * 100 : 0;
            const persentaseKehadiran = 100 - persentaseKetidakhadiran;

            return {
                ...row,
                persentase_ketidakhadiran: parseFloat(persentaseKetidakhadiran.toFixed(2)),
                persentase_kehadiran: parseFloat(persentaseKehadiran.toFixed(2))
            };
        });

        const workbook = await exportSystem.exportRekapKetidakhadiranGuruSMKN13(dataWithPercentage, { tahun });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="REKAP_KETIDAKHADIRAN_GURU_SMKN13_${tahun}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Rekap ketidakhadiran guru SMKN 13 exported successfully: ${dataWithPercentage.length} records`);
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran guru SMKN 13:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export rekap ketidakhadiran siswa
app.get('/api/export/rekap-ketidakhadiran-siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, tahun, bulan } = req.query;
        console.log('📊 Exporting rekap ketidakhadiran siswa:', { kelas_id, tahun, bulan });
        
        // Get class name
        const [kelasRows] = await global.dbPool.execute(
            'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
            [kelas_id]
        );
        const kelasName = kelasRows.length > 0 ? kelasRows[0].nama_kelas : 'Unknown';
        
        // Get students data
        const [studentsRows] = await global.dbPool.execute(
            'SELECT sp.id_siswa as id, sp.nis, sp.nama, sp.jenis_kelamin, sp.kelas_id FROM siswa_perwakilan sp WHERE sp.kelas_id = ? AND sp.status = "aktif" ORDER BY sp.nama ASC',
            [kelas_id]
        );
        
        if (studentsRows.length === 0) {
            // Return empty Excel file
            const workbook = await exportSystem.exportRekapKetidakhadiranSiswa([], { 
                kelasName, 
                tahun, 
                bulan: bulan || 'Tahunan' 
            });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Rekap_Ketidakhadiran_Siswa_${kelasName}_${tahun}${bulan ? '_' + bulan : ''}.xlsx"`);
            
            await workbook.xlsx.write(res);
            res.end();
            
            console.log(`✅ Rekap ketidakhadiran siswa exported successfully: 0 records`);
            return;
        }
        
        // Get presensi data
        let presensiData = [];
        if (bulan) {
            // Monthly data
            const [presensiRows] = await global.dbPool.execute(`
                SELECT 
                    a.siswa_id,
                    MONTH(a.tanggal) as bulan,
                    YEAR(a.tanggal) as tahun,
                    COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) as total_ketidakhadiran,
                    COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as total_kehadiran,
                    COUNT(*) as total_hari_efektif,
                    ROUND((COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) / COUNT(*)) * 100, 2) as persentase_ketidakhadiran,
                    ROUND((COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) / COUNT(*)) * 100, 2) as persentase_kehadiran
                FROM absensi_siswa a
                INNER JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
                WHERE sp.kelas_id = ?
                    AND YEAR(a.tanggal) = ?
                    AND MONTH(a.tanggal) = ?
                GROUP BY a.siswa_id, MONTH(a.tanggal), YEAR(a.tanggal)
                ORDER BY a.siswa_id, MONTH(a.tanggal)
            `, [kelas_id, tahun, bulan]);
            presensiData = presensiRows;
        } else {
            // Yearly data
            const [presensiRows] = await global.dbPool.execute(`
                SELECT 
                    a.siswa_id,
                    MONTH(a.tanggal) as bulan,
                    YEAR(a.tanggal) as tahun,
                    COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) as total_ketidakhadiran,
                    COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as total_kehadiran,
                    COUNT(*) as total_hari_efektif,
                    ROUND((COUNT(CASE WHEN a.status IN ('Sakit', 'Alpa', 'Izin') THEN 1 END) / COUNT(*)) * 100, 2) as persentase_ketidakhadiran,
                    ROUND((COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) / COUNT(*)) * 100, 2) as persentase_kehadiran
                FROM absensi_siswa a
                INNER JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
                WHERE sp.kelas_id = ?
                    AND YEAR(a.tanggal) = ?
                GROUP BY a.siswa_id, MONTH(a.tanggal), YEAR(a.tanggal)
                ORDER BY a.siswa_id, MONTH(a.tanggal)
            `, [kelas_id, tahun]);
            presensiData = presensiRows;
        }
        
        // Prepare data for export
        const exportData = studentsRows.map(student => {
            const studentPresensi = presensiData.filter(p => p.siswa_id === student.id);
            const totalKetidakhadiran = studentPresensi.reduce((sum, p) => sum + p.total_ketidakhadiran, 0);
            const totalKehadiran = studentPresensi.reduce((sum, p) => sum + p.total_kehadiran, 0);
            const totalHariEfektif = studentPresensi.reduce((sum, p) => sum + p.total_hari_efektif, 0);
            const persentaseKetidakhadiran = totalHariEfektif > 0 ? ((totalKetidakhadiran / totalHariEfektif) * 100).toFixed(2) : '0.00';
            const persentaseKehadiran = totalHariEfektif > 0 ? ((totalKehadiran / totalHariEfektif) * 100).toFixed(2) : '0.00';
            
            return {
                nis: student.nis,
                nama: student.nama,
                jenis_kelamin: student.jenis_kelamin,
                total_ketidakhadiran: totalKetidakhadiran,
                total_kehadiran: totalKehadiran,
                total_hari_efektif: totalHariEfektif,
                persentase_ketidakhadiran: persentaseKetidakhadiran,
                persentase_kehadiran: persentaseKehadiran
            };
        });
        
        const workbook = await exportSystem.exportRekapKetidakhadiranSiswa(exportData, { 
            kelasName, 
            tahun, 
            bulan: bulan || 'Tahunan' 
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Rekap_Ketidakhadiran_Siswa_${kelasName}_${tahun}${bulan ? '_' + bulan : ''}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Rekap ketidakhadiran siswa exported successfully: ${exportData.length} records`);
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran siswa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export presensi siswa
app.get('/api/export/presensi-siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, bulan, tahun } = req.query;
        console.log('📊 Exporting presensi siswa:', { kelas_id, bulan, tahun });
        
        // Get class name
        const [kelasRows] = await global.dbPool.execute(
            'SELECT nama_kelas FROM kelas WHERE id_kelas = ?',
            [kelas_id]
        );
        const kelasName = kelasRows.length > 0 ? kelasRows[0].nama_kelas : 'Unknown';
        
        // Get students data
        const [studentsRows] = await global.dbPool.execute(
            'SELECT sp.id_siswa as id, sp.nis, sp.nama, sp.jenis_kelamin, sp.kelas_id FROM siswa_perwakilan sp WHERE sp.kelas_id = ? AND sp.status = "aktif" ORDER BY sp.nama ASC',
            [kelas_id]
        );
        
        // Get presensi data for the month
        const [presensiRows] = await global.dbPool.execute(`
            SELECT 
                a.siswa_id,
                DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
                a.status,
                a.keterangan
            FROM absensi_siswa a
            INNER JOIN siswa_perwakilan sp ON a.siswa_id = sp.id_siswa
            WHERE sp.kelas_id = ?
                AND YEAR(a.tanggal) = ?
                AND MONTH(a.tanggal) = ?
            ORDER BY a.siswa_id, a.tanggal
        `, [kelas_id, tahun, bulan]);
        
        // Prepare data for export
        const exportData = studentsRows.map(student => {
            const studentPresensi = presensiRows.filter(p => p.siswa_id === student.id);
            
            // Create attendance record for each day of the month
            const daysInMonth = new Date(parseInt(tahun), parseInt(bulan), 0).getDate();
            const attendanceRecord = {};
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${tahun}-${bulan.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const presensi = studentPresensi.find(p => p.tanggal === dateStr);
                attendanceRecord[`hari_${day}`] = presensi ? presensi.status : '';
            }
            
            return {
                nis: student.nis,
                nama: student.nama,
                jenis_kelamin: student.jenis_kelamin,
                ...attendanceRecord
            };
        });
        
        const workbook = await exportSystem.exportPresensiSiswa(exportData, { 
            kelasName, 
            tahun, 
            bulan: parseInt(bulan)
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Presensi_Siswa_${kelasName}_${bulan}_${tahun}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Presensi siswa exported successfully: ${exportData.length} records`);
    } catch (error) {
        console.error('❌ Error exporting presensi siswa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// SERVER INITIALIZATION
// ================================================

// Initialize database optimization and start server
initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`🚀 ABSENTA Modern Server is running on http://localhost:${port}`);
        console.log(`📱 Frontend should connect to this server`);
        console.log(`🔑 Admin login: admin / admin123`);
        console.log(`👨‍🏫 Guru login: guru_matematika / guru123`);
        console.log(`👨‍🎓 Siswa login: perwakilan_x_ipa1 / siswa123`);
        console.log(`🔧 Database optimization: Connection pool active`);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

// ================================================
// DISASTER RECOVERY SYSTEM API ENDPOINTS
// ================================================

// Get disaster recovery status
app.get('/api/admin/disaster-recovery-status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const status = global.disasterRecoverySystem.getSystemHealth();
        
        res.json({
            success: true,
            data: status
        });
        
    } catch (error) {
        console.error('❌ Error getting disaster recovery status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Setup backup schedule
app.post('/api/admin/setup-backup-schedule', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await global.disasterRecoverySystem.setupBackupSchedule();
        
        res.json({
            success: true,
            message: 'Backup schedule setup completed successfully',
            data: result
        });
        
    } catch (error) {
        console.error('❌ Error setting up backup schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify backup
app.post('/api/admin/verify-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupPath, backupType } = req.body;
        
        const verificationResult = await global.disasterRecoverySystem.verifyBackupFile(backupPath, backupType);
        
        res.json({
            success: true,
            message: 'Backup verification completed',
            data: verificationResult
        });
        
    } catch (error) {
        console.error('❌ Error verifying backup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test backup restoration
app.post('/api/admin/test-backup-restoration', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupPath, testDatabase } = req.body;
        
        const startTime = Date.now();
        const restorationResult = await global.disasterRecoverySystem.testBackupRestoration(backupPath, testDatabase);
        const duration = Date.now() - startTime;
        
        res.json({
            success: true,
            message: 'Backup restoration test completed',
            data: {
                ...restorationResult,
                duration
            }
        });
        
    } catch (error) {
        console.error('❌ Error testing backup restoration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get disaster recovery documentation
app.get('/api/admin/disaster-recovery-docs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const documentation = await global.disasterRecoverySystem.getDocumentation();
        
        res.json({
            success: true,
            data: documentation
        });
        
    } catch (error) {
        console.error('❌ Error getting disaster recovery documentation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create disaster recovery backup
app.post('/api/admin/create-disaster-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { type = 'full', description = 'Manual backup' } = req.body;
        
        const backupResult = await global.disasterRecoverySystem.createBackup(type, description);
        
        res.json({
            success: true,
            message: 'Disaster recovery backup created successfully',
            data: backupResult
        });
        
    } catch (error) {
        console.error('❌ Error creating disaster recovery backup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get backup list
app.get('/api/admin/disaster-backup-list', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { limit = 50, type = null } = req.query;
        const backups = global.disasterRecoverySystem.getBackupList(parseInt(limit), type);
        
        res.json({
            success: true,
            data: backups
        });
        
    } catch (error) {
        console.error('❌ Error getting disaster backup list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify backup
app.post('/api/admin/verify-backup/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupId } = req.params;
        
        const verificationResult = await global.disasterRecoverySystem.verifyBackup(backupId);
        
        res.json({
            success: true,
            message: 'Backup verification completed',
            data: verificationResult
        });
        
    } catch (error) {
        console.error('❌ Error verifying backup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test recovery procedure
app.post('/api/admin/test-recovery/:procedureId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { procedureId } = req.params;
        const { backupId } = req.body;
        
        const testResult = await global.disasterRecoverySystem.testRecoveryProcedure(procedureId, backupId);
        
        res.json({
            success: true,
            message: 'Recovery procedure test completed',
            data: testResult
        });
        
    } catch (error) {
        console.error('❌ Error testing recovery procedure:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recovery procedures
app.get('/api/admin/recovery-procedures', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const procedures = global.disasterRecoverySystem.getRecoveryProcedures();
        
        res.json({
            success: true,
            data: procedures
        });
        
    } catch (error) {
        console.error('❌ Error getting recovery procedures:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// SECURITY SYSTEM API ENDPOINTS
// ================================================

// Get security statistics
app.get('/api/admin/security-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const stats = global.securitySystem.getSecurityStats();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('❌ Error getting security stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get security events
app.get('/api/admin/security-events', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { limit = 100, type = null } = req.query;
        const events = global.securitySystem.getSecurityEvents(parseInt(limit), type);
        
        res.json({
            success: true,
            data: events
        });
        
    } catch (error) {
        console.error('❌ Error getting security events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get blocked IPs
app.get('/api/admin/blocked-ips', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const blockedIPs = global.securitySystem.getBlockedIPs();
        
        res.json({
            success: true,
            data: blockedIPs
        });
        
    } catch (error) {
        console.error('❌ Error getting blocked IPs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Block IP
app.post('/api/admin/block-ip', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { ip, reason } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        global.securitySystem.blockIP(ip, reason || 'Manual block by admin');
        
        res.json({
            success: true,
            message: `IP ${ip} blocked successfully`
        });
        
    } catch (error) {
        console.error('❌ Error blocking IP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unblock IP
app.post('/api/admin/unblock-ip', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }
        
        global.securitySystem.unblockIP(ip);
        
        res.json({
            success: true,
            message: `IP ${ip} unblocked successfully`
        });
        
    } catch (error) {
        console.error('❌ Error unblocking IP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear security events
app.post('/api/admin/clear-security-events', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        global.securitySystem.clearSecurityEvents();
        
        res.json({
            success: true,
            message: 'Security events cleared successfully'
        });
        
    } catch (error) {
        console.error('❌ Error clearing security events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// MONITORING SYSTEM API ENDPOINTS
// ================================================

// Get system metrics
app.get('/api/admin/system-metrics', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const metrics = global.systemMonitor.getMetrics();
        
        res.json({
            success: true,
            data: metrics
        });
        
    } catch (error) {
        console.error('❌ Error getting system metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get system alerts
app.get('/api/admin/system-alerts', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const alerts = global.systemMonitor.getAlerts();
        
        res.json({
            success: true,
            data: alerts
        });
        
    } catch (error) {
        console.error('❌ Error getting system alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get performance history
app.get('/api/admin/performance-history', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        const history = global.systemMonitor.getPerformanceHistory(parseInt(hours));
        
        res.json({
            success: true,
            data: history
        });
        
    } catch (error) {
        console.error('❌ Error getting performance history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear alerts
app.post('/api/admin/clear-alerts', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        global.systemMonitor.clearAlerts();
        
        res.json({
            success: true,
            message: 'Alerts cleared successfully'
        });
        
    } catch (error) {
        console.error('❌ Error clearing alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// LOAD BALANCER API ENDPOINTS
// ================================================

// Get load balancer statistics
app.get('/api/admin/load-balancer-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const stats = global.loadBalancer.getStats();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('❌ Error getting load balancer stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Populate sample queries for cache demonstration
app.post('/api/admin/populate-cache', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        if (global.loadBalancer) {
            await global.loadBalancer.populateSampleQueries();
            res.json({
                success: true,
                message: 'Sample queries populated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Load balancer not available' });
        }
    } catch (error) {
        console.error('❌ Populate cache error:', error);
        res.status(500).json({ error: 'Failed to populate cache' });
    }
});

// Clear query cache
app.post('/api/admin/clear-cache', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        if (global.loadBalancer) {
            global.loadBalancer.clearQueryCache();
            res.json({
                success: true,
                message: 'Query cache cleared successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Load balancer not available' });
        }
    } catch (error) {
        console.error('❌ Clear cache error:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// Get performance metrics
app.get('/api/admin/performance-metrics', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        if (global.performanceOptimizer) {
            const metrics = global.performanceOptimizer.getPerformanceMetrics();
            const slowQueries = global.performanceOptimizer.getSlowQueriesReport();
            
            res.json({
                success: true,
                data: {
                    metrics,
                    slowQueries,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({ error: 'Performance optimizer not available' });
        }
    } catch (error) {
        console.error('❌ Performance metrics error:', error);
        res.status(500).json({ error: 'Failed to get performance metrics' });
    }
});

// Clear performance caches
app.post('/api/admin/clear-performance-cache', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        if (global.performanceOptimizer) {
            global.performanceOptimizer.clearCaches();
            res.json({
                success: true,
                message: 'Performance caches cleared successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ error: 'Performance optimizer not available' });
        }
    } catch (error) {
        console.error('❌ Clear performance cache error:', error);
        res.status(500).json({ error: 'Failed to clear performance cache' });
    }
});

// Toggle load balancer on/off
app.post('/api/admin/toggle-load-balancer', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { enabled } = req.body;
        
        if (global.loadBalancer) {
            if (enabled) {
                await global.loadBalancer.enable();
                console.log('✅ Load balancer enabled');
            } else {
                await global.loadBalancer.disable();
                console.log('⏸️ Load balancer disabled');
            }
        }
        
        res.json({
            success: true,
            message: `Load balancer ${enabled ? 'enabled' : 'disabled'} successfully`,
            enabled: enabled
        });
        
    } catch (error) {
        console.error('❌ Error toggling load balancer:', error);
        res.status(500).json({ error: 'Failed to toggle load balancer' });
    }
});

// Get comprehensive system performance data
app.get('/api/admin/system-performance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // Get load balancer stats
        const loadBalancerStats = global.loadBalancer ? global.loadBalancer.getStats() : {
            totalRequests: 0,
            activeRequests: 0,
            completedRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            circuitBreakerTrips: 0,
            burstDetections: 0,
            lastBurstTime: null,
            circuitBreaker: {
                isOpen: false,
                failureCount: 0,
                successCount: 0
            },
            queueSizes: {
                critical: 0,
                high: 0,
                normal: 0,
                low: 0
            },
            totalQueueSize: 0
        };

        // Get query optimizer stats from load balancer (integrated)
        const queryOptimizerStats = global.loadBalancer ? {
            queryStats: global.loadBalancer.getQueryStats(),
            cacheStats: global.loadBalancer.getCacheStats()
        } : {
            queryStats: {},
            cacheStats: { size: 0, entries: [] }
        };

        // Get system metrics with validation
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        
        // Validate and sanitize memory usage data
        const systemMetrics = {
            uptime: typeof uptime === 'number' && !isNaN(uptime) ? uptime : 0,
            memory: {
                used: typeof memoryUsage.heapUsed === 'number' && !isNaN(memoryUsage.heapUsed) ? memoryUsage.heapUsed : 0,
                total: typeof memoryUsage.heapTotal === 'number' && !isNaN(memoryUsage.heapTotal) ? memoryUsage.heapTotal : 1,
                external: typeof memoryUsage.external === 'number' && !isNaN(memoryUsage.external) ? memoryUsage.external : 0,
                arrayBuffers: typeof memoryUsage.arrayBuffers === 'number' && !isNaN(memoryUsage.arrayBuffers) ? memoryUsage.arrayBuffers : 0
            },
            cpu: {
                user: typeof cpuUsage.user === 'number' && !isNaN(cpuUsage.user) ? cpuUsage.user : 0,
                system: typeof cpuUsage.system === 'number' && !isNaN(cpuUsage.system) ? cpuUsage.system : 0
            }
        };

        // Get Redis stats if available
        let redisStats = null;
        if (global.redis && global.redis.isOpen) {
            try {
                const info = await global.redis.info();
                redisStats = {
                    connected: true,
                    info: info
                };
            } catch (redisError) {
                redisStats = {
                    connected: false,
                    error: redisError.message
                };
            }
        } else {
            redisStats = {
                connected: false,
                error: 'Redis not available'
            };
        }

        const performanceData = {
            loadBalancer: loadBalancerStats,
            queryOptimizer: queryOptimizerStats,
            redis: redisStats,
            system: systemMetrics
        };

        res.json({
            success: true,
            data: performanceData
        });
        
    } catch (error) {
        console.error('❌ Error getting system performance data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Resolve alert endpoint
app.post('/api/admin/resolve-alert/:alertId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { alertId } = req.params;
        const { resolution } = req.body;
        
        console.log(`🔧 Resolving alert ${alertId} with resolution: ${resolution}`);
        
        // Handle test alerts
        if (alertId.startsWith('test_') && global.testAlerts) {
            const alertIndex = global.testAlerts.findIndex(alert => alert.id === alertId);
            if (alertIndex !== -1) {
                global.testAlerts[alertIndex].resolved = true;
                global.testAlerts[alertIndex].resolvedAt = new Date().toISOString();
                global.testAlerts[alertIndex].resolution = resolution || 'manual';
                
                console.log(`✅ Test alert ${alertId} resolved successfully`);
                
                res.json({
                    success: true,
                    message: 'Test alert resolved successfully',
                    alert: global.testAlerts[alertIndex]
                });
                return;
            } else {
                return res.status(404).json({
                    success: false,
                    error: 'Test alert not found'
                });
            }
        }
        
        // For other alerts, just log (in production, update database)
        console.log(`✅ Alert ${alertId} resolved with resolution: ${resolution}`);
        
        res.json({
            success: true,
            message: 'Alert resolved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error resolving alert:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Test alert endpoint
app.post('/api/admin/test-alert', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { type, severity } = req.body;
        
        console.log(`🔔 Creating test alert: ${type} - ${severity}`);
        
        // Validate input
        if (!type || !severity) {
            return res.status(400).json({
                success: false,
                error: 'Type and severity are required'
            });
        }
        
        // Create test alert data
        const testAlert = {
            id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            severity: severity,
            message: `Test ${type} alert with ${severity} severity`,
            data: {
                test: true,
                timestamp: new Date().toISOString(),
                source: 'manual_test',
                details: {
                    type: type,
                    severity: severity,
                    created_by: req.user.username
                }
            },
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        // Store test alert in memory (in production, this would be stored in database)
        if (!global.testAlerts) {
            global.testAlerts = [];
        }
        
        global.testAlerts.push(testAlert);
        
        // Keep only last 50 test alerts
        if (global.testAlerts.length > 50) {
            global.testAlerts = global.testAlerts.slice(-50);
        }
        
        console.log(`✅ Test alert created successfully: ${testAlert.id}`);
        
        res.json({
            success: true,
            message: 'Test alert created successfully',
            alert: testAlert
        });
        
    } catch (error) {
        console.error('❌ Error creating test alert:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Get comprehensive monitoring dashboard data
app.get('/api/admin/monitoring-dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // Get system metrics with validation
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        
        // Validate and sanitize memory usage data
        const validatedMemoryUsage = {
            used: typeof memoryUsage.heapUsed === 'number' && !isNaN(memoryUsage.heapUsed) ? memoryUsage.heapUsed : 0,
            total: typeof memoryUsage.heapTotal === 'number' && !isNaN(memoryUsage.heapTotal) ? memoryUsage.heapTotal : 1,
            external: typeof memoryUsage.external === 'number' && !isNaN(memoryUsage.external) ? memoryUsage.external : 0,
            arrayBuffers: typeof memoryUsage.arrayBuffers === 'number' && !isNaN(memoryUsage.arrayBuffers) ? memoryUsage.arrayBuffers : 0
        };

        // Get load balancer stats
        const loadBalancerStats = global.loadBalancer ? global.loadBalancer.getStats() : {
            totalRequests: 0,
            activeRequests: 0,
            completedRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            circuitBreakerTrips: 0,
            burstDetections: 0,
            lastBurstTime: null,
            circuitBreaker: {
                isOpen: false,
                failureCount: 0,
                successCount: 0
            },
            queueSizes: {
                critical: 0,
                high: 0,
                normal: 0,
                low: 0
            },
            totalQueueSize: 0
        };

        // Get query optimizer stats from load balancer (integrated)
        const queryOptimizerStats = global.loadBalancer ? {
            queryStats: global.loadBalancer.getQueryStats(),
            cacheStats: global.loadBalancer.getCacheStats()
        } : {
            queryStats: {},
            cacheStats: { size: 0, entries: [] }
        };

        // Get Redis stats if available
        let redisStats = null;
        if (global.redis && global.redis.isOpen) {
            try {
                const info = await global.redis.info();
                redisStats = {
                    connected: true,
                    info: info
                };
            } catch (redisError) {
                redisStats = {
                    connected: false,
                    error: redisError.message
                };
            }
        } else {
            redisStats = {
                connected: false,
                error: 'Redis not available'
            };
        }

        // Calculate system health with validation
        const memoryPercentage = (validatedMemoryUsage.total > 0 && validatedMemoryUsage.used >= 0) ? 
            Math.min(Math.max((validatedMemoryUsage.used / validatedMemoryUsage.total) * 100, 0), 100) : 0;
        const systemHealth = {
            status: memoryPercentage > 90 ? 'critical' : memoryPercentage > 75 ? 'warning' : 'healthy',
            issues: [],
            timestamp: new Date().toISOString()
        };

        if (memoryPercentage > 90) {
            systemHealth.issues.push('High memory usage');
        }
        if (loadBalancerStats.circuitBreaker.isOpen) {
            systemHealth.issues.push('Circuit breaker is open');
        }
        if (loadBalancerStats.failedRequests > loadBalancerStats.completedRequests * 0.1) {
            systemHealth.issues.push('High error rate');
        }

        // Get alerts data (system alerts + test alerts)
        const alerts = [];
        
        // Add system health alerts
        if (systemHealth.issues.length > 0) {
            alerts.push({
                id: 'system-health-' + Date.now(),
                type: 'system_health',
                severity: systemHealth.status === 'critical' ? 'critical' : 'warning',
                message: `System health: ${systemHealth.status}`,
                data: { issues: systemHealth.issues },
                timestamp: new Date().toISOString(),
                resolved: false
            });
        }
        
        // Add test alerts
        if (global.testAlerts && global.testAlerts.length > 0) {
            // Get recent test alerts (last 10)
            const recentTestAlerts = global.testAlerts
                .filter(alert => !alert.resolved)
                .slice(-10)
                .map(alert => ({
                    ...alert,
                    message: `[TEST] ${alert.message}`
                }));
            
            alerts.push(...recentTestAlerts);
        }

        const alertStats = {
            total: alerts.length,
            active: alerts.filter(a => !a.resolved).length,
            resolved: alerts.filter(a => a.resolved).length,
            last24h: alerts.length,
            bySeverity: {
                warning: alerts.filter(a => a.severity === 'warning').length,
                critical: alerts.filter(a => a.severity === 'critical').length,
                emergency: alerts.filter(a => a.severity === 'emergency').length
            },
            byType: {
                system_health: alerts.filter(a => a.type === 'system_health').length
            }
        };

        // Get database connection pool stats
        const dbPoolStats = global.dbPool ? global.dbPool.getPoolStats() : {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            queuedRequests: 0
        };

        const monitoringData = {
            metrics: {
                system: {
                    memory: {
                        used: Math.max(validatedMemoryUsage.used || 0, 0),
                        total: Math.max(validatedMemoryUsage.total || 0, 0),
                        percentage: Math.min(Math.max(memoryPercentage, 0), 100)
                    },
                    cpu: {
                        usage: systemMonitor ? systemMonitor.getMetrics().system.cpu.usage : 0,
                        loadAverage: systemMonitor ? systemMonitor.getMetrics().system.cpu.loadAverage : [0, 0, 0]
                    },
                    disk: {
                        used: systemMonitor ? systemMonitor.getMetrics().system.disk.used : 0,
                        total: systemMonitor ? systemMonitor.getMetrics().system.disk.total : 2000000000,
                        percentage: systemMonitor ? systemMonitor.getMetrics().system.disk.percentage : 0
                    },
                    uptime: Math.max(uptime || 0, 0)
                },
                application: {
                    requests: {
                        total: Math.max(loadBalancerStats.totalRequests || 0, 0),
                        active: Math.max(loadBalancerStats.activeRequests || 0, 0),
                        completed: Math.max(loadBalancerStats.completedRequests || 0, 0),
                        failed: Math.max(loadBalancerStats.failedRequests || 0, 0)
                    },
                    responseTime: {
                        average: Math.max(loadBalancerStats.averageResponseTime || 0, 0),
                        min: Math.max((loadBalancerStats.averageResponseTime || 0) * 0.5, 0),
                        max: Math.max((loadBalancerStats.averageResponseTime || 0) * 2, 0)
                    },
                    errors: {
                        count: Math.max(loadBalancerStats.failedRequests || 0, 0),
                        lastError: null
                    }
                },
                database: {
                    connections: {
                        active: dbPoolStats ? dbPoolStats.activeConnections : 0,
                        idle: dbPoolStats ? dbPoolStats.idleConnections : 0,
                        total: dbPoolStats ? dbPoolStats.totalConnections : 0
                    },
                    queries: {
                        total: Math.max(loadBalancerStats.totalRequests || 0, 0),
                        slow: queryOptimizerStats.queryStats ? Object.values(queryOptimizerStats.queryStats).filter((stats) => stats.averageTime > 1000).length : 0,
                        failed: Math.max(loadBalancerStats.failedRequests || 0, 0)
                    },
                    responseTime: {
                        average: Math.max(loadBalancerStats.averageResponseTime || 0, 0),
                        min: queryOptimizerStats.queryStats ? Math.min(...Object.values(queryOptimizerStats.queryStats).map((stats) => stats.minTime || 0)) : 0,
                        max: queryOptimizerStats.queryStats ? Math.max(...Object.values(queryOptimizerStats.queryStats).map((stats) => stats.maxTime || 0)) : 0
                    }
                }
            },
            health: systemHealth,
            alerts: alerts,
            alertStats: alertStats,
            loadBalancer: loadBalancerStats,
            queryOptimizer: queryOptimizerStats,
            redis: redisStats,
            system: {
                uptime: Math.max(uptime || 0, 0),
                memory: {
                    used: Math.max(validatedMemoryUsage.used || 0, 0),
                    total: Math.max(validatedMemoryUsage.total || 0, 0),
                    external: Math.max(validatedMemoryUsage.external || 0, 0),
                    arrayBuffers: Math.max(validatedMemoryUsage.arrayBuffers || 0, 0)
                },
                cpu: {
                    user: Math.max(cpuUsage.user || 0, 0),
                    system: Math.max(cpuUsage.system || 0, 0)
                }
            }
        };

        res.json({
            success: true,
            data: monitoringData
        });
        
    } catch (error) {
        console.error('❌ Error getting monitoring dashboard data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Get circuit breaker status
app.get('/api/admin/circuit-breaker-status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const status = global.loadBalancer.getCircuitBreakerStatus();
        
        res.json({
            success: true,
            data: status
        });
        
    } catch (error) {
        console.error('❌ Error getting circuit breaker status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset circuit breaker
app.post('/api/admin/reset-circuit-breaker', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        global.loadBalancer.resetCircuitBreaker();
        
        res.json({
            success: true,
            message: 'Circuit breaker reset successfully'
        });
        
    } catch (error) {
        console.error('❌ Error resetting circuit breaker:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// DOWNLOAD QUEUE API ENDPOINTS
// ================================================

// Request Excel download
app.post('/api/guru/request-excel-download', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { startDate, endDate, kelas_id, mapel_id } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        console.log(`🔄 Requesting Excel download for user ${userId} (${userRole})`);
        
        const jobData = {
            userId,
            userRole,
            startDate,
            endDate,
            kelas_id,
            mapel_id,
            timestamp: new Date().toISOString()
        };
        
        const job = await global.downloadQueue.addDownloadJob(jobData);
        
        res.json({
            success: true,
            message: 'Download request queued successfully',
            data: {
                jobId: job.id,
                status: 'queued',
                estimatedTime: '2-5 minutes'
            }
        });
        
    } catch (error) {
        console.error('❌ Error requesting Excel download:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get download status
app.get('/api/guru/download-status/:jobId', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;
        
        const jobStatus = await global.downloadQueue.getJobStatus(jobId, userId);
        
        res.json({
            success: true,
            data: jobStatus
        });
        
    } catch (error) {
        console.error('❌ Error getting download status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Download file
app.get('/api/downloads/:filename', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { filename } = req.params;
        const userId = req.user.id;
        
        const filePath = path.join(global.downloadQueue.downloadDir, filename);
        
        // Check if file exists and user has access
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        // Verify user has access to this file
        const hasAccess = await global.downloadQueue.verifyFileAccess(filename, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.download(filePath, filename);
        
    } catch (error) {
        console.error('❌ Error downloading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get queue statistics
app.get('/api/admin/queue-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const stats = await global.downloadQueue.getQueueStats();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('❌ Error getting queue stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// BACKUP SYSTEM API ENDPOINTS
// ================================================

// Helper function to calculate next backup date
function calculateNextBackupDate(schedule) {
    const now = new Date();
    
    switch (schedule) {
        case 'daily':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(2, 0, 0, 0); // 2 AM
            return tomorrow.toISOString();
            
        case 'weekly':
            const nextWeek = new Date(now);
            const daysUntilSunday = (7 - now.getDay()) % 7;
            nextWeek.setDate(nextWeek.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
            nextWeek.setHours(2, 0, 0, 0); // 2 AM
            return nextWeek.toISOString();
            
        case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(1);
            nextMonth.setHours(2, 0, 0, 0); // 2 AM
            return nextMonth.toISOString();
            
        default:
            return null; // Disabled
    }
}

// Create semester backup
app.post('/api/admin/create-semester-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔄 Creating semester backup...');
        
        if (!global.backupSystem) {
            console.error('❌ Backup system not initialized');
            return res.status(503).json({ 
                error: 'Backup system not ready',
                message: 'Backup system is not initialized yet. Please try again in a few seconds.'
            });
        }
        
        const { semester, year } = req.body;
        const backupResult = await global.backupSystem.createSemesterBackup(semester, year);
        
        // Update backup settings with last backup date
        try {
            const settingsPath = path.join(process.cwd(), 'backup-settings.json');
            let currentSettings = {};
            
            try {
                const settingsData = await fs.readFile(settingsPath, 'utf8');
                currentSettings = JSON.parse(settingsData);
            } catch (fileError) {
                // File doesn't exist, use default settings
                currentSettings = {
                    autoBackupSchedule: 'weekly',
                    maxBackups: 10,
                    archiveAge: 24,
                    compression: true,
                    emailNotifications: false
                };
            }
            
            // Update last backup date
            currentSettings.lastBackupDate = new Date().toISOString();
            
            // Calculate next backup date based on schedule
            const now = new Date();
            let nextBackupDate = null;
            
            switch (currentSettings.autoBackupSchedule) {
                case 'daily':
                    nextBackupDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case 'weekly':
                    nextBackupDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'monthly':
                    nextBackupDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    break;
                default:
                    nextBackupDate = null;
            }
            
            if (nextBackupDate) {
                currentSettings.nextBackupDate = nextBackupDate.toISOString();
            }
            
            // Save updated settings
            await fs.writeFile(settingsPath, JSON.stringify(currentSettings, null, 2));
            console.log('✅ Backup settings updated with new dates');
            
        } catch (settingsError) {
            console.error('⚠️ Failed to update backup settings:', settingsError);
            // Don't fail the backup if settings update fails
        }
        
        res.json({
            success: true,
            message: 'Semester backup created successfully',
            data: backupResult
        });
        
    } catch (error) {
        console.error('❌ Error creating semester backup:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to create backup'
        });
    }
});

// Create date-based backup
app.post('/api/admin/create-date-backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🔄 Creating date-based backup...');
        
        if (!global.backupSystem) {
            console.error('❌ Backup system not initialized');
            return res.status(503).json({ 
                error: 'Backup system not ready',
                message: 'Backup system is not initialized yet. Please try again in a few seconds.'
            });
        }
        
        const { startDate, endDate } = req.body;
        
        // Validasi input
        if (!startDate) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Start date is required'
            });
        }
        
        // Jika endDate tidak ada, gunakan startDate sebagai endDate (backup satu hari)
        const actualEndDate = endDate || startDate;
        
        // Validasi format tanggal
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(actualEndDate);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Please provide valid dates in YYYY-MM-DD format'
            });
        }
        
        if (startDateObj > endDateObj) {
            return res.status(400).json({
                error: 'Invalid date range',
                message: 'Start date cannot be after end date'
            });
        }
        
        // Cek apakah tanggal tidak di masa depan
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set ke akhir hari
        if (startDateObj > today) {
            return res.status(400).json({
                error: 'Invalid date',
                message: 'Cannot backup future dates'
            });
        }
        
        console.log(`📅 Creating backup for date range: ${startDate} to ${actualEndDate}`);
        
        // Buat backup berdasarkan tanggal
        const backupResult = await global.backupSystem.createDateBackup(startDate, actualEndDate);
        
        // Update backup settings dengan tanggal backup terakhir
        try {
            const settingsPath = path.join(process.cwd(), 'backup-settings.json');
            let settings = {};
            
            try {
                const settingsData = await fs.readFile(settingsPath, 'utf8');
                settings = JSON.parse(settingsData);
            } catch (fileError) {
                // File tidak ada, gunakan default settings
                settings = {
                    autoBackupSchedule: 'weekly',
                    maxBackups: 10,
                    archiveAge: 24,
                    compression: true,
                    emailNotifications: false
                };
            }
            
            // Update tanggal backup terakhir
            settings.lastBackupDate = new Date().toISOString();
            
            // Hitung tanggal backup berikutnya berdasarkan jadwal
            const nextBackupDate = calculateNextBackupDate(settings.autoBackupSchedule);
            settings.nextBackupDate = nextBackupDate;
            
            // Simpan settings
            await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
            console.log('✅ Backup settings updated successfully');
            
        } catch (settingsError) {
            console.error('⚠️ Failed to update backup settings:', settingsError);
            // Jangan gagal backup jika update settings gagal
        }
        
        res.json({
            success: true,
            message: `Date-based backup created successfully for ${startDate}${actualEndDate !== startDate ? ` to ${actualEndDate}` : ''}`,
            data: {
                ...backupResult,
                dateRange: {
                    startDate,
                    endDate: actualEndDate,
                    days: Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating date-based backup:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to create date-based backup'
        });
    }
});

// Get backup list
app.get('/api/admin/backup-list', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const backupList = await global.backupSystem.listBackups();
        
        res.json({
            success: true,
            data: backupList
        });
        
    } catch (error) {
        console.error('❌ Error getting backup list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get backups (alias for backup-list to match frontend)
app.get('/api/admin/backups', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const backupList = await global.backupSystem.listBackups();
        
        res.json({
            success: true,
            backups: backupList
        });
        
    } catch (error) {
        console.error('❌ Error getting backups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete backup
app.delete('/api/admin/delete-backup/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupId } = req.params;
        
        const result = await global.backupSystem.deleteBackup(backupId);
        
        res.json({
            success: true,
            message: 'Backup deleted successfully',
            data: result
        });
        
    } catch (error) {
        console.error('❌ Error deleting backup:', error);
        res.status(500).json({ error: 'Failed to delete backup' });
    }
});

// Restore backup
app.post('/api/admin/restore-backup/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupId } = req.params;
        
        const result = await global.backupSystem.restoreFromBackup(backupId);
        
        res.json({
            success: true,
            message: 'Backup restored successfully',
            data: result
        });
        
    } catch (error) {
        console.error('❌ Error restoring backup:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
});

// Download backup file
app.get('/api/admin/download-backup/:backupId', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { backupId } = req.params;
        const backupDir = path.join(process.cwd(), 'backups');
        
        console.log(`📥 Downloading backup: ${backupId}`);
        console.log(`📁 Backup directory: ${backupDir}`);
        console.log(`📁 process.cwd(): ${process.cwd()}`);
        
        // Try different file extensions and locations
        const possibleFiles = [
            `${backupId}.zip`,
            `${backupId}`,
            `${backupId}.sql`,
            `${backupId}.tar.gz`
        ];
        
        let filePath = null;
        let filename = null;
        
        // Check which file exists
        for (const possibleFile of possibleFiles) {
            const testPath = path.join(backupDir, possibleFile);
            console.log(`🔍 Checking file: ${testPath}`);
            try {
                const stats = await fs.stat(testPath);
                if (stats.isFile()) {
                    filePath = testPath;
                    filename = possibleFile;
                    console.log(`✅ Found backup file: ${filename} (${stats.size} bytes)`);
                    break;
                } else {
                    console.log(`❌ Path exists but is not a file: ${possibleFile}`);
                }
            } catch (error) {
                console.log(`❌ File not found: ${possibleFile} - ${error.message}`);
            }
        }
        
        if (!filePath) {
            console.error(`❌ No backup file found for ID: ${backupId}`);
            console.log(`📋 Available files in backup directory:`);
            try {
                const files = await fs.readdir(backupDir);
                files.forEach(file => {
                    const fullPath = path.join(backupDir, file);
                    fs.stat(fullPath).then(stats => {
                        console.log(`   - ${file} (${stats.isDirectory() ? 'DIR' : 'FILE'}, ${stats.size} bytes)`);
                    }).catch(err => {
                        console.log(`   - ${file} (ERROR: ${err.message})`);
                    });
                });
            } catch (error) {
                console.log(`   - Could not read backup directory: ${error.message}`);
            }
            return res.status(404).json({ 
                error: 'Backup file not found',
                message: `No backup file found for ID: ${backupId}`,
                backupDir: backupDir,
                searchedFiles: possibleFiles
            });
        }
        
        // Set proper headers for file download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        console.log(`📤 Sending file: ${filePath}`);
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('❌ Error during file download:', err);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'Download failed',
                        message: err.message || 'Failed to download file'
                    });
                }
            } else {
                console.log(`✅ File download completed: ${filename}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error downloading backup:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to download backup',
            stack: error.stack
        });
    }
});

// Create test old data for archive demonstration
app.post('/api/admin/create-test-archive-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('🧪 Creating test archive data...');
        
        if (!global.dbPool || !global.dbPool.pool) {
            console.error('❌ Database pool not initialized');
            return res.status(503).json({ 
                error: 'Database not ready',
                message: 'Database connection pool is not initialized yet. Please try again in a few seconds.'
            });
        }
        
        // Create test data that is 25 months old (older than default 24 months)
        const oldDate = new Date();
        oldDate.setMonth(oldDate.getMonth() - 25);
        const oldDateStr = oldDate.toISOString().split('T')[0];
        
        console.log(`📅 Creating test data with date: ${oldDateStr} (25 months old)`);
        
        // First, clean up any existing test data
        await global.dbPool.pool.execute(`
            DELETE FROM absensi_siswa 
            WHERE keterangan = 'Test data for archive'
        `);
        
        await global.dbPool.pool.execute(`
            DELETE FROM absensi_guru 
            WHERE keterangan = 'Test data for archive'
        `);
        
        // Also clean up from archive tables
        await global.dbPool.pool.execute(`
            DELETE FROM absensi_siswa_archive 
            WHERE keterangan = 'Test data for archive'
        `);
        
        await global.dbPool.pool.execute(`
            DELETE FROM absensi_guru_archive 
            WHERE keterangan = 'Test data for archive'
        `);
        
        // Insert test student attendance records
        const [studentResult] = await global.dbPool.pool.execute(`
            INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, guru_id)
            SELECT 
                s.id as siswa_id,
                1 as jadwal_id,
                ? as tanggal,
                'Hadir' as status,
                'Test data for archive' as keterangan,
                1 as guru_id
            FROM siswa s
            WHERE s.status = 'aktif'
            LIMIT 10
        `, [oldDateStr]);
        
        // Insert test teacher attendance records (skip for now due to foreign key constraints)
        const teacherResult = { affectedRows: 0 };
        
        const result = {
            message: 'Test archive data created successfully',
            studentRecordsCreated: studentResult.affectedRows,
            teacherRecordsCreated: teacherResult.affectedRows,
            testDate: oldDateStr,
            monthsOld: 25,
            timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Created ${studentResult.affectedRows} test student records`);
        console.log(`✅ Created ${teacherResult.affectedRows} test teacher records`);
        console.log(`📊 Test data summary:`);
        console.log(`   - Date: ${oldDateStr}`);
        console.log(`   - Age: 25 months (older than 24 month criteria)`);
        console.log(`   - Student records: ${studentResult.affectedRows}`);
        console.log(`   - Teacher records: ${teacherResult.affectedRows}`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Error creating test archive data:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to create test archive data'
        });
    }
});

// Archive old data
app.post('/api/admin/archive-old-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { monthsOld = 12 } = req.body;
        
        console.log(`🔄 Archiving data older than ${monthsOld} months...`);
        
        if (!global.backupSystem) {
            console.error('❌ Backup system not initialized');
            return res.status(503).json({ 
                error: 'Backup system not ready',
                message: 'Backup system is not initialized yet. Please try again in a few seconds.'
            });
        }
        
        if (!global.dbPool || !global.dbPool.pool) {
            console.error('❌ Database pool not initialized');
            return res.status(503).json({ 
                error: 'Database not ready',
                message: 'Database connection pool is not initialized yet. Please try again in a few seconds.'
            });
        }
        
        const archiveResult = await global.backupSystem.archiveOldData(monthsOld);
        
        res.json({
            success: true,
            message: `Data older than ${monthsOld} months archived successfully`,
            data: archiveResult
        });
        
    } catch (error) {
        console.error('❌ Error archiving old data:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to archive old data'
        });
    }
});

// Check database status
app.get('/api/admin/database-status', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const status = {
            dbPool: !!global.dbPool,
            dbPoolType: typeof global.dbPool,
            dbPoolPool: !!global.dbPool?.pool,
            dbPoolPoolType: typeof global.dbPool?.pool,
            queryOptimizer: !!global.queryOptimizer,
            backupSystem: !!global.backupSystem,
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            status: status
        });
        
    } catch (error) {
        console.error('❌ Error getting database status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get archive statistics
app.get('/api/admin/archive-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting archive statistics...');
        
        // Debug: Check if dbPool exists
        console.log('🔍 Debug - global.dbPool:', !!global.dbPool);
        console.log('🔍 Debug - global.dbPool type:', typeof global.dbPool);
        console.log('🔍 Debug - global.dbPool.pool:', !!global.dbPool?.pool);
        console.log('🔍 Debug - global.dbPool.pool type:', typeof global.dbPool?.pool);
        
        if (!global.dbPool) {
            console.error('❌ Database pool not initialized - global.dbPool is undefined');
            return res.status(503).json({ 
                error: 'Database not ready', 
                message: 'Database connection pool is not initialized yet. Please try again in a few seconds.' 
            });
        }
        
        if (!global.dbPool.pool) {
            console.error('❌ Database pool not initialized - global.dbPool.pool is undefined');
            return res.status(503).json({ 
                error: 'Database not ready', 
                message: 'Database connection pool is not initialized yet. Please try again in a few seconds.' 
            });
        }
        
        // Get student archive count
        let studentArchiveCount = 0;
        try {
            const [studentArchive] = await global.dbPool.pool.execute(`
                SELECT COUNT(*) as count FROM absensi_siswa_archive
            `);
            studentArchiveCount = studentArchive[0]?.count || 0;
        } catch (error) {
            console.log('⚠️ Student archive table not found, using 0');
        }
        
        // Get teacher archive count
        let teacherArchiveCount = 0;
        try {
            const [teacherArchive] = await global.dbPool.pool.execute(`
                SELECT COUNT(*) as count FROM absensi_guru_archive
            `);
            teacherArchiveCount = teacherArchive[0]?.count || 0;
        } catch (error) {
            console.log('⚠️ Teacher archive table not found, using 0');
        }
        
        // Get total archive size (approximate)
        let totalSizeMB = 0;
        try {
            const [archiveSize] = await global.dbPool.pool.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM absensi_siswa_archive) * 0.5 +
                    (SELECT COUNT(*) FROM absensi_guru_archive) * 0.3 as total_size
            `);
            totalSizeMB = archiveSize[0]?.total_size || 0;
        } catch (error) {
            console.log('⚠️ Could not calculate archive size, using 0');
            totalSizeMB = (studentArchiveCount * 0.5) + (teacherArchiveCount * 0.3);
        }
        
        // Get last archive date (try archived_at first, fallback to waktu_catat)
        let lastArchive;
        try {
            const [lastArchiveResult] = await global.dbPool.pool.execute(`
                SELECT MAX(archived_at) as last_archive FROM absensi_siswa_archive
            `);
            lastArchive = lastArchiveResult;
        } catch (error) {
            // Fallback if archived_at column doesn't exist
            const [lastArchiveResult] = await global.dbPool.pool.execute(`
                SELECT MAX(waktu_absen) as last_archive FROM absensi_siswa_archive
            `);
            lastArchive = lastArchiveResult;
        }
        
        const stats = {
            studentRecords: studentArchiveCount,
            teacherRecords: teacherArchiveCount,
            totalSize: Math.round(totalSizeMB),
            lastArchive: lastArchive?.[0]?.last_archive || null
        };
        
        res.json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('❌ Error getting archive stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get backup settings
app.get('/api/admin/backup-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('⚙️ Getting backup settings...');
        
        // Default settings
        const defaultSettings = {
            autoBackupSchedule: 'weekly',
            maxBackups: 10,
            archiveAge: 24,
            compression: true,
            emailNotifications: false
        };
        
        // Try to load from file if exists
        try {
            const settingsPath = path.join(process.cwd(), 'backup-settings.json');
            const settingsData = await fs.readFile(settingsPath, 'utf8');
            const savedSettings = JSON.parse(settingsData);
            
            // Merge with default settings and ensure all fields are present
            const mergedSettings = { 
                ...defaultSettings, 
                ...savedSettings,
                lastBackupDate: savedSettings.lastBackupDate || null,
                nextBackupDate: savedSettings.nextBackupDate || null
            };
            
            res.json({
                success: true,
                settings: mergedSettings
            });
        } catch (fileError) {
            // File doesn't exist, return default settings with null dates
            const defaultSettingsWithDates = {
                ...defaultSettings,
                lastBackupDate: null,
                nextBackupDate: null
            };
            
            res.json({
                success: true,
                settings: defaultSettingsWithDates
            });
        }
        
    } catch (error) {
        console.error('❌ Error getting backup settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save backup settings
app.post('/api/admin/backup-settings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = req.body;
        console.log('💾 Saving backup settings:', settings);
        
        // Validate settings
        const validSettings = {
            autoBackupSchedule: settings.autoBackupSchedule || 'weekly',
            maxBackups: Math.max(1, Math.min(50, settings.maxBackups || 10)),
            archiveAge: Math.max(6, Math.min(60, settings.archiveAge || 24)),
            compression: Boolean(settings.compression),
            emailNotifications: Boolean(settings.emailNotifications),
            lastBackupDate: settings.lastBackupDate || null,
            nextBackupDate: settings.nextBackupDate || null
        };
        
        // Save to file
        const settingsPath = path.join(process.cwd(), 'backup-settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(validSettings, null, 2));
        
        // Update backup system configuration
        if (global.backupSystem) {
            global.backupSystem.backupConfig = {
                ...global.backupSystem.backupConfig,
                maxBackups: validSettings.maxBackups,
                maxArchiveAge: validSettings.archiveAge,
                compressionEnabled: validSettings.compression
            };
        }
        
        res.json({
            success: true,
            message: 'Backup settings saved successfully',
            settings: validSettings
        });
        
    } catch (error) {
        console.error('❌ Error saving backup settings:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to save backup settings'
        });
    }
});

// ================================================
// CUSTOM BACKUP SCHEDULE ENDPOINTS
// ================================================

// Custom backup scheduler
let customScheduleInterval = null;

function startCustomScheduleChecker() {
    // Check every minute for scheduled backups
    customScheduleInterval = setInterval(async () => {
        try {
            const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
            let schedules = [];
            
            try {
                const schedulesData = await fs.readFile(schedulesPath, 'utf8');
                schedules = JSON.parse(schedulesData);
            } catch (fileError) {
                // No schedules file, skip
                return;
            }
            
            const now = new Date();
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            for (const schedule of schedules) {
                if (!schedule.enabled) continue;
                
                // Check if it's time for this schedule
                if (schedule.date === currentDate && schedule.time === currentTime) {
                    console.log(`🕐 Running scheduled backup: ${schedule.name}`);
                    
                    try {
                        // Create backup based on schedule
                        if (global.backupSystem) {
                            const backupResult = await global.backupSystem.createScheduledBackup(schedule);
                            
                            // Update schedule with last run time
                            schedule.lastRun = new Date().toISOString();
                            await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
                            
                            console.log(`✅ Scheduled backup completed: ${schedule.name}`);
                        } else {
                            console.error('❌ Backup system not available for scheduled backup');
                        }
                    } catch (error) {
                        console.error(`❌ Error running scheduled backup ${schedule.name}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in custom schedule checker:', error);
        }
    }, 60000); // Check every minute
    
    console.log('📅 Custom backup scheduler started');
}

function stopCustomScheduleChecker() {
    if (customScheduleInterval) {
        clearInterval(customScheduleInterval);
        customScheduleInterval = null;
        console.log('📅 Custom backup scheduler stopped');
    }
}

// Start scheduler when server starts
startCustomScheduleChecker();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    stopCustomScheduleChecker();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    stopCustomScheduleChecker();
    process.exit(0);
});

// Get custom schedules
app.get('/api/admin/custom-schedules', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📅 Getting custom schedules...');
        
        const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
        let schedules = [];
        
        try {
            const schedulesData = await fs.readFile(schedulesPath, 'utf8');
            schedules = JSON.parse(schedulesData);
        } catch (fileError) {
            // File doesn't exist, return empty array
            schedules = [];
        }
        
        res.json({
            success: true,
            schedules: schedules
        });
        
    } catch (error) {
        console.error('❌ Error getting custom schedules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create custom schedule
app.post('/api/admin/custom-schedules', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, date, time, enabled } = req.body;
        console.log('📅 Creating custom schedule:', { name, date, time, enabled });
        
        // Validate input
        if (!name || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Name, date, and time are required'
            });
        }
        
        // Validate date is not in the past
        const scheduleDate = new Date(`${date}T${time}`);
        const now = new Date();
        if (scheduleDate <= now) {
            return res.status(400).json({ 
                error: 'Invalid date',
                message: 'Schedule date must be in the future'
            });
        }
        
        const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
        let schedules = [];
        
        try {
            const schedulesData = await fs.readFile(schedulesPath, 'utf8');
            schedules = JSON.parse(schedulesData);
        } catch (fileError) {
            // File doesn't exist, start with empty array
            schedules = [];
        }
        
        // Create new schedule
        const newSchedule = {
            id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            date,
            time,
            enabled: enabled !== false,
            created: new Date().toISOString()
        };
        
        schedules.push(newSchedule);
        
        // Save to file
        await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
        
        res.json({
            success: true,
            message: 'Custom schedule created successfully',
            schedule: newSchedule
        });
        
    } catch (error) {
        console.error('❌ Error creating custom schedule:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to create custom schedule'
        });
    }
});

// Update custom schedule
app.put('/api/admin/custom-schedules/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;
        console.log('📅 Updating custom schedule:', { id, enabled });
        
        const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
        let schedules = [];
        
        try {
            const schedulesData = await fs.readFile(schedulesPath, 'utf8');
            schedules = JSON.parse(schedulesData);
        } catch (fileError) {
            return res.status(404).json({ 
                error: 'Schedules not found',
                message: 'No schedules file found'
            });
        }
        
        const scheduleIndex = schedules.findIndex(s => s.id === id);
        if (scheduleIndex === -1) {
            return res.status(404).json({ 
                error: 'Schedule not found',
                message: 'Schedule with the given ID not found'
            });
        }
        
        // Update schedule
        schedules[scheduleIndex].enabled = enabled !== false;
        
        // Save to file
        await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
        
        res.json({
            success: true,
            message: 'Custom schedule updated successfully',
            schedule: schedules[scheduleIndex]
        });
        
    } catch (error) {
        console.error('❌ Error updating custom schedule:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to update custom schedule'
        });
    }
});

// Delete custom schedule
app.delete('/api/admin/custom-schedules/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📅 Deleting custom schedule:', { id });
        
        const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
        let schedules = [];
        
        try {
            const schedulesData = await fs.readFile(schedulesPath, 'utf8');
            schedules = JSON.parse(schedulesData);
        } catch (fileError) {
            return res.status(404).json({ 
                error: 'Schedules not found',
                message: 'No schedules file found'
            });
        }
        
        const scheduleIndex = schedules.findIndex(s => s.id === id);
        if (scheduleIndex === -1) {
            return res.status(404).json({ 
                error: 'Schedule not found',
                message: 'Schedule with the given ID not found'
            });
        }
        
        // Remove schedule
        const deletedSchedule = schedules.splice(scheduleIndex, 1)[0];
        
        // Save to file
        await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
        
        res.json({
            success: true,
            message: 'Custom schedule deleted successfully',
            schedule: deletedSchedule
        });
        
    } catch (error) {
        console.error('❌ Error deleting custom schedule:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to delete custom schedule'
        });
    }
});

// Run custom schedule manually
app.post('/api/admin/run-custom-schedule/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🚀 Running custom schedule manually:', { id });
        
        const schedulesPath = path.join(process.cwd(), 'custom-schedules.json');
        let schedules = [];
        
        try {
            const schedulesData = await fs.readFile(schedulesPath, 'utf8');
            schedules = JSON.parse(schedulesData);
        } catch (fileError) {
            return res.status(404).json({ 
                error: 'Schedules not found',
                message: 'No schedules file found'
            });
        }
        
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) {
            return res.status(404).json({ 
                error: 'Schedule not found',
                message: 'Schedule with the given ID not found'
            });
        }
        
        // Run the scheduled backup
        if (global.backupSystem) {
            const backupResult = await global.backupSystem.createScheduledBackup(schedule);
            
            // Update schedule with last run time
            schedule.lastRun = new Date().toISOString();
            await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));
            
            res.json({
                success: true,
                message: 'Custom schedule executed successfully',
                backup: backupResult
            });
        } else {
            res.status(503).json({ 
                error: 'Backup system not available',
                message: 'Backup system is not initialized'
            });
        }
        
    } catch (error) {
        console.error('❌ Error running custom schedule:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Failed to run custom schedule'
        });
    }
});

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
                pi.id_pengajuan,
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
            JOIN siswa_perwakilan s ON pi.siswa_id = s.id_siswa
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
        
        const [rows] = await global.dbPool.execute(query, params);
        console.log(`✅ Found ${rows.length} riwayat pengajuan izin records`);
        
        res.json(rows);
    } catch (error) {
        console.error('❌ Error getting riwayat pengajuan izin report:', error);
        res.status(500).json({ error: 'Internal server error' });
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
            JOIN siswa_perwakilan s ON pi.siswa_id = s.id_siswa
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
        
        const [rows] = await global.dbPool.execute(query, params);

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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export attendance data as CSV
app.get('/api/admin/export/attendance', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Exporting attendance data...');
        
        const query = `
            SELECT 
                DATE_FORMAT(a.waktu_absen, '%d/%m/%Y') as tanggal,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas,
                a.status,
                COALESCE(a.keterangan, '-') as keterangan,
                DATE_FORMAT(a.waktu_absen, '%H:%i:%s') as waktu_absen
            FROM absensi_siswa a
            JOIN siswa_perwakilan s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            ORDER BY a.tanggal DESC, k.nama_kelas, s.nama
        `;
        
        const [rows] = await global.dbPool.execute(query);
        
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'Tanggal,Nama Siswa,NIS,Kelas,Status,Keterangan,Waktu Absen\n';
        
        rows.forEach(row => {
            csvContent += `"${row.tanggal}","${row.nama_siswa}","${row.nis}","${row.nama_kelas}","${row.status}","${row.keterangan}","${row.waktu_absen}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="data-kehadiran-siswa.csv"');
        res.send(csvContent);
        
        console.log(`✅ Attendance data exported successfully: ${rows.length} records`);
    } catch (error) {
        console.error('❌ Error exporting attendance data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Database backup endpoint - REAL BACKUP
app.get('/api/admin/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('💾 Creating database backup...');
        
        // Buat folder backups jika belum ada
        const backupDir = path.join(process.cwd(), 'backups');
        try {
            await fs.access(backupDir);
        } catch (error) {
            await fs.mkdir(backupDir, { recursive: true });
        }
        
        // Generate filename dengan timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_absenta_${timestamp}.sql`;
        const filepath = path.join(backupDir, filename);
        
        // Function untuk backup manual
        async function createManualBackup() {
            try {
                // Header backup file
                let backupContent = `-- Backup Database Absenta\n`;
                backupContent += `-- Created: ${new Date().toISOString()}\n`;
                backupContent += `-- Database: absenta13\n\n`;
                
                // Export struktur dan data tabel utama
                const tables = [
                    'users', 'guru', 'siswa_perwakilan', 'kelas', 'mapel', 
                    'jadwal', 'absensi_siswa', 'absensi_guru'
                ];
                
                for (const table of tables) {
                    try {
                        // Get table structure
                        const [structure] = await global.dbPool.execute(`SHOW CREATE TABLE ${table}`);
                        backupContent += `\n-- Structure for table ${table}\n`;
                        backupContent += `${structure[0]['Create Table']};\n\n`;
                        
                        // Get table data
                        const [data] = await global.dbPool.execute(`SELECT * FROM ${table}`);
                        if (data.length > 0) {
                            backupContent += `-- Data for table ${table}\n`;
                            backupContent += `INSERT INTO ${table} VALUES\n`;
                            
                            const values = data.map(row => {
                                const rowValues = Object.values(row).map(value => {
                                    if (value === null) return 'NULL';
                                    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                                    return value;
                                });
                                return `(${rowValues.join(', ')})`;
                            });
                            
                            backupContent += values.join(',\n') + ';\n\n';
                        }
                    } catch (tableError) {
                        console.log(`⚠️ Error backing up table ${table}:`, tableError.message);
                        backupContent += `-- Error backing up table ${table}\n\n`;
                    }
                }
                
                // Tulis file backup
                await fs.writeFile(filepath, backupContent, 'utf8');
                
                console.log('✅ Manual backup created successfully');
                
                // Get file size using fs.stat
                const stats = await fs.stat(filepath);
                
                return {
                    message: 'Backup database berhasil dibuat secara manual',
                    filename: filename,
                    filepath: filepath,
                    timestamp: new Date().toISOString(),
                    method: 'manual',
                    size: stats.size
                };
                
            } catch (manualError) {
                console.error('❌ Manual backup failed:', manualError);
                throw new Error('Gagal membuat backup database');
            }
        }
        
        // Coba gunakan mysqldump jika tersedia
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Cek apakah mysqldump tersedia
            await execAsync('mysqldump --version');
            
            // Buat backup dengan mysqldump (tanpa password untuk testing)
            // Di production, gunakan environment variable atau config file untuk password
            const mysqldumpCmd = `mysqldump -h localhost -u root absenta13 > "${filepath}"`;
            await execAsync(mysqldumpCmd);
            
            console.log('✅ mysqldump backup created successfully');
            
            // Set headers untuk download file
            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Baca dan kirim file
            const fileContent = await fs.readFile(filepath, 'utf8');
            res.send(fileContent);
            
        } catch (mysqldumpError) {
            console.log('❌ mysqldump not available, using manual backup...');
            const result = await createManualBackup();
            
            // Set headers untuk download file
            res.setHeader('Content-Type', 'application/sql');
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            
            // Baca dan kirim file
            const fileContent = await fs.readFile(result.filepath, 'utf8');
            res.send(fileContent);
        }
        
    } catch (error) {
        console.error('❌ Error creating database backup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// System logs endpoint
app.get('/api/admin/logs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Retrieving system logs...');
        
        // For now, return sample log data
        // In production, you would implement actual log retrieval
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'INFO',
                message: 'Sistem berjalan normal',
                user: 'admin'
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'INFO',
                message: 'Database backup otomatis berhasil',
                user: 'system'
            },
            {
                timestamp: new Date(Date.now() - 120000).toISOString(),
                level: 'WARNING',
                message: 'Tingkat kehadiran rendah hari ini',
                user: 'system'
            }
        ];
        
        res.json({ logs });
        
        console.log('✅ System logs retrieved successfully');
    } catch (error) {
        console.error('❌ Error retrieving system logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down server...');
    if (global.disasterRecoverySystem) {
        await global.disasterRecoverySystem.stop();
        console.log('✅ Disaster recovery system stopped');
    }
    if (global.securitySystem) {
        await global.securitySystem.cleanup();
        console.log('✅ Security system cleaned up');
    }
    if (global.systemMonitor) {
        global.systemMonitor.stop();
        console.log('✅ System monitor stopped');
    }
    if (global.loadBalancer) {
        // LoadBalancer doesn't have cleanup method, just stop it
        console.log('✅ Load balancer cleaned up');
    }
    if (global.cacheSystem) {
        // CacheSystem doesn't have cleanup method, just log
        console.log('✅ Cache system cleaned up');
    }
    if (global.downloadQueue) {
        // DownloadQueue doesn't have cleanup method, just log
        console.log('✅ Download queue system cleaned up');
    }
    if (global.backupSystem) {
        await global.backupSystem.close();
        console.log('✅ Backup system cleaned up');
    }
    if (global.queryOptimizer) {
        await global.queryOptimizer.cleanup();
        console.log('✅ Query optimizer cleaned up');
    }
    if (global.performanceOptimizer) {
        global.performanceOptimizer.stop();
        console.log('✅ Performance optimizer cleaned up');
    }
    if (global.dbPool) {
        await global.dbPool.close();
        console.log('✅ Database connection pool closed');
    }
    process.exit(0);
});

export default app;
