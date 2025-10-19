# Fitur Pengajuan Izin Kelas untuk Guru

## Deskripsi
Fitur ini memungkinkan guru untuk melihat, menyetujui, dan menolak pengajuan izin kelas yang diajukan oleh siswa. Fitur ini menampilkan data yang sama seperti riwayat pengajuan izin di halaman siswa, namun dengan tambahan tombol setuju dan tolak.

## Fitur yang Ditambahkan

### 1. API Endpoints

#### GET `/api/guru/:guruId/pengajuan-izin-kelas`
- **Deskripsi**: Mendapatkan daftar pengajuan izin kelas untuk guru
- **Method**: GET
- **Parameters**:
  - `page` (optional): Halaman (default: 1)
  - `limit` (optional): Jumlah data per halaman (default: 10)
  - `filter_pending` (optional): Filter hanya yang pending (default: false)
- **Response**: 
  ```json
  {
    "data": [...],
    "pagination": {...},
    "totalPages": 1,
    "totalPending": 0,
    "totalAll": 0,
    "currentFilter": "all",
    "showingCount": 0
  }
  ```

#### PUT `/api/guru/pengajuan-izin-kelas/:pengajuanId`
- **Deskripsi**: Menyetujui atau menolak pengajuan izin kelas
- **Method**: PUT
- **Body**:
  ```json
  {
    "status": "disetujui" | "ditolak",
    "keterangan_guru": "string"
  }
  ```

#### PUT `/api/pengajuan-izin-kelas/:pengajuanId/approve`
- **Deskripsi**: Endpoint alternatif untuk menyetujui/menolak pengajuan izin kelas (kompatibel dengan frontend)
- **Method**: PUT
- **Body**:
  ```json
  {
    "status_persetujuan": "disetujui" | "ditolak",
    "catatan_guru": "string",
    "disetujui_oleh": "number"
  }
  ```

### 2. Komponen Frontend

#### PengajuanIzinKelasView
- **Lokasi**: `frontend/src/components/TeacherDashboard_Modern.tsx`
- **Fitur**:
  - Menampilkan daftar pengajuan izin kelas dengan pagination
  - Filter untuk menampilkan hanya yang pending
  - Tombol setuju dan tolak untuk setiap pengajuan
  - Dialog konfirmasi untuk setuju/tolak
  - Menampilkan detail siswa yang izin (expandable)
  - Status badge untuk setiap pengajuan

### 3. Menu Sidebar
- **Lokasi**: Sidebar di halaman guru
- **Icon**: Users
- **Label**: "Pengajuan Izin Kelas"
- **View**: `pengajuan-izin-kelas`

## Cara Penggunaan

### Untuk Guru:
1. Login ke halaman guru
2. Klik menu "Pengajuan Izin Kelas" di sidebar
3. Lihat daftar pengajuan izin kelas yang perlu disetujui
4. Gunakan filter "Belum di-acc" untuk melihat hanya yang pending
5. Klik tombol "Setujui" atau "Tolak" untuk setiap pengajuan
6. Isi catatan (opsional untuk setuju, wajib untuk tolak)
7. Konfirmasi aksi

### Fitur Tambahan:
- **Pagination**: Navigasi halaman untuk data yang banyak
- **Filter**: Tampilkan hanya pengajuan yang pending
- **Expandable Details**: Lihat detail siswa yang izin (jika lebih dari 3)
- **Status Tracking**: Badge status untuk setiap pengajuan
- **Real-time Update**: Data terupdate setelah aksi setuju/tolak

## Struktur Data

### Pengajuan Izin Kelas
```typescript
interface PengajuanIzin {
  id: number;
  siswa_id: number;
  jadwal_id: number;
  tanggal_izin: string;
  jenis_izin: 'kelas';
  alasan: string;
  bukti_pendukung?: string;
  status_persetujuan: 'pending' | 'disetujui' | 'ditolak';
  catatan_guru?: string;
  tanggal_pengajuan: string;
  tanggal_respon?: string;
  nama_siswa: string;
  nis: string;
  nama_kelas: string;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
  siswa_izin: Array<{
    nama: string;
    jenis_izin: string;
    alasan: string;
    bukti_pendukung?: string;
  }>;
  total_siswa_izin: number;
}
```

## Database
Fitur ini menggunakan tabel `pengajuan_izin_siswa` dengan filter `jenis_izin = 'kelas'` dan tabel `pengajuan_izin_detail` untuk detail siswa yang izin.

## Testing
1. Pastikan server backend berjalan
2. Login sebagai guru
3. Navigasi ke menu "Pengajuan Izin Kelas"
4. Test fitur setuju/tolak
5. Test pagination dan filter
6. Test expandable details

## Catatan
- Fitur ini hanya menampilkan pengajuan izin dengan `jenis_izin = 'kelas'`
- Guru hanya bisa melihat pengajuan dari kelas yang diajar
- Setiap aksi setuju/tolak akan mengupdate status dan timestamp
- Data akan ter-refresh otomatis setelah aksi

