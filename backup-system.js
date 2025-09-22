/**
 * BACKUP & ARCHIVE SYSTEM
 * Phase 2: Automated Backup, Excel Export, and Archive Management
 * Target: Handle 250K+ records, Semester backup, Archive management
 */

import mysql from 'mysql2/promise';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';
import cron from 'node-cron';

class BackupSystem {
    constructor() {
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13',
            connectionLimit: 10,
            acquireTimeout: 10000
        };

        this.pool = null;
        this.backupDir = './backups';
        this.archiveDir = './archives';
        this.reportsDir = './reports';
        
        // Backup configuration
        this.backupConfig = {
            maxBackups: 10,           // Keep last 10 backups
            maxArchiveAge: 24,        // Archive data older than 24 months
            compressionEnabled: true, // Enable compression for large files
            emailNotifications: false, // Email notifications (optional)
            autoBackupSchedule: '0 2 * * 0' // Weekly backup on Sunday at 2 AM
        };
    }

    /**
     * Initialize backup system
     */
    async initialize() {
        console.log('🚀 Initializing Backup & Archive System...');
        
        try {
            // Create connection pool
            this.pool = mysql.createPool(this.dbConfig);
            
            // Create directories
            await this.createDirectories();
            
            // Setup automated backup schedule
            await this.setupAutomatedBackup();
            
            console.log('✅ Backup & Archive System initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Backup system initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create necessary directories
     */
    async createDirectories() {
        const directories = [this.backupDir, this.archiveDir, this.reportsDir];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }

    /**
     * Setup automated backup schedule
     */
    async setupAutomatedBackup() {
        console.log('⏰ Setting up automated backup schedule...');
        
        // Weekly full backup
        cron.schedule(this.backupConfig.autoBackupSchedule, async () => {
            console.log('🔄 Starting automated weekly backup...');
            try {
                await this.createSemesterBackup();
                console.log('✅ Automated backup completed');
            } catch (error) {
                console.error('❌ Automated backup failed:', error);
            }
        });
        
        // Daily archive cleanup (at 3 AM)
        cron.schedule('0 3 * * *', async () => {
            console.log('🧹 Starting daily archive cleanup...');
            try {
                await this.cleanupOldBackups();
                console.log('✅ Archive cleanup completed');
            } catch (error) {
                console.error('❌ Archive cleanup failed:', error);
            }
        });
        
        console.log('✅ Automated backup schedule configured');
    }

    /**
     * Create date-based backup
     */
    async createDateBackup(startDate, endDate) {
        console.log(`📅 Creating date-based backup from ${startDate} to ${endDate}...`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `date_backup_${timestamp}`;
        
        try {
            const backupPath = path.join(this.backupDir, `${backupId}`);
            await fs.mkdir(backupPath, { recursive: true });
            
            // 1. Database backup (SQL dump) - hanya data dalam range tanggal
            console.log('💾 Creating date-filtered database backup...');
            await this.createDateFilteredDatabaseBackup(backupPath, backupId, startDate, endDate);
            
            // 2. Excel export untuk data dalam range tanggal
            console.log('📊 Creating date-filtered Excel export...');
            await this.createDateFilteredExcelExport(backupPath, backupId, startDate, endDate);
            
            // 3. Create backup manifest
            console.log('📋 Creating backup manifest...');
            await this.createDateBackupManifest(backupPath, backupId, startDate, endDate);
            
            // 4. Compress backup if enabled
            if (this.backupConfig.compressionEnabled) {
                console.log('🗜️ Compressing backup...');
                await this.compressBackup(backupPath, backupId);
            }
            
            console.log(`✅ Date-based backup created: ${backupId}`);
            return {
                backupId,
                path: backupPath,
                startDate,
                endDate,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Date-based backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Create scheduled backup based on custom schedule
     */
    async createScheduledBackup(schedule) {
        console.log(`📅 Creating scheduled backup: ${schedule.name}`);
        
        try {
            // Create backup with schedule name as identifier
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupId = `scheduled_${schedule.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
            
            // Create backup directory
            const backupDir = path.join(this.backupDir, backupId);
            await fs.mkdir(backupDir, { recursive: true });
            
            // Create full database backup
            const dbBackupPath = path.join(backupDir, 'database_backup.sql');
            await this.createDatabaseBackup(dbBackupPath);
            
            // Create Excel reports
            const excelPath = path.join(backupDir, 'backup_report.xlsx');
            await this.createExcelReport(excelPath);
            
            // Create backup info file
            const backupInfo = {
                id: backupId,
                type: 'scheduled',
                name: schedule.name,
                created: new Date().toISOString(),
                scheduleId: schedule.id,
                files: {
                    database: 'database_backup.sql',
                    excel: 'backup_report.xlsx'
                }
            };
            
            const infoPath = path.join(backupDir, 'backup_info.json');
            await fs.writeFile(infoPath, JSON.stringify(backupInfo, null, 2));
            
            console.log(`✅ Scheduled backup created: ${backupId}`);
            return backupInfo;
            
        } catch (error) {
            console.error('❌ Error creating scheduled backup:', error);
            throw error;
        }
    }

    /**
     * Create comprehensive semester backup
     */
    async createSemesterBackup(semester = null, year = null) {
        console.log('📦 Creating semester backup...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `semester_backup_${timestamp}`;
        
        try {
            // Determine semester and year
            if (!semester || !year) {
                const now = new Date();
                year = year || now.getFullYear();
                semester = semester || (now.getMonth() < 6 ? 'Ganjil' : 'Genap');
            }
            
            const backupPath = path.join(this.backupDir, `${backupId}`);
            await fs.mkdir(backupPath, { recursive: true });
            
            // 1. Database backup (SQL dump)
            console.log('💾 Creating database backup...');
            await this.createDatabaseBackup(backupPath, backupId);
            
            // 2. Excel export for all data
            console.log('📊 Creating Excel export...');
            await this.createExcelExport(backupPath, backupId, semester, year);
            
            // 3. Archive old data
            console.log('📦 Archiving old data...');
            await this.archiveOldDataForBackup(backupPath, backupId);
            
            // 4. Create backup manifest
            console.log('📋 Creating backup manifest...');
            await this.createBackupManifest(backupPath, backupId, semester, year);
            
            // 5. Compress backup if enabled
            if (this.backupConfig.compressionEnabled) {
                console.log('🗜️ Compressing backup...');
                await this.compressBackup(backupPath, backupId);
            }
            
            console.log(`✅ Semester backup created: ${backupId}`);
            return {
                backupId,
                path: backupPath,
                semester,
                year,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Semester backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Create date-filtered database backup
     */
    async createDateFilteredDatabaseBackup(backupPath, backupId, startDate, endDate) {
        try {
            const sqlFile = path.join(backupPath, `${backupId}.sql`);
            let sqlContent = '';
            
            // Get all tables
            const [tables] = await this.pool.execute(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '${this.dbConfig.database}'
            `);
            
            sqlContent += `-- ABSENTA Date-Based Database Backup\n`;
            sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
            sqlContent += `-- Database: ${this.dbConfig.database}\n`;
            sqlContent += `-- Date Range: ${startDate} to ${endDate}\n\n`;
            
            // Export each table
            for (const table of tables) {
                const tableName = table.table_name;
                console.log(`📊 Exporting table: ${tableName}`);
                
                // Get table structure
                const [structure] = await this.pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
                sqlContent += `\n-- Table structure for table \`${tableName}\`\n`;
                sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                sqlContent += `${structure[0]['Create Table']};\n\n`;
                
                // Get table data with date filtering for attendance tables
                let query = `SELECT * FROM \`${tableName}\``;
                let queryParams = [];
                
                // Apply date filtering for attendance tables
                if (tableName === 'absensi_siswa' || tableName === 'absensi_guru') {
                    query += ` WHERE tanggal BETWEEN ? AND ?`;
                    queryParams = [startDate, endDate];
                }
                
                const [data] = await this.pool.execute(query, queryParams);
                
                if (data.length > 0) {
                    sqlContent += `-- Data for table \`${tableName}\` (${data.length} records)\n`;
                    
                    // Get column names
                    const columns = Object.keys(data[0]);
                    const columnList = columns.map(col => `\`${col}\``).join(', ');
                    
                    // Insert data in batches
                    const batchSize = 1000;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const batch = data.slice(i, i + batchSize);
                        const values = batch.map(row => {
                            const rowValues = columns.map(col => {
                                const value = row[col];
                                if (value === null) return 'NULL';
                                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                                if (value instanceof Date) {
                                    if (isNaN(value.getTime())) {
                                        return 'NULL';
                                    }
                                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                }
                                return value;
                            });
                            return `(${rowValues.join(', ')})`;
                        });
                        
                        sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
                        sqlContent += values.join(',\n') + ';\n\n';
                    }
                } else {
                    sqlContent += `-- No data found for table \`${tableName}\` in date range\n\n`;
                }
            }
            
            // Write SQL file
            await fs.writeFile(sqlFile, sqlContent, 'utf8');
            console.log(`✅ Date-filtered database backup created: ${sqlFile}`);
            
        } catch (error) {
            console.error('❌ Date-filtered database backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Create database backup using Node.js (alternative to mysqldump)
     */
    async createDatabaseBackup(backupPath, backupId) {
        try {
            const sqlFile = path.join(backupPath, `${backupId}.sql`);
            let sqlContent = '';
            
            // Get all tables
            const [tables] = await this.pool.execute(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '${this.dbConfig.database}'
            `);
            
            sqlContent += `-- ABSENTA Database Backup\n`;
            sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
            sqlContent += `-- Database: ${this.dbConfig.database}\n\n`;
            
            // Export each table
            for (const table of tables) {
                const tableName = table.table_name;
                console.log(`📊 Exporting table: ${tableName}`);
                
                // Get table structure
                const [structure] = await this.pool.execute(`SHOW CREATE TABLE \`${tableName}\``);
                sqlContent += `\n-- Table structure for table \`${tableName}\`\n`;
                sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
                sqlContent += `${structure[0]['Create Table']};\n\n`;
                
                // Get table data
                const [data] = await this.pool.execute(`SELECT * FROM \`${tableName}\``);
                
                if (data.length > 0) {
                    sqlContent += `-- Data for table \`${tableName}\`\n`;
                    
                    // Get column names
                    const columns = Object.keys(data[0]);
                    const columnList = columns.map(col => `\`${col}\``).join(', ');
                    
                    // Insert data in batches
                    const batchSize = 1000;
                    for (let i = 0; i < data.length; i += batchSize) {
                        const batch = data.slice(i, i + batchSize);
                        const values = batch.map(row => {
                            const rowValues = columns.map(col => {
                                const value = row[col];
                                if (value === null) return 'NULL';
                                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                                if (value instanceof Date) {
                                    // Check if date is valid
                                    if (isNaN(value.getTime())) {
                                        return 'NULL';
                                    }
                                    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                                }
                                return value;
                            });
                            return `(${rowValues.join(', ')})`;
                        });
                        
                        sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
                        sqlContent += values.join(',\n') + ';\n\n';
                    }
                }
            }
            
            // Write SQL file
            await fs.writeFile(sqlFile, sqlContent, 'utf8');
            console.log(`✅ Database backup created: ${sqlFile}`);
            
        } catch (error) {
            console.error('❌ Database backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Create date-filtered Excel export
     */
    async createDateFilteredExcelExport(backupPath, backupId, startDate, endDate) {
        const workbook = new ExcelJS.Workbook();
        
        // Set workbook properties
        workbook.creator = 'ABSENTA Date-Based Backup System';
        workbook.lastModifiedBy = 'ABSENTA Admin';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        try {
            // 1. Student Attendance Sheet (date-filtered)
            console.log('📊 Exporting date-filtered student attendance...');
            await this.exportDateFilteredStudentAttendance(workbook, startDate, endDate);
            
            // 2. Teacher Attendance Sheet (date-filtered)
            console.log('📊 Exporting date-filtered teacher attendance...');
            await this.exportDateFilteredTeacherAttendance(workbook, startDate, endDate);
            
            // 3. Permission Requests Sheet (date-filtered)
            console.log('📊 Exporting date-filtered permission requests...');
            await this.exportDateFilteredPermissionRequests(workbook, startDate, endDate);
            
            // 4. Date Range Analytics Summary
            console.log('📊 Creating date range analytics summary...');
            await this.createDateRangeAnalyticsSummary(workbook, startDate, endDate);
            
            // 5. System Configuration Sheet
            console.log('📊 Exporting system configuration...');
            await this.exportSystemConfiguration(workbook);
            
            // Save Excel file
            const excelFile = path.join(backupPath, `${backupId}_export.xlsx`);
            await workbook.xlsx.writeFile(excelFile);
            
            console.log(`✅ Date-filtered Excel export created: ${excelFile}`);
            
        } catch (error) {
            console.error('❌ Date-filtered Excel export failed:', error);
            throw error;
        }
    }

    /**
     * Create comprehensive Excel export
     */
    async createExcelExport(backupPath, backupId, semester, year) {
        const workbook = new ExcelJS.Workbook();
        
        // Set workbook properties
        workbook.creator = 'ABSENTA Backup System';
        workbook.lastModifiedBy = 'ABSENTA Admin';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        try {
            // 1. Student Attendance Sheet
            console.log('📊 Exporting student attendance...');
            await this.exportStudentAttendance(workbook, semester, year);
            
            // 2. Teacher Attendance Sheet
            console.log('📊 Exporting teacher attendance...');
            await this.exportTeacherAttendance(workbook, semester, year);
            
            // 3. Permission Requests Sheet
            console.log('📊 Exporting permission requests...');
            await this.exportPermissionRequests(workbook, semester, year);
            
            // 4. Analytics Summary Sheet
            console.log('📊 Creating analytics summary...');
            await this.createAnalyticsSummary(workbook, semester, year);
            
            // 5. System Configuration Sheet
            console.log('📊 Exporting system configuration...');
            await this.exportSystemConfiguration(workbook);
            
            // Save Excel file
            const excelFile = path.join(backupPath, `${backupId}_export.xlsx`);
            await workbook.xlsx.writeFile(excelFile);
            
            console.log(`✅ Excel export created: ${excelFile}`);
            
        } catch (error) {
            console.error('❌ Excel export failed:', error);
            throw error;
        }
    }

    /**
     * Export student attendance data
     */
    async exportStudentAttendance(workbook, semester, year) {
        const worksheet = workbook.addWorksheet('Student Attendance');
        
        // Get date range for semester
        const dateRange = this.getSemesterDateRange(semester, year);
        
        const query = `
            SELECT 
                a.tanggal,
                s.nis,
                s.nama as nama_siswa,
                k.nama_kelas,
                a.status,
                a.keterangan,
                a.waktu_absen,
                g.nama as nama_guru,
                mp.nama_mapel
            FROM absensi_siswa a
            JOIN siswa s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN guru g ON a.guru_id = g.id_guru
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mata_pelajaran mp ON j.mapel_id = mp.id
            WHERE a.tanggal BETWEEN ? AND ?
            ORDER BY a.tanggal DESC, s.nama ASC
        `;
        
        const [rows] = await this.pool.execute(query, [dateRange.start, dateRange.end]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 12 },
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Waktu Absen', key: 'waktu_absen', width: 20 },
            { header: 'Guru', key: 'nama_guru', width: 20 },
            { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, 'Student Attendance Data');
        
        console.log(`✅ Exported ${rows.length} student attendance records`);
    }

    /**
     * Export teacher attendance data
     */
    async exportTeacherAttendance(workbook, semester, year) {
        const worksheet = workbook.addWorksheet('Teacher Attendance');
        
        const dateRange = this.getSemesterDateRange(semester, year);
        
        const query = `
            SELECT 
                a.tanggal,
                a.jam_ke,
                g.nama as nama_guru,
                k.nama_kelas,
                a.status,
                a.keterangan,
                a.waktu_catat,
                mp.nama_mapel
            FROM absensi_guru a
            JOIN guru g ON a.guru_id = g.id_guru
            JOIN kelas k ON a.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mata_pelajaran mp ON j.mapel_id = mp.id
            WHERE a.tanggal BETWEEN ? AND ?
            ORDER BY a.tanggal DESC, a.jam_ke ASC
        `;
        
        const [rows] = await this.pool.execute(query, [dateRange.start, dateRange.end]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 12 },
            { header: 'Jam Ke', key: 'jam_ke', width: 8 },
            { header: 'Nama Guru', key: 'nama_guru', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Waktu Catat', key: 'waktu_catat', width: 20 },
            { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, 'Teacher Attendance Data');
        
        console.log(`✅ Exported ${rows.length} teacher attendance records`);
    }

    /**
     * Export permission requests
     */
    async exportPermissionRequests(workbook, semester, year) {
        const worksheet = workbook.addWorksheet('Permission Requests');
        
        const dateRange = this.getSemesterDateRange(semester, year);
        
        const query = `
            SELECT 
                p.tanggal_pengajuan,
                s.nis,
                s.nama as nama_siswa,
                k.nama_kelas,
                p.tanggal_izin,
                p.alasan,
                p.status,
                p.keterangan_guru,
                p.tanggal_respon,
                g.nama as nama_guru_approve
            FROM pengajuan_izin_siswa p
            JOIN siswa s ON p.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN guru g ON p.guru_id = g.id_guru
            WHERE p.tanggal_pengajuan BETWEEN ? AND ?
            ORDER BY p.tanggal_pengajuan DESC
        `;
        
        const [rows] = await this.pool.execute(query, [dateRange.start, dateRange.end]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal Pengajuan', key: 'tanggal_pengajuan', width: 15 },
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Tanggal Izin', key: 'tanggal_izin', width: 15 },
            { header: 'Alasan', key: 'alasan', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan Guru', key: 'keterangan_guru', width: 30 },
            { header: 'Tanggal Respon', key: 'tanggal_respon', width: 15 },
            { header: 'Guru Approve', key: 'nama_guru_approve', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, 'Permission Requests Data');
        
        console.log(`✅ Exported ${rows.length} permission request records`);
    }

    /**
     * Export date-filtered student attendance data
     */
    async exportDateFilteredStudentAttendance(workbook, startDate, endDate) {
        const worksheet = workbook.addWorksheet('Student Attendance (Date Range)');
        
        const query = `
            SELECT 
                a.tanggal,
                s.nis,
                s.nama as nama_siswa,
                k.nama_kelas,
                a.status,
                a.keterangan,
                a.waktu_absen,
                g.nama as nama_guru,
                mp.nama_mapel
            FROM absensi_siswa a
            JOIN siswa s ON a.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN guru g ON a.guru_id = g.id_guru
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mata_pelajaran mp ON j.mapel_id = mp.id
            WHERE a.tanggal BETWEEN ? AND ?
            ORDER BY a.tanggal DESC, s.nama ASC
        `;
        
        const [rows] = await this.pool.execute(query, [startDate, endDate]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 12 },
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Waktu Absen', key: 'waktu_absen', width: 20 },
            { header: 'Guru', key: 'nama_guru', width: 20 },
            { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, `Student Attendance Data (${startDate} to ${endDate})`);
        
        console.log(`✅ Exported ${rows.length} date-filtered student attendance records`);
    }

    /**
     * Export date-filtered teacher attendance data
     */
    async exportDateFilteredTeacherAttendance(workbook, startDate, endDate) {
        const worksheet = workbook.addWorksheet('Teacher Attendance (Date Range)');
        
        const query = `
            SELECT 
                a.tanggal,
                a.jam_ke,
                g.nama as nama_guru,
                k.nama_kelas,
                a.status,
                a.keterangan,
                a.waktu_catat,
                mp.nama_mapel
            FROM absensi_guru a
            JOIN guru g ON a.guru_id = g.id_guru
            JOIN kelas k ON a.kelas_id = k.id_kelas
            LEFT JOIN jadwal j ON a.jadwal_id = j.id_jadwal
            LEFT JOIN mata_pelajaran mp ON j.mapel_id = mp.id
            WHERE a.tanggal BETWEEN ? AND ?
            ORDER BY a.tanggal DESC, a.jam_ke ASC
        `;
        
        const [rows] = await this.pool.execute(query, [startDate, endDate]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 12 },
            { header: 'Jam Ke', key: 'jam_ke', width: 8 },
            { header: 'Nama Guru', key: 'nama_guru', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Waktu Catat', key: 'waktu_catat', width: 20 },
            { header: 'Mata Pelajaran', key: 'nama_mapel', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, `Teacher Attendance Data (${startDate} to ${endDate})`);
        
        console.log(`✅ Exported ${rows.length} date-filtered teacher attendance records`);
    }

    /**
     * Export date-filtered permission requests
     */
    async exportDateFilteredPermissionRequests(workbook, startDate, endDate) {
        const worksheet = workbook.addWorksheet('Permission Requests (Date Range)');
        
        const query = `
            SELECT 
                p.tanggal_pengajuan,
                s.nis,
                s.nama as nama_siswa,
                k.nama_kelas,
                p.tanggal_izin,
                p.alasan,
                p.status,
                p.keterangan_guru,
                p.tanggal_respon,
                g.nama as nama_guru_approve
            FROM pengajuan_izin_siswa p
            JOIN siswa s ON p.siswa_id = s.id_siswa
            JOIN kelas k ON s.kelas_id = k.id_kelas
            LEFT JOIN guru g ON p.guru_id = g.id_guru
            WHERE p.tanggal_pengajuan BETWEEN ? AND ?
            ORDER BY p.tanggal_pengajuan DESC
        `;
        
        const [rows] = await this.pool.execute(query, [startDate, endDate]);
        
        // Add headers
        worksheet.columns = [
            { header: 'Tanggal Pengajuan', key: 'tanggal_pengajuan', width: 15 },
            { header: 'NIS', key: 'nis', width: 15 },
            { header: 'Nama Siswa', key: 'nama_siswa', width: 25 },
            { header: 'Kelas', key: 'nama_kelas', width: 15 },
            { header: 'Tanggal Izin', key: 'tanggal_izin', width: 15 },
            { header: 'Alasan', key: 'alasan', width: 30 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Keterangan Guru', key: 'keterangan_guru', width: 30 },
            { header: 'Tanggal Respon', key: 'tanggal_respon', width: 15 },
            { header: 'Guru Approve', key: 'nama_guru_approve', width: 20 }
        ];
        
        // Add data
        rows.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        this.styleWorksheet(worksheet, `Permission Requests Data (${startDate} to ${endDate})`);
        
        console.log(`✅ Exported ${rows.length} date-filtered permission request records`);
    }

    /**
     * Create date range analytics summary
     */
    async createDateRangeAnalyticsSummary(workbook, startDate, endDate) {
        const worksheet = workbook.addWorksheet('Date Range Analytics');
        
        // Get various analytics for the date range
        const [totalStudents] = await this.pool.execute('SELECT COUNT(*) as count FROM siswa WHERE status = "aktif"');
        const [totalTeachers] = await this.pool.execute('SELECT COUNT(*) as count FROM guru WHERE status = "aktif"');
        const [totalClasses] = await this.pool.execute('SELECT COUNT(*) as count FROM kelas WHERE status = "aktif"');
        
        const [attendanceStats] = await this.pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM absensi_siswa 
            WHERE tanggal BETWEEN ? AND ?
            GROUP BY status
        `, [startDate, endDate]);
        
        const [teacherAttendanceStats] = await this.pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM absensi_guru 
            WHERE tanggal BETWEEN ? AND ?
            GROUP BY status
        `, [startDate, endDate]);
        
        // Calculate date range info
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
        
        // Add summary data
        worksheet.addRow(['DATE RANGE BACKUP SUMMARY', '']);
        worksheet.addRow(['Start Date', startDate]);
        worksheet.addRow(['End Date', endDate]);
        worksheet.addRow(['Total Days', daysDiff]);
        worksheet.addRow(['Backup Date', new Date().toISOString()]);
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['SYSTEM STATISTICS', '']);
        worksheet.addRow(['Total Active Students', totalStudents[0].count]);
        worksheet.addRow(['Total Active Teachers', totalTeachers[0].count]);
        worksheet.addRow(['Total Active Classes', totalClasses[0].count]);
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['STUDENT ATTENDANCE STATISTICS (Date Range)', '']);
        attendanceStats.forEach(stat => {
            worksheet.addRow([stat.status, stat.count]);
        });
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['TEACHER ATTENDANCE STATISTICS (Date Range)', '']);
        teacherAttendanceStats.forEach(stat => {
            worksheet.addRow([stat.status, stat.count]);
        });
        
        // Style the summary
        this.styleWorksheet(worksheet, `Date Range Analytics (${startDate} to ${endDate})`);
        
        console.log('✅ Date range analytics summary created');
    }

    /**
     * Create analytics summary
     */
    async createAnalyticsSummary(workbook, semester, year) {
        const worksheet = workbook.addWorksheet('Analytics Summary');
        
        const dateRange = this.getSemesterDateRange(semester, year);
        
        // Get various analytics
        const [totalStudents] = await this.pool.execute('SELECT COUNT(*) as count FROM siswa WHERE status = "aktif"');
        const [totalTeachers] = await this.pool.execute('SELECT COUNT(*) as count FROM guru WHERE status = "aktif"');
        const [totalClasses] = await this.pool.execute('SELECT COUNT(*) as count FROM kelas WHERE status = "aktif"');
        
        const [attendanceStats] = await this.pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM absensi_siswa 
            WHERE tanggal BETWEEN ? AND ?
            GROUP BY status
        `, [dateRange.start, dateRange.end]);
        
        const [teacherAttendanceStats] = await this.pool.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM absensi_guru 
            WHERE tanggal BETWEEN ? AND ?
            GROUP BY status
        `, [dateRange.start, dateRange.end]);
        
        // Add summary data
        worksheet.addRow(['SEMESTER BACKUP SUMMARY', '']);
        worksheet.addRow(['Semester', semester]);
        worksheet.addRow(['Year', year]);
        worksheet.addRow(['Date Range', `${dateRange.start} to ${dateRange.end}`]);
        worksheet.addRow(['Backup Date', new Date().toISOString()]);
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['SYSTEM STATISTICS', '']);
        worksheet.addRow(['Total Active Students', totalStudents[0].count]);
        worksheet.addRow(['Total Active Teachers', totalTeachers[0].count]);
        worksheet.addRow(['Total Active Classes', totalClasses[0].count]);
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['STUDENT ATTENDANCE STATISTICS', '']);
        attendanceStats.forEach(stat => {
            worksheet.addRow([stat.status, stat.count]);
        });
        worksheet.addRow(['', '']);
        
        worksheet.addRow(['TEACHER ATTENDANCE STATISTICS', '']);
        teacherAttendanceStats.forEach(stat => {
            worksheet.addRow([stat.status, stat.count]);
        });
        
        // Style the summary
        this.styleWorksheet(worksheet, 'Analytics Summary');
        
        console.log('✅ Analytics summary created');
    }

    /**
     * Export system configuration
     */
    async exportSystemConfiguration(workbook) {
        const worksheet = workbook.addWorksheet('System Configuration');
        
        // Get system tables
        const [users] = await this.pool.execute('SELECT username, role, status, created_at FROM users');
        const [classes] = await this.pool.execute('SELECT nama_kelas, status FROM kelas');
        const [subjects] = await this.pool.execute('SELECT nama_mapel, kode_mapel FROM mata_pelajaran');
        
        // Add users
        worksheet.addRow(['SYSTEM USERS', '']);
        worksheet.addRow(['Username', 'Role', 'Status', 'Created At']);
        users.forEach(user => {
            worksheet.addRow([user.username, user.role, user.status, user.created_at]);
        });
        
        worksheet.addRow(['', '']);
        worksheet.addRow(['CLASSES', '']);
        worksheet.addRow(['Class Name', 'Status']);
        classes.forEach(cls => {
            worksheet.addRow([cls.nama_kelas, cls.status]);
        });
        
        worksheet.addRow(['', '']);
        worksheet.addRow(['SUBJECTS', '']);
        worksheet.addRow(['Subject Name', 'Code']);
        subjects.forEach(subject => {
            worksheet.addRow([subject.nama_mapel, subject.kode_mapel]);
        });
        
        // Style the configuration
        this.styleWorksheet(worksheet, 'System Configuration');
        
        console.log('✅ System configuration exported');
    }

    /**
     * Archive old data (for backup process)
     */
    async archiveOldDataForBackup(backupPath, backupId) {
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() - this.backupConfig.maxArchiveAge);
        const archiveDateStr = archiveDate.toISOString().split('T')[0];
        
        try {
            // Archive old student attendance
            const [studentArchiveResult] = await this.pool.execute(`
                INSERT IGNORE INTO absensi_siswa_archive 
                SELECT *, NOW() as archived_at 
                FROM absensi_siswa 
                WHERE tanggal < ?
            `, [archiveDateStr]);
            
            // Archive old teacher attendance
            const [teacherArchiveResult] = await this.pool.execute(`
                INSERT IGNORE INTO absensi_guru_archive 
                SELECT *, NOW() as archived_at 
                FROM absensi_guru 
                WHERE tanggal < ?
            `, [archiveDateStr]);
            
            // Create archive report
            const archiveReport = {
                backupId,
                archiveDate: archiveDateStr,
                studentRecordsArchived: studentArchiveResult.affectedRows,
                teacherRecordsArchived: teacherArchiveResult.affectedRows,
                timestamp: new Date().toISOString()
            };
            
            const reportFile = path.join(backupPath, `${backupId}_archive_report.json`);
            await fs.writeFile(reportFile, JSON.stringify(archiveReport, null, 2));
            
            console.log(`✅ Archived ${studentArchiveResult.affectedRows} student records`);
            console.log(`✅ Archived ${teacherArchiveResult.affectedRows} teacher records`);
            
        } catch (error) {
            console.error('❌ Data archiving failed:', error);
            throw error;
        }
    }

    /**
     * Create archive tables if they don't exist
     */
    async createArchiveTables() {
        try {
            // Create student archive table
            await this.pool.execute(`
                CREATE TABLE IF NOT EXISTS absensi_siswa_archive (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    siswa_id INT,
                    jadwal_id INT,
                    tanggal DATE,
                    status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen') DEFAULT 'Alpa',
                    keterangan TEXT,
                    waktu_absen DATETIME,
                    guru_id INT,
                    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_siswa_id (siswa_id),
                    INDEX idx_jadwal_id (jadwal_id),
                    INDEX idx_tanggal (tanggal),
                    INDEX idx_archived_at (archived_at)
                )
            `);
            
            // Create teacher archive table
            await this.pool.execute(`
                CREATE TABLE IF NOT EXISTS absensi_guru_archive (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    guru_id INT,
                    jadwal_id INT,
                    tanggal DATE,
                    status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa', 'Dispen') DEFAULT 'Alpa',
                    keterangan TEXT,
                    waktu_absen DATETIME,
                    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_guru_id (guru_id),
                    INDEX idx_jadwal_id (jadwal_id),
                    INDEX idx_tanggal (tanggal),
                    INDEX idx_archived_at (archived_at)
                )
            `);
            
            console.log('✅ Archive tables created/verified');
        } catch (error) {
            console.error('❌ Error creating archive tables:', error);
            throw error;
        }
    }

    /**
     * Archive old data (standalone method for API)
     */
    async archiveOldData(monthsOld = null) {
        const archiveAge = monthsOld || this.backupConfig.maxArchiveAge;
        const archiveDate = new Date();
        archiveDate.setMonth(archiveDate.getMonth() - archiveAge);
        const archiveDateStr = archiveDate.toISOString().split('T')[0];
        
        console.log(`📦 Archiving data older than ${archiveAge} months (before ${archiveDateStr})...`);
        
        try {
            // Create archive tables if they don't exist
            await this.createArchiveTables();
            
                // First, archive old records (ignore duplicates)
                const [studentArchiveResult] = await this.pool.execute(`
                    INSERT IGNORE INTO absensi_siswa_archive 
                    SELECT *, NOW() as archived_at 
                    FROM absensi_siswa 
                    WHERE tanggal < ?
                `, [archiveDateStr]);
            
            const [teacherArchiveResult] = await this.pool.execute(`
                INSERT IGNORE INTO absensi_guru_archive 
                SELECT *, NOW() as archived_at 
                FROM absensi_guru 
                WHERE tanggal < ?
            `, [archiveDateStr]);
            
            // Delete archived records from main tables
            const [studentDeleteResult] = await this.pool.execute(`
                DELETE FROM absensi_siswa 
                WHERE tanggal < ?
            `, [archiveDateStr]);
            
            const [teacherDeleteResult] = await this.pool.execute(`
                DELETE FROM absensi_guru 
                WHERE tanggal < ?
            `, [archiveDateStr]);
            
            const result = {
                archiveDate: archiveDateStr,
                monthsOld: archiveAge,
                studentRecordsArchived: studentArchiveResult.affectedRows,
                teacherRecordsArchived: teacherArchiveResult.affectedRows,
                studentRecordsDeleted: studentDeleteResult.affectedRows,
                teacherRecordsDeleted: teacherDeleteResult.affectedRows,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Archived ${studentArchiveResult.affectedRows} student records`);
            console.log(`✅ Archived ${teacherArchiveResult.affectedRows} teacher records`);
            console.log(`✅ Deleted ${studentDeleteResult.affectedRows} old student records`);
            console.log(`✅ Deleted ${teacherDeleteResult.affectedRows} old teacher records`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Data archiving failed:', error);
            throw error;
        }
    }

    /**
     * Create date-based backup manifest
     */
    async createDateBackupManifest(backupPath, backupId, startDate, endDate) {
        const manifest = {
            backupId,
            type: 'date-based',
            startDate,
            endDate,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            system: 'ABSENTA',
            files: [
                `${backupId}.sql`,
                `${backupId}_export.xlsx`,
                `${backupId}_manifest.json`
            ],
            statistics: await this.getDateBackupStatistics(startDate, endDate),
            checksums: await this.calculateChecksums(backupPath, backupId)
        };
        
        const manifestFile = path.join(backupPath, `${backupId}_manifest.json`);
        await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
        
        console.log(`✅ Date-based backup manifest created: ${manifestFile}`);
    }

    /**
     * Get date-based backup statistics
     */
    async getDateBackupStatistics(startDate, endDate) {
        const [studentCount] = await this.pool.execute(`
            SELECT COUNT(*) as count FROM absensi_siswa 
            WHERE tanggal BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const [teacherCount] = await this.pool.execute(`
            SELECT COUNT(*) as count FROM absensi_guru 
            WHERE tanggal BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const [permissionCount] = await this.pool.execute(`
            SELECT COUNT(*) as count FROM pengajuan_izin_siswa 
            WHERE tanggal_pengajuan BETWEEN ? AND ?
        `, [startDate, endDate]);
        
        const [userCount] = await this.pool.execute('SELECT COUNT(*) as count FROM users');
        const [classCount] = await this.pool.execute('SELECT COUNT(*) as count FROM kelas');
        
        return {
            dateRange: {
                startDate,
                endDate,
                days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
            },
            studentAttendanceRecords: studentCount[0].count,
            teacherAttendanceRecords: teacherCount[0].count,
            permissionRequests: permissionCount[0].count,
            totalUsers: userCount[0].count,
            totalClasses: classCount[0].count,
            databaseSize: await this.getDatabaseSize()
        };
    }

    /**
     * Create backup manifest
     */
    async createBackupManifest(backupPath, backupId, semester, year) {
        const manifest = {
            backupId,
            semester,
            year,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            system: 'ABSENTA',
            files: [
                `${backupId}.sql`,
                `${backupId}_export.xlsx`,
                `${backupId}_archive_report.json`,
                `${backupId}_manifest.json`
            ],
            statistics: await this.getBackupStatistics(),
            checksums: await this.calculateChecksums(backupPath, backupId)
        };
        
        const manifestFile = path.join(backupPath, `${backupId}_manifest.json`);
        await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
        
        console.log(`✅ Backup manifest created: ${manifestFile}`);
    }

    /**
     * Get backup statistics
     */
    async getBackupStatistics() {
        const [studentCount] = await this.pool.execute('SELECT COUNT(*) as count FROM absensi_siswa');
        const [teacherCount] = await this.pool.execute('SELECT COUNT(*) as count FROM absensi_guru');
        const [userCount] = await this.pool.execute('SELECT COUNT(*) as count FROM users');
        const [classCount] = await this.pool.execute('SELECT COUNT(*) as count FROM kelas');
        
        return {
            studentAttendanceRecords: studentCount[0].count,
            teacherAttendanceRecords: teacherCount[0].count,
            totalUsers: userCount[0].count,
            totalClasses: classCount[0].count,
            databaseSize: await this.getDatabaseSize()
        };
    }

    /**
     * Get database size
     */
    async getDatabaseSize() {
        const [result] = await this.pool.execute(`
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
            FROM information_schema.tables 
            WHERE table_schema = 'absenta13'
        `);
        
        return result[0]['Size (MB)'] || 0;
    }

    /**
     * Calculate file checksums
     */
    async calculateChecksums(backupPath, backupId) {
        const crypto = await import('crypto');
        const checksums = {};
        
        const files = [
            `${backupId}.sql`,
            `${backupId}_export.xlsx`,
            `${backupId}_archive_report.json`
        ];
        
        for (const file of files) {
            try {
                const filePath = path.join(backupPath, file);
                const data = await fs.readFile(filePath);
                const hash = crypto.createHash('sha256').update(data).digest('hex');
                checksums[file] = hash;
            } catch (error) {
                console.warn(`⚠️ Could not calculate checksum for ${file}:`, error.message);
            }
        }
        
        return checksums;
    }

    /**
     * Compress backup directory
     */
    async compressBackup(backupPath, backupId) {
        try {
            const { default: archiver } = await import('archiver');
            const output = createWriteStream(path.join(this.backupDir, `${backupId}.zip`));
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            return new Promise((resolve, reject) => {
                output.on('close', () => {
                    console.log(`✅ Backup compressed: ${archive.pointer()} bytes`);
                    resolve();
                });
                
                archive.on('error', (err) => {
                    reject(err);
                });
                
                archive.pipe(output);
                archive.directory(backupPath, false);
                archive.finalize();
            });
        } catch (error) {
            console.warn('⚠️ Compression failed, backup will remain uncompressed:', error.message);
            // Don't throw error, just continue without compression
        }
    }

    /**
     * Cleanup old backups
     */
    async cleanupOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(file => file.startsWith('semester_backup_'));
            
            if (backupFiles.length > this.backupConfig.maxBackups) {
                // Sort by creation time and remove oldest
                const sortedFiles = await Promise.all(
                    backupFiles.map(async (file) => {
                        const filePath = path.join(this.backupDir, file);
                        const stats = await fs.stat(filePath);
                        return { file, mtime: stats.mtime };
                    })
                );
                
                sortedFiles.sort((a, b) => a.mtime - b.mtime);
                
                const filesToDelete = sortedFiles.slice(0, sortedFiles.length - this.backupConfig.maxBackups);
                
                for (const fileInfo of filesToDelete) {
                    const filePath = path.join(this.backupDir, fileInfo.file);
                    await fs.unlink(filePath);
                    console.log(`🗑️ Deleted old backup: ${fileInfo.file}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Backup cleanup failed:', error);
        }
    }

    /**
     * Get semester date range
     */
    getSemesterDateRange(semester, year) {
        let startDate, endDate;
        
        if (semester === 'Ganjil') {
            startDate = `${year}-07-01`;
            endDate = `${year}-12-31`;
        } else {
            startDate = `${year}-01-01`;
            endDate = `${year}-06-30`;
        }
        
        return { start: startDate, end: endDate };
    }

    /**
     * Style worksheet
     */
    styleWorksheet(worksheet, title) {
        // Style headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        
        // Add title
        worksheet.insertRow(1, [title]);
        const titleRow = worksheet.getRow(1);
        titleRow.font = { bold: true, size: 14 };
        titleRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            if (column.width < 15) column.width = 15;
        });
    }

    /**
     * List available backups
     */
    async listBackups() {
        try {
            // Check if backup directory exists
            try {
                await fs.access(this.backupDir);
            } catch (error) {
                // Directory doesn't exist, create it
                await fs.mkdir(this.backupDir, { recursive: true });
                return []; // Return empty array if no backups exist yet
            }
            
            const files = await fs.readdir(this.backupDir);
            const backups = [];
            
            for (const file of files) {
                if ((file.startsWith('semester_backup_') || file.startsWith('date_backup_')) && file.endsWith('.zip')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = await fs.stat(filePath);
                    
                    // Determine backup type
                    const backupType = file.startsWith('semester_backup_') ? 'semester' : 'date';
                    
                    backups.push({
                        id: file.replace('.zip', ''),
                        filename: file,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        type: backupType
                    });
                }
            }
            
            return backups.sort((a, b) => b.created - a.created);
            
        } catch (error) {
            console.error('❌ Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId) {
        console.log(`🔄 Restoring from backup: ${backupId}`);
        
        try {
            // First try to find SQL file in uncompressed folder
            const folderPath = path.join(this.backupDir, backupId);
            const sqlFile = path.join(folderPath, `${backupId}.sql`);
            
            let sqlFilePath = null;
            
            // Check if uncompressed folder exists
            try {
                await fs.access(sqlFile);
                sqlFilePath = sqlFile;
                console.log('📁 Found SQL file in uncompressed folder');
            } catch (error) {
                console.log('📁 SQL file not found in uncompressed folder, trying zip file...');
                
                // Try zip file
                const zipFile = path.join(this.backupDir, `${backupId}.zip`);
                try {
                    await fs.access(zipFile);
                    console.log('📦 Found zip file, extracting...');
                    
                    const extractPath = path.join(this.backupDir, `${backupId}_temp`);
                    const { default: extract } = await import('extract-zip');
                    await extract(zipFile, { dir: extractPath });
                    
                    const extractedSqlFile = path.join(extractPath, `${backupId}.sql`);
                    await fs.access(extractedSqlFile);
                    sqlFilePath = extractedSqlFile;
                    console.log('✅ Successfully extracted SQL file from zip');
                    
                } catch (zipError) {
                    throw new Error(`Backup file not found: ${backupId}. Neither folder nor zip file exists.`);
                }
            }
            
            if (!sqlFilePath) {
                throw new Error('SQL file not found in backup');
            }
            
            // Restore database
            await this.restoreDatabase(sqlFilePath);
            
            // Clean up temp directory if it was created
            if (sqlFilePath.includes('_temp')) {
                const extractPath = path.dirname(sqlFilePath);
                await fs.rm(extractPath, { recursive: true, force: true });
                console.log('🧹 Cleaned up temporary extraction directory');
            }
            
            console.log(`✅ Successfully restored from backup: ${backupId}`);
            return { success: true, message: 'Backup restored successfully' };
            
        } catch (error) {
            console.error('❌ Backup restoration failed:', error);
            throw error;
        }
    }

    /**
     * Restore database from SQL file
     */
    async restoreDatabase(sqlFile) {
        try {
            console.log(`🔄 Restoring database from: ${sqlFile}`);
            
            // Read SQL file content
            const sqlContent = await fs.readFile(sqlFile, 'utf8');
            
            // Split SQL content into individual statements
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            console.log(`📝 Found ${statements.length} SQL statements to execute`);
            
            // Execute each statement
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        await this.pool.execute(statement);
                        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
                    } catch (error) {
                        console.warn(`⚠️ Warning: Failed to execute statement ${i + 1}:`, error.message);
                        // Continue with other statements
                    }
                }
            }
            
            console.log('✅ Database restoration completed successfully');
            
        } catch (error) {
            console.error('❌ Database restoration failed:', error);
            throw error;
        }
    }

    /**
     * Delete backup
     */
    async deleteBackup(backupId) {
        console.log(`🗑️ Deleting backup: ${backupId}`);
        
        try {
            const backupPath = path.join(this.backupDir, `${backupId}.zip`);
            
            // Check if backup exists
            try {
                await fs.access(backupPath);
            } catch (error) {
                throw new Error(`Backup file not found: ${backupPath}`);
            }
            
            // Delete backup file
            await fs.unlink(backupPath);
            
            console.log(`✅ Successfully deleted backup: ${backupId}`);
            return { success: true, message: 'Backup deleted successfully' };
            
        } catch (error) {
            console.error('❌ Backup deletion failed:', error);
            throw error;
        }
    }

    /**
     * Close connection pool
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Backup system connection pool closed');
        }
    }
}

// Export for use in other modules
export default BackupSystem;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const backupSystem = new BackupSystem();
    
    try {
        await backupSystem.initialize();
        
        // Create a test backup
        const result = await backupSystem.createSemesterBackup('Ganjil', 2025);
        console.log('🎉 Backup created successfully:', result);
        
        // List backups
        const backups = await backupSystem.listBackups();
        console.log('📋 Available backups:', backups);
        
        await backupSystem.close();
        process.exit(0);
    } catch (error) {
        console.error('💥 Backup system failed:', error);
        process.exit(1);
    }
}
