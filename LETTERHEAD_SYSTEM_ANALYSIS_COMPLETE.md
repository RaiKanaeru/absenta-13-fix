# Analisis Sistem Kop Laporan (Letterhead) - Complete Analysis

## 📋 Executive Summary

Sistem kop laporan (letterhead) di Absenta menggunakan **database `system_config`** sebagai storage utama, BUKAN file JSON. File `backend/config/report-letterhead.json` **TIDAK DIGUNAKAN** oleh sistem dan memiliki struktur yang berbeda/tidak compatible.

---

## 🏗️ Arsitektur Sistem Letterhead

### 1. **Storage System**

#### Primary Storage: Database `system_config`
```sql
CREATE TABLE system_config (
  config_key VARCHAR(255) PRIMARY KEY,
  config_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Key Format**: `letterhead_{reportKey}`

**Available Report Keys**:
- `letterhead_global` - Default untuk semua laporan
- `letterhead_presensi-siswa` - Presensi siswa
- `letterhead_rekap-ketidakhadiran` - Rekap ketidakhadiran siswa
- `letterhead_rekap-ketidakhadiran-guru` - Rekap ketidakhadiran guru
- `letterhead_banding-absen` - Riwayat banding absen
- `letterhead_jadwal-global` - Jadwal global
- `letterhead_jadwal-smkn13` - Jadwal format SMKN 13

**Struktur Data** (JSON string di `config_value`):
```json
{
  "enabled": true,
  "logoLeftUrl": "/uploads/letterheads/logo-jawa-barat.png",
  "logoRightUrl": "/uploads/letterheads/logo-smk.png",
  "lines": [
    "PEMERINTAH PROVINSI DKI JAKARTA",
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
    "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
  ],
  "alignment": "center"
}
```

#### Secondary: File JSON (TIDAK DIGUNAKAN)
File: `backend/config/report-letterhead.json`

**Status**: ❌ **TIDAK DIGUNAKAN OLEH SISTEM**

**Masalah dengan file JSON**:
1. **Struktur tidak compatible**:
   ```json
   {
     "logo": "",           // ❌ Sistem pakai: "logoLeftUrl"
     "logoKiri": "",       // ❌ Sistem pakai: "logoLeftUrl"
     "logoKanan": "",      // ❌ Sistem pakai: "logoRightUrl"
     "lines": [...],
     "alignment": "center"
   }
   ```

2. **Typo dalam data**:
   ```json
   "PEMERINTAH DAERAH PROVINSI DKI JAKARTAA"  // ❌ 2 A di akhir
   ```

3. **Tidak dibaca oleh kode**:
   - Tidak ada import/require file ini di server_modern.js
   - Tidak ada fungsi untuk load dari file JSON
   - Sistem langsung query database atau pakai default hardcoded

---

## 🔌 API Endpoints

### GET `/api/admin/letterhead?reportKey={key}`
**Purpose**: Load letterhead configuration  
**Auth**: Admin, Guru  
**Flow**:
```javascript
1. Terima reportKey dari query parameter
2. Query database: SELECT config_value FROM system_config 
   WHERE config_key = 'letterhead_{reportKey}'
3. Jika ada data di database:
   - Parse JSON dari config_value
   - Return parsed config
4. Jika tidak ada data:
   - Return default config (hardcoded)
```

**Default Config** (hardcoded di `server_modern.js:6237-6249`):
```javascript
{
  enabled: true,
  logo: "",  // Legacy field, tidak dipakai
  logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
  logoRightUrl: "/uploads/letterheads/logo-smk.png",
  lines: [
    "PEMERINTAH DAERAH PROVINSI JAWA BARAT",  // ❗ Note: "JAWA BARAT" bukan "DKI JAKARTA"
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
  ],
  alignment: "center"
}
```

### POST `/api/admin/letterhead`
**Purpose**: Save letterhead configuration  
**Auth**: Admin only  
**Body**:
```json
{
  "reportKey": "global",
  "config": {
    "enabled": true,
    "logoLeftUrl": "data:image/png;base64,..." or "/path/to/image.png",
    "logoRightUrl": "data:image/png;base64,..." or "/path/to/image.png",
    "lines": ["Line 1", "Line 2", ...],
    "alignment": "center"
  }
}
```

**Flow**:
```javascript
1. Validate config object
2. Process images (if base64):
   a. Validate image size (max 5MB)
   b. Compress image to max 500KB
   c. Return compressed base64
3. Build config_key: 'letterhead_{reportKey}'
4. Save to database:
   INSERT INTO system_config (config_key, config_value)
   VALUES (config_key, JSON.stringify(config))
   ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
5. Return success
```

**Image Processing**:
- **Max input size**: 5MB per image
- **Compression**: Auto compress to max 500KB
- **Max dimensions**: 800x600 pixels
- **Quality**: 80%
- **Supported fields**: `logo`, `logoLeftUrl`, `logoRightUrl`

### GET `/api/admin/letterhead/preview?reportKey={key}`
**Purpose**: Preview letterhead in HTML  
**Auth**: Admin, Guru  
**Output**: HTML page with letterhead preview

---

## 🎨 Frontend Integration

### Component: `ReportLetterheadSettings.tsx`
**Location**: `frontend/src/components/ReportLetterheadSettings.tsx`  
**Purpose**: UI untuk manage letterhead configuration

**Features**:
- Select report type (dropdown)
- Upload logo kiri & kanan (drag & drop or file picker)
- Edit header lines (dynamic array)
- Choose text alignment (left, center, right)
- Preview letterhead
- Save configuration

**API Calls**:
```typescript
// Load config
const response = await fetch('/api/admin/letterhead?reportKey=global');
const data = await response.json();
setConfig(data.data);

// Save config
await fetch('/api/admin/letterhead', {
  method: 'POST',
  body: JSON.stringify({
    reportKey: 'global',
    config: {...}
  })
});

// Preview
window.open('/api/admin/letterhead/preview?reportKey=global', '_blank');
```

### Hook: `useLetterhead`
**Location**: `frontend/src/hooks/useLetterhead.ts`  
**Purpose**: React hook untuk load letterhead config

```typescript
const { letterhead, loading, error } = useLetterhead('presensi-siswa');
```

### Component: `ExcelPreview.tsx`
**Integration**: Menampilkan letterhead di preview Excel/PDF

```typescript
<ExcelPreview
  data={reportData}
  columns={columns}
  reportKey="presensi-siswa"  // ← Triggers letterhead load
  showLetterhead={true}
/>
```

---

## 📊 Export System Integration

### Excel Export (`backend/export/excelBuilder.js`)
```javascript
async function buildExcel(options) {
  const { title, subtitle, reportPeriod, letterhead, columns, rows } = options;
  
  // Add letterhead to workbook
  if (letterhead && letterhead.enabled) {
    // Row 1-2: Logos (if provided)
    if (letterhead.logoLeftUrl) {
      const logoLeft = await loadImage(letterhead.logoLeftUrl);
      worksheet.addImage(logoLeft, 'A1:B2');
    }
    
    if (letterhead.logoRightUrl) {
      const logoRight = await loadImage(letterhead.logoRightUrl);
      worksheet.addImage(logoRight, 'K1:L2');
    }
    
    // Row 3-N: Header lines
    let currentRow = 3;
    letterhead.lines.forEach(line => {
      worksheet.getRow(currentRow).getCell(1).value = line;
      worksheet.getRow(currentRow).alignment = { 
        horizontal: letterhead.alignment 
      };
      currentRow++;
    });
    
    // Add separator line
    worksheet.getRow(currentRow).border = { top: { style: 'thick' } };
  }
}
```

### PDF Export (`backend/export/pdfBuilder.js`)
```javascript
async function buildPDF(options) {
  const { title, subtitle, reportPeriod, letterhead, columns, rows } = options;
  
  const doc = new jsPDF();
  
  // Add letterhead
  if (letterhead && letterhead.enabled) {
    let yPos = 10;
    
    // Add logos
    if (letterhead.logoLeftUrl) {
      doc.addImage(letterhead.logoLeftUrl, 'PNG', 10, yPos, 30, 30);
    }
    if (letterhead.logoRightUrl) {
      doc.addImage(letterhead.logoRightUrl, 'PNG', 170, yPos, 30, 30);
    }
    
    yPos += 35;
    
    // Add header lines
    letterhead.lines.forEach(line => {
      doc.setFontSize(line.includes('SMK') ? 16 : 12);
      doc.text(line, 105, yPos, { align: letterhead.alignment });
      yPos += 7;
    });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(10, yPos, 200, yPos);
  }
}
```

---

## 🔧 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LETTERHEAD SYSTEM                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Admin Dashboard  │
│   - Kop Laporan  │
└────────┬─────────┘
         │ 1. User klik "Kop Laporan"
         ↓
┌──────────────────────────────┐
│ ReportLetterheadSettings.tsx │
│  - Load config dari API      │
│  - Edit logo & lines         │
│  - Preview letterhead        │
└────────┬─────────────────────┘
         │ 2. Load existing config
         ↓
┌──────────────────────────────┐
│ GET /api/admin/letterhead    │
│   ?reportKey=global          │
└────────┬─────────────────────┘
         │ 3. Query database
         ↓
┌──────────────────────────────┐
│ MySQL: system_config         │
│  config_key =                │
│    'letterhead_global'       │
│  config_value = {...JSON...} │
└────────┬─────────────────────┘
         │ 4. Return config or default
         ↓
┌──────────────────────────────┐
│ Frontend: Display in UI      │
│  - Show current logos        │
│  - Show header lines         │
│  - Allow edit                │
└────────┬─────────────────────┘
         │ 5. User edit & save
         ↓
┌──────────────────────────────┐
│ POST /api/admin/letterhead   │
│  Body: {reportKey, config}   │
└────────┬─────────────────────┘
         │ 6. Process images (compress)
         ↓
┌──────────────────────────────┐
│ Image Compression            │
│  - Validate size (max 5MB)   │
│  - Compress to max 500KB     │
│  - Resize to 800x600         │
└────────┬─────────────────────┘
         │ 7. Save to database
         ↓
┌──────────────────────────────┐
│ INSERT/UPDATE system_config  │
│  ON DUPLICATE KEY UPDATE     │
└────────┬─────────────────────┘
         │ 8. Success response
         ↓
┌──────────────────────────────┐
│ Frontend: Show success toast │
└──────────────────────────────┘

═══════════════════════════════════════════════════════════

WHEN EXPORTING REPORT:

┌──────────────────────────────┐
│ User: Export Report          │
│  - Presensi Siswa            │
│  - Rekap Ketidakhadiran      │
│  - etc.                      │
└────────┬─────────────────────┘
         │ 1. Request export
         ↓
┌──────────────────────────────┐
│ GET /api/export/{report}     │
│  ?startDate=...&endDate=...  │
└────────┬─────────────────────┘
         │ 2. Fetch data from DB
         ↓
┌──────────────────────────────┐
│ Query: Report Data           │
│  - Students/Teachers         │
│  - Attendance records        │
│  - Aggregated statistics     │
└────────┬─────────────────────┘
         │ 3. Fetch letterhead config
         ↓
┌──────────────────────────────┐
│ Query: Letterhead Config     │
│  SELECT config_value FROM    │
│  system_config WHERE         │
│  config_key = 'letterhead_   │
│    {report-name}'            │
└────────┬─────────────────────┘
         │ 4. If not found, use default
         ↓
┌──────────────────────────────┐
│ Default Letterhead (fallback)│
│  - Hardcoded in code         │
│  - Logo paths, header lines  │
└────────┬─────────────────────┘
         │ 5. Build Excel/PDF
         ↓
┌──────────────────────────────┐
│ buildExcel() / buildPDF()    │
│  - Add letterhead to file    │
│  - Add report title          │
│  - Add data table            │
└────────┬─────────────────────┘
         │ 6. Return file to user
         ↓
┌──────────────────────────────┐
│ Browser: Download file       │
│  - presensi-siswa.xlsx       │
│  - rekap-ketidakhadiran.pdf  │
└──────────────────────────────┘
```

---

## ⚠️ Masalah yang Ditemukan

### 1. **File JSON Tidak Digunakan**
**File**: `backend/config/report-letterhead.json`

**Status**: ❌ File ini TIDAK pernah dibaca oleh sistem

**Bukti**:
```bash
# Cari semua reference ke file JSON ini
$ grep -r "report-letterhead.json" backend/
# Result: TIDAK ADA reference

$ grep -r "report-letterhead.json" server_modern.js
# Result: TIDAK ADA reference
```

**Kesimpulan**: File JSON ini hanya template/dokumentasi, bukan bagian dari sistem yang berjalan.

### 2. **Struktur Tidak Compatible**

**File JSON**:
```json
{
  "logo": "",
  "logoKiri": "",
  "logoKanan": ""
}
```

**Sistem Actual**:
```json
{
  "logoLeftUrl": "",
  "logoRightUrl": ""
}
```

❌ Field names berbeda → Tidak compatible!

### 3. **Typo dalam Data**
```json
"PEMERINTAH DAERAH PROVINSI DKI JAKARTAA"  // ← 2 A
```

### 4. **Tidak Ada Migration Script**
Tidak ada script untuk:
- Load file JSON ke database
- Sync antara file JSON dan database
- Initialize default letterhead di database

### 5. **Default Config Tidak Konsisten**

**File JSON** (`backend/config/report-letterhead.json`):
```
PEMERINTAH DAERAH PROVINSI DKI JAKARTA
```

**Default Hardcoded** (`server_modern.js:6243`):
```
PEMERINTAH DAERAH PROVINSI JAWA BARAT  // ← JAWA BARAT, bukan DKI JAKARTA
```

**Export Default** (`backend/routes/export.js:393-397`):
```
PEMERINTAH PROVINSI DKI JAKARTA  // ← Tanpa "DAERAH"
```

❌ 3 versi berbeda!

---

## ✅ Solusi & Rekomendasi

### Opsi 1: Hapus File JSON (RECOMMENDED)
**Alasan**:
- File tidak digunakan
- Menghindari konfusi
- Single source of truth (database only)

**Action Items**:
1. ✅ Hapus `backend/config/report-letterhead.json`
2. ✅ Update dokumentasi: Letterhead disimpan di database
3. ✅ Buat script seed untuk initialize default letterhead

### Opsi 2: Gunakan File JSON sebagai Template
**Alasan**:
- File berguna sebagai template/reference
- Bisa digunakan untuk initialize database

**Action Items**:
1. ✅ Update struktur JSON agar compatible:
   ```json
   {
     "enabled": true,
     "logoLeftUrl": "/uploads/letterheads/logo-jawa-barat.png",
     "logoRightUrl": "/uploads/letterheads/logo-smk.png",
     "lines": [
       "PEMERINTAH PROVINSI DKI JAKARTA",
       "DINAS PENDIDIKAN",
       "SMK NEGERI 13 JAKARTA",
       "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
       "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
     ],
     "alignment": "center"
   }
   ```

2. ✅ Buat migration script:
   ```javascript
   // scripts/seed-letterhead.js
   const fs = require('fs');
   const db = require('../db');
   
   async function seedLetterhead() {
     // Read template
     const template = JSON.parse(
       fs.readFileSync('backend/config/report-letterhead.json', 'utf8')
     );
     
     // Insert to database for each report
     const reportKeys = [
       'global',
       'presensi-siswa',
       'rekap-ketidakhadiran',
       'rekap-ketidakhadiran-guru',
       'banding-absen'
     ];
     
     for (const key of reportKeys) {
       await db.execute(
         `INSERT INTO system_config (config_key, config_value) 
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
         [`letterhead_${key}`, JSON.stringify(template)]
       );
       console.log(`✅ Seeded letterhead for ${key}`);
     }
   }
   
   seedLetterhead().then(() => process.exit(0));
   ```

3. ✅ Rename file untuk clarify:
   ```
   backend/config/report-letterhead.json
   → backend/config/letterhead-template.json
   ```

### Opsi 3: Standardize Default Config
**Action Items**:
1. ✅ Tentukan 1 versi yang correct
2. ✅ Update semua hardcoded default ke versi yang sama
3. ✅ Buat constant untuk default config

**Recommended Default**:
```javascript
// backend/config/letterhead-default.js
module.exports = {
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
```

Gunakan di semua tempat:
```javascript
const DEFAULT_LETTERHEAD = require('./config/letterhead-default');

// In server_modern.js
const defaultConfig = { ...DEFAULT_LETTERHEAD };

// In export.js
if (!letterheadConfig) {
  letterheadConfig = { ...DEFAULT_LETTERHEAD };
}
```

---

## 🧪 Testing Guide

### Manual Testing

#### 1. Test Load Letterhead
```bash
# Test GET endpoint
curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=global" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: Return config from database or default
```

#### 2. Test Save Letterhead
```bash
# Test POST endpoint
curl -X POST "http://localhost:3001/api/admin/letterhead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reportKey": "global",
    "config": {
      "enabled": true,
      "logoLeftUrl": "/path/to/logo-left.png",
      "logoRightUrl": "/path/to/logo-right.png",
      "lines": [
        "PEMERINTAH PROVINSI DKI JAKARTA",
        "DINAS PENDIDIKAN",
        "SMK NEGERI 13 JAKARTA"
      ],
      "alignment": "center"
    }
  }'

# Expected: Success response
```

#### 3. Test Preview
```bash
# Open in browser
http://localhost:3001/api/admin/letterhead/preview?reportKey=global

# Expected: HTML preview of letterhead
```

#### 4. Test Export with Letterhead
```bash
# Export report
curl -X GET "http://localhost:3001/api/export/presensi-siswa?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o presensi-siswa.xlsx

# Open Excel file and verify letterhead appears at top
```

### Database Verification
```sql
-- Check letterhead in database
SELECT 
  config_key, 
  LEFT(config_value, 100) as config_preview,
  updated_at
FROM system_config 
WHERE config_key LIKE 'letterhead_%';

-- Should show:
-- letterhead_global
-- letterhead_presensi-siswa
-- letterhead_rekap-ketidakhadiran
-- etc.
```

### Frontend Testing
1. Login sebagai admin
2. Buka menu "Kop Laporan"
3. Pilih report type dari dropdown
4. Upload logo kiri (drag & drop)
5. Upload logo kanan (drag & drop)
6. Edit header lines
7. Change alignment (left/center/right)
8. Click "Preview" → Verify preview opens in new tab
9. Click "Simpan" → Verify toast success
10. Reload page → Verify changes persist
11. Export report → Verify letterhead appears

---

## 📚 Documentation Summary

### For Developers
- **Storage**: Database `system_config` table (PRIMARY)
- **File JSON**: TIDAK DIGUNAKAN (dapat dihapus atau dijadikan template)
- **Key Format**: `letterhead_{reportKey}`
- **Structure**: `{enabled, logoLeftUrl, logoRightUrl, lines[], alignment}`
- **Default**: Hardcoded jika tidak ada di database

### For Admin Users
- **Access**: Dashboard Admin → Kop Laporan
- **Features**: 
  - Upload logo kiri & kanan
  - Edit header text (multiple lines)
  - Choose text alignment
  - Preview before save
  - Apply per report type
- **Image**: Max 5MB, auto-compress to 500KB
- **Reports**: Each report can have different letterhead

### For Ops/DevOps
- **Migration**: Use seed script to initialize default letterhead
- **Backup**: Backup `system_config` table regularly
- **Monitoring**: Check `system_config` table size (images are base64)
- **Performance**: Consider using file storage instead of base64 for large images

---

## 🎯 Action Plan

### Phase 1: Cleanup & Standardize (Priority: HIGH)
- [ ] Tentukan: Keep atau Delete file JSON?
- [ ] Jika keep: Update struktur JSON agar compatible
- [ ] Jika delete: Remove file dan update docs
- [ ] Standardize default config across all files
- [ ] Create constant untuk default config
- [ ] Update semua hardcoded default

### Phase 2: Migration & Seeding (Priority: MEDIUM)
- [ ] Buat migration script
- [ ] Create seed script untuk initialize database
- [ ] Test migration dengan fresh database
- [ ] Document migration process

### Phase 3: Testing (Priority: HIGH)
- [ ] Manual testing semua endpoints
- [ ] Test export dengan letterhead
- [ ] Test frontend UI
- [ ] Test image compression
- [ ] Verify database storage

### Phase 4: Documentation (Priority: MEDIUM)
- [ ] Update user guide
- [ ] Create admin manual
- [ ] Document API endpoints
- [ ] Add troubleshooting guide

---

## 🔍 Kesimpulan

### Yang Bekerja dengan Baik ✅
1. API endpoints lengkap dan berfungsi
2. Frontend UI user-friendly
3. Image compression automatic
4. Database storage reliable
5. Export integration seamless

### Yang Perlu Diperbaiki ⚠️
1. **File JSON tidak digunakan** - Hapus atau jadikan template
2. **Struktur tidak konsisten** - Standardize default config
3. **Typo dalam data** - Fix "JAKARTAA" → "JAKARTA"
4. **Tidak ada migration** - Buat script untuk initialize database
5. **3 versi default berbeda** - Unify ke 1 versi

### Rekomendasi Akhir 🎯
1. **HAPUS file JSON** atau rename ke `letterhead-template.json`
2. **STANDARDIZE default config** di 1 file constant
3. **BUAT migration script** untuk initialize database
4. **UPDATE dokumentasi** untuk clarity
5. **TEST menyeluruh** sebelum production

---

**Status**: ✅ **ANALYSIS COMPLETE**  
**Date**: 22 Oktober 2025  
**Version**: 2.1.2 (Letterhead System Analysis)

