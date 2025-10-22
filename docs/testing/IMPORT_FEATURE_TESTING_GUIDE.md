# 🧪 Panduan Testing - Fitur Import Excel/CSV

**Dibuat**: Oktober 2025  
**Status**: Ready for Testing  
**Version**: 1.0

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Testing Workflow](#testing-workflow)
4. [Endpoint Testing](#endpoint-testing)
5. [Test Cases](#test-cases)
6. [Expected Results](#expected-results)
7. [Troubleshooting](#troubleshooting)

---

## 📊 Overview

Fitur import Excel/CSV telah selesai diimplementasikan dengan fitur-fitur berikut:

### ✅ Features Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| **Backend Routes** | ✅ | Import endpoints untuk 5 entities |
| **Import Controllers** | ✅ | Excel parsing, validation, UPSERT logic |
| **Template Generation** | ✅ | Auto-generate Excel templates |
| **Validators** | ✅ | Row-by-row validation untuk semua entities |
| **Frontend UI** | ✅ | File upload, validation preview, error display |
| **Error Handling** | ✅ | Comprehensive error messages & filtering |
| **Security** | ✅ | Rate limiting, filename sanitization, temp cleanup |

### 📦 Entities Supported

1. **Mapel** (Mata Pelajaran)
2. **Kelas** (Classes)
3. **Guru** (Teachers)
4. **Siswa** (Students)
5. **Jadwal** (Schedules)

---

## 🔧 Prerequisites

### 1. Server Setup

```bash
# Pastikan server berjalan
npm run dev

# Server harus running di http://localhost:3001
```

### 2. Authentication

- Login sebagai **ADMIN** untuk mendapatkan token JWT
- Simpan token untuk digunakan di requests

```bash
# Login endpoint
POST http://localhost:3001/api/login

# Body:
{
  "username": "admin",
  "password": "your_password"
}

# Response akan berisi:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 3. Testing Tools

Pilih salah satu:
- **Postman** (Recommended)
- **Thunder Client** (VS Code Extension)
- **Insomnia**
- **cURL** (Command line)

---

## 🔄 Testing Workflow

### Step 1: Download Template

```http
GET /api/admin/templates/{entityType}
```

**Example:**
```http
GET http://localhost:3001/api/admin/templates/mapel
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**: Excel file download (`template-mapel.xlsx`)

### Step 2: Fill Template

1. Open downloaded template
2. Read instructions in "Instruksi" sheet
3. Fill data in main sheet
4. Save file

### Step 3: Validate File (Dry Run)

```http
POST /api/admin/import/{entityType}?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- file: [your_filled_template.xlsx]
```

**Response:**
```json
{
  "success": true,
  "total": 10,
  "valid": 8,
  "invalid": 2,
  "errors": [
    {
      "index": 3,
      "errors": ["Kode Mapel wajib diisi"]
    },
    {
      "index": 5,
      "errors": ["Nama Mapel maksimal 100 karakter"]
    }
  ]
}
```

### Step 4: Fix Errors & Import

1. Fix errors in Excel file
2. Run validation again (optional)
3. Import data:

```http
POST /api/admin/import/{entityType}
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body:
- file: [your_fixed_template.xlsx]
```

**Response:**
```json
{
  "success": true,
  "total": 10,
  "processed": 10,
  "inserted": 7,
  "updated": 3,
  "errors": []
}
```

---

## 📝 Endpoint Testing

### 1. Template Generation Endpoints

#### 1.1 GET Mapel Template

```http
GET http://localhost:3001/api/admin/templates/mapel
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: Download `template_import_mapel.xlsx`

#### 1.2 GET Kelas Template

```http
GET http://localhost:3001/api/admin/templates/kelas
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: Download `template_import_kelas.xlsx`

#### 1.3 GET Guru Template

```http
GET http://localhost:3001/api/admin/templates/guru
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: Download `template_import_guru.xlsx`

#### 1.4 GET Siswa Template

```http
GET http://localhost:3001/api/admin/templates/siswa
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: Download `template_import_siswa.xlsx`

#### 1.5 GET Jadwal Template

```http
GET http://localhost:3001/api/admin/templates/jadwal
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected**: Download `template_import_jadwal.xlsx`

---

### 2. Import Endpoints (Dry Run)

#### 2.1 Validate Mapel Import

```http
POST http://localhost:3001/api/admin/import/mapel?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your Excel file]
```

**Expected Response:**
```json
{
  "success": true,
  "total": 5,
  "valid": 5,
  "invalid": 0,
  "errors": []
}
```

#### 2.2 Validate Kelas Import

```http
POST http://localhost:3001/api/admin/import/kelas?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your Excel file]
```

#### 2.3 Validate Guru Import

```http
POST http://localhost:3001/api/admin/import/guru?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your Excel file]
```

#### 2.4 Validate Siswa Import

```http
POST http://localhost:3001/api/admin/import/siswa?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your Excel file]
```

#### 2.5 Validate Jadwal Import

```http
POST http://localhost:3001/api/admin/import/jadwal?dryRun=true
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your Excel file]
```

---

### 3. Import Endpoints (Actual Import)

#### 3.1 Import Mapel

```http
POST http://localhost:3001/api/admin/import/mapel
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your validated Excel file]
```

**Expected Response:**
```json
{
  "success": true,
  "total": 5,
  "processed": 5,
  "inserted": 3,
  "updated": 2,
  "errors": []
}
```

#### 3.2 Import Kelas

```http
POST http://localhost:3001/api/admin/import/kelas
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your validated Excel file]
```

#### 3.3 Import Guru

```http
POST http://localhost:3001/api/admin/import/guru
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your validated Excel file]
```

#### 3.4 Import Siswa

```http
POST http://localhost:3001/api/admin/import/siswa
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your validated Excel file]
```

#### 3.5 Import Jadwal

```http
POST http://localhost:3001/api/admin/import/jadwal
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN

Body (form-data):
- file: [select your validated Excel file]
```

---

## 🧪 Test Cases

### Test Case 1: Valid Data Import

**Objective**: Import file dengan semua data valid

**Steps**:
1. Download template Mapel
2. Fill with valid data:
   ```
   kode_mapel | nama_mapel       | deskripsi                    | status
   MTK-01     | Matematika       | Mata pelajaran Matematika    | aktif
   BING-01    | Bahasa Inggris   | Mata pelajaran Bahasa        | aktif
   ```
3. Upload file (dry run)
4. Verify `valid = 2, invalid = 0`
5. Upload file (actual import)
6. Verify database has 2 new records

**Expected Result**: ✅ Import berhasil, 2 rows inserted

---

### Test Case 2: Duplicate Data (UPSERT)

**Objective**: Import file dengan data yang sudah ada (should UPDATE)

**Steps**:
1. Import data pertama kali (insert)
2. Modify same data in Excel
3. Import again
4. Verify data is updated, not duplicated

**Expected Result**: ✅ Import berhasil, data di-update (not duplicate)

---

### Test Case 3: Mixed Valid/Invalid Data

**Objective**: Import file dengan data valid dan invalid

**Steps**:
1. Fill template with mixed data:
   ```
   kode_mapel | nama_mapel       | deskripsi | status
   MTK-01     | Matematika       | Valid     | aktif
              | (kosong)         | Invalid   | aktif   ❌ kode wajib diisi
   IPA-01     | A very long name that exceeds 100 characters... | Invalid ❌
   BING-01    | Bahasa Inggris   | Valid     | aktif
   ```
2. Upload (dry run)
3. Verify errors detected: `valid = 2, invalid = 2`
4. Check error details

**Expected Result**: ⚠️ Validation failed, errors listed correctly

---

### Test Case 4: File Type Validation

**Objective**: Test file type restrictions

**Steps**:
1. Try uploading `.pdf` file
2. Try uploading `.doc` file
3. Try uploading `.txt` file

**Expected Result**: ❌ All rejected with error "Invalid file type"

---

### Test Case 5: File Size Limit

**Objective**: Test file size restrictions (max 10MB)

**Steps**:
1. Create Excel file > 10MB
2. Try uploading

**Expected Result**: ❌ Rejected with error "File too large"

---

### Test Case 6: Rate Limiting

**Objective**: Test rate limiting (max 10 uploads per 15 minutes)

**Steps**:
1. Upload file 11 times rapidly
2. Check 11th request response

**Expected Result**: ❌ 11th request blocked with 429 error

---

### Test Case 7: CSV Format Support

**Objective**: Test CSV file import

**Steps**:
1. Export template to CSV
2. Fill data in CSV
3. Upload CSV file

**Expected Result**: ✅ Import berhasil from CSV

---

### Test Case 8: Guru Import with User Creation

**Objective**: Test auto-create user accounts for Guru

**Steps**:
1. Fill Guru template with `username` and `password`
2. Import file
3. Verify guru record created
4. Verify user account created
5. Try logging in with username/password

**Expected Result**: ✅ Guru and User account created, login successful

---

### Test Case 9: Siswa Import with User Creation

**Objective**: Test auto-create user accounts for Siswa

**Steps**:
1. Fill Siswa template with `username` and `password`
2. Import file
3. Verify siswa record created
4. Verify user account created (role = 'SISWA')
5. Try logging in

**Expected Result**: ✅ Siswa and User account created, login successful

---

### Test Case 10: Foreign Key Validation

**Objective**: Test referential integrity (Jadwal requires valid kelas_id, mapel_id, guru_id)

**Steps**:
1. Fill Jadwal template with:
   - Valid kelas_id (exists)
   - Invalid mapel_id (doesn't exist)
   - Valid guru_id (exists)
2. Upload

**Expected Result**: ❌ Validation error: "Mapel ID tidak valid"

---

## ✅ Expected Results Summary

### Success Cases

| Test Case | Expected Status | Expected Message |
|-----------|----------------|------------------|
| Valid Data | ✅ 200 OK | "Berhasil memproses X baris data" |
| UPSERT | ✅ 200 OK | "X ditambahkan, Y diperbarui" |
| Dry Run | ✅ 200 OK | "Dry run validation complete" |
| CSV Import | ✅ 200 OK | "Data berhasil diimpor" |
| User Creation | ✅ 200 OK | "Data berhasil diimpor" (check DB) |

### Error Cases

| Test Case | Expected Status | Expected Message |
|-----------|----------------|------------------|
| Invalid Data | ❌ 400 Bad Request | "Terdapat data invalid" + error list |
| Wrong File Type | ❌ 400 Bad Request | "Invalid file type" |
| File Too Large | ❌ 400 Bad Request | "File too large" |
| Rate Limit | ❌ 429 Too Many Requests | "Terlalu banyak permintaan" |
| Missing Auth | ❌ 401 Unauthorized | "Token tidak valid" |
| Wrong Role | ❌ 403 Forbidden | "Akses ditolak" |

---

## 🔍 Verification Checklist

Setelah testing, verify:

### Backend
- [ ] All 5 template endpoints working
- [ ] All 5 import endpoints working (dry run)
- [ ] All 5 import endpoints working (actual import)
- [ ] Rate limiting active (10 per 15 min)
- [ ] File validation working (.xlsx, .xls, .csv only)
- [ ] File size limit working (10MB max)
- [ ] Temp files cleaned up (check `./uploads/temp/`)
- [ ] Transaction rollback on error
- [ ] UPSERT logic working (insert if new, update if exists)

### Frontend
- [ ] File upload UI working
- [ ] Multiple file type support (.xlsx, .xls, .csv)
- [ ] Validation preview working
- [ ] Error display working (with filter & search)
- [ ] Import button enabled only when valid
- [ ] Success/error toasts showing
- [ ] File input reset after successful import

### Database
- [ ] No duplicate records (UPSERT working)
- [ ] Foreign keys respected
- [ ] User accounts created for Guru/Siswa (when username provided)
- [ ] Passwords hashed correctly
- [ ] No orphaned data (transaction integrity)

---

## 🐛 Troubleshooting

### Problem: "Token tidak valid"

**Solution**:
1. Re-login to get fresh token
2. Check token expiry (24h default)
3. Verify token format in Authorization header: `Bearer YOUR_TOKEN`

---

### Problem: "File too large"

**Solution**:
1. Check file size (max 10MB)
2. Remove unnecessary rows/columns
3. Save as `.xlsx` (smaller than `.xls`)

---

### Problem: "Rate limit exceeded"

**Solution**:
1. Wait 15 minutes
2. Reduce upload frequency
3. For development: temporarily increase limit in `backend/routes/import.js`

---

### Problem: Import hangs/timeout

**Solution**:
1. Check file size (large files take longer)
2. Check server console for errors
3. Verify database connection
4. Check transaction locks

---

### Problem: "UPSERT tidak working"

**Solution**:
1. Verify unique key in data (e.g., `kode_mapel`, `nis`, `nip`)
2. Check controller UPSERT logic
3. Verify database constraints

---

## 📊 Test Results Template

Use this template to document your test results:

```markdown
# Import Feature Test Results

**Tester**: [Your Name]
**Date**: [Date]
**Environment**: Development

## Template Generation Tests

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /templates/mapel | ✅/❌ | |
| GET /templates/kelas | ✅/❌ | |
| GET /templates/guru | ✅/❌ | |
| GET /templates/siswa | ✅/❌ | |
| GET /templates/jadwal | ✅/❌ | |

## Import Validation Tests (Dry Run)

| Entity | Status | Valid | Invalid | Notes |
|--------|--------|-------|---------|-------|
| Mapel | ✅/❌ | X | Y | |
| Kelas | ✅/❌ | X | Y | |
| Guru | ✅/❌ | X | Y | |
| Siswa | ✅/❌ | X | Y | |
| Jadwal | ✅/❌ | X | Y | |

## Import Tests (Actual)

| Entity | Status | Inserted | Updated | Notes |
|--------|--------|----------|---------|-------|
| Mapel | ✅/❌ | X | Y | |
| Kelas | ✅/❌ | X | Y | |
| Guru | ✅/❌ | X | Y | |
| Siswa | ✅/❌ | X | Y | |
| Jadwal | ✅/❌ | X | Y | |

## Security Tests

| Test | Status | Notes |
|------|--------|-------|
| Rate Limiting | ✅/❌ | |
| File Type Validation | ✅/❌ | |
| File Size Limit | ✅/❌ | |
| Filename Sanitization | ✅/❌ | |
| Temp File Cleanup | ✅/❌ | |

## Issues Found

1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Overall Assessment

- ✅ **PASS** / ❌ **FAIL**
- **Coverage**: X%
- **Bugs Found**: X
- **Ready for Production**: Yes/No
```

---

## 🎯 Next Steps

After completing all tests:

1. ✅ Document test results
2. ✅ Fix any bugs found
3. ✅ Re-test failed cases
4. ✅ Update documentation
5. ✅ Deploy to staging
6. ✅ Conduct UAT (User Acceptance Testing)
7. ✅ Deploy to production

---

## 📚 Related Documentation

- `perbaikan-fitur-import.plan.md` - Import feature implementation plan
- `backend/routes/import.js` - Import routes
- `backend/controllers/importController.js` - Import logic
- `backend/routes/templates.js` - Template generation
- `frontend/src/components/ExcelImportView.tsx` - Frontend UI

---

**Last Updated**: Oktober 2025  
**Status**: Ready for Testing  
**Version**: 1.0


