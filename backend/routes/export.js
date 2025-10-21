/**
 * Export Routes
 * Handles report export to Excel with letterhead integration
 */

import express from 'express';
import { db } from '../../db.js';
import { buildExcel } from '../export/excelBuilder.js';
import teacherSummarySchema from '../export/schemas/teacher-summary.js';
import studentSummarySchema from '../export/schemas/student-summary.js';

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

export default router;

