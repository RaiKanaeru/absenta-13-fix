/**
 * Minimal Working Server untuk Testing
 * Hanya endpoint penting untuk verify sistem
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'absenta-super-secret-jwt-key-2025';
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'absenta-pepper-2025';

// Middleware
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`🔐 Login attempt for: ${username}`);

        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Username atau password salah'
            });
        }

        const user = users[0];
        const passwordWithPepper = password + PASSWORD_PEPPER;
        const isValid = await bcrypt.compare(passwordWithPepper, user.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Username atau password salah'
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                peran: user.role,
                nama: user.nama
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`✅ Login successful for: ${username} (${user.role})`);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                nama: user.nama,
                peran: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Verify Token
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Get User Info
app.get('/api/admin/info', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, nama, role FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            ...users[0]
        });
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Subjects (Dropdown)
app.get('/v1/subjects', authenticateToken, async (req, res) => {
    try {
        const [subjects] = await db.execute(
            'SELECT id_mapel as id, nama_mapel as label, kode_mapel FROM mapel WHERE status = "aktif" ORDER BY nama_mapel'
        );

        res.json({
            success: true,
            data: subjects
        });
    } catch (error) {
        console.error('❌ Error getting subjects:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Teachers (Dropdown)
app.get('/v1/teachers', authenticateToken, async (req, res) => {
    try {
        const [teachers] = await db.execute(
            'SELECT id_guru as id, nama as label, nip FROM guru WHERE status = "aktif" ORDER BY nama'
        );

        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('❌ Error getting teachers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Classes (Dropdown)
app.get('/v1/classes', authenticateToken, async (req, res) => {
    try {
        const [classes] = await db.execute(
            'SELECT id_kelas as id, nama_kelas as label, tingkat FROM kelas WHERE status = "aktif" ORDER BY tingkat, nama_kelas'
        );

        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('❌ Error getting classes:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Guru List
app.get('/api/admin/guru', authenticateToken, async (req, res) => {
    try {
        const [teachers] = await db.execute(`
            SELECT 
                g.id_guru,
                g.nip,
                g.nama,
                g.email,
                g.status,
                u.username
            FROM guru g
            LEFT JOIN users u ON g.user_id = u.id
            ORDER BY g.nama
        `);

        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('❌ Error getting teachers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Siswa List
app.get('/api/admin/siswa', authenticateToken, async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT 
                s.id_siswa,
                s.nis,
                s.nama,
                s.kelas_id,
                k.nama_kelas,
                s.status,
                u.username
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY k.tingkat, k.nama_kelas, s.nama
        `);

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('❌ Error getting students:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Start Server
app.listen(port, () => {
    console.log('🚀 ABSENTA Minimal Server Started');
    console.log(`📡 Server running on http://localhost:${port}`);
    console.log(`🔑 JWT Secret configured: ${JWT_SECRET.substring(0, 10)}...`);
    console.log(`📋 Health check: http://localhost:${port}/api/health`);
    console.log(`\n💡 Test dengan: node comprehensive-endpoint-test.js`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

