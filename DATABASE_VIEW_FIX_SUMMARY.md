# Database View Fix dan Migrasi Siswa Perwakilan

## Ringkasan Masalah

Database `absenta13` memiliki beberapa masalah struktural:

1. **Table View yang Bermasalah**: Beberapa table dibuat sebagai VIEW yang menyebabkan masalah performa dan kompatibilitas
2. **Duplikasi Data**: Data siswa tersimpan di dua tempat (`siswa_perwakilan` dan `users`)
3. **Struktur Tidak Normal**: VIEW tidak dapat dioptimasi dengan baik seperti table biasa

## Perubahan yang Dilakukan

### 1. Konversi VIEW ke TABLE

#### VIEW yang Dikonversi:
- `jadwal_pelajaran` (VIEW) → `jadwal_pelajaran` (TABLE)
- `mata_pelajaran` (VIEW) → `mata_pelajaran` (TABLE)  
- `pengajuan_izin` (VIEW) → `pengajuan_izin` (TABLE)
- `siswa` (VIEW) → `siswa` (TABLE)

#### Keuntungan Konversi:
- ✅ Performa query lebih cepat
- ✅ Dapat dibuat index untuk optimasi
- ✅ Kompatibilitas dengan ORM dan framework
- ✅ Struktur database lebih normal

### 2. Migrasi Data Siswa Perwakilan

#### Proses Migrasi:
1. **Data dari `siswa_perwakilan`** → **Table `users`** (sudah ada)
2. **Data dari `siswa_perwakilan`** → **Table `siswa`** (baru dibuat)
3. **Hapus table `siswa_perwakilan`** setelah migrasi selesai

#### Struktur Table Siswa Baru:
```sql
CREATE TABLE `siswa` (
  `id` int(11) NOT NULL,
  `id_siswa` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nis` varchar(30) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `jabatan` varchar(50) DEFAULT 'Sekretaris Kelas',
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telepon_orangtua` varchar(20) DEFAULT NULL,
  `telepon_siswa` varchar(20) DEFAULT NULL,
  `status` enum('aktif','tidak_aktif','lulus','pindah','alumni','keluar') NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_siswa` (`id_siswa`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `nis` (`nis`),
  KEY `fk_siswa_kelas` (`kelas_id`),
  KEY `idx_siswa_status` (`status`),
  KEY `idx_siswa_nama` (`nama`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### 3. Optimasi Database

#### Index yang Ditambahkan:
- **Table Siswa**: `user_id`, `username`, `nis`, `kelas_id + status`
- **Table Jadwal Pelajaran**: `hari + jam_mulai`, `guru_id + hari`, `kelas_id + hari`
- **Table Mata Pelajaran**: `kode_mapel`
- **Table Pengajuan Izin**: `siswa_id + tanggal_izin`, `status + tanggal_izin`, `jenis_izin`

#### Foreign Key Constraints:
- `siswa.kelas_id` → `kelas.id_kelas`
- `absensi_siswa.siswa_id` → `siswa.id_siswa`
- `banding_absen.siswa_id` → `siswa.id_siswa`
- `pengajuan_izin_siswa.siswa_id` → `siswa.id_siswa`

## Script yang Dibuat

### 1. `fix-database-views-and-migration.js`
- Menghapus semua VIEW yang bermasalah
- Membuat table baru sebagai pengganti VIEW
- Memigrasi data dari table lama ke table baru
- Menghapus table `siswa_perwakilan` setelah migrasi

### 2. `update-database-config.js`
- Memperbarui `system_config` dengan status migrasi
- Membuat index untuk optimasi performa
- Menganalisis performa table
- Memverifikasi integritas data

### 3. `run-database-fix.js`
- Menjalankan kedua script di atas secara berurutan
- Menampilkan progress dan status
- Error handling dan troubleshooting

## Cara Menjalankan

```bash
# Jalankan perbaikan lengkap
node run-database-fix.js

# Atau jalankan step by step
node fix-database-views-and-migration.js
node update-database-config.js
```

## Verifikasi Hasil

Setelah script dijalankan, periksa:

1. **Table Type**:
   ```sql
   SELECT TABLE_NAME, TABLE_TYPE 
   FROM information_schema.TABLES 
   WHERE TABLE_SCHEMA = 'absenta13' 
   AND TABLE_NAME IN ('siswa', 'jadwal_pelajaran', 'mata_pelajaran', 'pengajuan_izin');
   ```

2. **Data Integrity**:
   ```sql
   SELECT COUNT(*) as total_siswa FROM siswa;
   SELECT COUNT(*) as total_users_siswa FROM users WHERE role = 'siswa';
   ```

3. **System Config**:
   ```sql
   SELECT * FROM system_config 
   WHERE config_key IN ('database_views_fixed', 'siswa_perwakilan_migrated');
   ```

## Keuntungan Setelah Perbaikan

1. **Performa Lebih Baik**: Table biasa lebih cepat dari VIEW
2. **Struktur Normal**: Database mengikuti normalisasi yang benar
3. **Optimasi Index**: Dapat dibuat index untuk query yang sering digunakan
4. **Kompatibilitas**: Lebih kompatibel dengan ORM dan framework modern
5. **Maintenance**: Lebih mudah di-maintain dan di-debug
6. **Scalability**: Dapat menangani data yang lebih besar dengan baik

## Catatan Penting

- ⚠️ **Backup Database**: Selalu backup database sebelum menjalankan script
- ⚠️ **Testing**: Test di environment development terlebih dahulu
- ⚠️ **Dependencies**: Pastikan semua foreign key constraints sudah benar
- ⚠️ **Application Code**: Update kode aplikasi jika ada yang mereferensi table lama

## Troubleshooting

Jika terjadi error:

1. **Permission Error**: Pastikan user database memiliki privilege DDL
2. **Foreign Key Error**: Cek apakah semua referensi table sudah benar
3. **Data Duplicate**: Gunakan `INSERT IGNORE` untuk menghindari duplikasi
4. **Connection Error**: Cek konfigurasi database di `.env`

## Status Migrasi

Setelah script berhasil dijalankan, status akan tersimpan di `system_config`:
- `database_views_fixed`: `true`
- `siswa_perwakilan_migrated`: `true`
- `database_optimization_date`: timestamp migrasi
