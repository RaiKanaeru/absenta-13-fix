# Fix Error 500 Internal Server Error - API Endpoints

## Masalah yang Diperbaiki

Terdapat 2 endpoint yang mengembalikan Error 500 Internal Server Error:

1. `GET /api/siswa/821/pengajuan-izin` - Error: Internal server error
2. `GET /api/siswa/821/jadwal-rentang?tanggal=2025-10-04` - Error: Internal server error

## Root Cause Analysis

1. **Field Database Tidak Ada**: Query menggunakan field `ada_tugas` yang tidak ada di tabel `absensi_guru`
2. **Syntax Error SQL**: Koma yang tersisa setelah menghapus field yang tidak ada
3. **Kurangnya Validasi Input**: Tidak ada validasi untuk parameter yang masuk
4. **Error Handling Tidak Memadai**: Error tidak di-handle dengan baik dan tidak memberikan informasi yang jelas

## Solusi yang Diimplementasikan

### 1. Perbaikan Query Database

**File**: `server_modern.js` (lines 3970-3992 dan 4063-4085)

**Masalah**: Query menggunakan field `ada_tugas` yang tidak ada di tabel `absensi_guru`

**Perbaikan**:
```sql
-- SEBELUM (Error)
SELECT 
    j.id_jadwal,
    j.jam_ke,
    j.jam_mulai,
    j.jam_selesai,
    mp.nama_mapel,
    mp.kode_mapel,
    g.nama as nama_guru,
    g.nip,
    k.nama_kelas,
    COALESCE(ag.status, 'belum_diambil') as status_kehadiran,
    COALESCE(ag.keterangan, '') as keterangan,
    COALESCE(ag.ada_tugas, false) as ada_tugas  -- ❌ Field tidak ada
FROM jadwal j
-- ... rest of query

-- SESUDAH (Fixed)
SELECT 
    j.id_jadwal,
    j.jam_ke,
    j.jam_mulai,
    j.jam_selesai,
    mp.nama_mapel,
    mp.kode_mapel,
    g.nama as nama_guru,
    g.nip,
    k.nama_kelas,
    COALESCE(ag.status, 'belum_diambil') as status_kehadiran,
    COALESCE(ag.keterangan, '') as keterangan  -- ✅ Field yang tidak ada dihapus
FROM jadwal j
-- ... rest of query
```

### 2. Perbaikan Syntax SQL

**Masalah**: Koma yang tersisa setelah menghapus field `ada_tugas`

**Perbaikan**:
```sql
-- SEBELUM (Error)
COALESCE(ag.keterangan, '') as keterangan,
FROM jadwal j

-- SESUDAH (Fixed)
COALESCE(ag.keterangan, '') as keterangan
FROM jadwal j
```

### 3. Endpoint yang Sudah Ada dan Berfungsi

#### A. Endpoint Pengajuan Izin

**Endpoint yang Tersedia**:
- `GET /api/siswa/:siswaId/pengajuan-izin` (baru)
- `GET /api/siswa/:siswa_id/pengajuan-izin` (legacy)

**Fitur**:
- ✅ Validasi parameter `siswaId`
- ✅ Error handling dengan try-catch
- ✅ Logging detail dengan stack trace
- ✅ Response format konsisten dengan `success` dan `data`
- ✅ Support untuk pengajuan izin kelas dan individual

#### B. Endpoint Jadwal Rentang

**Endpoint yang Tersedia**:
- `GET /api/siswa/:siswaId/jadwal-rentang` (baru)
- `GET /api/siswa/:siswa_id/jadwal-rentang` (legacy)

**Fitur**:
- ✅ Validasi parameter `siswaId` dan `tanggal`
- ✅ Validasi format tanggal (YYYY-MM-DD)
- ✅ Error handling dengan try-catch
- ✅ Logging detail dengan stack trace
- ✅ Response format konsisten

### 4. Validasi Input yang Ditambahkan

#### Pengajuan Izin:
- Validasi `siswaId` harus berupa angka
- Return 400 jika parameter tidak valid

#### Jadwal Rentang:
- Validasi `siswaId` harus berupa angka
- Validasi `tanggal` harus ada dan format valid
- Return 400 jika parameter tidak valid

### 5. Error Handling yang Diperbaiki

```javascript
try {
    // ... query execution
} catch (error) {
    console.error('❌ Error getting jadwal by date:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Gagal memuat jadwal untuk tanggal tersebut',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
}
```

### 6. Logging yang Ditambahkan

```javascript
console.log('📅 Getting jadwal for siswa:', siswaId, 'tanggal:', tanggal);
console.log('📅 Target day:', targetDay);
console.log('✅ Jadwal retrieved for date:', tanggal, 'count:', jadwalData.length);
```

## Testing

### File Test yang Dibuat

1. **test-endpoints-500-fix.js** - Test script Node.js
2. **test-simple-endpoints.html** - Test interface web

### Cara Menjalankan Test

1. **Node.js Test**:
```bash
node test-endpoints-500-fix.js
```

2. **Web Test**:
- Buka `test-simple-endpoints.html` di browser
- Masukkan Base URL (default: http://localhost:3000)
- Masukkan Siswa ID (default: 821)
- Masukkan Tanggal (default: 2025-10-04)
- Klik tombol test yang diinginkan

### Test Cases

1. ✅ Test pengajuan izin dengan ID valid
2. ✅ Test jadwal rentang dengan ID dan tanggal valid
3. ✅ Test dengan ID tidak valid (harus return 400)
4. ✅ Test jadwal rentang tanpa tanggal (harus return 400)
5. ✅ Test jadwal rentang dengan format tanggal tidak valid (harus return 400)

## Hasil Fix

### Sebelum Fix:
- ❌ Error 500 Internal Server Error
- ❌ Query database error karena field tidak ada
- ❌ Syntax error SQL
- ❌ Tidak ada validasi input

### Sesudah Fix:
- ✅ Endpoint berfungsi normal
- ✅ Query database berjalan tanpa error
- ✅ Validasi input yang proper
- ✅ Error handling yang baik
- ✅ Logging detail untuk debugging
- ✅ Response format yang konsisten

## Endpoint yang Diperbaiki

1. **GET /api/siswa/:siswaId/pengajuan-izin**
   - Status: ✅ Fixed
   - Error: Field `ada_tugas` tidak ada di database
   - Fix: Hapus field yang tidak ada dari query

2. **GET /api/siswa/:siswaId/jadwal-rentang**
   - Status: ✅ Fixed
   - Error: Field `ada_tugas` tidak ada di database
   - Fix: Hapus field yang tidak ada dari query

## Catatan Penting

1. **Database Schema**: Pastikan field yang digunakan dalam query ada di database
2. **Error Handling**: Selalu gunakan try-catch untuk handle error database
3. **Validasi Input**: Validasi semua parameter input sebelum digunakan
4. **Logging**: Tambahkan logging detail untuk debugging
5. **Testing**: Test semua endpoint dengan berbagai skenario

## File yang Dimodifikasi

- `server_modern.js` - Perbaikan query database dan error handling
- `test-endpoints-500-fix.js` - File test Node.js
- `test-simple-endpoints.html` - File test web interface
- `FIX-ERROR-500-ENDPOINTS.md` - Dokumentasi fix ini