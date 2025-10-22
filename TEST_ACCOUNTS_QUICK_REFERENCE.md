# 🔐 TEST ACCOUNTS - QUICK REFERENCE

**Last Updated**: 21 Oktober 2025  
**Database**: absenta13

---

## 👨‍🎓 AKUN SISWA (Student Accounts)

### **Rekomendasi untuk Testing**:

| Nama | Username | Password | Kelas | Jabatan |
|------|----------|----------|-------|---------|
| Andi Fadli | `siswa_20240118` | `20240118@2024` | X AK | Sekretaris Kelas |
| Ayu Lestari | `siswa_20240102` | `20240102@2024` | X AK | Sekretaris Kelas |
| Bayu Gunawan | `siswa_20240096` | `20240096@2024` | X AK | Sekretaris Kelas |

### **Login Steps (Siswa)**:
1. Buka browser: `http://localhost:3000`
2. Username: `siswa_20240118`
3. Password: `20240118@2024`
4. Role: Siswa
5. Klik **"Masuk"**

### **Fitur yang Bisa Ditest (Siswa)**:
- ✅ Lihat Jadwal Hari Ini
- ✅ Submit Kehadiran Guru (jika ada jadwal aktif)
- ✅ Pengajuan Izin Kelas
- ✅ Pengajuan Banding Absen Kelas
- ✅ Riwayat Kehadiran

---

## 👨‍🏫 AKUN GURU (Teacher Accounts)

### **Rekomendasi untuk Testing**:

| Nama | Username | Password | NIP | Mata Pelajaran |
|------|----------|----------|-----|----------------|
| Agus Nurhaliza | `guru_17` | `guru123` | 196800115017 | Komputer Akuntansi |
| Ahmad Maharani | `guru_11` | `guru123` | 196880728011 | Pemrograman Mobile |
| Ahmad Pratama Guru1 | `guru_1967000001` | `guru123` | 1967000001 | Matematika |
| Bella Firmansyah | `guru_4` | `guru123` | 196770525004 | PKn |

### **Login Steps (Guru)**:
1. Buka browser: `http://localhost:3000`
2. Username: `guru_17`
3. Password: `guru123`
4. Role: Guru
5. Klik **"Masuk"**

### **Fitur yang Bisa Ditest (Guru)**:
- ✅ Lihat Jadwal Mengajar
- ✅ Absensi Siswa (jika ada jadwal aktif)
- ✅ Edit Absen (30 Hari)
- ✅ Lihat Riwayat Kehadiran Siswa
- ✅ Proses Pengajuan Izin Siswa
- ✅ Proses Pengajuan Banding Absen
- ✅ Laporan Kehadiran

---

## 👨‍💼 AKUN ADMIN

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |

### **Login Steps (Admin)**:
1. Buka browser: `http://localhost:3000`
2. Username: `admin`
3. Password: `admin123`
4. Role: Admin
5. Klik **"Masuk"**

### **Fitur untuk Setup Multi-Guru**:
1. Login sebagai Admin
2. Menu **"Kelola Jadwal"**
3. Pilih jadwal yang ingin ditambahkan guru
4. Klik **"Edit"**
5. Tambahkan Guru Tambahan
6. Simpan

---

## 📅 SETUP MULTI-GURU (Untuk Testing)

Saat ini **belum ada jadwal dengan multi-guru**. Untuk testing fitur multi-guru:

### **Option 1: Via Admin Dashboard (Recommended)**
1. Login sebagai **admin**
2. Buka menu **"Kelola Jadwal"**
3. Pilih jadwal (misal: X AK - Matematika)
4. Klik **Edit**
5. Tambahkan **Guru Tambahan**:
   - Pilih guru: `Ahmad Maharani` (guru_11)
   - Role: Secondary Teacher
6. **Simpan**

### **Option 2: Via Script (Quick Setup)**
Run command:
```bash
node setup-multi-teacher-test.cjs
```

---

## 🧪 TESTING SCENARIOS

### **Scenario 1: Student Submit Teacher Attendance**
1. Login sebagai **Siswa**: `siswa_20240118` / `20240118@2024`
2. Pilih **"Jadwal Hari Ini"**
3. Jika ada jadwal aktif → Submit kehadiran guru
4. Cek apakah semua guru muncul (primary + additional)

### **Scenario 2: Teacher Submit Student Attendance**
1. Login sebagai **Guru**: `guru_17` / `guru123`
2. Pilih **"Jadwal Mengajar"**
3. Pilih jadwal aktif
4. Submit absensi siswa
5. Cek apakah bisa edit absen (30 hari)

### **Scenario 3: Multi-Teacher Schedule**
1. Setup jadwal multi-guru (via admin)
2. Login sebagai **Siswa**
3. Submit kehadiran → harus muncul semua guru
4. Login sebagai **Guru tambahan**
5. Cek apakah jadwal muncul di dashboard

### **Scenario 4: Student Permission Request**
1. Login sebagai **Siswa**: `siswa_20240118` / `20240118@2024`
2. Menu **"Pengajuan Izin"**
3. Submit izin kelas
4. Login sebagai **Guru** → Proses izin

### **Scenario 5: Attendance Dispute**
1. Login sebagai **Siswa**: `siswa_20240118` / `20240118@2024`
2. Menu **"Banding Absen"**
3. Submit banding untuk status "Alpa"
4. Login sebagai **Guru** → Proses banding

---

## 🔒 PASSWORD PATTERNS

### **Siswa**:
- Format: `[NIS]@2024`
- Contoh: NIS = `20240118` → Password = `20240118@2024`

### **Guru**:
- All teachers: `guru123`

### **Admin**:
- Username: `admin`
- Password: `admin123`

---

## 🚀 QUICK ACCESS URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 📊 DATABASE INFO

- **Database**: absenta13
- **Total Students**: 1250+
- **Total Teachers**: 125+
- **Total Classes**: 9
- **Total Schedules**: Available via Admin Dashboard

---

## 🆘 TROUBLESHOOTING

### **Login Gagal**:
1. Check server running: `npm run server`
2. Check database connection
3. Verify username/password correct
4. Check user status = 'aktif'

### **Fitur Tidak Muncul**:
1. Check user role correct
2. Clear browser cache
3. Check console for errors
4. Verify data exists in database

### **Multi-Guru Tidak Muncul**:
1. Pastikan jadwal sudah setup via Admin
2. Check table `jadwal_guru` punya data
3. Verify `status = 'aktif'`

---

## 📝 NOTES

- ✅ Semua password sudah di-hash dengan bcrypt
- ✅ JWT token expires dalam 24 jam
- ✅ Role-based access control sudah aktif
- ✅ Multi-teacher system sudah ready (perlu setup)
- ✅ Banding absen system sudah aktif
- ✅ Edit absen (30 hari) sudah aktif

---

**Happy Testing!** 🎉




