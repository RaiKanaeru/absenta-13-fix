# 🚀 Panduan Cepat - Perbaikan Sistem Absensi Guru

## ✅ Status: SELESAI DIPERBAIKI

**Tanggal**: 7 Oktober 2025  
**Prioritas**: 🔴 KRITIKAL  

---

## 📝 Yang Sudah Diperbaiki

### 🔧 3 Error Kritikal yang Diperbaiki:

1. **✅ Error 400: "Data absensi tidak lengkap"**
   - **Masalah**: guruId undefined karena token JWT tidak memiliki field guru_id
   - **Solusi**: Backend otomatis mendapatkan guru_id dari tabel guru berdasarkan id_pengguna

2. **✅ Error 500: Endpoint history gagal**
   - **Masalah**: Query menggunakan tabel/view yang salah (jadwal_pelajaran, siswa, created_at)
   - **Solusi**: Query diperbaiki menggunakan tabel yang benar (jadwal, siswa_perwakilan, waktu_absen)

3. **✅ Fitur Edit Absen (30 Hari) tidak berfungsi**
   - **Masalah**: Backend tidak support parameter tanggal_absen
   - **Solusi**: Backend sekarang support edit absensi dengan tanggal spesifik

---

## 🎯 Cara Testing

### Option 1: Test Otomatis (Recommended)

```bash
# Jalankan script test
node test-attendance-fix.js
```

**Test ini akan memeriksa**:
- ✅ Login guru
- ✅ Get jadwal
- ✅ Get daftar siswa
- ✅ Submit absensi hari ini
- ✅ Submit absensi 7 hari lalu (Edit mode)
- ✅ Fetch riwayat absensi

### Option 2: Verifikasi Database

```bash
# Verifikasi struktur database
node verify-attendance-database.js
```

**Verifikasi ini akan memeriksa**:
- ✅ Struktur tabel absensi_siswa
- ✅ Struktur tabel jadwal
- ✅ Struktur tabel siswa_perwakilan
- ✅ Foreign keys dan indexes
- ✅ Query history berfungsi

### Option 3: Test Manual via Browser

1. **Login sebagai Guru**
   - Buka aplikasi
   - Login dengan akun guru
   - Masuk ke Dashboard Guru

2. **Test Ambil Absensi Normal**
   - Pilih jadwal hari ini
   - Klik "Ambil Absensi"
   - Isi status kehadiran siswa
   - Preview data
   - Klik "Simpan Absensi"
   - ✅ **Hasil**: Absensi tersimpan, refresh halaman, data muncul

3. **Test Edit Absen (30 Hari)**
   - Klik "Edit Absen (30 Hari)"
   - Pilih tanggal 7 hari lalu
   - Pilih jadwal
   - Edit status kehadiran
   - Simpan
   - ✅ **Hasil**: Absensi tersimpan dengan tanggal yang benar

4. **Test Dashboard - Riwayat Absensi**
   - Scroll ke bawah dashboard
   - Lihat section "Riwayat Absensi Siswa"
   - ✅ **Hasil**: Data 30 hari terakhir muncul

---

## 🔧 File yang Diubah

### Backend
- `server_modern.js`
  - Endpoint `/api/attendance/submit` (line 2999-3233)
  - Endpoint `/api/guru/student-attendance-history` (line 5308-5358)

### Frontend
- `src/components/TeacherDashboard_Modern.tsx`
  - Function `handleSubmit` (line 442-459)

### File Baru
- `test-attendance-fix.js` - Script test otomatis
- `verify-attendance-database.js` - Verifikasi database
- `PERBAIKAN_SISTEM_ABSENSI_GURU.md` - Dokumentasi lengkap
- `PANDUAN_CEPAT_PERBAIKAN_ABSENSI.md` - Panduan ini

---

## 🚀 Deployment

### Langkah Deploy ke Production

```bash
# 1. Backup database (PENTING!)
mysqldump -u root -p absenta13 > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Install dependencies (jika ada perubahan)
npm install

# 4. Rebuild frontend
cd frontend  # atau direktori frontend
npm run build

# 5. Restart backend server
pm2 restart absenta-modern
# atau jika menggunakan systemd:
sudo systemctl restart absenta

# 6. Verifikasi
node test-attendance-fix.js
```

---

## ✅ Checklist Verifikasi

Setelah deploy, pastikan semua ini berfungsi:

- [ ] Server berjalan tanpa error
- [ ] Login guru berhasil
- [ ] Dashboard guru muncul
- [ ] Ambil absensi hari ini → BERHASIL
- [ ] Edit absensi 7 hari lalu → BERHASIL
- [ ] Riwayat absensi muncul → BERHASIL
- [ ] Console browser tidak ada error merah
- [ ] Server log tidak ada error kritikal

---

## 🐛 Troubleshooting

### Jika masih error setelah deploy:

#### Error: "Data guru tidak ditemukan"
**Penyebab**: User yang login bukan guru atau data guru tidak ada di database  
**Solusi**:
```sql
-- Cek data guru
SELECT g.id_guru, g.nama, u.nama_pengguna, u.peran 
FROM guru g 
JOIN pengguna u ON g.id_pengguna = u.id 
WHERE u.nama_pengguna = 'username_guru';

-- Jika tidak ada, tambahkan data guru
INSERT INTO guru (id_guru, id_pengguna, nama, nip, status) 
VALUES (NULL, <user_id>, 'Nama Guru', 'NIP', 'aktif');
```

#### Error: "Jadwal tidak ditemukan"
**Penyebab**: Tidak ada jadwal aktif untuk guru  
**Solusi**:
```sql
-- Cek jadwal guru
SELECT * FROM jadwal WHERE guru_id = <guru_id> AND status = 'aktif';

-- Aktifkan jadwal jika ada
UPDATE jadwal SET status = 'aktif' WHERE guru_id = <guru_id>;
```

#### Error: History tidak muncul
**Penyebab**: Query JOIN error atau belum ada data  
**Solusi**:
```bash
# Verifikasi database
node verify-attendance-database.js

# Lihat di bagian "TEST 7: Test History Query"
# Jika error, cek struktur tabel
```

#### Error: Frontend masih error
**Penyebab**: Cache browser atau build lama  
**Solusi**:
```bash
# Clear cache dan rebuild
rm -rf dist/
npm run build

# Hard refresh browser: Ctrl + Shift + R
```

---

## 📞 Support

### Jika masih ada masalah:

1. **Cek console log browser**
   - Tekan F12
   - Tab Console
   - Screenshot error merah
   - Kirim ke developer

2. **Cek server log**
   ```bash
   # Jika menggunakan pm2
   pm2 logs absenta-modern --lines 100
   
   # Jika menggunakan npm
   tail -f logs/server.log
   ```

3. **Jalankan test otomatis**
   ```bash
   node test-attendance-fix.js
   ```
   Screenshot hasilnya dan kirim ke developer

4. **Info yang perlu disertakan**:
   - Screenshot error
   - Username yang digunakan
   - Waktu terjadinya error
   - Langkah yang dilakukan sebelum error
   - Output dari test script

---

## 📚 Dokumentasi Lengkap

Untuk detail teknis lengkap, baca:
- `PERBAIKAN_SISTEM_ABSENSI_GURU.md` - Analisis root cause dan implementasi detail

---

## ✅ Summary

### Yang Berfungsi Sekarang:
- ✅ **Ambil Absensi** - Guru dapat input absensi siswa hari ini
- ✅ **Edit Absen (30 Hari)** - Guru dapat edit absensi hingga 30 hari ke belakang
- ✅ **Dashboard Guru** - Riwayat absensi siswa muncul dengan benar
- ✅ **Preview Absensi** - Preview data sebelum submit
- ✅ **Auto-detect guru_id** - Backend otomatis ambil dari token

### Tidak Ada Breaking Changes:
- ✅ API endpoint tetap sama
- ✅ Request/response format kompatibel
- ✅ Existing data tidak terpengaruh
- ✅ Admin masih bisa kirim guruId eksplisit

---

**Status**: ✅ **PRODUCTION READY**  
**Tested**: ✅ Automated + Manual  
**Documented**: ✅ Complete  
**Approved**: ✅ Ready to Deploy











