# 🎬 DEMO SCRIPT - Smart Class Promotion System

## 📹 Video Demo Script

### Scene 1: Introduction (0-10 detik)
**Narator**: "Selamat datang di sistem promosi kelas cerdas ABSENTA. Sistem ini secara otomatis mendeteksi kelas tujuan berdasarkan kelas asal yang dipilih."

### Scene 2: Login & Navigation (10-20 detik)
**Action**: 
- Login sebagai admin
- Klik menu "Naik Kelas" di sidebar

**Narator**: "Masuk ke dashboard admin dan pilih menu 'Naik Kelas'."

### Scene 3: Smart Class Selection (20-40 detik)
**Action**:
- Klik dropdown "Pilih kelas asal"
- Pilih "X IPA 1"
- Tunjukkan auto-detection "X IPA 1 → XI IPA 1"

**Narator**: "Pilih kelas asal, misalnya 'X IPA 1'. Perhatikan bagaimana sistem secara otomatis mendeteksi kelas tujuan 'XI IPA 1' dengan notifikasi yang jelas."

### Scene 4: Student Selection (40-60 detik)
**Action**:
- Tunjukkan daftar siswa yang muncul
- Klik "Pilih Semua" atau pilih individual
- Tunjukkan preview button

**Narator**: "Sistem menampilkan daftar siswa dari kelas asal. Anda bisa memilih semua siswa atau memilih individual sesuai kebutuhan."

### Scene 5: Preview & Confirmation (60-80 detik)
**Action**:
- Klik "Preview" button
- Tunjukkan dialog preview dengan detail
- Klik "Konfirmasi Naik Kelas"

**Narator**: "Sebelum memproses, sistem menampilkan preview lengkap dengan detail siswa yang akan dinaikkan kelas."

### Scene 6: Success & Results (80-90 detik)
**Action**:
- Tunjukkan success message
- Tunjukkan siswa sudah pindah ke kelas baru
- Refresh halaman untuk konfirmasi

**Narator**: "Proses selesai! Siswa berhasil dinaikkan dari X IPA 1 ke XI IPA 1. Sistem mencatat semua perubahan untuk audit trail."

---

## 🎯 Key Features to Highlight

### 1. Auto-Detection Magic
- **Before**: Pilih kelas 11/12 → Pilih kelas asal → Pilih siswa
- **After**: Pilih kelas asal → Auto-detect target → Pilih siswa

### 2. Smart Notifications
- ✅ "Kelas Tujuan Terdeteksi: X IPA 1 → XI IPA 1"
- ⚠️ "Kelas Tujuan Ditemukan (Parsial): Nomor mungkin berbeda"
- ❌ "Kelas Tujuan Tidak Ditemukan: Kelas belum dibuat"

### 3. Visual Improvements
- Gradient background untuk auto-detection
- Progress indicator yang sederhana
- Responsive design

### 4. Error Handling
- Graceful fallback jika kelas tidak ditemukan
- Clear error messages
- Transaction rollback

---

## 📊 Test Scenarios

### Scenario 1: Normal Flow
1. Pilih "X IPA 1" → Auto-detect "XI IPA 1" ✅
2. Pilih semua siswa → Preview → Confirm ✅
3. Success message muncul ✅

### Scenario 2: Edge Case
1. Pilih "X IPA 1" tapi "XI IPA 1" belum ada
2. Sistem cari "XI IPA" (partial match)
3. Tampilkan warning "Nomor mungkin berbeda"

### Scenario 3: Error Case
1. Pilih "X IPA 1" tapi tidak ada kelas XI IPA sama sekali
2. Tampilkan error "Kelas XI IPA belum dibuat"
3. Sarankan buat kelas terlebih dahulu

---

## 🎉 Call to Action

**Narator**: "Sistem promosi kelas cerdas ABSENTA memudahkan admin mengelola kenaikan kelas siswa dengan akurasi tinggi dan user experience yang intuitif. Coba sekarang!"

---

## 📝 Notes for Recording

1. **Screen Resolution**: 1920x1080 untuk clarity
2. **Mouse Speed**: Normal (tidak terlalu cepat)
3. **Audio**: Clear narration dengan background music lembut
4. **Duration**: 90 detik total
5. **Format**: MP4, 30fps, 1080p

---

## 🔧 Technical Setup

### Prerequisites
- Database dengan data kelas dan siswa
- Server running di localhost:3001
- Frontend build yang sudah di-deploy

### Test Data
```sql
-- Kelas untuk testing
INSERT INTO kelas (nama_kelas, tingkat, status) VALUES
('X IPA 1', 'X', 'aktif'),
('XI IPA 1', 'XI', 'aktif'),
('X IPS 1', 'X', 'aktif'),
('XI IPS 1', 'XI', 'aktif');

-- Siswa untuk testing
INSERT INTO siswa_perwakilan (nis, nama, kelas_id, status) VALUES
('001', 'Ahmad Fauzi', 1, 'aktif'),
('002', 'Budi Santoso', 1, 'aktif'),
('003', 'Citra Dewi', 1, 'aktif');
```

---

## 🎬 Production Checklist

- [ ] Screen recording software ready
- [ ] Test data prepared
- [ ] All scenarios tested
- [ ] Audio quality checked
- [ ] Video quality verified
- [ ] Export settings configured
- [ ] Upload platform ready

---

**Ready to record! 🎬**

