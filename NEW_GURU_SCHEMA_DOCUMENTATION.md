# 🎯 **NEW GURU SCHEMA - SIMPLIFIED MULTI-TEACHER SYSTEM**

## 📋 **Overview**

Sistem baru ini menghilangkan pembedaan antara "guru utama" dan "guru pendamping". Semua guru yang mengajar mata pelajaran yang sama memiliki status yang sama dan hanya perlu satu guru yang melakukan absensi untuk mewakili semua guru.

## 🏗️ **Database Schema Baru**

### **1. Tabel `jadwal_guru` (Multi-Teacher Mapping)**
```sql
CREATE TABLE `jadwal_guru` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `jadwal_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `status` enum('aktif','tidak_aktif') DEFAULT 'aktif',
  `dibuat_pada` timestamp NULL DEFAULT current_timestamp(),
  `diperbarui_pada` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  
  FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal`(`id_jadwal`) ON DELETE CASCADE,
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id_guru`) ON DELETE CASCADE,
  UNIQUE KEY `unique_jadwal_guru` (`jadwal_id`, `guru_id`)
);
```

**Fungsi**: Mapping semua guru yang mengajar pada jadwal tertentu. Tidak ada pembedaan role.

### **2. Tabel `absensi_guru_jadwal` (Attendance Record)**
```sql
CREATE TABLE `absensi_guru_jadwal` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `jadwal_id` int(11) NOT NULL,
  `guru_pencatat_id` int(11) NOT NULL COMMENT 'Guru yang melakukan pencatatan absensi',
  `tanggal` date NOT NULL,
  `jam_ke` int(11) NOT NULL,
  `status` enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `waktu_catat` timestamp NOT NULL DEFAULT current_timestamp(),
  `metode_absen` enum('manual','scan','otomatis') DEFAULT 'manual',
  `siswa_pencatat_id` int(11) DEFAULT NULL COMMENT 'Siswa yang mencatat (jika dari siswa)',
  
  FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal`(`id_jadwal`) ON DELETE CASCADE,
  FOREIGN KEY (`guru_pencatat_id`) REFERENCES `guru`(`id_guru`) ON DELETE CASCADE,
  FOREIGN KEY (`siswa_pencatat_id`) REFERENCES `siswa`(`id_siswa`) ON DELETE SET NULL,
  UNIQUE KEY `unique_jadwal_tanggal` (`jadwal_id`, `tanggal`)
);
```

**Fungsi**: Mencatat absensi untuk satu jadwal pada tanggal tertentu. Hanya perlu satu record per jadwal per tanggal.

### **3. Tabel `absensi_guru_mapping` (Teacher Mapping)**
```sql
CREATE TABLE `absensi_guru_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `absensi_guru_jadwal_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `status` enum('Hadir','Tidak Hadir','Sakit','Izin','Dispen','Terlambat') NOT NULL,
  `keterangan` text DEFAULT NULL,
  `dibuat_pada` timestamp NULL DEFAULT current_timestamp(),
  
  FOREIGN KEY (`absensi_guru_jadwal_id`) REFERENCES `absensi_guru_jadwal`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`guru_id`) REFERENCES `guru`(`id_guru`) ON DELETE CASCADE,
  UNIQUE KEY `unique_absensi_guru` (`absensi_guru_jadwal_id`, `guru_id`)
);
```

**Fungsi**: Mapping semua guru yang terlibat dalam absensi tersebut. Semua guru mendapat status yang sama.

## 🔄 **Workflow Baru**

### **1. Setup Jadwal dengan Multiple Guru**
```sql
-- Contoh: Jadwal Matematika dengan 3 guru
INSERT INTO jadwal (kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai, status)
VALUES (1, 1, 1, 'Senin', 1, '07:00:00', '08:00:00', 'aktif');

-- Tambahkan semua guru ke jadwal
INSERT INTO jadwal_guru (jadwal_id, guru_id) VALUES (1, 1); -- Guru A
INSERT INTO jadwal_guru (jadwal_id, guru_id) VALUES (1, 2); -- Guru B  
INSERT INTO jadwal_guru (jadwal_id, guru_id) VALUES (1, 3); -- Guru C
```

### **2. Absensi Guru (Satu Guru Mewakili Semua)**
```sql
-- Guru A melakukan absensi untuk semua guru
INSERT INTO absensi_guru_jadwal (jadwal_id, guru_pencatat_id, tanggal, jam_ke, status, keterangan)
VALUES (1, 1, '2025-01-20', 1, 'Hadir', 'Semua guru hadir');

-- Mapping semua guru dengan status yang sama
INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan)
VALUES (1, 1, 'Hadir', 'Guru A hadir');
INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan)
VALUES (1, 2, 'Hadir', 'Guru B hadir');
INSERT INTO absensi_guru_mapping (absensi_guru_jadwal_id, guru_id, status, keterangan)
VALUES (1, 3, 'Hadir', 'Guru C hadir');
```

### **3. Query untuk Mendapatkan Data Lengkap**
```sql
-- Mendapatkan jadwal dengan semua guru
SELECT * FROM v_jadwal_guru_lengkap WHERE id_jadwal = 1;

-- Mendapatkan absensi dengan semua guru
SELECT * FROM v_absensi_guru_lengkap WHERE jadwal_id = 1 AND tanggal = '2025-01-20';
```

## 🎯 **Keuntungan Skema Baru**

### **1. Kesederhanaan**
- ✅ Tidak ada pembedaan guru utama/pendamping
- ✅ Semua guru memiliki status yang sama
- ✅ Satu guru dapat mewakili semua guru

### **2. Efisiensi**
- ✅ Hanya perlu satu absensi per jadwal per tanggal
- ✅ Semua guru mendapat laporan yang sama
- ✅ Tidak ada duplikasi data

### **3. Fleksibilitas**
- ✅ Mudah menambah/mengurangi guru
- ✅ Mudah mengubah status guru
- ✅ Mudah tracking absensi

## 📊 **Views untuk Kemudahan**

### **1. View `v_jadwal_guru_lengkap`**
```sql
-- Menampilkan jadwal dengan semua guru
SELECT 
    id_jadwal,
    nama_kelas,
    nama_mapel,
    nama_guru_semua,  -- Semua nama guru dipisah koma
    guru_ids,         -- Semua ID guru dipisah koma
    jumlah_guru
FROM v_jadwal_guru_lengkap;
```

### **2. View `v_absensi_guru_lengkap`**
```sql
-- Menampilkan absensi dengan semua guru
SELECT 
    jadwal_id,
    tanggal,
    nama_kelas,
    nama_mapel,
    nama_guru_pencatat,  -- Guru yang melakukan pencatatan
    nama_guru_semua,     -- Semua guru yang terlibat
    status_absensi,
    jumlah_guru_tercatat
FROM v_absensi_guru_lengkap;
```

## 🔧 **API Endpoints yang Perlu Diupdate**

### **1. Create Jadwal dengan Multiple Guru**
```javascript
// POST /api/admin/jadwal
{
  "kelas_id": 1,
  "mapel_id": 1,
  "guru_ids": [1, 2, 3],  // Array semua guru
  "hari": "Senin",
  "jam_ke": 1,
  "jam_mulai": "07:00:00",
  "jam_selesai": "08:00:00"
}
```

### **2. Submit Absensi Guru**
```javascript
// POST /api/guru/submit-attendance
{
  "jadwal_id": 1,
  "tanggal": "2025-01-20",
  "status": "Hadir",
  "keterangan": "Semua guru hadir",
  "guru_ids": [1, 2, 3]  // Semua guru yang terlibat
}
```

### **3. Get Jadwal dengan Multiple Guru**
```javascript
// GET /api/guru/jadwal
// Response:
{
  "success": true,
  "data": [
    {
      "id_jadwal": 1,
      "nama_kelas": "X IPA 1",
      "nama_mapel": "Matematika",
      "nama_guru_semua": "Guru A, Guru B, Guru C",
      "guru_ids": "1,2,3",
      "jumlah_guru": 3
    }
  ]
}
```

## 🚀 **Migration Strategy**

### **1. Backup Data Lama**
```sql
-- Backup tabel lama
CREATE TABLE jadwal_guru_tambahan_backup AS SELECT * FROM jadwal_guru_tambahan;
CREATE TABLE kehadiran_guru_jadwal_backup AS SELECT * FROM kehadiran_guru_jadwal;
```

### **2. Migrate Data**
```sql
-- Migrate jadwal_guru_tambahan ke jadwal_guru
INSERT INTO jadwal_guru (jadwal_id, guru_id, status)
SELECT jadwal_id, guru_id, status FROM jadwal_guru_tambahan;

-- Migrate kehadiran_guru_jadwal ke absensi_guru_jadwal
INSERT INTO absensi_guru_jadwal (jadwal_id, guru_pencatat_id, tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen)
SELECT jadwal_id, guru_id, tanggal, jam_ke, status, keterangan, waktu_catat, metode_absen 
FROM kehadiran_guru_jadwal;
```

### **3. Update Application Code**
- Update semua query untuk menggunakan tabel baru
- Update API endpoints untuk mendukung multiple guru
- Update frontend untuk menampilkan multiple guru
- Update laporan untuk menampilkan semua guru

## 🧪 **Testing Scenarios**

### **1. Create Jadwal dengan Multiple Guru**
- ✅ Test dengan 1 guru
- ✅ Test dengan 2 guru
- ✅ Test dengan 3+ guru

### **2. Absensi Guru**
- ✅ Test absensi oleh guru pertama
- ✅ Test absensi oleh guru kedua
- ✅ Test absensi oleh siswa (jika diizinkan)

### **3. Laporan**
- ✅ Test laporan per guru
- ✅ Test laporan per jadwal
- ✅ Test laporan per kelas

## 📈 **Performance Considerations**

### **1. Indexing**
```sql
-- Index untuk performance
CREATE INDEX idx_jadwal_guru_jadwal_id ON jadwal_guru(jadwal_id);
CREATE INDEX idx_jadwal_guru_guru_id ON jadwal_guru(guru_id);
CREATE INDEX idx_absensi_guru_jadwal_tanggal ON absensi_guru_jadwal(tanggal);
```

### **2. Caching**
```javascript
// Cache untuk jadwal dengan multiple guru
const cacheKey = `jadwal_guru_${jadwalId}`;
const cacheTTL = 3600; // 1 hour
```

### **3. Query Optimization**
```sql
-- Optimized query untuk mendapatkan jadwal dengan semua guru
SELECT j.*, v.nama_guru_semua, v.jumlah_guru
FROM jadwal j
JOIN v_jadwal_guru_lengkap v ON j.id_jadwal = v.id_jadwal
WHERE j.status = 'aktif';
```

## 🎉 **Kesimpulan**

Skema baru ini memberikan:
- ✅ Kesederhanaan dalam management guru
- ✅ Efisiensi dalam absensi (satu absensi untuk semua guru)
- ✅ Konsistensi dalam laporan (semua guru mendapat laporan yang sama)
- ✅ Fleksibilitas dalam menambah/mengurangi guru
- ✅ Kemudahan dalam maintenance dan development

Sistem ini sesuai dengan kebutuhan Anda dimana tidak ada pembedaan guru utama/pendamping dan satu guru dapat mewakili semua guru untuk absensi.
