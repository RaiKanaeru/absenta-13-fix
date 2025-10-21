# 🚀 Panduan Cepat - Sistem Kop Laporan Dinamis

## ✅ Status: Migration COMPLETE!

Migration sudah berhasil dijalankan! Database sudah siap dengan 7 konfigurasi letterhead.

---

## 📋 Yang Sudah Selesai ✅

### 1. Database
- ✅ Table `system_config` sudah ada
- ✅ 7 letterhead configs sudah diinsert:
  - `letterhead_global` (config default)
  - `letterhead_teacher_summary` (NULL - pakai global)
  - `letterhead_student_summary` (NULL - pakai global)
  - `letterhead_presensi_siswa` (NULL - pakai global)
  - `letterhead_rekap_ketidakhadiran` (NULL - pakai global)
  - `letterhead_rekap_guru` (NULL - pakai global)
  - `letterhead_banding_absen` (NULL - pakai global)

### 2. Backend
- ✅ Admin endpoints ready (GET, POST, Preview)
- ✅ Export endpoints updated:
  - `/api/export/rekap-ketidakhadiran-guru` ✅
  - `/api/export/absensi` ✅

### 3. Frontend
- ✅ Admin page "Pengaturan Kop Laporan" ready

---

## 🎯 Langkah Selanjutnya (HARUS DILAKUKAN)

### Step 1: Konfigurasi Letterhead via Admin UI

#### A. Login sebagai Admin
```
1. Buka browser → http://localhost:5173 (atau port frontend Anda)
2. Login:
   Username: admin
   Password: admin123
```

#### B. Akses Halaman Pengaturan Kop
```
1. Lihat sidebar menu di kiri
2. Cari menu "Kop Laporan" atau "Pengaturan Kop Laporan"
3. Klik untuk membuka halaman
```

#### C. Upload Logo Sekolah

**Opsi 1: Layout Kiri-Kanan** (RECOMMENDED)
```
1. Di dropdown "Posisi Logo", pilih: "Kiri-Kanan"
2. Upload Logo Kiri:
   - Klik area upload logo kiri
   - Pilih file logo provinsi/dinas pendidikan
   - Format: PNG/JPG, max 2MB
3. Upload Logo Kanan:
   - Klik area upload logo kanan
   - Pilih file logo sekolah
   - Format: PNG/JPG, max 2MB
```

**Opsi 2: Layout Tengah**
```
1. Di dropdown "Posisi Logo", pilih: "Tengah"
2. Upload Logo Tengah:
   - Klik area upload
   - Pilih file logo sekolah
   - Format: PNG/JPG, max 2MB
```

#### D. Konfigurasi Text Kop Surat

Masukkan baris teks kop (4-6 baris):
```
Baris 1: PEMERINTAH DAERAH PROVINSI JAWA BARAT
Baris 2: DINAS PENDIDIKAN
Baris 3: SMK NEGERI 13 BANDUNG
Baris 4: Jl. Alamat Lengkap Sekolah, Kota, Kode Pos
Baris 5: Telp: (021) 12345678 | Email: info@smkn13.sch.id
Baris 6: Website: www.smkn13.sch.id
```

**Tips**:
- Baris 1-3: Informasi instansi (KAPITAL)
- Baris 4-6: Kontak dan alamat (huruf biasa)

#### E. Set Alignment
```
Di dropdown "Alignment/Posisi Teks", pilih: "Tengah"
```

#### F. Simpan Konfigurasi
```
1. Klik tombol "Simpan" atau "Simpan Konfigurasi"
2. Tunggu notifikasi success
3. Jika berhasil, akan muncul: "Konfigurasi berhasil disimpan"
```

#### G. Test Preview
```
1. Klik tombol "Preview HTML"
2. Akan muncul modal/popup preview
3. Verify:
   ✅ Logo tampil dengan benar
   ✅ Text kop tampil dengan benar
   ✅ Layout sesuai yang diinginkan
4. Close preview
```

---

### Step 2: Test Export Reports

#### A. Test Export Rekap Ketidakhadiran Guru

```
1. Login sebagai admin (jika belum)
2. Menu sidebar → "Laporan" atau "Reports"
3. Pilih "Rekap Ketidakhadiran Guru"
4. Set parameter:
   - Tahun: 2025
   - Bulan: Oktober (atau bulan sekarang)
5. Klik "Export to Excel" atau "Download Excel"
6. File akan download
```

**Verify Excel**:
```
1. Buka file Excel yang didownload
2. Check bagian atas (header):
   ✅ Logo kiri dan kanan muncul (jika pakai layout kiri-kanan)
   ✅ Text kop muncul dengan format bagus:
      - PEMERINTAH DAERAH PROVINSI JAWA BARAT (bold, center)
      - DINAS PENDIDIKAN (center)
      - SMK NEGERI 13 BANDUNG (center)
      - Alamat dan kontak (center)
   ✅ Garis separator
   ✅ Title "REKAP KETIDAKHADIRAN GURU"
   ✅ Periode
   ✅ Data guru
```

**Expected Excel Layout**:
```
[Logo Kiri]                                    [Logo Kanan]
                                  
        PEMERINTAH DAERAH PROVINSI JAWA BARAT
                    DINAS PENDIDIKAN
                 SMK NEGERI 13 BANDUNG
       Jl. Alamat Sekolah, Kota, Kode Pos
    Telp: (021) xxx | Email: info@sekolah.sch.id

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           REKAP KETIDAKHADIRAN GURU
                Periode: Oktober 2025

┌──────┬─────────┬──────────────┬─────────────┐
│ No   │ NIP     │ Nama Guru    │ Hadir       │
├──────┼─────────┼──────────────┼─────────────┤
│ 1    │ 123456  │ Budi S.Pd    │ 20          │
└──────┴─────────┴──────────────┴─────────────┘
```

#### B. Test Export Data Absensi

```
1. Menu → "Laporan" → "Absensi Guru" (atau similar)
2. Set date range:
   - Tanggal Mulai: 2025-10-01
   - Tanggal Akhir: 2025-10-31
3. Klik "Export"
4. Download file
```

**Verify Excel**:
```
1. Buka file
2. Check:
   ✅ Letterhead muncul di atas
   ✅ Title "DATA ABSENSI GURU"
   ✅ Periode ditampilkan
   ✅ Data absensi complete
```

---

### Step 3: Test Different Report Types (Optional)

Jika ada export lain, test juga:

```
□ Export Summary Guru
□ Export Summary Siswa
□ Export Presensi Siswa
□ Export Rekap Ketidakhadiran Siswa
□ Export Banding Absen
```

**Untuk setiap export**:
1. Jalankan export
2. Verify letterhead muncul
3. Verify data correct

---

## 🔧 Konfigurasi Lanjutan (Optional)

### A. Set Letterhead Berbeda Per Jenis Laporan

Jika ingin kop berbeda untuk laporan tertentu:

```
1. Buka "Pengaturan Kop Laporan"
2. Di dropdown "Cakupan KOP", pilih jenis laporan:
   - Teacher Summary
   - Student Summary
   - Rekap Guru
   - dll
3. Upload logo dan set text khusus untuk laporan itu
4. Simpan
```

**Note**: Jika tidak diset, otomatis pakai kop global.

### B. Update Kop Surat

Untuk mengubah kop surat:

```
1. Buka "Pengaturan Kop Laporan"
2. Pilih "Global (Semua Laporan)"
3. Upload logo baru (jika perlu)
4. Edit text kop
5. Simpan
6. Semua export berikutnya akan pakai kop baru
```

**NO SERVER RESTART NEEDED!** ✅

---

## 📊 Troubleshooting

### Issue 1: Logo tidak muncul di export

**Penyebab**:
- Logo belum diupload
- Format file tidak supported
- File terlalu besar

**Solusi**:
```
1. Check di admin page apakah logo preview muncul
2. Re-upload logo dengan format PNG/JPG
3. Pastikan ukuran < 2MB
4. Klik "Simpan" lagi
5. Test export ulang
```

### Issue 2: Text kop berantakan

**Penyebab**:
- Text terlalu panjang
- Format tidak sesuai

**Solusi**:
```
1. Buat text lebih pendek per baris
2. Maksimal 60-80 karakter per baris
3. Gunakan 4-6 baris saja
4. Simpan dan test ulang
```

### Issue 3: Kop tidak muncul sama sekali

**Penyebab**:
- Config belum disimpan
- Database issue

**Solusi**:
```
1. Check database:
   SELECT * FROM system_config WHERE config_key = 'letterhead_global';
   
2. Harus return 1 row dengan config_value berisi JSON

3. Jika NULL atau tidak ada:
   - Buka admin page
   - Konfigurasi ulang
   - Klik "Simpan"
   
4. Test export ulang
```

### Issue 4: Preview HTML tidak muncul

**Penyebab**:
- Browser cache
- JavaScript error

**Solusi**:
```
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh page (Ctrl+F5)
3. Check browser console (F12) untuk error
4. Try different browser
```

---

## ✅ Success Checklist

Print dan centang setiap item:

### Migration & Setup:
- [x] Migration berhasil dijalankan
- [x] 7 letterhead configs di database
- [x] Backend endpoints ready
- [x] Frontend page accessible

### Configuration:
- [ ] Logo sekolah uploaded
- [ ] Text kop configured
- [ ] Preview HTML works
- [ ] Config saved successfully

### Export Testing:
- [ ] Export Rekap Guru shows letterhead
- [ ] Export Absensi shows letterhead
- [ ] Letterhead format correct
- [ ] Data displays properly

### Advanced (Optional):
- [ ] Different letterhead per report tested
- [ ] Fallback to global tested
- [ ] Update letterhead tested

---

## 📚 Documentation Files

Untuk informasi lebih lengkap, lihat:

1. **`LETTERHEAD_SYSTEM_IMPLEMENTATION.md`**
   - Penjelasan lengkap sistem
   - Technical details
   - Backend patterns

2. **`LETTERHEAD_TESTING_GUIDE.md`**
   - Testing procedures lengkap
   - Database verification queries
   - API testing examples

3. **`LETTERHEAD_IMPLEMENTATION_COMPLETE.md`**
   - Complete implementation summary
   - All changes documented
   - Success verification

4. **`RUN_LETTERHEAD_MIGRATION.md`**
   - Migration instructions (sudah dilakukan ✅)
   - Verification steps

5. **`LETTERHEAD_QUICKSTART_GUIDE.md`** (This file)
   - Quick start guide
   - Step-by-step instructions

---

## 🎯 Expected Timeline

**Step 1: Configure Letterhead** (5-10 menit)
- Upload logo: 2 menit
- Set text kop: 2 menit
- Save & preview: 1 menit
- Verify: 1 menit

**Step 2: Test Exports** (5 menit)
- Test Rekap Guru: 2 menit
- Test Absensi: 2 menit
- Verify Excel: 1 menit

**Total**: ~15 menit untuk complete setup ✅

---

## 🎉 Benefits You Get

Setelah selesai, Anda akan mendapatkan:

✅ **Dynamic Letterhead**
- Ubah kop via UI (no code edit)
- Update langsung apply ke semua export
- No server restart needed

✅ **Professional Reports**
- Logo sekolah di semua laporan
- Header terstruktur dengan baik
- Konsisten di semua export

✅ **Easy Maintenance**
- Ganti logo kapan saja
- Update alamat/kontak mudah
- Centralized configuration

✅ **Flexible**
- Bisa beda kop per laporan
- Atau pakai 1 kop untuk semua
- Auto fallback ke global

---

## 📞 Need Help?

Jika ada masalah:

1. **Check Documentation**: Lihat file .md lainnya
2. **Check Database**: 
   ```sql
   SELECT * FROM system_config WHERE config_key LIKE 'letterhead%';
   ```
3. **Check Backend Log**: Lihat console server untuk errors
4. **Check Frontend Console**: Press F12 di browser

---

**Last Updated**: 22 Oktober 2025  
**Status**: Migration Complete ✅  
**Ready for**: Configuration & Testing  
**Next Action**: Configure letterhead via Admin UI (Step 1)

🚀 **Selamat! Sistem letterhead dinamis sudah siap digunakan!**

