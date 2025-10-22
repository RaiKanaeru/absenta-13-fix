import ExcelJS from 'exceljs';

/**
 * Build jadwal Excel in SMKN 13 standard format
 * Format: 1 kelas = 3 baris (MAPEL, RUANG, GURU) yang menderet kebawah
 * 
 * @param {Array} jadwalData - Array of jadwal grouped by kelas
 * @param {Object} options - Additional options (letterhead, etc)
 * @returns {ExcelJS.Workbook}
 */
export async function buildJadwalSMKN13Excel(jadwalData, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('JADWAL');
  
  // Define structure
  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const maxJamPerHari = 12; // Maximum jam pelajaran per hari
  
  // Calculate time slots for each jam
  const timeSlots = generateTimeSlots();
  
  // Build header section (Row 1-4)
  buildHeaderSection(worksheet, hariList, maxJamPerHari, timeSlots);
  
  // Build data rows for each kelas (3 rows per kelas)
  let currentRow = 5;
  for (const kelasData of jadwalData) {
    currentRow = buildKelasRows(worksheet, kelasData, currentRow, hariList, maxJamPerHari);
  }
  
  // Apply general formatting
  applyWorksheetFormatting(worksheet, hariList, maxJamPerHari);
  
  // Add letterhead if configured
  if (options.letterhead && options.letterhead.enabled) {
    await addLetterhead(worksheet, options.letterhead);
  }
  
  return workbook;
}

/**
 * Generate time slots for each jam pelajaran
 */
function generateTimeSlots() {
  const slots = [];
  let startHour = 6;
  let startMinute = 30;
  const duration = 45; // minutes per jam
  
  for (let i = 0; i < 12; i++) {
    const endMinute = startMinute + duration;
    const endHour = startHour + Math.floor(endMinute / 60);
    const finalEndMinute = endMinute % 60;
    
    const startTime = `${String(startHour).padStart(2, '0')}.${String(startMinute).padStart(2, '0')}`;
    const endTime = `${String(endHour).padStart(2, '0')}.${String(finalEndMinute).padStart(2, '0')}`;
    
    slots.push(`${startTime} - ${endTime}`);
    
    // Next slot
    startMinute = finalEndMinute;
    startHour = endHour;
    
    // Add break time if needed (example: after jam 3, add 15 min break)
    if (i === 2 || i === 5) {
      startMinute += 15;
      if (startMinute >= 60) {
        startHour += Math.floor(startMinute / 60);
        startMinute = startMinute % 60;
      }
    }
  }
  
  return slots;
}

/**
 * Build header section (Row 1-4)
 * Row 1: HARI (merged per day)
 * Row 2: JAM KE (1, 2, 3, ...)
 * Row 3: WAKTU (time ranges)
 * Row 4: (Optional) Labels
 */
function buildHeaderSection(worksheet, hariList, maxJamPerHari, timeSlots) {
  // Column A: KELAS label
  worksheet.mergeCells(1, 1, 4, 1);
  worksheet.getCell(1, 1).value = 'KELAS';
  worksheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(1, 1).font = { bold: true, size: 12 };
  worksheet.getCell(1, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  let colIndex = 2; // Start from column B
  
  // Loop through each day
  for (const hari of hariList) {
    const startCol = colIndex;
    const endCol = colIndex + maxJamPerHari - 1;
    
    // Row 1: HARI (merged across all jam for this day)
    worksheet.mergeCells(1, startCol, 1, endCol);
    const hariCell = worksheet.getCell(1, startCol);
    hariCell.value = hari.toUpperCase();
    hariCell.alignment = { horizontal: 'center', vertical: 'middle' };
    hariCell.font = { bold: true, size: 12 };
    hariCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Row 2, 3, 4: For each jam pelajaran
    for (let jam = 1; jam <= maxJamPerHari; jam++) {
      const jamCol = startCol + (jam - 1);
      
      // Row 2: JAM KE
      const jamCell = worksheet.getCell(2, jamCol);
      jamCell.value = jam;
      jamCell.alignment = { horizontal: 'center', vertical: 'middle' };
      jamCell.font = { bold: true, size: 10 };
      jamCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      // Row 3: WAKTU
      const waktuCell = worksheet.getCell(3, jamCol);
      waktuCell.value = timeSlots[jam - 1] || '';
      waktuCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      waktuCell.font = { size: 8 };
      waktuCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
      
      // Row 4: Empty or labels (optional)
      const labelCell = worksheet.getCell(4, jamCol);
      labelCell.value = '';
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
    }
    
    colIndex = endCol + 1;
  }
  
  // Apply borders to header
  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= colIndex - 1; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    }
  }
}

/**
 * Build 3 rows for a single kelas
 * Row 1: MAPEL untuk semua hari/jam
 * Row 2: RUANG untuk semua hari/jam
 * Row 3: GURU untuk semua hari/jam
 */
function buildKelasRows(worksheet, kelasData, startRow, hariList, maxJamPerHari) {
  const { kelas, jadwal } = kelasData;
  
  // Column A: Nama Kelas (merged across 3 rows)
  worksheet.mergeCells(startRow, 1, startRow + 2, 1);
  const kelasCell = worksheet.getCell(startRow, 1);
  kelasCell.value = kelas.nama_kelas;
  kelasCell.font = { bold: true, size: 11 };
  kelasCell.alignment = { horizontal: 'center', vertical: 'middle' };
  kelasCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB0E0E6' } // Powder blue
  };
  
  let colIndex = 2; // Start from column B
  
  // Process each day
  for (const hari of hariList) {
    const hariJadwal = jadwal.filter(j => j.hari === hari).sort((a, b) => (a.jam_ke || 0) - (b.jam_ke || 0));
    
    for (let jam = 1; jam <= maxJamPerHari; jam++) {
      const jamCol = colIndex + (jam - 1);
      const jamData = hariJadwal.find(j => j.jam_ke === jam || (j.type === 'jadwal_khusus' && !j.jam_ke));
      
      if (jamData) {
        if (jamData.type === 'jadwal_khusus') {
          // Special content - merge across 3 rows
          worksheet.mergeCells(startRow, jamCol, startRow + 2, jamCol);
          const specialCell = worksheet.getCell(startRow, jamCol);
          
          const jenis = (jamData.jenis_kegiatan || '').toLowerCase();
          let displayText = jamData.nama_kegiatan.toUpperCase();
          let bgColor = 'FFFFFFFF'; // Default white
          
          if (jenis === 'istirahat') {
            bgColor = 'FFFF69B4'; // Hot pink
            displayText = 'ISTIRAHAT';
          } else if (jenis === 'upacara') {
            bgColor = 'FFFFFF00'; // Yellow
            displayText = 'UPACARA';
          } else if (jenis === 'perwalian') {
            bgColor = 'FFFFFF00'; // Yellow
            displayText = 'PERWALIAN';
          } else if (jenis === 'dzuhur' || jenis === 'sholat') {
            bgColor = 'FFFF69B4'; // Pink
            displayText = 'DZUHUR';
          } else if (jenis === 'bpbk') {
            bgColor = 'FFFFA500'; // Orange
            displayText = 'BPBK';
          }
          
          specialCell.value = displayText;
          specialCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          specialCell.font = { bold: true, size: 10 };
          specialCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          
        } else {
          // Regular jadwal - 3 rows (MAPEL, RUANG, GURU)
          
          // Row 1: MAPEL
          const mapelCell = worksheet.getCell(startRow, jamCol);
          mapelCell.value = jamData.nama_mapel || jamData.kode_mapel || '';
          mapelCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          mapelCell.font = { bold: true, size: 9 };
          
          // Row 2: RUANG
          const ruangCell = worksheet.getCell(startRow + 1, jamCol);
          ruangCell.value = jamData.ruang || jamData.kode_ruang || '';
          ruangCell.alignment = { horizontal: 'center', vertical: 'middle' };
          ruangCell.font = { size: 9 };
          
          // Row 3: GURU
          const guruCell = worksheet.getCell(startRow + 2, jamCol);
          guruCell.value = jamData.nama_guru || '';
          guruCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          guruCell.font = { size: 9 };
          
          // Apply subtle background colors
          const colors = ['FFE0F7FA', 'FFFFF9C4', 'FFF1F8E9', 'FFE8EAF6', 'FFFCE4EC', 'FFE0F2F1'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          
          [mapelCell, ruangCell, guruCell].forEach(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: randomColor }
            };
          });
        }
      }
      
      // Apply borders to all 3 cells (column) in this jam slot
      for (let row = 0; row < 3; row++) {
        const cell = worksheet.getCell(startRow + row, jamCol);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }
    }
    
    colIndex += maxJamPerHari;
  }
  
  return startRow + 3; // Return next available row (each kelas uses 3 rows)
}

/**
 * Apply general formatting to worksheet
 */
function applyWorksheetFormatting(worksheet, hariList, maxJamPerHari) {
  // Set column widths
  worksheet.getColumn(1).width = 18; // KELAS column (wider for class names)
  
  // Set width for all jam columns (1 column per jam)
  const totalJamCols = hariList.length * maxJamPerHari;
  for (let col = 2; col <= totalJamCols + 1; col++) {
    worksheet.getColumn(col).width = 10; // Width for jam cells
  }
  
  // Set row heights
  worksheet.getRow(1).height = 22; // Hari header
  worksheet.getRow(2).height = 20; // JAM KE
  worksheet.getRow(3).height = 28; // WAKTU (needs more space for time ranges)
  worksheet.getRow(4).height = 18; // Optional label row
  
  // Data rows (each kelas = 3 rows)
  for (let row = 5; row <= worksheet.rowCount; row++) {
    worksheet.getRow(row).height = 18;
  }
}

/**
 * Add letterhead to worksheet
 */
async function addLetterhead(worksheet, letterhead) {
  // Insert blank rows at top for letterhead
  worksheet.spliceRows(1, 0, [], [], [], []); // Insert 4 blank rows for letterhead
  
  // Merge cells for letterhead (across all columns)
  const totalCols = 1 + (5 * 12); // Column A + 60 jam columns
  worksheet.mergeCells(1, 1, 4, totalCols);
  
  const headerCell = worksheet.getCell(1, 1);
  headerCell.value = letterhead.lines.join('\n');
  headerCell.alignment = { 
    horizontal: letterhead.alignment || 'center', 
    vertical: 'middle',
    wrapText: true
  };
  headerCell.font = { bold: true, size: 14 };
  headerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' }
  };
  
  // Add border
  headerCell.border = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    left: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } },
    right: { style: 'medium', color: { argb: 'FF000000' } }
  };
  
  // Set row height for letterhead
  worksheet.getRow(1).height = 80;
}

export default buildJadwalSMKN13Excel;

