# Format Import Jadwal Absenta

## Struktur Sheet Excel

### Sheet 1: Jadwal

| Kolom | Keterangan | Format | Wajib | Contoh |
|-------|------------|--------|-------|--------|
| Kelas | Nama kelas | Text | Ya | X AK 1, XI TKJ 2 |
| Mapel | Nama mata pelajaran | Text | Ya | Matematika, Bahasa Indonesia |
| Guru | Nama guru | Text | Ya | Budi Santoso, Siti Aminah |
| Hari | Hari pembelajaran | Text | Ya | Senin, Selasa, Rabu, Kamis, Jumat |
| Jam_Ke | Jam pelajaran | Angka | Ya | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Jam_Mulai | Waktu mulai | HH:MM | Ya | 07:00, 08:00, 09:00 |
| Jam_Selesai | Waktu selesai | HH:MM | Ya | 08:00, 09:00, 10:00 |
| Ruang | Kode ruangan | Text | Tidak | R-101, R-102, LAB-01 |

## Contoh Data Valid

| Kelas | Mapel | Guru | Hari | Jam_Ke | Jam_Mulai | Jam_Selesai | Ruang |
|-------|-------|------|------|--------|-----------|-------------|-------|
| X AK 1 | Matematika | Budi Santoso | Senin | 1 | 07:00 | 08:00 | R-101 |
| X AK 1 | Bahasa Indonesia | Siti Aminah | Senin | 2 | 08:00 | 09:00 | R-101 |
| X AK 1 | Bahasa Inggris | Ahmad Wijaya | Senin | 3 | 09:00 | 10:00 | R-102 |
| XI TKJ 1 | Pemrograman Web | Dedi Kurniawan | Senin | 1 | 07:00 | 08:00 | LAB-01 |
| XI TKJ 1 | Database | Rina Sari | Senin | 2 | 08:00 | 09:00 | LAB-01 |

## Aturan Validasi

### 1. Format Hari
- Hanya menggunakan: Senin, Selasa, Rabu, Kamis, Jumat
- Tidak boleh: Sabtu, Minggu, atau hari lainnya

### 2. Format Waktu
- Jam_Mulai dan Jam_Selesai harus dalam format HH:MM (24 jam)
- Contoh valid: 07:00, 08:30, 13:00
- Contoh tidak valid: 7:00, 8.30, 1:00 PM

### 3. Jam Pelajaran
- Harus berupa angka 1-10
- Tidak boleh kosong atau huruf

### 4. Nama Data
- Kelas, Mapel, Guru harus sesuai dengan data yang ada di sistem
- Nama harus persis sama (case sensitive)

## Deteksi Bentrok

Sistem akan otomatis mendeteksi bentrok:

### 1. Bentrok Guru
- Guru yang sama mengajar di jam yang sama
- Contoh: Guru A mengajar Matematika di X AK 1 jam 07:00-08:00 dan Bahasa Indonesia di XI TKJ 1 jam 07:00-08:00

### 2. Bentrok Kelas
- Kelas yang sama memiliki mata pelajaran berbeda di jam yang sama
- Contoh: X AK 1 memiliki Matematika jam 07:00-08:00 dan Bahasa Indonesia jam 07:00-08:00

### 3. Bentrok Ruang
- Ruang yang sama digunakan oleh kelas berbeda di jam yang sama
- Contoh: R-101 digunakan oleh X AK 1 jam 07:00-08:00 dan XI TKJ 1 jam 07:00-08:00

## Langkah Import

1. **Download Template**
   - Klik tombol "Download Template Import" di halaman admin
   - File akan terdownload dengan nama `Template_Import_Jadwal.xlsx`

2. **Isi Data**
   - Buka file template yang sudah didownload
   - Isi data sesuai format yang telah ditentukan
   - Pastikan tidak ada bentrok jadwal

3. **Upload File**
   - Klik tombol "Import Jadwal" di halaman admin
   - Pilih file Excel yang sudah diisi
   - Klik "Upload"

4. **Validasi**
   - Sistem akan menampilkan preview data
   - Cek apakah ada bentrok atau error
   - Perbaiki jika ada masalah

5. **Simpan**
   - Jika tidak ada error, klik "Simpan Jadwal"
   - Data akan tersimpan ke database

## Tips dan Saran

### 1. Persiapan Data
- Pastikan data Kelas, Mapel, dan Guru sudah ada di sistem
- Gunakan nama yang persis sama dengan data di database

### 2. Penjadwalan
- Buat jadwal per kelas terlebih dahulu
- Hindari bentrok dengan mengecek jadwal yang sudah ada
- Gunakan ruang yang tersedia

### 3. Validasi
- Selalu preview data sebelum menyimpan
- Periksa deteksi bentrok yang ditampilkan sistem
- Pastikan format waktu sudah benar

### 4. Backup
- Backup data jadwal yang sudah ada sebelum import
- Simpan file Excel sebagai backup

## Troubleshooting

### Error: "Kelas tidak ditemukan"
- Pastikan nama kelas sesuai dengan data di sistem
- Cek di menu "Manajemen Kelas"

### Error: "Guru tidak ditemukan"
- Pastikan nama guru sesuai dengan data di sistem
- Cek di menu "Manajemen Guru"

### Error: "Mapel tidak ditemukan"
- Pastikan nama mata pelajaran sesuai dengan data di sistem
- Cek di menu "Manajemen Mata Pelajaran"

### Error: "Bentrok jadwal"
- Periksa jadwal yang bentrok
- Ubah waktu atau ruang untuk menghindari bentrok
- Pastikan guru tidak mengajar di 2 tempat bersamaan

## Support

Jika mengalami kesulitan, hubungi administrator sistem atau lihat dokumentasi lengkap di menu "Bantuan".
