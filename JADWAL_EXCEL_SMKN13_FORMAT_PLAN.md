# Implementasi Excel Export Format SMKN 13

## 📋 Analisa Struktur Excel (Berdasarkan Foto)

### **Header Structure (Row 1-5)**

```
Row 1: [Empty] | SENIN0 | ... | SENIN | ... (merged cells untuk grup hari)
Row 2: [Empty] | SENIN | SENIN1 | SENIN2 | SENIN3 | SENIN4 | ... | SELASA | ...
Row 3: [KELAS] [JAM KE] | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | [PEMBIASAAN] | [SELASA]
Row 4: [WAKTU] | 06.30-07.15 | 07.15-08.00 | 08.00-08.45 | ... | 15.00-15.45 | 06.30-08.45 | 08.45-07.30
Row 5: [Empty] | GURU | MAPEL | RUANG | (repeat pattern untuk setiap jam)
```

### **Data Structure (Row 6+)**

Setiap kelas menggunakan **3 baris**:

```
Row N+0: [NAMA KELAS] | UPACARA | [MAPEL 1] | [MAPEL 2] | ISTIRAHAT | [MAPEL 3] | ...
Row N+1: [Empty] | PERWALIAN | [RUANG 1] | [RUANG 2] | I | [RUANG 3] | ...
Row N+2: [Empty] | [GURU WALI] | [GURU 1] | [GURU 2] | S | [GURU 3] | ...
```

### **Kolom Layout**

```
Senin: Kolom 4-18 (15 kolom = 5 jam × 3 fields)
  - Jam 1: B-D (Guru, Mapel, Ruang)
  - Jam 2: E-G
  - Jam 3: H-J
  - Jam 4: K-M
  - Jam 5: N-P

Selasa: Kolom 21-36 (similar structure)
Rabu: Kolom 38-54
Kamis: Kolom 57-72
Jumat: Kolom 74-88

Kolom Khusus:
- Kolom U (col 21): PEMBIASAAN
- Kolom V (col 22): SELASA (1)
```

### **Special Content Handling**

**Kegiatan Khusus** (full cell width):
- `UPACARA` - Senin jam 1 (merged 3 cols)
- `PERWALIAN` - merged 3 cols
- `ISTIRAHAT` - merged 3 cols (pink background)
- `DZUHUR/MESJID` - merged 3 cols
- `BPBK` - single cell

**Format Waktu**:
- Normalize dari `06.30` atau `06·30` ke `06.30-07.15`

### **Color Coding**

| Content Type | Background Color | Text Color |
|--------------|------------------|------------|
| ISTIRAHAT | Pink (magenta) | Black/White |
| UPACARA | Yellow | Black |
| TEMA (subject group) | Orange/Pink | Black |
| Regular subjects | Various pastels | Black |
| DZUHUR | Pink | Black |
| PEMBIASAAN | Cyan | Black |

---

## 🔧 Implementation Plan

### **Step 1: Create Excel Builder Utility**

**File**: `backend/export/builders/jadwalSMKN13Builder.js`

```javascript
import ExcelJS from 'exceljs';

/**
 * Build jadwal Excel in SMKN 13 standard format
 * @param {Array} jadwalData - Array of jadwal grouped by kelas
 * @param {Object} options - Additional options (letterhead, etc)
 */
export async function buildJadwalSMKN13Excel(jadwalData, options = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('JADWAL');
  
  // 1. Define column structure
  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const jamPerHari = 12; // Max jam pelajaran per hari
  const colsPerJam = 3; // GURU, MAPEL, RUANG
  
  // 2. Build header structure (Row 1-5)
  await buildHeaderSection(worksheet, hariList, jamPerHari);
  
  // 3. Build data rows for each kelas
  let currentRow = 6;
  for (const kelasData of jadwalData) {
    currentRow = await buildKelasRows(worksheet, kelasData, currentRow, hariList, jamPerHari);
  }
  
  // 4. Apply styling and formatting
  applyWorksheetFormatting(worksheet);
  
  // 5. Add letterhead if configured
  if (options.letterhead && options.letterhead.enabled) {
    await addLetterhead(worksheet, options.letterhead);
  }
  
  return workbook;
}

/**
 * Build header section (Row 1-5)
 */
async function buildHeaderSection(worksheet, hariList, jamPerHari) {
  // Row 1: Hari group headers (merged cells)
  // Row 2: Sub-headers (SENIN, SENIN1, SENIN2, etc)
  // Row 3: JAM KE (1, 2, 3, ...)
  // Row 4: WAKTU (06.30-07.15, etc)
  // Row 5: Field labels (GURU, MAPEL, RUANG pattern)
  
  let colIndex = 1;
  
  // Column A: KELAS
  worksheet.getCell('A3').value = 'KELAS';
  worksheet.getCell('A4').value = 'WAKTU';
  
  // Column B: JAM KE
  worksheet.getCell('B3').value = 'JAM KE';
  
  colIndex = 3; // Start from column C
  
  for (const hari of hariList) {
    const startCol = colIndex;
    const endCol = colIndex + (jamPerHari * 3) - 1;
    
    // Row 1: Merge hari name across all columns
    worksheet.mergeCells(1, startCol, 1, endCol);
    worksheet.getCell(1, startCol).value = hari.toUpperCase();
    worksheet.getCell(1, startCol).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(1, startCol).font = { bold: true, size: 12 };
    worksheet.getCell(1, startCol).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Gray
    };
    
    // Row 2-5: For each jam pelajaran
    for (let jam = 1; jam <= jamPerHari; jam++) {
      const jamStartCol = startCol + ((jam - 1) * 3);
      
      // Row 2: Sub-header (SENIN, SENIN1, etc)
      const subHeader = jam === 1 ? hari.toUpperCase() : `${hari.toUpperCase()}${jam}`;
      worksheet.mergeCells(2, jamStartCol, 2, jamStartCol + 2);
      worksheet.getCell(2, jamStartCol).value = subHeader;
      worksheet.getCell(2, jamStartCol).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Row 3: JAM KE
      worksheet.mergeCells(3, jamStartCol, 3, jamStartCol + 2);
      worksheet.getCell(3, jamStartCol).value = jam;
      worksheet.getCell(3, jamStartCol).alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getCell(3, jamStartCol).font = { bold: true };
      
      // Row 4: WAKTU (placeholder, will be filled from data)
      worksheet.mergeCells(4, jamStartCol, 4, jamStartCol + 2);
      worksheet.getCell(4, jamStartCol).value = ''; // Will be filled dynamically
      worksheet.getCell(4, jamStartCol).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Row 5: Field labels (GURU, MAPEL, RUANG)
      worksheet.getCell(5, jamStartCol).value = 'GURU';
      worksheet.getCell(5, jamStartCol + 1).value = 'MAPEL';
      worksheet.getCell(5, jamStartCol + 2).value = 'RUANG';
      
      for (let i = 0; i < 3; i++) {
        const cell = worksheet.getCell(5, jamStartCol + i);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, size: 9 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6FA' } // Light purple
        };
      }
    }
    
    colIndex = endCol + 1;
  }
  
  // Add special columns (PEMBIASAAN, SELASA)
  const pembiasaanCol = colIndex;
  worksheet.getCell(3, pembiasaanCol).value = 'PEMBIASAAN';
  worksheet.getCell(3, pembiasaanCol).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(3, pembiasaanCol).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00FFFF' } // Cyan
  };
  
  const selasaCol = pembiasaanCol + 1;
  worksheet.getCell(3, selasaCol).value = 'SELASA';
  worksheet.getCell(3, selasaCol).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell(3, selasaCol).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' } // Light gray
  };
}

/**
 * Build 3 rows for a single kelas
 */
async function buildKelasRows(worksheet, kelasData, startRow, hariList, jamPerHari) {
  const { kelas, jadwal } = kelasData;
  
  // Row 1: Nama Kelas + MAPEL data
  worksheet.getCell(startRow, 1).value = kelas.nama_kelas;
  worksheet.getCell(startRow, 1).font = { bold: true };
  worksheet.getCell(startRow, 1).alignment = { vertical: 'middle' };
  
  // Row 2: Empty + RUANG data
  // Row 3: Empty + GURU data
  
  let colIndex = 3; // Start from column C
  
  for (const hari of hariList) {
    const hariJadwal = jadwal.filter(j => j.hari === hari).sort((a, b) => a.jam_ke - b.jam_ke);
    
    for (let jam = 1; jam <= jamPerHari; jam++) {
      const jamData = hariJadwal.find(j => j.jam_ke === jam);
      const jamStartCol = colIndex + ((jam - 1) * 3);
      
      if (jamData) {
        if (jamData.type === 'jadwal_khusus') {
          // Special content - merge across 3 columns
          const specialType = jamData.jenis_kegiatan.toLowerCase();
          
          worksheet.mergeCells(startRow, jamStartCol, startRow, jamStartCol + 2);
          worksheet.getCell(startRow, jamStartCol).value = jamData.nama_kegiatan.toUpperCase();
          worksheet.getCell(startRow, jamStartCol).alignment = { horizontal: 'center', vertical: 'middle' };
          worksheet.getCell(startRow, jamStartCol).font = { bold: true };
          
          // Apply color based on type
          let bgColor = 'FFFFFF'; // Default white
          if (specialType === 'istirahat') bgColor = 'FFFF69B4'; // Pink
          else if (specialType === 'upacara') bgColor = 'FFFFFF00'; // Yellow
          else if (specialType === 'perwalian') bgColor = 'FFFFFF00'; // Yellow
          
          for (let row = startRow; row < startRow + 3; row++) {
            for (let col = 0; col < 3; col++) {
              worksheet.getCell(row, jamStartCol + col).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: bgColor }
              };
            }
          }
          
          // Row 2-3: Merged cells for special content
          worksheet.mergeCells(startRow + 1, jamStartCol, startRow + 1, jamStartCol + 2);
          worksheet.mergeCells(startRow + 2, jamStartCol, startRow + 2, jamStartCol + 2);
          
          if (specialType === 'istirahat') {
            worksheet.getCell(startRow + 1, jamStartCol).value = 'I';
            worksheet.getCell(startRow + 2, jamStartCol).value = 'S';
          } else if (specialType === 'perwalian') {
            worksheet.getCell(startRow + 1, jamStartCol).value = 'PERWALIAN';
            worksheet.getCell(startRow + 2, jamStartCol).value = jamData.guru_wali || '';
          }
          
        } else {
          // Regular subject - fill GURU, MAPEL, RUANG
          worksheet.getCell(startRow, jamStartCol).value = jamData.nama_guru || '';
          worksheet.getCell(startRow, jamStartCol + 1).value = jamData.nama_mapel || '';
          worksheet.getCell(startRow, jamStartCol + 2).value = jamData.ruang || '';
          
          worksheet.getCell(startRow + 1, jamStartCol).value = ''; // RUANG row
          worksheet.getCell(startRow + 2, jamStartCol).value = ''; // GURU row (kode singkat)
          
          // Apply cell alignment
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              const cell = worksheet.getCell(startRow + row, jamStartCol + col);
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            }
          }
        }
      } else {
        // Empty slot - add borders
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const cell = worksheet.getCell(startRow + row, jamStartCol + col);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }
      }
    }
    
    colIndex += jamPerHari * 3;
  }
  
  return startRow + 3; // Return next available row
}

/**
 * Apply general formatting
 */
function applyWorksheetFormatting(worksheet) {
  // Set column widths
  worksheet.getColumn(1).width = 15; // KELAS column
  worksheet.getColumn(2).width = 10; // JAM KE column
  
  // Set default width for data columns
  for (let col = 3; col <= 90; col++) {
    worksheet.getColumn(col).width = 8;
  }
  
  // Set row heights
  for (let row = 1; row <= worksheet.rowCount; row++) {
    if (row <= 5) {
      worksheet.getRow(row).height = 20; // Header rows
    } else {
      worksheet.getRow(row).height = 18; // Data rows
    }
  }
  
  // Apply borders to all cells
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
}

/**
 * Add letterhead if configured
 */
async function addLetterhead(worksheet, letterhead) {
  // Insert rows at top for letterhead
  worksheet.spliceRows(1, 0, [], [], []); // Insert 3 blank rows
  
  // Add letterhead text in merged cell
  worksheet.mergeCells('A1:Z3');
  const headerCell = worksheet.getCell('A1');
  headerCell.value = letterhead.lines.join('\n');
  headerCell.alignment = { 
    horizontal: letterhead.alignment || 'center', 
    vertical: 'middle',
    wrapText: true
  };
  headerCell.font = { bold: true, size: 14 };
  
  // Add logos if available (would need image buffer processing)
  // ... implementation for logos
}

export default buildJadwalSMKN13Excel;
```

---

### **Step 2: Create API Endpoint**

**File**: `backend/routes/export.js`

Add new endpoint:

```javascript
// GET /api/export/jadwal-smkn13/excel - Export jadwal dalam format SMKN 13
router.get('/jadwal-smkn13/excel', async (req, res) => {
  try {
    console.log('📊 Exporting jadwal in SMKN 13 format...');
    
    // 1. Fetch all jadwal grouped by kelas
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
        NULL as nama_kegiatan
      FROM kelas k
      LEFT JOIN jadwal j ON k.id_kelas = j.kelas_id AND j.status = 'aktif'
      LEFT JOIN mapel m ON j.mapel_id = m.id_mapel
      LEFT JOIN guru g ON j.guru_id = g.id_guru
      
      UNION ALL
      
      SELECT 
        k.id_kelas,
        k.nama_kelas,
        k.tingkat,
        jk.id as id_jadwal,
        jk.hari,
        NULL as jam_ke,
        jk.jam_mulai,
        jk.jam_selesai,
        NULL as mapel_id,
        NULL as nama_mapel,
        NULL as kode_mapel,
        NULL as guru_id,
        NULL as nama_guru,
        NULL as nip,
        'jadwal_khusus' as type,
        jk.jenis_kegiatan,
        jk.nama_kegiatan
      FROM kelas k
      LEFT JOIN jadwal_khusus jk ON (k.id_kelas = jk.kelas_id OR jk.kelas_id IS NULL) 
        AND jk.status = 'aktif'
      
      ORDER BY tingkat, nama_kelas, FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), jam_ke
    `);
    
    // 2. Group by kelas
    const kelasList = {};
    for (const row of jadwalData) {
      if (!kelasList[row.id_kelas]) {
        kelasList[row.id_kelas] = {
          kelas: {
            id_kelas: row.id_kelas,
            nama_kelas: row.nama_kelas,
            tingkat: row.tingkat
          },
          jadwal: []
        };
      }
      
      if (row.id_jadwal) {
        kelasList[row.id_kelas].jadwal.push(row);
      }
    }
    
    const kelasArray = Object.values(kelasList);
    
    // 3. Fetch letterhead config
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
    
    // 4. Build Excel workbook
    const workbook = await buildJadwalSMKN13Excel(kelasArray, {
      letterhead: letterheadConfig
    });
    
    // 5. Send response
    const filename = `Jadwal_SMKN13_${new Date().toISOString().split('T')[0]}.xlsx`;
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
```

---

### **Step 3: Frontend Integration**

**File**: `frontend/src/components/admin/GlobalScheduleView.tsx`

Add export button:

```typescript
const handleExportSMKN13 = async () => {
  try {
    const response = await fetch('/api/export/jadwal-smkn13/excel', {
      credentials: 'include',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jadwal_SMKN13_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    
    toast({ title: 'Berhasil', description: 'Jadwal berhasil diekspor dalam format SMKN 13' });
  } catch (error) {
    toast({ title: 'Error', description: 'Gagal mengekspor jadwal', variant: 'destructive' });
  }
};

// In JSX:
<Button onClick={handleExportSMKN13} variant="outline" size="sm">
  <Download className="w-4 h-4 mr-2" />
  Export SMKN 13
</Button>
```

---

## 🧪 Testing Checklist

- [ ] Header structure (Row 1-5) matches foto
- [ ] Column widths and heights correct
- [ ] KELAS data appears in correct rows
- [ ] MAPEL, RUANG, GURU fields populate correctly
- [ ] Special content (ISTIRAHAT, UPACARA, PERWALIAN) renders correctly
- [ ] Color coding matches foto
- [ ] Merged cells work correctly
- [ ] Letterhead integration works
- [ ] Export button triggers download
- [ ] Excel file opens correctly in Microsoft Excel
- [ ] All borders and formatting preserved

---

## 📝 Key Decisions

1. **3-row pattern per kelas** - Maintains SMKN 13 standard format
2. **Merged cells for special content** - Better visual representation
3. **Dynamic column calculation** - Supports variable jam count
4. **Color coding preserved** - Uses foto as reference
5. **Letterhead optional** - Can be enabled/disabled via system_config

---

## 🚀 Implementation Status

1. ✅ Create `jadwalSMKN13Builder.js` utility
2. ✅ Add `/api/export/jadwal-smkn13/excel` endpoint
3. ✅ Integrate export button in frontend
4. ✅ **UPDATED**: Simplified structure to "1 kelas = 3 baris menderet kebawah"
5. ✅ Refine formatting and colors
6. ✅ Add letterhead support
7. ⏳ Final testing and validation

## 📝 Key Changes (Latest Update)

### Header Structure (Row 1-4)
- **Row 1**: HARI (SENIN, SELASA, RABU, KAMIS, JUMAT) - each merged across 12 jam
- **Row 2**: JAM KE (1, 2, 3, ..., 12) - one column per jam
- **Row 3**: WAKTU (06.30 - 07.15, etc)
- **Row 4**: Optional labels (currently empty)

### Data Rows (Row 5+)
- **1 kelas = 3 baris**:
  - Row N: MAPEL untuk semua hari/jam
  - Row N+1: RUANG untuk semua hari/jam
  - Row N+2: GURU untuk semua hari/jam
- **Column A**: Nama kelas (merged across 3 rows)
- **Columns B-61**: Data for Senin-Jumat (12 jam × 5 hari = 60 columns)

### Structure Simplification
- Changed from **3 columns per jam** (GURU, MAPEL, RUANG) to **1 column per jam**
- Data stacks vertically in 3 rows instead of horizontally
- More compact and matches user's requirement: "satu baris untuk 1 kelas nya dan akan menderet kebawah"

