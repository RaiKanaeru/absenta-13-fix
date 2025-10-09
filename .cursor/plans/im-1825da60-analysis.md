# Analisis Mendalam: Sistem Import Jadwal Existing vs Plan Baru

## 📊 Status Sistem Import Saat Ini

### ✅ Sistem Import Yang Sudah Ada

Sistem ABSENTA sudah memiliki fitur import Excel untuk berbagai entitas:

#### 1. **Import Jadwal Existing** (`/api/admin/import/jadwal`)
**Lokasi**: `server_modern.js` line 9433-9497

**Format Template**:
```
kelas_id | mapel_id | guru_id | hari | jam_ke | jam_mulai | jam_selesai | status
    1    |    1     |    1    | Senin|   1    | 07:00:00  | 07:45:00    | aktif
```

**Karakteristik**:
- ✅ Simple INSERT bulk (tidak ada upsert)
- ✅ Validasi dasar (hari, jam_ke, required fields)
- ✅ Dry-run support (`?dryRun=true`)
- ✅ Transaction per batch
- ✅ Error reporting per row
- ❌ Tidak ada mapping alias/normalisasi
- ❌ Tidak ada validasi silang dengan data master
- ❌ Tidak ada upsert (duplicate akan error)
- ❌ Format Excel sederhana (flat structure)

#### 2. **UI Component**: `ExcelImportView.tsx`
- ✅ Sudah ada UI generic untuk semua entitas
- ✅ Support upload, validasi, dan import
- ✅ Error display per row
- ✅ Progress tracking

#### 3. **Entitas Lain yang Sudah Support Import**:
- ✅ Siswa (Data + Akun)
- ✅ Guru (Data + Akun)
- ✅ Mata Pelajaran
- ✅ Kelas
- ✅ Jadwal (simple format)

## 🎯 Plan Baru: Format Excel Kompleks 3-Sheet

### Perbedaan Fundamental

| Aspek | Sistem Current | Plan Baru |
|-------|---------------|-----------|
| **Format Excel** | Simple flat table | Complex 3-sheet structure |
| | 1 sheet dengan header | 3 sheets: MASTER GURU HARIAN, JAM GURU, JADWAL |
| **Struktur JADWAL** | Flat rows | Matrix grid (kolom=hari+jam, rows=grup 3 baris per kelas) |
| **Mapping** | Direct ID (kelas_id, guru_id, mapel_id) | Alias/normalization needed |
| | | - Kode Guru (G1, G2) → id_guru |
| | | - Alias Mapel (MTK, BIO) → id_mapel |
| | | - Nama Kelas (X IPA 1) → id_kelas |
| **Operasi DB** | INSERT only | UPSERT (INSERT or UPDATE) |
| **Validasi Silang** | None | JAM GURU vs JADWAL consistency |
| **Config Files** | None | 3 config files needed |

### Format Excel yang Diharapkan (Plan Baru)

#### Sheet 1: MASTER GURU HARIAN
```
KODE | NAMA_LENGKAP | NAMA_PANGGILAN | SEN | SEL | RAB | KAM | JUM | SAB
 G1  | Budi Santoso | Pak Budi       |  ✓  |  ✓  |  ✓  |  ✓  |  ✓  |  ✗
 G2  | Citra Lestari| Bu Citra       |  ✓  |  ✓  |  ✓  |  ✗  |  ✓  |  ✗
```
**Tujuan**: Validasi ketersediaan guru per hari

#### Sheet 2: JAM GURU
```
KODE | SEN-1 | SEN-2 | SEN-3 | SEL-1 | SEL-2 | ...
 G1  |   X   |   X   |       |   X   |       | ...
 G2  |       |   X   |   X   |       |   X   | ...
```
**Tujuan**: Cross-validation total jam mengajar per guru

#### Sheet 3: JADWAL (Matrix Grid)
```
KELAS     | SEN-1  | SEN-2  | SEN-3  | SEL-1  | ...
----------|--------|--------|--------|--------|
X IPA 1   | G1     | G1     | G4     | G3     |     <- Baris 1: Kode Guru
          | MTK    | MTK    | SEJ    | FIS    |     <- Baris 2: Alias Mapel
          | R.301  | R.301  | R.204  | Lab    |     <- Baris 3: Ruang (ignored)
----------|--------|--------|--------|--------|
X IPA 2   | G2     | G3     | ...
          | BIO    | FIS    |
          | Lab.B  | Lab.F  |
```

**Parsing Logic**:
- Kolom header: `{HARI}-{JAM_KE}` → extract hari & jam_ke
- Setiap grup 3 baris = 1 kelas
- Kolom pertama = nama_kelas
- Row 1: kode_guru → lookup id_guru
- Row 2: alias_mapel → lookup id_mapel via config
- Row 3: ruang → diabaikan (tidak ada di skema DB)

## 🗄️ Struktur Database Actual

### Tabel `jadwal`
```sql
CREATE TABLE `jadwal` (
  `id_jadwal` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `kelas_id` int(11) NOT NULL,
  `mapel_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,      -- FK to guru.id (bukan guru.id_guru!)
  `hari` varchar(10) NOT NULL,      -- 'Senin', 'Selasa', ...
  `jam_ke` int(11) NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time NOT NULL,
  `status` enum('aktif','tidak_aktif') DEFAULT 'aktif',
  `created_at` timestamp DEFAULT current_timestamp()
)
```

**⚠️ PENTING**: 
- Field `guru_id` dalam tabel `jadwal` adalah FK ke `guru.id` (auto-increment)
- **BUKAN** `guru.id_guru` (custom ID)
- Plan lama salah asumsi tentang field mana yang digunakan

### Tabel `guru`
```sql
CREATE TABLE `guru` (
  `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,        -- Internal PK
  `id_guru` int(11) NOT NULL,                              -- Custom ID (G1 → 1)
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nip` varchar(30) NOT NULL,
  `nama` varchar(100) NOT NULL,
  ...
)
```

**Mapping Strategy**:
```
Excel: G1 → Parsing: 1 (id_guru) → Query: SELECT id FROM guru WHERE id_guru=1 → jadwal.guru_id
```

### Tabel `kelas`
```sql
CREATE TABLE `kelas` (
  `id_kelas` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `nama_kelas` varchar(50) NOT NULL UNIQUE,
  `tingkat` varchar(10),
  `status` enum('aktif','tidak_aktif') DEFAULT 'aktif'
)
```

### Tabel `mapel`
```sql
CREATE TABLE `mapel` (
  `id_mapel` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `kode_mapel` varchar(20) NOT NULL UNIQUE,
  `nama_mapel` varchar(100) NOT NULL,
  `status` enum('aktif','tidak_aktif') DEFAULT 'aktif'
)
```

## 🔍 Masalah & Gap Analysis

### 1. ❌ Konflik Endpoint
**Masalah**: Plan baru mau pakai endpoint yang sama `/api/admin/import/jadwal`
- Endpoint ini sudah ada dan aktif
- Format berbeda total (flat vs matrix)
- Breaking change untuk user existing

**Solusi**: 
```
✅ Endpoint baru: POST /api/admin/import/jadwal-advanced
✅ Keep backward compatibility dengan endpoint lama
✅ Template beda: /api/admin/templates/jadwal-advanced
```

### 2. ❌ Mapping Field Guru
**Masalah**: Plan asli tidak jelas tentang field mana yang digunakan
- `guru.id_guru` (custom ID dari kode G1 → 1)
- `guru.id` (auto-increment PK yang sebenarnya di FK)

**Solusi**:
```javascript
// Step 1: Parse kode guru dari Excel
const guruCode = 'G1'; // dari cell
const idGuru = parseInt(guruCode.replace(/^G/, '')); // 1

// Step 2: Query mapping
const [rows] = await db.execute(
  'SELECT id FROM guru WHERE id_guru = ?',
  [idGuru]
);
const guruId = rows[0].id; // ini yang masuk ke jadwal.guru_id
```

### 3. ❌ Tidak Ada Field `ruang` di Tabel `jadwal`
**Masalah**: Excel format punya row 3 untuk ruang, tapi DB tidak punya field ini

**Solusi**: 
- ✅ Log saja untuk informasi
- ✅ Tidak disimpan
- 🔮 Future: bisa tambah field `ruang` ke skema kalau diperlukan

### 4. ⚠️ Slot Waktu Hardcoded vs Dynamic
**Masalah**: Plan pakai config file untuk jam_mulai/jam_selesai per jam_ke

**Trade-off**:
| Approach | Pros | Cons |
|----------|------|------|
| **Config File** | Flexible, reusable | Needs maintenance |
| **Hardcoded** | Simple, fast | Not flexible |
| **Database** | Centralized, UI manageable | Adds complexity |

**Rekomendasi**: Config file (sesuai plan) karena:
- Jam pelajaran jarang berubah
- Bisa berbeda per hari (Jumat lebih pendek)
- Tidak perlu UI admin untuk manage

### 5. ❌ Validasi Silang Complexity
**Masalah**: Plan mau validasi:
- JAM GURU total vs JADWAL actual
- MASTER GURU HARIAN availability vs JADWAL schedule

**Realitas**: 
- Nice to have tapi bukan blocker
- Warning-only (tidak gagalkan import)
- Bisa diimplementasi bertahap (MVP dulu)

## 📋 Revisi Plan: Approach Bertahap

### 🎯 MVP (Minimum Viable Product)

**Goal**: Import JADWAL sheet saja, tanpa validasi silang

**Scope**:
1. ✅ Parse sheet JADWAL (matrix grid)
2. ✅ Mapping: kode_guru → id, alias_mapel → id_mapel, nama_kelas → id_kelas
3. ✅ Config files: mapel-alias.json, time-slots.json
4. ✅ Upsert logic (kelas_id, hari, jam_ke)
5. ✅ Endpoint: POST /api/admin/import/jadwal-advanced
6. ✅ Dry-run support
7. ✅ Error reporting

**Skip di MVP**:
- ❌ MASTER GURU HARIAN validation
- ❌ JAM GURU cross-check
- ❌ Kelas normalization config (pakai nama_kelas langsung)

### 🚀 Phase 2 (Enhancement)

**Goal**: Add validasi silang dan advanced features

**Scope**:
1. ✅ Parse MASTER GURU HARIAN + JAM GURU
2. ✅ Cross-validation warnings
3. ✅ Kelas normalization config (jika nama_kelas beda di Excel vs DB)
4. ✅ Bulk operation optimization
5. ✅ Detailed audit log

## 🗂️ File Structure (Revisi)

### Backend Files
```
backend/
├── config/
│   ├── schedule-import.config.json      # Time slots per hari/jam_ke
│   └── mapel-alias.json                 # Alias mapel → kode_mapel/id_mapel
├── utils/
│   └── scheduleImporterAdvanced.js      # Main importer logic
└── migrations/
    └── (tidak perlu, skema tidak berubah)
```

### Config File Samples

#### `backend/config/schedule-import.config.json`
```json
{
  "timeSlots": {
    "Senin": [
      { "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:45:00" },
      { "jam_ke": 2, "jam_mulai": "07:45:00", "jam_selesai": "08:30:00" },
      { "jam_ke": 3, "jam_mulai": "08:30:00", "jam_selesai": "09:15:00" },
      { "jam_ke": 4, "jam_mulai": "09:30:00", "jam_selesai": "10:15:00" }
    ],
    "Selasa": [ /* sama */ ],
    "Rabu": [ /* sama */ ],
    "Kamis": [ /* sama */ ],
    "Jumat": [
      { "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:40:00" },
      { "jam_ke": 2, "jam_mulai": "07:40:00", "jam_selesai": "08:20:00" }
    ],
    "Sabtu": [ /* jika ada */ ]
  },
  "sheetNames": {
    "masterGuru": "MASTER GURU HARIAN",
    "jamGuru": "JAM GURU",
    "jadwal": "JADWAL"
  },
  "options": {
    "strictMode": false,
    "skipInvalidRows": true,
    "logLevel": "info"
  }
}
```

#### `backend/config/mapel-alias.json`
```json
{
  "aliases": {
    "MTK": "MTK-01",
    "MATEMATIKA": "MTK-01",
    "MAT": "MTK-01",
    "BIO": "BIO-01",
    "BIOLOGI": "BIO-01",
    "FIS": "FIS-01",
    "FISIKA": "FIS-01",
    "SEJ": "SEJ-01",
    "SEJARAH": "SEJ-01",
    "BING": "BING-01",
    "ENG": "BING-01",
    "INGGRIS": "BING-01"
  }
}
```

## 🔄 Flow Diagram (MVP)

```
┌─────────────────┐
│ Upload Excel    │
│ (3 sheets)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. Validate File Structure  │
│    - Check 3 sheets exist   │
│    - Check JADWAL format    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Load Config & DB Cache   │
│    - Load time-slots.json   │
│    - Load mapel-alias.json  │
│    - Query guru, kelas,     │
│      mapel from DB          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Parse JADWAL Sheet       │
│    - Extract header         │
│      (hari, jam_ke)         │
│    - Parse matrix grid      │
│    - Group by 3 rows        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. Transform & Validate     │
│    - nama_kelas → kelas_id  │
│    - kode_guru → guru_id    │
│    - alias_mapel → mapel_id │
│    - Collect errors         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. Dry Run?                 │
│    Yes → Return preview     │
│    No  → Continue           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 6. Upsert to DB             │
│    - Transaction per kelas  │
│    - Check existing         │
│      (kelas_id, hari,       │
│       jam_ke)               │
│    - INSERT or UPDATE       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 7. Return Summary           │
│    - Total: X               │
│    - Inserted: Y            │
│    - Updated: Z             │
│    - Errors: []             │
└─────────────────────────────┘
```

## ⚠️ Risiko & Mitigasi

| Risiko | Severity | Mitigasi |
|--------|----------|----------|
| **Excel format tidak konsisten** | HIGH | Strict validation di step 1, reject file jika tidak sesuai |
| **Nama kelas typo/beda** | MEDIUM | Fuzzy matching optional, error reporting jelas |
| **Alias mapel tidak ketemu** | MEDIUM | Config comprehensive, fallback to error |
| **Guru tidak ada di DB** | MEDIUM | Pre-import validation, error per row |
| **Upsert conflict** | LOW | Transaction per kelas, rollback on error |
| **Performance (bulk data)** | LOW | Batch per kelas, limit file size |

## 🎨 UI/UX Considerations

### Option 1: Extend ExcelImportView.tsx
**Pros**: Reuse existing component
**Cons**: Format terlalu berbeda (3 sheets vs 1 sheet)

### Option 2: New Component JadwalAdvancedImportView.tsx
**Pros**: 
- Dedicated UI untuk format kompleks
- Preview grid matrix
- Sheet-by-sheet validation feedback

**Cons**: More code

**Rekomendasi**: Option 2 untuk MVP, bisa merge later

## 📝 API Specification (MVP)

### Endpoint
```
POST /api/admin/import/jadwal-advanced
```

### Request
- **Auth**: Bearer token (admin only)
- **Content-Type**: multipart/form-data
- **Body**:
  - `file`: Excel file (.xlsx)
- **Query Params**:
  - `dryRun`: boolean (default: false)

### Response (Success)
```json
{
  "success": true,
  "summary": {
    "total": 120,
    "inserted": 80,
    "updated": 35,
    "skipped": 5
  },
  "errors": [
    {
      "row": "X IPA 1 - Senin - Jam 1",
      "errors": ["Guru G99 tidak ditemukan"]
    }
  ],
  "warnings": [
    {
      "row": "X IPA 2 - Selasa - Jam 3",
      "message": "Ruang 'Lab.Komputer' diabaikan (tidak tersimpan)"
    }
  ],
  "reportFile": "reports/import-schedule-20251003-143022.json"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "File validation failed",
  "details": [
    "Sheet 'JADWAL' tidak ditemukan",
    "Format header tidak sesuai"
  ]
}
```

## 🧪 Testing Strategy

### Unit Tests
1. Config file parsing
2. Excel cell parsing (guru code, mapel alias)
3. Mapping functions
4. Upsert logic

### Integration Tests
1. Full import dengan sample Excel
2. Dry-run validation
3. Error handling (invalid data)
4. Transaction rollback

### Manual Tests
1. Upload real jadwal data
2. Verify DB updates
3. UI preview check
4. Error message clarity

## 📅 Implementation Timeline

### Week 1: MVP Core
- [ ] Day 1-2: Config files + parser foundation
- [ ] Day 3-4: Mapping & transformation logic
- [ ] Day 5: Upsert implementation

### Week 2: Integration & Polish
- [ ] Day 1-2: Endpoint integration
- [ ] Day 3: UI component (basic)
- [ ] Day 4-5: Testing & bug fixes

### Week 3: Phase 2 (Optional)
- [ ] Cross-validation
- [ ] Advanced features
- [ ] Performance optimization

## ✅ Decision Summary

| Item | Decision | Rationale |
|------|----------|-----------|
| **Endpoint** | New: `/api/admin/import/jadwal-advanced` | Avoid breaking existing import |
| **MVP Scope** | JADWAL sheet only, no cross-validation | Ship faster, iterate later |
| **Config Format** | JSON files in backend/config/ | Flexible, maintainable |
| **Upsert Key** | (kelas_id, hari, jam_ke) | Match plan, handle duplicates |
| **Guru Mapping** | G1 → id_guru → guru.id | Correct FK relationship |
| **Ruang Field** | Ignore (log only) | DB schema constraint |
| **UI Component** | New component (Option 2) | Better UX for complex format |

## 🎯 Next Steps

1. ✅ **Revisi plan ini ke plan.md final**
2. 🔨 **Implement MVP** (Week 1-2)
3. 🧪 **Test dengan sample data**
4. 📝 **Update EXCEL_IMPORT_GUIDE.md** dengan format baru
5. 🚀 **Deploy & monitor**
6. 🔄 **Phase 2** based on feedback

---

**Catatan**: Dokumen ini adalah hasil analisis mendalam terhadap sistem existing vs plan baru. Plan final akan direvisi berdasarkan analisis ini.
