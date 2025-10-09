# ANALISIS STRUKTUR DATABASE ABSENTA13

## Ringkasan Database
- **Nama Database**: `absenta13`
- **Total Tabel**: 21 tabel
- **Total Data**: ~1,595 baris
- **Ukuran Total**: 2.3 MB
- **Engine**: InnoDB (mayoritas)
- **Charset**: utf8mb4_general_ci / utf8mb4_unicode_ci

## Struktur Tabel Utama

### 1. **TABEL USER & AUTHENTICATION**

#### `users` (215 baris)
```sql
- id (int, PK)
- username (varchar(50), UNIQUE)
- password (varchar(255), bcrypt hashed)
- role (enum: 'admin','guru','siswa')
- nama (varchar(100))
- email (varchar(100))
- status (enum: 'aktif','tidak_aktif','ditangguhkan')
- created_at, updated_at (timestamp)
```

### 2. **TABEL GURU**

#### `guru` (34 baris)
```sql
- id (int, PK)
- id_guru (int, UNIQUE)
- user_id (int, FK ke users.id)
- username (varchar(50))
- nip (varchar(30))
- nama (varchar(100))
- email (varchar(100))
- mata_pelajaran (varchar(100)) [DEPRECATED]
- mapel_id (int, FK ke mapel.id_mapel)
- no_telp (varchar(20))
- alamat (text)
- jenis_kelamin (enum: 'L','P')
- status (enum: 'aktif','tidak_aktif','pensiun')
- created_at, updated_at (timestamp)
```

### 3. **TABEL SISWA**

#### `siswa_perwakilan` (742 baris) - **TABEL UTAMA SISWA**
```sql
- id (int, PK)
- id_siswa (int, UNIQUE)
- user_id (int, FK ke users.id)
- username (varchar(50))
- nis (varchar(30))
- nama (varchar(100))
- kelas_id (int, FK ke kelas.id_kelas)
- jabatan (varchar(50), default: 'Sekretaris Kelas')
- jenis_kelamin (enum: 'L','P')
- email (varchar(100))
- alamat (text)
- telepon_orangtua (varchar(20))
- telepon_siswa (varchar(20))
- status (enum: 'aktif','tidak_aktif','lulus','pindah','alumni','keluar')
- created_at, updated_at (timestamp)
```

**CATATAN PENTING**: 
- Tabel `siswa` adalah **VIEW**, bukan tabel fisik
- Semua operasi siswa harus menggunakan `siswa_perwakilan`

### 4. **TABEL KELAS & MAPEL**

#### `kelas` (18 baris)
```sql
- id_kelas (int, PK)
- nama_kelas (varchar(50))
- tingkat (varchar(10)) - X, XI, XII
- ruang (varchar(50))
- kode_ruang (varchar(20))
- jumlah_siswa (int, default: 0)
- status (enum: 'aktif','tidak_aktif')
- created_at (timestamp)
```

#### `mapel` (32 baris)
```sql
- id_mapel (int, PK)
- kode_mapel (varchar(20))
- nama_mapel (varchar(100))
- deskripsi (text)
- status (enum: 'aktif','tidak_aktif')
- created_at (timestamp)
```

#### `ruang_kelas` (8 baris)
```sql
- id (int, PK)
- nama_ruang (varchar(100))
- kode_ruang (varchar(20), UNIQUE)
- kapasitas (int)
- lokasi (varchar(100))
- status (enum: 'aktif','tidak_aktif')
- created_at, updated_at (timestamp)
```

### 5. **TABEL JADWAL**

#### `jadwal` (540 baris) - **TABEL UTAMA JADWAL**
```sql
- id_jadwal (int, PK)
- kelas_id (int, FK ke kelas.id_kelas)
- mapel_id (int, FK ke mapel.id_mapel)
- guru_id (int, FK ke guru.id_guru)
- ruang_id (int, FK ke ruang_kelas.id)
- hari (varchar(10)) - Senin, Selasa, dst
- jam_ke (int)
- jam_mulai (time)
- jam_selesai (time)
- status (enum: 'aktif','tidak_aktif')
- created_at (timestamp)
```

#### `jadwal_pelajaran` - **VIEW**
- View yang menggabungkan data jadwal

### 6. **TABEL ABSENSI**

#### `absensi_guru` (0 baris)
```sql
- id_absensi (int, PK)
- jadwal_id (int, FK ke jadwal.id_jadwal)
- guru_id (int, FK ke guru.id_guru)
- kelas_id (int, FK ke kelas.id_kelas)
- siswa_pencatat_id (int, FK ke siswa_perwakilan.id_siswa)
- tanggal (date)
- jam_ke (int)
- status (enum: 'Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat')
- keterangan (text)
- waktu_catat (timestamp) ⭐ KOLOM UTAMA
- waktu_scan (timestamp)
- metode_absen (enum: 'manual','scan','otomatis')
- jam_terlambat (int)
- alasan_terlambat (text)
```

#### `absensi_siswa` (0 baris)
```sql
- id (int, PK)
- siswa_id (int, FK ke siswa_perwakilan.id_siswa)
- jadwal_id (int, FK ke jadwal.id_jadwal)
- tanggal (date)
- status (enum: 'Hadir','Izin','Sakit','Alpa','Dispen')
- keterangan (text)
- waktu_absen (datetime)
- guru_id (int, FK ke guru.id_guru)
```

#### `absensi_guru_archive` & `absensi_siswa_archive`
- Tabel arsip untuk data absensi lama

### 7. **TABEL PENGAJUAN IZIN**

#### `pengajuan_izin_siswa` (2 baris)
```sql
- id_pengajuan (int, PK)
- siswa_id (int, FK ke siswa_perwakilan.id_siswa)
- jadwal_id (int, FK ke jadwal.id_jadwal)
- tanggal_izin (date)
- tanggal_mulai, tanggal_selesai (date)
- jenis_izin (enum: 'sakit','izin','urusan_keluarga','keperluan_pribadi','lainnya','kelas')
- alasan (text)
- bukti_pendukung (varchar(255))
- status (enum: 'pending','disetujui','ditolak')
- keterangan_guru (text)
- tanggal_pengajuan (timestamp)
- tanggal_respon (timestamp)
- tanggal_disetujui (timestamp)
- guru_id (int, FK ke guru.id_guru)
```

#### `pengajuan_izin` - **VIEW**
- View untuk pengajuan izin

### 8. **TABEL BANDING & SISTEM**

#### `banding_pengajuan_izin` (0 baris)
```sql
- id_banding (int, PK)
- pengajuan_id (int, FK ke pengajuan_izin_siswa.id_pengajuan)
- alasan_banding (text)
- bukti_tambahan (varchar(255))
- status_banding (enum: 'pending','dikabulkan','ditolak')
- keterangan_admin (text)
- tanggal_banding (timestamp)
- tanggal_keputusan (timestamp)
- admin_id (int, FK ke users.id)
```

#### `banding_absen_detail` (1 baris)
- Detail banding absensi

#### `system_config` (1 baris)
```sql
- id (int, PK)
- config_key (varchar(255))
- config_value (text)
- created_at, updated_at (timestamp)
```

#### `kop_laporan` (1 baris)
```sql
- id (bigint, PK)
- cakupan (enum: 'global','jenis_laporan')
- kode_laporan (varchar(100))
- aktif (tinyint(1))
- perataan (enum: 'kiri','tengah','kanan')
- baris_teks (longtext, JSON)
- logo_kiri_url, logo_kanan_url (varchar(255))
- dibuat_pada, diubah_pada (datetime)
```

## VIEWS (Bukan Tabel Fisik)

1. **`jadwal_pelajaran`** - View jadwal
2. **`mata_pelajaran`** - View mata pelajaran  
3. **`pengajuan_izin`** - View pengajuan izin
4. **`siswa`** - View siswa (menggunakan `siswa_perwakilan`)

## RELASI PENTING

### Foreign Key Relationships:
- `users.id` ← `guru.user_id`
- `users.id` ← `siswa_perwakilan.user_id`
- `kelas.id_kelas` ← `siswa_perwakilan.kelas_id`
- `mapel.id_mapel` ← `guru.mapel_id`
- `mapel.id_mapel` ← `jadwal.mapel_id`
- `guru.id_guru` ← `jadwal.guru_id`
- `kelas.id_kelas` ← `jadwal.kelas_id`
- `ruang_kelas.id` ← `jadwal.ruang_id`
- `siswa_perwakilan.id_siswa` ← `absensi_siswa.siswa_id`
- `siswa_perwakilan.id_siswa` ← `pengajuan_izin_siswa.siswa_id`

## KESIMPULAN & REKOMENDASI

### ✅ **Struktur Database Sudah Benar**
1. **Tabel utama**: `users`, `guru`, `siswa_perwakilan`, `kelas`, `mapel`, `jadwal`
2. **Tabel absensi**: `absensi_guru`, `absensi_siswa` dengan kolom `waktu_catat`
3. **Tabel pengajuan**: `pengajuan_izin_siswa` untuk izin siswa
4. **Tabel sistem**: `system_config`, `kop_laporan` untuk konfigurasi

### ⚠️ **Yang Perlu Diperhatikan**
1. **Gunakan `siswa_perwakilan`**, bukan `siswa` (yang adalah view)
2. **Kolom waktu**: `waktu_catat` untuk absensi guru, `waktu_absen` untuk absensi siswa
3. **Status enum**: Konsisten dengan nilai yang ada di database
4. **Foreign key**: Pastikan relasi antar tabel sudah benar

### 🔧 **Backend Sudah Sesuai**
Perbaikan yang telah dilakukan di backend sudah sesuai dengan struktur database:
- ✅ Menggunakan `siswa_perwakilan` bukan `siswa`
- ✅ Menggunakan `waktu_catat` untuk absensi guru
- ✅ Relasi foreign key sudah benar
- ✅ Enum values sudah sesuai

**Database `absenta13` siap digunakan dengan backend yang telah diperbaiki!**
































