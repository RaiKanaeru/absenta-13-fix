/**
 * QUEUE SYSTEM FOR DOWNLOADS
 * Phase 3: Redis & Bull Queue for handling concurrent Excel downloads
 * Target: Handle 80 concurrent downloads, Priority system, Background processing
 */

import Queue from 'bull';
import Redis from 'ioredis';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';

class DownloadQueue {
    constructor() {
        // Redis configuration
        this.redisConfig = {
            host: 'localhost',
            port: 6379,
            password: '', // Add password if Redis requires authentication
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxLoadingTimeout: 1000
        };

        // Database configuration
        this.dbConfig = {
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'absenta13',
            connectionLimit: 10,
            acquireTimeout: 10000
        };

        this.redis = null;
        this.pool = null;
        this.queues = {};
        this.downloadDir = './downloads';
        this.maxConcurrentDownloads = 80;
        this.priorityLevels = {
            admin: 1,    // Highest priority
            guru: 2,     // Medium priority
            siswa: 3     // Lowest priority
        };
    }

    /**
     * Initialize queue system
     */
    async initialize() {
        console.log('🚀 Initializing Download Queue System...');
        
        try {
            // Initialize Redis connection
            await this.initializeRedis();
            
            // Initialize database connection pool
            await this.initializeDatabase();
            
            // Create download directory
            await this.createDownloadDirectory();
            
            // Initialize queues
            await this.initializeQueues();
            
            // Start queue processors
            await this.startQueueProcessors();
            
            console.log('✅ Download Queue System initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Queue system initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        console.log('🔄 Connecting to Redis...');
        
        try {
            this.redis = new Redis(this.redisConfig);
            
            // Test Redis connection
            await this.redis.ping();
            console.log('✅ Redis connection established');
            
            // Handle Redis connection events
            this.redis.on('error', (error) => {
                console.error('❌ Redis connection error:', error);
            });
            
            this.redis.on('connect', () => {
                console.log('✅ Redis connected');
            });
            
            this.redis.on('ready', () => {
                console.log('✅ Redis ready');
            });
            
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error);
            throw error;
        }
    }

    /**
     * Initialize database connection pool
     */
    async initializeDatabase() {
        console.log('🔄 Initializing database connection pool...');
        
        try {
            this.pool = mysql.createPool(this.dbConfig);
            
            // Test database connection
            await this.pool.execute('SELECT 1');
            console.log('✅ Database connection pool established');
            
        } catch (error) {
            console.error('❌ Failed to initialize database pool:', error);
            throw error;
        }
    }

    /**
     * Create download directory
     */
    async createDownloadDirectory() {
        try {
            await fs.mkdir(this.downloadDir, { recursive: true });
            console.log(`📁 Created download directory: ${this.downloadDir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Initialize queues
     */
    async initializeQueues() {
        console.log('🔄 Initializing download queues...');
        
        // Excel download queue
        this.queues.excelDownload = new Queue('excel download', {
            redis: this.redisConfig,
            defaultJobOptions: {
                removeOnComplete: 10,  // Keep last 10 completed jobs
                removeOnFail: 5,       // Keep last 5 failed jobs
                attempts: 3,           // Retry failed jobs 3 times
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });

        // Report generation queue
        this.queues.reportGeneration = new Queue('report generation', {
            redis: this.redisConfig,
            defaultJobOptions: {
                removeOnComplete: 5,
                removeOnFail: 3,
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 1000
                }
            }
        });

        console.log('✅ Download queues initialized');
    }

    /**
     * Start queue processors
     */
    async startQueueProcessors() {
        console.log('🔄 Starting queue processors...');
        
        // Excel download processor
        this.queues.excelDownload.process('student-attendance', this.maxConcurrentDownloads, async (job) => {
            return await this.processStudentAttendanceDownload(job);
        });

        this.queues.excelDownload.process('teacher-attendance', this.maxConcurrentDownloads, async (job) => {
            return await this.processTeacherAttendanceDownload(job);
        });

        this.queues.excelDownload.process('analytics-report', this.maxConcurrentDownloads, async (job) => {
            return await this.processAnalyticsReportDownload(job);
        });

        // Report generation processor
        this.queues.reportGeneration.process('semester-report', 5, async (job) => {
            return await this.processSemesterReportGeneration(job);
        });

        // Queue event handlers
        this.setupQueueEventHandlers();

        console.log('✅ Queue processors started');
    }

    /**
     * Setup queue event handlers
     */
    setupQueueEventHandlers() {
        // Excel download queue events
        this.queues.excelDownload.on('completed', (job, result) => {
            console.log(`✅ Excel download completed: ${job.id} - ${result.filename}`);
        });

        this.queues.excelDownload.on('failed', (job, err) => {
            console.error(`❌ Excel download failed: ${job.id} - ${err.message}`);
        });

        this.queues.excelDownload.on('stalled', (job) => {
            console.warn(`⚠️ Excel download stalled: ${job.id}`);
        });

        // Report generation queue events
        this.queues.reportGeneration.on('completed', (job, result) => {
            console.log(`✅ Report generation completed: ${job.id} - ${result.filename}`);
        });

        this.queues.reportGeneration.on('failed', (job, err) => {
            console.error(`❌ Report generation failed: ${job.id} - ${err.message}`);
        });
    }

    /**
     * Add Excel download job to queue
     */
    async addExcelDownloadJob(jobData) {
        const { type, userRole, userId, filters, priority = 'normal' } = jobData;
        
        // Determine priority based on user role
        const jobPriority = this.priorityLevels[userRole] || 3;
        
        const jobOptions = {
            priority: jobPriority,
            delay: 0,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        };

        try {
            const job = await this.queues.excelDownload.add(type, {
                ...jobData,
                timestamp: new Date().toISOString(),
                userId,
                userRole
            }, jobOptions);

            console.log(`📥 Added ${type} download job: ${job.id} (Priority: ${jobPriority})`);
            
            return {
                jobId: job.id,
                status: 'queued',
                estimatedTime: this.estimateProcessingTime(jobPriority),
                queuePosition: await this.getQueuePosition(job.id)
            };

        } catch (error) {
            console.error('❌ Failed to add download job:', error);
            throw error;
        }
    }

    /**
     * Process student attendance download
     */
    async processStudentAttendanceDownload(job) {
        const { filters, userId, userRole } = job.data;
        const { tanggal_mulai, tanggal_selesai, kelas_id } = filters;
        
        console.log(`🔄 Processing student attendance download: ${job.id}`);
        
        try {
            // Update job progress
            await job.progress(10);
            
            // Build query
            let query = `
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
            `;
            
            const params = [tanggal_mulai, tanggal_selesai];
            
            if (kelas_id) {
                query += ' AND s.kelas_id = ?';
                params.push(kelas_id);
            }
            
            query += ' ORDER BY a.tanggal DESC, s.nama ASC';
            
            await job.progress(30);
            
            // Execute query
            const [rows] = await this.pool.execute(query, params);
            
            await job.progress(50);
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Absensi Siswa');
            
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
            
            await job.progress(70);
            
            // Add data
            rows.forEach(row => {
                worksheet.addRow(row);
            });
            
            // Style headers
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            await job.progress(90);
            
            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `absensi_siswa_${tanggal_mulai}_${tanggal_selesai}_${timestamp}.xlsx`;
            const filepath = path.join(this.downloadDir, filename);
            
            // Save Excel file
            await workbook.xlsx.writeFile(filepath);
            
            await job.progress(100);
            
            console.log(`✅ Student attendance Excel created: ${filename} (${rows.length} records)`);
            
            return {
                filename,
                filepath,
                recordCount: rows.length,
                fileSize: (await fs.stat(filepath)).size,
                downloadUrl: `/api/downloads/${filename}`
            };

        } catch (error) {
            console.error(`❌ Student attendance download failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process teacher attendance download
     */
    async processTeacherAttendanceDownload(job) {
        const { filters, userId, userRole } = job.data;
        const { tanggal_mulai, tanggal_selesai, guru_id } = filters;
        
        console.log(`🔄 Processing teacher attendance download: ${job.id}`);
        
        try {
            await job.progress(10);
            
            // Build query
            let query = `
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
            `;
            
            const params = [tanggal_mulai, tanggal_selesai];
            
            if (guru_id) {
                query += ' AND a.guru_id = ?';
                params.push(guru_id);
            }
            
            query += ' ORDER BY a.tanggal DESC, a.jam_ke ASC';
            
            await job.progress(30);
            
            // Execute query
            const [rows] = await this.pool.execute(query, params);
            
            await job.progress(50);
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Absensi Guru');
            
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
            
            await job.progress(70);
            
            // Add data
            rows.forEach(row => {
                worksheet.addRow(row);
            });
            
            // Style headers
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };
            
            await job.progress(90);
            
            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `absensi_guru_${tanggal_mulai}_${tanggal_selesai}_${timestamp}.xlsx`;
            const filepath = path.join(this.downloadDir, filename);
            
            // Save Excel file
            await workbook.xlsx.writeFile(filepath);
            
            await job.progress(100);
            
            console.log(`✅ Teacher attendance Excel created: ${filename} (${rows.length} records)`);
            
            return {
                filename,
                filepath,
                recordCount: rows.length,
                fileSize: (await fs.stat(filepath)).size,
                downloadUrl: `/api/downloads/${filename}`
            };

        } catch (error) {
            console.error(`❌ Teacher attendance download failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process analytics report download
     */
    async processAnalyticsReportDownload(job) {
        const { filters, userId, userRole } = job.data;
        const { semester, year } = filters;
        
        console.log(`🔄 Processing analytics report download: ${job.id}`);
        
        try {
            await job.progress(10);
            
            // Get date range for semester
            const dateRange = this.getSemesterDateRange(semester, year);
            
            await job.progress(20);
            
            // Get analytics data
            const [studentStats] = await this.pool.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM absensi_siswa 
                WHERE tanggal BETWEEN ? AND ?
                GROUP BY status
            `, [dateRange.start, dateRange.end]);
            
            const [teacherStats] = await this.pool.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM absensi_guru 
                WHERE tanggal BETWEEN ? AND ?
                GROUP BY status
            `, [dateRange.start, dateRange.end]);
            
            await job.progress(50);
            
            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            
            // Analytics Summary Sheet
            const summarySheet = workbook.addWorksheet('Analytics Summary');
            
            // Add summary data
            summarySheet.addRow(['ANALYTICS REPORT', '']);
            summarySheet.addRow(['Semester', semester]);
            summarySheet.addRow(['Year', year]);
            summarySheet.addRow(['Date Range', `${dateRange.start} to ${dateRange.end}`]);
            summarySheet.addRow(['Generated', new Date().toISOString()]);
            summarySheet.addRow(['', '']);
            
            summarySheet.addRow(['STUDENT ATTENDANCE STATISTICS', '']);
            summarySheet.addRow(['Status', 'Count']);
            studentStats.forEach(stat => {
                summarySheet.addRow([stat.status, stat.count]);
            });
            
            summarySheet.addRow(['', '']);
            summarySheet.addRow(['TEACHER ATTENDANCE STATISTICS', '']);
            summarySheet.addRow(['Status', 'Count']);
            teacherStats.forEach(stat => {
                summarySheet.addRow([stat.status, stat.count]);
            });
            
            await job.progress(80);
            
            // Generate filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `analytics_report_${semester}_${year}_${timestamp}.xlsx`;
            const filepath = path.join(this.downloadDir, filename);
            
            // Save Excel file
            await workbook.xlsx.writeFile(filepath);
            
            await job.progress(100);
            
            console.log(`✅ Analytics report Excel created: ${filename}`);
            
            return {
                filename,
                filepath,
                recordCount: studentStats.length + teacherStats.length,
                fileSize: (await fs.stat(filepath)).size,
                downloadUrl: `/api/downloads/${filename}`
            };

        } catch (error) {
            console.error(`❌ Analytics report download failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process semester report generation
     */
    async processSemesterReportGeneration(job) {
        const { semester, year, userId } = job.data;
        
        console.log(`🔄 Processing semester report generation: ${job.id}`);
        
        try {
            await job.progress(10);
            
            // This would be a more complex report generation
            // For now, we'll create a simple summary
            
            const dateRange = this.getSemesterDateRange(semester, year);
            
            await job.progress(50);
            
            // Generate comprehensive semester report
            const filename = `semester_report_${semester}_${year}_${Date.now()}.xlsx`;
            const filepath = path.join(this.downloadDir, filename);
            
            // Create a simple report for now
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Semester Report');
            
            worksheet.addRow(['SEMESTER REPORT', '']);
            worksheet.addRow(['Semester', semester]);
            worksheet.addRow(['Year', year]);
            worksheet.addRow(['Generated', new Date().toISOString()]);
            
            await workbook.xlsx.writeFile(filepath);
            
            await job.progress(100);
            
            console.log(`✅ Semester report generated: ${filename}`);
            
            return {
                filename,
                filepath,
                fileSize: (await fs.stat(filepath)).size,
                downloadUrl: `/api/downloads/${filename}`
            };

        } catch (error) {
            console.error(`❌ Semester report generation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        try {
            const job = await this.queues.excelDownload.getJob(jobId);
            
            if (!job) {
                return { status: 'not_found' };
            }
            
            const state = await job.getState();
            const progress = job.progress();
            
            return {
                jobId: job.id,
                status: state,
                progress: progress,
                data: job.data,
                result: job.returnvalue,
                error: job.failedReason,
                createdAt: new Date(job.timestamp),
                processedAt: job.processedOn ? new Date(job.processedOn) : null,
                finishedAt: job.finishedOn ? new Date(job.finishedOn) : null
            };

        } catch (error) {
            console.error('❌ Failed to get job status:', error);
            throw error;
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStatistics() {
        try {
            const excelQueue = this.queues.excelDownload;
            const reportQueue = this.queues.reportGeneration;
            
            const [excelWaiting, excelActive, excelCompleted, excelFailed] = await Promise.all([
                excelQueue.getWaiting(),
                excelQueue.getActive(),
                excelQueue.getCompleted(),
                excelQueue.getFailed()
            ]);
            
            const [reportWaiting, reportActive, reportCompleted, reportFailed] = await Promise.all([
                reportQueue.getWaiting(),
                reportQueue.getActive(),
                reportQueue.getCompleted(),
                reportQueue.getFailed()
            ]);
            
            return {
                excelDownload: {
                    waiting: excelWaiting.length,
                    active: excelActive.length,
                    completed: excelCompleted.length,
                    failed: excelFailed.length,
                    total: excelWaiting.length + excelActive.length + excelCompleted.length + excelFailed.length
                },
                reportGeneration: {
                    waiting: reportWaiting.length,
                    active: reportActive.length,
                    completed: reportCompleted.length,
                    failed: reportFailed.length,
                    total: reportWaiting.length + reportActive.length + reportCompleted.length + reportFailed.length
                },
                maxConcurrentDownloads: this.maxConcurrentDownloads,
                redisConnected: this.redis.status === 'ready'
            };

        } catch (error) {
            console.error('❌ Failed to get queue statistics:', error);
            throw error;
        }
    }

    /**
     * Estimate processing time based on priority
     */
    estimateProcessingTime(priority) {
        const baseTime = 30; // 30 seconds base time
        const priorityMultiplier = {
            1: 0.5,  // Admin - 15 seconds
            2: 1.0,  // Guru - 30 seconds
            3: 1.5   // Siswa - 45 seconds
        };
        
        return Math.round(baseTime * (priorityMultiplier[priority] || 1.0));
    }

    /**
     * Get queue position for a job
     */
    async getQueuePosition(jobId) {
        try {
            const waitingJobs = await this.queues.excelDownload.getWaiting();
            const position = waitingJobs.findIndex(job => job.id === jobId);
            return position >= 0 ? position + 1 : 0;
        } catch (error) {
            return 0;
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
     * Cleanup old download files
     */
    async cleanupOldDownloads() {
        try {
            const files = await fs.readdir(this.downloadDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            for (const file of files) {
                const filepath = path.join(this.downloadDir, file);
                const stats = await fs.stat(filepath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filepath);
                    console.log(`🗑️ Deleted old download file: ${file}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to cleanup old downloads:', error);
        }
    }

    /**
     * Close all connections
     */
    async close() {
        try {
            // Close queues
            for (const queueName in this.queues) {
                await this.queues[queueName].close();
            }
            
            // Close Redis connection
            if (this.redis) {
                await this.redis.quit();
            }
            
            // Close database pool
            if (this.pool) {
                await this.pool.end();
            }
            
            console.log('✅ Queue system connections closed');
            
        } catch (error) {
            console.error('❌ Error closing queue system:', error);
        }
    }
}

// Export for use in other modules
export default DownloadQueue;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const downloadQueue = new DownloadQueue();
    
    try {
        await downloadQueue.initialize();
        
        // Test adding a download job
        const jobResult = await downloadQueue.addExcelDownloadJob({
            type: 'student-attendance',
            userRole: 'admin',
            userId: 1,
            filters: {
                tanggal_mulai: '2025-01-01',
                tanggal_selesai: '2025-12-31'
            }
        });
        
        console.log('🎉 Test job added:', jobResult);
        
        // Get queue statistics
        const stats = await downloadQueue.getQueueStatistics();
        console.log('📊 Queue statistics:', stats);
        
        // Wait a bit for processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get job status
        const jobStatus = await downloadQueue.getJobStatus(jobResult.jobId);
        console.log('📋 Job status:', jobStatus);
        
        await downloadQueue.close();
        process.exit(0);
    } catch (error) {
        console.error('💥 Queue system test failed:', error);
        process.exit(1);
    }
}
