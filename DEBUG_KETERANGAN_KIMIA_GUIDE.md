# Debug Guide - Keterangan Kimia (Jadwal ID 1125)

## 🎯 Masalah Spesifik
Jadwal Kimia (ID: 1125) dengan guru Drs. Bambang Hartono, M.Pd tidak menampilkan keterangan yang sudah tersimpan di textarea.

## 🔍 Debug Logging yang Ditambahkan

### 1. **Logging Data Processing**
```javascript
// Normal Mode
🔍 Processing jadwal 1125 (normal mode): {
  status: "Tidak Hadir",
  keterangan: "daw",
  hasKeterangan: true,
  fullJadwalData: {...}
}

// Edit Mode  
🔍 Processing jadwal 1125 (edit mode): {
  status: "Tidak Hadir", 
  keterangan: "daw",
  hasKeterangan: true,
  fullJadwalData: {...}
}
```

### 2. **Special Debug untuk Jadwal Kimia**
```javascript
// Normal Mode
🔍 SPECIAL DEBUG - Jadwal Kimia (1125): {
  nama_mapel: "Kimia",
  status: "Tidak Hadir",
  keterangan: "daw",
  keteranganType: "string",
  keteranganLength: 3,
  isKeteranganEmpty: false,
  fullData: {...}
}

// Edit Mode
🔍 SPECIAL DEBUG - Jadwal Kimia (1125) EDIT MODE: {
  nama_mapel: "Kimia",
  status: "Tidak Hadir", 
  keterangan: "daw",
  keteranganType: "string",
  keteranganLength: 3,
  isKeteranganEmpty: false,
  fullData: {...}
}
```

### 3. **Textarea Focus Debug**
```javascript
🔍 SPECIAL TEXTAREA DEBUG - Kimia (1125): {
  jadwalId: 1125,
  namaMapel: "Kimia",
  currentValue: "daw",
  kehadiranDataForJadwal: {status: "Tidak Hadir", keterangan: "daw"},
  hasKeterangan: true,
  keteranganLength: 3,
  allKehadiranKeys: ["1125", "1145", "1165", "1185", "1205"]
}
```

### 4. **kehadiranData Change Debug**
```javascript
🔍 kehadiranData changed: {...}
🔍 kehadiranData keys: ["1125", "1145", "1165", "1185", "1205"]
🔍 kehadiranData[1125]: {status: "Tidak Hadir", keterangan: "daw"}
🔍 kehadiranData[1125] has keterangan: daw
```

## 🧪 Test Cases

### Test Case 1: Normal Mode Loading
1. Buka halaman dashboard siswa
2. **Expected Logs:**
   - `🔍 Processing jadwal 1125 (normal mode):`
   - `🔍 SPECIAL DEBUG - Jadwal Kimia (1125):`
   - `🔍 Loaded keterangan for jadwal 1125: daw`
   - `🔍 kehadiranData[1125] has keterangan: daw`

### Test Case 2: Edit Mode Loading
1. Klik "Edit Absen (30 Hari)"
2. Pilih tanggal dengan jadwal Kimia
3. **Expected Logs:**
   - `🔍 Processing jadwal 1125 (edit mode):`
   - `🔍 SPECIAL DEBUG - Jadwal Kimia (1125) EDIT MODE:`
   - `🔍 Loaded keterangan for jadwal 1125: daw`

### Test Case 3: Textarea Focus
1. Klik pada textarea keterangan jadwal Kimia
2. **Expected Logs:**
   - `🔍 Textarea focused for jadwal 1125:`
   - `🔍 SPECIAL TEXTAREA DEBUG - Kimia (1125):`
   - `currentValue: "daw"`

## 🔍 Troubleshooting Steps

### Step 1: Cek Data dari API
- Apakah log `🔍 SPECIAL DEBUG - Jadwal Kimia (1125):` menampilkan `keterangan: "daw"`?
- Apakah `isKeteranganEmpty: false`?

### Step 2: Cek State Management
- Apakah log `🔍 kehadiranData[1125] has keterangan: daw` muncul?
- Apakah `kehadiranData[1125]` berisi data yang benar?

### Step 3: Cek Textarea Value
- Apakah log `🔍 SPECIAL TEXTAREA DEBUG` menampilkan `currentValue: "daw"`?
- Apakah `hasKeterangan: true`?

### Step 4: Cek Database
```sql
SELECT jadwal_id, keterangan, status, tanggal 
FROM absensi_guru 
WHERE jadwal_id = 1125 
AND tanggal = CURDATE();
```

## 🐛 Common Issues

### Issue 1: API tidak mengembalikan keterangan
**Symptoms:** `keterangan: null` atau `keterangan: ""`
**Solution:** Cek query SQL di backend

### Issue 2: State tidak ter-update
**Symptoms:** `kehadiranData[1125]` kosong atau tidak ada
**Solution:** Cek `setKehadiranData` dan useEffect

### Issue 3: Textarea tidak menampilkan nilai
**Symptoms:** `currentValue: ""` meskipun state ada
**Solution:** Cek `value` prop di textarea

### Issue 4: Data hilang saat reload
**Symptoms:** Data ada di API tapi hilang di state
**Solution:** Cek logic loading dan state initialization

## 📋 Expected Results

Jika sistem bekerja dengan benar, Anda akan melihat:

1. **API Response:** `keterangan: "daw"`
2. **State Update:** `kehadiranData[1125]: {status: "Tidak Hadir", keterangan: "daw"}`
3. **Textarea Value:** `currentValue: "daw"`
4. **UI Display:** Textarea menampilkan "daw" dan counter "3/500 karakter"

## 📞 Next Steps

Jika masalah masih terjadi setelah debugging:

1. **Kirim semua console logs** yang muncul
2. **Kirim screenshot** dari textarea yang kosong
3. **Kirim hasil query database** untuk jadwal 1125
4. **Test dengan jadwal lain** untuk memastikan masalah spesifik ke jadwal Kimia

---

**Dibuat:** $(date)  
**Status:** 🔍 Debug Mode - Jadwal Kimia  
**Versi:** 1.3




