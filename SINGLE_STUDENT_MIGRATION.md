# Migrasi Single Student Mode - Banding Absen & Pengajuan Izin

## Overview
Dokumen ini menjelaskan migrasi sistem dari bulk/multiple student mode ke single student mode untuk fitur banding absen dan pengajuan izin.

## Perubahan yang Dilakukan

### 1. Frontend Changes

#### Form Banding Absen
- **File**: `src/components/StudentDashboard_Modern.tsx`
- **Perubahan**:
  - Menghapus multi-select interface untuk siswa
  - Mengubah form menjadi single student mode
  - Menambahkan field `status_asli`, `status_diajukan`, `alasan_banding`, `bukti_pendukung`
  - Mengupdate state form dari array ke single object
  - Mengubah endpoint dari `/api/siswa/:siswaId/banding-absen-kelas` ke `/api/siswa/banding-absen-single`

#### Form Pengajuan Izin
- **File**: `src/components/StudentDashboard_Modern.tsx`
- **Perubahan**:
  - Menghapus multi-select interface untuk siswa
  - Mengubah form menjadi single student mode
  - Menambahkan field `jenis_izin`, `alasan`, `bukti_pendukung`
  - Mengupdate state form dari array ke single object
  - Mengubah endpoint dari `/api/siswa/:siswaId/pengajuan-izin-kelas` ke `/api/siswa/pengajuan-izin-single`

### 2. Backend Changes

#### Endpoint Deprecation
- **File**: `server_modern.js`
- **Perubahan**:
  - Endpoint `/api/siswa/:siswaId/banding-absen-kelas` di-deprecate
  - Endpoint `/api/siswa/:siswaId/pengajuan-izin-kelas` di-deprecate
  - Kedua endpoint sekarang mengembalikan error 400 dengan pesan redirect ke single student endpoint

#### Single Student Endpoints
- **File**: `server_modern.js`
- **Endpoints yang digunakan**:
  - `POST /api/siswa/banding-absen-single` - untuk pengajuan banding absen single student
  - `POST /api/siswa/pengajuan-izin-single` - untuk pengajuan izin single student
  - `GET /api/siswa/banding-absen-single` - untuk melihat riwayat banding absen
  - `GET /api/siswa/pengajuan-izin-single` - untuk melihat riwayat pengajuan izin

### 3. Database Changes

#### Migration Script
- **File**: `migrations/update_banding_izin_single_student.sql`
- **Perubahan**:
  - Menambahkan kolom deprecation ke tabel `banding_absen_detail` dan `pengajuan_izin_detail`
  - Mark semua data di tabel detail sebagai deprecated
  - Menambahkan index untuk performa query
  - Membuat view untuk backward compatibility

#### Tabel yang Digunakan
- **Single Student Mode**:
  - `banding_absen` - untuk data banding absen single student
  - `pengajuan_izin_siswa` - untuk data pengajuan izin single student

- **Deprecated Tables**:
  - `banding_absen_detail` - di-mark sebagai deprecated
  - `pengajuan_izin_detail` - di-mark sebagai deprecated

## Cara Menjalankan Migration

### 1. Backup Database
```bash
mysqldump -u username -p database_name > backup_before_single_student_migration.sql
```

### 2. Jalankan Migration
```bash
# Menggunakan script Node.js
node run_single_student_migration.js

# Atau langsung dengan MySQL
mysql -u username -p database_name < migrations/update_banding_izin_single_student.sql
```

### 3. Restart Application
```bash
# Restart server backend
npm restart

# Restart frontend (jika menggunakan development server)
npm run dev
```

## Testing

### 1. Test Single Student Forms
- Login sebagai siswa
- Navigasi ke halaman banding absen dan pengajuan izin
- Pastikan form hanya menampilkan single student mode
- Test submit form dan pastikan data tersimpan dengan benar

### 2. Test Deprecated Endpoints
- Test endpoint bulk yang di-deprecate
- Pastikan mengembalikan error 400 dengan pesan redirect

### 3. Test Data Migration
- Pastikan data lama masih bisa diakses melalui view deprecated
- Pastikan data baru tersimpan di tabel single student

## Rollback Plan

Jika perlu rollback ke mode sebelumnya:

### 1. Restore Database
```bash
mysql -u username -p database_name < backup_before_single_student_migration.sql
```

### 2. Revert Code Changes
```bash
git revert <commit-hash>
```

### 3. Re-enable Bulk Endpoints
- Hapus deprecation logic dari endpoint bulk
- Restore form multi-select di frontend

## Benefits

### 1. Improved Tracking
- Setiap pengajuan memiliki tracking per siswa yang lebih jelas
- History per siswa lebih mudah dilacak

### 2. Simplified Approval Process
- Guru dapat memproses pengajuan satu per satu
- Status approval lebih jelas per siswa

### 3. Better Data Integrity
- Data tersimpan langsung di tabel utama
- Mengurangi kompleksitas relasi database

### 4. Enhanced User Experience
- Form lebih sederhana dan mudah digunakan
- Validasi lebih jelas dan spesifik

## Monitoring

### 1. Check Migration Status
```sql
SELECT 
    'Migration Status' as info,
    COUNT(*) as total_banding_absen,
    (SELECT COUNT(*) FROM banding_absen_detail WHERE is_deprecated = TRUE) as deprecated_banding_detail,
    (SELECT COUNT(*) FROM pengajuan_izin_detail WHERE is_deprecated = TRUE) as deprecated_izin_detail
FROM banding_absen;
```

### 2. Monitor Error Logs
- Periksa log aplikasi untuk error terkait deprecated endpoints
- Monitor performa query setelah migration

### 3. User Feedback
- Kumpulkan feedback dari pengguna tentang perubahan UI
- Monitor tingkat keberhasilan pengajuan

## Support

Jika mengalami masalah setelah migration:

1. Periksa log aplikasi untuk error details
2. Verifikasi konfigurasi database
3. Pastikan semua endpoint single student berfungsi dengan benar
4. Hubungi tim development untuk bantuan lebih lanjut

---

**Tanggal Migration**: 2025-01-03  
**Versi**: 1.0  
**Status**: Completed
