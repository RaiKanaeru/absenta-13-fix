# Panduan Import Jadwal Advanced

## Overview
Fitur Import Jadwal Advanced memungkinkan import jadwal pelajaran dengan format Excel yang lebih fleksibel menggunakan format matrix 3-sheet. Fitur ini dirancang untuk memudahkan import jadwal dalam jumlah besar dengan struktur yang kompleks.

## Format File Excel

### Sheet 1: JADWAL (Matrix Grid)
Format matrix dengan 3 baris per kelas:
- **Baris 1**: Kode Guru (G1, G2, G3, dst.)
- **Baris 2**: Alias Mata Pelajaran (MTK, BIO, FIS, dst.)
- **Baris 3**: Ruang (diabaikan, hanya untuk referensi)

**Contoh Format:**
```
KELAS     | Senin-1 | Senin-2 | Selasa-1 | Selasa-2 | ...
----------|---------|---------|----------|----------|
X IPA 1   | G1      | G1      | G3       | G2       |    <- Kode Guru
          | MTK     | MTK     | FIS      | BIO      |    <- Alias Mapel
          | R.301   | R.301   | Lab      | Lab.Bio  |    <- Ruang (diabaikan)
----------|---------|---------|----------|----------|
X IPA 2   | G2      | G3      | G1       | G2       |
          | BIO     | FIS     | MTK      | BIO      |
          | Lab.B   | Lab.F   | R.302    | Lab.Bio  |
```

### Sheet 2: MASTER GURU HARIAN
Tabel master guru dengan ketersediaan harian:
- **NAMA GURU**: Nama lengkap guru
- **KODE**: Kode unik guru (G1, G2, dst.)
- **NAMA PANGGILAN**: Nama panggilan guru
- **SENIN-JUMAT**: Ketersediaan guru per hari (ADA/kosong)

### Sheet 3: JAM GURU
Rekapitulasi jam mengajar per guru:
- **KODE**: Kode guru
- **SENIN-1 s/d JUMAT-4**: Total jam mengajar (1/0)

## Cara Penggunaan

### 1. Download Template
1. Masuk ke menu **Kelola Jadwal**
2. Klik tombol **Import Advanced**
3. Klik **Download Template** untuk mendapatkan file Excel template

### 2. Isi Data
1. Buka file template yang didownload
2. Edit sheet **JADWAL**:
   - Isi nama kelas di kolom pertama setiap grup 3 baris
   - Isi kode guru (G1, G2, dst.) di baris pertama
   - Isi alias mapel (MTK, BIO, dst.) di baris kedua
   - Isi ruang di baris ketiga (opsional)
3. Edit sheet **MASTER GURU HARIAN** (opsional):
   - Tambah data guru jika belum ada
   - Set ketersediaan harian
4. Edit sheet **JAM GURU** (opsional):
   - Set total jam mengajar per guru

### 3. Upload & Import
1. Klik **Validasi File** untuk cek data sebelum import
2. Periksa hasil validasi di tab **Ringkasan** dan **Error**
3. Jika semua data valid, klik **Import Jadwal**
4. Tunggu proses import selesai

## Mapping Data

### Kode Guru → Database
- Format: `G1`, `G2`, `G3`, dst.
- Mapping: `G1` → `guru.id_guru = 1` → `guru.id` (PK)
- Validasi: Guru harus ada di database dengan status aktif

### Alias Mapel → Database
- Format: `MTK`, `BIO`, `FIS`, dst.
- Mapping: `MTK` → `mapel.kode_mapel = "MTK-01"` → `mapel.id_mapel`
- Konfigurasi: Lihat `backend/config/mapel-alias.json`

### Nama Kelas → Database
- Format: `X IPA 1`, `XI IPS 2`, dst.
- Mapping: `X IPA 1` → `kelas.nama_kelas = "X IPA 1"` → `kelas.id_kelas`
- Validasi: Kelas harus ada di database dengan status aktif

### Slot Waktu → Database
- Format: `Senin-1`, `Selasa-2`, dst.
- Mapping: `Senin-1` → `hari = "Senin"`, `jam_ke = 1`
- Konfigurasi: Lihat `backend/config/schedule-import.config.json`

## Konfigurasi

### Time Slots
File: `backend/config/schedule-import.config.json`
```json
{
  "timeSlots": {
    "Senin": {
      "1": { "jam_mulai": "07:00:00", "jam_selesai": "07:45:00" },
      "2": { "jam_mulai": "07:45:00", "jam_selesai": "08:30:00" }
    }
  }
}
```

### Alias Mapel
File: `backend/config/mapel-alias.json`
```json
{
  "aliases": {
    "MTK": "MTK-01",
    "BIO": "BIO-01",
    "FIS": "FIS-01"
  }
}
```

### Normalisasi Kelas
File: `backend/config/kelas-map.json`
```json
{
  "normalization": {
    "X IPA 1": "X IPA 1",
    "X IPA-1": "X IPA 1",
    "X-IPA-1": "X IPA 1"
  }
}
```

## Validasi & Error Handling

### Validasi File
- Format file: `.xlsx` atau `.xls`
- Ukuran maksimal: 10MB
- Sheet wajib: JADWAL, MASTER GURU HARIAN, JAM GURU

### Validasi Data
- Kode guru harus valid (G1, G2, dst.)
- Alias mapel harus terdaftar di konfigurasi
- Nama kelas harus ada di database
- Slot waktu harus valid

### Error Messages
- **Kelas tidak ditemukan**: Nama kelas tidak ada di database
- **Guru tidak ditemukan**: Kode guru tidak valid atau tidak ada
- **Alias mapel tidak terdaftar**: Alias tidak ada di konfigurasi
- **Slot waktu tidak ditemukan**: Format hari-jam tidak valid

## Upsert Logic

### Kunci Unik
- `(kelas_id, hari, jam_ke)` - satu jadwal per kelas per slot waktu

### Perilaku Upsert
- **Jika ada**: Update `guru_id`, `mapel_id`, `jam_mulai`, `jam_selesai`
- **Jika tidak ada**: Insert record baru
- **Transaksi**: Per kelas untuk memastikan konsistensi

## Laporan & Logging

### Laporan Import
- File: `reports/import-schedule-{timestamp}.json`
- Berisi: Ringkasan, error, warning, konfigurasi

### Log Level
- **Info**: Proses normal
- **Warning**: Data tidak konsisten (opsional)
- **Error**: Data tidak valid (wajib diperbaiki)

## Troubleshooting

### Error Umum
1. **"Sheet JADWAL tidak ditemukan"**
   - Pastikan nama sheet tepat: "JADWAL"
   - Cek case sensitivity

2. **"Kode guru tidak valid"**
   - Pastikan format: G1, G2, G3 (huruf G + angka)
   - Cek tidak ada spasi atau karakter lain

3. **"Alias mapel tidak terdaftar"**
   - Tambah alias di `backend/config/mapel-alias.json`
   - Restart server setelah edit konfigurasi

4. **"Kelas tidak ditemukan"**
   - Pastikan nama kelas sama persis dengan database
   - Gunakan normalisasi di `backend/config/kelas-map.json`

### Performance
- **File besar**: Import per kelas untuk menghindari timeout
- **Memory**: Server akan handle file hingga 10MB
- **Database**: Gunakan transaksi per kelas

## API Endpoints

### Import Jadwal Advanced
```
POST /api/admin/import/jadwal-advanced
Content-Type: multipart/form-data
Authorization: Bearer {token}

Query Parameters:
- dryRun=true (optional): Validasi tanpa import

Response:
{
  "success": true,
  "summary": {
    "total": 100,
    "valid": 95,
    "invalid": 5,
    "inserted": 80,
    "updated": 15
  },
  "errors": [...],
  "warnings": [...],
  "reportFile": "reports/import-schedule-1234567890.json"
}
```

### Download Template
```
GET /api/admin/templates/jadwal-advanced
Authorization: Bearer {token}

Response: Excel file (.xlsx)
```

## Keamanan

### Autorisasi
- Hanya admin yang bisa akses fitur import
- Validasi token JWT untuk setiap request

### Validasi Input
- Sanitasi nama file
- Validasi ukuran file
- Escape karakter khusus

### Audit Trail
- Log semua aktivitas import
- Simpan laporan detail
- Track perubahan data

## Best Practices

### Persiapan Data
1. **Backup database** sebelum import besar
2. **Test dengan dry run** terlebih dahulu
3. **Validasi data** di Excel sebelum upload

### Struktur File
1. **Gunakan template** yang disediakan
2. **Konsisten format** nama kelas dan kode guru
3. **Hindari sel kosong** di data penting

### Monitoring
1. **Cek log** setelah import
2. **Verifikasi data** di database
3. **Test fungsionalitas** jadwal yang diimport

## Logo Laporan

### Konfigurasi Logo
Sistem mendukung logo resmi di semua laporan:
- **Logo Kiri**: Provinsi Jawa Barat (`/uploads/letterheads/logo-jawa-barat.png`)
- **Logo Kanan**: SMK Negeri 13 (`/uploads/letterheads/logo-smk.png`)

### Upload Logo Baru
1. Masuk ke menu **Kop Laporan** di dashboard admin
2. Upload logo baru melalui interface
3. Logo akan otomatis tersinkronisasi ke semua laporan

### Format Logo
- **Format**: PNG, JPG, atau GIF
- **Ukuran**: Maksimal 2MB
- **Resolusi**: Minimal 200x200px untuk kualitas cetak
- **Path**: `public/uploads/letterheads/`

## Support

Jika mengalami masalah:
1. Cek log di `logs/` directory
2. Periksa konfigurasi di `backend/config/`
3. Validasi data dengan dry run
4. Hubungi administrator sistem
