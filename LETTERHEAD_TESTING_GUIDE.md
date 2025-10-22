# Panduan Testing Sistem Kop Laporan Dinamis

## 📋 Testing Checklist

### ✅ Phase 1: Database Verification

#### 1.1. Verify Table Exists
```sql
USE absenta13;
SHOW TABLES LIKE 'system_config';
```
**Expected Output**:
```
+----------------------------+
| Tables_in_absenta13        |
+----------------------------+
| system_config              |
+----------------------------+
```

#### 1.2. Verify Table Structure
```sql
DESCRIBE system_config;
```
**Expected Output**:
```
+--------------+--------------+------+-----+-------------------+-------------------+
| Field        | Type         | Null | Key | Default           | Extra             |
+--------------+--------------+------+-----+-------------------+-------------------+
| id           | int(11)      | NO   | PRI | NULL              | auto_increment    |
| config_key   | varchar(255) | NO   | UNI | NULL              |                   |
| config_value | text         | YES  |     | NULL              |                   |
| description  | text         | YES  |     | NULL              |                   |
| created_at   | timestamp    | NO   |     | CURRENT_TIMESTAMP |                   |
| updated_at   | timestamp    | NO   |     | CURRENT_TIMESTAMP | on update ...     |
+--------------+--------------+------+-----+-------------------+-------------------+
```

#### 1.3. Verify Default Data
```sql
SELECT 
  config_key,
  CASE 
    WHEN config_value IS NULL THEN '🔄 Using Global'
    WHEN LENGTH(config_value) > 50 THEN '✅ Custom Config'
    ELSE '⚠️ Empty'
  END as status,
  description
FROM system_config 
WHERE config_key LIKE 'letterhead%'
ORDER BY config_key;
```
**Expected Output**: 7 rows
```
+-----------------------------+------------------+------------------------------------------+
| config_key                  | status           | description                              |
+-----------------------------+------------------+------------------------------------------+
| letterhead_banding_absen    | 🔄 Using Global  | Letterhead for attendance appeal report  |
| letterhead_global           | ✅ Custom Config | Default letterhead configuration...      |
| letterhead_presensi_siswa   | 🔄 Using Global  | Letterhead for student attendance...     |
| letterhead_rekap_guru       | 🔄 Using Global  | Letterhead for teacher recap report      |
| letterhead_rekap_ketidakhadiran | 🔄 Using Global | Letterhead for absence recap report   |
| letterhead_student_summary  | 🔄 Using Global  | Letterhead for student summary report    |
| letterhead_teacher_summary  | 🔄 Using Global  | Letterhead for teacher summary report    |
+-----------------------------+------------------+------------------------------------------+
```

#### 1.4. Verify Global Letterhead Content
```sql
SELECT 
  config_key,
  JSON_EXTRACT(config_value, '$.enabled') as enabled,
  JSON_EXTRACT(config_value, '$.logoPosition') as logo_position,
  JSON_LENGTH(JSON_EXTRACT(config_value, '$.textLines')) as text_lines_count
FROM system_config 
WHERE config_key = 'letterhead_global';
```
**Expected Output**:
```
+-------------------+---------+---------------+------------------+
| config_key        | enabled | logo_position | text_lines_count |
+-------------------+---------+---------------+------------------+
| letterhead_global | true    | "tengah"      | 4                |
+-------------------+---------+---------------+------------------+
```

---

### ✅ Phase 2: Backend API Testing

#### 2.1. Get Global Letterhead Configuration

**Request**:
```bash
# Login sebagai admin dulu untuk mendapat token
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Simpan token dari response
# Kemudian get letterhead config

curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=global" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "logoPosition": "tengah",
    "logoTopUrl": "",
    "logoLeftUrl": "",
    "logoRightUrl": "",
    "textLines": [
      "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
      "DINAS PENDIDIKAN",
      "SMK NEGERI 13 BANDUNG",
      "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 139"
    ]
  }
}
```

#### 2.2. Get Specific Report Type Letterhead

**Request**:
```bash
curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=teacher_summary" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**: Fallback ke global (karena config NULL)
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "logoPosition": "tengah",
    "logoTopUrl": "",
    "logoLeftUrl": "",
    "logoRightUrl": "",
    "textLines": [
      "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
      "DINAS PENDIDIKAN",
      "SMK NEGERI 13 BANDUNG",
      "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 139"
    ]
  }
}
```

#### 2.3. Update Letterhead Configuration

**Request**:
```bash
curl -X POST http://localhost:3001/api/admin/letterhead \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "reportKey": "global",
    "config": {
      "enabled": true,
      "logoPosition": "kiri-kanan",
      "logoLeftUrl": "data:image/png;base64,iVBORw0KG...",
      "logoRightUrl": "data:image/png;base64,iVBORw0KG...",
      "textLines": [
        "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
        "DINAS PENDIDIKAN",
        "SMK NEGERI 13 BANDUNG",
        "Jl. Contoh Alamat Baru No. 123"
      ]
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Letterhead configuration saved successfully"
}
```

---

### ✅ Phase 3: Frontend UI Testing

#### 3.1. Login sebagai Admin
1. Buka browser: `http://localhost:5173`
2. Login dengan credentials:
   - Username: `admin`
   - Password: `admin123`

#### 3.2. Akses Halaman Kop Laporan
1. Cari menu **"Kop Laporan"** atau **"Pengaturan Kop Laporan"** di sidebar
2. Klik untuk membuka halaman

**Expected**:
- Halaman terbuka tanpa error
- Form konfigurasi visible
- Dropdown "Cakupan KOP" ada pilihan:
  - Global (Semua Laporan)
  - Teacher Summary
  - Student Summary
  - Presensi Siswa
  - Rekap Ketidakhadiran
  - Rekap Guru
  - Banding Absen

#### 3.3. Test Upload Logo
1. Pilih "Global (Semua Laporan)"
2. Pilih **"Posisi Logo"**: Tengah / Kiri-Kanan / Kiri Saja / Kanan Saja
3. Upload image untuk logo (sesuai posisi yang dipilih)
4. Check preview logo muncul

**Expected**:
- Upload berhasil
- Preview image muncul
- File size di-compress otomatis (max 500KB)

#### 3.4. Test Konfigurasi Text
1. Masukkan baris teks kop (4-6 baris):
   ```
   PEMERINTAH DAERAH PROVINSI JAWA BARAT
   DINAS PENDIDIKAN
   SMK NEGERI 13 BANDUNG
   Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910
   Telp: (021) 1234567 | Email: info@smkn13.sch.id
   ```
2. Pilih alignment: Tengah / Kiri / Kanan

**Expected**:
- Text tersimpan
- Alignment terlihat di preview

#### 3.5. Test Save Configuration
1. Klik tombol **"Simpan"** atau **"Simpan Konfigurasi"**
2. Tunggu response

**Expected**:
- Success message muncul
- Tidak ada error di console
- Data tersimpan ke database

#### 3.6. Test Preview HTML
1. Klik tombol **"Preview HTML"** atau **"Lihat Preview"**

**Expected**:
- Modal/popup preview terbuka
- Menampilkan:
  - Logo (sesuai posisi)
  - Baris text kop
  - Format rapi dan centered

---

### ✅ Phase 4: Export Testing

#### 4.1. Test Export Rekap Guru
1. Login sebagai **admin**
2. Buka halaman **"Laporan"** → **"Rekap Ketidakhadiran Guru"**
3. Pilih periode (bulan/tahun)
4. Klik **"Export to Excel"**

**Expected**:
- File Excel download
- Buka file Excel
- Sheet pertama ada header dengan:
  - Logo sekolah (sesuai konfigurasi)
  - Text kop surat
  - Title laporan
  - Data guru

#### 4.2. Test Export Rekap Siswa
1. Buka halaman **"Laporan"** → **"Rekap Ketidakhadiran Siswa"**
2. Pilih kelas dan periode
3. Klik **"Export to Excel"**

**Expected**:
- File Excel download
- Ada letterhead di atas
- Data siswa terformat dengan baik

#### 4.3. Test Export Presensi Siswa
1. Buka halaman **"Laporan"** → **"Presensi Siswa"**
2. Pilih kelas, mata pelajaran, periode
3. Klik **"Export"**

**Expected**:
- Excel/PDF download
- Letterhead muncul
- Data lengkap

#### 4.4. Test Export Banding Absen
1. Buka halaman **"Banding Absen"**
2. Filter banding (pending/disetujui/ditolak)
3. Klik **"Export"**

**Expected**:
- File download
- Letterhead sesuai konfigurasi
- Data banding complete

---

### ✅ Phase 5: Edge Case Testing

#### 5.1. Test Without Logo
1. Hapus semua logo (kosongkan logo fields)
2. Simpan konfigurasi
3. Test export

**Expected**:
- Export berhasil
- Hanya text kop yang muncul (tanpa logo)
- Tidak ada broken image

#### 5.2. Test Large Image Upload
1. Upload image > 2MB
2. Save configuration

**Expected**:
- Backend auto-compress ke 500KB
- Upload berhasil
- No error

#### 5.3. Test Different Report Types
1. Set konfigurasi berbeda untuk **Teacher Summary**:
   - Logo berbeda
   - Text berbeda
2. Export Teacher Summary
3. Export Student Summary (yang masih pakai global)

**Expected**:
- Teacher Summary pakai config custom
- Student Summary pakai config global
- Tidak ada mixing config

#### 5.4. Test Fallback Mechanism
1. Set config untuk report type tertentu ke NULL
2. Export report tersebut

**Expected**:
- Fallback ke global letterhead
- Export tetap ada letterhead (dari global)

---

## 📊 Testing Summary Checklist

Print dan check setiap test:

**Database**:
- [ ] Table `system_config` exists
- [ ] 7 letterhead configs inserted
- [ ] Global config has valid JSON
- [ ] Indexes created properly

**Backend API**:
- [ ] GET `/api/admin/letterhead` returns config
- [ ] POST `/api/admin/letterhead` saves config
- [ ] Fallback to global works
- [ ] Image compression works

**Frontend UI**:
- [ ] Admin can access letterhead page
- [ ] Logo upload works
- [ ] Text configuration saves
- [ ] Preview HTML displays correctly

**Export Features**:
- [ ] Export Rekap Guru has letterhead
- [ ] Export Rekap Siswa has letterhead
- [ ] Export Presensi has letterhead
- [ ] Export Banding has letterhead

**Edge Cases**:
- [ ] Works without logo
- [ ] Large images compressed
- [ ] Different configs per report type
- [ ] Fallback to global works

---

## 🔍 Troubleshooting

### Logo tidak muncul di export
1. Check console log backend
2. Verify config_value di database tidak NULL
3. Check ExcelJS image handling

### Text kop berantakan
1. Verify JSON format di database
2. Check alignment setting
3. Verify textLines adalah array

### Save config error
1. Check MySQL max_allowed_packet (untuk large images)
2. Verify user has INSERT/UPDATE privilege
3. Check backend log untuk error detail

---

## 🎉 Success Criteria

Sistem dianggap berhasil jika:
1. ✅ Admin bisa konfigurasi kop via UI
2. ✅ Konfigurasi tersimpan di database
3. ✅ Semua export menampilkan letterhead
4. ✅ Preview HTML menampilkan letterhead dengan benar
5. ✅ Different config per report type berfungsi
6. ✅ Fallback to global berfungsi

---

**Testing Date**: _____________  
**Tested By**: _____________  
**Result**: ⭕ PASS / ❌ FAIL  
**Notes**: _____________________________________________

---

**Related Documentation**:
- Implementation Guide: `LETTERHEAD_SYSTEM_IMPLEMENTATION.md`
- Migration Guide: `RUN_LETTERHEAD_MIGRATION.md`
- Migration File: `database/migrations/2025-10-22-ensure-system-config-table.sql`



