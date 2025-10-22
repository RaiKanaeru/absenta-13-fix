import express from 'express';
import ExcelJS from 'exceljs';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendError } from '../utils/responseHelper.js';

const router = express.Router();

/**
 * Helper function to create Excel template with headers, sample data, and instructions
 * @param {string} templateName - Name of the template
 * @param {Array} headers - Column headers
 * @param {Array} sampleRows - Sample data rows
 * @param {Object} validations - Column validations (optional)
 * @param {Array} instructions - Array of instruction strings
 * @returns {ExcelJS.Workbook} - Excel workbook
 */
const createTemplate = async (templateName, headers, sampleRows, validations = {}, instructions = []) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(templateName);
    
    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instruksi');
    instructionsSheet.columns = [{ header: 'Petunjuk Penggunaan', key: 'instruction', width: 80 }];
    
    // Add title
    instructionsSheet.addRow({ instruction: `Template Import ${templateName}` });
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    instructionsSheet.addRow({ instruction: '' }); // Empty row
    
    // Add instructions
    instructions.forEach(instruction => {
        instructionsSheet.addRow({ instruction });
    });
    
    // Style instructions
    instructionsSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
            row.font = { size: 11 };
            row.alignment = { wrapText: true, vertical: 'top' };
        }
    });
    
    // Main data sheet
    worksheet.columns = headers.map(header => ({
        header: header.name,
        key: header.key,
        width: header.width || 20
    }));
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;
    
    // Add sample rows
    sampleRows.forEach(row => {
        worksheet.addRow(row);
    });
    
    // Apply validations
    Object.keys(validations).forEach(columnKey => {
        const validation = validations[columnKey];
        const columnIndex = headers.findIndex(h => h.key === columnKey) + 1;
        
        if (columnIndex > 0) {
            // Apply validation to all rows (starting from row 2, after header)
            for (let rowIndex = 2; rowIndex <= 1000; rowIndex++) {
                const cell = worksheet.getCell(rowIndex, columnIndex);
                cell.dataValidation = validation;
            }
        }
    });
    
    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });
    
    return workbook;
};

// ================================================
// TEMPLATE GENERATION ENDPOINTS
// ================================================

/**
 * GET /api/admin/templates/mapel - Generate Mapel import template
 */
router.get('/mapel', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Generating Mapel template');
        
        const headers = [
            { key: 'kode_mapel', name: 'Kode Mapel *', width: 15 },
            { key: 'nama_mapel', name: 'Nama Mapel *', width: 30 },
            { key: 'deskripsi', name: 'Deskripsi', width: 40 },
            { key: 'status', name: 'Status', width: 15 }
        ];
        
        const sampleRows = [
            { kode_mapel: 'MTK', nama_mapel: 'Matematika', deskripsi: 'Mata pelajaran Matematika', status: 'aktif' },
            { kode_mapel: 'IPA', nama_mapel: 'Ilmu Pengetahuan Alam', deskripsi: 'Mata pelajaran IPA', status: 'aktif' }
        ];
        
        const validations = {
            status: {
                type: 'list',
                allowBlank: true,
                formulae: ['"aktif,tidak_aktif"']
            }
        };
        
        const instructions = [
            '1. Kolom dengan tanda * wajib diisi',
            '2. Kode Mapel: Maksimal 20 karakter, tidak boleh ada spasi, harus unik',
            '3. Nama Mapel: Maksimal 100 karakter, harus unik',
            '4. Deskripsi: Opsional, maksimal 255 karakter',
            '5. Status: Pilih "aktif" atau "tidak_aktif" (default: aktif)',
            '6. Jangan ubah nama kolom di baris header',
            '7. Hapus baris contoh sebelum mengisi data Anda',
            '8. Format file: .xlsx atau .csv',
            '9. Ukuran maksimal: 5MB'
        ];
        
        const workbook = await createTemplate('Mapel', headers, sampleRows, validations, instructions);
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_mapel.xlsx"');
        res.send(buffer);
        
        console.log('✅ Mapel template generated successfully');
    } catch (error) {
        console.error('❌ Error generating Mapel template:', error);
        sendError(res, 'Gagal membuat template Mapel', 500);
    }
});

/**
 * GET /api/admin/templates/kelas - Generate Kelas import template
 */
router.get('/kelas', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Generating Kelas template');
        
        const headers = [
            { key: 'nama_kelas', name: 'Nama Kelas *', width: 20 },
            { key: 'tingkat', name: 'Tingkat', width: 10 },
            { key: 'status', name: 'Status', width: 15 }
        ];
        
        const sampleRows = [
            { nama_kelas: 'X RPL 1', tingkat: '10', status: 'aktif' },
            { nama_kelas: 'XI RPL 1', tingkat: '11', status: 'aktif' }
        ];
        
        const validations = {
            tingkat: {
                type: 'list',
                allowBlank: true,
                formulae: ['"10,11,12,13"']
            },
            status: {
                type: 'list',
                allowBlank: true,
                formulae: ['"aktif,tidak_aktif"']
            }
        };
        
        const instructions = [
            '1. Kolom dengan tanda * wajib diisi',
            '2. Nama Kelas: Maksimal 50 karakter, harus unik',
            '3. Tingkat: Pilih 10, 11, 12, atau 13 (opsional)',
            '4. Status: Pilih "aktif" atau "tidak_aktif" (default: aktif)',
            '5. Jangan ubah nama kolom di baris header',
            '6. Hapus baris contoh sebelum mengisi data Anda',
            '7. Format file: .xlsx atau .csv',
            '8. Ukuran maksimal: 5MB'
        ];
        
        const workbook = await createTemplate('Kelas', headers, sampleRows, validations, instructions);
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_kelas.xlsx"');
        res.send(buffer);
        
        console.log('✅ Kelas template generated successfully');
    } catch (error) {
        console.error('❌ Error generating Kelas template:', error);
        sendError(res, 'Gagal membuat template Kelas', 500);
    }
});

/**
 * GET /api/admin/templates/guru - Generate Guru import template
 */
router.get('/guru', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Generating Guru template');
        
        const headers = [
            { key: 'nip', name: 'NIP *', width: 20 },
            { key: 'nama', name: 'Nama *', width: 30 },
            { key: 'username', name: 'Username', width: 20 },
            { key: 'password', name: 'Password', width: 20 },
            { key: 'email', name: 'Email', width: 25 },
            { key: 'mapel_id', name: 'Mapel ID', width: 15 },
            { key: 'no_telp', name: 'No. Telepon', width: 15 },
            { key: 'alamat', name: 'Alamat', width: 30 },
            { key: 'jenis_kelamin', name: 'Jenis Kelamin', width: 15 },
            { key: 'status', name: 'Status', width: 15 }
        ];
        
        const sampleRows = [
            { 
                nip: '197001011990011001', 
                nama: 'Ahmad Suryadi', 
                username: 'ahmad.suryadi',
                password: 'password123',
                email: 'ahmad.suryadi@smk13.sch.id',
                mapel_id: '1',
                no_telp: '081234567890',
                alamat: 'Jakarta',
                jenis_kelamin: 'L',
                status: 'aktif' 
            },
            { 
                nip: '197505102000032002', 
                nama: 'Siti Nurjanah', 
                username: 'siti.nurjanah',
                password: 'password123',
                email: 'siti.nurjanah@smk13.sch.id',
                mapel_id: '2',
                no_telp: '081234567891',
                alamat: 'Bekasi',
                jenis_kelamin: 'P',
                status: 'aktif' 
            }
        ];
        
        const validations = {
            jenis_kelamin: {
                type: 'list',
                allowBlank: true,
                formulae: ['"L,P"']
            },
            status: {
                type: 'list',
                allowBlank: true,
                formulae: ['"aktif,tidak_aktif,pensiun"']
            }
        };
        
        const instructions = [
            '1. Kolom dengan tanda * wajib diisi',
            '2. NIP: Maksimal 30 karakter, harus unik',
            '3. Nama: Maksimal 100 karakter',
            '4. Username: Opsional, jika diisi akan membuat akun login. Minimal 3 karakter, maksimal 50 karakter',
            '5. Password: Wajib jika Username diisi. Minimal 6 karakter',
            '6. Email: Format email valid, maksimal 100 karakter',
            '7. Mapel ID: ID mata pelajaran yang diampu (opsional, referensi ke tabel mapel)',
            '8. No. Telepon: Maksimal 20 karakter',
            '9. Alamat: Maksimal 255 karakter',
            '10. Jenis Kelamin: L (Laki-laki) atau P (Perempuan)',
            '11. Status: Pilih "aktif", "tidak_aktif", atau "pensiun" (default: aktif)',
            '12. Jika NIP sudah ada, data akan diupdate',
            '13. Jika Username sudah ada, data user akan diupdate (kecuali password kosong)',
            '14. Jangan ubah nama kolom di baris header',
            '15. Hapus baris contoh sebelum mengisi data Anda',
            '16. Format file: .xlsx atau .csv',
            '17. Ukuran maksimal: 5MB'
        ];
        
        const workbook = await createTemplate('Guru', headers, sampleRows, validations, instructions);
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_guru.xlsx"');
        res.send(buffer);
        
        console.log('✅ Guru template generated successfully');
    } catch (error) {
        console.error('❌ Error generating Guru template:', error);
        sendError(res, 'Gagal membuat template Guru', 500);
    }
});

/**
 * GET /api/admin/templates/siswa - Generate Siswa import template
 */
router.get('/siswa', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Generating Siswa template');
        
        const headers = [
            { key: 'nis', name: 'NIS *', width: 20 },
            { key: 'nama', name: 'Nama *', width: 30 },
            { key: 'kelas_id', name: 'Kelas ID *', width: 15 },
            { key: 'username', name: 'Username', width: 20 },
            { key: 'password', name: 'Password', width: 20 },
            { key: 'email', name: 'Email', width: 25 },
            { key: 'jenis_kelamin', name: 'Jenis Kelamin', width: 15 },
            { key: 'alamat', name: 'Alamat', width: 30 },
            { key: 'telepon_orangtua', name: 'Telepon Orang Tua', width: 18 },
            { key: 'telepon_siswa', name: 'Telepon Siswa', width: 18 },
            { key: 'status', name: 'Status', width: 15 }
        ];
        
        const sampleRows = [
            { 
                nis: '20240001', 
                nama: 'Muhammad Rizki', 
                kelas_id: '1',
                username: 'siswa_20240001',
                password: '20240001@2024',
                email: 'rizki.20240001@student.smk13.sch.id',
                jenis_kelamin: 'L',
                alamat: 'Jakarta Timur',
                telepon_orangtua: '081234567890',
                telepon_siswa: '081234567891',
                status: 'aktif' 
            },
            { 
                nis: '20240002', 
                nama: 'Siti Aminah', 
                kelas_id: '1',
                username: 'siswa_20240002',
                password: '20240002@2024',
                email: 'aminah.20240002@student.smk13.sch.id',
                jenis_kelamin: 'P',
                alamat: 'Bekasi',
                telepon_orangtua: '081234567892',
                telepon_siswa: '081234567893',
                status: 'aktif' 
            }
        ];
        
        const validations = {
            jenis_kelamin: {
                type: 'list',
                allowBlank: true,
                formulae: ['"L,P"']
            },
            status: {
                type: 'list',
                allowBlank: true,
                formulae: ['"aktif,tidak_aktif,lulus,pindah"']
            }
        };
        
        const instructions = [
            '1. Kolom dengan tanda * wajib diisi',
            '2. NIS: Maksimal 30 karakter, harus unik',
            '3. Nama: Maksimal 100 karakter',
            '4. Kelas ID: ID kelas (wajib, referensi ke tabel kelas)',
            '5. Username: Opsional, jika diisi akan membuat akun login. Format: siswa_[NIS]',
            '6. Password: Wajib jika Username diisi. Format default: [NIS]@2024',
            '7. Email: Format email valid, maksimal 100 karakter',
            '8. Jenis Kelamin: L (Laki-laki) atau P (Perempuan)',
            '9. Alamat: Maksimal 255 karakter',
            '10. Telepon Orang Tua: Maksimal 20 karakter',
            '11. Telepon Siswa: Maksimal 20 karakter',
            '12. Status: Pilih "aktif", "tidak_aktif", "lulus", atau "pindah" (default: aktif)',
            '13. Jika NIS sudah ada, data akan diupdate',
            '14. Jika Username sudah ada, data user akan diupdate (kecuali password kosong)',
            '15. Jangan ubah nama kolom di baris header',
            '16. Hapus baris contoh sebelum mengisi data Anda',
            '17. Format file: .xlsx atau .csv',
            '18. Ukuran maksimal: 5MB'
        ];
        
        const workbook = await createTemplate('Siswa', headers, sampleRows, validations, instructions);
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_siswa.xlsx"');
        res.send(buffer);
        
        console.log('✅ Siswa template generated successfully');
    } catch (error) {
        console.error('❌ Error generating Siswa template:', error);
        sendError(res, 'Gagal membuat template Siswa', 500);
    }
});

/**
 * GET /api/admin/templates/jadwal - Generate Jadwal import template
 */
router.get('/jadwal', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        console.log('📄 Generating Jadwal template');
        
        const headers = [
            { key: 'kelas_id', name: 'Kelas ID *', width: 15 },
            { key: 'mapel_id', name: 'Mapel ID *', width: 15 },
            { key: 'guru_id', name: 'Guru ID *', width: 15 },
            { key: 'hari', name: 'Hari *', width: 12 },
            { key: 'jam_ke', name: 'Jam Ke *', width: 10 },
            { key: 'jam_mulai', name: 'Jam Mulai *', width: 12 },
            { key: 'jam_selesai', name: 'Jam Selesai *', width: 12 },
            { key: 'status', name: 'Status', width: 15 }
        ];
        
        const sampleRows = [
            { 
                kelas_id: '1', 
                mapel_id: '1', 
                guru_id: '1',
                hari: 'Senin',
                jam_ke: '1',
                jam_mulai: '07:00',
                jam_selesai: '08:30',
                status: 'aktif' 
            },
            { 
                kelas_id: '1', 
                mapel_id: '2', 
                guru_id: '2',
                hari: 'Senin',
                jam_ke: '2',
                jam_mulai: '08:30',
                jam_selesai: '10:00',
                status: 'aktif' 
            }
        ];
        
        const validations = {
            hari: {
                type: 'list',
                allowBlank: false,
                formulae: ['"Senin,Selasa,Rabu,Kamis,Jumat,Sabtu"']
            },
            status: {
                type: 'list',
                allowBlank: true,
                formulae: ['"aktif,tidak_aktif"']
            }
        };
        
        const instructions = [
            '1. Semua kolom wajib diisi (kecuali Status)',
            '2. Kelas ID: ID kelas (referensi ke tabel kelas)',
            '3. Mapel ID: ID mata pelajaran (referensi ke tabel mapel)',
            '4. Guru ID: ID guru pengampu (referensi ke tabel guru)',
            '5. Hari: Pilih dari dropdown (Senin sampai Sabtu)',
            '6. Jam Ke: Nomor jam pelajaran (contoh: 1, 2, 3)',
            '7. Jam Mulai: Format HH:MM (contoh: 07:00, 08:30)',
            '8. Jam Selesai: Format HH:MM (contoh: 08:30, 10:00)',
            '9. Status: Pilih "aktif" atau "tidak_aktif" (default: aktif)',
            '10. Kombinasi Kelas ID + Hari + Jam Ke harus unik',
            '11. Jika jadwal sudah ada (sama kelas, hari, jam_ke), akan diupdate',
            '12. Jangan ubah nama kolom di baris header',
            '13. Hapus baris contoh sebelum mengisi data Anda',
            '14. Format file: .xlsx atau .csv',
            '15. Ukuran maksimal: 5MB'
        ];
        
        const workbook = await createTemplate('Jadwal', headers, sampleRows, validations, instructions);
        
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_jadwal.xlsx"');
        res.send(buffer);
        
        console.log('✅ Jadwal template generated successfully');
    } catch (error) {
        console.error('❌ Error generating Jadwal template:', error);
        sendError(res, 'Gagal membuat template Jadwal', 500);
    }
});

export default router;


