# Implementasi KOP Laporan Berbasis Database

## Ringkasan Implementasi

Implementasi ini berhasil memindahkan sistem KOP/letterhead dari file-based configuration ke database, dengan dukungan konfigurasi global dan per-jenis laporan.

## Fitur yang Diimplementasikan

### 1. Database Schema
- **Tabel**: `kop_laporan` (Bahasa Indonesia)
- **Kolom**:
  - `id` - Primary key
  - `cakupan` - ENUM('global','jenis_laporan')
  - `kode_laporan` - VARCHAR(100) untuk kode laporan spesifik
  - `aktif` - TINYINT(1) status aktif
  - `perataan` - ENUM('kiri','tengah','kanan')
  - `baris_teks` - JSON array baris teks KOP
  - `logo_kiri_url` - VARCHAR(255) URL logo kiri
  - `logo_kanan_url` - VARCHAR(255) URL logo kanan
  - `dibuat_pada`, `diubah_pada` - Timestamp

### 2. Backend Service
- **File**: `backend/utils/letterheadService.js`
- **Fungsi**:
  - `getLetterhead({ reportKey })` - Ambil KOP dengan fallback global
  - `setLetterheadGlobal(payload)` - Set KOP global
  - `setLetterheadForReport(reportKey, payload)` - Set KOP per laporan
  - `getAllLetterheads()` - Ambil semua konfigurasi
  - `deleteLetterhead(id)` - Hapus konfigurasi
  - `validateLetterhead(letterhead)` - Validasi input

### 3. API Endpoints
- `GET /api/admin/letterhead?reportKey=...` - Ambil KOP (dengan reportKey opsional)
- `GET /api/admin/letterhead/all` - Ambil semua KOP (admin only)
- `PUT /api/admin/letterhead/global` - Set KOP global
- `PUT /api/admin/letterhead/report/:reportKey` - Set KOP per laporan
- `POST /api/admin/letterhead/upload` - Upload logo
- `DELETE /api/admin/letterhead/:id` - Hapus KOP

### 4. Frontend Components

#### Hook useLetterhead
- **File**: `src/hooks/useLetterhead.ts`
- **Fitur**:
  - Dukungan `reportKey` opsional
  - Cache per reportKey
  - Fallback ke default jika gagal

#### ExcelPreview Component
- **File**: `src/components/ExcelPreview.tsx`
- **Fitur**:
  - Render KOP dengan logo kiri/kanan
  - Prop `reportKey` untuk konfigurasi spesifik
  - Preview dinamis

#### ReportLetterheadSettings
- **File**: `src/components/ReportLetterheadSettings.tsx`
- **Fitur**:
  - Pilih scope: Global atau Per Laporan
  - Upload logo kiri/kanan
  - Preview real-time
  - Validasi input

### 5. Excel Export Integration
- **File**: `backend/export/excelBuilder.js`
- **Fitur**:
  - Dukungan logo kiri/kanan
  - Perataan dinamis
  - Merge cells untuk KOP

### 6. Report Keys
Konstanta untuk jenis laporan:
- `REPORT_BANDING_ABSEN` - Banding Absen
- `REPORT_PRESENSI_SISWA` - Presensi Siswa
- `REPORT_KEHADIRAN_SISWA` - Kehadiran Siswa
- `REPORT_REKAP_KETIDAKHADIRAN` - Rekap Ketidakhadiran
- `REPORT_RIWAYAT_BANDING` - Riwayat Banding
- `REPORT_LAPORAN_GURU` - Laporan Guru
- `REPORT_LAPORAN_SISWA` - Laporan Siswa

## Cara Penggunaan

### 1. Migrasi Database
```bash
# Jalankan migrasi
node migrate-db.cjs

# Atau jalankan SQL langsung
mysql -u root -p absenta13 < backend/migrations/20251003_add_kop_laporan.sql
```

### 2. Konfigurasi KOP Global
1. Login sebagai Admin
2. Pilih menu "Kop Laporan"
3. Pilih "Global (Semua Laporan)"
4. Atur konfigurasi KOP
5. Upload logo jika diperlukan
6. Simpan

### 3. Konfigurasi KOP Per Laporan
1. Login sebagai Admin
2. Pilih menu "Kop Laporan"
3. Pilih "Per Jenis Laporan"
4. Pilih jenis laporan yang akan dikonfigurasi
5. Atur konfigurasi KOP spesifik
6. Simpan

### 4. Penggunaan di Frontend
```tsx
// Gunakan hook dengan reportKey
const { letterhead } = useLetterhead('REPORT_KEHADIRAN_SISWA');

// Gunakan ExcelPreview dengan reportKey
<ExcelPreview
  title="Laporan Kehadiran"
  reportKey="REPORT_KEHADIRAN_SISWA"
  data={data}
  columns={columns}
/>
```

## File yang Dimodifikasi

### Backend
- `backend/migrations/20251003_add_kop_laporan.sql` (baru)
- `backend/utils/letterheadService.js` (baru)
- `backend/export/excelBuilder.js` (diupdate)
- `server_modern.js` (diupdate)

### Frontend
- `src/hooks/useLetterhead.ts` (diupdate)
- `src/components/ExcelPreview.tsx` (diupdate)
- `src/components/ReportLetterheadSettings.tsx` (diupdate)
- `src/components/TeacherDashboard_Modern.tsx` (diupdate)

### Scripts
- `migrate-db.cjs` (baru)
- `run-migration.js` (baru)

## Keamanan
- Upload logo: Validasi tipe file (JPG, PNG, GIF) dan ukuran (max 2MB)
- Akses CRUD: Role admin only
- Konsumsi KOP: Role guru, siswa, admin
- Sanitasi nama file upload

## Fallback & Kompatibilitas
- Jika database kosong, sistem menggunakan konfigurasi default
- Endpoint lama tetap berfungsi untuk kompatibilitas
- Cache 5 menit untuk performa optimal

## Testing
1. Test konfigurasi KOP global
2. Test konfigurasi KOP per laporan
3. Test upload logo
4. Test export Excel dengan KOP
5. Test preview di UI
6. Test fallback jika database error

## Troubleshooting

### Database Connection Error
```bash
# Cek koneksi database
mysql -u root -p -e "SHOW DATABASES;"

# Cek tabel
mysql -u root -p absenta13 -e "SHOW TABLES LIKE 'kop_laporan';"
```

### Logo Upload Error
- Pastikan folder `public/uploads/letterheads/` ada
- Cek permission folder
- Validasi ukuran file (max 2MB)

### Cache Issues
```javascript
// Clear cache manual
import { clearLetterheadCache } from './src/hooks/useLetterhead';
clearLetterheadCache(); // Clear all
clearLetterheadCache('REPORT_KEHADIRAN_SISWA'); // Clear specific
```

## Next Steps
1. Jalankan migrasi database
2. Test semua fitur
3. Deploy ke production
4. Monitor performa
5. Dokumentasi user manual
