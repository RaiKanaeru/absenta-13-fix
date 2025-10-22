# Kop Laporan (Letterhead) - Quick Start Guide

## 📚 Pendahuluan

Sistem Kop Laporan memungkinkan Admin untuk mengkonfigurasi header/kop surat yang muncul di semua laporan export (Excel/PDF).

---

## 🚀 Quick Start

### 1. **Akses Menu Kop Laporan**
```
Dashboard Admin → Kop Laporan
```

### 2. **Upload Logo**
- **Logo Kiri**: Drag & drop atau klik untuk upload (biasanya logo daerah)
- **Logo Kanan**: Drag & drop atau klik untuk upload (biasanya logo sekolah)
- **Format**: PNG, JPG, JPEG
- **Max Size**: 5MB (otomatis dikompres ke 500KB)

### 3. **Edit Header Text**
- Klik "Tambah Baris" untuk menambah line baru
- Edit text di setiap baris
- Hapus baris yang tidak diperlukan
- **Rekomendasi**:
  ```
  Baris 1: PEMERINTAH PROVINSI DKI JAKARTA
  Baris 2: DINAS PENDIDIKAN
  Baris 3: SMK NEGERI 13 JAKARTA
  Baris 4: Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910
  Baris 5: Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id
  ```

### 4. **Pilih Alignment**
- **Left**: Text rata kiri
- **Center**: Text rata tengah (recommended)
- **Right**: Text rata kanan

### 5. **Preview & Save**
- Klik **"Preview"** untuk melihat hasil
- Klik **"Simpan"** untuk menyimpan konfigurasi

### 6. **Test Export**
- Buka menu "Laporan"
- Export salah satu laporan (Excel/PDF)
- Verify kop surat muncul di bagian atas

---

## 🔧 Setup Awal (Untuk Developer)

### Seed Default Letterhead ke Database

```bash
# Run seed script
node scripts/seed-letterhead.cjs

# Expected output:
# ✅ Letterhead seeding completed successfully!
# 📋 Letterhead configurations in database:
#    - letterhead_global
#    - letterhead_presensi-siswa
#    - letterhead_rekap-ketidakhadiran
#    - letterhead_rekap-ketidakhadiran-guru
#    - letterhead_banding-absen
#    - letterhead_jadwal-global
#    - letterhead_jadwal-smkn13
#    - letterhead_teacher-summary
#    - letterhead_student-summary
```

### Verify Database

```sql
-- Check letterhead configurations
SELECT 
  config_key, 
  LENGTH(config_value) as size_bytes,
  updated_at
FROM system_config 
WHERE config_key LIKE 'letterhead_%';

-- View specific letterhead
SELECT 
  config_key,
  config_value
FROM system_config 
WHERE config_key = 'letterhead_global';
```

---

## 📊 Storage System

### Primary Storage: Database
- **Table**: `system_config`
- **Key Format**: `letterhead_{reportKey}`
- **Value**: JSON string

### Template File: JSON
- **File**: `backend/config/report-letterhead.json`
- **Purpose**: Template untuk seeding
- **Status**: Digunakan oleh script seed

**Struktur JSON**:
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

---

## 🎯 Report Keys

Setiap jenis laporan dapat memiliki kop surat yang berbeda:

| Report Key | Deskripsi | Endpoint Export |
|------------|-----------|-----------------|
| `global` | Default untuk semua laporan | N/A (fallback) |
| `presensi-siswa` | Presensi Siswa | `/api/export/presensi-siswa` |
| `rekap-ketidakhadiran` | Rekap Ketidakhadiran Siswa | `/api/export/rekap-ketidakhadiran` |
| `rekap-ketidakhadiran-guru` | Rekap Ketidakhadiran Guru | `/api/export/rekap-ketidakhadiran-guru` |
| `banding-absen` | Riwayat Banding Absen | `/api/export/banding-absen` |
| `jadwal-global` | Jadwal Global | `/api/export/jadwal-global/excel` |
| `jadwal-smkn13` | Jadwal SMKN 13 Format | `/api/export/jadwal-smkn13/excel` |
| `teacher-summary` | Ringkasan Kehadiran Guru | `/api/export/teacher-summary` |
| `student-summary` | Ringkasan Kehadiran Siswa | `/api/export/student-summary` |

---

## 🔌 API Endpoints

### GET `/api/admin/letterhead?reportKey={key}`
**Auth**: Admin, Guru  
**Purpose**: Load letterhead configuration  
**Example**:
```bash
curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=global" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
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
}
```

### POST `/api/admin/letterhead`
**Auth**: Admin only  
**Purpose**: Save letterhead configuration  
**Example**:
```bash
curl -X POST "http://localhost:3001/api/admin/letterhead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reportKey": "global",
    "config": {
      "enabled": true,
      "logoLeftUrl": "data:image/png;base64,...",
      "logoRightUrl": "data:image/png;base64,...",
      "lines": [
        "PEMERINTAH PROVINSI DKI JAKARTA",
        "DINAS PENDIDIKAN",
        "SMK NEGERI 13 JAKARTA"
      ],
      "alignment": "center"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Konfigurasi kop laporan berhasil disimpan",
  "payloadSize": 250,
  "processedImages": 2
}
```

### GET `/api/admin/letterhead/preview?reportKey={key}`
**Auth**: Admin, Guru  
**Purpose**: Preview letterhead in HTML  
**Example**:
```
http://localhost:3001/api/admin/letterhead/preview?reportKey=global
```

---

## 🖼️ Image Specifications

### Requirements
- **Format**: PNG, JPG, JPEG
- **Max Input Size**: 5MB per image
- **Recommended Size**: 800x600 pixels or smaller
- **Aspect Ratio**: Any (akan di-resize otomatis)

### Auto Compression
- **Target Size**: Max 500KB per image
- **Max Dimensions**: 800x600 pixels
- **Quality**: 80%
- **Format**: PNG (maintains transparency)

### Logo Placement
- **Logo Kiri**: Top-left corner of report
- **Logo Kanan**: Top-right corner of report
- **Display Size**: ~80x80 pixels in export

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Login sebagai Admin
- [ ] Buka menu "Kop Laporan"
- [ ] Upload logo kiri (test dengan file < 1MB)
- [ ] Upload logo kanan (test dengan file < 1MB)
- [ ] Edit header lines
- [ ] Change alignment
- [ ] Click "Preview" → Verify preview opens
- [ ] Click "Simpan" → Verify success toast
- [ ] Reload page → Verify changes persist
- [ ] Export report → Verify letterhead appears
- [ ] Test dengan file > 1MB → Verify compression works

### API Testing
```bash
# Test load
curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=global" \
  -H "Authorization: Bearer TOKEN"

# Test save
curl -X POST "http://localhost:3001/api/admin/letterhead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reportKey":"global","config":{...}}'

# Test preview
curl "http://localhost:3001/api/admin/letterhead/preview?reportKey=global" \
  -H "Authorization: Bearer TOKEN"
```

---

## ⚠️ Troubleshooting

### Logo tidak muncul di export
**Penyebab**: Path logo tidak valid atau file tidak ada  
**Solusi**: 
1. Verify file exists di `public/uploads/letterheads/`
2. Check file permissions
3. Upload ulang logo dari UI

### Error "Payload too large"
**Penyebab**: File gambar terlalu besar  
**Solusi**: 
1. Compress gambar sebelum upload
2. Resize ke max 800x600 pixels
3. Convert ke PNG/JPG dengan quality 80%

### Kop tidak muncul di laporan tertentu
**Penyebab**: Report key tidak memiliki letterhead config  
**Solusi**: 
1. Run seed script: `node scripts/seed-letterhead.cjs`
2. Atau save letterhead untuk report key tersebut via UI

### Database error saat save
**Penyebab**: `system_config` table tidak ada atau column terlalu kecil  
**Solusi**: 
```sql
-- Check table structure
DESCRIBE system_config;

-- If config_value is VARCHAR, change to TEXT
ALTER TABLE system_config 
MODIFY COLUMN config_value TEXT;
```

---

## 📚 Related Documentation

- **Complete Analysis**: `LETTERHEAD_SYSTEM_ANALYSIS_COMPLETE.md`
- **Component**: `frontend/src/components/ReportLetterheadSettings.tsx`
- **API Routes**: `server_modern.js` (lines 6231-6435)
- **Export Integration**: `backend/routes/export.js`
- **Excel Builder**: `backend/export/excelBuilder.js`
- **PDF Builder**: `backend/export/pdfBuilder.js`

---

## 🎯 Best Practices

### Logo Images
✅ **DO**:
- Use transparent PNG for logos
- Optimize images before upload (use tinypng.com)
- Use high-quality images (min 300 DPI)
- Test preview before save

❌ **DON'T**:
- Upload images > 5MB
- Use low-quality/pixelated images
- Use complex images with many colors
- Forget to test export after save

### Header Text
✅ **DO**:
- Keep text concise and clear
- Use proper capitalization
- Include contact information
- Test alignment on preview

❌ **DON'T**:
- Use too many lines (max 5-6)
- Use very long text per line
- Forget school address/contact
- Use inconsistent formatting

### Configuration
✅ **DO**:
- Seed database dengan script pada setup awal
- Backup letterhead config regularly
- Test export setelah perubahan
- Document custom configurations

❌ **DON'T**:
- Edit database manually
- Skip testing after changes
- Delete system_config records
- Modify JSON file tanpa re-seed

---

**Status**: ✅ **READY TO USE**  
**Date**: 22 Oktober 2025  
**Version**: 2.1.2 (Letterhead System)

