# 🚨 TROUBLESHOOTING GUIDE - Kelas Tujuan Tidak Ditemukan

## 📋 LANGKAH-LANGKAH MENGATASI MASALAH

### 🔍 **LANGKAH 1: Debugging dengan Console**

1. **Buka Aplikasi** di browser
2. **Tekan F12** untuk membuka Developer Tools
3. **Buka tab Console**
4. **Pilih menu "Naik Kelas"** di dashboard admin
5. **Pilih kelas asal** (contoh: "X IPA 1")
6. **Periksa log** yang muncul di console

**Log yang Harus Muncul:**
```
🔤 Parsing class name: X IPA 1
🧹 Cleaned name: X IPA 1
🔍 Pattern 1: /^(X|XI|XII)\s+(IPA|IPS|BAHASA|AGAMA|UMUM)\s*(\d+)$/ match: ["X IPA 1", "X", "IPA", "1"]
✅ Parsed successfully: {level: "X", major: "IPA", number: 1, fullName: "X IPA 1"}
```

### 🗄️ **LANGKAH 2: Periksa Database**

1. **Buka phpMyAdmin** atau MySQL client
2. **Jalankan query** untuk melihat data kelas:

```sql
SELECT id_kelas, nama_kelas, tingkat, status FROM kelas WHERE status = 'aktif' ORDER BY tingkat, nama_kelas;
```

**Data yang Harus Ada:**
```
| id_kelas | nama_kelas | tingkat | status |
|----------|------------|---------|--------|
| 1        | X IPA 1    | X       | aktif  |
| 2        | XI IPA 1   | XI      | aktif  |
| 3        | X IPS 1    | X       | aktif  |
| 4        | XI IPS 1   | XI      | aktif  |
```

### 🛠️ **LANGKAH 3: Perbaiki Data Kelas**

Jika data kelas tidak sesuai, jalankan script perbaikan:

1. **Buka file `fix_classes.sql`**
2. **Copy semua isi file**
3. **Paste di phpMyAdmin** atau MySQL client
4. **Jalankan script**

### 🧪 **LANGKAH 4: Test Ulang**

1. **Refresh halaman** aplikasi
2. **Pilih menu "Naik Kelas"**
3. **Pilih kelas asal** (contoh: "X IPA 1")
4. **Periksa apakah** kelas tujuan terdeteksi otomatis

---

## 🔧 SOLUSI BERDASARKAN ERROR

### ❌ **Error: "Could not parse class name"**

**Penyebab:** Format nama kelas tidak sesuai

**Solusi:**
```sql
-- Perbaiki format nama kelas
UPDATE kelas SET nama_kelas = 'X IPA 1' WHERE nama_kelas = 'XIPA1';
UPDATE kelas SET nama_kelas = 'XI IPA 1' WHERE nama_kelas = 'XI-IPA-1';
```

### ❌ **Error: "No fallback class found"**

**Penyebab:** Kelas tujuan belum dibuat

**Solusi:**
```sql
-- Buat kelas tujuan yang hilang
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES
('XI IPA 1', 'XI', 'aktif'),
('XI IPS 1', 'XI', 'aktif'),
('XII IPA 1', 'XII', 'aktif');
```

### ❌ **Error: "Source class not found"**

**Penyebab:** Kelas asal tidak ada atau tidak aktif

**Solusi:**
```sql
-- Aktifkan kelas yang tidak aktif
UPDATE kelas SET status = 'aktif' WHERE nama_kelas = 'X IPA 1';
```

---

## 📊 FORMAT NAMA KELAS YANG DIDUKUNG

### ✅ **Format yang Benar:**
- `X IPA 1` (spasi antara X dan IPA)
- `XI IPS 2` (spasi antara XI dan IPS)
- `XII BAHASA 1` (spasi antara XII dan BAHASA)
- `X AGAMA 1` (spasi antara X dan AGAMA)
- `XI UMUM 1` (spasi antara XI dan UMUM)

### ❌ **Format yang Salah:**
- `XIPA1` (tanpa spasi)
- `X-IPA-1` (dengan dash)
- `X_IPA_1` (dengan underscore)
- `XIPA 1` (spasi hanya di akhir)

---

## 🧪 TEST CASES

### **Test Case 1: Basic Promotion**
1. Pastikan ada kelas `X IPA 1` dan `XI IPA 1`
2. Pilih `X IPA 1` sebagai kelas asal
3. Harus auto-detect `XI IPA 1`

### **Test Case 2: Different Majors**
1. Pastikan ada kelas `X IPS 1` dan `XI IPS 1`
2. Pilih `X IPS 1` sebagai kelas asal
3. Harus auto-detect `XI IPS 1`

### **Test Case 3: Different Numbers**
1. Pastikan ada kelas `X IPA 2` dan `XI IPA 2`
2. Pilih `X IPA 2` sebagai kelas asal
3. Harus auto-detect `XI IPA 2`

---

## 📝 DATA SAMPLE UNTUK TESTING

Jika tidak ada data kelas sama sekali, gunakan data sample ini:

```sql
-- Hapus data lama (hati-hati!)
DELETE FROM siswa_perwakilan WHERE kelas_id IN (SELECT id_kelas FROM kelas);
DELETE FROM kelas;

-- Insert data sample
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES
('X IPA 1', 'X', 'aktif'),
('XI IPA 1', 'XI', 'aktif'),
('XII IPA 1', 'XII', 'aktif'),
('X IPA 2', 'X', 'aktif'),
('XI IPA 2', 'XI', 'aktif'),
('XII IPA 2', 'XII', 'aktif'),
('X IPS 1', 'X', 'aktif'),
('XI IPS 1', 'XI', 'aktif'),
('XII IPS 1', 'XII', 'aktif'),
('X IPS 2', 'X', 'aktif'),
('XI IPS 2', 'XI', 'aktif'),
('XII IPS 2', 'XII', 'aktif'),
('X BAHASA 1', 'X', 'aktif'),
('XI BAHASA 1', 'XI', 'aktif'),
('XII BAHASA 1', 'XII', 'aktif');

-- Insert sample students
INSERT INTO siswa_perwakilan (nis, nama, kelas_id, status) VALUES
('001', 'Ahmad Fauzi', 1, 'aktif'),
('002', 'Budi Santoso', 1, 'aktif'),
('003', 'Citra Dewi', 1, 'aktif'),
('004', 'Dedi Kurniawan', 7, 'aktif'),
('005', 'Eka Putri', 7, 'aktif');
```

---

## 🎯 EXPECTED BEHAVIOR

Setelah perbaikan, sistem harus:

1. ✅ **Parse nama kelas** dengan benar
2. ✅ **Tampilkan daftar kelas** yang tersedia
3. ✅ **Auto-detect kelas tujuan** (X IPA 1 → XI IPA 1)
4. ✅ **Tampilkan notifikasi sukses** "✓ Kelas Tujuan Terdeteksi"
5. ✅ **Tampilkan daftar siswa** dari kelas asal

---

## 📞 JIKA MASIH BERMASALAH

Jika setelah mengikuti panduan ini masih ada masalah, kirimkan:

1. **Screenshot Console** dengan log debugging
2. **Data Kelas** dari database:
   ```sql
   SELECT id_kelas, nama_kelas, tingkat, status FROM kelas WHERE status = 'aktif';
   ```
3. **Kelas Asal** yang dipilih
4. **Error Message** yang muncul

---

## 🎉 SUCCESS INDICATORS

Sistem berhasil jika:

- ✅ Console menampilkan log debugging yang lengkap
- ✅ Kelas tujuan terdeteksi otomatis
- ✅ Notifikasi "✓ Kelas Tujuan Terdeteksi" muncul
- ✅ Daftar siswa muncul di bawah
- ✅ Tidak ada error di console

**Happy Troubleshooting! 🔧✨**
