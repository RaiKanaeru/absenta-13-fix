# Endpoint Testing Guide - Updated Schema

## 📋 Overview

Panduan lengkap untuk testing endpoints POST, PUT, DELETE yang telah diupdate untuk sistem Users-Siswa normalization.

## 🚀 Prerequisites

### 1. Server Running
Pastikan server backend berjalan di port 3001:
```bash
# Jalankan server
node server_modern.js

# Atau dengan PM2
pm2 start server_modern.js --name absenta-backend

# Check status
pm2 status
```

### 2. Database Ready
Pastikan migration sudah dijalankan:
```bash
# Validate migration
node database/scripts/validate-users-siswa-migration.js

# Check hasil validation harus PASSED
```

### 3. Test Dependencies
Install dependencies jika belum:
```bash
npm install node-fetch --save-dev
```

## 🧪 Running Tests

### Run Complete Test Suite
```bash
# Run all CRUD tests
node tests/api/test-siswa-crud-updated.js
```

### Expected Output
```
╔════════════════════════════════════════════════════════════╗
║   SISWA CRUD ENDPOINTS TEST SUITE (Updated Schema)        ║
╚════════════════════════════════════════════════════════════╝

🔐 Logging in as admin...
✅ Logged in successfully as admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 TEST 1: POST /api/admin/siswa - Create Student
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Validation Results:
   ✅ Response status 200
   ✅ Success flag is true
   ✅ User ID returned
   ✅ Username returned
   ✅ Default password returned

🎉 TEST 1: PASSED

... (more tests)

╔════════════════════════════════════════════════════════════╗
║                     FINAL TEST SUMMARY                     ║
╚════════════════════════════════════════════════════════════╝

📊 Total Tests: 4
✅ Passed: 4
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 ALL TESTS PASSED! System is working correctly.
```

## 📝 Test Coverage

### Test 1: POST /api/admin/siswa - Create Student
**What it tests:**
- Creates new student with auto-generated user account
- Validates proper transaction handling
- Checks if user_id is returned
- Verifies username generation
- Confirms default password is returned

**Expected Behavior:**
```javascript
POST /api/admin/siswa
Body: {
  "nis": "2024001",
  "nama": "Test Siswa",
  "kelas_id": 1,
  "username": "test_siswa_2024001",
  "password": "test123",
  ...
}

Response: {
  "success": true,
  "message": "Siswa berhasil ditambahkan",
  "data": {
    "user_id": 123,
    "username": "test_siswa_2024001",
    "default_password": "test123",
    "message": "Password default: test123"
  }
}
```

**Validations:**
- ✅ Response status 200
- ✅ Success flag is true
- ✅ User ID returned
- ✅ Username returned
- ✅ Default password returned

### Test 2: PUT /api/admin/students/:id - Update Student
**What it tests:**
- Updates both users and siswa tables atomically
- Validates role verification (ensure SISWA)
- Checks username uniqueness
- Tests optional password update
- Verifies data persistence

**Expected Behavior:**
```javascript
PUT /api/admin/students/:id
Body: {
  "nis": "2024001",
  "nama": "Test Siswa (Updated)",
  "username": "test_siswa_2024001",
  "email": "updated@test.com",
  ...
}

Response: {
  "success": true,
  "message": "Akun siswa berhasil diupdate",
  "data": {
    "user_id": 123,
    "username": "test_siswa_2024001",
    "nis": "2024001"
  }
}
```

**Validations:**
- ✅ Response status 200
- ✅ Success flag is true
- ✅ Update message returned
- ✅ Student data found after update
- ✅ Nama was updated correctly

### Test 3: DELETE /api/admin/students/:id - Delete Student
**What it tests:**
- Smart delete strategy (deactivate vs hard delete)
- Checks for attendance records
- Verifies role validation
- Tests transaction handling
- Confirms proper cleanup

**Expected Behavior (No Attendance):**
```javascript
DELETE /api/admin/students/:id

Response: {
  "success": true,
  "message": "Akun siswa berhasil dihapus",
  "action": "deleted"
}
```

**Expected Behavior (Has Attendance):**
```javascript
DELETE /api/admin/students/:id

Response: {
  "success": true,
  "message": "Akun siswa dinonaktifkan (memiliki riwayat absensi)",
  "action": "deactivated"
}
```

**Validations:**
- ✅ Response status 200
- ✅ Success flag is true
- ✅ Action is "deleted" or "deactivated"
- ✅ Student not found after deletion (if deleted)
- ✅ Student status is "tidak_aktif" (if deactivated)

### Test 4: Validation Errors - Invalid Data
**What it tests:**
- Missing required fields rejection
- Duplicate username handling
- Invalid data format handling
- Proper error messages

**Test Cases:**
1. Missing NIS - Should return 400 error
2. Duplicate username - Should return 400 error
3. Invalid kelas_id - Should return 400 error

**Validations:**
- ✅ Missing NIS validation
- ✅ Duplicate username validation

## 🐛 Troubleshooting

### Issue 1: Server Not Running
**Error:**
```
Fatal Error: request to http://localhost:3001/api/login failed
```

**Solution:**
```bash
# Start server
node server_modern.js

# Or check if already running
netstat -an | findstr :3001
```

### Issue 2: Login Failed
**Error:**
```
Login failed: Invalid username or password
```

**Solution:**
Check admin credentials in database:
```sql
SELECT * FROM users WHERE username = 'admin';
```

Update test credentials if needed in `test-siswa-crud-updated.js`:
```javascript
adminCredentials: {
  username: 'admin',
  password: 'admin123' // Update this
}
```

### Issue 3: Migration Not Run
**Error:**
```
Users dengan role tidak sesuai: 78
```

**Solution:**
```bash
# Run migration
node database/scripts/fix-role-enum.js

# Validate
node database/scripts/validate-users-siswa-migration.js
```

### Issue 4: Duplicate Test Data
**Error:**
```
NIS atau username sudah digunakan
```

**Solution:**
Test uses timestamp-based unique identifiers. If this still happens, clean up test data:
```sql
-- Clean up test data
DELETE FROM siswa WHERE nis LIKE 'TEST%';
DELETE FROM users WHERE username LIKE 'test_siswa_%';
```

## 📊 Manual Testing with cURL

### 1. Login
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save the token from response
```

### 2. Create Student
```bash
curl -X POST http://localhost:3001/api/admin/siswa \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nis": "2024999",
    "nama": "Manual Test Student",
    "kelas_id": 1,
    "username": "manual_test_999",
    "password": "test123",
    "email": "manual@test.com",
    "jenis_kelamin": "L"
  }'
```

### 3. Update Student
```bash
curl -X PUT http://localhost:3001/api/admin/students/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nis": "2024999",
    "nama": "Manual Test Student (Updated)",
    "kelas_id": 1,
    "username": "manual_test_999",
    "email": "updated@test.com",
    "jenis_kelamin": "P"
  }'
```

### 4. Delete Student
```bash
curl -X DELETE http://localhost:3001/api/admin/students/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Validation Checklist

Before running tests, ensure:

- [ ] Server is running on port 3001
- [ ] Database migration completed successfully
- [ ] Validation script returns PASSED
- [ ] Admin account exists and password is correct
- [ ] At least one kelas exists in database
- [ ] Network connectivity is working
- [ ] No firewall blocking localhost:3001

## 📈 Performance Expectations

### Response Times
- POST /api/admin/siswa: < 500ms
- PUT /api/admin/students/:id: < 400ms
- DELETE /api/admin/students/:id: < 400ms

### Success Rates
- All tests should pass with 100% success rate
- Zero broken relationships after tests
- Zero data integrity issues

## 🔐 Security Testing

### Authentication Tests
- ✅ Requires valid JWT token
- ✅ Rejects invalid tokens
- ✅ Enforces role-based access (admin only)

### Data Validation Tests
- ✅ Validates required fields
- ✅ Sanitizes input data
- ✅ Prevents SQL injection
- ✅ Checks data types

### Transaction Tests
- ✅ Atomic operations (all or nothing)
- ✅ Proper rollback on errors
- ✅ Connection pool management

## 📚 Additional Resources

- **Migration Documentation**: `docs/implementation/OPSI2_IMPLEMENTATION_SUMMARY.md`
- **Validation Scripts**: `database/scripts/validate-users-siswa-migration.js`
- **API Documentation**: `docs/api/endpoints.md`
- **Database Schema**: `docs/database/schema.md`

## 🎯 Next Steps After Testing

1. **If All Tests Pass:**
   - ✅ Mark phase3-endpoints as completed
   - ✅ Move to phase4: Integration tests
   - ✅ Deploy to staging environment

2. **If Tests Fail:**
   - 🔍 Review error messages
   - 🐛 Debug failed endpoints
   - 🔧 Fix issues
   - 🔄 Re-run tests

## 📞 Support

If you encounter issues not covered in this guide:
1. Check server logs: `pm2 logs absenta-backend`
2. Check database connectivity
3. Review migration status
4. Check validation results

---

**Last Updated**: 21 Oktober 2025  
**Version**: 1.0  
**Status**: Ready for Testing


