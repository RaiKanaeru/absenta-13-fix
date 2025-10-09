# TODO Fix Error Production - Index

## Error Log Summary

### 1. Error 413 Payload Too Large
```
PUT http://localhost:8080/api/admin/letterhead/global 413 (Payload Too Large)
Error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### 2. Error 500 Internal Server Error
```
GET http://localhost:3001/api/siswa/821/pengajuan-izin 500 (Internal Server Error)
GET http://localhost:3001/api/siswa/821/jadwal-rentang?tanggal=2025-10-04 500 (Internal Server Error)
GET http://localhost:3001/api/siswa/821/jadwal-rentang?tanggal=2025-10-03 500 (Internal Server Error)
GET http://localhost:3001/api/siswa/821/jadwal-rentang?tanggal=2025-10-01 500 (Internal Server Error)
GET http://localhost:3001/api/siswa/821/jadwal-rentang?tanggal=2025-10-02 500 (Internal Server Error)
```

### 3. Infinite Re-render Loop
```
Index_Modern.tsx:29 🚀 ABSENTA Modern App Starting... (berulang-ulang)
Index_Modern.tsx:299 🎯 Rendering dashboard for role: siswa (berulang-ulang)
```

### 4. React Warning
```
Warning: Each child in a list should have a unique "key" prop.
at renderBandingAbsenContent (StudentDashboard_Modern.tsx:2335)
```

## Root Cause Analysis

1. **Express body parser limit terlalu kecil** - Default 100kb tidak cukup untuk base64 image
2. **Tidak ada validation di frontend** - User bisa upload file besar tanpa warning
3. **Tidak ada compression** - Image langsung di-upload tanpa optimize
4. **Error response HTML bukan JSON** - Menyebabkan parsing error di frontend
5. **Tidak ada user feedback** - User tidak tahu kenapa upload gagal

## Daftar File TODO

1. **todo-01-error-413-backend.md** (CRITICAL) - Fix backend body parser limit dan compression
2. **todo-02-error-413-frontend.md** (CRITICAL) - Fix frontend validation dan compression
3. **todo-03-testing-error-413.md** (HIGH) - Testing dan verification fix
4. **todo-04-infinite-rerender-404.md** (CRITICAL) - Fix infinite re-render StudentDashboard dan 404 endpoint
5. **todo-05-error-500-endpoints.md** (CRITICAL) - Fix error 500 di endpoint pengajuan-izin dan jadwal-rentang

## Solution Summary

### Backend Fixes (TODO-01)
- Increase body parser limit ke 10mb
- Install sharp untuk server-side compression
- Add validation ukuran file max 5MB
- Fix error response return JSON bukan HTML
- Add proper error handling dan logging

### Frontend Fixes (TODO-02)
- Install browser-image-compression
- Add client-side validation dan compression
- Fix error handling untuk parse response
- Add loading indicator dan user feedback
- Show preview ukuran file sebelum/sesudah compress

### Testing (TODO-03)
- Test berbagai ukuran file (kecil, sedang, besar)
- Test berbagai format image (PNG, JPG, WEBP)
- Verify quality compression
- Test error handling edge cases
- Verify UX improvement

## Priority Order

1. ⚠️ **CRITICAL**: Backend fixes (TODO-01) - 1-2 jam
2. ⚠️ **CRITICAL**: Frontend fixes (TODO-02) - 1-2 jam
3. ⚠️ **CRITICAL**: Infinite re-render & 404 (TODO-04) - 2-3 jam
4. ⚠️ **CRITICAL**: Error 500 endpoints (TODO-05) - 2-3 jam
5. 🔴 **HIGH**: Testing & verification (TODO-03) - 30 menit - 1 jam

## Total TODO Items: 50

- Backend body parser: 10 items (TODO-01)
- Frontend validation: 10 items (TODO-02)
- Testing: 10 items (TODO-03)
- Re-render fixes: 10 items (TODO-04)
- Endpoint fixes: 10 items (TODO-05)

**Total Estimasi: 7-11 jam**

## Expected Outcome

✅ Upload logo sampai 5MB tanpa error 413
✅ Image otomatis di-compress untuk optimize size
✅ Error message user-friendly dan jelas
✅ Loading indicator saat processing
✅ Quality image tetap bagus setelah compression
✅ Better UX dengan validation dan feedback
