/**
 * Excel Service - Excel file processing business logic
 * Handles Excel import/export, data parsing, and file generation
 */

import ExcelJS from 'exceljs';
import { createOperationalError } from '../middleware/errorHandler.js';

/**
 * Parse schedule Excel file
 * @param {Object} file - Excel file buffer
 * @returns {Promise<Object>} Parsed schedule data
 */
export const parseScheduleExcel = async (file) => {
    try {
        console.log('📥 Parsing schedule Excel file');
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw createOperationalError('Worksheet tidak ditemukan', 400, 'INVALID_EXCEL');
        }
        
        const schedules = [];
        const errors = [];
        
        // Skip header row
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            try {
                const schedule = {
                    hari: row.getCell(1).value,
                    jam_ke: row.getCell(2).value,
                    jam_mulai: row.getCell(3).value,
                    jam_selesai: row.getCell(4).value,
                    kelas: row.getCell(5).value,
                    mapel: row.getCell(6).value,
                    guru: row.getCell(7).value
                };
                
                // Validate required fields
                if (!schedule.hari || !schedule.jam_ke || !schedule.jam_mulai || !schedule.jam_selesai) {
                    errors.push(`Row ${rowNumber}: Required fields missing`);
                    return;
                }
                
                schedules.push(schedule);
            } catch (error) {
                errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        });
        
        return {
            success: true,
            data: {
                schedules,
                total_rows: schedules.length,
                errors,
                has_errors: errors.length > 0
            }
        };
    } catch (error) {
        console.error('❌ Error parsing schedule Excel:', error);
        throw createOperationalError('Gagal memproses file Excel', 500, 'EXCEL_PARSE_ERROR');
    }
};

/**
 * Generate Excel report
 * @param {Object} data - Data to export
 * @param {string} template - Report template type
 * @returns {Promise<Object>} Excel file buffer
 */
export const generateExcelReport = async (data, template) => {
    try {
        console.log(`📤 Generating Excel report with template: ${template}`);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');
        
        // Set up headers based on template
        let headers = [];
        switch (template) {
            case 'attendance':
                headers = ['Tanggal', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Status', 'Keterangan'];
                break;
            case 'schedule':
                headers = ['Hari', 'Jam Ke', 'Jam Mulai', 'Jam Selesai', 'Kelas', 'Mata Pelajaran', 'Guru'];
                break;
            case 'student':
                headers = ['NIS', 'Nama', 'Kelas', 'Status', 'Telepon', 'Alamat'];
                break;
            case 'teacher':
                headers = ['NIP', 'Nama', 'Mata Pelajaran', 'Status', 'Telepon', 'Alamat'];
                break;
            default:
                headers = Object.keys(data[0] || {});
        }
        
        // Add headers
        worksheet.addRow(headers);
        
        // Style headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Add data rows
        if (Array.isArray(data)) {
            data.forEach(row => {
                const values = headers.map(header => {
                    // Map header to data property
                    const key = header.toLowerCase().replace(/\s+/g, '_');
                    return row[key] || row[header] || '';
                });
                worksheet.addRow(values);
            });
        }
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
        
        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        return {
            success: true,
            data: {
                buffer,
                filename: `${template}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
                size: buffer.length
            }
        };
    } catch (error) {
        console.error('❌ Error generating Excel report:', error);
        throw createOperationalError('Gagal membuat file Excel', 500, 'EXCEL_GENERATION_ERROR');
    }
};

/**
 * Validate Excel data
 * @param {Array} data - Excel data to validate
 * @param {string} type - Data type (schedule, student, teacher)
 * @returns {Promise<Object>} Validation result
 */
export const validateExcelData = async (data, type) => {
    try {
        console.log(`🔍 Validating Excel data for type: ${type}`);
        
        const errors = [];
        const warnings = [];
        
        if (!Array.isArray(data) || data.length === 0) {
            errors.push('Data tidak ditemukan atau kosong');
            return { isValid: false, errors, warnings };
        }
        
        // Validate based on type
        switch (type) {
            case 'schedule':
                data.forEach((row, index) => {
                    if (!row.hari) errors.push(`Row ${index + 1}: Hari is required`);
                    if (!row.jam_ke) errors.push(`Row ${index + 1}: Jam ke is required`);
                    if (!row.jam_mulai) errors.push(`Row ${index + 1}: Jam mulai is required`);
                    if (!row.jam_selesai) errors.push(`Row ${index + 1}: Jam selesai is required`);
                    if (!row.kelas) errors.push(`Row ${index + 1}: Kelas is required`);
                    if (!row.mapel) errors.push(`Row ${index + 1}: Mata pelajaran is required`);
                    if (!row.guru) errors.push(`Row ${index + 1}: Guru is required`);
                });
                break;
                
            case 'student':
                data.forEach((row, index) => {
                    if (!row.nis) errors.push(`Row ${index + 1}: NIS is required`);
                    if (!row.nama) errors.push(`Row ${index + 1}: Nama is required`);
                    if (!row.kelas) errors.push(`Row ${index + 1}: Kelas is required`);
                });
                break;
                
            case 'teacher':
                data.forEach((row, index) => {
                    if (!row.nip) errors.push(`Row ${index + 1}: NIP is required`);
                    if (!row.nama) errors.push(`Row ${index + 1}: Nama is required`);
                    if (!row.mapel) errors.push(`Row ${index + 1}: Mata pelajaran is required`);
                });
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            total_rows: data.length
        };
    } catch (error) {
        console.error('❌ Error validating Excel data:', error);
        throw createOperationalError('Gagal memvalidasi data Excel', 500, 'EXCEL_VALIDATION_ERROR');
    }
};

/**
 * Create Excel template
 * @param {string} type - Template type
 * @returns {Promise<Object>} Excel template buffer
 */
export const createExcelTemplate = async (type) => {
    try {
        console.log(`📝 Creating Excel template for type: ${type}`);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');
        
        let headers = [];
        let sampleData = [];
        
        switch (type) {
            case 'schedule':
                headers = ['Hari', 'Jam Ke', 'Jam Mulai', 'Jam Selesai', 'Kelas', 'Mata Pelajaran', 'Guru'];
                sampleData = [
                    ['Senin', '1', '07:00', '07:45', 'X TKJ 1', 'Matematika', 'Budi Santoso'],
                    ['Senin', '2', '07:45', '08:30', 'X TKJ 1', 'Bahasa Indonesia', 'Siti Aminah']
                ];
                break;
                
            case 'student':
                headers = ['NIS', 'Nama', 'Kelas', 'Jenis Kelamin', 'Telepon Orangtua', 'Alamat'];
                sampleData = [
                    ['2024001', 'Ahmad Rizki', 'X TKJ 1', 'Laki-laki', '081234567890', 'Jl. Contoh No. 1'],
                    ['2024002', 'Siti Nurhaliza', 'X TKJ 1', 'Perempuan', '081234567891', 'Jl. Contoh No. 2']
                ];
                break;
                
            case 'teacher':
                headers = ['NIP', 'Nama', 'Mata Pelajaran', 'Jenis Kelamin', 'Telepon', 'Alamat'];
                sampleData = [
                    ['196501011990031001', 'Budi Santoso', 'Matematika', 'Laki-laki', '081234567890', 'Jl. Guru No. 1'],
                    ['196502021990031002', 'Siti Aminah', 'Bahasa Indonesia', 'Perempuan', '081234567891', 'Jl. Guru No. 2']
                ];
                break;
        }
        
        // Add headers
        worksheet.addRow(headers);
        
        // Add sample data
        sampleData.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Style headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
        
        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        return {
            success: true,
            data: {
                buffer,
                filename: `${type}_template.xlsx`,
                size: buffer.length
            }
        };
    } catch (error) {
        console.error('❌ Error creating Excel template:', error);
        throw createOperationalError('Gagal membuat template Excel', 500, 'EXCEL_TEMPLATE_ERROR');
    }
};
