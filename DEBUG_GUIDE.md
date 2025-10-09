# 🔧 DEBUG GUIDE - Kelas Tujuan Tidak Ditemukan

## 🚨 Masalah yang Ditemukan

Error "kelas tujuan tidak ditemukan" masih muncul. Saya telah menambahkan debugging yang lengkap untuk membantu mengidentifikasi masalah.

## 🔍 Langkah Debugging

### 1. **Buka Developer Console**
1. Buka aplikasi di browser
2. Tekan `F12` atau `Ctrl+Shift+I`
3. Buka tab **Console**
4. Pilih kelas asal di menu "Naik Kelas"

### 2. **Periksa Log Debugging**
Sekarang sistem akan menampilkan log debugging yang detail:

```
🔤 Parsing class name: X IPA 1
🧹 Cleaned name: X IPA 1
🔍 Pattern 1: /^(X|XI|XII)\s+(IPA|IPS|BAHASA|AGAMA|UMUM)\s*(\d+)$/ match: ["X IPA 1", "X", "IPA", "1"]
✅ Parsed successfully: {level: "X", major: "IPA", number: 1, fullName: "X IPA 1"}

🔍 Finding target class for: 1
📚 Available classes: [
  {id: 1, name: "X IPA 1", status: "aktif"},
  {id: 2, name: "XI IPA 1", status: "aktif"},
  {id: 3, name: "X IPS 1", status: "aktif"}
]
📖 Source class: X IPA 1
🧩 Parsed class: {level: "X", major: "IPA", number: 1, fullName: "X IPA 1"}
🎯 Looking for target level: XI major: IPA number: 1
🔍 Checking class: XI IPA 1 parsed: {level: "XI", major: "IPA", number: 1, fullName: "XI IPA 1"} match: true
✅ Target class found: XI IPA 1
```

### 3. **Identifikasi Masalah**

#### A. **Jika Parsing Gagal**
```
❌ Could not parse class name: [nama_kelas]
```
**Solusi**: Periksa format nama kelas di database

#### B. **Jika Kelas Tidak Ditemukan**
```
❌ No fallback class found
```
**Solusi**: Pastikan kelas tujuan sudah dibuat di database

#### C. **Jika Pattern Tidak Match**
```
🔍 Pattern 1: /^(X|XI|XII)\s+(IPA|IPS|BAHASA|AGAMA|UMUM)\s*(\d+)$/ match: null
```
**Solusi**: Periksa format nama kelas

## 🛠️ Solusi Berdasarkan Masalah

### Masalah 1: Format Nama Kelas Tidak Sesuai

**Cek di Database:**
```sql
SELECT id_kelas, nama_kelas, tingkat, status FROM kelas WHERE status = 'aktif';
```

**Format yang Didukung:**
- ✅ `X IPA 1` (spasi antara X dan IPA)
- ✅ `XI IPS 2` (spasi antara XI dan IPS)
- ✅ `XII BAHASA 1` (spasi antara XII dan BAHASA)
- ❌ `XIPA1` (tanpa spasi)
- ❌ `X-IPA-1` (dengan dash)

**Perbaiki Format:**
```sql
UPDATE kelas SET nama_kelas = 'X IPA 1' WHERE nama_kelas = 'XIPA1';
UPDATE kelas SET nama_kelas = 'XI IPA 1' WHERE nama_kelas = 'XI-IPA-1';
```

### Masalah 2: Kelas Tujuan Belum Dibuat

**Cek Kelas yang Ada:**
```sql
SELECT nama_kelas FROM kelas WHERE status = 'aktif' ORDER BY nama_kelas;
```

**Buat Kelas yang Hilang:**
```sql
-- Jika X IPA 1 ada tapi XI IPA 1 tidak ada
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES ('XI IPA 1', 'XI', 'aktif');

-- Jika XI IPS 1 ada tapi XII IPS 1 tidak ada
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES ('XII IPS 1', 'XII', 'aktif');
```

### Masalah 3: Status Kelas Tidak Aktif

**Aktifkan Kelas:**
```sql
UPDATE kelas SET status = 'aktif' WHERE nama_kelas = 'XI IPA 1';
```

## 🧪 Test Cases

### Test 1: Basic Promotion
1. Pastikan ada kelas `X IPA 1` dan `XI IPA 1`
2. Pilih `X IPA 1` sebagai kelas asal
3. Harus auto-detect `XI IPA 1`

### Test 2: Different Majors
1. Pastikan ada kelas `X IPS 1` dan `XI IPS 1`
2. Pilih `X IPS 1` sebagai kelas asal
3. Harus auto-detect `XI IPS 1`

### Test 3: Different Numbers
1. Pastikan ada kelas `X IPA 2` dan `XI IPA 2`
2. Pilih `X IPA 2` sebagai kelas asal
3. Harus auto-detect `XI IPA 2`

## 📊 Data Sample untuk Testing

```sql
-- Hapus data lama (hati-hati!)
DELETE FROM siswa_perwakilan WHERE kelas_id IN (SELECT id_kelas FROM kelas);
DELETE FROM kelas;

-- Insert data sample
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES
('X IPA 1', 'X', 'aktif'),
('XI IPA 1', 'XI', 'aktif'),
('XII IPA 1', 'XII', 'aktif'),
('X IPS 1', 'X', 'aktif'),
('XI IPS 1', 'XI', 'aktif'),
('XII IPS 1', 'XII', 'aktif'),
('X BAHASA 1', 'X', 'aktif'),
('XI BAHASA 1', 'XI', 'aktif'),
('XII BAHASA 1', 'XII', 'aktif');

-- Insert sample students
INSERT INTO siswa_perwakilan (nis, nama, kelas_id, status) VALUES
('001', 'Ahmad Fauzi', 1, 'aktif'),
('002', 'Budi Santoso', 1, 'aktif'),
('003', 'Citra Dewi', 1, 'aktif'),
('004', 'Dedi Kurniawan', 4, 'aktif'),
('005', 'Eka Putri', 4, 'aktif');
```

## 🔄 Langkah Troubleshooting

1. **Buka Console** dan pilih kelas asal
2. **Periksa Log** untuk melihat apa yang terjadi
3. **Identifikasi Masalah** berdasarkan log
4. **Terapkan Solusi** yang sesuai
5. **Test Ulang** sampai berhasil

## 📞 Jika Masih Bermasalah

Jika setelah mengikuti panduan ini masih ada masalah, kirimkan:

1. **Screenshot Console** dengan log debugging
2. **Data Kelas** dari database:
   ```sql
   SELECT id_kelas, nama_kelas, tingkat, status FROM kelas WHERE status = 'aktif';
   ```
3. **Kelas Asal** yang dipilih
4. **Error Message** yang muncul

---

## 🎯 Expected Behavior

Setelah debugging, sistem harus:

1. ✅ Parse nama kelas dengan benar
2. ✅ Tampilkan daftar kelas yang tersedia
3. ✅ Auto-detect kelas tujuan
4. ✅ Tampilkan notifikasi sukses
5. ✅ Tampilkan daftar siswa

**Happy Debugging! 🔧✨**
