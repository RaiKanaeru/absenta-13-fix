# Implementasi Kop Laporan Terpusat

## Overview
Sistem kop laporan terpusat memungkinkan admin untuk mengatur header/kop yang akan digunakan di semua laporan (cetak HTML dan ekspor Excel) baik di halaman Admin maupun Guru.

## Fitur yang Diimplementasikan

### 1. Backend Configuration
- **File**: `backend/config/report-letterhead.json`
- **Utility**: `backend/utils/letterheadManager.js`
- **API Endpoints**:
  - `GET /api/admin/report-letterhead` - Ambil konfigurasi kop
  - `PUT /api/admin/report-letterhead` - Simpan konfigurasi kop

### 2. Frontend Components
- **Settings UI**: `src/components/ReportLetterheadSettings.tsx`
- **Hook**: `src/hooks/useLetterhead.ts`
- **Print Utils**: `src/utils/printLayouts.ts` (updated)

### 3. Excel Export Integration
- **Builder**: `backend/export/excelBuilder.js` (updated)
- **Endpoints**: Semua endpoint ekspor Excel menggunakan letterhead dinamis

## Struktur Konfigurasi

```json
{
  "enabled": true,
  "logo": "data:image/png;base64,...", // Base64 atau URL publik
  "lines": [
    "PEMERINTAH DAERAH PROVINSI DKI JAKARTA",
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
  ],
  "alignment": "center" // left, center, right
}
```

## Cara Penggunaan

### 1. Akses Menu Admin
1. Login sebagai Admin
2. Pilih menu "Kop Laporan" di dashboard admin
3. Atur konfigurasi kop sesuai kebutuhan

### 2. Konfigurasi Kop
- **Toggle Aktif/Nonaktif**: Enable/disable kop di semua laporan
- **Upload Logo**: Upload logo (maksimal 2MB, format JPG/PNG/GIF)
- **Baris Teks**: Tambah/hapus/edit baris teks (maksimal 10 baris)
- **Posisi Teks**: Pilih alignment (kiri/tengah/kanan)
- **Preview**: Lihat preview kop sebelum menyimpan

### 3. Penerapan Otomatis
Setelah disimpan, kop akan otomatis diterapkan ke:
- **Cetak HTML**: Semua layout (simple, detailed, compact, official)
- **Ekspor Excel**: Semua laporan di halaman Admin dan Guru

## Endpoint yang Terintegrasi

### Excel Export (Backend)
- `/api/admin/download-student-attendance-excel`
- `/api/admin/download-teacher-attendance-excel`
- `/api/export/riwayat-banding-absen`
- `/api/export/ringkasan-kehadiran-siswa-smkn13`
- Dan endpoint ekspor Excel lainnya

### Print HTML (Frontend)
- Semua fungsi `printReport()` di komponen Admin dan Guru
- Layout: simple, detailed, compact, official

## Validasi & Security

### Backend Validation
- Logo: Maksimal 2MB, format image valid
- Lines: 1-10 baris, maksimal 200 karakter per baris
- Alignment: Hanya left, center, right
- Authentication: Hanya role admin yang bisa akses

### Frontend Validation
- File upload: Validasi ukuran dan format
- Form validation: Required fields dan format
- Error handling: Toast notifications untuk feedback

## Fallback & Error Handling

### Jika Konfigurasi Tidak Ada
- Menggunakan default letterhead (SMK Negeri 13 Jakarta)
- Laporan tetap bisa dibuat tanpa error

### Jika API Error
- Frontend fallback ke default configuration
- Cache 5 menit untuk performa optimal

## Testing Checklist

### ✅ Backend
- [x] API GET/PUT letterhead berfungsi
- [x] Validasi input bekerja
- [x] File JSON tersimpan dengan benar
- [x] Excel export menggunakan letterhead dinamis

### ✅ Frontend
- [x] UI settings lengkap dan responsif
- [x] Preview kop bekerja
- [x] Upload logo berfungsi
- [x] Form validation bekerja
- [x] Menu admin terintegrasi

### ✅ Integration
- [x] Print HTML menggunakan letterhead dinamis
- [x] Excel export konsisten dengan kop yang sama
- [x] Cache dan error handling bekerja
- [x] Fallback ke default jika error

## File yang Dimodifikasi

### Backend
- `server_modern.js` - Added letterhead API endpoints
- `backend/export/excelBuilder.js` - Dynamic letterhead support
- `backend/utils/letterheadManager.js` - New utility for letterhead management
- `backend/config/report-letterhead.json` - Configuration file

### Frontend
- `src/components/AdminDashboard_Modern.tsx` - Added menu item
- `src/components/ReportLetterheadSettings.tsx` - New settings component
- `src/hooks/useLetterhead.ts` - New hook for letterhead management
- `src/utils/printLayouts.ts` - Updated print layouts with letterhead support

## Catatan Implementasi

1. **Logo di Excel**: Saat ini logo tidak ditampilkan di Excel karena keterbatasan ExcelJS, fokus pada teks
2. **Cache**: Konfigurasi di-cache 5 menit untuk performa
3. **Backward Compatibility**: Semua laporan tetap berfungsi dengan fallback ke default
4. **Security**: Hanya admin yang bisa mengubah konfigurasi kop

## Troubleshooting

### Kop Tidak Muncul
1. Cek apakah `enabled: true` di konfigurasi
2. Pastikan ada minimal 1 baris teks
3. Cek console untuk error API

### Logo Tidak Muncul
1. Pastikan format file valid (JPG/PNG/GIF)
2. Cek ukuran file maksimal 2MB
3. Untuk Excel, logo tidak didukung saat ini

### Error API
1. Pastikan user login sebagai admin
2. Cek koneksi ke backend
3. Lihat log server untuk detail error
