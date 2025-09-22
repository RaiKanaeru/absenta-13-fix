// ===================================================================
// ABSENTA 13 - Export System Integration
// Blueprint untuk Export/Import Data sesuai Format SMKN 13 Bandung
// ===================================================================

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

// ===================================================================
// 1. DATA SCHEMA MAPPING
// ===================================================================

const SCHEMA_MAPPING = {
  // Format Daftar Guru
  TEACHER_LIST: {
    headers: ['NO', 'NAMA', 'NIP/NUPTK'],
    tableName: 'teachers',
    fields: {
      NO: 'row_number',
      NAMA: 'full_name', 
      'NIP/NUPTK': 'nip_nuptk'
    }
  },

  // Format Rekap Ketidakhadiran Guru
  TEACHER_ABSENCE: {
    headers: ['NO', 'NAMA GURU', 'NIP', 'MATA PELAJARAN', 'KELAS', 
              'TANGGAL', 'JAM KE', 'KETERANGAN', 'STATUS'],
    tableName: 'teacher_attendance',
    fields: {
      NO: 'row_number',
      'NAMA GURU': 'teacher_name',
      NIP: 'nip',
      'MATA PELAJARAN': 'subject',
      KELAS: 'class_name',
      TANGGAL: 'attendance_date',
      'JAM KE': 'period_number',
      KETERANGAN: 'notes',
      STATUS: 'status'
    }
  },

  // Format Presensi Siswa
  STUDENT_ATTENDANCE: {
    headers: ['NO', 'NAMA SISWA', 'NISN', 'KELAS', 'TANGGAL', 
              'JAM MASUK', 'JAM KELUAR', 'STATUS', 'KETERANGAN'],
    tableName: 'student_attendance',
    fields: {
      NO: 'row_number',
      'NAMA SISWA': 'student_name',
      NISN: 'nisn',
      KELAS: 'class_name',
      TANGGAL: 'attendance_date',
      'JAM MASUK': 'time_in',
      'JAM KELUAR': 'time_out',
      STATUS: 'status',
      KETERANGAN: 'notes'
    }
  }
};

// ===================================================================
// 2. EXPORT SYSTEM CLASS
// ===================================================================

class AbsentaExportSystem {
  constructor(dbConnection, cacheSystem) {
    this.db = dbConnection;
    this.cache = cacheSystem;
    this.exportFormats = SCHEMA_MAPPING;
  }

  // ================================================================
  // Export Daftar Guru (Format Rapat Pleno)
  // ================================================================
  async exportTeacherList(academicYear = '2025-2026') {
    try {
      console.log('🎯 Generating Teacher List Export...');
      
      // Query data guru dari database
      const query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY full_name) as row_number,
          full_name,
          nip_nuptk,
          position,
          department
        FROM teachers 
        WHERE status = 'active' 
        AND academic_year = ?
        ORDER BY full_name
      `;
      
      const teachers = await this.db.query(query, [academicYear]);
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daftar Guru');
      
      // Header styling sesuai format SMKN 13
      this.addSchoolHeader(worksheet, {
        title: `DAFTAR PESERTA RAPAT PLENO SPMB TAHAP 2`,
        subtitle: `Tahun Ajaran ${academicYear}`,
        documentNumber: `1709/HUB.04.15.06/SMKN13BDG`,
        date: new Date().toLocaleDateString('id-ID')
      });
      
      // Table headers (mulai dari row 15)
      const headerRow = 15;
      const headers = this.exportFormats.TEACHER_LIST.headers;
      
      worksheet.mergeCells(`A${headerRow}:A${headerRow+1}`);
      worksheet.mergeCells(`B${headerRow}:B${headerRow+1}`);
      worksheet.mergeCells(`C${headerRow}:C${headerRow+1}`);
      
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRow, index + 1);
        cell.value = header;
        cell.style = {
          font: { bold: true, size: 12 },
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } }
        };
      });
      
      // Data rows
      let currentRow = headerRow + 2;
      teachers.forEach((teacher, index) => {
        worksheet.getCell(currentRow, 1).value = index + 1;
        worksheet.getCell(currentRow, 2).value = teacher.full_name;
        worksheet.getCell(currentRow, 3).value = teacher.nip_nuptk;
        
        // Apply styling untuk data rows
        for (let col = 1; col <= 3; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.style = {
            border: {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' }
            },
            alignment: { horizontal: col === 1 ? 'center' : 'left', vertical: 'middle' }
          };
        }
        currentRow++;
      });
      
      // Footer signature
      this.addSignatureFooter(worksheet, currentRow + 3);
      
      // Column widths
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 20;
      
      const filename = `Daftar_Guru_${academicYear.replace('-', '_')}_${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, 'downloads', filename);
      
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: teachers.length,
        message: 'Teacher list exported successfully'
      };
      
    } catch (error) {
      console.error('❌ Error exporting teacher list:', error);
      throw error;
    }
  }

  // ================================================================
  // Export Rekap Ketidakhadiran Guru
  // ================================================================
  async exportTeacherAbsenceReport(startDate, endDate, classFilter = null) {
    try {
      console.log('📊 Generating Teacher Absence Report...');
      
      let query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY ta.attendance_date, t.full_name) as row_number,
          t.full_name as teacher_name,
          t.nip_nuptk as nip,
          s.subject_name as subject,
          c.class_name,
          DATE_FORMAT(ta.attendance_date, '%Y-%m-%d') as attendance_date,
          ta.period_number,
          ta.notes,
          CASE 
            WHEN ta.status = 'absent' THEN 'Tidak Hadir'
            WHEN ta.status = 'late' THEN 'Terlambat'
            WHEN ta.status = 'sick' THEN 'Sakit'
            WHEN ta.status = 'permission' THEN 'Izin'
            ELSE 'Lainnya'
          END as status
        FROM teacher_attendance ta
        JOIN teachers t ON ta.teacher_id = t.id
        JOIN subjects s ON ta.subject_id = s.id
        JOIN classes c ON ta.class_id = c.id
        WHERE ta.attendance_date BETWEEN ? AND ?
        AND ta.status IN ('absent', 'late', 'sick', 'permission')
      `;
      
      let params = [startDate, endDate];
      
      if (classFilter) {
        query += ` AND c.class_name = ?`;
        params.push(classFilter);
      }
      
      query += ` ORDER BY ta.attendance_date, t.full_name`;
      
      const absenceData = await this.db.query(query, params);
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rekap Ketidakhadiran Guru');
      
      // Header
      this.addSchoolHeader(worksheet, {
        title: 'REKAP KETIDAKHADIRAN GURU',
        subtitle: `Periode: ${startDate} s/d ${endDate}`,
        documentNumber: `REKAP/GURU/${new Date().getFullYear()}`,
        date: new Date().toLocaleDateString('id-ID')
      });
      
      // Table headers
      const headerRow = 15;
      const headers = this.exportFormats.TEACHER_ABSENCE.headers;
      
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRow, index + 1);
        cell.value = header;
        cell.style = {
          font: { bold: true, size: 11 },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          border: this.getBorderStyle(),
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } }
        };
      });
      
      // Data rows
      let currentRow = headerRow + 1;
      absenceData.forEach((record, index) => {
        worksheet.getCell(currentRow, 1).value = index + 1;
        worksheet.getCell(currentRow, 2).value = record.teacher_name;
        worksheet.getCell(currentRow, 3).value = record.nip;
        worksheet.getCell(currentRow, 4).value = record.subject;
        worksheet.getCell(currentRow, 5).value = record.class_name;
        worksheet.getCell(currentRow, 6).value = record.attendance_date;
        worksheet.getCell(currentRow, 7).value = record.period_number;
        worksheet.getCell(currentRow, 8).value = record.notes || '-';
        worksheet.getCell(currentRow, 9).value = record.status;
        
        // Apply styling
        for (let col = 1; col <= headers.length; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.style = {
            border: this.getBorderStyle(),
            alignment: { 
              horizontal: col === 1 || col === 7 ? 'center' : 'left', 
              vertical: 'middle',
              wrapText: true
            }
          };
        }
        currentRow++;
      });
      
      // Column widths
      const columnWidths = [5, 25, 18, 20, 12, 12, 8, 25, 12];
      columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
      
      // Summary statistics
      this.addSummarySection(worksheet, currentRow + 2, absenceData);
      
      const filename = `Rekap_Ketidakhadiran_Guru_${startDate}_${endDate}_${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, 'downloads', filename);
      
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: absenceData.length,
        period: `${startDate} - ${endDate}`,
        message: 'Teacher absence report exported successfully'
      };
      
    } catch (error) {
      console.error('❌ Error exporting teacher absence report:', error);
      throw error;
    }
  }

  // ================================================================
  // Export Presensi Siswa
  // ================================================================
  async exportStudentAttendance(startDate, endDate, classFilter = null) {
    try {
      console.log('👨‍🎓 Generating Student Attendance Report...');
      
      let query = `
        SELECT 
          ROW_NUMBER() OVER (ORDER BY sa.attendance_date, s.full_name) as row_number,
          s.full_name as student_name,
          s.nisn,
          c.class_name,
          DATE_FORMAT(sa.attendance_date, '%Y-%m-%d') as attendance_date,
          TIME_FORMAT(sa.time_in, '%H:%i') as time_in,
          TIME_FORMAT(sa.time_out, '%H:%i') as time_out,
          CASE 
            WHEN sa.status = 'present' THEN 'Hadir'
            WHEN sa.status = 'absent' THEN 'Tidak Hadir'
            WHEN sa.status = 'late' THEN 'Terlambat'
            WHEN sa.status = 'sick' THEN 'Sakit'
            WHEN sa.status = 'permission' THEN 'Izin'
            ELSE 'Lainnya'
          END as status,
          sa.notes
        FROM student_attendance sa
        JOIN students s ON sa.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE sa.attendance_date BETWEEN ? AND ?
      `;
      
      let params = [startDate, endDate];
      
      if (classFilter) {
        query += ` AND c.class_name = ?`;
        params.push(classFilter);
      }
      
      query += ` ORDER BY sa.attendance_date, c.class_name, s.full_name`;
      
      const attendanceData = await this.db.query(query, params);
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Presensi Siswa');
      
      // Header
      this.addSchoolHeader(worksheet, {
        title: 'PRESENSI SISWA',
        subtitle: `Periode: ${startDate} s/d ${endDate}`,
        documentNumber: `PRESENSI/SISWA/${new Date().getFullYear()}`,
        date: new Date().toLocaleDateString('id-ID')
      });
      
      // Table headers
      const headerRow = 15;
      const headers = this.exportFormats.STUDENT_ATTENDANCE.headers;
      
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRow, index + 1);
        cell.value = header;
        cell.style = {
          font: { bold: true, size: 11 },
          alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
          border: this.getBorderStyle(),
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } }
        };
      });
      
      // Data rows
      let currentRow = headerRow + 1;
      attendanceData.forEach((record, index) => {
        worksheet.getCell(currentRow, 1).value = index + 1;
        worksheet.getCell(currentRow, 2).value = record.student_name;
        worksheet.getCell(currentRow, 3).value = record.nisn;
        worksheet.getCell(currentRow, 4).value = record.class_name;
        worksheet.getCell(currentRow, 5).value = record.attendance_date;
        worksheet.getCell(currentRow, 6).value = record.time_in || '-';
        worksheet.getCell(currentRow, 7).value = record.time_out || '-';
        worksheet.getCell(currentRow, 8).value = record.status;
        worksheet.getCell(currentRow, 9).value = record.notes || '-';
        
        // Apply styling
        for (let col = 1; col <= headers.length; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.style = {
            border: this.getBorderStyle(),
            alignment: { 
              horizontal: [1, 6, 7].includes(col) ? 'center' : 'left', 
              vertical: 'middle',
              wrapText: true
            }
          };
        }
        currentRow++;
      });
      
      // Column widths
      const columnWidths = [5, 25, 15, 12, 12, 10, 10, 12, 25];
      columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
      
      const filename = `Presensi_Siswa_${startDate}_${endDate}_${Date.now()}.xlsx`;
      const filepath = path.join(__dirname, 'downloads', filename);
      
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        recordCount: attendanceData.length,
        period: `${startDate} - ${endDate}`,
        message: 'Student attendance report exported successfully'
      };
      
    } catch (error) {
      console.error('❌ Error exporting student attendance:', error);
      throw error;
    }
  }

  // ================================================================
  // IMPORT SYSTEM
  // ================================================================
  
  async importTeacherList(filePath) {
    try {
      console.log('📥 Importing Teacher List...');
      
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      
      const teachers = [];
      let startRow = 17; // Assuming data starts after header
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= startRow && row.getCell(2).value) {
          teachers.push({
            full_name: row.getCell(2).value,
            nip_nuptk: row.getCell(3).value,
            status: 'active',
            academic_year: '2025-2026',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
      
      // Bulk insert to database
      if (teachers.length > 0) {
        const query = `
          INSERT INTO teachers (full_name, nip_nuptk, status, academic_year, created_at, updated_at)
          VALUES ?
          ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          updated_at = VALUES(updated_at)
        `;
        
        const values = teachers.map(teacher => [
          teacher.full_name,
          teacher.nip_nuptk,
          teacher.status,
          teacher.academic_year,
          teacher.created_at,
          teacher.updated_at
        ]);
        
        await this.db.query(query, [values]);
      }
      
      return {
        success: true,
        imported: teachers.length,
        message: 'Teacher list imported successfully'
      };
      
    } catch (error) {
      console.error('❌ Error importing teacher list:', error);
      throw error;
    }
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================
  
  addSchoolHeader(worksheet, options) {
    // Logo dan header sekolah
    worksheet.mergeCells('A1:I4');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = `PEMERINTAH DAERAH PROVINSI JAWA BARAT
DINAS PENDIDIKAN
CABANG DINAS PENDIDIKAN WILAYAH VII
SEKOLAH MENENGAH KEJURUAN NEGERI 13

Jalan Soekarno - Hatta Km.10 Telepon (022) 7318960: Ext. 114
Telepon/Faksimil: (022) 7332252 – Bandung 40286
Email: smk13bdg@gmail.com Home page: http://www.smkn13.sch.id`;
    
    headerCell.style = {
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      font: { bold: true, size: 12 }
    };
    
    // Document info
    worksheet.mergeCells('A6:I7');
    const docInfoCell = worksheet.getCell('A6');
    docInfoCell.value = `Nomor : ${options.documentNumber}                    Bandung, ${options.date}
Lampiran : -
Hal : ${options.title}`;
    
    docInfoCell.style = {
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
      font: { size: 10 }
    };
    
    // Title
    worksheet.mergeCells('A10:I12');
    const titleCell = worksheet.getCell('A10');
    titleCell.value = `${options.title}\n${options.subtitle || ''}`;
    titleCell.style = {
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      font: { bold: true, size: 14 }
    };
  }
  
  addSignatureFooter(worksheet, startRow) {
    worksheet.mergeCells(`G${startRow}:I${startRow+3}`);
    const signatureCell = worksheet.getCell(`G${startRow}`);
    signatureCell.value = `Plt. Kepala SMKN 13 Bandung




Dr. Hj. Yani Heryani, M.M.Pd
NIP. 196602281997022002`;
    
    signatureCell.style = {
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      font: { size: 10 }
    };
  }
  
  addSummarySection(worksheet, startRow, data) {
    const summary = this.calculateSummary(data);
    
    worksheet.getCell(startRow, 1).value = 'RINGKASAN:';
    worksheet.getCell(startRow, 1).style = { font: { bold: true } };
    
    Object.entries(summary).forEach(([key, value], index) => {
      worksheet.getCell(startRow + index + 1, 1).value = `${key}:`;
      worksheet.getCell(startRow + index + 1, 2).value = value;
    });
  }
  
  calculateSummary(data) {
    const statusCounts = {};
    data.forEach(record => {
      statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
    });
    
    return {
      'Total Records': data.length,
      ...statusCounts
    };
  }
  
  getBorderStyle() {
    return {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
}

// ================================================================
// EXPRESS ROUTE INTEGRATION
// ================================================================

// Tambahkan routes ini ke server_modern.js
const exportRoutes = (app, db, cache) => {
  const exportSystem = new AbsentaExportSystem(db, cache);
  
  // Export Teacher List
  app.get('/api/export/teacher-list', async (req, res) => {
    try {
      const { academicYear = '2025-2026' } = req.query;
      const result = await exportSystem.exportTeacherList(academicYear);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Export Teacher Absence Report
  app.get('/api/export/teacher-absence', async (req, res) => {
    try {
      const { startDate, endDate, classFilter } = req.query;
      const result = await exportSystem.exportTeacherAbsenceReport(startDate, endDate, classFilter);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Export Student Attendance
  app.get('/api/export/student-attendance', async (req, res) => {
    try {
      const { startDate, endDate, classFilter } = req.query;
      const result = await exportSystem.exportStudentAttendance(startDate, endDate, classFilter);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Download exported file
  app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'downloads', filename);
    res.download(filepath);
  });
  
  // Import Teacher List
  app.post('/api/import/teacher-list', async (req, res) => {
    try {
      const { filePath } = req.body;
      const result = await exportSystem.importTeacherList(filePath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

module.exports = { AbsentaExportSystem, exportRoutes };

// ================================================================
// USAGE EXAMPLE
// ================================================================

/*
// Implementasi di server_modern.js
const { exportRoutes } = require('./export-system');

// Register routes
exportRoutes(app, db, cache);

// Frontend usage example:
// GET /api/export/teacher-list?academicYear=2025-2026
// GET /api/export/teacher-absence?startDate=2025-07-01&endDate=2025-07-31
// GET /api/export/student-attendance?startDate=2025-07-01&endDate=2025-07-31&classFilter=XII-RPL-1
// GET /api/download/Daftar_Guru_2025_2026_1234567890.xlsx
*/