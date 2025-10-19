# Optimasi Pengajuan Izin Kelas - Jadwal Berdasarkan Tanggal

## Perubahan yang Dilakukan

### 1. Frontend Changes (src/components/StudentDashboard_Modern.tsx)

#### A. State Management
- Menambahkan state `jadwalBerdasarkanTanggal` untuk menyimpan jadwal berdasarkan tanggal yang dipilih
- Memisahkan data jadwal untuk kehadiran dan pengajuan izin

#### B. Form Pengajuan Izin
- **Mengubah urutan input**: Tanggal izin sekarang harus dipilih terlebih dahulu
- **Validasi input**: 
  - Field tanggal izin wajib diisi sebelum memilih jadwal
  - Field jadwal pelajaran disabled sampai tanggal dipilih
  - Menampilkan pesan bantuan untuk user
- **Loading jadwal dinamis**: Jadwal dimuat berdasarkan tanggal yang dipilih

#### C. Fungsi loadJadwalByDate
- Menggunakan endpoint baru `/api/siswa/:siswa_id/jadwal-pengajuan-izin`
- Menyimpan hasil ke state `jadwalBerdasarkanTanggal`
- Error handling yang lebih baik

#### D. Validasi Submit
- Memastikan tanggal izin dan jadwal pelajaran dipilih sebelum submit
- Menampilkan pesan error yang jelas

### 2. Backend Changes (backend/server_modern.js)

#### A. Endpoint Baru: `/api/siswa/:siswa_id/jadwal-pengajuan-izin`
- **Fitur khusus untuk pengajuan izin**:
  - Mengizinkan tanggal masa depan (hingga 30 hari ke depan)
  - Mengizinkan tanggal masa lalu (hingga 30 hari yang lalu)
  - Hanya menampilkan jadwal aktif (`status = 'aktif'`)
- **Filter berdasarkan kelas**: Hanya menampilkan mata pelajaran kelas siswa perwakilan
- **Response format**: `{success: true, data: jadwalData, tanggal: targetDateStr, hari: targetDay}`

#### B. Validasi Tanggal
- Rentang tanggal: 30 hari ke belakang hingga 30 hari ke depan
- Validasi format tanggal
- Error handling yang komprehensif

## Alur Kerja Baru

1. **User membuka form pengajuan izin**
2. **User memilih tanggal izin** → Sistem memuat jadwal untuk tanggal tersebut
3. **User memilih jadwal pelajaran** → Dropdown menampilkan mata pelajaran kelas untuk tanggal tersebut
4. **User mengisi data siswa** → Form validasi lengkap
5. **User submit** → Sistem validasi dan kirim data

## Keuntungan

### ✅ **Akurasi Data**
- Jadwal yang ditampilkan sesuai dengan tanggal izin yang dipilih
- Tidak ada jadwal dari hari lain yang muncul

### ✅ **User Experience**
- Flow yang lebih logis: tanggal dulu, baru jadwal
- Validasi yang jelas dan helpful
- Pesan error yang informatif

### ✅ **Data Integrity**
- Hanya mata pelajaran kelas siswa perwakilan yang ditampilkan
- Validasi tanggal yang ketat
- Filter jadwal aktif saja

### ✅ **Fleksibilitas**
- Mendukung pengajuan izin untuk tanggal masa depan
- Mendukung pengajuan izin untuk tanggal masa lalu (dalam batas wajar)

## Testing

### Manual Testing Steps:
1. Login sebagai siswa perwakilan
2. Buka tab "Pengajuan Izin"
3. Klik "Ajukan Izin Kelas"
4. **Test Case 1**: Coba pilih jadwal tanpa memilih tanggal → Should show error
5. **Test Case 2**: Pilih tanggal masa depan → Should load jadwal untuk hari tersebut
6. **Test Case 3**: Pilih tanggal masa lalu → Should load jadwal untuk hari tersebut
7. **Test Case 4**: Pilih tanggal weekend → Should show "Tidak ada jadwal"
8. **Test Case 5**: Submit tanpa jadwal → Should show validation error

### Expected Results:
- ✅ Tanggal izin harus dipilih terlebih dahulu
- ✅ Jadwal hanya menampilkan mata pelajaran kelas siswa perwakilan
- ✅ Jadwal sesuai dengan hari dari tanggal yang dipilih
- ✅ Validasi form yang ketat
- ✅ Error handling yang baik

## Files Modified

1. `src/components/StudentDashboard_Modern.tsx` - Frontend form dan logic
2. `backend/server_modern.js` - Endpoint baru untuk jadwal pengajuan izin

## API Endpoints

### GET `/api/siswa/:siswa_id/jadwal-pengajuan-izin?tanggal=YYYY-MM-DD`
- **Purpose**: Mengambil jadwal pelajaran untuk pengajuan izin berdasarkan tanggal
- **Parameters**: 
  - `siswa_id`: ID siswa perwakilan
  - `tanggal`: Tanggal dalam format YYYY-MM-DD
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id_jadwal": 1,
        "jam_ke": 1,
        "jam_mulai": "07:00",
        "jam_selesai": "07:45",
        "nama_mapel": "Matematika",
        "kode_mapel": "MAT",
        "nama_guru": "Guru Matematika",
        "nip": "123456789",
        "nama_kelas": "X IPA 1",
        "status_kehadiran": "belum_diambil",
        "tanggal_target": "2024-01-15"
      }
    ],
    "tanggal": "2024-01-15",
    "hari": "Senin"
  }
  ```
- **Error Cases**:
  - 400: Tanggal tidak valid atau di luar rentang
  - 404: Siswa tidak ditemukan
  - 500: Server error
