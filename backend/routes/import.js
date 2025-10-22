/**
 * Import Routes - Excel/CSV Data Import
 * Handles file upload and import for various entities
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ================================================
// RATE LIMITING
// ================================================

/**
 * Rate limiter for import endpoints
 * Restricts file uploads to prevent abuse
 */
const importRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 uploads per 15 minutes per IP
    message: {
        success: false,
        error: 'Too many upload requests',
        message: 'Terlalu banyak permintaan upload. Mohon tunggu beberapa saat sebelum mencoba lagi.',
        retryAfter: '15 menit'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Store in-memory (for production, consider using Redis)
    skipSuccessfulRequests: false, // Count all requests, even successful ones
    skipFailedRequests: false, // Count failed requests too
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: 'Terlalu banyak permintaan upload. Mohon tunggu beberapa saat.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 / 60) + ' menit'
        });
    }
});

// Ensure upload directory exists
const uploadDir = './uploads/temp';
try {
    await fs.mkdir(uploadDir, { recursive: true });
} catch (err) {
    console.error('Failed to create upload directory:', err);
}

// ================================================
// MULTER CONFIGURATION
// ================================================

/**
 * Sanitize filename to prevent path traversal attacks
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[^a-z0-9.-]/gi, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const sanitized = sanitizeFilename(path.basename(file.originalname, ext));
        cb(null, `import-${sanitized}-${uniqueSuffix}${ext}`);
    }
});

/**
 * File filter - only allow Excel and CSV files
 */
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
};

/**
 * Multer instance with configuration
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    }
});

// ================================================
// IMPORT CONTROLLERS (will be imported later)
// ================================================

// Placeholder import functions - will be replaced with actual controllers
import {
    importMapel,
    importKelas,
    importGuru,
    importSiswa,
    importJadwal
} from '../controllers/importController.js';

// ================================================
// IMPORT ROUTES
// ================================================

/**
 * POST /api/admin/import/mapel
 * Import Mata Pelajaran from Excel/CSV
 * Query params: dryRun=true (optional) for validation only
 */
router.post('/mapel', 
    importRateLimiter, // Rate limiting
    authenticateToken, 
    requireRole(['admin']), 
    upload.single('file'), 
    importMapel
);

/**
 * POST /api/admin/import/kelas
 * Import Kelas from Excel/CSV
 * Query params: dryRun=true (optional) for validation only
 */
router.post('/kelas', 
    importRateLimiter, // Rate limiting
    authenticateToken, 
    requireRole(['admin']), 
    upload.single('file'), 
    importKelas
);

/**
 * POST /api/admin/import/guru
 * Import Guru from Excel/CSV
 * Query params: dryRun=true (optional) for validation only
 */
router.post('/guru', 
    importRateLimiter, // Rate limiting
    authenticateToken, 
    requireRole(['admin']), 
    upload.single('file'), 
    importGuru
);

/**
 * POST /api/admin/import/siswa
 * Import Siswa from Excel/CSV
 * Query params: dryRun=true (optional) for validation only
 */
router.post('/siswa', 
    importRateLimiter, // Rate limiting
    authenticateToken, 
    requireRole(['admin']), 
    upload.single('file'), 
    importSiswa
);

/**
 * POST /api/admin/import/jadwal
 * Import Jadwal from Excel/CSV
 * Query params: dryRun=true (optional) for validation only
 */
router.post('/jadwal', 
    importRateLimiter, // Rate limiting
    authenticateToken, 
    requireRole(['admin']), 
    upload.single('file'), 
    importJadwal
);

// ================================================
// ERROR HANDLER MIDDLEWARE
// ================================================

/**
 * Handle multer errors
 */
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        // Multer-specific errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: 'Maximum file size is 10MB'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Too many files',
                message: 'Only one file can be uploaded at a time'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Upload error',
            message: error.message
        });
    } else if (error) {
        // Other errors (e.g., file filter rejection)
        return res.status(400).json({
            success: false,
            error: 'Invalid file',
            message: error.message
        });
    }
    next();
});

console.log('✅ Import routes registered successfully');

export default router;

