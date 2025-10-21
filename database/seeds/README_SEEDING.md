# 🌱 Database Seeding Guide - Dummy Data Generation

## 📋 Overview

Script ini akan generate data dummy yang **BANYAK** dan **REALISTIS** untuk testing semua export endpoints.

---

## 📊 Data yang Akan Dibuat

### Jumlah Data:

| Tabel | Jumlah | Keterangan |
|-------|--------|------------|
| **Jurusan** | 3 | PPLG, TKJ, RPL |
| **Kelas** | 9 | 3 jurusan × 3 tingkat (10, 11, 12) |
| **Mata Pelajaran** | 12 | MTK, IPA, IPS, BIN, BING, PBO, WEB, dll |
| **Guru** | 20 | Dengan akun login |
| **Siswa** | **270** | 30 siswa × 9 kelas (dengan akun login) |
| **Jadwal** | **72** | 8 jadwal × 9 kelas |
| **Absensi Siswa** | **~40,000+** | 270 siswa × 8 jadwal/hari × 20 hari kerja |
| **Absensi Guru** | **~400+** | 20 guru × 20 hari kerja |
| **Banding Absen** | **~13** | 5% dari total absensi alfa/izin |
| **System Config** | 6 | Letterhead untuk semua report types |

**Total Records**: **~41,000+ records** 🚀

---

## 🎯 Karakteristik Data

### Realistic Data:
- ✅ **Nama Indonesia**: Kombinasi nama depan & belakang realistis
- ✅ **NIS Format**: `2024XXXX` (4 digit)
- ✅ **NIP Format**: Standard NIP Indonesia
- ✅ **Email**: Format `nama.lengkap@smkn13jakarta.sch.id`
- ✅ **Attendance Patterns**: 
  - Hadir: 80%
  - Izin: 10%
  - Sakit: 5%
  - Alpha: 3%
  - Dispen: 2%

### Relational Integrity:
- ✅ **Foreign Keys** maintained
- ✅ **Multi-table relationships** correct
- ✅ **No orphaned records**
- ✅ **Consistent data across tables**

---

## 🚀 Cara Menjalankan

### Prerequisites:

1. **Database Running**:
   ```bash
   # MySQL/MariaDB harus running
   # Database: absenta13
   ```

2. **Server NOT REQUIRED** (script langsung ke database)

### Option 1: Quick Run (Recommended)

```bash
# From project root
node database/seeds/generate-dummy-data.js
```

### Option 2: Custom Configuration

Edit `database/seeds/generate-dummy-data.js` untuk customize jumlah data:

```javascript
const CONFIG = {
    JURUSAN_COUNT: 3,
    KELAS_PER_JURUSAN: 3,
    SISWA_PER_KELAS: 30,      // ← Ubah ini untuk lebih banyak siswa
    GURU_COUNT: 20,            // ← Ubah ini untuk lebih banyak guru
    MAPEL_COUNT: 12,
    JADWAL_PER_KELAS: 8,
    DAYS_TO_GENERATE: 30,      // ← Ubah ini untuk lebih banyak hari absensi
    BANDING_PERCENTAGE: 0.05
};
```

Lalu run:
```bash
node database/seeds/generate-dummy-data.js
```

---

## ⏱️ Estimasi Waktu

| Data Size | Estimated Time |
|-----------|----------------|
| Small (10 siswa/kelas, 10 hari) | ~30 detik |
| **Medium (30 siswa/kelas, 30 hari)** | **~2-3 menit** ⭐ Default |
| Large (50 siswa/kelas, 60 hari) | ~10-15 menit |

**Progress Indicator**: Script akan menampilkan progress setiap 1000 records.

---

## 📝 Expected Output

```bash
🚀 Starting Dummy Data Generation...
============================================================
📊 Configuration:
   - Jurusan: 3
   - Kelas per Jurusan: 3
   - Siswa per Kelas: 30
   - Guru: 20
   - Mata Pelajaran: 12
   - Days of Attendance: 30
============================================================

📚 Seeding Jurusan...
✅ Created 3 jurusan

🏫 Seeding Kelas...
✅ Created 9 kelas

📖 Seeding Mata Pelajaran...
✅ Created 12 mata pelajaran

👨‍🏫 Seeding Guru...
✅ Created 20 guru

👨‍🎓 Seeding Siswa...
   Seeding kelas PPLG 10...
   Seeding kelas PPLG 11...
   ... (dan seterusnya)
✅ Created 270 siswa

📅 Seeding Jadwal...
✅ Created 72 jadwal

📝 Seeding Absensi Siswa...
   Generating absensi for 20 days...
   Progress: 1000 records...
   Progress: 2000 records...
   ... (dan seterusnya)
✅ Created 43200 absensi siswa records

📝 Seeding Absensi Guru...
✅ Created 400 absensi guru records

⚖️ Seeding Pengajuan Banding Absen...
✅ Created 13 banding absen records

⚙️ Seeding System Config (Letterhead)...
✅ Created 6 letterhead configs

============================================================
🎉 Data Generation Complete!
============================================================
📊 Summary:
   - Jurusan: 3
   - Kelas: 9
   - Mata Pelajaran: 12
   - Guru: 20
   - Siswa: 270
   - Jadwal: 72
   - Estimated Absensi Siswa: 43200
   - Estimated Absensi Guru: 400
============================================================

✅ Login Credentials:
   Admin: admin / admin123
   Guru: guru_1 / guru123 (atau guru_2, guru_3, dst)
   Siswa: siswa_20240001 / siswa123 (atau siswa lainnya)
============================================================

👋 Database connection closed
```

---

## ✅ Verification Steps

### 1. Check Data Count

```sql
-- Verify siswa
SELECT COUNT(*) as total_siswa FROM siswa;
-- Expected: 270

-- Verify guru
SELECT COUNT(*) as total_guru FROM guru;
-- Expected: 20

-- Verify absensi siswa
SELECT COUNT(*) as total_absensi_siswa FROM absensi_siswa;
-- Expected: 40000+

-- Verify absensi guru
SELECT COUNT(*) as total_absensi_guru FROM absensi_guru;
-- Expected: 400+

-- Verify banding
SELECT COUNT(*) as total_banding FROM pengajuan_banding_absen;
-- Expected: ~13
```

### 2. Check Sample Data

```sql
-- Sample siswa
SELECT * FROM siswa LIMIT 5;

-- Sample guru dengan mata pelajaran
SELECT g.nama, m.nama_mapel 
FROM guru g 
LEFT JOIN mapel m ON g.mapel_id = m.id_mapel 
LIMIT 5;

-- Sample absensi siswa with details
SELECT 
    s.nama as siswa,
    k.nama_kelas,
    m.nama_mapel,
    ase.tanggal,
    ase.status,
    ase.keterangan
FROM absensi_siswa ase
JOIN siswa s ON ase.siswa_id = s.id_siswa
JOIN kelas k ON s.kelas_id = k.id_kelas
JOIN jadwal j ON ase.jadwal_id = j.id_jadwal
JOIN mapel m ON j.mapel_id = m.id_mapel
ORDER BY ase.tanggal DESC
LIMIT 10;
```

### 3. Test Login

**Test Guru Login**:
```http
POST http://localhost:3001/api/login
Content-Type: application/json

{
  "username": "guru_1",
  "password": "guru123"
}
```

**Test Siswa Login**:
```http
POST http://localhost:3001/api/login
Content-Type: application/json

{
  "username": "siswa_20240001",
  "password": "siswa123"
}
```

---

## 🔧 Troubleshooting

### Issue: Foreign Key Constraint Error

**Solution**: Pastikan database schema sudah di-migrate dengan benar.

```bash
# Run migration first
node database/migrations/run-migrations.js
```

### Issue: Duplicate Entry Error

**Solution**: Script menggunakan `ON DUPLICATE KEY UPDATE` untuk beberapa tabel. Jika error persist, clear data terlebih dahulu:

```sql
-- HATI-HATI: Ini akan hapus SEMUA data!
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE pengajuan_banding_absen;
TRUNCATE TABLE absensi_siswa;
TRUNCATE TABLE absensi_guru;
TRUNCATE TABLE jadwal;
TRUNCATE TABLE siswa;
TRUNCATE TABLE guru;
TRUNCATE TABLE users;
TRUNCATE TABLE kelas;
TRUNCATE TABLE mapel;
TRUNCATE TABLE jurusan;

SET FOREIGN_KEY_CHECKS = 1;
```

Lalu run script lagi.

### Issue: Script Timeout or Hang

**Solution**: 
- Reduce `CONFIG.DAYS_TO_GENERATE` menjadi 10-15 hari
- Reduce `CONFIG.SISWA_PER_KELAS` menjadi 20
- Check database performance

### Issue: Out of Memory

**Solution**:
- Script process data in batches
- Jika masih error, reduce configuration values
- Increase Node.js memory: `node --max-old-space-size=4096 database/seeds/generate-dummy-data.js`

---

## 🎯 After Seeding - Test Export

Setelah data seeded, test export endpoints:

```bash
# Start server (jika belum running)
node server_modern.js

# Run export tests
node tests/api/test-all-export-endpoints.js
```

**Expected**: Semua 6 export endpoints berhasil dengan data yang banyak!

---

## 📊 Sample Test Queries

### Get Total Attendance by Status
```sql
SELECT 
    status,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM absensi_siswa), 2) as persentase
FROM absensi_siswa
GROUP BY status
ORDER BY jumlah DESC;
```

### Get Top 10 Students by Attendance
```sql
SELECT 
    s.nama,
    k.nama_kelas,
    SUM(CASE WHEN ase.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
    COUNT(*) as total,
    ROUND(SUM(CASE WHEN ase.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as presentase
FROM siswa s
JOIN kelas k ON s.kelas_id = k.id_kelas
LEFT JOIN absensi_siswa ase ON s.id_siswa = ase.siswa_id
GROUP BY s.id_siswa
ORDER BY presentase DESC
LIMIT 10;
```

### Get Guru Performance
```sql
SELECT 
    g.nama,
    m.nama_mapel,
    SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
    COUNT(*) as total,
    ROUND(SUM(CASE WHEN ag.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as presentase
FROM guru g
LEFT JOIN mapel m ON g.mapel_id = m.id_mapel
LEFT JOIN absensi_guru ag ON g.id_guru = ag.guru_id
GROUP BY g.id_guru
ORDER BY presentase DESC;
```

---

## 🔄 Re-seeding

Jika ingin re-seed data:

1. **Clear existing data** (gunakan script clear di atas)
2. **Run seeding script** lagi
3. **Verify data** dengan queries di atas

---

## 📞 Support

**Common Issues**:
- ❌ Foreign key errors → Run migrations first
- ❌ Timeout → Reduce configuration
- ❌ Memory error → Increase Node.js memory
- ❌ Duplicate errors → Clear data first

**Check**:
- Database running: ✅
- Schema migrated: ✅
- Enough disk space: ✅
- Node.js version >= 14: ✅

---

**Last Updated**: 21 Oktober 2025  
**Script Version**: 1.0  
**Estimated Total Records**: ~41,000+  
**Status**: ✅ **READY TO USE**


