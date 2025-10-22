# 🧪 Panduan Testing - Export Jadwal SMKN 13

**Date**: 22 Oktober 2025  
**Status**: ✅ Ready for Testing  
**Version**: 1.0

---

## 📋 Daftar Isi

1. [Persiapan Testing](#persiapan-testing)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [User Acceptance Testing](#user-acceptance-testing)
6. [Performance Testing](#performance-testing)
7. [Bug Report Template](#bug-report-template)

---

## 🔧 Persiapan Testing

### Prerequisites

✅ **Database**:
- Database `absenta13` ter-install dan berjalan
- Data dummy untuk `kelas`, `jadwal`, `mapel`, `guru` sudah ada
- Data `jadwal_khusus` untuk event khusus (opsional)

✅ **Backend**:
- Node.js ≥ 18.0.0
- Dependencies ter-install (`npm install`)
- Server berjalan di `http://localhost:3001`

✅ **Frontend**:
- Dependencies ter-install
- Frontend berjalan di `http://localhost:5173`

✅ **User Accounts**:
- Admin account tersedia (e.g., `admin123`)
- Guru account tersedia (e.g., `guru001`)

### Start Services

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

---

## 🔙 Backend Testing

### Test 1: Endpoint Availability

**Endpoint**: `GET /api/export/jadwal-smkn13/excel`

**Test Steps**:
1. Buka Postman atau Thunder Client
2. Create new GET request
3. URL: `http://localhost:3001/api/export/jadwal-smkn13/excel`
4. Headers:
   ```
   Authorization: Bearer <your_jwt_token>
   ```
5. Send request

**Expected Result**:
```
Status: 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Jadwal_SMKN13_2025-10-22.xlsx"

File Excel downloaded successfully
```

**Screenshot Location**: `screenshots/backend-test-1-endpoint-availability.png`

---

### Test 2: Filter by Kelas

**Endpoint**: `GET /api/export/jadwal-smkn13/excel?kelas_id=1`

**Test Steps**:
1. Get list kelas IDs dari database:
   ```sql
   SELECT id_kelas, nama_kelas FROM kelas LIMIT 5;
   ```
2. Pick one `kelas_id` (e.g., `1`)
3. Send GET request with query parameter:
   ```
   http://localhost:3001/api/export/jadwal-smkn13/excel?kelas_id=1
   ```

**Expected Result**:
- Excel file contains only schedules for the selected class
- File size smaller than "all classes" export

**Verification**:
```bash
# Check file size
ls -lh Jadwal_SMKN13_*.xlsx

# Open file in Excel and verify only 1 class
```

---

### Test 3: Empty Data Handling

**Test Steps**:
1. Create temporary kelas with no schedules:
   ```sql
   INSERT INTO kelas (nama_kelas, tingkat, status) 
   VALUES ('Test Empty', 'X', 'aktif');
   ```
2. Get the new `kelas_id`
3. Export with that `kelas_id`

**Expected Result**:
- Excel file still generates
- Header rows present
- No data rows (only kelas name in column A)
- No errors in console

---

### Test 4: Error Handling

**Test Scenario A: Invalid kelas_id**
```bash
GET /api/export/jadwal-smkn13/excel?kelas_id=99999
```

**Expected Result**:
```json
{
  "success": false,
  "error": "Kelas tidak ditemukan",
  "message": "Kelas dengan ID 99999 tidak ditemukan"
}
```

**Test Scenario B: Missing Token**
```bash
GET /api/export/jadwal-smkn13/excel
# (without Authorization header)
```

**Expected Result**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token tidak valid atau sudah expired"
}
```

---

### Test 5: Letterhead Integration

**Test Steps**:
1. Check if letterhead config exists:
   ```sql
   SELECT * FROM system_config 
   WHERE config_key = 'letterhead_jadwal-smkn13';
   ```

2. **Case A**: Config exists
   - Export should use custom letterhead
   - Verify logo URLs in Excel

3. **Case B**: Config doesn't exist
   - Export should use default letterhead
   - Console log: `⚠️ No custom letterhead for jadwal-smkn13`

**Expected Default Letterhead**:
```
PEMERINTAH PROVINSI DKI JAKARTA
DINAS PENDIDIKAN
SMK NEGERI 13 JAKARTA
Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910
Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id
```

---

## 🎨 Frontend Testing

### Test 6: Button Visibility

**Test Steps**:
1. Login sebagai Admin
2. Navigate to: **Jadwal** → **Jadwal Global View**
3. Verify UI elements

**Checklist**:
- [ ] Filter "Kelas" dropdown visible
- [ ] Filter "Guru" dropdown visible
- [ ] Filter "Hari" dropdown visible
- [ ] Button "Excel" visible
- [ ] Button "PDF" visible
- [ ] **Button "Export SMKN 13" visible** ✨

**Screenshot**: `screenshots/frontend-test-6-button-visibility.png`

---

### Test 7: Click Export SMKN 13 Button

**Test Steps**:
1. Di halaman Jadwal Global View
2. Select filter (opsional):
   - Kelas: `X KA 1`
3. Click button **"Export SMKN 13"**

**Expected Behavior**:
1. Button disabled sementara (loading state)
2. Toast notification muncul:
   ```
   Title: "Berhasil"
   Message: "Jadwal SMKN 13 berhasil diekspor ke Excel"
   Type: Success (green)
   ```
3. File Excel auto-download:
   - Filename: `Jadwal_SMKN13_2025-10-22.xlsx`
   - Location: Downloads folder
4. Button enabled kembali setelah download selesai

**Screenshot**: `screenshots/frontend-test-7-export-success.png`

---

### Test 8: Error Handling in Frontend

**Test Scenario**: Server offline

**Test Steps**:
1. Stop backend server: `Ctrl+C`
2. Di frontend, click "Export SMKN 13"

**Expected Behavior**:
1. Toast notification muncul:
   ```
   Title: "Error"
   Message: "Gagal mengekspor jadwal SMKN 13 ke Excel"
   Type: Destructive (red)
   ```
2. Console error log:
   ```
   Error exporting SMKN 13 Excel: Failed to fetch
   ```

**Screenshot**: `screenshots/frontend-test-8-error-handling.png`

---

## 📊 Integration Testing

### Test 9: End-to-End Flow

**Complete User Journey**:

1. **Login as Admin**
   - URL: `http://localhost:5173/login`
   - Username: `admin123`
   - Password: `admin123`
   - Expected: Redirect to Admin Dashboard

2. **Navigate to Jadwal Global**
   - Click menu: **Jadwal** → **Jadwal Global View**
   - Expected: Page loads dengan filter dan grid

3. **Apply Filters**
   - Select Kelas: `X KA 1`
   - Select Hari: `Senin`
   - Expected: Grid updates dengan filtered schedules

4. **Export SMKN 13**
   - Click button "Export SMKN 13"
   - Expected: File downloads

5. **Verify Excel File**
   - Open downloaded file in Microsoft Excel
   - Verify structure:
     - ✅ Row 1: HARI headers (SENIN, SELASA, RABU, KAMIS, JUMAT)
     - ✅ Row 2: JAM KE (1, 2, 3, ..., 12)
     - ✅ Row 3: WAKTU (06.30 - 07.15, etc)
     - ✅ Row 4: Optional labels
     - ✅ Row 5+: Data kelas (3 rows per kelas)
   - Verify data:
     - ✅ Column A: Nama kelas (merged 3 rows)
     - ✅ Row N: MAPEL data
     - ✅ Row N+1: RUANG data
     - ✅ Row N+2: GURU data

**Duration**: ~5 minutes per test

**Screenshot Checklist**:
- [ ] `screenshots/e2e-1-login.png`
- [ ] `screenshots/e2e-2-navigation.png`
- [ ] `screenshots/e2e-3-filters.png`
- [ ] `screenshots/e2e-4-export-button.png`
- [ ] `screenshots/e2e-5-excel-structure.png`
- [ ] `screenshots/e2e-6-excel-data.png`

---

### Test 10: Multi-Class Export

**Test Steps**:
1. Select Filter Kelas: **"Semua Kelas"**
2. Click "Export SMKN 13"
3. Open Excel file

**Expected Result**:
- All classes included
- Classes sorted by `tingkat` and `nama_kelas`
- Each class has 3 rows (MAPEL, RUANG, GURU)
- No gaps between classes

**Verification SQL**:
```sql
-- Check how many classes should be in export
SELECT COUNT(*) as total_kelas 
FROM kelas 
WHERE status = 'aktif';

-- Expected rows in Excel = (total_kelas × 3) + 4 header rows
```

---

### Test 11: Special Events Handling

**Test Steps**:
1. Ensure `jadwal_khusus` data exists:
   ```sql
   SELECT * FROM jadwal_khusus WHERE status = 'aktif' LIMIT 5;
   ```
2. Export jadwal
3. Open Excel file

**Expected Result**:
- Special events visible (e.g., ISTIRAHAT, UPACARA, PERWALIAN)
- Special events have correct colors:
  - `ISTIRAHAT`: Pink (`#FF69B4`)
  - `UPACARA`: Yellow (`#FFFF00`)
  - `PERWALIAN`: Yellow (`#FFFF00`)
  - `DZUHUR`: Pink (`#FF69B4`)
  - `BPBK`: Orange (`#FFA500`)
- Special events merged across 3 rows

**Screenshot**: `screenshots/test-11-special-events.png`

---

## 👥 User Acceptance Testing (UAT)

### Test 12: Stakeholder Review

**Participants**:
- Admin staff
- School administrator
- IT staff

**Test Checklist**:

✅ **Usability**:
- [ ] Button mudah ditemukan
- [ ] Label button jelas ("Export SMKN 13")
- [ ] Proses export intuitif
- [ ] Feedback (toast) jelas dan informatif

✅ **Functionality**:
- [ ] Export berhasil untuk semua kelas
- [ ] Export berhasil untuk kelas individual
- [ ] File Excel bisa dibuka di Microsoft Excel
- [ ] File Excel bisa dibuka di Google Sheets
- [ ] File Excel bisa dibuka di LibreOffice Calc

✅ **Data Accuracy**:
- [ ] Nama kelas sesuai
- [ ] Nama mapel sesuai
- [ ] Nama guru sesuai
- [ ] Ruang kelas sesuai
- [ ] Hari dan jam sesuai

✅ **Format Compliance**:
- [ ] Format sesuai standar SMKN 13
- [ ] Color coding sesuai
- [ ] Layout sesuai dengan foto referensi

---

### Test 13: Format Verification Checklist

**Visual Comparison dengan Foto Referensi**:

| Element | Expected | Actual | ✓/✗ |
|---------|----------|--------|-----|
| **Header Structure** |
| Row 1: HARI labels | Merged per day (12 columns) | | |
| Row 2: JAM KE | 1, 2, 3, ..., 12 | | |
| Row 3: WAKTU | 06.30 - 07.15 format | | |
| Row 4: Labels | Empty or optional | | |
| **Data Structure** |
| 1 kelas = 3 rows | Row N, N+1, N+2 | | |
| Column A | Kelas name (merged) | | |
| Row N | MAPEL data | | |
| Row N+1 | RUANG data | | |
| Row N+2 | GURU data | | |
| **Colors** |
| ISTIRAHAT | Pink (#FF69B4) | | |
| UPACARA | Yellow (#FFFF00) | | |
| Regular subjects | Pastel colors | | |
| **Dimensions** |
| Column A width | 18 characters | | |
| Jam columns width | 10 characters | | |
| Header row height | 20-28 pixels | | |
| Data row height | 18 pixels | | |

---

## ⚡ Performance Testing

### Test 14: Load Testing

**Tool**: Apache Bench (ab) atau Artillery

**Test Scenario 1: Single User**
```bash
ab -n 10 -c 1 \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/export/jadwal-smkn13/excel
```

**Expected**:
- ✅ All requests successful (200 OK)
- ✅ Average response time < 2 seconds
- ✅ No memory leaks

**Test Scenario 2: Concurrent Users**
```bash
ab -n 50 -c 10 \
  -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/export/jadwal-smkn13/excel
```

**Expected**:
- ✅ All requests successful (200 OK)
- ✅ Average response time < 5 seconds
- ✅ Server stable (no crashes)

---

### Test 15: File Size Testing

**Test Steps**:
1. Export with different filters:
   - All classes
   - Single class
   - 5 classes
   - 10 classes

2. Measure file sizes:
   ```bash
   ls -lh Jadwal_SMKN13_*.xlsx
   ```

**Expected File Sizes**:
| Classes | Expected Size | Actual Size | ✓/✗ |
|---------|---------------|-------------|-----|
| 1 class | ~15-20 KB | | |
| 5 classes | ~30-50 KB | | |
| 10 classes | ~60-100 KB | | |
| All (30+) | ~150-300 KB | | |

**Performance Criteria**:
- ✅ File size reasonable (< 1 MB for all classes)
- ✅ Export time < 3 seconds for all classes
- ✅ No memory issues during export

---

## 🐛 Bug Report Template

### Bug Report Format

```markdown
## Bug ID: BUG-SMKN13-001

### Title
[Short descriptive title]

### Severity
- [ ] Critical (blocks testing)
- [ ] High (major functionality broken)
- [ ] Medium (workaround available)
- [ ] Low (cosmetic issue)

### Environment
- Browser: [Chrome 118 / Firefox 120 / etc]
- OS: [Windows 11 / macOS 14 / Ubuntu 22.04]
- Backend Version: [commit hash]
- Frontend Version: [commit hash]

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[Attach screenshots if available]

### Console Errors
[Paste console errors if any]

### Additional Context
[Any other relevant information]
```

---

## ✅ Testing Completion Checklist

### Backend Tests
- [ ] Test 1: Endpoint Availability
- [ ] Test 2: Filter by Kelas
- [ ] Test 3: Empty Data Handling
- [ ] Test 4: Error Handling
- [ ] Test 5: Letterhead Integration

### Frontend Tests
- [ ] Test 6: Button Visibility
- [ ] Test 7: Click Export Button
- [ ] Test 8: Error Handling in Frontend

### Integration Tests
- [ ] Test 9: End-to-End Flow
- [ ] Test 10: Multi-Class Export
- [ ] Test 11: Special Events Handling

### UAT
- [ ] Test 12: Stakeholder Review
- [ ] Test 13: Format Verification

### Performance Tests
- [ ] Test 14: Load Testing
- [ ] Test 15: File Size Testing

---

## 📝 Test Results Summary

**Date**: ______________  
**Tester**: ______________  
**Version**: 1.0

| Test ID | Test Name | Result | Notes |
|---------|-----------|--------|-------|
| Test 1 | Endpoint Availability | ⏳ Pending | |
| Test 2 | Filter by Kelas | ⏳ Pending | |
| Test 3 | Empty Data Handling | ⏳ Pending | |
| Test 4 | Error Handling | ⏳ Pending | |
| Test 5 | Letterhead Integration | ⏳ Pending | |
| Test 6 | Button Visibility | ⏳ Pending | |
| Test 7 | Click Export Button | ⏳ Pending | |
| Test 8 | Error Handling Frontend | ⏳ Pending | |
| Test 9 | End-to-End Flow | ⏳ Pending | |
| Test 10 | Multi-Class Export | ⏳ Pending | |
| Test 11 | Special Events | ⏳ Pending | |
| Test 12 | Stakeholder Review | ⏳ Pending | |
| Test 13 | Format Verification | ⏳ Pending | |
| Test 14 | Load Testing | ⏳ Pending | |
| Test 15 | File Size Testing | ⏳ Pending | |

**Overall Status**: ⏳ Testing in Progress

**Sign-off**:
- Tester: _________________ Date: _________
- Reviewer: _______________ Date: _________
- Product Owner: __________ Date: _________

---

## 🎯 Quick Testing Commands

**Start All Services**:
```bash
# Backend
npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

**Quick Smoke Test**:
```bash
# Test endpoint directly
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/export/jadwal-smkn13/excel \
  --output test-export.xlsx
```

**Check Logs**:
```bash
# Backend logs
tail -f logs/application.log

# Error logs
tail -f logs/error.log
```

---

**Last Updated**: 22 Oktober 2025  
**Status**: ✅ Ready for Testing  
**Next Review**: After UAT completion

