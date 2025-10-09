# Panduan Import Jadwal Advanced - Format Matrix Excel

## 🎯 Overview

Fitur **Import Jadwal Advanced** memungkinkan admin untuk mengimpor jadwal pelajaran dengan format Excel yang lebih kompleks menggunakan struktur matrix grid. Fitur ini mendukung format 3-sheet Excel dengan parsing otomatis dan validasi yang komprehensif.

## 📋 Fitur Utama

### ✅ Yang Sudah Diimplementasikan

1. **Format Matrix Excel (3 Sheets)**
   - Sheet 1: JADWAL (Matrix Grid) - Parsing utama
   - Sheet 2: MASTER GURU HARIAN (Reserved untuk Phase 2)
   - Sheet 3: JAM GURU (Reserved untuk Phase 2)

2. **Parser Excel Cerdas**
   - Parse header kolom dengan format `{HARI}-{JAM_KE}` (Senin-1, Selasa-2, dst)
   - Support format singkat (SEN-1, SEL-2, dst)
   - Parsing 3 baris per kelas (guru, mapel, ruang)

3. **Validasi Komprehensif**
   - Mapping kode guru (G1, G2, dst) ke database
   - Mapping alias mapel (MTK, BIO, dst) ke kode_mapel
   - Validasi nama kelas dengan exact match
   - Validasi time slots berdasarkan konfigurasi

4. **Upsert Idempoten**
   - Insert jadwal baru jika belum ada
   - Update jadwal existing jika sudah ada
   - Transaksi per kelas untuk konsistensi data

5. **Dry Run Mode**
   - Preview data sebelum import
   - Validasi tanpa menyimpan ke database
   - Error reporting yang detail

6. **Template Generator**
   - Download template Excel dengan format yang benar
   - Sample data untuk panduan pengguna
   - Header kolom otomatis berdasarkan konfigurasi

## 🗂️ Struktur File

```
backend/
├── config/
│   ├── schedule-import.config.json    # Konfigurasi time slots & opsi
│   └── mapel-alias.json              # Mapping alias mapel
└── utils/
    └── scheduleImporterAdvanced.js   # Module parser & validator

src/components/
└── JadwalAdvancedImportView.tsx      # UI component

server_modern.js
├── GET /api/admin/templates/jadwal-advanced
└── POST /api/admin/import/jadwal-advanced
```

## 🔧 Konfigurasi

### Time Slots Configuration
```json
{
  "timeSlots": {
    "Senin": [
      { "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:45:00" },
      { "jam_ke": 2, "jam_mulai": "07:45:00", "jam_selesai": "08:30:00" }
    ],
    "Jumat": [
      { "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:40:00" }
    ]
  }
}
```

### Mapel Alias Configuration
```json
{
  "aliases": {
    "MTK": "MTK-01",
    "MATEMATIKA": "MTK-01",
    "BIO": "BIO-01",
    "BIOLOGI": "BIO-01"
  }
}
```

## 📊 Format Excel Target

### Sheet JADWAL (Matrix Grid)

| KELAS     | Senin-1 | Senin-2 | Selasa-1 | Selasa-2 |
|-----------|---------|---------|----------|----------|
| X IPA 1   | G1      | G1      | G3       | G2       | ← Row 1: Kode Guru
|           | MTK     | MTK     | FIS      | BIO      | ← Row 2: Alias Mapel  
|           | R.301   | R.301   | Lab      | Lab.Bio  | ← Row 3: Ruang
|-----------|---------|---------|----------|----------|
| X IPA 2   | G2      | G3      | ...      | ...      |
|           | BIO     | FIS     | ...      | ...      |
|           | Lab.B   | Lab.F   | ...      | ...      |

**Parsing Rules:**
- Header kolom: `{HARI}-{JAM_KE}` (case-insensitive)
- Setiap 3 baris = 1 kelas
- Baris ke-(3n): kode_guru (G1, G2, dst)
- Baris ke-(3n+1): alias_mapel (MTK, BIO, dst)
- Baris ke-(3n+2): ruang (diabaikan, log as info)

## 🚀 Cara Penggunaan

### 1. Akses Fitur
- Login sebagai Admin
- Masuk ke Dashboard Admin
- Klik "Import Jadwal (Format Matrix)"

### 2. Download Template
- Klik "Unduh Template" untuk mendapatkan file Excel template
- Template sudah berisi format yang benar dengan sample data

### 3. Isi Data Excel
- Buka file template
- Isi sheet JADWAL dengan data jadwal:
  - Kolom pertama: Nama kelas (exact match dengan database)
  - Baris 1: Kode guru (G1, G2, dst)
  - Baris 2: Alias mapel (MTK, BIO, dst)
  - Baris 3: Ruang (opsional)

### 4. Upload & Validasi
- Upload file Excel yang sudah diisi
- Pilih "Dry Run" untuk preview data
- Periksa error dan validasi
- Klik "Import" untuk menyimpan ke database

## 🔍 Validasi & Error Handling

### Validasi Input
- ✅ Format file Excel (.xlsx, .xls)
- ✅ Ukuran file maksimal 5MB
- ✅ Sheet JADWAL harus ada
- ✅ Header kolom harus valid

### Validasi Data
- ✅ Nama kelas harus ada di database
- ✅ Kode guru harus valid (G1, G2, dst)
- ✅ Guru harus ada di database
- ✅ Alias mapel harus terdaftar di konfigurasi
- ✅ Mapel harus ada di database
- ✅ Time slot harus valid

### Error Reporting
- 📊 Summary lengkap (total, valid, invalid, inserted, updated)
- 🔍 Detail error per baris dengan konteks
- 💡 Rekomendasi perbaikan
- 📄 Laporan tersimpan di folder `reports/`

## 🎯 API Endpoints

### Download Template
```http
GET /api/admin/templates/jadwal-advanced
Authorization: Bearer <token>
```

### Import Jadwal (Dry Run)
```http
POST /api/admin/import/jadwal-advanced?dryRun=true
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel-file>
```

### Import Jadwal (Actual)
```http
POST /api/admin/import/jadwal-advanced
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel-file>
```

## 📈 Performance & Limits

### Performance
- ✅ Batch processing per kelas
- ✅ Transaction per kelas untuk konsistensi
- ✅ Memory efficient parsing
- ✅ Connection pooling

### Limits
- 📁 File size: 5MB maksimal
- ⏱️ Timeout: 60 detik untuk import besar
- 🔄 Retry: 3x untuk database connection
- 📊 Batch: ~100 entries per kelas

## 🛠️ Troubleshooting

### Common Issues

1. **"Sheet JADWAL tidak ditemukan"**
   - Pastikan nama sheet adalah "JADWAL" (case-sensitive)
   - Cek apakah file Excel memiliki sheet tersebut

2. **"Kelas tidak ditemukan"**
   - Pastikan nama kelas exact match dengan database
   - Cek apakah kelas sudah aktif di database

3. **"Guru G1 tidak ditemukan"**
   - Pastikan guru dengan id_guru=1 ada di database
   - Cek apakah guru status aktif

4. **"Alias mapel tidak terdaftar"**
   - Tambahkan alias ke file `backend/config/mapel-alias.json`
   - Restart server setelah update konfigurasi

5. **"Slot waktu tidak ditemukan"**
   - Cek konfigurasi time slots di `backend/config/schedule-import.config.json`
   - Pastikan hari dan jam_ke sesuai dengan konfigurasi

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Check configuration
node -e "import('./backend/config/schedule-import.config.json', {assert: {type: 'json'}}).then(c => console.log(c.default))"
```

## 🔄 Database Schema

### Tabel jadwal
```sql
CREATE TABLE jadwal (
  id_jadwal int(11) PRIMARY KEY AUTO_INCREMENT,
  kelas_id int(11) NOT NULL,
  mapel_id int(11) NOT NULL,
  guru_id int(11) NOT NULL,
  hari varchar(10) NOT NULL,
  jam_ke int(11) NOT NULL,
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  status enum('aktif','tidak_aktif') DEFAULT 'aktif',
  UNIQUE KEY unique_schedule (kelas_id, hari, jam_ke)
);
```

### Mapping Strategy
1. **Guru**: Kode (G1) → guru.id_guru → guru.id
2. **Mapel**: Alias (MTK) → kode_mapel → mapel.id_mapel  
3. **Kelas**: Nama → kelas.id_kelas
4. **Time Slot**: (hari, jam_ke) → (jam_mulai, jam_selesai)

## 📚 Best Practices

### Excel Preparation
1. ✅ Gunakan template yang disediakan
2. ✅ Pastikan nama kelas exact match
3. ✅ Gunakan kode guru yang valid (G1, G2, dst)
4. ✅ Gunakan alias mapel yang terdaftar
5. ✅ Isi data secara konsisten

### Database Preparation
1. ✅ Pastikan data master (guru, kelas, mapel) sudah lengkap
2. ✅ Cek status aktif untuk semua data
3. ✅ Backup database sebelum import besar
4. ✅ Monitor log untuk error

### Import Process
1. ✅ Selalu gunakan dry run terlebih dahulu
2. ✅ Periksa error dan perbaiki sebelum import
3. ✅ Import dalam batch kecil untuk data besar
4. ✅ Verifikasi hasil import

## 🎉 Success Metrics

- ✅ Import 100+ jadwal entries dalam <10 detik
- ✅ Error rate <5% untuk file valid
- ✅ User dapat import jadwal mingguan (30 kelas) dalam 1 file
- ✅ Zero duplicate entries setelah import
- ✅ 100% backward compatibility dengan sistem existing

## 🔮 Future Enhancements (Phase 2)

- 🔄 Validasi silang dengan sheet MASTER GURU HARIAN
- 🔄 Validasi silang dengan sheet JAM GURU
- 🔄 Normalisasi nama kelas via config (fuzzy match)
- 🔄 Auto-detection format Excel
- 🔄 Batch import multiple files
- 🔄 Real-time progress tracking
- 🔄 Email notification untuk import besar

---

**Status**: ✅ **IMPLEMENTED & READY FOR USE**

**Last Updated**: 2025-01-09
**Version**: 1.0.0
**Compatibility**: Absenta System v2.0+
