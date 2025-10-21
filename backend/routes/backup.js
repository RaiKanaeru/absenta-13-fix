/**
 * Backup & Restore Routes
 * Database backup and restoration management
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Note: Authentication and authorization handled by server.js middleware
// All routes under /api/admin/backup are already protected

// Backup directory configuration
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_NAME = process.env.DB_NAME || 'absenta13';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';

// Mysqldump path configuration
// Try to find mysqldump in common locations if not in PATH
const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || 
    (process.platform === 'win32' ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe' : 'mysqldump');
const MYSQL_PATH = process.env.MYSQL_PATH || 
    (process.platform === 'win32' ? 'C:\\xampp\\mysql\\bin\\mysql.exe' : 'mysql');

// Ensure backup directory exists
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        console.log('✅ Backup directory created:', BACKUP_DIR);
    }
}

// GET /api/admin/backup/list - List all backups
router.get('/list', async (req, res) => {
    try {
        console.log('📋 Listing all backups');
        await ensureBackupDir();

        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(file => file.endsWith('.sql'));

        const backups = await Promise.all(
            backupFiles.map(async (filename) => {
                const filePath = path.join(BACKUP_DIR, filename);
                const stats = await fs.stat(filePath);
                
                return {
                    id: filename.replace('.sql', ''),
                    filename: filename,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    path: filePath
                };
            })
        );

        // Sort by creation date (newest first)
        backups.sort((a, b) => b.created - a.created);

        console.log(`✅ Found ${backups.length} backups`);
        res.json({
            success: true,
            data: backups,
            message: `Found ${backups.length} backup(s)`
        });
    } catch (error) {
        console.error('❌ Error listing backups:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to list backups',
            details: error.message
        });
    }
});

// POST /api/admin/backup/create - Create new backup
router.post('/create', async (req, res) => {
    try {
        console.log('💾 Creating database backup');
        await ensureBackupDir();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('-').slice(0, 3).join('');
        const filename = `backup_${DB_NAME}_${dateStr}_${timeStr}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);

        // Build mysqldump command
        const mysqldumpCmd = `"${MYSQLDUMP_PATH}" -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} -h ${DB_HOST} ${DB_NAME} > "${filepath}"`;

        console.log('⏳ Executing mysqldump...');
        console.log(`Command: ${mysqldumpCmd.replace(DB_PASSWORD, '***')}`);
        const { stdout, stderr } = await execAsync(mysqldumpCmd);

        if (stderr && !stderr.includes('Warning')) {
            throw new Error(`Mysqldump error: ${stderr}`);
        }

        // Verify backup file was created
        const stats = await fs.stat(filepath);

        console.log(`✅ Backup created successfully: ${filename} (${formatFileSize(stats.size)})`);
        res.json({
            success: true,
            data: {
                id: filename.replace('.sql', ''),
                filename: filename,
                size: stats.size,
                sizeFormatted: formatFileSize(stats.size),
                created: stats.birthtime,
                path: filepath
            },
            message: 'Database backup created successfully'
        });
    } catch (error) {
        console.error('❌ Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to create backup',
            details: error.message
        });
    }
});

// POST /api/admin/backup/restore - Restore from backup
router.post('/restore', async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Filename is required'
            });
        }

        console.log(`⏪ Restoring database from: ${filename}`);
        
        const filepath = path.join(BACKUP_DIR, filename);

        // Verify backup file exists
        try {
            await fs.access(filepath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found',
                message: 'Backup file not found'
            });
        }

        // Build mysql restore command
        const mysqlCmd = `"${MYSQL_PATH}" -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} -h ${DB_HOST} ${DB_NAME} < "${filepath}"`;

        console.log('⏳ Executing mysql restore...');
        console.log(`Command: ${mysqlCmd.replace(DB_PASSWORD, '***')}`);
        const { stdout, stderr } = await execAsync(mysqlCmd);

        if (stderr && !stderr.includes('Warning')) {
            throw new Error(`MySQL error: ${stderr}`);
        }

        console.log(`✅ Database restored successfully from: ${filename}`);
        res.json({
            success: true,
            data: {
                filename: filename,
                restoredAt: new Date().toISOString()
            },
            message: 'Database restored successfully'
        });
    } catch (error) {
        console.error('❌ Error restoring backup:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to restore backup',
            details: error.message
        });
    }
});

// DELETE /api/admin/backup/:id - Delete backup
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filename = id.endsWith('.sql') ? id : `${id}.sql`;

        console.log(`🗑️ Deleting backup: ${filename}`);
        
        const filepath = path.join(BACKUP_DIR, filename);

        // Verify backup file exists
        try {
            await fs.access(filepath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found',
                message: 'Backup file not found'
            });
        }

        // Delete the file
        await fs.unlink(filepath);

        console.log(`✅ Backup deleted successfully: ${filename}`);
        res.json({
            success: true,
            message: 'Backup deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting backup:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to delete backup',
            details: error.message
        });
    }
});

// GET /api/admin/backup/download/:id - Download backup file
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filename = id.endsWith('.sql') ? id : `${id}.sql`;

        console.log(`📥 Downloading backup: ${filename}`);
        
        const filepath = path.join(BACKUP_DIR, filename);

        // Verify backup file exists
        try {
            await fs.access(filepath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'File not found',
                message: 'Backup file not found'
            });
        }

        // Send file as download
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('❌ Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Internal server error',
                        message: 'Failed to download backup'
                    });
                }
            } else {
                console.log(`✅ Backup downloaded successfully: ${filename}`);
            }
        });
    } catch (error) {
        console.error('❌ Error downloading backup:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to download backup',
            details: error.message
        });
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default router;
