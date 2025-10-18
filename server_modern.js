console.log('🚀 ABSENTA Modern Server Starting...');

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import ExcelJS from 'exceljs';
import { compressImage, validateImage } from './backend/utils/imageCompression.js';
import { db, pool } from './db.js';

const app = express();
const port = 3001;

// Disable Express default error handler
app.set('trust proxy', true);

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'absenta-super-secret-key-2025';
console.log('🔑 JWT Secret configured:', JWT_SECRET.substring(0, 10) + '...');
const saltRounds = 10;

// Middleware setup
app.use(cors({ 
    credentials: true, 
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'] 
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database configuration is handled by db.js

// Database connection is handled by db.js pool

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
            console.log('❌ Token that failed:', token.substring(0, 50) + '...');
            console.log('🔑 JWT Secret used:', JWT_SECRET.substring(0, 10) + '...');
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
        console.log('🔍 RBAC Debug - Required roles:', roles);
        console.log('🔍 RBAC Debug - User role:', req.user.role);
        console.log('🔍 RBAC Debug - Role match:', roles.includes(req.user.role));
        
        if (!roles.includes(req.user.role)) {
            console.log('❌ RBAC: Access denied for role:', req.user.role);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        console.log('✅ RBAC: Access granted for role:', req.user.role);
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

        // Query user from database - try users table first, fallback to pengguna
        let [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ? AND status = "aktif"',
            [username]
        );
        
        // If no results from users table, try pengguna table
        if (rows.length === 0) {
            console.log('🔄 Trying pengguna table for user:', username);
            [rows] = await db.execute(
                'SELECT * FROM pengguna WHERE nama_pengguna = ? AND (status = "aktif" OR status IS NULL)',
                [username]
            );
            
            // Transform pengguna data to users format
            if (rows.length > 0) {
                const penggunaUser = rows[0];
                rows = [{
                    id: penggunaUser.id,
                    username: penggunaUser.nama_pengguna,
                    password: penggunaUser.kata_sandi,
                    role: penggunaUser.peran,
                    nama: penggunaUser.nama,
                    email: penggunaUser.email,
                    status: penggunaUser.status || 'aktif'
                }];
            }
        }

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
        
        if (user.role === 'guru' || user.role === 'GURU' || user.role.toLowerCase() === 'guru') {
            console.log('🔍 Debug: Looking for guru data for user_id:', user.id);
            const [guruData] = await db.execute(
                `SELECT g.*, m.nama_mapel 
                 FROM guru g 
                 JOIN mapel m ON g.mapel_id = m.id_mapel 
                 WHERE g.user_id = ?`,
                [user.id]
            );
            console.log('🔍 Debug: Guru data found:', guruData.length, 'records');
            if (guruData.length > 0) {
                additionalData = {
                    guru_id: guruData[0].id_guru,
                    nip: guruData[0].nip,
                    mapel: guruData[0].nama_mapel
                };
                console.log('🔍 Debug: Additional data set:', additionalData);
            } else {
                console.log('❌ Debug: No guru data found for user_id:', user.id);
            }
        } else if (user.role === 'siswa' || user.role === 'KETOS') {
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
            role: user.role.toLowerCase(), // Normalize role to lowercase
            ...additionalData
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        // Set cookie and return response
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: false, // Set to true in production with HTTPS
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

// Clear token endpoint for debugging
app.post('/api/clear-token', (req, res) => {
    res.clearCookie('token');
    res.json({ 
        success: true, 
        message: 'Token cleared successfully' 
    });
});

// Debug JWT endpoint
app.post('/api/debug-jwt', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: 'Token required' });
    }
    
    try {
        const decoded = jwt.decode(token, { complete: true });
        res.json({
            success: true,
            decoded: decoded,
            secret: JWT_SECRET.substring(0, 10) + '...',
            isValid: jwt.verify(token, JWT_SECRET)
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            decoded: jwt.decode(token, { complete: true }),
            secret: JWT_SECRET.substring(0, 10) + '...'
        });
    }
});

// Admin info endpoint
app.get('/api/admin/info', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        user: req.user,
        message: 'Admin info retrieved successfully'
    });
});

// Verify token endpoint (alias for compatibility)
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
//         const [rows] = await db.execute(
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
            const [totalSiswa] = await db.execute(
                'SELECT COUNT(*) as count FROM siswa WHERE status = "aktif"'
            );
            
            const [totalGuru] = await db.execute(
                'SELECT COUNT(*) as count FROM guru WHERE status = "aktif"'
            );
            
            const [totalKelas] = await db.execute(
                'SELECT COUNT(*) as count FROM kelas WHERE status = "aktif"'
            );
            
            const [totalMapel] = await db.execute(
                'SELECT COUNT(*) as count FROM mapel WHERE status = "aktif"'
            );
            
            const [absensiHariIni] = await db.execute(
                'SELECT COUNT(*) as count FROM absensi_guru WHERE tanggal = CURDATE()'
            );
            
            const [persentaseKehadiran] = await db.execute(
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
        const [userResult] = await db.execute(
            'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "siswa", ?, "aktif")',
            [username, hashedPassword, nama]
        );

        // Create siswa record
        await db.execute(
            'INSERT INTO siswa (nis, nama, kelas_id, user_id, jabatan, status) VALUES (?, ?, ?, ?, ?, "aktif")',
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
        const [userResult] = await db.execute(
            'INSERT INTO users (username, password, role, nama, status) VALUES (?, ?, "guru", ?, "aktif")',
            [username, hashedPassword, nama]
        );

        // Create guru record
        await db.execute(
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

// Update guru account
app.put('/api/admin/guru/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nip, nama, mapel_id, username, password, no_telp, alamat, jenis_kelamin, email, status } = req.body;
        console.log('📝 Updating guru account:', { id, nama, username });

        if (!nama || !nip || !mapel_id || !username) {
            return res.status(400).json({ error: 'Nama, NIP, mata pelajaran, dan username wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != (SELECT user_id FROM guru WHERE id = ?)',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Check if NIP already exists (excluding current guru)
        const [existingNIP] = await db.execute(
            'SELECT id FROM guru WHERE nip = ? AND id != ?',
            [nip, id]
        );

        if (existingNIP.length > 0) {
            return res.status(400).json({ error: 'NIP sudah digunakan' });
        }

        await connection.beginTransaction();

        try {
            // Get current user_id
            const [guruResult] = await db.execute(
                'SELECT user_id FROM guru WHERE id = ?',
                [id]
            );

            if (guruResult.length === 0) {
                return res.status(404).json({ error: 'Guru tidak ditemukan' });
            }

            const userId = guruResult[0].user_id;

            // Update user account
            if (password) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await db.execute(
                    'UPDATE users SET username = ?, password = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [username, hashedPassword, nama, email || null, status || 'aktif', userId]
                );
            } else {
                await db.execute(
                    'UPDATE users SET username = ?, nama = ?, email = ?, status = ? WHERE id = ?',
                    [username, nama, email || null, status || 'aktif', userId]
                );
            }

            // Update guru data
            await db.execute(
                'UPDATE guru SET nip = ?, nama = ?, mapel_id = ?, no_telp = ?, alamat = ?, jenis_kelamin = ?, status = ? WHERE id = ?',
                [nip, nama, mapel_id, no_telp || null, alamat || null, jenis_kelamin || null, status || 'aktif', id]
            );

            await connection.commit();
            console.log('✅ Guru account updated successfully');
            res.json({ message: 'Akun guru berhasil diupdate' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error updating guru:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete guru account
app.delete('/api/admin/guru/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting guru account:', { id });

        await connection.beginTransaction();

        try {
            // Get user_id first
            const [guruResult] = await db.execute(
                'SELECT user_id FROM guru WHERE id = ?',
                [id]
            );

            if (guruResult.length === 0) {
                return res.status(404).json({ error: 'Guru tidak ditemukan' });
            }

            const userId = guruResult[0].user_id;

            // Delete from guru table first (foreign key constraint)
            await db.execute(
                'DELETE FROM guru WHERE id = ?',
                [id]
            );

            // Delete from users table
            await db.execute(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            await connection.commit();
            console.log('✅ Guru account deleted successfully');
            res.json({ message: 'Akun guru berhasil dihapus' });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('❌ Error deleting guru:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        
        const [rows] = await db.execute(query);
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
        const [existing] = await db.execute(
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

        const [result] = await db.execute(insertQuery, [
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
        const [existing] = await db.execute(
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

        const [result] = await db.execute(updateQuery, [
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

        const [result] = await db.execute(
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
// Public endpoint for classes (accessible by all authenticated users)
app.get('/api/kelas', authenticateToken, async (req, res) => {
    try {
        console.log('📋 Getting classes for general use');
        
        const query = `
            SELECT id_kelas as id, nama_kelas, tingkat, status
            FROM kelas 
            ORDER BY tingkat, nama_kelas
        `;
        
        const [rows] = await db.execute(query);
        console.log(`✅ Classes retrieved: ${rows.length} items`);
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
        
        const [rows] = await db.execute(query);
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

        const [result] = await db.execute(insertQuery, [nama_kelas, tingkat]);
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

        const [result] = await db.execute(updateQuery, [nama_kelas, tingkat, id]);

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

        const [result] = await db.execute(
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
        
        const [rows] = await db.execute(query);
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
        const { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('➕ Adding schedule:', { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ 
                error: 'Semua field wajib diisi',
                details: 'Pastikan kelas, mata pelajaran, guru, hari, jam ke, jam mulai, dan jam selesai telah diisi'
            });
        }

        // Check for schedule conflicts - same class, day, and time slot
        const [conflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif'`,
            [kelas_id, hari, jam_ke]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                error: `Kelas sudah memiliki jadwal pada ${hari} jam ke-${jam_ke}`,
                details: 'Pilih hari atau jam yang berbeda untuk kelas ini'
            });
        }

        // Check teacher availability - same day and time slot
        const [teacherConflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif'`,
            [guru_id, hari, jam_ke]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ 
                error: `Guru sudah memiliki jadwal mengajar pada ${hari} jam ke-${jam_ke}`,
                details: 'Pilih guru lain atau waktu yang berbeda'
            });
        }

        // Check room availability - same room, day, and time slot (if ruang_id is provided)
        if (ruang_id) {
            const [roomConflicts] = await db.execute(
                `SELECT id_jadwal FROM jadwal 
                 WHERE ruang_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif'`,
                [ruang_id, hari, jam_ke]
            );

            if (roomConflicts.length > 0) {
                return res.status(400).json({ 
                    error: `Ruang sudah digunakan pada ${hari} jam ke-${jam_ke}`,
                    details: 'Pilih ruang lain atau waktu yang berbeda'
                });
            }
        }

        // Check time overlap for same class and day
        const [timeOverlaps] = await db.execute(
            `SELECT id_jadwal, jam_mulai, jam_selesai FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND status = 'aktif' 
             AND (
                 (jam_mulai <= ? AND jam_selesai > ?) OR 
                 (jam_mulai < ? AND jam_selesai >= ?) OR
                 (jam_mulai >= ? AND jam_selesai <= ?)
             )`,
            [kelas_id, hari, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]
        );

        if (timeOverlaps.length > 0) {
            const conflict = timeOverlaps[0];
            return res.status(400).json({ 
                error: `Waktu bertabrakan dengan jadwal lain (${conflict.jam_mulai} - ${conflict.jam_selesai})`,
                details: 'Pilih waktu yang tidak bertabrakan dengan jadwal yang sudah ada'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO jadwal (kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aktif')`,
            [kelas_id, mapel_id, guru_id, ruang_id || null, hari, jam_ke, jam_mulai, jam_selesai]
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
        const { kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai } = req.body;
        console.log('✏️ Updating schedule:', { id, kelas_id, mapel_id, guru_id, ruang_id, hari, jam_ke, jam_mulai, jam_selesai });

        // Validation
        if (!kelas_id || !mapel_id || !guru_id || !hari || !jam_ke || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        // Check for schedule conflicts (excluding current schedule)
        const [conflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif' AND id_jadwal != ?`,
            [kelas_id, hari, jam_ke, id]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ error: `Kelas sudah memiliki jadwal pada ${hari} jam ke-${jam_ke}` });
        }

        // Check teacher availability (excluding current schedule)
        const [teacherConflicts] = await db.execute(
            `SELECT id_jadwal FROM jadwal 
             WHERE guru_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif' AND id_jadwal != ?`,
            [guru_id, hari, jam_ke, id]
        );

        if (teacherConflicts.length > 0) {
            return res.status(400).json({ error: `Guru sudah memiliki jadwal mengajar pada ${hari} jam ke-${jam_ke}` });
        }

        // Check room availability (excluding current schedule)
        if (ruang_id) {
            const [roomConflicts] = await db.execute(
                `SELECT id_jadwal FROM jadwal 
                 WHERE ruang_id = ? AND hari = ? AND jam_ke = ? AND status = 'aktif' AND id_jadwal != ?`,
                [ruang_id, hari, jam_ke, id]
            );

            if (roomConflicts.length > 0) {
                return res.status(400).json({ error: `Ruang sudah digunakan pada ${hari} jam ke-${jam_ke}` });
            }
        }

        // Check time overlap for same class and day (excluding current schedule)
        const [timeOverlaps] = await db.execute(
            `SELECT id_jadwal, jam_mulai, jam_selesai FROM jadwal 
             WHERE kelas_id = ? AND hari = ? AND status = 'aktif' AND id_jadwal != ?
             AND (
                 (jam_mulai <= ? AND jam_selesai > ?) OR 
                 (jam_mulai < ? AND jam_selesai >= ?) OR
                 (jam_mulai >= ? AND jam_selesai <= ?)
             )`,
            [kelas_id, hari, id, jam_mulai, jam_mulai, jam_selesai, jam_selesai, jam_mulai, jam_selesai]
        );

        if (timeOverlaps.length > 0) {
            const conflict = timeOverlaps[0];
            return res.status(400).json({ 
                error: `Waktu bertabrakan dengan jadwal lain (${conflict.jam_mulai} - ${conflict.jam_selesai})` 
            });
        }

        const [result] = await db.execute(
            `UPDATE jadwal 
             SET kelas_id = ?, mapel_id = ?, guru_id = ?, ruang_id = ?, hari = ?, jam_ke = ?, jam_mulai = ?, jam_selesai = ?
             WHERE id_jadwal = ?`,
            [kelas_id, mapel_id, guru_id, ruang_id || null, hari, jam_ke, jam_mulai, jam_selesai, id]
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

// Get schedule preview
app.get('/api/admin/jadwal/preview', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, minggu_ke } = req.query;
        console.log('📅 Getting schedule preview:', { kelas_id, minggu_ke });

        let query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                k.nama_kelas,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                g.nama as nama_guru,
                m.nama_mapel
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE j.status = 'aktif'
        `;
        
        let params = [];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND j.kelas_id = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY j.kelas_id, j.hari, j.jam_ke';
        
        const [schedules] = await db.execute(query, params);
        
        // Group schedules by class and day
        const groupedSchedules = {};
        schedules.forEach(schedule => {
            const className = schedule.nama_kelas;
            const day = schedule.hari;
            
            if (!groupedSchedules[className]) {
                groupedSchedules[className] = {};
            }
            if (!groupedSchedules[className][day]) {
                groupedSchedules[className][day] = {};
            }
            
            const timeSlot = `${schedule.jam_mulai}-${schedule.jam_selesai}`;
            groupedSchedules[className][day][timeSlot] = {
                id: schedule.id_jadwal,
                mapel: schedule.nama_mapel,
                guru: schedule.nama_guru,
                jam_ke: schedule.jam_ke,
                jam_mulai: schedule.jam_mulai,
                jam_selesai: schedule.jam_selesai
            };
        });
        
        res.json({
            success: true,
            data: groupedSchedules,
            metadata: {
                total_schedules: schedules.length,
                classes: Object.keys(groupedSchedules),
                generated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting schedule preview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export schedule to Excel
app.get('/api/admin/jadwal/export', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { kelas_id, format } = req.query;
        console.log('📊 Exporting schedule:', { kelas_id, format });

        let query = `
            SELECT 
                j.id_jadwal,
                j.kelas_id,
                k.nama_kelas,
                j.hari,
                j.jam_ke,
                j.jam_mulai,
                j.jam_selesai,
                j.status,
                g.nama as nama_guru,
                m.nama_mapel
            FROM jadwal j
            JOIN kelas k ON j.kelas_id = k.id_kelas
            JOIN guru g ON j.guru_id = g.id_guru
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE j.status = 'aktif'
        `;
        
        let params = [];
        
        if (kelas_id && kelas_id !== 'all') {
            query += ' AND j.kelas_id = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY j.kelas_id, j.hari, j.jam_ke';
        
        const [schedules] = await db.execute(query, params);
        
        if (format === 'excel') {
            const ExcelJS = require('exceljs');
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
                
                // Headers
                worksheet.columns = [
                    { header: 'Hari', key: 'hari', width: 12 },
                    { header: 'Jam Ke', key: 'jam_ke', width: 8 },
                    { header: 'Jam Mulai', key: 'jam_mulai', width: 12 },
                    { header: 'Jam Selesai', key: 'jam_selesai', width: 12 },
                    { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 },
                    { header: 'Guru', key: 'nama_guru', width: 20 }
                ];
                
                // Add data
                classGroups[className].forEach(schedule => {
                    worksheet.addRow({
                        hari: schedule.hari,
                        jam_ke: schedule.jam_ke,
                        jam_mulai: schedule.jam_mulai,
                        jam_selesai: schedule.jam_selesai,
                        nama_mapel: schedule.nama_mapel,
                        nama_guru: schedule.nama_guru
                    });
                });
            });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="jadwal-${kelas_id || 'semua'}-${new Date().toISOString().split('T')[0]}.xlsx"`);
            
            await workbook.xlsx.write(res);
            res.end();
            
        } else {
            // Default JSON response
            res.json({
                success: true,
                data: schedules,
                metadata: {
                    total_schedules: schedules.length,
                    exported_at: new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error exporting schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
                a.waktu_absen
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit attendance for a schedule
app.post('/api/attendance/submit', authenticateToken, requireRole(['guru', 'admin']), async (req, res) => {
    try {
        const { scheduleId, attendance, notes, guruId } = req.body;
        
        if (!scheduleId || !attendance || !guruId) {
            return res.status(400).json({ error: 'Data absensi tidak lengkap' });
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

        // Insert attendance records for each student
        const attendanceEntries = Object.entries(attendance);
        const currentDate = new Date().toISOString().split('T')[0];
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
            
            // Check if attendance already exists for today
            const [existingAttendance] = await db.execute(
                'SELECT id, status as current_status FROM absensi_siswa WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?',
                [studentId, scheduleId, currentDate]
            );

            if (existingAttendance.length > 0) {
                const existingId = existingAttendance[0].id;
                const currentStatus = existingAttendance[0].current_status;
                console.log(`🔄 Updating existing attendance ID ${existingId} from "${currentStatus}" to "${status}"`);
                
                // Update existing attendance
                const [updateResult] = await db.execute(
                    'UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ? WHERE id = ?',
                    [status, note, `${currentDate} ${currentTime}`, existingId]
                );
                
                console.log(`✅ Updated attendance for student ${studentId}: ${updateResult.affectedRows} rows affected`);
            } else {
                console.log(`➕ Inserting new attendance for student ${studentId}`);
                
                // Insert new attendance
                const [insertResult] = await db.execute(
                    'INSERT INTO absensi_siswa (siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [studentId, scheduleId, currentDate, status, note, `${currentDate} ${currentTime}`, guruId]
                );
                
                console.log(`✅ Inserted new attendance for student ${studentId}: ID ${insertResult.insertId}`);
            }
        }

        console.log(`✅ Attendance submitted successfully for ${attendanceEntries.length} students`);
        res.json({ 
            message: 'Absensi berhasil disimpan',
            processed: attendanceEntries.length,
            date: currentDate,
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

// Endpoint pengajuan izin dihapus sesuai aturan bisnis baru

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
                WHEN 5 THEN 'Sabtu'
                ELSE 'Minggu'
            END
            ORDER BY k.nama_kelas, j.jam_mulai, g.nama
        `;
        
        const [rows] = await db.execute(query);
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
                a.keterangan
            FROM siswa s
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN absensi_siswa a ON s.id_siswa = a.siswa_id 
                AND DATE(a.waktu_absen) = CURDATE()
            ORDER BY k.nama_kelas, s.nama
        `;
        
        const [rows] = await db.execute(query);
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
        
        const [rows] = await db.execute(query, params);
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
            JOIN siswa s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.waktu_absen) BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (kelas_id && kelas_id !== '') {
            query += ' AND k.id_kelas = ?';
            params.push(kelas_id);
        }
        
        query += ' ORDER BY a.waktu_absen DESC, k.nama_kelas, s.nama';
        
        const [rows] = await db.execute(query, params);
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
            JOIN siswa s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE DATE(a.waktu_absen) BETWEEN ? AND ?
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
        const [rows] = await db.execute(query, params);
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
        const [rows] = await db.execute(
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
                s.nama as nama_pengaju,
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
            JOIN siswa s ON pba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas OR pba.kelas_id = k.id_kelas
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
        
        const [rows] = await db.execute(query, params);
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
                s.nama as nama_pengaju,
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
            JOIN siswa s ON pba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas OR pba.kelas_id = k.id_kelas
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// PENGAJUAN IZIN SISWA ENDPOINTS
// ================================================

// Endpoint pengajuan izin dihapus - siswa tidak boleh mengajukan izin sendiri

// Endpoint pengajuan izin legacy dihapus - siswa tidak boleh mengajukan izin sendiri

// Endpoint submit pengajuan izin dihapus - siswa tidak boleh mengajukan izin sendiri

// Endpoint guru untuk pengajuan izin dihapus - tidak ada lagi pengajuan izin

// Endpoint guru approve/reject pengajuan izin dihapus - tidak ada lagi pengajuan izin

// Endpoint guru approve pengajuan izin alternative dihapus - tidak ada lagi pengajuan izin

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
        
        const [rows] = await db.execute(query);
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
        
        const [rows] = await db.execute(query);
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

        query += ' ORDER BY ag.tanggal DESC, j.jam_ke ASC LIMIT ?';
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
                   j.jam_ke, j.jam_mulai, j.jam_selesai, j.hari,
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

        query += ' ORDER BY ag.tanggal DESC, k.nama_kelas, j.jam_ke';

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
        const [jadwal] = await db.execute(`
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
        const guruId = req.user.guru_id;
        console.log(`📊 Fetching student attendance history for guru_id: ${guruId}`);

        if (!guruId) {
            return res.status(400).json({ error: 'guru_id tidak ditemukan pada token pengguna' });
        }

        // Fixed query - using table aliases properly
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
            INNER JOIN siswa siswa ON absensi.siswa_id = siswa.id_siswa
            LEFT JOIN absensi_guru guru_absen ON jadwal.id_jadwal = guru_absen.jadwal_id 
                AND DATE(guru_absen.tanggal) = DATE(absensi.waktu_absen)
            WHERE jadwal.guru_id = ? 
                AND absensi.waktu_absen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY absensi.waktu_absen DESC, jadwal.jam_ke ASC
            LIMIT 1000`;

        const [history] = await db.execute(query, [guruId]);

        console.log(`✅ Found ${history.length} student attendance records for guru_id ${guruId}`);
        
        // Debug: Log sample data
        if (history.length > 0) {
            console.log('📊 Sample history record:', history[0]);
        }
        
        res.json({ success: true, data: history });
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
                j.jam_ke,
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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

        // Update ruang kelas
        await db.execute(
            'UPDATE ruang_kelas SET kode_ruang = ?, nama_ruang = ?, kapasitas = ?, lokasi = ?, fasilitas = ?, status = ? WHERE id = ?',
            [kode_ruang, nama_ruang, kapasitas, lokasi, fasilitas, status, id]
        );

        console.log(`✅ Ruang kelas updated: ID ${id}`);
        res.json({ success: true, message: 'Ruang kelas berhasil diperbarui' });

    } catch (error) {
        console.error('❌ Error updating ruang kelas:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// KOP LAPORAN ENDPOINTS
// ================================================

// Get letterhead configuration
app.get('/api/admin/letterhead', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { reportKey } = req.query;
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// SISWA PERWAKILAN ENDPOINTS
// ================================================

// Get siswa perwakilan info
app.get('/api/siswa-perwakilan/info', authenticateToken, requireRole(['siswa', 'ketos']), async (req, res) => {
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
        const [siswaData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [siswa_id]
        );

        if (siswaData.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        const kelasId = siswaData[0].kelas_id;

        // Get today's schedule for the class
        const [jadwalData] = await db.execute(`
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

// Get jadwal berdasarkan tanggal untuk siswa
app.get('/api/siswa/:siswaId/jadwal-rentang', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { tanggal } = req.query;
        
        console.log('📅 Getting jadwal for siswa:', siswaId, 'tanggal:', tanggal);

        // Check database connection
        if (!connection) {
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
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
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
                j.jam_ke,
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
app.get('/api/siswa/:siswa_id/jadwal-rentang', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id } = req.params;
        const { tanggal } = req.query;
        
        console.log('📅 Getting jadwal for siswa (legacy):', siswa_id, 'tanggal:', tanggal);

        // Check database connection
        if (!connection) {
            console.error('❌ Database connection not available');
            return res.status(500).json({ 
                success: false,
                error: 'Database connection tidak tersedia' 
            });
        }

        // Validate siswa_id parameter
        if (!siswa_id || isNaN(parseInt(siswa_id))) {
            console.log('❌ Invalid siswa_id parameter:', siswa_id);
            return res.status(400).json({ 
                success: false, 
                error: 'ID siswa tidak valid' 
            });
        }

        if (!tanggal) {
            console.log('❌ Missing tanggal parameter (legacy)');
            return res.status(400).json({ 
                success: false, 
                error: 'Parameter tanggal diperlukan' 
            });
        }

        // Validate tanggal format
        const targetDate = new Date(tanggal);
        if (isNaN(targetDate.getTime())) {
            console.log('❌ Invalid tanggal format (legacy):', tanggal);
            return res.status(400).json({ 
                success: false, 
                error: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD' 
            });
        }

        // Parse tanggal dan dapatkan hari dalam bahasa Indonesia
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const targetDay = dayNames[targetDate.getDay()];

        console.log('📅 Target day (legacy):', targetDay);

        // Get siswa's class
        console.log('🔍 Getting siswa data (legacy)...');
        const [siswaData] = await db.execute(
            'SELECT kelas_id FROM siswa WHERE id_siswa = ?',
            [parseInt(siswa_id)]
        );

        if (siswaData.length === 0) {
            console.log('❌ Siswa not found (legacy):', siswa_id);
            return res.status(404).json({ 
                success: false, 
                error: 'Siswa tidak ditemukan' 
            });
        }

        const kelasId = siswaData[0].kelas_id;
        console.log('📊 Siswa kelas_id (legacy):', kelasId);

        // Get schedule for the specific date and class
        console.log('🔍 Getting jadwal data (legacy)...');
        const [jadwalData] = await db.execute(`
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

        console.log('✅ Jadwal retrieved for date (legacy):', tanggal, 'count:', jadwalData.length);

        res.json({
            success: true,
            data: jadwalData
        });

    } catch (error) {
        console.error('❌ Error getting jadwal by date (legacy):', error);
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

// Submit kehadiran guru
app.post('/api/siswa/submit-kehadiran-guru', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id, kehadiran_data } = req.body;
        console.log('📝 Submitting kehadiran guru for siswa:', siswa_id);
        console.log('📝 Kehadiran data:', kehadiran_data);

        // Begin transaction
        await db.execute('START TRANSACTION');

        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        // Insert/update attendance for each jadwal
        for (const [jadwalId, data] of Object.entries(kehadiran_data)) {
            const { status, keterangan } = data;

            // Check if attendance record already exists
            const [existingRecord] = await db.execute(
                'SELECT id_absensi FROM absensi_guru WHERE jadwal_id = ? AND tanggal = ?',
                [jadwalId, today]
            );

            if (existingRecord.length > 0) {
                // Update existing record
                await db.execute(`
                    UPDATE absensi_guru 
                    SET status = ?, keterangan = ?, waktu_pencatatan = ?, siswa_pencatat_id = ?
                    WHERE jadwal_id = ? AND tanggal = ?
                `, [status, keterangan || null, currentTime, siswa_id, jadwalId, today]);
            } else {
                // Insert new record
                await db.execute(`
                    INSERT INTO absensi_guru 
                    (jadwal_id, tanggal, status, keterangan, waktu_pencatatan, siswa_pencatat_id) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [jadwalId, today, status, keterangan || null, currentTime, siswa_id]);
            }
        }

        // Commit transaction
        await db.execute('COMMIT');

        console.log('✅ Kehadiran guru submitted successfully');

        res.json({
            success: true,
            message: 'Data kehadiran guru berhasil disimpan'
        });

    } catch (error) {
        // Rollback on error
        await db.execute('ROLLBACK');
        console.error('❌ Error submitting kehadiran guru:', error);
        res.status(500).json({ error: 'Gagal menyimpan data kehadiran guru' });
    }
});

// Get riwayat kehadiran kelas (for siswa perwakilan)
app.get('/api/siswa/:siswa_id/riwayat-kehadiran', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswa_id } = req.params;
        console.log('📊 Getting riwayat kehadiran kelas for siswa:', siswa_id);

        // Get siswa's class
        const [siswaData] = await db.execute(
            'SELECT kelas_id, nama FROM siswa WHERE id_siswa = ?',
            [siswa_id]
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
                j.jam_ke,
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
        
        const [results] = await db.execute(query);
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
        const [existingUsers] = await db.execute(
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
            const [userResult] = await db.execute(
                'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                [username, hashedPassword, 'guru']
            );

            // Insert guru data with generated NIP
            const nip = `G${Date.now().toString().slice(-8)}`; // Generate simple NIP
            await db.execute(
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
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        await connection.beginTransaction();

        try {
            // Get current username
            const [currentUser] = await db.execute(
                'SELECT username FROM users WHERE id = ?',
                [id]
            );

            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
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
            const [userResult] = await db.execute(
                'SELECT username FROM users WHERE id = ?',
                [id]
            );

            if (userResult.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
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
        
        const [results] = await db.execute(query);
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
        const [existing] = await db.execute(
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

        const [result] = await db.execute(query, [
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete teacher data
app.delete('/api/admin/teachers-data/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
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
            LEFT JOIN siswa s ON u.id = s.user_id
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE u.role = 'siswa'
            ORDER BY s.nama ASC
        `;
        
        const [results] = await db.execute(query);
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
        const { nama, username, password, nis, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, status } = req.body;
        console.log('➕ Adding student account:', { nama, username, nis });

        if (!nama || !username || !password || !nis || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'Nama, username, password, NIS, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if username already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ?',
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
        await connection.beginTransaction();

        try {
            // Insert user account
            const [userResult] = await db.execute(
                'INSERT INTO users (username, password, role, nama, email, status) VALUES (?, ?, ?, ?, ?, ?)',
                [username, hashedPassword, 'siswa', nama, email || null, status || 'aktif']
            );

            // Insert siswa data
            await db.execute(
                'INSERT INTO siswa (nis, nama, username, user_id, kelas_id, jabatan, jenis_kelamin, email, telepon_orangtua, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nis, nama, username, userResult.insertId, kelas_id, jabatan || 'Sekretaris Kelas', jenis_kelamin, email || null, telepon_siswa || null, status || 'aktif']
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
        const { nama, username, password, nis, kelas_id, jabatan, jenis_kelamin, email, telepon_siswa, status } = req.body;
        console.log('📝 Updating student account:', { id, nama, username, nis });

        if (!nama || !username || !nis || !kelas_id || !jenis_kelamin) {
            return res.status(400).json({ error: 'Nama, username, NIS, kelas, dan jenis kelamin wajib diisi' });
        }

        // Check if username already exists (excluding current user)
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username sudah digunakan' });
        }

        // Check if NIS already exists (excluding current student)
        const [existingNIS] = await db.execute(
            'SELECT s.id_siswa FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.nis = ? AND u.id != ?',
            [nis, id]
        );

        if (existingNIS.length > 0) {
            return res.status(400).json({ error: 'NIS sudah digunakan' });
        }

        await connection.beginTransaction();

        try {
            // Get current username
            const [currentUser] = await db.execute(
                'SELECT username FROM users WHERE id = ?',
                [id]
            );

            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const oldUsername = currentUser[0].username;

            // Update user account
            if (password) {
                const hashedPassword = await bcrypt.hash(password, saltRounds);
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
            const [userResult] = await db.execute(
                'SELECT username FROM users WHERE id = ?',
                [id]
            );

            if (userResult.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
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

// Get students data for admin dashboard
app.get('/api/admin/students-data', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📋 Getting students data for admin dashboard');
        
        const query = `
            SELECT s.id_siswa as id, s.nis, s.nama, s.kelas_id, k.nama_kelas, 
                   s.jenis_kelamin, s.alamat, s.telepon_orangtua, 
                   COALESCE(s.status, 'aktif') as status
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            ORDER BY s.nama ASC
        `;
        
        const [results] = await db.execute(query);
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
        const [existing] = await db.execute(
            'SELECT id FROM siswa WHERE nis = ? AND id != ?',
            [nis, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'NIS sudah digunakan oleh siswa lain' });
        }

        const updateQuery = `
            UPDATE siswa 
            SET nis = ?, nama = ?, kelas_id = ?, jenis_kelamin = ?, 
                alamat = ?, telepon_orangtua = ?, status = ?
            WHERE id = ?
        `;

        const [result] = await db.execute(updateQuery, [
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get monitoring dashboard data
app.get('/api/admin/monitoring-dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📊 Getting monitoring dashboard data');
        
        // Get system statistics
        const [totalClasses] = await db.execute('SELECT COUNT(*) as count FROM kelas');
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM siswa');
        const [totalTeachers] = await db.execute('SELECT COUNT(*) as count FROM guru');
        const [totalSubjects] = await db.execute('SELECT COUNT(*) as count FROM mapel');
        
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint pengajuan izin kelas dihapus - tidak ada lagi pengajuan izin

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
            LEFT JOIN siswa s ON ba.siswa_id = s.id_siswa
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE ba.siswa_id = ?
            ORDER BY ba.tanggal_pengajuan DESC
        `;

        const [rows] = await db.execute(query, [siswaId]);
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit banding absen kelas
app.post('/api/siswa/:siswaId/banding-absen-kelas', authenticateToken, requireRole(['siswa']), async (req, res) => {
    try {
        const { siswaId } = req.params;
        const { jadwal_id, tanggal_absen, siswa_banding } = req.body;
        console.log('📝 Submitting banding absen kelas:', { siswaId, jadwal_id, tanggal_absen, siswaCount: siswa_banding.length });

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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get banding absen for teacher to process
app.get('/api/guru/:guruId/banding-absen', authenticateToken, requireRole(['guru']), async (req, res) => {
    try {
        const { guruId } = req.params;
        console.log('📋 Getting banding absen for guru:', guruId);

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
                j.jam_mulai,
                j.jam_selesai,
                m.nama_mapel,
                s.nama as nama_siswa,
                s.nis,
                k.nama_kelas
            FROM pengajuan_banding_absen ba
            JOIN jadwal j ON ba.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            JOIN siswa s ON ba.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            WHERE j.guru_id = ?
            ORDER BY ba.tanggal_pengajuan DESC, ba.status_banding ASC
        `;

        const [rows] = await db.execute(query, [guruId]);
        console.log(`✅ Banding absen for guru retrieved: ${rows.length} items`);
        res.json(rows);
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================
// SERVER INITIALIZATION
// ================================================

// Database connection is handled in startServer() function below

// ================================================
// RIWAYAT PENGAJUAN IZIN ENDPOINTS (STEP 8)
// ================================================

// Endpoint riwayat pengajuan izin dihapus - tidak ada lagi pengajuan izin

// Endpoint download riwayat pengajuan izin dihapus - tidak ada lagi pengajuan izin

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
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

// Global error handler untuk memastikan response selalu JSON
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    // Pastikan response belum dikirim
    if (res.headersSent) {
        return next(error);
    }
    
    // Return JSON response untuk semua error
    res.status(500).json({
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
        // Test database connection using pool
        const isConnected = await db.testConnection();
        if (!isConnected) {
            throw new Error('Database connection failed');
        }
        
        console.log('✅ Database pool connection successful');
        
        // Start server
        app.listen(port, () => {
            console.log(`🚀 ABSENTA Modern Server running on port ${port}`);
            console.log(`📊 Database pool: Connected`);
            console.log(`🌐 Server URL: http://localhost:${port}`);
            console.log(`📋 Health check: http://localhost:${port}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down server...');
    await db.close();
    console.log('✅ Database pool closed');
    process.exit(0);
});

export default app;
