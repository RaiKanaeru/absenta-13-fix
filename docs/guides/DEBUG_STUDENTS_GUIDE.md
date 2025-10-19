# 👥 DEBUG GUIDE - Daftar Siswa Belum Muncul

## 🚨 Masalah yang Ditemukan

Daftar siswa tidak muncul di menu "Naik Kelas Siswa". Saya telah menambahkan debugging yang lengkap untuk membantu mengidentifikasi masalah.

## 🔍 Langkah Debugging

### 1. **Buka Developer Console**
1. Buka aplikasi di browser
2. Tekan `F12` atau `Ctrl+Shift+I`
3. Buka tab **Console**
4. Pilih menu "Naik Kelas" di dashboard admin
5. Pilih kelas asal (contoh: "X IPA 1")

### 2. **Periksa Log Debugging**
Sekarang sistem akan menampilkan log debugging yang detail:

```
🔄 useEffect triggered - fromClassId: 1
📞 Calling fetchStudents with classId: 1
👥 Fetching students for classId: 1
📊 Raw students data: [...]
🔍 Filtering students for classId: 1
Student Ahmad Fauzi (ID: 1) - kelas_id: 1, target: 1, matches: true
Student Budi Santoso (ID: 2) - kelas_id: 1, target: 1, matches: true
✅ Filtered students: [...]
```

### 3. **Periksa Debug Info Card**
Sekarang akan muncul card debug info yang menampilkan:
- fromClassId: 1
- students.length: 2
- isLoading: false
- toClassId: 2

## 🛠️ Solusi Berdasarkan Masalah

### Masalah 1: API Error
**Log yang Muncul:**
```
❌ Error fetching students: [error message]
```

**Solusi:**
1. Periksa apakah server backend berjalan
2. Periksa endpoint `/api/admin/students-data`
3. Periksa authentication token

### Masalah 2: Data Kosong
**Log yang Muncul:**
```
📊 Raw students data: []
```

**Solusi:**
1. Periksa database siswa_perwakilan
2. Pastikan ada data siswa
3. Pastikan status siswa = 'aktif'

### Masalah 3: Filtering Gagal
**Log yang Muncul:**
```
Student Ahmad Fauzi (ID: 1) - kelas_id: 1, target: 1, matches: false
```

**Solusi:**
1. Periksa tipe data kelas_id (number vs string)
2. Periksa apakah kelas_id sesuai dengan classId yang dipilih

### Masalah 4: useEffect Tidak Dipanggil
**Log yang Tidak Muncul:**
```
🔄 useEffect triggered - fromClassId: 1
```

**Solusi:**
1. Pastikan fromClassId ter-set dengan benar
2. Periksa apakah ada error di console

## 🧪 Test Cases

### Test Case 1: Basic Student Loading
1. Pilih kelas "X IPA 1"
2. Periksa console log
3. Harus muncul daftar siswa

### Test Case 2: Empty Class
1. Pilih kelas yang tidak ada siswa
2. Harus muncul "Tidak Ada Siswa"

### Test Case 3: Loading State
1. Pilih kelas
2. Harus muncul loading spinner
3. Setelah loading selesai, muncul daftar siswa

## 📊 Data Sample untuk Testing

```sql
-- Cek data siswa
SELECT 
    s.id_siswa,
    s.nis,
    s.nama,
    s.kelas_id,
    s.status,
    k.nama_kelas
FROM siswa_perwakilan s
LEFT JOIN kelas k ON s.kelas_id = k.id_kelas
WHERE s.status = 'aktif'
ORDER BY s.kelas_id, s.nama;

-- Cek data kelas
SELECT 
    id_kelas,
    nama_kelas,
    tingkat,
    status
FROM kelas 
WHERE status = 'aktif'
ORDER BY tingkat, nama_kelas;
```

## 🔧 Perbaikan yang Sudah Dilakukan

### 1. **Fixed Interface StudentData**
```typescript
// SEBELUM
interface StudentData {
  id: number;  // ❌ Salah
  // ...
}

// SESUDAH
interface StudentData {
  id_siswa: number;  // ✅ Benar
  // ...
}
```

### 2. **Fixed Type Comparison**
```typescript
// SEBELUM
const matches = student.kelas_id === classId;  // ❌ Type mismatch

// SESUDAH
const studentClassId = student.kelas_id?.toString();
const targetClassId = classId.toString();
const matches = studentClassId === targetClassId;  // ✅ Type match
```

### 3. **Added Comprehensive Debugging**
- Console logs untuk setiap step
- Debug info card di UI
- Error handling yang lebih baik

## 🎯 Expected Behavior

Setelah perbaikan, sistem harus:

1. ✅ **useEffect dipanggil** saat fromClassId berubah
2. ✅ **fetchStudents dipanggil** dengan classId yang benar
3. ✅ **API call berhasil** dan mengembalikan data siswa
4. ✅ **Filtering berhasil** dan menemukan siswa yang sesuai
5. ✅ **Daftar siswa muncul** di UI
6. ✅ **Debug info card** menampilkan informasi yang benar

## 📝 Checklist Debugging

- [ ] Console log muncul saat pilih kelas
- [ ] useEffect dipanggil dengan fromClassId yang benar
- [ ] fetchStudents dipanggil dengan classId yang benar
- [ ] API call berhasil (tidak ada error)
- [ ] Raw students data tidak kosong
- [ ] Filtering menemukan siswa yang sesuai
- [ ] students.length > 0
- [ ] Daftar siswa muncul di UI

## 🚨 Jika Masih Bermasalah

Jika setelah mengikuti panduan ini masih ada masalah, kirimkan:

1. **Screenshot Console** dengan log debugging
2. **Screenshot Debug Info Card** di UI
3. **Data Siswa** dari database:
   ```sql
   SELECT id_siswa, nis, nama, kelas_id, status FROM siswa_perwakilan WHERE status = 'aktif';
   ```
4. **Data Kelas** dari database:
   ```sql
   SELECT id_kelas, nama_kelas, tingkat, status FROM kelas WHERE status = 'aktif';
   ```

---

## 🎉 Success Indicators

Sistem berhasil jika:

- ✅ Console menampilkan log debugging yang lengkap
- ✅ Debug info card menampilkan students.length > 0
- ✅ Daftar siswa muncul di bawah
- ✅ Tidak ada error di console
- ✅ Loading state berfungsi dengan benar

**Happy Debugging! 🔧✨**
