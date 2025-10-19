# Update Cursor Rules - Sistem Absensi Guru

**Tanggal**: 7 Oktober 2025  
**Status**: Dokumentasi untuk update rules  

---

## 🔄 Update untuk Rules: `absenta-api-endpoints-complete`

### Tambahan untuk Endpoint `/api/attendance/submit`

**Update di section "POST `/api/attendance/submit`"**:

```markdown
### POST `/api/attendance/submit`
**Purpose**: Submit student attendance for a schedule  
**Access**: Teacher and Admin only  
**Request Body**:
```json
{
  "scheduleId": 1,
  "attendance": {
    "2004": "Hadir",
    "249": "Izin"
  },
  "notes": {
    "2004": "Tepat waktu",
    "249": "Sakit demam"
  },
  "guruId": 1,  // Optional - auto-detected from token for guru role
  "tanggal_absen": "2025-10-01"  // Optional - for Edit Absen (30 days) feature
}
```

**Response**:
```json
{
  "message": "Absensi berhasil disimpan",
  "processed": 2,
  "date": "2025-10-07",
  "scheduleId": 1
}
```

**Business Logic**:
1. **Auto-detect guru_id**: 
   - If `guruId` not provided and user role is 'guru', backend automatically gets `id_guru` from `guru` table using `id_pengguna` from JWT token
   - If `guruId` not provided and user role is 'admin', return error 400
   - Admin must provide `guruId` explicitly

2. **Edit Absen (30 Days)**:
   - If `tanggal_absen` provided, attendance will be saved for that specific date
   - If not provided, attendance saved for current date
   - This enables "Edit Absen (30 Hari)" feature

3. **Upsert Logic**:
   - Check if attendance exists for student + schedule + date
   - If exists: UPDATE existing record
   - If not exists: INSERT new record

**Database Operations**:
```sql
-- Auto-detect guru_id
SELECT id_guru FROM guru WHERE id_pengguna = ? AND status = "aktif"

-- Check existing attendance
SELECT id, status FROM absensi_siswa 
WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?

-- Update existing
UPDATE absensi_siswa 
SET status = ?, keterangan = ?, waktu_absen = ? 
WHERE id = ?

-- Insert new
INSERT INTO absensi_siswa 
(siswa_id, jadwal_id, tanggal, status, keterangan, waktu_absen, guru_id) 
VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Error Responses**:
- `400`: Data absensi tidak lengkap (scheduleId or attendance missing)
- `400`: guruId diperlukan untuk admin (admin must provide guruId)
- `404`: Data guru tidak ditemukan (guru not found for user)
- `404`: Jadwal tidak ditemukan (schedule not found)
- `500`: Internal server error
```
```

---

## 🔄 Update untuk Rules: `absenta-api-endpoints-complete`

### Tambahan untuk Endpoint `/api/guru/student-attendance-history`

**Tambah endpoint baru**:

```markdown
### GET `/api/guru/student-attendance-history`
**Purpose**: Get student attendance history for teacher's classes (last 30 days)  
**Access**: Teacher and Admin only  
**Query Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Records per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "tanggal": "2025-10-07",
      "jam_mulai": "07:00:00",
      "jam_selesai": "08:30:00",
      "nama_mapel": "Matematika",
      "nama_kelas": "X RPL 1",
      "nama_siswa": "Eko Nugroho",
      "nis": "20242004",
      "status_kehadiran": "Hadir",
      "keterangan": "Tepat waktu",
      "waktu_absen": "2025-10-07 07:15:00",
      "status_guru": "Hadir",
      "keterangan_guru": "Mengajar normal"
    }
  ]
}
```

**Business Logic**:
1. Get `guru_id` from JWT token (stored in `req.user.guru_id`)
2. Query attendance records for all students in teacher's classes
3. Join with schedule, subject, class, and student data
4. Include teacher attendance status if available
5. Filter: last 30 days only
6. Order by: waktu_absen DESC, jam_mulai ASC
7. Limit: 1000 records max

**Database Query**:
```sql
SELECT 
    absensi.tanggal,
    jadwal.jam_mulai,
    jadwal.jam_selesai,
    mapel.nama_mapel,
    kelas.nama_kelas,
    siswa.nama as nama_siswa,
    siswa.nis,
    absensi.status as status_kehadiran,
    absensi.keterangan,
    absensi.waktu_absen,
    guru_absen.status as status_guru,
    guru_absen.keterangan as keterangan_guru
FROM absensi_siswa absensi
INNER JOIN jadwal ON absensi.jadwal_id = jadwal.id_jadwal
INNER JOIN mapel ON jadwal.mapel_id = mapel.id_mapel
INNER JOIN kelas ON jadwal.kelas_id = kelas.id_kelas
INNER JOIN siswa_perwakilan siswa ON absensi.siswa_id = siswa.id_siswa
LEFT JOIN absensi_guru guru_absen ON jadwal.id_jadwal = guru_absen.jadwal_id 
    AND DATE(guru_absen.tanggal) = DATE(absensi.tanggal)
WHERE jadwal.guru_id = ? 
    AND absensi.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY absensi.waktu_absen DESC, jadwal.jam_mulai ASC
LIMIT 1000
```

**Important Notes**:
- ⚠️ Use table `jadwal`, NOT view `jadwal_pelajaran`
- ⚠️ Use table `siswa_perwakilan`, NOT table `siswa`
- ⚠️ Use column `waktu_absen`, NOT `created_at`
- ✅ This query matches actual database structure

**Error Responses**:
- `400`: guru_id tidak ditemukan pada token users
- `500`: Gagal memuat riwayat absensi siswa
```
```

---

## 🔄 Update untuk Rules: `absenta-database-schema-final`

### Update Section: Tabel yang Digunakan untuk Absensi

**Tambah catatan penting**:

```markdown
### ⚠️ PENTING: Tabel yang Benar untuk Query

#### ✅ Gunakan Tabel Ini:
1. **`jadwal`** - Tabel utama untuk schedule
   - Primary key: `id_jadwal`
   - Kolom: kelas_id, mapel_id, guru_id, hari, jam_ke, jam_mulai, jam_selesai

2. **`siswa_perwakilan`** - Tabel untuk data siswa aktif
   - Primary key: `id_siswa`
   - Kolom: user_id, nama, nis, kelas_id, jabatan

3. **`absensi_siswa`** - Tabel attendance siswa
   - Primary key: `id` (AUTO_INCREMENT)
   - Kolom waktu: `waktu_absen` (datetime)
   - Foreign keys: siswa_id, jadwal_id, guru_id

#### ❌ JANGAN Gunakan:
1. **`jadwal_pelajaran`** - Ini VIEW (deprecated), bukan tabel
2. **`siswa`** - Ini VIEW, gunakan `siswa_perwakilan`
3. **`created_at`** pada `absensi_siswa` - Kolom ini TIDAK ADA, gunakan `waktu_absen`

#### Contoh Query yang Benar:
```sql
-- ✅ BENAR
SELECT * FROM absensi_siswa a
INNER JOIN jadwal j ON a.jadwal_id = j.id_jadwal
INNER JOIN siswa_perwakilan s ON a.siswa_id = s.id_siswa
ORDER BY a.waktu_absen DESC

-- ❌ SALAH
SELECT * FROM absensi_siswa a
INNER JOIN jadwal_pelajaran j ON a.jadwal_id = j.id_jadwal  -- ❌ VIEW
INNER JOIN siswa s ON a.siswa_id = s.id  -- ❌ VIEW
ORDER BY a.created_at DESC  -- ❌ Kolom tidak ada
```
```

---

## 🔄 Update untuk Rules: `absenta-attendance-flow`

### Update Section: Teacher Attendance Recording

**Update business logic**:

```markdown
### Teacher Attendance Recording (Updated)

#### Request Flow
1. **Frontend**: Teacher submits attendance
   ```typescript
   // Frontend TIDAK perlu kirim guruId untuk guru
   const response = await apiCall('/api/attendance/submit', {
     method: 'POST',
     body: JSON.stringify({
       scheduleId: 1,
       attendance: { 2004: "Hadir", 249: "Izin" },
       notes: { 2004: "Tepat waktu" },
       // guruId: TIDAK USAH kirim, backend auto-detect
       tanggal_absen: "2025-10-01"  // Optional untuk Edit mode
     })
   });
   ```

2. **Backend**: Auto-detect guru_id
   ```javascript
   // Backend otomatis ambil guru_id dari token
   if (!guruId && req.user.role === 'guru') {
     const [guruData] = await db.execute(
       'SELECT id_guru FROM guru WHERE id_pengguna = ? AND status = "aktif"',
       [req.user.id]
     );
     guruId = guruData[0].id_guru;
   }
   ```

3. **Database**: Upsert logic
   ```sql
   -- Check existing
   SELECT id FROM absensi_siswa 
   WHERE siswa_id = ? AND jadwal_id = ? AND tanggal = ?
   
   -- Update jika ada
   UPDATE absensi_siswa SET status = ?, keterangan = ?, waktu_absen = ? WHERE id = ?
   
   -- Insert jika tidak ada
   INSERT INTO absensi_siswa (...) VALUES (...)
   ```

#### Edit Absen (30 Days) Feature
- Teacher dapat edit absensi hingga 30 hari ke belakang
- Parameter `tanggal_absen` menentukan tanggal target
- Jika tidak ada `tanggal_absen`, gunakan tanggal hari ini
- Update existing record atau insert new jika belum ada

#### Error Handling
- Auto-detect guru_id gagal → Error 404 "Data guru tidak ditemukan"
- Schedule tidak ditemukan → Error 404 "Jadwal tidak ditemukan"
- Validation gagal → Error 400 dengan detail error
```

---

## 📝 Catatan untuk Developer

### Yang Perlu Diingat:

1. **JWT Token Structure**
   ```json
   {
     "id": 1,          // id_pengguna dari tabel pengguna
     "username": "guru001",
     "role": "guru",
     // TIDAK ADA guru_id!
   }
   ```

2. **Mapping User ID ke Guru ID**
   - Token menyimpan: `id_pengguna` (dari tabel `pengguna`)
   - Yang dibutuhkan: `id_guru` (dari tabel `guru`)
   - Query mapping: `SELECT id_guru FROM guru WHERE id_pengguna = ?`

3. **Database Table Structure**
   - `pengguna.id` → User account (for login)
   - `guru.id_pengguna` → Foreign key to pengguna
   - `guru.id_guru` → Primary key, used in jadwal and absensi

4. **Frontend Best Practice**
   - Jangan kirim data yang undefined
   - Biarkan backend handle business logic
   - Kirim minimal data yang diperlukan
   - Log untuk debugging tapi jangan log sensitive data

5. **Backend Best Practice**
   - Auto-detect guru_id dari token untuk role guru
   - Validasi semua input
   - Use prepared statements untuk SQL
   - Transaction untuk data consistency
   - Comprehensive error handling

---

**Status**: ✅ Dokumentasi lengkap untuk update rules  
**Action Required**: Update cursor rules dengan informasi di atas











