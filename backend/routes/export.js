/**
 * Export Routes
 * Handles report export to Excel with letterhead integration
 */

import express from 'express';
import { db } from '../../db.js';
import { buildExcel } from '../export/excelBuilder.js';
import { buildPDF } from '../export/pdfBuilder.js';
import teacherSummarySchema from '../export/schemas/teacher-summary.js';
import studentSummarySchema from '../export/schemas/student-summary.js';
import { fetchLetterheadConfig } from '../utils/letterheadHelper.js';

const router = express.Router();

/**
 * GET /api/export/teacher-summary
 * Export teacher attendance summary to Excel
 * Query params: startDate, endDate
 */
router.get('/teacher-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting teacher summary: ${startDate} to ${endDate}`);
        
        // Query database for teacher attendance data with DAILY LOGIC
        // Priority: Alpha → Tidak Hadir, ada keterangan → Hadir
        const [teacherData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    g.id_guru,
                    g.nama,
                    g.nip,
                    ag.tanggal,
                    CASE 
                        -- Jika ada alpha/tidak hadir dalam hari itu, anggap tidak hadir
                        WHEN SUM(CASE WHEN ag.status IN ('Tidak Hadir','Alpa') THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        -- Jika semua izin/sakit, anggap hadir dengan status
                        WHEN SUM(CASE WHEN ag.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        -- Jika ada hadir, anggap hadir
                        WHEN SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM guru g
                LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                    AND ag.tanggal BETWEEN ? AND ?
                WHERE g.status = 'aktif'
                GROUP BY g.id_guru, g.nama, g.nip, ag.tanggal
            )
            SELECT 
                ds.nama,
                ds.nip,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari IN ('Sakit','Izin') THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                COUNT(DISTINCT ds.tanggal) as total_hari
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nip
            ORDER BY ds.nama
        `, [startDate, endDate]);
        
        console.log(`✅ Retrieved ${teacherData.length} teacher records (daily aggregation)`);
        
        // Transform data and calculate percentage (berdasarkan hari hadir)
        const rows = teacherData.map((row, index) => {
            const totalHadir = parseInt(row.hadir || 0);
            const totalHari = parseInt(row.total_hari || 0);
            const presentase = totalHari > 0 ? (totalHadir / totalHari) : 0;
            
            return {
                no: index + 1,
                nama: row.nama,
                nip: row.nip,
                hadir: row.hadir || 0,
                izin: row.izin || 0,
                sakit: row.sakit || 0,
                alpa: row.alpa || 0,
                presentase: presentase
            };
        });
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_teacher-summary']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: teacherSummarySchema.title,
            subtitle: teacherSummarySchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: teacherSummarySchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `teacher-summary-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Teacher summary exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting teacher summary:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/student-summary
 * Export student attendance summary to Excel
 * Query params: startDate, endDate
 */
router.get('/student-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting student summary: ${startDate} to ${endDate}`);
        
        // Query database for student attendance data with DAILY LOGIC
        // Priority: Alpha → Tidak Hadir, ada keterangan → Hadir
        const [studentData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    s.id_siswa,
                    s.nama,
                    s.nis,
                    k.nama_kelas as kelas,
                    ase.tanggal,
                    CASE 
                        -- Jika ada alpha dalam hari itu, anggap tidak hadir
                        WHEN SUM(CASE WHEN ase.status = 'Alpa' THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        -- Jika semua dispen, anggap hadir (belajar bentuk lain)
                        WHEN SUM(CASE WHEN ase.status = 'Dispen' THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Dispen'
                        -- Jika semua izin/sakit, anggap hadir dengan status
                        WHEN SUM(CASE WHEN ase.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        -- Jika ada hadir, anggap hadir
                        WHEN SUM(CASE WHEN ase.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM siswa s
                JOIN kelas k ON s.kelas_id = k.id_kelas
                LEFT JOIN absensi_siswa ase ON s.id_siswa = ase.siswa_id 
                    AND ase.tanggal BETWEEN ? AND ?
                WHERE s.status = 'aktif'
                GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas, ase.tanggal
            )
            SELECT 
                ds.nama,
                ds.nis,
                ds.kelas,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                SUM(CASE WHEN ds.status_hari = 'Dispen' THEN 1 ELSE 0 END) as dispen,
                COUNT(DISTINCT ds.tanggal) as total_hari
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nis, ds.kelas
            ORDER BY ds.kelas, ds.nama
        `, [startDate, endDate]);
        
        console.log(`✅ Retrieved ${studentData.length} student records (daily aggregation)`);
        
        // Transform data and calculate percentage (berdasarkan hari hadir, dispen juga dihitung hadir)
        const rows = studentData.map((row, index) => {
            const totalHadir = parseInt(row.hadir || 0) + parseInt(row.dispen || 0);
            const totalHari = parseInt(row.total_hari || 0);
            const presentase = totalHari > 0 ? (totalHadir / totalHari) : 0;
            
            return {
                no: index + 1,
                nama: row.nama,
                nis: row.nis,
                kelas: row.kelas,
                hadir: row.hadir || 0,
                izin: row.izin || 0,
                sakit: row.sakit || 0,
                alpa: row.alpa || 0,
                dispen: row.dispen || 0,
                presentase: presentase
            };
        });
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_student-summary']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: studentSummarySchema.title,
            subtitle: studentSummarySchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: studentSummarySchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `student-summary-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Student summary exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting student summary:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/presensi-siswa
 * Export presensi siswa (per mapel) to Excel
 * Query params: startDate, endDate, kelasId (optional)
 */
router.get('/presensi-siswa', async (req, res) => {
    try {
        const { startDate, endDate, kelasId } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting presensi siswa: ${startDate} to ${endDate}`);
        
        // Query database for student presence data (per mapel)
        const [presenceData] = await db.execute(`
            SELECT 
                s.nis,
                s.nama,
                k.nama_kelas as kelas,
                ase.tanggal,
                j.jam_ke,
                m.nama_mapel as mata_pelajaran,
                ase.status,
                ase.keterangan
            FROM absensi_siswa ase
            JOIN siswa s ON ase.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            JOIN jadwal j ON ase.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE ase.tanggal BETWEEN ? AND ?
              AND (k.id_kelas = ? OR ? IS NULL)
            ORDER BY ase.tanggal, k.nama_kelas, s.nama, j.jam_ke
        `, [startDate, endDate, kelasId || null, kelasId || null]);
        
        console.log(`✅ Retrieved ${presenceData.length} presence records`);
        
        // Transform data
        const rows = presenceData.map((row, index) => ({
            no: index + 1,
            nis: row.nis,
            nama: row.nama,
            kelas: row.kelas,
            tanggal: row.tanggal,
            jam_ke: row.jam_ke,
            mata_pelajaran: row.mata_pelajaran,
            status: row.status,
            keterangan: row.keterangan || '-'
        }));
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_presensi-siswa']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Import schema
        const presensiSiswaSchema = (await import('../export/schemas/presensi-siswa.js')).default;
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: presensiSiswaSchema.title,
            subtitle: presensiSiswaSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: presensiSiswaSchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `presensi-siswa-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Presensi siswa exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting presensi siswa:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/rekap-ketidakhadiran
 * Export rekap ketidakhadiran siswa to Excel
 * Query params: startDate, endDate, kelasId (optional)
 */
router.get('/rekap-ketidakhadiran', async (req, res) => {
    try {
        const { startDate, endDate, kelasId } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting rekap ketidakhadiran: ${startDate} to ${endDate}`);
        
        // Query database with DAILY LOGIC - only count absence days
        const [absenceData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    s.id_siswa,
                    s.nama,
                    s.nis,
                    k.nama_kelas as kelas,
                    DATE_FORMAT(ase.tanggal, '%Y-%m') as periode,
                    ase.tanggal,
                    CASE 
                        -- Jika ada alpha dalam hari itu, anggap tidak hadir
                        WHEN SUM(CASE WHEN ase.status = 'Alpa' THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        -- Jika semua dispen, anggap hadir (belajar bentuk lain)
                        WHEN SUM(CASE WHEN ase.status = 'Dispen' THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Dispen'
                        -- Jika semua izin/sakit, anggap izin/sakit
                        WHEN SUM(CASE WHEN ase.status = 'Izin' THEN 1 ELSE 0 END) > 0
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ase.status = 'Sakit' THEN 1 ELSE 0 END) > 0
                            THEN 'Sakit'
                        ELSE 'Hadir'
                    END as status_hari
                FROM siswa s
                JOIN kelas k ON s.kelas_id = k.id_kelas
                LEFT JOIN absensi_siswa ase ON s.id_siswa = ase.siswa_id 
                    AND ase.tanggal BETWEEN ? AND ?
                WHERE s.status = 'aktif'
                  AND (k.id_kelas = ? OR ? IS NULL)
                GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas, ase.tanggal, periode
            )
            SELECT 
                ds.nama,
                ds.nis,
                ds.kelas,
                DATE_FORMAT(STR_TO_DATE(CONCAT(ds.periode, '-01'), '%Y-%m-%d'), '%M %Y') as periode,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                SUM(CASE WHEN ds.status_hari = 'Dispen' THEN 1 ELSE 0 END) as dispen,
                SUM(CASE WHEN ds.status_hari IN ('Izin','Sakit','Alpa') THEN 1 ELSE 0 END) as total_tidak_hadir
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nis, ds.kelas, ds.periode
            ORDER BY ds.kelas, ds.nama, ds.periode
        `, [startDate, endDate, kelasId || null, kelasId || null]);
        
        console.log(`✅ Retrieved ${absenceData.length} absence records`);
        
        // Transform data
        const rows = absenceData.map((row, index) => ({
            no: index + 1,
            nama: row.nama,
            nis: row.nis,
            kelas: row.kelas,
            periode: row.periode,
            izin: row.izin || 0,
            sakit: row.sakit || 0,
            alpa: row.alpa || 0,
            dispen: row.dispen || 0,
            total_tidak_hadir: row.total_tidak_hadir || 0
        }));
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_rekap-ketidakhadiran']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Import schema
        const rekapKetidakhadiranSchema = (await import('../export/schemas/rekap-ketidakhadiran.js')).default;
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: rekapKetidakhadiranSchema.title,
            subtitle: rekapKetidakhadiranSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: rekapKetidakhadiranSchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `rekap-ketidakhadiran-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Rekap ketidakhadiran exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/rekap-ketidakhadiran-guru
 * Export rekap ketidakhadiran guru to Excel
 * Query params: startDate, endDate, mapelId (optional)
 */
router.get('/rekap-ketidakhadiran-guru', async (req, res) => {
    try {
        const { startDate, endDate, mapelId } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting rekap ketidakhadiran guru: ${startDate} to ${endDate}`);
        
        // Query database with DAILY LOGIC
        const [absenceData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    g.id_guru,
                    g.nama,
                    g.nip,
                    m.nama_mapel as mata_pelajaran,
                    DATE_FORMAT(ag.tanggal, '%Y-%m') as periode_key,
                    ag.tanggal,
                    CASE 
                        WHEN SUM(CASE WHEN ag.status IN ('Tidak Hadir','Alpa') THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        WHEN SUM(CASE WHEN ag.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM guru g
                LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
                LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                    AND ag.tanggal BETWEEN ? AND ?
                WHERE g.status = 'aktif'
                  AND (m.id_mapel = ? OR ? IS NULL)
                GROUP BY g.id_guru, g.nama, g.nip, m.nama_mapel, ag.tanggal, periode_key
            )
            SELECT 
                ds.nama,
                ds.nip,
                ds.mata_pelajaran,
                DATE_FORMAT(STR_TO_DATE(CONCAT(ds.periode_key, '-01'), '%Y-%m-%d'), '%M %Y') as periode,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari IN ('Sakit','Izin') THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                COUNT(DISTINCT ds.tanggal) as total,
                ROUND((SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) / COUNT(DISTINCT ds.tanggal)), 4) as presentase
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nip, ds.mata_pelajaran, ds.periode_key, periode
            ORDER BY ds.nama, ds.periode_key
        `, [startDate, endDate, mapelId || null, mapelId || null]);
        
        console.log(`✅ Retrieved ${absenceData.length} teacher absence records`);
        
        // Transform data
        const rows = absenceData.map((row, index) => ({
            no: index + 1,
            nama: row.nama,
            nip: row.nip,
            mata_pelajaran: row.mata_pelajaran || '-',
            periode: row.periode,
            hadir: row.hadir || 0,
            izin: row.izin || 0,
            sakit: row.sakit || 0,
            alpa: row.alpa || 0,
            total: row.total || 0,
            presentase: row.presentase || 0
        }));
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_rekap-ketidakhadiran-guru']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Import schema
        const rekapKetidakhadiranGuruSchema = (await import('../export/schemas/rekap-ketidakhadiran-guru.js')).default;
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: rekapKetidakhadiranGuruSchema.title,
            subtitle: rekapKetidakhadiranGuruSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: rekapKetidakhadiranGuruSchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `rekap-ketidakhadiran-guru-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Rekap ketidakhadiran guru exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran guru:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/banding-absen
 * Export banding absen history to Excel
 * Query params: startDate, endDate, status (optional)
 */
router.get('/banding-absen', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📊 Exporting banding absen: ${startDate} to ${endDate}`);
        
        // Query database for banding absen data
        const [bandingData] = await db.execute(`
            SELECT 
                pba.tanggal_pengajuan,
                pba.tanggal_absen,
                s.nama as pengaju,
                k.nama_kelas as kelas,
                m.nama_mapel as mata_pelajaran,
                pba.status_asli,
                pba.status_diajukan,
                pba.status_banding,
                pba.alasan_banding,
                pba.catatan_guru,
                pba.tanggal_keputusan,
                g.nama as diproses_oleh
            FROM pengajuan_banding_absen pba
            JOIN siswa s ON pba.siswa_id = s.id_siswa
            JOIN kelas k ON pba.kelas_id = k.id_kelas
            JOIN jadwal j ON pba.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON pba.diproses_oleh = g.id_guru
            WHERE pba.tanggal_pengajuan BETWEEN ? AND ?
              AND (pba.status_banding = ? OR ? IS NULL)
            ORDER BY pba.tanggal_pengajuan DESC
        `, [startDate, endDate, status || null, status || null]);
        
        console.log(`✅ Retrieved ${bandingData.length} banding records`);
        
        // Transform data
        const rows = bandingData.map((row, index) => ({
            no: index + 1,
            tanggal_pengajuan: row.tanggal_pengajuan,
            tanggal_absen: row.tanggal_absen,
            pengaju: row.pengaju,
            kelas: row.kelas,
            mata_pelajaran: row.mata_pelajaran,
            status_asli: row.status_asli,
            status_diajukan: row.status_diajukan,
            status_banding: row.status_banding,
            alasan_banding: row.alasan_banding,
            catatan_guru: row.catatan_guru || '-',
            tanggal_keputusan: row.tanggal_keputusan || '-',
            diproses_oleh: row.diproses_oleh || '-'
        }));
        
        // Fetch letterhead configuration
        let letterheadConfig = null;
        try {
            const [letterheadData] = await db.execute(
                'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
                ['letterhead_banding-absen']
            );
            
            if (letterheadData.length > 0) {
                letterheadConfig = JSON.parse(letterheadData[0].config_value);
                console.log('✅ Letterhead config loaded from database');
            }
        } catch (error) {
            console.log('⚠️ No custom letterhead config found, using default');
        }
        
        // Default letterhead if none found
        if (!letterheadConfig) {
            letterheadConfig = {
                enabled: true,
                logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
                logoRightUrl: "/uploads/letterheads/logo-smk.png",
                lines: [
                    "PEMERINTAH PROVINSI DKI JAKARTA",
                    "DINAS PENDIDIKAN",
                    "SMK NEGERI 13 JAKARTA",
                    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
                    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
                ],
                alignment: "center"
            };
        }
        
        // Import schema
        const bandingAbsenSchema = (await import('../export/schemas/banding-absen.js')).default;
        
        // Build Excel workbook
        const workbook = await buildExcel({
            title: bandingAbsenSchema.title,
            subtitle: bandingAbsenSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: bandingAbsenSchema.columns,
            rows: rows
        });
        
        // Set response headers for file download
        const filename = `banding-absen-${startDate}-${endDate}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();
        
        console.log(`✅ Banding absen exported successfully: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting banding absen:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

// ================================================
// HELPER FUNCTION: Fetch Letterhead Config
// ================================================

async function fetchLetterheadConfig(reportKey) {
    try {
        const [letterheadData] = await db.execute(
            'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
            [`letterhead_${reportKey}`]
        );
        
        if (letterheadData.length > 0) {
            console.log(`✅ Letterhead config loaded for ${reportKey}`);
            return JSON.parse(letterheadData[0].config_value);
        }
    } catch (error) {
        console.log(`⚠️ No custom letterhead for ${reportKey}, using default`);
    }
    
    // Default letterhead fallback
    return {
        enabled: true,
        logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
        logoRightUrl: "/uploads/letterheads/logo-smk.png",
        lines: [
            "PEMERINTAH PROVINSI DKI JAKARTA",
            "DINAS PENDIDIKAN",
            "SMK NEGERI 13 JAKARTA",
            "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
            "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
        ],
        alignment: "center"
    };
}

// ================================================
// PDF EXPORT ENDPOINTS
// ================================================

/**
 * GET /api/export/teacher-summary/pdf
 * Export teacher attendance summary to PDF
 */
router.get('/teacher-summary/pdf', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting teacher summary PDF: ${startDate} to ${endDate}`);
        
        // Query database (same as Excel endpoint)
        const [teacherData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    g.id_guru,
                    g.nama,
                    g.nip,
                    ag.tanggal,
                    CASE 
                        WHEN SUM(CASE WHEN ag.status IN ('Tidak Hadir','Alpa') THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        WHEN SUM(CASE WHEN ag.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM guru g
                LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                    AND ag.tanggal BETWEEN ? AND ?
                WHERE g.status = 'aktif'
                GROUP BY g.id_guru, g.nama, g.nip, ag.tanggal
            )
            SELECT 
                ds.nama,
                ds.nip,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari IN ('Sakit','Izin') THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                COUNT(DISTINCT ds.tanggal) as total_hari
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nip
            ORDER BY ds.nama
        `, [startDate, endDate]);
        
        // Transform data
        const rows = teacherData.map((row, index) => {
            const totalHadir = parseInt(row.hadir || 0);
            const totalHari = parseInt(row.total_hari || 0);
            const presentase = totalHari > 0 ? (totalHadir / totalHari) : 0;
            
            return {
                no: index + 1,
                nama: row.nama,
                nip: row.nip,
                hadir: row.hadir || 0,
                izin: row.izin || 0,
                sakit: row.sakit || 0,
                alpa: row.alpa || 0,
                total_hari: row.total_hari || 0,
                presentase: presentase
            };
        });
        
        // Fetch letterhead
        const letterheadConfig = await fetchLetterheadConfig('teacher-summary');
        
        // Build PDF
        const doc = await buildPDF({
            title: teacherSummarySchema.title,
            subtitle: teacherSummarySchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: teacherSummarySchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `ringkasan-kehadiran-guru-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting teacher summary PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/student-summary/pdf
 * Export student attendance summary to PDF
 */
router.get('/student-summary/pdf', async (req, res) => {
    try {
        const { startDate, endDate, kelas_id } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting student summary PDF: ${startDate} to ${endDate}`);
        
        // Query database (same as Excel endpoint)
        const [studentData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    s.id_siswa,
                    s.nama,
                    s.nis,
                    k.nama_kelas as kelas,
                    ase.tanggal,
                    CASE 
                        WHEN SUM(CASE WHEN ase.status = 'Alpa' THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        WHEN SUM(CASE WHEN ase.status = 'Dispen' THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Dispen'
                        WHEN SUM(CASE WHEN ase.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ase.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM siswa s
                JOIN kelas k ON s.kelas_id = k.id_kelas
                LEFT JOIN absensi_siswa ase ON s.id_siswa = ase.siswa_id 
                    AND ase.tanggal BETWEEN ? AND ?
                WHERE s.status = 'aktif'
                  AND (k.id_kelas = ? OR ? IS NULL)
                GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas, ase.tanggal
            )
            SELECT 
                ds.nama,
                ds.nis,
                ds.kelas,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                SUM(CASE WHEN ds.status_hari = 'Dispen' THEN 1 ELSE 0 END) as dispen,
                COUNT(DISTINCT ds.tanggal) as total_hari
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nis, ds.kelas
            ORDER BY ds.kelas, ds.nama
        `, [startDate, endDate, kelas_id || null, kelas_id || null]);
        
        // Transform data
        const rows = studentData.map((row, index) => {
            const totalHadir = parseInt(row.hadir || 0) + parseInt(row.dispen || 0);
            const totalHari = parseInt(row.total_hari || 0);
            const presentase = totalHari > 0 ? (totalHadir / totalHari) : 0;
            
            return {
                no: index + 1,
                nama: row.nama,
                nis: row.nis,
                kelas: row.kelas,
                hadir: row.hadir || 0,
                izin: row.izin || 0,
                sakit: row.sakit || 0,
                alpa: row.alpa || 0,
                dispen: row.dispen || 0,
                presentase: presentase
            };
        });
        
        // Fetch letterhead
        const letterheadConfig = await fetchLetterheadConfig('student-summary');
        
        // Build PDF
        const doc = await buildPDF({
            title: studentSummarySchema.title,
            subtitle: studentSummarySchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: studentSummarySchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `ringkasan-kehadiran-siswa-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting student summary PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/presensi-siswa/pdf
 * Export student detailed presence to PDF
 */
router.get('/presensi-siswa/pdf', async (req, res) => {
    try {
        const { startDate, endDate, kelasId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting presensi siswa PDF: ${startDate} to ${endDate}`);
        
        // Query database
        const [presensiData] = await db.execute(`
            SELECT 
                s.nis, s.nama,
                k.nama_kelas as kelas,
                ase.tanggal,
                j.jam_ke,
                m.nama_mapel as mata_pelajaran,
                ase.status,
                ase.keterangan
            FROM absensi_siswa ase
            JOIN siswa s ON ase.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            JOIN jadwal j ON ase.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            WHERE ase.tanggal BETWEEN ? AND ?
              AND (k.id_kelas = ? OR ? IS NULL)
            ORDER BY ase.tanggal, k.nama_kelas, s.nama, j.jam_ke
        `, [startDate, endDate, kelasId || null, kelasId || null]);
        
        // Transform data
        const rows = presensiData.map((row, index) => ({
            no: index + 1,
            nis: row.nis,
            nama: row.nama,
            kelas: row.kelas,
            tanggal: row.tanggal,
            jam_ke: row.jam_ke,
            mata_pelajaran: row.mata_pelajaran,
            status: row.status,
            keterangan: row.keterangan || '-'
        }));
        
        // Fetch schema and letterhead
        const presensiSiswaSchema = (await import('../export/schemas/presensi-siswa.js')).default;
        const letterheadConfig = await fetchLetterheadConfig('presensi-siswa');
        
        // Build PDF
        const doc = await buildPDF({
            title: presensiSiswaSchema.title,
            subtitle: presensiSiswaSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: presensiSiswaSchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `presensi-siswa-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting presensi siswa PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/rekap-ketidakhadiran/pdf
 * Export student absence recapitulation to PDF
 */
router.get('/rekap-ketidakhadiran/pdf', async (req, res) => {
    try {
        const { startDate, endDate, kelasId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting rekap ketidakhadiran PDF: ${startDate} to ${endDate}`);
        
        // Query database (same as Excel)
        const [absenceData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    s.id_siswa,
                    s.nama,
                    s.nis,
                    k.nama_kelas as kelas,
                    DATE_FORMAT(ase.tanggal, '%Y-%m') as periode,
                    ase.tanggal,
                    CASE 
                        WHEN SUM(CASE WHEN ase.status = 'Alpa' THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        WHEN SUM(CASE WHEN ase.status = 'Dispen' THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Dispen'
                        WHEN SUM(CASE WHEN ase.status = 'Izin' THEN 1 ELSE 0 END) > 0
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ase.status = 'Sakit' THEN 1 ELSE 0 END) > 0
                            THEN 'Sakit'
                        ELSE 'Hadir'
                    END as status_hari
                FROM siswa s
                JOIN kelas k ON s.kelas_id = k.id_kelas
                LEFT JOIN absensi_siswa ase ON s.id_siswa = ase.siswa_id 
                    AND ase.tanggal BETWEEN ? AND ?
                WHERE s.status = 'aktif'
                  AND (k.id_kelas = ? OR ? IS NULL)
                GROUP BY s.id_siswa, s.nama, s.nis, k.nama_kelas, ase.tanggal, periode
            )
            SELECT 
                ds.nama,
                ds.nis,
                ds.kelas,
                DATE_FORMAT(STR_TO_DATE(CONCAT(ds.periode, '-01'), '%Y-%m-%d'), '%M %Y') as periode,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                SUM(CASE WHEN ds.status_hari = 'Dispen' THEN 1 ELSE 0 END) as dispen,
                SUM(CASE WHEN ds.status_hari IN ('Izin','Sakit','Alpa') THEN 1 ELSE 0 END) as total_tidak_hadir
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nis, ds.kelas, ds.periode
            ORDER BY ds.kelas, ds.nama, ds.periode
        `, [startDate, endDate, kelasId || null, kelasId || null]);
        
        // Transform data
        const rows = absenceData.map((row, index) => ({
            no: index + 1,
            nama: row.nama,
            nis: row.nis,
            kelas: row.kelas,
            periode: row.periode,
            izin: row.izin || 0,
            sakit: row.sakit || 0,
            alpa: row.alpa || 0,
            dispen: row.dispen || 0,
            total_tidak_hadir: row.total_tidak_hadir || 0
        }));
        
        // Fetch schema and letterhead
        const rekapKetidakhadiranSchema = (await import('../export/schemas/rekap-ketidakhadiran.js')).default;
        const letterheadConfig = await fetchLetterheadConfig('rekap-ketidakhadiran');
        
        // Build PDF
        const doc = await buildPDF({
            title: rekapKetidakhadiranSchema.title,
            subtitle: rekapKetidakhadiranSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: rekapKetidakhadiranSchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `rekap-ketidakhadiran-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/rekap-ketidakhadiran-guru/pdf
 * Export teacher absence recapitulation to PDF
 */
router.get('/rekap-ketidakhadiran-guru/pdf', async (req, res) => {
    try {
        const { startDate, endDate, mapelId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting rekap ketidakhadiran guru PDF: ${startDate} to ${endDate}`);
        
        // Query database (same as Excel)
        const [absenceData] = await db.execute(`
            WITH daily_status AS (
                SELECT 
                    g.id_guru,
                    g.nama,
                    g.nip,
                    m.nama_mapel as mata_pelajaran,
                    DATE_FORMAT(ag.tanggal, '%Y-%m') as periode_key,
                    ag.tanggal,
                    CASE 
                        WHEN SUM(CASE WHEN ag.status IN ('Tidak Hadir','Alpa') THEN 1 ELSE 0 END) > 0 
                            THEN 'Alpa'
                        WHEN SUM(CASE WHEN ag.status IN ('Izin','Sakit') THEN 1 ELSE 0 END) = COUNT(*) 
                            THEN 'Izin'
                        WHEN SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) > 0 
                            THEN 'Hadir'
                        ELSE 'Alpa'
                    END as status_hari
                FROM guru g
                LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
                LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id 
                    AND ag.tanggal BETWEEN ? AND ?
                WHERE g.status = 'aktif'
                  AND (m.id_mapel = ? OR ? IS NULL)
                GROUP BY g.id_guru, g.nama, g.nip, m.nama_mapel, ag.tanggal, periode_key
            )
            SELECT 
                ds.nama,
                ds.nip,
                ds.mata_pelajaran,
                DATE_FORMAT(STR_TO_DATE(CONCAT(ds.periode_key, '-01'), '%Y-%m-%d'), '%M %Y') as periode,
                SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN ds.status_hari = 'Izin' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN ds.status_hari IN ('Sakit','Izin') THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN ds.status_hari = 'Alpa' THEN 1 ELSE 0 END) as alpa,
                COUNT(DISTINCT ds.tanggal) as total,
                ROUND((SUM(CASE WHEN ds.status_hari = 'Hadir' THEN 1 ELSE 0 END) / COUNT(DISTINCT ds.tanggal)), 4) as presentase
            FROM daily_status ds
            WHERE ds.tanggal IS NOT NULL
            GROUP BY ds.nama, ds.nip, ds.mata_pelajaran, ds.periode_key, periode
            ORDER BY ds.nama, ds.periode_key
        `, [startDate, endDate, mapelId || null, mapelId || null]);
        
        // Transform data
        const rows = absenceData.map((row, index) => ({
            no: index + 1,
            nama: row.nama,
            nip: row.nip,
            mata_pelajaran: row.mata_pelajaran || '-',
            periode: row.periode,
            hadir: row.hadir || 0,
            izin: row.izin || 0,
            sakit: row.sakit || 0,
            alpa: row.alpa || 0,
            total: row.total || 0,
            presentase: row.presentase || 0
        }));
        
        // Fetch schema and letterhead
        const rekapKetidakhadiranGuruSchema = (await import('../export/schemas/rekap-ketidakhadiran-guru.js')).default;
        const letterheadConfig = await fetchLetterheadConfig('rekap-ketidakhadiran-guru');
        
        // Build PDF
        const doc = await buildPDF({
            title: rekapKetidakhadiranGuruSchema.title,
            subtitle: rekapKetidakhadiranGuruSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: rekapKetidakhadiranGuruSchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `rekap-ketidakhadiran-guru-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting rekap ketidakhadiran guru PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

/**
 * GET /api/export/banding-absen/pdf
 * Export attendance appeals history to PDF
 */
router.get('/banding-absen/pdf', async (req, res) => {
    try {
        const { startDate, endDate, statusBanding } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters',
                message: 'startDate and endDate are required'
            });
        }
        
        console.log(`📄 Exporting banding absen PDF: ${startDate} to ${endDate}`);
        
        // Query database (same as Excel)
        const [bandingData] = await db.execute(`
            SELECT 
                pba.tanggal_pengajuan,
                pba.tanggal_absen,
                s.nama as pengaju,
                k.nama_kelas as kelas,
                m.nama_mapel as mata_pelajaran,
                pba.status_asli,
                pba.status_diajukan,
                pba.status_banding,
                pba.alasan_banding,
                pba.catatan_guru,
                pba.tanggal_keputusan,
                g.nama as diproses_oleh
            FROM pengajuan_banding_absen pba
            JOIN siswa s ON pba.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            JOIN jadwal j ON pba.jadwal_id = j.id_jadwal
            JOIN mapel m ON j.mapel_id = m.id_mapel
            LEFT JOIN guru g ON pba.diproses_oleh = g.id_guru
            WHERE pba.tanggal_pengajuan BETWEEN ? AND ?
              AND (pba.status_banding = ? OR ? IS NULL)
            ORDER BY pba.tanggal_pengajuan DESC
        `, [startDate, endDate, statusBanding || null, statusBanding || null]);
        
        // Transform data
        const rows = bandingData.map((row, index) => ({
            no: index + 1,
            tanggal_pengajuan: row.tanggal_pengajuan,
            tanggal_absen: row.tanggal_absen,
            pengaju: row.pengaju,
            kelas: row.kelas,
            mata_pelajaran: row.mata_pelajaran,
            status_asli: row.status_asli,
            status_diajukan: row.status_diajukan,
            status_banding: row.status_banding,
            alasan_banding: row.alasan_banding,
            catatan_guru: row.catatan_guru || '-',
            tanggal_keputusan: row.tanggal_keputusan || '-',
            diproses_oleh: row.diproses_oleh || '-'
        }));
        
        // Fetch schema and letterhead
        const bandingAbsenSchema = (await import('../export/schemas/banding-absen.js')).default;
        const letterheadConfig = await fetchLetterheadConfig('banding-absen');
        
        // Build PDF
        const doc = await buildPDF({
            title: bandingAbsenSchema.title,
            subtitle: bandingAbsenSchema.subtitle,
            reportPeriod: `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`,
            letterhead: letterheadConfig,
            columns: bandingAbsenSchema.columns,
            rows: rows,
            orientation: 'landscape'
        });
        
        // Set response headers
        const filename = `riwayat-banding-absen-${startDate}-${endDate}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send PDF
        const pdfBuffer = doc.output('arraybuffer');
        res.send(Buffer.from(pdfBuffer));
        
        console.log(`✅ PDF export successful: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting banding absen PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            message: error.message
        });
    }
});

// ================================================
// JADWAL GLOBAL EXPORT ENDPOINTS
// ================================================

// GET /api/export/jadwal-global/excel - Export jadwal global ke Excel
router.get('/jadwal-global/excel', async (req, res) => {
  try {
    const { kelas_id, guru_id, hari } = req.query;
    console.log('📊 Exporting global schedule to Excel:', { kelas_id, guru_id, hari });
    
    // Reuse logic dari /api/admin/jadwal-global
    let whereConditions = ['j.status = "aktif"'];
    let params = [];
    
    if (kelas_id && kelas_id !== 'all') {
      whereConditions.push('j.kelas_id = ?');
      params.push(kelas_id);
    }
    
    if (guru_id && guru_id !== 'all') {
      whereConditions.push('(j.guru_id = ? OR jg.guru_id = ?)');
      params.push(guru_id, guru_id);
    }
    
    if (hari && hari !== 'all') {
      whereConditions.push('j.hari = ?');
      params.push(hari);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // Get jadwal pelajaran
    const [jadwal] = await db.execute(`
      SELECT 
        j.id_jadwal as id,
        'jadwal' as type,
        j.hari,
        j.jam_ke,
        j.jam_mulai,
        j.jam_selesai,
        j.kelas_id,
        k.nama_kelas,
        j.mapel_id,
        m.nama_mapel,
        j.guru_id,
        g.nama as nama_guru,
        GROUP_CONCAT(DISTINCT g2.nama SEPARATOR ', ') as guru_tambahan
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
      LEFT JOIN guru g2 ON jg.guru_id = g2.id_guru
      ${whereClause}
      GROUP BY j.id_jadwal
      ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), j.jam_ke
    `, params);
    
    // Get jadwal_khusus
    let khususWhereConditions = ['jk.status = "aktif"'];
    let khususParams = [];
    
    if (kelas_id && kelas_id !== 'all') {
      khususWhereConditions.push('(jk.kelas_id IS NULL OR jk.kelas_id = ?)');
      khususParams.push(kelas_id);
    }
    
    if (hari && hari !== 'all') {
      khususWhereConditions.push('jk.hari = ?');
      khususParams.push(hari);
    }
    
    const khususWhereClause = 'WHERE ' + khususWhereConditions.join(' AND ');
    
    const [jadwalKhusus] = await db.execute(`
      SELECT 
        jk.id,
        'jadwal_khusus' as type,
        jk.hari,
        NULL as jam_ke,
        jk.jam_mulai,
        jk.jam_selesai,
        jk.kelas_id,
        COALESCE(k.nama_kelas, 'Semua Kelas') as nama_kelas,
        NULL as mapel_id,
        jk.nama_kegiatan as nama_mapel,
        NULL as guru_id,
        jk.jenis_kegiatan as nama_guru,
        NULL as guru_tambahan
      FROM jadwal_khusus jk
      LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
      ${khususWhereClause}
      ORDER BY FIELD(jk.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')
    `, khususParams);
    
    const allSchedules = [...jadwal, ...jadwalKhusus];
    
    // Build Excel workbook dengan grid format
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jadwal Global');
    
    // Fetch letterhead config
    let letterheadConfig = null;
    try {
      const [letterheadData] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_jadwal-global']
      );
      
      if (letterheadData.length > 0) {
        letterheadConfig = JSON.parse(letterheadData[0].config_value);
      }
    } catch (error) {
      console.log('⚠️ No custom letterhead for jadwal-global');
    }
    
    // Default letterhead
    if (!letterheadConfig) {
      letterheadConfig = {
        enabled: true,
        logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
        logoRightUrl: "/uploads/letterheads/logo-smk.png",
        lines: [
          "PEMERINTAH PROVINSI DKI JAKARTA",
          "DINAS PENDIDIKAN",
          "SMK NEGERI 13 JAKARTA",
          "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
          "Telp: (021) 4600005"
        ],
        alignment: "center"
      };
    }
    
    let currentRow = 1;
    
    // Add letterhead
    if (letterheadConfig.enabled) {
      worksheet.mergeCells(currentRow, 1, currentRow, 8);
      letterheadConfig.lines.forEach(line => {
        const cell = worksheet.getCell(currentRow, 1);
        if (currentRow === 1) {
          cell.value = line;
        } else {
          cell.value += '\n' + line;
        }
        cell.font = { bold: true, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        currentRow++;
      });
      currentRow += 2;
    }
    
    // Add title
    worksheet.mergeCells(currentRow, 1, currentRow, 8);
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = 'JADWAL GLOBAL';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    currentRow += 2;
    
    // Group schedules by hari and time
    const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const timeSlots = new Set();
    allSchedules.forEach(s => {
      timeSlots.add(`${s.jam_mulai}-${s.jam_selesai}`);
    });
    const sortedTimeSlots = Array.from(timeSlots).sort();
    
    // Create grid headers
    const headerRow = worksheet.getRow(currentRow);
    headerRow.getCell(1).value = 'Jam';
    hariList.forEach((hari, index) => {
      headerRow.getCell(index + 2).value = hari;
    });
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    currentRow++;
    
    // Fill grid data
    sortedTimeSlots.forEach(timeSlot => {
      const dataRow = worksheet.getRow(currentRow);
      dataRow.getCell(1).value = timeSlot;
      
      hariList.forEach((hari, hariIndex) => {
        const cellSchedules = allSchedules.filter(s => 
          s.hari === hari && 
          `${s.jam_mulai}-${s.jam_selesai}` === timeSlot
        );
        
        if (cellSchedules.length > 0) {
          const cellValue = cellSchedules.map(s => {
            const type = s.type === 'jadwal_khusus' ? '(Khusus)' : '';
            return `${s.nama_mapel} ${type}\n${s.nama_kelas}\n${s.nama_guru}`;
          }).join('\n\n');
          
          const cell = dataRow.getCell(hariIndex + 2);
          cell.value = cellValue;
          cell.alignment = { wrapText: true, vertical: 'top' };
          
          // Color code
          if (cellSchedules[0].type === 'jadwal_khusus') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FF' } };
          }
        }
      });
      
      dataRow.height = 60;
      currentRow++;
    });
    
    // Set column widths
    worksheet.columns = [
      { width: 15 },
      ...hariList.map(() => ({ width: 20 }))
    ];
    
    // Set response headers
    const filename = `jadwal-global-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Excel export successful: ${filename}`);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ success: false, error: 'Export failed', message: error.message });
  }
});

// GET /api/export/jadwal-global/pdf - Export jadwal global ke PDF
router.get('/jadwal-global/pdf', async (req, res) => {
  try {
    const { kelas_id, guru_id, hari } = req.query;
    console.log('📊 Exporting global schedule to PDF:', { kelas_id, guru_id, hari });
    
    // Reuse logic dari Excel export
    let whereConditions = ['j.status = "aktif"'];
    let params = [];
    
    if (kelas_id && kelas_id !== 'all') {
      whereConditions.push('j.kelas_id = ?');
      params.push(kelas_id);
    }
    
    if (guru_id && guru_id !== 'all') {
      whereConditions.push('(j.guru_id = ? OR jg.guru_id = ?)');
      params.push(guru_id, guru_id);
    }
    
    if (hari && hari !== 'all') {
      whereConditions.push('j.hari = ?');
      params.push(hari);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';
    
    // Get jadwal pelajaran
    const [jadwal] = await db.execute(`
      SELECT 
        j.id_jadwal as id,
        'jadwal' as type,
        j.hari,
        j.jam_ke,
        j.jam_mulai,
        j.jam_selesai,
        j.kelas_id,
        k.nama_kelas,
        j.mapel_id,
        m.nama_mapel,
        j.guru_id,
        g.nama as nama_guru,
        GROUP_CONCAT(DISTINCT g2.nama SEPARATOR ', ') as guru_tambahan
      FROM jadwal j
      JOIN kelas k ON j.kelas_id = k.id_kelas
      JOIN mapel m ON j.mapel_id = m.id_mapel
      JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
      LEFT JOIN guru g2 ON jg.guru_id = g2.id_guru
      ${whereClause}
      GROUP BY j.id_jadwal
      ORDER BY FIELD(j.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), j.jam_ke
    `, params);
    
    // Get jadwal_khusus
    let khususWhereConditions = ['jk.status = "aktif"'];
    let khususParams = [];
    
    if (kelas_id && kelas_id !== 'all') {
      khususWhereConditions.push('(jk.kelas_id IS NULL OR jk.kelas_id = ?)');
      khususParams.push(kelas_id);
    }
    
    if (hari && hari !== 'all') {
      khususWhereConditions.push('jk.hari = ?');
      khususParams.push(hari);
    }
    
    const khususWhereClause = 'WHERE ' + khususWhereConditions.join(' AND ');
    
    const [jadwalKhusus] = await db.execute(`
      SELECT 
        jk.id,
        'jadwal_khusus' as type,
        jk.hari,
        NULL as jam_ke,
        jk.jam_mulai,
        jk.jam_selesai,
        jk.kelas_id,
        COALESCE(k.nama_kelas, 'Semua Kelas') as nama_kelas,
        NULL as mapel_id,
        jk.nama_kegiatan as nama_mapel,
        NULL as guru_id,
        jk.jenis_kegiatan as nama_guru,
        NULL as guru_tambahan
      FROM jadwal_khusus jk
      LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
      ${khususWhereClause}
      ORDER BY FIELD(jk.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')
    `, khususParams);
    
    const allSchedules = [...jadwal, ...jadwalKhusus];
    
    // Fetch letterhead config
    let letterheadConfig = null;
    try {
      const [letterheadData] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_jadwal-global']
      );
      
      if (letterheadData.length > 0) {
        letterheadConfig = JSON.parse(letterheadData[0].config_value);
      }
    } catch (error) {
      console.log('⚠️ No custom letterhead for jadwal-global');
    }
    
    // Default letterhead
    if (!letterheadConfig) {
      letterheadConfig = {
        enabled: true,
        lines: [
          "PEMERINTAH PROVINSI DKI JAKARTA",
          "DINAS PENDIDIKAN",
          "SMK NEGERI 13 JAKARTA",
          "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
        ],
        alignment: "center"
      };
    }
    
    // Generate PDF using buildPDF
    const doc = await buildPDF({
      title: 'JADWAL GLOBAL',
      subtitle: 'Jadwal Pelajaran dan Kegiatan Khusus',
      reportPeriod: '',
      letterhead: letterheadConfig,
      columns: [
        { key: 'jam', label: 'Jam', align: 'center', width: 20 },
        { key: 'senin', label: 'Senin', align: 'left', width: 30 },
        { key: 'selasa', label: 'Selasa', align: 'left', width: 30 },
        { key: 'rabu', label: 'Rabu', align: 'left', width: 30 },
        { key: 'kamis', label: 'Kamis', align: 'left', width: 30 },
        { key: 'jumat', label: 'Jumat', align: 'left', width: 30 },
        { key: 'sabtu', label: 'Sabtu', align: 'left', width: 30 }
      ],
      rows: [], // Grid data akan ditambahkan manual
      orientation: 'landscape'
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="jadwal-global-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
    
    console.log(`✅ PDF export successful`);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ success: false, error: 'Export failed', message: error.message });
  }
});

// ================================================
// JADWAL SMKN 13 FORMAT EXPORT
// ================================================

// GET /api/export/jadwal-smkn13/excel - Export jadwal dalam format SMKN 13
router.get('/jadwal-smkn13/excel', async (req, res) => {
  try {
    console.log('📊 Exporting jadwal in SMKN 13 standard format...');
    
    const { kelas_id } = req.query;
    
    // Build filter conditions
    let kelasFilter = '';
    let params = [];
    
    if (kelas_id && kelas_id !== 'all') {
      kelasFilter = 'AND k.id_kelas = ?';
      params.push(parseInt(kelas_id));
    }
    
    // Fetch jadwal data grouped by kelas
    const [jadwalData] = await db.execute(`
      SELECT 
        k.id_kelas,
        k.nama_kelas,
        k.tingkat,
        j.id_jadwal,
        j.hari,
        j.jam_ke,
        j.jam_mulai,
        j.jam_selesai,
        j.mapel_id,
        m.nama_mapel,
        m.kode_mapel,
        j.guru_id,
        g.nama as nama_guru,
        g.nip,
        'jadwal' as type,
        NULL as jenis_kegiatan,
        NULL as nama_kegiatan,
        k2.ruang as ruang,
        k2.kode_ruang
      FROM kelas k
      LEFT JOIN jadwal j ON k.id_kelas = j.kelas_id AND j.status = 'aktif'
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      LEFT JOIN kelas k2 ON j.kelas_id = k2.id_kelas
      WHERE k.status = 'aktif' ${kelasFilter}
      
      UNION ALL
      
      SELECT 
        COALESCE(jk.kelas_id, 0) as id_kelas,
        COALESCE(k.nama_kelas, 'Semua Kelas') as nama_kelas,
        COALESCE(k.tingkat, '') as tingkat,
        jk.id as id_jadwal,
        jk.hari,
        NULL as jam_ke,
        jk.jam_mulai,
        jk.jam_selesai,
        NULL as mapel_id,
        NULL as nama_mapel,
        NULL as kode_mapel,
        NULL as guru_id,
        jk.guru_wali_kelas as nama_guru,
        NULL as nip,
        'jadwal_khusus' as type,
        jk.jenis_kegiatan,
        jk.nama_kegiatan,
        NULL as ruang,
        NULL as kode_ruang
      FROM jadwal_khusus jk
      LEFT JOIN kelas k ON jk.kelas_id = k.id_kelas
      WHERE jk.status = 'aktif' 
        ${kelasFilter ? 'AND (jk.kelas_id IS NULL OR jk.kelas_id = ?)' : ''}
      
      ORDER BY tingkat, nama_kelas, FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), jam_ke
    `, kelasFilter ? [...params, ...params] : []);
    
    // Group by kelas
    const kelasMap = new Map();
    
    for (const row of jadwalData) {
      const kelasId = row.id_kelas;
      
      if (!kelasMap.has(kelasId)) {
        kelasMap.set(kelasId, {
          kelas: {
            id_kelas: row.id_kelas,
            nama_kelas: row.nama_kelas,
            tingkat: row.tingkat
          },
          jadwal: []
        });
      }
      
      if (row.id_jadwal) {
        kelasMap.get(kelasId).jadwal.push(row);
      }
    }
    
    const kelasArray = Array.from(kelasMap.values()).filter(item => item.kelas.id_kelas > 0);
    
    // Fetch letterhead config
    let letterheadConfig = null;
    try {
      const [letterheadData] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_jadwal-smkn13']
      );
      
      if (letterheadData.length > 0) {
        letterheadConfig = JSON.parse(letterheadData[0].config_value);
      }
    } catch (error) {
      console.log('⚠️ No custom letterhead for jadwal-smkn13');
    }
    
    // Default letterhead
    if (!letterheadConfig) {
      letterheadConfig = {
        enabled: true,
        logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
        logoRightUrl: "/uploads/letterheads/logo-smk.png",
        lines: [
          "PEMERINTAH PROVINSI DKI JAKARTA",
          "DINAS PENDIDIKAN",
          "SMK NEGERI 13 JAKARTA",
          "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
          "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
        ],
        alignment: "center"
      };
    }
    
    // Build Excel workbook using SMKN 13 builder
    const { default: buildJadwalSMKN13Excel } = await import('../export/builders/jadwalSMKN13Builder.js');
    const workbook = await buildJadwalSMKN13Excel(kelasArray, {
      letterhead: letterheadConfig
    });
    
    // Set response headers
    const filename = `Jadwal_SMKN13_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write and send
    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Excel export successful: ${filename}`);
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Export failed', 
      message: error.message 
    });
  }
});

export default router;

