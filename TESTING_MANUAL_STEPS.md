# 🧪 Manual Testing Steps - Kop Laporan & Export Excel

## ✅ Semua Implementasi SELESAI - Siap Testing

**Status**: ✅ **READY FOR TESTING**

---

## 📋 Langkah Testing Manual

### Step 1: Start Server

**Option A: Terminal Baru**
```bash
# Buka terminal baru dan jalankan:
node server_modern.js
```

**Option B: npm start**
```bash
npm start
```

**Tunggu hingga muncul**:
```
✅ Server running on port 5000
✅ Database connected
```

---

### Step 2: Verify Server Running

**Buka browser** dan akses:
```
http://localhost:5000
```

Atau cek dengan curl:
```bash
curl http://localhost:5000/api/health
```

---

### Step 3: Test dengan Postman/Thunder Client

#### 3.1 Login sebagai Admin

```http
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Copy token** dari response!

---

#### 3.2 Test Export Teacher Summary

```http
GET http://localhost:5000/api/export/teacher-summary?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Expected**: File download `teacher-summary-2025-10-01-2025-10-21.xlsx`

**Verify**:
- ✅ File bisa dibuka di Excel
- ✅ Logo kiri dan kanan muncul sebagai image
- ✅ Letterhead text lengkap (nama sekolah, alamat, dll)
- ✅ Data guru terisi
- ✅ Kolom: No, Nama, NIP, H, I, S, A, Presentase
- ✅ Presentase dihitung dengan benar (0.00% - 100.00%)
- ✅ Borders dan formatting rapi

---

#### 3.3 Test Export Student Summary

```http
GET http://localhost:5000/api/export/student-summary?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Expected**: File download `student-summary-2025-10-01-2025-10-21.xlsx`

**Verify**:
- ✅ Logo dan letterhead muncul
- ✅ Data siswa terisi
- ✅ Kolom: No, Nama, NIS, Kelas, H, I, S, A, D, Presentase
- ✅ Dispen dihitung sebagai hadir
- ✅ Presentase = (Hadir + Dispen) / Total Hari

---

#### 3.4 Test Export Presensi Siswa

```http
GET http://localhost:5000/api/export/presensi-siswa?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Optional Filter**:
```http
GET http://localhost:5000/api/export/presensi-siswa?startDate=2025-10-01&endDate=2025-10-21&kelasId=1
```

**Expected**: File download `presensi-siswa-*.xlsx`

**Verify**:
- ✅ Logo dan letterhead muncul
- ✅ Detail per mapel/jam
- ✅ Kolom: No, NIS, Nama, Kelas, Tanggal, Jam Ke, Mapel, Status, Keterangan
- ✅ Sorted by date, class, name

---

#### 3.5 Test Export Rekap Ketidakhadiran

```http
GET http://localhost:5000/api/export/rekap-ketidakhadiran?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Expected**: File download `rekap-ketidakhadiran-*.xlsx`

**Verify**:
- ✅ Logo dan letterhead muncul
- ✅ Rekap per periode (bulan)
- ✅ Kolom: No, Nama, NIS, Kelas, Periode, Izin, Sakit, Alpa, Dispen, Total
- ✅ Total = Izin + Sakit + Alpa (Dispen TIDAK dihitung)
- ✅ Daily logic applied

---

#### 3.6 Test Export Rekap Ketidakhadiran Guru

```http
GET http://localhost:5000/api/export/rekap-ketidakhadiran-guru?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Optional Filter**:
```http
GET http://localhost:5000/api/export/rekap-ketidakhadiran-guru?startDate=2025-10-01&endDate=2025-10-21&mapelId=1
```

**Expected**: File download `rekap-ketidakhadiran-guru-*.xlsx`

**Verify**:
- ✅ Logo dan letterhead muncul
- ✅ Rekap per periode (bulan)
- ✅ Kolom: No, Nama, NIP, Mapel, Periode, H, I, S, A, Total, Presentase
- ✅ Daily logic applied

---

#### 3.7 Test Export Banding Absen

```http
GET http://localhost:5000/api/export/banding-absen?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <paste_token_here>
```

**Optional Filter**:
```http
GET http://localhost:5000/api/export/banding-absen?startDate=2025-10-01&endDate=2025-10-21&status=pending
```

Status options: `pending`, `disetujui`, `ditolak`

**Expected**: File download `banding-absen-*.xlsx`

**Verify**:
- ✅ Logo dan letterhead muncul
- ✅ History pengajuan banding lengkap
- ✅ Kolom: Tanggal Pengajuan, Tanggal Absen, Pengaju, Kelas, Mapel, Status Asli, Status Diajukan, Status Banding, Alasan, Catatan Guru, Tanggal Keputusan, Diproses Oleh

---

### Step 4: Verify Excel Files

Buka setiap file Excel yang di-download dan verify:

#### Logo Check
- [ ] Logo kiri muncul di kolom pertama (60x60px)
- [ ] Logo kanan muncul di kolom terakhir (60x60px)
- [ ] Logo tampil sebagai IMAGE (bukan text `[LOGO KIRI]`)

#### Letterhead Check
- [ ] Nama sekolah: "SMK NEGERI 13 JAKARTA" (bold, size 16)
- [ ] Alamat lengkap
- [ ] Kontak (telp, email)
- [ ] Alignment center
- [ ] Spacing setelah letterhead

#### Data Check
- [ ] Semua data terisi (tidak ada cell kosong yang seharusnya ada data)
- [ ] Presentase dihitung dengan benar (tidak semua 0%)
- [ ] Format tanggal benar (DD/MM/YYYY)
- [ ] Format angka benar (integer untuk H/I/S/A)

#### Formatting Check
- [ ] Header row ada background color (light blue)
- [ ] Borders ada di semua cell
- [ ] Alternate row colors (zebra striping)
- [ ] Column width sesuai
- [ ] Text alignment sesuai (center/left/right)

---

## 🔍 Daily Logic Verification

### Test Case: Verifikasi Logic Kehadiran Harian

**Scenario**:
- Tanggal: 2025-10-21
- Student: "Huda"
- Mapel 1 (MTK jam 1): **Izin** (ke puskesmas - ada keterangan)
- Mapel 2 (PBT jam 3): **Hadir**

**Expected Result**:
- Status Hari: **HADIR** (Izin)
- Alasan: Ada keterangan valid (ke puskesmas)

---

**Scenario 2**:
- Tanggal: 2025-10-22
- Student: "Raihan"
- Mapel 1 (MTK jam 1): **Alpa** (tanpa keterangan)
- Mapel 2 (PBT jam 3): **Hadir**

**Expected Result**:
- Status Hari: **TIDAK HADIR** (Alpa)
- Alasan: Ada alpha tanpa keterangan dalam hari itu

---

**Scenario 3**:
- Tanggal: 2025-10-23
- Student: "Arsya"
- Mapel 1-6: **Dispen** (acara MPLS - surat dispen)

**Expected Result**:
- Status Hari: **HADIR** (Dispen)
- Alasan: Dispen = belajar bentuk lain
- Presentase: Dihitung sebagai hari hadir

---

### Verify di Excel:

**Teacher Summary / Student Summary**:
1. Cari student "Huda" → Presentase harus memperhitungkan hari izin sebagai hadir
2. Cari student "Raihan" → Hari dengan alpha harus dihitung tidak hadir
3. Cari student "Arsya" → Hari dengan dispen harus dihitung hadir

**Presentase Calculation**:
```
Hari Hadir = H + Dispen (untuk siswa)
Total Hari = Semua hari dalam periode yang ada absensi
Presentase = (Hari Hadir / Total Hari) * 100%
```

---

## 📊 Expected Test Results

| Endpoint | HTTP Status | File Size | Logo | Letterhead | Data |
|----------|-------------|-----------|------|------------|------|
| teacher-summary | 200 | >15 KB | ✅ | ✅ | ✅ |
| student-summary | 200 | >20 KB | ✅ | ✅ | ✅ |
| presensi-siswa | 200 | >50 KB | ✅ | ✅ | ✅ |
| rekap-ketidakhadiran | 200 | >25 KB | ✅ | ✅ | ✅ |
| rekap-ketidakhadiran-guru | 200 | >20 KB | ✅ | ✅ | ✅ |
| banding-absen | 200 | >15 KB | ✅ | ✅ | ✅ |

---

## 🐛 Troubleshooting

### Issue: Server tidak start
**Error**: "Port 5000 already in use"  
**Solution**: 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Then restart
node server_modern.js
```

---

### Issue: Login failed
**Error**: "Invalid credentials"  
**Solution**:
- Check username/password
- Default: `admin` / `admin123`
- Verify di database:
  ```sql
  SELECT * FROM users WHERE role = 'ADMIN';
  ```

---

### Issue: Export returns 401
**Error**: "Unauthorized"  
**Solution**:
- Token expired (24 jam)
- Login ulang untuk token baru
- Pastikan format header: `Authorization: Bearer <token>`

---

### Issue: Logo tidak muncul
**Symptom**: Text `[LOGO KIRI]` masih ada  
**Solution**:
1. Check letterhead config di database:
   ```sql
   SELECT * FROM system_config WHERE config_key LIKE 'letterhead%';
   ```
2. Logo harus format base64:
   ```
   data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
   ```
3. Jika belum ada, akan gunakan default letterhead

---

### Issue: Presentase semua 0%
**Symptom**: Kolom presentase menunjukkan 0.00%  
**Solution**:
1. Check ada data absensi di periode tersebut:
   ```sql
   SELECT COUNT(*) FROM absensi_siswa 
   WHERE tanggal BETWEEN '2025-10-01' AND '2025-10-21';
   ```
2. Gunakan date range yang pasti ada data
3. Check console log server untuk query results

---

### Issue: File corrupt atau tidak bisa dibuka
**Symptom**: Excel error saat buka file  
**Solution**:
1. Check Content-Type header di response
2. Pastikan download complete (file size > 0)
3. Try download ulang
4. Check server console untuk error

---

## ✅ Final Checklist

### Pre-Testing
- [ ] Server running di port 5000
- [ ] Database accessible
- [ ] Ada data absensi untuk testing
- [ ] Admin account tersedia

### Testing
- [ ] Login berhasil
- [ ] Token didapatkan
- [ ] Semua 6 endpoint tested
- [ ] Semua file downloaded

### Verification
- [ ] Logo muncul sebagai image
- [ ] Letterhead formatted correctly
- [ ] Data accuracy verified
- [ ] Presentase calculation correct
- [ ] Daily logic working
- [ ] Excel formatting proper

---

## 🎉 Success Criteria

Testing dinyatakan **BERHASIL** jika:

1. ✅ Semua 6 endpoint return HTTP 200
2. ✅ Semua file Excel bisa downloaded dan opened
3. ✅ Logo kiri dan kanan muncul sebagai image (bukan text)
4. ✅ Letterhead text lengkap dan formatted
5. ✅ Data accuracy 100% (compare dengan database)
6. ✅ Presentase dihitung dengan daily logic (bukan per mapel)
7. ✅ Dispen dihitung sebagai hadir
8. ✅ Excel formatting sesuai (borders, colors, alignment)
9. ✅ No errors di server console
10. ✅ File size reasonable (>10 KB)

---

## 📞 Next Steps Setelah Testing

**Jika Semua Test PASS**:
1. ✅ Mark implementation as COMPLETE
2. ✅ Deploy to production (optional)
3. ✅ Update documentation
4. ✅ Notify team

**Jika Ada Issue**:
1. ❌ Document error details
2. ❌ Check server console logs
3. ❌ Verify database queries
4. ❌ Fix bugs
5. ❌ Retest

---

**Last Updated**: 21 Oktober 2025  
**Status**: ✅ **READY FOR MANUAL TESTING**  
**Estimated Testing Time**: 15-20 minutes

---

## 🚀 Quick Start

```bash
# 1. Start server
node server_modern.js

# 2. Open Postman/Thunder Client

# 3. Login:
POST http://localhost:5000/api/login
Body: {"username":"admin","password":"admin123"}

# 4. Test exports (copy token ke Authorization header):
GET http://localhost:5000/api/export/teacher-summary?startDate=2025-10-01&endDate=2025-10-21
GET http://localhost:5000/api/export/student-summary?startDate=2025-10-01&endDate=2025-10-21
GET http://localhost:5000/api/export/presensi-siswa?startDate=2025-10-01&endDate=2025-10-21
GET http://localhost:5000/api/export/rekap-ketidakhadiran?startDate=2025-10-01&endDate=2025-10-21
GET http://localhost:5000/api/export/rekap-ketidakhadiran-guru?startDate=2025-10-01&endDate=2025-10-21
GET http://localhost:5000/api/export/banding-absen?startDate=2025-10-01&endDate=2025-10-21

# 5. Verify Excel files!
```

**Good luck! 🎉**


