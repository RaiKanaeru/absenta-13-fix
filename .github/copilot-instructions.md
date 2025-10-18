# Absenta 13 — AI Coding Agent Instructions (Revised)

**Last Updated:** 18 Okt 2025  
**System Target:** Stable, layered, and policy-compliant build  
**Key Policies:**

* Role login hanya `ADMIN`, `GURU`, `KETOS`
* Tidak ada login personal siswa
* Fitur "pengajuan izin" dihapus total
* Rekap harian: satu absent-like pada slot terjadwal menjatuhkan status harian ke `TIDAK_HADIR`
* **DISPEN = HADIR (tercatat)**

---

## 1) Project Overview

Absenta 13 adalah sistem manajemen absensi sekolah berbasis **React + TypeScript (frontend)** dan **Node.js + Express + MySQL (backend)**. Kode masih monolit namun diarahkan ke arsitektur **layered**. Redis opsional untuk caching dan queue.

Capacity target: 150+ concurrent users. Prioritas: konsistensi data, keamanan, dan kalkulasi rekap harian yang deterministik.

---

## 2) Architecture Baseline

### 2.1 Server State (Transition)

* Monolit saat ini terpusat di satu entry (mis. `server_modern.js`).
* Target transisi: struktur **layered**:

  ```
  src/
    app.ts
    routes/
    controllers/
    services/
    repositories/
    middlewares/
    config/
    utils/
  ```

### 2.2 Database Access

* **Gunakan connection pool** (`mysql2/promise` → `createPool`), bukan single connection.
* Seluruh query harus parameterized.
* Jalankan migrasi SQL di bawah (backup dulu).

### 2.3 Data Source of Truth

* **Tabel akun adalah `users`**. Jika ada komentar atau kode lama menyebut `pengguna`, abaikan. Validasi nama tabel ke `absenta13.sql`.

---

## 3) Role Model & Dashboards

### 3.1 Roles

* `ADMIN`: akses penuh.
* `GURU`: hanya kelas/mapel yang dia ajar.
* `KETOS`: perwakilan kelas, dibatasi ke `class_id` miliknya, dan hanya boleh set `HADIR | TERLAMBAT`.

> Tidak ada role `siswa` untuk login. Jangan buat "Student Dashboard" mandiri.

### 3.2 Dashboards

* **AdminDashboard**: CRUD master data, users, jadwal, laporan, monitoring.
* **TeacherDashboard**: input absensi siswa per slot jadwal yang dia ajar, rekap kelasnya.
* **ClassRepDashboard (KETOS)**: input terbatas untuk kelasnya (status `HADIR | TERLAMBAT`), melihat rekap.

---

## 4) Attendance Logic (Final)

### 4.1 Status Groups

* **present-like:** `HADIR`, `TERLAMBAT`, `SAKIT`, `IZIN`, `DISPEN`
* **absent-like:** `ALPHA`, atau **tidak ada event** pada slot yang terjadwal

### 4.2 Aturan Rekap Harian

* Hanya menilai **slot yang terjadwal** di `jadwal_pelajaran`.
* Jika **ada ≥1 absent-like** pada hari itu → `final_status = TIDAK_HADIR`.
* Jika **semua** slot present-like → `final_status = HADIR`.
* **DISPEN = HADIR (tercatat)** untuk perhitungan slot dan ringkasan.

### 4.3 Implementasi (TypeScript helper)

```ts
type Status = 'HADIR'|'TERLAMBAT'|'SAKIT'|'IZIN'|'DISPEN'|'ALPHA';
const presentLike = new Set<Status>(['HADIR','TERLAMBAT','SAKIT','IZIN','DISPEN']);
const isPresentLike = (s?: Status) => !!s && presentLike.has(s);
const isHadirTercatat = (s?: Status) => s === 'HADIR' || s === 'TERLAMBAT' || s === 'DISPEN';
```

---

## 5) Database Schema (Alignment)

### 5.1 Tabel Inti

* `users(id, username, password_hash, role ENUM('ADMIN','GURU','KETOS'), guru_id NULL, class_id NULL, nomor_telepon, is_active TINYINT(1))`
* `guru(id, nip, nama, …)` **tanpa** `username`
* `siswa(id, nis, nama, class_id, …)` **tanpa** `username`
* `kelas(id, nama, wali_guru_id, …)`
* `mapel(id, kode, nama, …)`
* `jadwal_pelajaran(id, class_id, subject_id, teacher_id, hari INT, jam_ke INT, start_time, end_time, is_active)`
  Unik: `(class_id, hari, jam_ke)`

  > Tetap gunakan `jadwal_id` dan `jam_ke` pada event absensi.
* `absensi_siswa(id, student_id, jadwal_id, jam_ke, tanggal DATE, status ENUM('HADIR','TERLAMBAT','SAKIT','IZIN','DISPEN','ALPHA'), reason_text, proof_url, created_by, created_by_role)`
  Unik: `(student_id, tanggal, jadwal_id, jam_ke)`

### 5.2 Migrasi SQL (run after backup)

```sql
START TRANSACTION;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nomor_telepon VARCHAR(32) NULL AFTER password_hash,
  ADD INDEX IF NOT EXISTS idx_users_phone (nomor_telepon);

ALTER TABLE guru  DROP COLUMN IF EXISTS username;
ALTER TABLE siswa DROP COLUMN IF EXISTS username;

ALTER TABLE users
  MODIFY COLUMN role ENUM('ADMIN','GURU','KETOS') NOT NULL,
  ADD COLUMN IF NOT EXISTS guru_id  INT NULL,
  ADD COLUMN IF NOT EXISTS class_id INT NULL,
  ADD CONSTRAINT fk_users_guru  FOREIGN KEY (guru_id)  REFERENCES guru(id)   ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_users_kelas FOREIGN KEY (class_id) REFERENCES kelas(id)  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE jadwal_pelajaran
  ADD CONSTRAINT uq_jadwal_slot UNIQUE (class_id, hari, jam_ke);

ALTER TABLE absensi_siswa
  MODIFY COLUMN status ENUM('HADIR','TERLAMBAT','SAKIT','IZIN','DISPEN','ALPHA') NOT NULL,
  ADD CONSTRAINT uq_absen_slot UNIQUE (student_id, tanggal, jadwal_id, jam_ke),
  ADD INDEX IF NOT EXISTS idx_absen_student_date (student_id, tanggal),
  ADD INDEX IF NOT EXISTS idx_absen_jadwal_date  (jadwal_id, tanggal);

-- Hapus total fitur pengajuan izin (tabel terkait)
DROP TABLE IF EXISTS pengajuan_izin;
DROP TABLE IF EXISTS pengajuan_izin_detail;

COMMIT;
```

> Jika ada tabel `siswa_perwakilan`: migrasikan ke `users` role `KETOS` atau tandai deprecated. Sumber login harus konsisten dari `users`.

---

## 6) API Contract (v1)

### 6.1 Prefix & Deprecation

* Endpoint baru menggunakan prefix **`/v1`**. Endpoint lama didepresiasi bertahap.

### 6.2 Endpoints

* `GET /v1/subjects` → {id, kode, nama}
* `GET /v1/classes/:id/students`
* `GET /v1/classes/:id/schedules?hari=1..6`
* `POST /v1/attendance/events`
  Body: `{ student_id, jadwal_id, jam_ke, tanggal, status, reason_text?, proof_url? }`
  Guards:

  * Unik `(student_id, tanggal, jadwal_id, jam_ke)` → **409** jika duplikat
  * RBAC: `KETOS` hanya `HADIR|TERLAMBAT` untuk `class_id` miliknya
  * Validasi kecocokan `jadwal_id` + `jam_ke` + `hari`
* `POST /v1/attendance/compute`
  Body: `{ class_id, tanggal, hari }`
  Return: `[ { student_id, final_status } ]`

### 6.3 RBAC Middleware

* `ADMIN`: full access
* `GURU`: hanya jadwal yang dia ajar (`teacher_id` pada `jadwal_pelajaran`)
* `KETOS`: hanya `class_id` miliknya; tolak `SAKIT/IZIN/DISPEN` (**403**)

---

## 7) Frontend Alignment

### 7.1 Cleanup Wajib

* **Hapus total** UI/route/store/service untuk **izin** dan turunannya.
* Pisahkan **Data Guru/Siswa** vs **Akun** (akun ditarik dari `users`, tampilkan `nomor_telepon`).
* Komponen Rekap Harian ambil data dari `POST /v1/attendance/compute`.
* Semua dropdown mapel tampil **nama** (ambil dari `/v1/subjects` atau join server-side).

### 7.2 API Client (contoh)

```ts
export async function apiCall(endpoint: string, method = 'GET', data?: any) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/v1${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

---

## 8) Security & Performance Baseline

### 8.1 Security

* `helmet`, strict CORS (whitelist env), rate-limit pada `/login` dan high-traffic routes
* JWT secret dari `process.env.JWT_SECRET`
* Validasi input (Zod/Joi/express-validator) pada semua mutasi
* Jangan expose stack trace di production

### 8.2 Performance

* **Wajib**: MySQL connection pool
* Hindari N+1; kombinasikan query agregat
* Redis optional; jangan menjadikan dependency keras
* Export besar: gunakan queue/streaming, hindari full in-memory

---

## 9) Testing Plan

### 9.1 Wajib Lulus (T1–T10)

* T1 Sakit jam 1, hadir sisanya → `HADIR`
* T2 Izin jam 1, hadir sisanya → `HADIR`
* T3 Dispen full day → `HADIR`
* T4 Alpha 1 slot → `TIDAK_HADIR`
* T5 Ada jadwal tanpa event → `TIDAK_HADIR`
* T6 Slot tanpa jadwal diabaikan
* T7 KETOS set `SAKIT` → **403**
* T8 GURU ubah kelas yang bukan dia ajar → **403**
* T9 Duplikasi event slot → **409**
* T10 Laporan harian/range performa wajar

### 9.2 Kasus DISPEN (D1–D5)

* D1 Semua slot `DISPEN` → `HADIR`, `hadir_tercatat` penuh
* D2 Campuran `DISPEN/HADIR/TERLAMBAT` tanpa absent-like → `HADIR`
* D3 Ada `ALPHA` di salah satu slot → `TIDAK_HADIR`
* D4 KETOS input `DISPEN` → **403**
* D5 Rekap menampilkan `total_hadir_tercatat_slot` termasuk `DISPEN`

> Implementasi automated test disarankan (Jest + Supertest). Manual script hanya untuk smoke.

---

## 10) Known Gotchas (Updated)

* **Tanggal:** normalisasi ke `YYYY-MM-DD` pada API.
* **Perwakilan kelas:** gunakan `users` role `KETOS`, jangan mengandalkan tabel `siswa_perwakilan`.
* **Jadwal:** tetap pakai `jadwal_id` dan `jam_ke`; unik `(class_id, hari, jam_ke)`.
* **Multi-teacher:** tidak wajib. Jika ada asisten, implementasi setelah core stable.

---

## 11) Operational Commands

```bash
# Backend (dev)
npm run dev:server

# Frontend (dev)
npm run dev:web

# Import DB awal
mysql -u root -p < absenta13.sql

# Backup sebelum migrasi
mysqldump -u root -p --single-transaction absenta13 > backup_$(date +%F).sql

# Jalankan migrasi (manual atau via tool)
mysql -u root -p absenta13 < migrations/absenta13_alignment.sql
```

---

## 12) Modification Patterns (Layered)

### 12.1 Tambah Endpoint (v1)

1. Tambah route di `routes/*.ts`
2. Controller tipis: validasi, panggil service
3. Service berisi business logic
4. Repository berisi query DB parameterized
5. RBAC via middleware: `requireRole(['ADMIN', ...])`
6. Update FE untuk konsumsi endpoint baru

### 12.2 Transaksi DB

Gunakan transaksi untuk operasi multi-step (insert user + relasi guru, import jadwal, dsb). Hindari "insert berurutan tanpa transaction."

---

## 13) Debugging Aids

```ts
// Query debug (dev only)
logger.debug({ sql, params });

// Health check
GET /health → DB ping, Redis ping, uptime, version

// Metrics (optional)
GET /metrics → Prometheus register
```

---

### Acceptance Criteria (Ringkas)

* Tidak ada lagi modul/route/komponen/tabel **izin**.
* `guru`/`siswa` bersih dari `username`; akun lengkap di `users` (ada `nomor_telepon`).
* RBAC efektif (KETOS terbatas; GURU sesuai jadwal; ADMIN penuh).
* Rekap harian sesuai aturan final; **DISPEN dihitung sebagai HADIR (tercatat)**.
* FE mapel tampil **nama**, bukan ID.
* Endpoint **`/v1`** aktif; endpoint lama didepresiasi bertahap.
* Seluruh test **T1–T10** dan **D1–D5** lulus.

---
