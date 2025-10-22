/**
 * Import Controller - Excel/CSV Data Import Logic
 * Handles file parsing, validation, and database import with transaction support
 */

import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { db } from '../../db.js';
import {
    validateMapelRow,
    validateKelasRow,
    validateGuruRow,
    validateSiswaRow,
    validateJadwalRow
} from '../utils/validators.js';
import bcrypt from 'bcrypt';

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Cleanup temp file after processing
 */
const cleanupTempFile = async (filepath) => {
    try {
        await fs.unlink(filepath);
        console.log(`✅ Temp file cleaned up: ${filepath}`);
    } catch (err) {
        console.error(`⚠️ Failed to cleanup temp file: ${filepath}`, err.message);
    }
};

/**
 * Parse Excel file and extract rows
 */
const parseExcelFile = async (filepath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);
    const worksheet = workbook.getWorksheet(1);
    
    const rows = [];
    let headerRow = null;
    
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Store header for reference
            headerRow = row.values;
            return;
        }
        
        // Convert row to object (skip empty rows)
        const rowData = {};
        let isEmpty = true;
        
        row.eachCell((cell, colNumber) => {
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                isEmpty = false;
            }
            rowData[`col${colNumber}`] = cell.value;
        });
        
        if (!isEmpty) {
            rows.push({ rowNumber, data: rowData });
        }
    });
    
    return { headerRow, rows };
};

/**
 * Build standard import response
 */
const buildImportResponse = (validRows, invalidRows, insertedCount = 0, updatedCount = 0) => {
    return {
        success: true,
        summary: {
            total: validRows.length + invalidRows.length,
            valid: validRows.length,
            invalid: invalidRows.length,
            inserted: insertedCount,
            updated: updatedCount,
            processed: insertedCount + updatedCount
        },
        errors: invalidRows
    };
};

// ================================================
// IMPORT MAPEL (SUBJECTS)
// ================================================

/**
 * Import Mata Pelajaran from Excel/CSV
 * @route POST /api/admin/import/mapel
 */
export const importMapel = async (req, res) => {
    const file = req.file;
    const isDryRun = req.query.dryRun === 'true';
    
    if (!file) {
        return res.status(400).json({ 
            success: false, 
            error: 'File is required' 
        });
    }
    
    console.log(`📥 Importing Mapel: ${file.originalname} (Dry Run: ${isDryRun})`);
    
    let connection;
    try {
        // Parse Excel file
        const { rows: parsedRows } = await parseExcelFile(file.path);
        
        const validRows = [];
        const invalidRows = [];
        
        // Validate each row
        for (const { rowNumber, data } of parsedRows) {
            const rowData = {
                kode_mapel: data.col1,
                nama_mapel: data.col2,
                deskripsi: data.col3 || null,
                status: data.col4 || 'aktif'
            };
            
            const validation = validateMapelRow(rowData, rowNumber);
            
            if (validation.isValid) {
                validRows.push({ ...rowData, rowNumber });
            } else {
                invalidRows.push({
                    index: rowNumber,
                    errors: validation.errors
                });
            }
        }
        
        console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid`);
        
        // If dry run, return validation results
        if (isDryRun) {
            await cleanupTempFile(file.path);
            return res.json(buildImportResponse(validRows, invalidRows));
        }
        
        // Actual import with transaction
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        let inserted = 0;
        let updated = 0;
        
        for (const row of validRows) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO mapel (kode_mapel, nama_mapel, deskripsi, status, created_at) 
                     VALUES (?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        nama_mapel = VALUES(nama_mapel), 
                        deskripsi = VALUES(deskripsi), 
                        status = VALUES(status),
                        updated_at = NOW()`,
                    [row.kode_mapel, row.nama_mapel, row.deskripsi, row.status]
                );
                
                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Error inserting row ${row.rowNumber}:`, err.message);
                invalidRows.push({
                    index: row.rowNumber,
                    errors: [err.message]
                });
            }
        }
        
        await connection.commit();
        console.log(`✅ Import complete: ${inserted} inserted, ${updated} updated`);
        
        await cleanupTempFile(file.path);
        
        res.json(buildImportResponse(validRows, invalidRows, inserted, updated));
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Import error:', error);
        
        await cleanupTempFile(file.path);
        
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// ================================================
// IMPORT KELAS (CLASSES)
// ================================================

/**
 * Import Kelas from Excel/CSV
 * @route POST /api/admin/import/kelas
 */
export const importKelas = async (req, res) => {
    const file = req.file;
    const isDryRun = req.query.dryRun === 'true';
    
    if (!file) {
        return res.status(400).json({ 
            success: false, 
            error: 'File is required' 
        });
    }
    
    console.log(`📥 Importing Kelas: ${file.originalname} (Dry Run: ${isDryRun})`);
    
    let connection;
    try {
        const { rows: parsedRows } = await parseExcelFile(file.path);
        
        const validRows = [];
        const invalidRows = [];
        
        for (const { rowNumber, data } of parsedRows) {
            const rowData = {
                nama_kelas: data.col1,
                tingkat: data.col2 || null,
                status: data.col3 || 'aktif'
            };
            
            const validation = validateKelasRow(rowData, rowNumber);
            
            if (validation.isValid) {
                validRows.push({ ...rowData, rowNumber });
            } else {
                invalidRows.push({
                    index: rowNumber,
                    errors: validation.errors
                });
            }
        }
        
        console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid`);
        
        if (isDryRun) {
            await cleanupTempFile(file.path);
            return res.json(buildImportResponse(validRows, invalidRows));
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        let inserted = 0;
        let updated = 0;
        
        for (const row of validRows) {
            try {
                const [result] = await connection.execute(
                    `INSERT INTO kelas (nama_kelas, tingkat, status, created_at) 
                     VALUES (?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        tingkat = VALUES(tingkat), 
                        status = VALUES(status),
                        updated_at = NOW()`,
                    [row.nama_kelas, row.tingkat, row.status]
                );
                
                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Error inserting row ${row.rowNumber}:`, err.message);
                invalidRows.push({
                    index: row.rowNumber,
                    errors: [err.message]
                });
            }
        }
        
        await connection.commit();
        console.log(`✅ Import complete: ${inserted} inserted, ${updated} updated`);
        
        await cleanupTempFile(file.path);
        
        res.json(buildImportResponse(validRows, invalidRows, inserted, updated));
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Import error:', error);
        
        await cleanupTempFile(file.path);
        
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// ================================================
// IMPORT GURU (TEACHERS)
// ================================================

/**
 * Import Guru from Excel/CSV
 * @route POST /api/admin/import/guru
 */
export const importGuru = async (req, res) => {
    const file = req.file;
    const isDryRun = req.query.dryRun === 'true';
    
    if (!file) {
        return res.status(400).json({ 
            success: false, 
            error: 'File is required' 
        });
    }
    
    console.log(`📥 Importing Guru: ${file.originalname} (Dry Run: ${isDryRun})`);
    
    let connection;
    try {
        const { rows: parsedRows } = await parseExcelFile(file.path);
        
        const validRows = [];
        const invalidRows = [];
        
        for (const { rowNumber, data } of parsedRows) {
            const rowData = {
                nip: data.col1,
                nama: data.col2,
                mapel_id: data.col3 || null,
                username: data.col4 || null,
                password: data.col5 || null,
                no_telp: data.col6 || null,
                alamat: data.col7 || null,
                jenis_kelamin: data.col8 || null,
                status: data.col9 || 'aktif'
            };
            
            const validation = validateGuruRow(rowData, rowNumber);
            
            if (validation.isValid) {
                validRows.push({ ...rowData, rowNumber });
            } else {
                invalidRows.push({
                    index: rowNumber,
                    errors: validation.errors
                });
            }
        }
        
        console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid`);
        
        if (isDryRun) {
            await cleanupTempFile(file.path);
            return res.json(buildImportResponse(validRows, invalidRows));
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        let inserted = 0;
        let updated = 0;
        
        for (const row of validRows) {
            try {
                let userId = null;
                
                // If username and password provided, create user account
                if (row.username && row.password) {
                    const hashedPassword = await bcrypt.hash(row.password, 10);
                    
                    const [userResult] = await connection.execute(
                        `INSERT INTO users (username, password, role, nama, email, status, created_at) 
                         VALUES (?, ?, 'GURU', ?, NULL, 'aktif', NOW())
                         ON DUPLICATE KEY UPDATE password = VALUES(password)`,
                        [row.username, hashedPassword, row.nama]
                    );
                    
                    userId = userResult.insertId || userResult.affectedRows;
                }
                
                // Insert/update guru
                const [result] = await connection.execute(
                    `INSERT INTO guru (nip, nama, mapel_id, user_id, no_telp, alamat, jenis_kelamin, status, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        nama = VALUES(nama), 
                        mapel_id = VALUES(mapel_id),
                        no_telp = VALUES(no_telp),
                        alamat = VALUES(alamat),
                        jenis_kelamin = VALUES(jenis_kelamin),
                        status = VALUES(status),
                        updated_at = NOW()`,
                    [row.nip, row.nama, row.mapel_id, userId, row.no_telp, row.alamat, row.jenis_kelamin, row.status]
                );
                
                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Error inserting row ${row.rowNumber}:`, err.message);
                invalidRows.push({
                    index: row.rowNumber,
                    errors: [err.message]
                });
            }
        }
        
        await connection.commit();
        console.log(`✅ Import complete: ${inserted} inserted, ${updated} updated`);
        
        await cleanupTempFile(file.path);
        
        res.json(buildImportResponse(validRows, invalidRows, inserted, updated));
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Import error:', error);
        
        await cleanupTempFile(file.path);
        
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// ================================================
// IMPORT SISWA (STUDENTS)
// ================================================

/**
 * Import Siswa from Excel/CSV
 * @route POST /api/admin/import/siswa
 */
export const importSiswa = async (req, res) => {
    const file = req.file;
    const isDryRun = req.query.dryRun === 'true';
    
    if (!file) {
        return res.status(400).json({ 
            success: false, 
            error: 'File is required' 
        });
    }
    
    console.log(`📥 Importing Siswa: ${file.originalname} (Dry Run: ${isDryRun})`);
    
    let connection;
    try {
        const { rows: parsedRows } = await parseExcelFile(file.path);
        
        const validRows = [];
        const invalidRows = [];
        
        for (const { rowNumber, data } of parsedRows) {
            const rowData = {
                nis: data.col1,
                nama: data.col2,
                kelas_id: data.col3,
                username: data.col4 || null,
                password: data.col5 || null,
                jenis_kelamin: data.col6 || null,
                email: data.col7 || null,
                alamat: data.col8 || null,
                telepon_orangtua: data.col9 || null,
                telepon_siswa: data.col10 || null,
                status: data.col11 || 'aktif'
            };
            
            const validation = validateSiswaRow(rowData, rowNumber);
            
            if (validation.isValid) {
                validRows.push({ ...rowData, rowNumber });
            } else {
                invalidRows.push({
                    index: rowNumber,
                    errors: validation.errors
                });
            }
        }
        
        console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid`);
        
        if (isDryRun) {
            await cleanupTempFile(file.path);
            return res.json(buildImportResponse(validRows, invalidRows));
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        let inserted = 0;
        let updated = 0;
        
        for (const row of validRows) {
            try {
                let userId = null;
                
                // If username and password provided, create user account
                if (row.username && row.password) {
                    const hashedPassword = await bcrypt.hash(row.password, 10);
                    
                    const [userResult] = await connection.execute(
                        `INSERT INTO users (username, password, role, nama, email, status, created_at) 
                         VALUES (?, ?, 'SISWA', ?, ?, 'aktif', NOW())
                         ON DUPLICATE KEY UPDATE password = VALUES(password), email = VALUES(email)`,
                        [row.username, hashedPassword, row.nama, row.email]
                    );
                    
                    userId = userResult.insertId || userResult.affectedRows;
                }
                
                // Insert/update siswa
                const [result] = await connection.execute(
                    `INSERT INTO siswa (nis, nama, kelas_id, user_id, jenis_kelamin, email, alamat, telepon_orangtua, telepon_siswa, status, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        nama = VALUES(nama), 
                        kelas_id = VALUES(kelas_id),
                        jenis_kelamin = VALUES(jenis_kelamin),
                        email = VALUES(email),
                        alamat = VALUES(alamat),
                        telepon_orangtua = VALUES(telepon_orangtua),
                        telepon_siswa = VALUES(telepon_siswa),
                        status = VALUES(status),
                        updated_at = NOW()`,
                    [row.nis, row.nama, row.kelas_id, userId, row.jenis_kelamin, row.email, row.alamat, row.telepon_orangtua, row.telepon_siswa, row.status]
                );
                
                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Error inserting row ${row.rowNumber}:`, err.message);
                invalidRows.push({
                    index: row.rowNumber,
                    errors: [err.message]
                });
            }
        }
        
        await connection.commit();
        console.log(`✅ Import complete: ${inserted} inserted, ${updated} updated`);
        
        await cleanupTempFile(file.path);
        
        res.json(buildImportResponse(validRows, invalidRows, inserted, updated));
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Import error:', error);
        
        await cleanupTempFile(file.path);
        
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

// ================================================
// IMPORT JADWAL (SCHEDULES)
// ================================================

/**
 * Import Jadwal from Excel/CSV
 * @route POST /api/admin/import/jadwal
 */
export const importJadwal = async (req, res) => {
    const file = req.file;
    const isDryRun = req.query.dryRun === 'true';
    
    if (!file) {
        return res.status(400).json({ 
            success: false, 
            error: 'File is required' 
        });
    }
    
    console.log(`📥 Importing Jadwal: ${file.originalname} (Dry Run: ${isDryRun})`);
    
    let connection;
    try {
        const { rows: parsedRows } = await parseExcelFile(file.path);
        
        const validRows = [];
        const invalidRows = [];
        
        for (const { rowNumber, data } of parsedRows) {
            const rowData = {
                kelas_id: data.col1,
                mapel_id: data.col2,
                guru_id: data.col3,
                hari: data.col4,
                jam_ke: data.col5,
                jam_mulai: data.col6,
                jam_selesai: data.col7,
                status: data.col8 || 'aktif'
            };
            
            const validation = validateJadwalRow(rowData, rowNumber);
            
            if (validation.isValid) {
                validRows.push({ ...rowData, rowNumber });
            } else {
                invalidRows.push({
                    index: rowNumber,
                    errors: validation.errors
                });
            }
        }
        
        console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid`);
        
        if (isDryRun) {
            await cleanupTempFile(file.path);
            return res.json(buildImportResponse(validRows, invalidRows));
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();
        
        let inserted = 0;
        let updated = 0;
        
        for (const row of validRows) {
            try {
                // Normalize time format (add :00 if HH:MM)
                const jamMulai = row.jam_mulai.length === 5 ? row.jam_mulai + ':00' : row.jam_mulai;
                const jamSelesai = row.jam_selesai.length === 5 ? row.jam_selesai + ':00' : row.jam_selesai;
                
                const [result] = await connection.execute(
                    `INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                     ON DUPLICATE KEY UPDATE 
                        mapel_id = VALUES(mapel_id),
                        guru_id = VALUES(guru_id),
                        jam_mulai = VALUES(jam_mulai),
                        jam_selesai = VALUES(jam_selesai),
                        status = VALUES(status),
                        updated_at = NOW()`,
                    [row.kelas_id, row.mapel_id, row.guru_id, row.hari, row.jam_ke, jamMulai, jamSelesai, row.status]
                );
                
                if (result.affectedRows === 1) {
                    inserted++;
                } else if (result.affectedRows === 2) {
                    updated++;
                }
            } catch (err) {
                console.error(`Error inserting row ${row.rowNumber}:`, err.message);
                invalidRows.push({
                    index: row.rowNumber,
                    errors: [err.message]
                });
            }
        }
        
        await connection.commit();
        console.log(`✅ Import complete: ${inserted} inserted, ${updated} updated`);
        
        await cleanupTempFile(file.path);
        
        res.json(buildImportResponse(validRows, invalidRows, inserted, updated));
        
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Import error:', error);
        
        await cleanupTempFile(file.path);
        
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

console.log('✅ Import controllers loaded successfully');


