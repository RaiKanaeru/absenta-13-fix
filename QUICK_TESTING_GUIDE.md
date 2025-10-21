# 🧪 Quick Testing Guide - Post-Fixes Verification

**Tujuan**: Verify semua 8 kategori fixes berfungsi dengan benar  
**Estimasi Waktu**: 15-20 menit  
**Prerequisites**: Backend running (Port 3001), Frontend running (Port 5173)

---

## 🚀 SETUP (5 menit)

### 1. Verify Backend Running
```bash
# Check port 3001
netstat -ano | findstr ":3001"

# Should show: LISTENING on port 3001
```

### 2. Start Frontend (jika belum running)
```bash
cd frontend
npm run dev

# Wait for: Local: http://localhost:5173/
```

### 3. Test Health Endpoint
```bash
curl http://localhost:3001/api/health

# Expected Response:
{
  "status": "healthy",
  "database": { "connected": true },
  "redis": { "connected": true }
}
```

✅ **Setup Complete!** Lanjut ke testing.

---

## 🎯 CRITICAL TESTS (10 menit)

### Test 1: ✅ Backup Buttons (2 menit)

**Before**: Buttons were hardcoded `disabled={true}`  
**After**: Buttons should be clickable

**Steps**:
1. Open browser: http://localhost:5173
2. Login sebagai **admin** (username: `admin`, password sesuai database)
3. Navigate ke **Backup Management** (icon database/folder)
4. **VERIFY**:
   - ✅ "Buat Backup Baru" button **NOT disabled** (clickable)
   - ✅ "Archive Old Data" button **NOT disabled**
   - ✅ "Create Test Data" button **NOT disabled**
5. Click "Buat Backup Baru"
6. **VERIFY**: Loading state appears, then success message

**Expected Result**: ✅ All buttons functional, backup created successfully

**If PASS**: ✅ Test 1 PASSED  
**If FAIL**: ❌ Screenshot error, report to developer

---

### Test 2: ✅ Teacher - Fetch Students (2 menit)

**Before**: SQL syntax error `500 Internal Server Error`  
**After**: Students list loads successfully

**Steps**:
1. Login sebagai **guru** (contoh: `guru001`, password sesuai database)
2. Navigate ke **Ambil Absen** atau **Teacher Dashboard**
3. Select **any schedule** from dropdown
4. Select **any date** (contoh: 09 Oktober 2025)
5. **VERIFY**:
   - ✅ Students list muncul (tidak ada error)
   - ✅ Console browser TIDAK ada error 500
   - ✅ Students data tampil dengan nama, NIS, status

**Expected Result**: ✅ Students loaded without errors

**If PASS**: ✅ Test 2 PASSED  
**If FAIL**: ❌ Open browser console (F12), screenshot error

---

### Test 3: ✅ Guru Profile Update (2 menit)

**Before**: `500 Internal Server Error` karena payload mismatch  
**After**: Profile update berhasil

**Steps**:
1. Still logged in as **guru**
2. Navigate ke **Profile** or **Edit Profile**
3. Change **any field**: Nama, Email, Alamat, Jenis Kelamin
4. Click **Save** or **Update Profile**
5. **VERIFY**:
   - ✅ Success message muncul ("Profil berhasil diperbarui")
   - ✅ TIDAK ada error 500
   - ✅ Data changed tersimpan
6. **Reload page** (F5)
7. **VERIFY**: Changes persisted (data masih berubah)

**Expected Result**: ✅ Profile updated successfully, changes persisted

**If PASS**: ✅ Test 3 PASSED  
**If FAIL**: ❌ Screenshot error, check browser console

---

### Test 4: ✅ Student - Edit Absen Past Date (3 menit)

**Before**: Changes not saved (table mismatch)  
**After**: Changes persist correctly

**Steps**:
1. Logout, login sebagai **siswa** (contoh: `siswa_001`, password sesuai)
2. Navigate ke **Edit Absen** or **Absensi Guru**
3. **Select PAST DATE** (contoh: 7 hari yang lalu, bukan hari ini)
4. Change **any teacher attendance**:
   - Status: "Tidak Hadir" → "Hadir"
   - Or add Keterangan
5. Click **Save** or **Submit**
6. **VERIFY**:
   - ✅ Success message ("Kehadiran guru berhasil diperbarui")
7. **IMPORTANT**: Select **different date** (future), then **select same past date again**
8. **VERIFY**:
   - ✅ **Changes STILL THERE** (data persisted)
   - ✅ Status is "Hadir" (not reverted to "Tidak Hadir")

**Expected Result**: ✅ Attendance changes saved and persisted across reloads

**If PASS**: ✅ Test 4 PASSED ← **CRITICAL TEST**  
**If FAIL**: ❌ Screenshot, check database: `SELECT * FROM absensi_guru_jadwal WHERE tanggal = '2025-10-XX'`

---

## 🔍 DATABASE VERIFICATION (3 menit)

### Query 1: Student Attendance Persistence
```sql
-- Check recent student-submitted attendance
SELECT
    agj.id,
    agj.jadwal_id,
    agj.guru_id,
    agj.tanggal,
    agj.status,
    agj.keterangan,
    g.nama as nama_guru,
    s.nama as nama_siswa_pencatat
FROM absensi_guru_jadwal agj
JOIN guru g ON agj.guru_id = g.id_guru
LEFT JOIN siswa s ON agj.siswa_pencatat_id = s.id_siswa
WHERE agj.tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY agj.tanggal DESC, agj.jadwal_id;

-- Expected: Rows with recent dates, status matches what student submitted
```

### Query 2: Dashboard Stats Accuracy
```sql
-- Total attendance today (UNION from both tables)
SELECT
    (SELECT COUNT(*) FROM absensi_guru WHERE tanggal = CURDATE()) as old_table,
    (SELECT COUNT(*) FROM absensi_guru_jadwal WHERE tanggal = CURDATE()) as new_table,
    (SELECT COUNT(*) FROM absensi_guru WHERE tanggal = CURDATE()) +
    (SELECT COUNT(*) FROM absensi_guru_jadwal WHERE tanggal = CURDATE()) as total;

-- Expected: total > 0 (if attendance recorded today)
```

### Query 3: No Orphaned Data
```sql
-- Check for orphaned attendance records
SELECT COUNT(*) as orphaned_count
FROM absensi_guru_jadwal agj
WHERE NOT EXISTS (
    SELECT 1 FROM jadwal j WHERE j.id_jadwal = agj.jadwal_id
);

-- Expected: 0 (no orphaned records)
```

**If ALL queries return expected results**: ✅ Database VERIFIED

---

## 📊 DASHBOARD VERIFICATION (2 menit)

### Admin Dashboard
1. Login sebagai **admin**
2. Check dashboard stats:
   - ✅ "Absensi Hari Ini" count (should be > 0 if attendance recorded)
   - ✅ "Persentase Kehadiran" chart (should show data)
   - ✅ Weekly chart (should show trend)

### Guru Dashboard
1. Login sebagai **guru**
2. Check stats:
   - ✅ "Absensi Minggu Ini" count
   - ✅ Personal attendance chart
   - ✅ Class list

### Siswa Dashboard
1. Login sebagai **siswa**
2. Check:
   - ✅ Jadwal hari ini
   - ✅ Riwayat kehadiran (past 30 days)
   - ✅ Stats (if any)

**If ALL dashboards show correct data**: ✅ Dashboards VERIFIED

---

## ✅ FINAL CHECKLIST

### Critical Functionality ✅
- [ ] ✅ Backup buttons clickable and functional
- [ ] ✅ Teacher can fetch students without SQL error
- [ ] ✅ Guru profile update successful
- [ ] ✅ Student edit absen persists correctly

### Data Integrity ✅
- [ ] ✅ Attendance saved to `absensi_guru_jadwal`
- [ ] ✅ Dashboard stats accurate (UNION from both tables)
- [ ] ✅ No orphaned data in database

### System Stability ✅
- [ ] ✅ Backend running stable (no crashes)
- [ ] ✅ Health endpoint returns healthy
- [ ] ✅ Redis connected
- [ ] ✅ Database pool stable

---

## 🎯 PASS CRITERIA

**MINIMUM PASS**: All 4 critical tests PASS  
**FULL PASS**: All tests + database verification + dashboards PASS

### If ALL PASS: ✅
**Status**: 🎉 **SYSTEM FULLY VERIFIED**  
**Action**: Ready for User Acceptance Testing (UAT)

### If ANY FAIL: ❌
**Status**: ⚠️ **Additional Fixes Required**  
**Action**:
1. Screenshot error
2. Check browser console (F12 → Console tab)
3. Check server logs
4. Report to developer with:
   - Which test failed
   - Error message
   - Screenshot
   - Console logs

---

## 📝 TESTING LOG

**Test Date**: _______________  
**Tester**: _______________

| Test | Status | Notes |
|------|--------|-------|
| Backup Buttons | ⬜ Pass / ⬜ Fail | |
| Fetch Students | ⬜ Pass / ⬜ Fail | |
| Guru Profile | ⬜ Pass / ⬜ Fail | |
| Edit Absen Past | ⬜ Pass / ⬜ Fail | |
| DB Verification | ⬜ Pass / ⬜ Fail | |
| Dashboards | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ PASS / ⬜ FAIL

**Signature**: _______________

---

## 🚨 TROUBLESHOOTING

### Issue: Backup buttons still disabled
**Check**: Apakah frontend sudah di-rebuild?
**Fix**: `cd frontend && npm run build && npm run dev`

### Issue: SQL error masih muncul
**Check**: Apakah backend sudah di-restart?
**Fix**: Stop server (Ctrl+C), start ulang: `npm run dev:full`

### Issue: Edit absen tidak save
**Check**: Database query di `server_modern.js` (line 5457-5479)
**Verify**: Should use `absensi_guru_jadwal`, not `absensi_guru`

### Issue: Dashboard stats incorrect
**Check**: Query di `server_modern.js` (lines 794-906)
**Verify**: Should use UNION ALL from both tables

---

**Guide Created**: 21 Oktober 2025  
**Version**: 1.0 (Post All Fixes)  
**Estimated Time**: 15-20 minutes total


