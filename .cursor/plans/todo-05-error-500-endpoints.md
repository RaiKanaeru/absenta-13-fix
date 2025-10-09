# TODO 05 - Fix Error 500 Internal Server Error (API Endpoints)

## Prioritas: CRITICAL
## Estimasi: 2-3 jam

## Kasus yang Terjadi

Ada 2 endpoint yang mengembalikan 500 Internal Server Error di StudentDashboard:
1. GET /api/siswa/821/pengajuan-izin - Error: Internal server error
2. GET /api/siswa/821/jadwal-rentang?tanggal=2025-10-04 - Error: Internal server error

**Root Cause Kemungkinan:**

**Endpoint Pengajuan Izin:**
1. **Endpoint tidak ada/belum dibuat:** Route GET /api/siswa/:id/pengajuan-izin mungkin belum di-define di server_modern.js
2. **Database query error:** Query ke table pengajuan_izin mungkin salah (typo table name, missing JOIN, wrong column name)
3. **Undefined variable:** Code mencoba akses property dari object yang undefined/null

**Endpoint Jadwal Rentang:**
1. **Parameter tanggal tidak di-handle:** Query expect format tanggal tertentu tapi tidak di-validate/parse dengan benar
2. **Database JOIN error:** Query jadwal butuh JOIN ke table guru, mapel, kelas tapi salah struktur JOIN
3. **WHERE clause error:** Filter berdasarkan siswa_id atau kelas_id salah logic

**Mengapa Error 500 Berbahaya?**
Error 500 berarti ada unhandled exception di server. Ini bisa menyebabkan:
- Server crash jika exception tidak di-catch
- Data corruption jika error terjadi di tengah transaction
- Log file penuh dengan error stack trace
- User tidak mendapat info error yang berguna (hanya "Internal server error")

**Impact:**
- Siswa tidak bisa lihat data pengajuan izin sama sekali
- Siswa tidak bisa lihat jadwal untuk tanggal tertentu
- Fitur calendar/date picker tidak berfungsi
- User experience sangat buruk (blank screen atau error message)

## Penjelasan Solusi

Debug dan fix endpoint yang error 500:
1. Check dan fix endpoint /api/siswa/:id/pengajuan-izin di server_modern.js
2. Check dan fix endpoint /api/siswa/:id/jadwal-rentang di server_modern.js
3. Debug database query yang mungkin salah atau missing join
4. Add proper error handling dengan try-catch
5. Add logging untuk track error detail
6. Return proper JSON error response

### To-dos

- [ ] Check apakah endpoint GET /api/siswa/:id/pengajuan-izin sudah ada di server_modern.js
- [ ] Buat endpoint GET /api/siswa/:id/pengajuan-izin jika belum ada
- [ ] Debug query database di endpoint pengajuan-izin (check table name, join, where clause)
- [ ] Fix endpoint GET /api/siswa/:id/jadwal-rentang yang error 500
- [ ] Debug query database di endpoint jadwal-rentang (check parameter tanggal)
- [ ] Add try-catch untuk handle database error di kedua endpoint
- [ ] Add proper validation parameter siswa_id dan tanggal
- [ ] Return proper error response dengan status code dan message yang jelas
- [ ] Add logging di server untuk track error detail (console.error dengan stack trace)
- [ ] Test kedua endpoint dengan berbagai parameter untuk ensure fix bekerja
