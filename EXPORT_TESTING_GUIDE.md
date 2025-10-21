# 📊 Export Testing Guide - Kop Laporan & Excel Export

## ✅ Status Implementasi

**Tanggal**: 21 Oktober 2025  
**Status**: SELESAI - Siap Testing  

### Completed Tasks:

1. ✅ **Logo Embedding Fixed**
   - File: `backend/export/excelBuilder.js`
   - Logo kiri dan kanan sekarang embed sebagai image (bukan text)
   - Support base64 dan file path
   - Error handling untuk logo yang tidak ada

2. ✅ **Daily Attendance Logic Implemented**
   - Priority: Alpha → Tidak Hadir, ada keterangan → Hadir
   - Dispen = Hadir (belajar bentuk lain)
   - Rekap per hari (bukan per mapel)
   
3. ✅ **All 6 Export Endpoints Created**
   - `GET /api/export/teacher-summary` ✅
   - `GET /api/export/student-summary` ✅
   - `GET /api/export/presensi-siswa` ✅
   - `GET /api/export/rekap-ketidakhadiran` ✅
   - `GET /api/export/rekap-ketidakhadiran-guru` ✅
   - `GET /api/export/banding-absen` ✅

4. ✅ **All Schemas Created**
   - `backend/export/schemas/teacher-summary.js` ✅
   - `backend/export/schemas/student-summary.js` ✅
   - `backend/export/schemas/presensi-siswa.js` ✅
   - `backend/export/schemas/rekap-ketidakhadiran.js` ✅
   - `backend/export/schemas/rekap-ketidakhadiran-guru.js` (sudah ada)
   - `backend/export/schemas/banding-absen.js` (sudah ada)

5. ✅ **Letterhead Integration**
   - Semua endpoint fetch letterhead config dari `system_config`
   - Support global letterhead sebagai fallback
   - Dynamic letterhead rendering

---

## 🧪 Testing Instructions

### Pre-requisites

1. **Server harus running**:
   ```bash
   npm start
   # atau
   node server_modern.js
   ```

2. **Database harus tersedia**:
   - Database: `absenta13`
   - Ada data absensi untuk testing

3. **Admin credentials**:
   - Username: `admin`
   - Password: `admin123`
   
   Update di `tests/api/test-all-export-endpoints.js` jika berbeda

### Running Tests

#### Option 1: Automated Testing Script

```bash
# Install dependencies jika belum
npm install axios

# Run test script
node tests/api/test-all-export-endpoints.js
```

**Expected Output**:
```
🚀 Starting Export Endpoints Testing...
============================================================
🔐 Logging in as admin...
✅ Login successful

============================================================

📅 Test Period: 2025-10-01 to 2025-10-21
============================================================

📊 Testing teacher-summary...
   Params: {"startDate":"2025-10-01","endDate":"2025-10-21"}
   ✅ Success! File saved: test-teacher-summary-*.xlsx (25.43 KB)
   📁 Path: /path/to/downloads/test-exports/test-teacher-summary-*.xlsx

📊 Testing student-summary...
   ✅ Success! File saved: test-student-summary-*.xlsx (32.15 KB)

... (dan seterusnya untuk semua 6 endpoint)

============================================================
📊 TEST SUMMARY
============================================================
Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Success Rate: 100.00%

📁 Download Directory: /path/to/downloads/test-exports
============================================================

🎉 All tests passed! Semua export berhasil!
```

#### Option 2: Manual Testing dengan Postman/Thunder Client

**1. Login sebagai Admin**:
```http
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**2. Test Export Endpoints**:

Gunakan token dari response login di header Authorization.

**Teacher Summary**:
```http
GET http://localhost:5000/api/export/teacher-summary?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Student Summary**:
```http
GET http://localhost:5000/api/export/student-summary?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Presensi Siswa**:
```http
GET http://localhost:5000/api/export/presensi-siswa?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Rekap Ketidakhadiran**:
```http
GET http://localhost:5000/api/export/rekap-ketidakhadiran?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Rekap Ketidakhadiran Guru**:
```http
GET http://localhost:5000/api/export/rekap-ketidakhadiran-guru?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Banding Absen**:
```http
GET http://localhost:5000/api/export/banding-absen?startDate=2025-10-01&endDate=2025-10-21
Authorization: Bearer <token>
```

**Optional Parameters**:
- `kelasId` - Filter by class (for student reports)
- `mapelId` - Filter by subject (for teacher reports)
- `status` - Filter by status (for banding absen: pending/disetujui/ditolak)

---

## 🔍 What to Verify

### 1. Logo Integration
- ✅ Logo kiri muncul di kolom pertama
- ✅ Logo kanan muncul di kolom terakhir
- ✅ Logo tampil sebagai image (bukan text placeholder)
- ✅ Ukuran logo sesuai (60x60px)

### 2. Letterhead Lines
- ✅ Nama sekolah muncul (bold, size 16)
- ✅ Alamat dan kontak muncul (size 12)
- ✅ Alignment center (atau sesuai config)
- ✅ Spacing setelah letterhead

### 3. Report Content

**Teacher Summary**:
- ✅ Kolom: No, Nama, NIP, H, I, S, A, Presentase
- ✅ Data terisi dengan benar
- ✅ Presentase dihitung per hari (bukan per sesi)
- ✅ Format presentase: 0.00%

**Student Summary**:
- ✅ Kolom: No, Nama, NIS, Kelas, H, I, S, A, D, Presentase
- ✅ Data terisi dengan benar
- ✅ Dispen dihitung sebagai hadir
- ✅ Presentase = (Hadir + Dispen) / Total Hari

**Presensi Siswa**:
- ✅ Detail per mapel/jam
- ✅ Kolom: No, NIS, Nama, Kelas, Tanggal, Jam Ke, Mapel, Status, Keterangan
- ✅ Sorted by date, class, name

**Rekap Ketidakhadiran**:
- ✅ Rekap per periode (bulan)
- ✅ Hanya hitung hari tidak hadir (Alpha, Izin, Sakit)
- ✅ Dispen tidak dihitung sebagai tidak hadir

**Rekap Ketidakhadiran Guru**:
- ✅ Rekap per periode (bulan)
- ✅ Kolom: Nama, NIP, Mapel, Periode, H, I, S, A, Total, %

**Banding Absen**:
- ✅ History pengajuan banding
- ✅ Kolom lengkap dengan status asli, diajukan, dan keputusan

### 4. Excel Formatting
- ✅ Header row dengan background color
- ✅ Alternate row colors (zebra striping)
- ✅ Borders pada semua cell
- ✅ Column width sesuai
- ✅ Text alignment sesuai (center/left/right)

---

## 🐛 Common Issues & Solutions

### Issue 1: Logo tidak muncul
**Symptom**: Placeholder text `[LOGO KIRI]` masih ada  
**Solution**: 
- Pastikan logo URL di database adalah base64 (`data:image/png;base64,...`)
- Check console log untuk error: "Failed to add left/right logo"

### Issue 2: Presentase 0%
**Symptom**: Semua presentase menunjukkan 0%  
**Solution**:
- Check apakah ada data absensi di database
- Verify query date range sesuai dengan data
- Check console log untuk "Retrieved X records"

### Issue 3: Export endpoint returns 401
**Symptom**: Unauthorized error  
**Solution**:
- Login ulang untuk mendapatkan token baru
- Pastikan token di-include di header: `Authorization: Bearer <token>`
- Check token expiry (default 24 jam)

### Issue 4: File kosong atau corrupt
**Symptom**: Excel file tidak bisa dibuka  
**Solution**:
- Check Content-Type header: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Check response adalah arraybuffer (bukan JSON)
- Verify file size > 0

---

## 📈 Performance Benchmarks

**Expected Response Times** (dengan data ~100 siswa, 30 hari):

| Endpoint | Expected Time | File Size |
|----------|---------------|-----------|
| teacher-summary | < 2s | ~20-30 KB |
| student-summary | < 3s | ~30-50 KB |
| presensi-siswa | < 5s | ~100-200 KB |
| rekap-ketidakhadiran | < 3s | ~40-60 KB |
| rekap-ketidakhadiran-guru | < 2s | ~20-40 KB |
| banding-absen | < 2s | ~15-25 KB |

**Note**: Times vary based on:
- Database performance
- Date range (longer range = more data)
- Server load
- Network latency

---

## ✅ Final Checklist

### Before Testing
- [ ] Server running (`node server_modern.js`)
- [ ] Database accessible
- [ ] Test data seeded
- [ ] Admin account created
- [ ] Letterhead configured in `system_config`

### Testing Phase
- [ ] Run automated test script
- [ ] All 6 endpoints return success (200)
- [ ] All Excel files downloadable
- [ ] Files can be opened in Excel/LibreOffice

### Verification Phase
- [ ] Logo muncul dengan benar
- [ ] Letterhead text lengkap
- [ ] Data accuracy (compare with database)
- [ ] Presentase calculation correct
- [ ] Excel formatting proper

### Post-Testing
- [ ] Files saved in `downloads/test-exports/`
- [ ] No console errors
- [ ] No database errors
- [ ] No memory leaks

---

## 🎉 Success Criteria

Testing dinyatakan **BERHASIL** jika:

1. ✅ Semua 6 endpoint return HTTP 200
2. ✅ Semua file Excel bisa di-download dan dibuka
3. ✅ Logo kiri dan kanan muncul sebagai image
4. ✅ Letterhead text lengkap dan formatted
5. ✅ Data accuracy 100%
6. ✅ Presentase dihitung dengan benar (daily logic)
7. ✅ Excel formatting sesuai ekspektasi
8. ✅ No errors di console/logs

---

## 📞 Support

Jika ada issue atau pertanyaan:

1. **Check Logs**: 
   - Server console output
   - Browser developer console
   - Test script output

2. **Verify Database**:
   ```sql
   -- Check letterhead config
   SELECT * FROM system_config WHERE config_key LIKE 'letterhead%';
   
   -- Check absensi data
   SELECT COUNT(*) FROM absensi_siswa WHERE tanggal >= '2025-10-01';
   SELECT COUNT(*) FROM absensi_guru WHERE tanggal >= '2025-10-01';
   ```

3. **Debug Mode**:
   - Set `DEBUG=true` di environment
   - Check detailed query logs
   - Verify response data structure

---

**Last Updated**: 21 Oktober 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Testing


