# TODO 04 - Fix Infinite Re-render StudentDashboard & 404 Error

## Prioritas: CRITICAL
## Estimasi: 2-3 jam

## Kasus yang Terjadi

StudentDashboard_Modern.tsx mengalami infinite re-render loop. Component mounting/rendering berkali-kali tanpa henti (terlihat dari log "Component mounting/rendering" dan "ABSENTA Modern App Starting..." muncul berulang-ulang).

**Root Cause Infinite Re-render:**
1. **useEffect dependencies salah:** useEffect yang fetch data tidak punya dependency array atau dependency yang selalu berubah setiap render (misal: object/array baru dibuat setiap render)
2. **State update cascade:** fetchSiswaInfo() update state → trigger re-render → useEffect run lagi → fetch lagi → update state → loop continues
3. **Function re-creation:** Function yang di-pass sebagai dependency dibuat ulang setiap render karena tidak di-wrap dengan useCallback

**Mengapa Terjadi 404/500?**
Endpoint GET /api/siswa/821/jadwal-rentang dipanggil di dalam useEffect. Karena infinite re-render, endpoint ini di-hit berkali-kali dalam waktu singkat. Ini menyebabkan server overload dan kemungkinan database connection pool habis.

**React Warning "key prop":**
Di renderBandingAbsenContent line 2335, ada list/map yang render multiple elements tanpa unique key prop. Ini menyebabkan React tidak bisa track element changes dengan efisien.

**Impact:** 
- Browser freeze/lambat (CPU usage tinggi)
- Memory leak (state terus bertambah)
- Server overload (API di-hit berkali-kali)
- User tidak bisa pakai aplikasi sama sekali

## Penjelasan Solusi

Fix infinite re-render dan missing endpoint:
1. Analyze useEffect dependencies di StudentDashboard yang menyebabkan re-render loop
2. Implement proper memoization dengan useMemo dan useCallback
3. Fix state update yang trigger unnecessary re-render
4. Buat endpoint /api/siswa/:id/jadwal-rentang yang missing
5. Add proper cleanup di useEffect untuk prevent memory leak

### To-dos

- [ ] Analyze semua useEffect di StudentDashboard_Modern.tsx cari dependency yang salah
- [ ] Fix useEffect yang tidak ada dependency array atau dependency yang selalu berubah
- [ ] Wrap function dengan useCallback untuk prevent re-creation setiap render
- [ ] Wrap computed values dengan useMemo untuk prevent recalculation
- [ ] Fix state update di fetchSiswaInfo yang mungkin trigger cascade re-render
- [ ] Buat endpoint GET /api/siswa/:id/jadwal-rentang di server_modern.js
- [ ] Implement logic jadwal-rentang untuk get jadwal berdasarkan range tanggal
- [ ] Add loading state yang proper untuk prevent multiple fetch
- [ ] Add cleanup function di useEffect yang fetch data
- [ ] Fix missing key prop di renderBandingAbsenContent (line 2335) tambah unique key
