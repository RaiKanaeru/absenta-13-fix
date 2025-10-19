# Panduan Import Data via Excel - ABSENTA

## Overview
Fitur import Excel memungkinkan admin untuk menambah data secara massal menggunakan file Excel (.xlsx). Fitur ini tersedia untuk:
- **Data Siswa** - Import data siswa lengkap dengan opsi pembuatan akun
- **Data Guru** - Import data guru lengkap dengan opsi pembuatan akun  
- **Tambah Akun Guru** - Import akun login guru secara massal
- **Tambah Akun Siswa** - Import akun login siswa perwakilan secara massal
- **Mata Pelajaran** - Import mata pelajaran
- **Kelas** - Import data kelas
- **Jadwal Pelajaran** - Import jadwal pelajaran

## Cara Menggunakan

### 1. Akses Menu Import
1. Login sebagai **Admin**
2. Pilih menu yang ingin di-import:
   - **Data Siswa/Guru**: Import data lengkap + akun login (jika ada username/password)
   - **Tambah Akun Guru/Siswa**: Import akun login saja (fokus pada pembuatan akun)
   - **Mata Pelajaran, Kelas, Jadwal**: Import data master
3. Klik tombol **"Import Excel"** di pojok kanan atas

### 2. Download Template
1. Klik **"Unduh Template"** untuk mendapatkan file Excel template
2. Template sudah disesuaikan dengan format yang benar
3. Isi data sesuai template yang diunduh

### 3. Upload & Validasi
1. Klik **"Pilih File"** dan pilih file Excel (.xlsx) yang sudah diisi
2. Klik **"Validasi File"** untuk memeriksa data sebelum import
3. Sistem akan menampilkan:
   - Total baris data
   - Jumlah baris valid
   - Jumlah baris invalid
   - Detail error per baris (jika ada)

### 4. Import Data
1. Jika validasi berhasil, klik **"Import Data"**
2. Sistem akan memproses dan menyimpan data ke database
3. Hasil import akan ditampilkan

## Format Template

### Perbedaan Menu "Data" vs "Tambah Akun"
- **Data Siswa/Guru**: Template lengkap dengan semua field data + opsi akun
- **Tambah Akun Guru/Siswa**: Template fokus pada pembuatan akun login saja

### Data Siswa
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| nis | ✅ | Nomor Induk Siswa (unik) | 25001 |
| nama | ✅ | Nama lengkap siswa | Ahmad Rizki |
| kelas_id | ✅ | ID kelas (angka) | 1 |
| username | ❌ | Username untuk login | siswa_ahmad |
| password | ❌ | Password (min 6 karakter) | Rahasia123 |
| jenis_kelamin | ❌ | L atau P | L |
| email | ❌ | Email siswa | ahmad@sch.id |
| alamat | ❌ | Alamat lengkap | Jl. Melati No. 1 |
| telepon_orangtua | ❌ | No HP orang tua | 0811223344 |
| telepon_siswa | ❌ | No HP pribadi siswa (format Indonesia) | 081234567890 |
| status | ❌ | aktif/tidak_aktif/lulus | aktif |

### Data Guru
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| nip | ✅ | Nomor Induk Pegawai (unik) | 198001012005011001 |
| nama | ✅ | Nama lengkap guru | Budi Santoso |
| mapel_id | ❌ | ID mata pelajaran | 1 |
| username | ❌ | Username untuk login | guru_matematika |
| password | ❌ | Password (min 6 karakter) | Rahasia123 |
| no_telp | ❌ | No HP guru | 081234567890 |
| alamat | ❌ | Alamat lengkap | Jl. Mawar No. 1 |
| jenis_kelamin | ❌ | L atau P | L |
| status | ❌ | aktif/tidak_aktif/pensiun | aktif |

### Tambah Akun Guru (Fokus Akun Login)
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| nama | ✅ | Nama lengkap guru | Budi Santoso |
| username | ✅ | Username untuk login (unik) | guru_matematika |
| password | ✅ | Password (min 6 karakter) | Rahasia123 |
| nip | ✅ | Nomor Induk Pegawai (unik) | 198001012005011001 |
| mapel_id | ❌ | ID mata pelajaran | 1 |
| no_telp | ❌ | No HP guru | 081234567890 |
| alamat | ❌ | Alamat lengkap | Jl. Mawar No. 1 |
| jenis_kelamin | ❌ | L atau P | L |
| email | ❌ | Email guru | budi@sch.id |

### Tambah Akun Siswa (Fokus Akun Login)
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| nama | ✅ | Nama lengkap siswa | Ahmad Rizki |
| username | ✅ | Username untuk login (unik) | siswa_ahmad |
| password | ✅ | Password (min 6 karakter) | Rahasia123 |
| nis | ✅ | Nomor Induk Siswa (unik) | 25001 |
| kelas_id | ✅ | ID kelas (angka) | 1 |
| jabatan | ❌ | Jabatan di kelas | Sekretaris Kelas |
| jenis_kelamin | ❌ | L atau P | L |
| email | ❌ | Email siswa | ahmad@sch.id |

### Mata Pelajaran
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| kode_mapel | ✅ | Kode mata pelajaran (unik) | BING-01 |
| nama_mapel | ✅ | Nama mata pelajaran | Bahasa Inggris |
| deskripsi | ❌ | Deskripsi mata pelajaran | Mata pelajaran bahasa asing |
| status | ❌ | aktif/tidak_aktif | aktif |

### Kelas
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| nama_kelas | ✅ | Nama kelas (unik) | X IPA 1 |
| tingkat | ❌ | Tingkat kelas | X |
| status | ❌ | aktif/tidak_aktif | aktif |

### Jadwal Pelajaran
| Kolom | Wajib | Deskripsi | Contoh |
|-------|-------|-----------|---------|
| kelas_id | ✅ | ID kelas | 1 |
| mapel_id | ✅ | ID mata pelajaran | 1 |
| guru_id | ✅ | ID guru | 1 |
| hari | ✅ | Senin-Sabtu | Senin |
| jam_ke | ✅ | Jam ke (angka) | 1 |
| jam_mulai | ✅ | Format HH:MM:SS | 07:00:00 |
| jam_selesai | ✅ | Format HH:MM:SS | 07:45:00 |
| status | ❌ | aktif/tidak_aktif | aktif |

## Validasi Data

### Aturan Umum
- File harus berformat `.xlsx` (Excel 2007+)
- Ukuran file maksimal 5MB
- Baris pertama adalah header (tidak dihitung sebagai data)
- Kolom wajib tidak boleh kosong
- Data unik tidak boleh duplikat

### Validasi Khusus
- **NIS/NIP**: Harus unik, tidak boleh sama dengan data yang sudah ada
- **Username**: Minimal 4 karakter, harus unik
- **Password**: Minimal 6 karakter (akan di-hash otomatis)
- **Email**: Format email yang valid
- **Jenis Kelamin**: Hanya L atau P
- **Status**: Sesuai enum yang ditentukan
- **Hari**: Hanya Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
- **Jam**: Format HH:MM:SS (24 jam)

## Mode Dry-Run

Gunakan parameter `?dryRun=true` untuk validasi tanpa menyimpan data:
```bash
curl -H "Authorization: Bearer <TOKEN>" \
     -F "file=@template-siswa.xlsx" \
     "http://localhost:3001/api/admin/import/siswa?dryRun=true"
```

## Error Handling

### Jenis Error
1. **Format Error**: File bukan .xlsx, ukuran terlalu besar
2. **Validation Error**: Data tidak sesuai format, kolom wajib kosong
3. **Duplicate Error**: Data unik sudah ada di database
4. **Constraint Error**: Melanggar aturan relasi database

### Penanganan Error
- Error ditampilkan per baris dengan detail yang jelas
- Data valid tetap akan di-import meskipun ada data invalid
- Transaksi database memastikan konsistensi data

## Tips & Best Practices

### Persiapan Data
1. **Backup Database**: Selalu backup sebelum import data besar
2. **Validasi Manual**: Periksa data di Excel sebelum upload
3. **Test dengan Dry-Run**: Gunakan mode validasi terlebih dahulu
4. **Batch Kecil**: Untuk data besar, bagi menjadi beberapa file kecil
5. **Pilih Menu yang Tepat**: 
   - Gunakan "Data Siswa/Guru" untuk import data lengkap
   - Gunakan "Tambah Akun Guru/Siswa" untuk fokus pembuatan akun login saja

### Format Excel
1. **Gunakan Template**: Selalu gunakan template yang diunduh
2. **Hapus Baris Kosong**: Pastikan tidak ada baris kosong di tengah data
3. **Format Tanggal**: Gunakan format yang konsisten
4. **Encoding**: Pastikan karakter khusus (é, ñ, dll) tersimpan dengan benar

### Keamanan
1. **Password**: Gunakan password yang kuat untuk akun baru
2. **Akses File**: Pastikan file Excel tidak diakses oleh pihak tidak berwenang
3. **Logging**: Semua aktivitas import tercatat di log sistem

## Troubleshooting

### Error "File tidak ditemukan"
- Pastikan file sudah dipilih
- Periksa format file (.xlsx)

### Error "Ukuran file maksimal 5MB"
- Kompres file Excel
- Bagi data menjadi beberapa file

### Error "Data tidak valid"
- Periksa format data sesuai template
- Pastikan kolom wajib tidak kosong
- Periksa enum values (status, jenis_kelamin, dll)

### Error "Duplikat data"
- Periksa NIS/NIP/Username yang sudah ada
- Hapus baris duplikat di file Excel

## API Endpoints

### Download Template
```
GET /api/admin/templates/{entityType}
```

### Import Data
```
POST /api/admin/import/{entityType}
Content-Type: multipart/form-data
Body: file (Excel file)
Query: ?dryRun=true (optional)
```

### Entity Types
- `siswa` - Data Siswa (lengkap + akun)
- `guru` - Data Guru (lengkap + akun)
- `mapel` - Mata Pelajaran
- `kelas` - Kelas
- `jadwal` - Jadwal Pelajaran

**Catatan**: Menu "Tambah Akun Guru" dan "Tambah Akun Siswa" menggunakan entity type yang sama (`guru` dan `siswa`) tetapi dengan template yang difokuskan pada pembuatan akun login.

## Validasi Format Nomor Telepon

### Format Nomor Telepon Indonesia
Untuk kolom `telepon_siswa` dan `no_telp` (guru), gunakan format nomor telepon Indonesia yang valid:

- **Format 1**: `08xx-xxxx-xxxx` (contoh: `081234567890`)
- **Format 2**: `+62xx-xxxx-xxxx` (contoh: `+6281234567890`)
- **Format 3**: `62xx-xxxx-xxxx` (contoh: `6281234567890`)

### Aturan Validasi:
- Minimal 9 digit setelah kode negara/operator
- Maksimal 13 digit setelah kode negara/operator
- Harus dimulai dengan `08`, `+62`, atau `62`
- Tidak boleh ada spasi atau karakter khusus selain `+` di awal

### Contoh Valid:
- `081234567890`
- `+6281234567890`
- `6281234567890`

### Contoh Tidak Valid:
- `81234567890` (tidak ada kode negara/operator)
- `081-234-567-890` (ada tanda strip)
- `081 234 567 890` (ada spasi)
- `081234567890123` (terlalu panjang)

## Support

Jika mengalami masalah:
1. Periksa log sistem di `/logs/`
2. Pastikan database connection aktif
3. Periksa permission file upload
4. Hubungi administrator sistem

---
*Dokumentasi ini dibuat untuk ABSENTA v1.0 - Sistem Absensi Modern*
