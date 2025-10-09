# TODO 01 - Fix Error 413 Payload Too Large (Backend)

## Prioritas: CRITICAL
## Estimasi: 1-2 jam

## Kasus yang Terjadi

Error 413 Payload Too Large saat save konfigurasi KOP laporan di endpoint PUT /api/admin/letterhead/global. Server menolak request karena payload terlalu besar.

**Root Cause:**
Express body parser memiliki default limit 100kb yang SANGAT KECIL untuk handle base64 encoded image. Saat admin upload logo dengan ukuran 500KB-2MB, setelah di-convert ke base64 ukurannya menjadi ~33% lebih besar (misal 2MB jadi 2.6MB base64). Server langsung reject dengan 413.

**Mengapa Return HTML bukan JSON?**
Ketika payload terlalu besar, Express middleware body parser gagal parse request body, sehingga request tidak sampai ke route handler kita. Error 413 di-handle oleh Express default error handler yang mengembalikan HTML error page, bukan JSON. Frontend expect JSON response, sehingga saat parsing muncul error "Unexpected token '<', <!DOCTYPE ... is not valid JSON".

**Impact:** Admin tidak bisa save konfigurasi KOP laporan sama sekali jika upload logo > 100kb.

## Penjelasan Solusi

Perbaikan di backend untuk handle large payload:
1. Increase body parser limit di Express config ke ukuran yang cukup untuk base64 image
2. Tambah validation ukuran file maksimal yang diizinkan
3. Implement image compression untuk optimize ukuran sebelum save ke database
4. Fix error response agar selalu return JSON bukan HTML
5. Add proper error handling dan logging

### To-dos

- [ ] Update express.json() limit ke 10mb di server_modern.js
- [ ] Update express.urlencoded() limit ke 10mb di server_modern.js
- [ ] Install package sharp untuk server-side image compression
- [ ] Buat function compressImage() di backend/utils untuk compress base64 image
- [ ] Update endpoint PUT /api/admin/letterhead/global tambah validation ukuran max 5MB
- [ ] Implement compression pada logo sebelum save ke database
- [ ] Fix error handler untuk return JSON response bukan HTML saat 413 error
- [ ] Tambah try-catch proper di endpoint letterhead dengan error message jelas
- [ ] Add logging untuk track ukuran payload yang di-upload
- [ ] Test endpoint dengan upload logo berbagai ukuran (500KB, 2MB, 5MB)
