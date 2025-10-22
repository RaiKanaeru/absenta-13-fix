# ✅ MULTI-TEACHER TESTING - READY TO USE

**Status**: ✅ **READY FOR TESTING**  
**Setup Date**: 21 Oktober 2025  
**Multi-Teacher Schedules**: 3 jadwal aktif

---

## 🎯 JADWAL DENGAN MULTI-GURU (3 Schedules)

### **1. X AK - Pendidikan Jasmani**
- **Hari**: Selasa (Jam ke-5)
- **Waktu**: 10:15 - 11:00
- **Guru Utama**: Mahendra Azzahra
- **Guru Tambahan**: 
  - Agus Nurhaliza (secondary)
  - Ahmad Kusuma Guru97 (assistant)
- **Total Guru**: 3 guru

### **2. XI AK - Pendidikan Agama Islam**
- **Hari**: Jumat (Jam ke-4)
- **Waktu**: 09:15 - 10:00
- **Guru Utama**: Dewi Permatasari
- **Guru Tambahan**:
  - Agus Nurhaliza (secondary)
  - Ahmad Kusuma Guru97 (assistant)
- **Total Guru**: 3 guru

### **3. XII RPL - Pendidikan Agama Islam**
- **Hari**: Kamis (Jam ke-4)
- **Waktu**: 09:15 - 10:00
- **Guru Utama**: Dewi Permatasari
- **Guru Tambahan**:
  - Agus Nurhaliza (secondary)
  - Ahmad Kusuma Guru97 (assistant)
- **Total Guru**: 3 guru

---

## 🔐 AKUN UNTUK TESTING

### **👨‍🎓 AKUN SISWA (Rekomendasi)**

#### **Siswa Kelas X AK** (untuk test jadwal #1):
| Nama | Username | Password | Kelas |
|------|----------|----------|-------|
| Andi Fadli | `siswa_20240118` | `20240118@2024` | X AK |
| Ayu Lestari | `siswa_20240102` | `20240102@2024` | X AK |
| Bayu Gunawan | `siswa_20240096` | `20240096@2024` | X AK |

#### **Siswa Kelas XI AK** (untuk test jadwal #2):
Query untuk mendapatkan siswa XI AK:
```sql
SELECT s.nama, u.username, s.nis, k.nama_kelas
FROM siswa s
JOIN users u ON s.user_id = u.id
JOIN kelas k ON s.kelas_id = k.id_kelas
WHERE k.nama_kelas = 'XI AK' AND s.status = 'aktif'
LIMIT 3;
```
Password format: `[NIS]@2024`

#### **Siswa Kelas XII RPL** (untuk test jadwal #3):
Query untuk mendapatkan siswa XII RPL:
```sql
SELECT s.nama, u.username, s.nis, k.nama_kelas
FROM siswa s
JOIN users u ON s.user_id = u.id
JOIN kelas k ON s.kelas_id = k.id_kelas
WHERE k.nama_kelas = 'XII RPL' AND s.status = 'aktif'
LIMIT 3;
```
Password format: `[NIS]@2024`

---

### **👨‍🏫 AKUN GURU (Rekomendasi)**

#### **Guru Utama**:
| Nama | Username | Password | Jadwal |
|------|----------|----------|--------|
| Mahendra Azzahra | `(cek database)` | `guru123` | X AK - Penjas (Selasa) |
| Dewi Permatasari | `(cek database)` | `guru123` | XI AK & XII RPL - PAI |

#### **Guru Tambahan** (Multi-Teacher):
| Nama | Username | Password | Role | Jadwal |
|------|----------|----------|------|--------|
| Agus Nurhaliza | `guru_17` | `guru123` | Secondary | Semua 3 jadwal |
| Ahmad Kusuma Guru97 | `guru_1967000097` | `guru123` | Assistant | Semua 3 jadwal |

---

## 🧪 TESTING SCENARIOS

### **Scenario 1: Student View Multi-Teacher**

**Step-by-step**:
1. Login sebagai **Siswa X AK**: 
   - Username: `siswa_20240118`
   - Password: `20240118@2024`

2. Di dashboard siswa, pilih **"Jadwal Hari Ini"** atau **"Jadwal Minggu Ini"**

3. Jika hari **Selasa**, akan muncul jadwal:
   - **X AK - Pendidikan Jasmani**
   - **Jam ke-5** (10:15 - 11:00)
   - **3 Guru**: Mahendra Azzahra, Agus Nurhaliza, Ahmad Kusuma Guru97

4. Klik **"Submit Kehadiran Guru"**

5. **EXPECTED**:
   - ✅ Semua 3 guru muncul di list
   - ✅ Bisa pilih status per guru (Hadir/Tidak Hadir/Sakit/Izin)
   - ✅ Bisa isi keterangan per guru
   - ✅ Submit berhasil

---

### **Scenario 2: Teacher View Multi-Teacher Assignment**

**Step-by-step**:
1. Login sebagai **Guru Tambahan**:
   - Username: `guru_17` (Agus Nurhaliza)
   - Password: `guru123`

2. Di dashboard guru, pilih **"Jadwal Mengajar"**

3. **EXPECTED**:
   - ✅ Muncul **3 jadwal tambahan**:
     - X AK - Penjas (Selasa, jam 5)
     - XI AK - PAI (Jumat, jam 4)
     - XII RPL - PAI (Kamis, jam 4)
   - ✅ Ditandai sebagai "Guru Tambahan" atau "Secondary Teacher"

4. Pilih salah satu jadwal

5. **EXPECTED**:
   - ✅ Bisa lihat daftar siswa
   - ✅ Bisa submit absensi siswa
   - ✅ Bisa edit absen (30 hari)

---

### **Scenario 3: Primary Teacher View**

**Step-by-step**:
1. Cek username Dewi Permatasari di database:
```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'absenta13'
  });
  const [guru] = await db.execute(
    'SELECT g.nama, u.username FROM guru g JOIN users u ON g.user_id = u.id WHERE g.nama LIKE \"%Dewi Permatasari%\"'
  );
  console.log('Guru:', guru[0]);
  await db.end();
})();
"
```

2. Login sebagai **Dewi Permatasari** (guru utama)

3. Di dashboard guru, pilih **"Jadwal Mengajar"**

4. **EXPECTED**:
   - ✅ Muncul jadwal utama **XI AK - PAI** (Jumat)
   - ✅ Muncul jadwal utama **XII RPL - PAI** (Kamis)
   - ✅ Ditandai sebagai "Guru Utama" atau "Primary Teacher"
   - ✅ Bisa lihat guru tambahan di detail jadwal

---

### **Scenario 4: Admin View Multi-Teacher**

**Step-by-step**:
1. Login sebagai **Admin**:
   - Username: `admin`
   - Password: `admin123`

2. Menu **"Kelola Jadwal"**

3. Cari jadwal **"X AK - Pendidikan Jasmani"**

4. Klik **"Edit"**

5. **EXPECTED**:
   - ✅ Muncul list **Guru Tambahan**:
     - Agus Nurhaliza
     - Ahmad Kusuma Guru97
   - ✅ Bisa tambah guru baru
   - ✅ Bisa hapus guru tambahan
   - ✅ Bisa set status aktif/tidak aktif

---

## 📊 DATABASE VERIFICATION

### **Check Multi-Teacher Data**:
```sql
-- Lihat semua jadwal multi-guru
SELECT 
  j.id_jadwal,
  k.nama_kelas,
  m.nama_mapel,
  j.hari,
  j.jam_ke,
  g_primary.nama as guru_utama,
  GROUP_CONCAT(g_additional.nama SEPARATOR ', ') as guru_tambahan
FROM jadwal j
JOIN kelas k ON j.kelas_id = k.id_kelas
JOIN mapel m ON j.mapel_id = m.id_mapel
JOIN guru g_primary ON j.guru_id = g_primary.id_guru
LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id AND jg.status = 'aktif'
LEFT JOIN guru g_additional ON jg.guru_id = g_additional.id_guru
WHERE j.status = 'aktif'
GROUP BY j.id_jadwal
HAVING COUNT(DISTINCT jg.guru_id) > 0;
```

### **Check Specific Schedule**:
```sql
-- Detail jadwal X AK - Penjas
SELECT 
  jg.id,
  jg.jadwal_id,
  g.nama as guru_nama,
  g.nip,
  jg.status,
  jg.dibuat_pada
FROM jadwal_guru jg
JOIN guru g ON jg.guru_id = g.id_guru
WHERE jg.jadwal_id = (
  SELECT j.id_jadwal 
  FROM jadwal j 
  JOIN kelas k ON j.kelas_id = k.id_kelas
  JOIN mapel m ON j.mapel_id = m.id_mapel
  WHERE k.nama_kelas = 'X AK' AND m.nama_mapel = 'Pendidikan Jasmani'
);
```

---

## 🚀 QUICK ACCESS

### **URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### **Login Shortcuts**:

**Siswa X AK**:
```
Username: siswa_20240118
Password: 20240118@2024
```

**Guru Tambahan**:
```
Username: guru_17
Password: guru123
```

**Admin**:
```
Username: admin
Password: admin123
```

---

## ✅ CHECKLIST TESTING

### **Frontend Testing**:
- [ ] Siswa bisa lihat semua guru di jadwal multi-teacher
- [ ] Siswa bisa submit kehadiran untuk setiap guru
- [ ] Guru tambahan bisa lihat jadwal tambahan di dashboard
- [ ] Guru utama bisa lihat guru tambahan di detail jadwal
- [ ] Admin bisa edit/tambah/hapus guru tambahan

### **Backend Testing**:
- [ ] Endpoint `/api/siswa/:siswa_id/jadwal-hari-ini` return semua guru
- [ ] Endpoint `/api/guru/jadwal` return jadwal utama + tambahan
- [ ] Submit absensi guru tersimpan di `absensi_guru_jadwal`
- [ ] Submit absensi guru mapping tersimpan di `absensi_guru_mapping`

### **Database Testing**:
- [ ] Table `jadwal_guru` punya 6 records (3 jadwal × 2 guru tambahan)
- [ ] All records status = 'aktif'
- [ ] Foreign keys valid (jadwal_id, guru_id)

---

## 🆘 TROUBLESHOOTING

### **Multi-Guru Tidak Muncul di Siswa Dashboard**:
1. Check hari sesuai (Selasa/Kamis/Jumat)
2. Check jam sesuai dengan jadwal aktif
3. Check database:
```sql
SELECT * FROM jadwal_guru WHERE status = 'aktif';
```

### **Guru Tambahan Tidak Muncul di Guru Dashboard**:
1. Check login sebagai guru yang benar (guru_17 atau guru_1967000097)
2. Check table jadwal_guru:
```sql
SELECT jg.*, j.hari, j.jam_ke 
FROM jadwal_guru jg
JOIN jadwal j ON jg.jadwal_id = j.id_jadwal
WHERE jg.guru_id = (SELECT id_guru FROM guru WHERE nama LIKE '%Agus Nurhaliza%');
```

### **Submit Kehadiran Gagal**:
1. Check console browser untuk error
2. Check backend logs
3. Verify endpoint `/api/siswa/submit-kehadiran-guru` working
4. Check table `absensi_guru_jadwal` structure

---

## 📝 NOTES

- ✅ Multi-teacher system fully implemented
- ✅ 3 test schedules created with 3 teachers each
- ✅ All accounts ready for testing
- ✅ Database verified and consistent
- 🔄 Need to test on actual frontend to verify UI display

**Happy Testing Multi-Teacher Feature!** 🎉




