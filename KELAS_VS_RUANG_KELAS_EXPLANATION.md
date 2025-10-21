# 📚 Perbedaan KELAS vs RUANG KELAS

**Date**: 21 Oktober 2025  
**Purpose**: Menjelaskan perbedaan konsep dan implementasi antara Kelas dan Ruang Kelas

---

## 🎯 KONSEP DASAR

### **KELAS** 🎓
**Definisi**: Kelompok siswa yang belajar bersama (academic class/classroom group)

**Fokus**: ORGANISASI SISWA & PEMBELAJARAN

**Analogi**: "Kelas X AK 1" = Kelompok 35 siswa jurusan Akuntansi tahun pertama rombongan 1

### **RUANG KELAS** 🏢
**Definisi**: Ruangan fisik di gedung sekolah (physical room)

**Fokus**: INFRASTRUKTUR & FASILITAS

**Analogi**: "Ruang 1" = Ruangan fisik di Lantai 1 dengan kapasitas 37 orang

---

## 📊 PERBANDINGAN DETAIL

| Aspek | KELAS (kelas) | RUANG KELAS (ruang_kelas) |
|-------|---------------|---------------------------|
| **Konsep** | Kelompok siswa | Ruangan fisik |
| **Primary Key** | `id_kelas` | `id` |
| **Identifier** | `nama_kelas` (X AK 1) | `kode_ruang` (R001) |
| **Fokus Data** | Siswa & pembelajaran | Kapasitas & lokasi |
| **Relationship** | Has many siswa, jadwal | Referenced by kelas |
| **Sifat** | Dinamis (siswa berganti) | Statis (ruang tetap) |
| **Lifecycle** | Per tahun ajaran | Permanen |

---

## 🗄️ STRUKTUR DATABASE

### **Tabel: `kelas`** (Academic Class)
```sql
CREATE TABLE `kelas` (
  `id_kelas` INT PRIMARY KEY AUTO_INCREMENT,
  `nama_kelas` VARCHAR(50) NOT NULL UNIQUE,      -- "X AK 1", "XI RPL 2"
  `tingkat` VARCHAR(10),                         -- "X", "XI", "XII"
  `ruang` VARCHAR(50),                           -- "Ruang 1055" (reference)
  `kode_ruang` VARCHAR(20) UNIQUE,               -- "R105" (reference)
  `jumlah_siswa` INT DEFAULT 0,                  -- 35 siswa
  `status` ENUM('aktif','tidak_aktif'),
  `created_at` TIMESTAMP
);
```

**Fields Kunci**:
- `nama_kelas` - Nama kelompok siswa (e.g., "X AK 1")
- `tingkat` - Tingkat kelas (X, XI, XII)
- `ruang` - Nama ruang yang digunakan (informational)
- `kode_ruang` - Kode ruang (bisa berubah setiap tahun)
- `jumlah_siswa` - Jumlah siswa dalam kelas ini

**Relasi**:
- **1:Many** dengan `siswa` (satu kelas punya banyak siswa)
- **1:Many** dengan `jadwal` (satu kelas punya banyak jadwal)
- **N:1** dengan `ruang_kelas` (via `kode_ruang`, optional reference)

### **Tabel: `ruang_kelas`** (Physical Room)
```sql
CREATE TABLE `ruang_kelas` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nama_ruang` VARCHAR(100) NOT NULL,            -- "Ruang 1", "Lab Komputer"
  `kode_ruang` VARCHAR(20) NOT NULL UNIQUE,      -- "R001", "LAB-1"
  `kapasitas` INT,                               -- 37 orang
  `lokasi` VARCHAR(100),                         -- "Lantai 1", "Gedung A"
  `status` ENUM('aktif','tidak_aktif'),
  `created_at` TIMESTAMP,
  `updated_at` TIMESTAMP
);
```

**Fields Kunci**:
- `nama_ruang` - Nama ruangan fisik (e.g., "Ruang 1")
- `kode_ruang` - Kode unik ruangan (e.g., "R001")
- `kapasitas` - Maksimal orang yang bisa menempati
- `lokasi` - Lokasi fisik ruangan (lantai, gedung)

**Relasi**:
- **Referenced by** `kelas.kode_ruang` (soft reference, not FK)
- **Independent entity** (tidak ada FK langsung)

---

## 🔄 HUBUNGAN ANTARA KEDUANYA

### **Relationship Model**:
```
┌─────────────────────────┐
│   RUANG KELAS (R001)    │  ← Physical Room (Permanent)
│   - Kapasitas: 37       │
│   - Lokasi: Lantai 1    │
└──────────┬──────────────┘
           │ Referenced by (soft)
           ↓
┌─────────────────────────┐
│   KELAS (X AK 1)        │  ← Academic Class (Dynamic)
│   - ruang: "Ruang 1"    │
│   - kode_ruang: "R001"  │
│   - 35 siswa            │
└──────────┬──────────────┘
           │ Has Many (FK)
           ↓
┌─────────────────────────┐
│   SISWA                 │  ← Students
│   - kelas_id: 1         │
└─────────────────────────┘
           │ Has Many (FK)
           ↓
┌─────────────────────────┐
│   JADWAL                │  ← Schedule
│   - kelas_id: 1         │
└─────────────────────────┘
```

### **Contoh Implementasi**:
```javascript
// KELAS (Academic Class)
{
  id_kelas: 1,
  nama_kelas: "X AK 1",          // Nama kelompok siswa
  tingkat: "X",                  // Tingkat tahun pertama
  ruang: "Ruang 1055",           // Ruangan yang digunakan (informational)
  kode_ruang: "R105",            // Kode ruang (bisa berubah)
  jumlah_siswa: 35               // 35 siswa dalam kelompok ini
}

// RUANG KELAS (Physical Room)
{
  id: 1,
  nama_ruang: "Ruang 1",         // Nama ruangan fisik
  kode_ruang: "R001",            // Kode unik ruangan
  kapasitas: 37,                 // Maksimal 37 orang
  lokasi: "Lantai 1"             // Lokasi fisik
}
```

---

## 💡 USE CASES

### **KELAS digunakan untuk**:
1. ✅ Mengelompokkan siswa per tahun ajaran
2. ✅ Membuat jadwal pelajaran
3. ✅ Mencatat absensi siswa
4. ✅ Generate laporan per kelas
5. ✅ Organisasi akademik

**Contoh Query**:
```sql
-- Get all students in a class
SELECT s.* FROM siswa s 
JOIN kelas k ON s.kelas_id = k.id_kelas
WHERE k.nama_kelas = 'X AK 1';

-- Get schedule for a class
SELECT j.* FROM jadwal j
JOIN kelas k ON j.kelas_id = k.id_kelas
WHERE k.nama_kelas = 'X AK 1' AND j.hari = 'Senin';
```

### **RUANG KELAS digunakan untuk**:
1. ✅ Management inventaris ruangan
2. ✅ Tracking kapasitas ruangan
3. ✅ Planning alokasi ruangan
4. ✅ Maintenance gedung
5. ✅ Resource management

**Contoh Query**:
```sql
-- Get all available rooms with capacity >= 35
SELECT * FROM ruang_kelas 
WHERE kapasitas >= 35 AND status = 'aktif';

-- Get which class is using a room
SELECT k.nama_kelas, k.jumlah_siswa, r.nama_ruang, r.kapasitas
FROM kelas k
LEFT JOIN ruang_kelas r ON k.kode_ruang = r.kode_ruang
WHERE r.kode_ruang = 'R001';
```

---

## 🎯 SKENARIO PRAKTIS

### **Skenario 1: Awal Tahun Ajaran**
```
Admin membuat:
1. KELAS baru: "X AK 1" (35 siswa baru)
2. Assign ke RUANG: "Ruang 1" (R001)

Dalam database:
- CREATE kelas: {nama_kelas: "X AK 1", kode_ruang: "R001", jumlah_siswa: 35}
- RUANG_KELAS "R001" sudah ada (permanent)
```

### **Skenario 2: Pergantian Ruangan**
```
Admin memindahkan kelas karena ruangan renovasi:
1. UPDATE kelas: SET kode_ruang = "R102" WHERE nama_kelas = "X AK 1"
2. RUANG_KELAS "R001" tetap ada (tidak berubah)
3. RUANG_KELAS "R102" sudah ada (permanent)

Dalam database:
- UPDATE kelas SET kode_ruang = "R102", ruang = "Ruang 102" WHERE id_kelas = 1
- Ruang R001 dan R102 tetap ada di tabel ruang_kelas
```

### **Skenario 3: Akhir Tahun Ajaran**
```
Admin:
1. KELAS "X AK 1" → status = 'tidak_aktif' (lulus/naik kelas)
2. RUANG_KELAS "R001" → tetap aktif (untuk kelas baru tahun depan)

Dalam database:
- UPDATE kelas SET status = 'tidak_aktif' WHERE nama_kelas = "X AK 1"
- Ruang R001 tetap status = 'aktif' (untuk kelas baru)
```

---

## ⚠️ PERBEDAAN KUNCI

### **1. Lifecycle**
- **KELAS**: Dinamis - berubah setiap tahun ajaran
- **RUANG KELAS**: Permanen - tetap ada selama gedung berdiri

### **2. Primary Purpose**
- **KELAS**: Organizing students & academics
- **RUANG KELAS**: Managing physical infrastructure

### **3. Data Focus**
- **KELAS**: `nama_kelas`, `tingkat`, `jumlah_siswa`
- **RUANG KELAS**: `nama_ruang`, `kapasitas`, `lokasi`

### **4. Relationship Type**
- **KELAS**: Strong FK relationships (siswa, jadwal)
- **RUANG KELAS**: Soft reference only (via kode_ruang)

### **5. Update Frequency**
- **KELAS**: Frequent (assignment changes, room changes)
- **RUANG KELAS**: Rare (only if physical changes)

---

## 🔧 IMPLEMENTASI DI ADMIN DASHBOARD

### **Menu "Kelola Kelas"** (Manage KELAS)
**Purpose**: Manage academic classes (student groups)

**Fields**:
- Nama Kelas (X AK 1, XI RPL 2, etc.)
- Tingkat (X, XI, XII)
- Ruang (dropdown dari ruang_kelas atau input manual)
- Kode Ruang (auto-fill dari ruang_kelas atau input manual)
- Jumlah Siswa (calculated atau manual)
- Status (aktif/tidak_aktif)

**Operations**:
- CREATE: Buat kelas baru untuk tahun ajaran
- READ: Lihat daftar kelas dengan siswa & jadwal
- UPDATE: Update ruang, jumlah siswa, status
- DELETE: Deactivate atau hapus kelas (smart delete)

### **Menu "Kelola Ruang Kelas"** (Manage RUANG KELAS)
**Purpose**: Manage physical rooms

**Fields**:
- Nama Ruang (Ruang 1, Lab Komputer, etc.)
- Kode Ruang (R001, LAB-1, etc.) - UNIQUE
- Kapasitas (jumlah orang)
- Lokasi (Lantai 1, Gedung A, etc.)
- Status (aktif/tidak_aktif)

**Operations**:
- CREATE: Tambah ruangan baru (gedung baru)
- READ: Lihat daftar ruangan dengan kapasitas
- UPDATE: Update kapasitas, lokasi
- DELETE: Deactivate ruangan (renovasi, dll)

---

## 📊 QUERY PATTERNS

### **1. Get Kelas with Ruang Info**
```sql
SELECT 
  k.nama_kelas,
  k.tingkat,
  k.jumlah_siswa,
  k.ruang as ruang_name,
  r.kode_ruang,
  r.kapasitas,
  r.lokasi
FROM kelas k
LEFT JOIN ruang_kelas r ON k.kode_ruang = r.kode_ruang
WHERE k.status = 'aktif';
```

### **2. Check Room Availability**
```sql
-- Rooms not currently assigned to any class
SELECT r.*
FROM ruang_kelas r
LEFT JOIN kelas k ON r.kode_ruang = k.kode_ruang AND k.status = 'aktif'
WHERE r.status = 'aktif' AND k.id_kelas IS NULL;
```

### **3. Room Utilization Report**
```sql
SELECT 
  r.nama_ruang,
  r.kode_ruang,
  r.kapasitas,
  k.nama_kelas,
  k.jumlah_siswa,
  (k.jumlah_siswa / r.kapasitas * 100) as utilization_percent
FROM ruang_kelas r
LEFT JOIN kelas k ON r.kode_ruang = k.kode_ruang AND k.status = 'aktif'
WHERE r.status = 'aktif'
ORDER BY utilization_percent DESC;
```

---

## ✅ BEST PRACTICES

### **Untuk KELAS**:
1. ✅ Gunakan naming convention: "Tingkat Jurusan Rombel" (X AK 1)
2. ✅ Update `jumlah_siswa` secara berkala
3. ✅ Deactivate kelas lama, jangan hapus (untuk history)
4. ✅ Assign ruangan via `kode_ruang` (konsisten dengan ruang_kelas)

### **Untuk RUANG KELAS**:
1. ✅ Gunakan kode ruang yang konsisten (R001, R002, etc.)
2. ✅ Update kapasitas jika ada perubahan fisik
3. ✅ Deactivate saat renovasi, activate kembali setelah selesai
4. ✅ Jangan hapus ruangan (untuk history tracking)

### **Relationship Management**:
1. ✅ Use `kode_ruang` sebagai soft reference (not FK)
2. ✅ Allow kelas.kode_ruang to be NULL (kelas bisa tanpa ruang tetap)
3. ✅ Validate kapasitas vs jumlah_siswa saat assignment
4. ✅ Track room changes for reporting

---

## 🎯 SUMMARY

### **KELAS** = WHO (Siapa)
- Kelompok siswa yang belajar bersama
- Focus: Academic organization
- Dynamic: Changes yearly
- Has students, schedules

### **RUANG KELAS** = WHERE (Dimana)
- Ruangan fisik untuk belajar
- Focus: Infrastructure management
- Permanent: Fixed location
- Has capacity, location

### **Relationship** = SOFT REFERENCE
- Kelas references Ruang via `kode_ruang`
- Not a hard FK (flexibility for room changes)
- One ruang can be used by one kelas at a time
- One kelas uses one ruang (but can change)

---

**Kesimpulan**: 
- **KELAS** adalah entitas **organisasi akademik** (kelompok siswa)
- **RUANG KELAS** adalah entitas **infrastruktur fisik** (ruangan)
- Keduanya **terpisah** tapi **terhubung** via soft reference
- Pemisahan ini memberikan **fleksibilitas** dalam management sekolah

---

**Created**: 21 Oktober 2025  
**Purpose**: Documentation untuk memahami perbedaan Kelas vs Ruang Kelas  
**Status**: ✅ Complete

