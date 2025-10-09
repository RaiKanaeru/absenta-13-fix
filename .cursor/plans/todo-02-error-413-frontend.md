# TODO 02 - Fix Error 413 Frontend Validation & Compression

## Prioritas: CRITICAL
## Estimasi: 1-2 jam

## Kasus yang Terjadi

Frontend ReportLetterheadSettings.tsx tidak ada validasi ukuran file sebelum upload ke server. User bisa upload file berukuran besar tanpa peringatan dan baru tahu ada error setelah request ke server gagal dengan 413.

**Root Cause:**
1. **Tidak ada client-side validation:** User bisa select file 5MB+ tanpa warning
2. **Tidak ada compression:** Image langsung di-convert ke base64 tanpa optimize ukuran
3. **Base64 bloat:** File 2MB menjadi ~2.6MB base64 (33% lebih besar)
4. **Bad error handling:** Frontend expect JSON response, tapi server return HTML saat 413

**Mengapa User Experience Buruk?**
User upload file besar → Loading lama → Error muncul → User bingung karena error message tidak jelas → User coba lagi dengan file yang sama → Error lagi → Frustasi.

**Impact:** User tidak bisa save logo, tidak ada feedback yang jelas kenapa gagal, dan tidak ada guidance untuk solve problem.

## Penjelasan Solusi

Perbaikan di frontend untuk better UX dan prevent large upload:
1. Install library untuk client-side image compression
2. Tambah validation ukuran file sebelum upload ke server
3. Implement client-side compression untuk reduce payload size
4. Fix error handling untuk parse response dengan benar
5. Tambah loading indicator dan user feedback

### To-dos

- [ ] Install browser-image-compression package di frontend
- [ ] Tambah validation ukuran file saat user select image (max 5MB) di ReportLetterheadSettings.tsx
- [ ] Show warning message jika file > 2MB sebelum upload
- [ ] Implement client-side image compression sebelum convert ke base64
- [ ] Update handleLogoUpload() function dengan compression logic
- [ ] Show preview ukuran file sebelum dan sesudah compression di UI
- [ ] Fix error handling untuk handle HTML response dan JSON response
- [ ] Update error message agar user-friendly untuk error 413
- [ ] Tambah loading spinner saat upload dan compress image
- [ ] Disable save button saat sedang processing untuk prevent double submit
