# Debug Guide - Keterangan Loading Issue

## 🎯 Masalah
Keterangan yang sudah tersimpan tidak dimuat dan ditampilkan di form saat edit mode. Form menampilkan textarea kosong (0/500 karakter) meskipun ada keterangan yang sudah tersimpan sebelumnya.

## 🔧 Perbaikan yang Telah Dilakukan

### 1. **Perbaikan API Call**
- ✅ Mengganti `fetch` dengan `apiCall` di `loadJadwalByDate`
- ✅ Memperbaiki error handling untuk `apiCall`

### 2. **Penambahan Debug Logging**
- ✅ Logging di backend saat data keterangan dikembalikan
- ✅ Logging di frontend saat data keterangan dimuat
- ✅ Logging di textarea saat difocus
- ✅ useEffect untuk memantau perubahan kehadiranData

## 🔍 Cara Debugging

### 1. **Buka Developer Console**
1. Buka halaman dengan keterangan yang sudah tersimpan
2. Buka Developer Console (F12)
3. Lihat log yang muncul

### 2. **Log yang Diharapkan**

#### Backend Logs:
```
🔍 Backend returning keterangan for jadwal 123: daw
```

#### Frontend Logs (Normal Mode):
```
📊 Raw data from API (normal mode): [...]
🔍 Processing jadwal 123 (normal mode): {
  status: "Tidak Hadir",
  keterangan: "daw",
  hasKeterangan: true
}
🔍 Loaded keterangan for jadwal 123: daw
📊 Initialized kehadiranData for normal mode: {...}
```

#### Frontend Logs (Edit Mode):
```
📊 Raw data from API: [...]
🔍 Processing jadwal 123: {
  status: "Tidak Hadir", 
  keterangan: "daw",
  hasKeterangan: true
}
🔍 Loaded keterangan for jadwal 123: daw
📊 Initialized kehadiranData for edit mode: {...}
```

#### Textarea Focus Log:
```
🔍 Textarea focused for jadwal 123: {
  currentValue: "daw",
  kehadiranData: {status: "Tidak Hadir", keterangan: "daw"},
  allKehadiranData: {...}
}
```

#### kehadiranData Change Log:
```
🔍 kehadiranData changed: {...}
🔍 kehadiranData[123] has keterangan: daw
```

### 3. **Troubleshooting Steps**

#### Step 1: Cek Backend Logs
- Apakah ada log "🔍 Backend returning keterangan"?
- Jika tidak ada, cek database:
  ```sql
  SELECT jadwal_id, keterangan FROM absensi_guru 
  WHERE tanggal = CURDATE() AND keterangan IS NOT NULL;
  ```

#### Step 2: Cek Frontend API Response
- Apakah API response mengandung field `keterangan`?
- Apakah nilai `keterangan` tidak null/empty?

#### Step 3: Cek Data Processing
- Apakah log "🔍 Processing jadwal" menampilkan `hasKeterangan: true`?
- Apakah log "🔍 Loaded keterangan" muncul?

#### Step 4: Cek State Management
- Apakah log "🔍 kehadiranData changed" menampilkan data yang benar?
- Apakah log "🔍 Textarea focused" menampilkan `currentValue` yang benar?

## 🐛 Common Issues & Solutions

### Issue 1: Backend tidak mengembalikan keterangan
**Solution:** Cek query SQL di backend, pastikan field `keterangan` di-select

### Issue 2: Frontend tidak memproses keterangan
**Solution:** Cek logic di `loadJadwalByDate` dan `loadJadwalHariIni`

### Issue 3: State tidak ter-update
**Solution:** Cek `setKehadiranData` dan `useEffect` dependencies

### Issue 4: Textarea tidak menampilkan nilai
**Solution:** Cek `value` prop di textarea dan `kehadiranData` state

## 📋 Test Cases

### Test Case 1: Normal Mode
1. Buka halaman dengan keterangan tersimpan
2. **Expected:** Keterangan muncul di textarea
3. **Check:** Console logs menunjukkan data dimuat

### Test Case 2: Edit Mode
1. Klik "Edit Absen (30 Hari)"
2. Pilih tanggal dengan keterangan tersimpan
3. **Expected:** Keterangan muncul di textarea
4. **Check:** Console logs menunjukkan data dimuat

### Test Case 3: Textarea Focus
1. Klik pada textarea keterangan
2. **Expected:** Console log menampilkan nilai yang benar
3. **Check:** `currentValue` tidak kosong

## 📞 Support

Jika masalah masih terjadi setelah debugging:

1. **Kirim Console Logs** - Copy semua log yang muncul
2. **Kirim Network Tab** - Screenshot response API
3. **Kirim Database Query** - Hasil query SQL keterangan
4. **Kirim Screenshot** - Tampilan form yang kosong

---

**Dibuat:** $(date)  
**Status:** 🔍 Debug Mode  
**Versi:** 1.2




