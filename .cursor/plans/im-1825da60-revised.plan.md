<!-- 1825da60-31d3-423c-b6d8-7fd49fbff50a REVISED -->
# Rencana Implementasi: Import Jadwal Advanced (Format Matrix 3-Sheet)

##backend/config/schedule-import.config.json

{
"timeSlots": {uan & Scope

Implementasi sistem import jadwal dengan format Excel kompleks (3 sheets dengan struktur matrix), **tanpa breaking change** terhadap sistem import existing.

### MVP Scope (Phase 1)

- Parse sheet JADWAL dengan format matrix grid (kolom = hari+jam, rows = grup 3 per kelas)
- Mapping: kode_guru (G1) → guru.id, alias_mapel (MTK) → mapel.id_mapel,| Format Excel tidak sesuai | Strict validation + template download |
| Nama kelas typo | Error jelas dengan suggestion (future: fuzzy match) |
| Guru/mapel tidak ditemukan | Pre-validation + cache check |
| Duplicate key conflict | Upsert logic handle gracefully |
| Performance issue | Transaction per kelas + file size limit |

## Deployment Checklistas → kelas.id_kelas

- Upsert idempoten berdasarkan key (kelas_id, hari, jam_ke)
- Config files untuk time slots dan mapel alias
- Endpoint baru (backward compatible)
- Dry-run support + error reporting

### Out of Scope (Phase 2)

- Validasi silang dengan sheet MASTER GURU HARIAN
- Validasi silang dengan sheet JAM GURU
- Normalisasi nama kelas via config (pakai direct match dulu)

## Format Excel Target

### Sheet 1: JADWAL (Matrix Grid)

KELAS     | Senin-1 | Senin-2 | Selasa-1 | Selasa-2 | ...
----------|---------|---------|----------|----------|
X IPA 1   | G1      | G1      | G3       | G2       |    <- Row 1: Kode Guru (G1, G2, ...)
| MTK     | MTK     | FIS      | BIO      |    <- Row 2: Alias Mapel
| R.301   | R.301   | Lab      | Lab.Bio  |    <- Row 3: Ruang (ignored)
----------|---------|---------|----------|----------|
X IPA 2   | G2      | G3      | ...
| BIO     | FIS     |
| Lab.B   | Lab.F   |
```

**Parsing Rules**:

- Header kolom: `{HARI}-{JAM_KE}` (case-insensitive, support "Senin-1" atau "SEN-1")
- Setiap 3 baris = 1 kelas
- Kolom pertama = nama_kelas
- Baris ke-(3n): kode_guru (regex: `G\d+`)
- Baris ke-(3n+1): alias_mapel
- Baris ke-(3n+2): ruang (diabaikan, log as info)

### Sheet 2 & 3: MASTER GURU HARIAN & JAM GURU

**Status**: Dibaca tapi tidak divalidasi di MVP (reserved untuk Phase 2)

## 🗄️ Database Mapping

### Skema Tabel jadwal

CREATE TABLE jadwal (
id_jadwal int(11) PRIMARY KEY AUTO_INCREMENT,
kelas_id int(11) NOT NULL,
mapel_id int(11) NOT NULL,
guru_id int(11) NOT NULL,
hari varchar(10) NOT NULL,
jam_ke int(11) NOT NULL,
jam_mulai time NOT NULL,
jam_selesai time NOT NULL,
status enum('aktif','tidak_aktif') DEFAULT 'aktif',
UNIQUE KEY unique_schedule (kelas_id, hari, jam_ke)
)

### Mapping Strategy

1. Guru: Kode (G1) → guru.id
2. Guru: Kode (G1) → guru.id

Excel cell: "G1"
const guruCode = "G1";
const idGuru = parseInt(guruCode.replace(/^G/, ''));

Query: guru.id_guru → guru.id
const [rows] = await db.execute('SELECT id FROM guru WHERE id_guru = ?', [idGuru]);
const guruId = rows[0].id;

Critical: jadwal.guru_id adalah FK ke guru.id (auto-increment PK), BUKAN guru.id_guru

2. Mapel: Alias → mapel.id_mapel

Excel cell: "MTK"
const alias = "MTK";

Load config: mapel-alias.json
const mapelAlias = { "MTK": "MTK-01", "BIO": "BIO-01" };
const kodeMapel = mapelAlias[alias];

Query: kode_mapel → id_mapel
const mapelCache = { "MTK-01": 1, "BIO-01": 2 };
const mapelId = mapelCache[kodeMapel];

3. Kelas: Nama → kelas.id_kelas

Excel cell: "X IPA 1"
const namaKelas = "X IPA 1";

Query: nama_kelas → id_kelas (exact match)
const kelasCache = { "X IPA 1": 1, "X IPA 2": 2 };
const kelasId = kelasCache[namaKelas];

4. Time Slots: (hari, jam_ke) → (jam_mulai, jam_selesai)

Config: schedule-import.config.json
const timeSlots = {
"Senin": [
{ "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:45:00" },
{ "jam_ke": 2, "jam_mulai": "07:45:00", "jam_selesai": "08:30:00" }
]
};

const slot = timeSlots["Senin"][0];
const { jam_mulai, jam_selesai } = slot;

## File Structure

backend/
├── config/
│   ├── schedule-import.config.json
│   └── mapel-alias.json
└── utils/
└── scheduleImporterAdvanced.js

server_modern.js
├── POST /api/admin/import/jadwal-advanced
└── GET /api/admin/templates/jadwal-advanced

src/components/
└── JadwalAdvancedImportView.tsx

## Implementation Details

### 1. Config Files

backend/config/schedule-import.config.json
```json
{
"timeSlots": {
"Senin": [
{ "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:45:00" },
{ "jam_ke": 2, "jam_mulai": "07:45:00", "jam_selesai": "08:30:00" },
{ "jam_ke": 3, "jam_mulai": "08:30:00", "jam_selesai": "09:15:00" },
{ "jam_ke": 4, "jam_mulai": "09:30:00", "jam_selesai": "10:15:00" }
],
"Selasa": [ /* sama dengan Senin */ ],
"Rabu": [ /* sama dengan Senin */ ],
"Kamis": [ /* sama dengan Senin */ ],
"Jumat": [
{ "jam_ke": 1, "jam_mulai": "07:00:00", "jam_selesai": "07:40:00" },
{ "jam_ke": 2, "jam_mulai": "07:40:00", "jam_selesai": "08:20:00" },
{ "jam_ke": 3, "jam_mulai": "08:20:00", "jam_selesai": "09:00:00" }
],
"Sabtu": []
},
"sheetNames": {
"jadwal": "JADWAL",
"masterGuru": "MASTER GURU HARIAN",
"jamGuru": "JAM GURU"
},
"headerPatterns": {
"hariJam": "^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|SEN|SEL|RAB|KAM|JUM|SAB)[-\\s]?(\\d+)$"
},
"options": {
"strictMode": false,
"skipInvalidRows": true,
"logLevel": "info",
"maxFileSize": 5242880
}
}

backend/config/mapel-alias.json
{
"aliases": {
"MTK": "MTK-01",
"MATEMATIKA": "MTK-01",
"MAT": "MTK-01",
"BIO": "BIO-01",
"BIOLOGI": "BIO-01",
"FIS": "FIS-01",
"FISIKA": "FIS-01",
"KIM": "KIM-01",
"KIMIA": "KIM-01",
"SEJ": "SEJ-01",
"SEJARAH": "SEJ-01",
"BING": "BING-01",
"ENG": "BING-01",
"INGGRIS": "BING-01",
"BIND": "BIND-01",
"INDONESIA": "BIND-01"
}
}

### 2. Main Importer Module

backend/utils/scheduleImporterAdvanced.js

Exports:
module.exports = {
parseJadwalSheet,
validateAndTransform,
upsertSchedules,
generateReport
};

Key Functions:

parseJadwalSheet(worksheet, config)
Parse JADWAL sheet matrix grid
Returns: rawEntries - [{ kelas, hari, jam_ke, guru_code, mapel_alias, ruang }]
function parseJadwalSheet(worksheet, config) {
const rawEntries = [];
const headers = parseHeaders(worksheet); // Extract hari + jam_ke from columns

// Iterate rows in groups of 3
for (let i = 2; i <= worksheet.rowCount; i += 3) {
if (i + 2 > worksheet.rowCount) break;

const namaKelas = worksheet.getCell(i, 1).value;
if (!namaKelas) continue;

for (let col = 2; col <= headers.length; col++) {
const { hari, jam_ke } = headers[col];
const guruCode = worksheet.getCell(i, col).value;     // Row 1
const mapelAlias = worksheet.getCell(i+1, col).value; // Row 2
const ruang = worksheet.getCell(i+2, col).value;      // Row 3

if (guruCode && mapelAlias) {
rawEntries.push({
namaKelas, hari, jam_ke,
guruCode, mapelAlias, ruang
});
}
}
}

return rawEntries;
}

validateAndTransform(rawEntries, caches)
Validate & transform raw entries to DB format
Returns: { valid, errors }
function validateAndTransform(rawEntries, caches) {
const valid = [];
const errors = [];

for (const entry of rawEntries) {
const rowErrors = [];

// Map kelas
const kelasId = caches.kelas[entry.namaKelas];
if (!kelasId) rowErrors.push(`Kelas "${entry.namaKelas}" tidak ditemukan`);

// Map guru: G1 → id_guru=1 → guru.id
const match = entry.guruCode.match(/^G(\d+)$/i);
if (!match) {
rowErrors.push(`Kode guru "${entry.guruCode}" tidak valid`);
} else {
const idGuru = parseInt(match[1]);
const guruId = caches.guru[idGuru]; // guru.id (PK)
if (!guruId) rowErrors.push(`Guru G${idGuru} tidak ditemukan`);
}

// Map mapel: alias → kode_mapel → id_mapel
const kodeMapel = caches.aliasMap[entry.mapelAlias.toUpperCase()];
if (!kodeMapel) {
rowErrors.push(`Alias mapel "${entry.mapelAlias}" tidak terdaftar`);
} else {
const mapelId = caches.mapel[kodeMapel];
if (!mapelId) rowErrors.push(`Mapel "${kodeMapel}" tidak ditemukan`);
}

// Get time slot
const slot = caches.timeSlots[entry.hari]?.find(s => s.jam_ke === entry.jam_ke);
if (!slot) rowErrors.push(`Slot waktu ${entry.hari} jam ${entry.jam_ke} tidak ditemukan`);

if (rowErrors.length > 0) {
errors.push({
row: `${entry.namaKelas} - ${entry.hari} Jam ${entry.jam_ke}`,
errors: rowErrors
});
} else {
valid.push({
kelas_id: kelasId,
guru_id: guruId,
mapel_id: mapelId,
hari: entry.hari,
jam_ke: entry.jam_ke,
jam_mulai: slot.jam_mulai,
jam_selesai: slot.jam_selesai,
status: 'aktif'
});
}
}

return { valid, errors };
}

upsertSchedules(validEntries, db)
Upsert schedules to database
Returns: { inserted, updated }
async function upsertSchedules(validEntries, db) {
let inserted = 0;
let updated = 0;

// Group by kelas_id for transaction per kelas
const byKelas = {};
for (const entry of validEntries) {
if (!byKelas[entry.kelas_id]) byKelas[entry.kelas_id] = [];
byKelas[entry.kelas_id].push(entry);
}

for (const [kelasId, entries] of Object.entries(byKelas)) {
const conn = await db.getConnection();
try {
await conn.beginTransaction();

for (const entry of entries) {
// Check if exists
const [existing] = await conn.execute(
`SELECT id_jadwal FROM jadwal
WHERE kelas_id = ? AND hari = ? AND jam_ke = ?`,
[entry.kelas_id, entry.hari, entry.jam_ke]
);

if (existing.length > 0) {
// UPDATE
await conn.execute(
`UPDATE jadwal
SET guru_id = ?, mapel_id = ?,
jam_mulai = ?, jam_selesai = ?, status = ?
WHERE id_jadwal = ?`,
[entry.guru_id, entry.mapel_id, entry.jam_mulai,
entry.jam_selesai, entry.status, existing[0].id_jadwal]
);
updated++;
} else {
// INSERT
await conn.execute(
`INSERT INTO jadwal
(kelas_id, mapel_id, guru_id, hari, jam_ke,
jam_mulai, jam_selesai, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
[entry.kelas_id, entry.mapel_id, entry.guru_id, entry.hari,
entry.jam_ke, entry.jam_mulai, entry.jam_selesai, entry.status]
);
inserted++;
}
}

await conn.commit();
} catch (error) {
await conn.rollback();
throw error;
} finally {
conn.release();
}
}

return { inserted, updated };
}

### 3. API Endpoint

server_modern.js
import { parseJadwalSheet, validateAndTransform, upsertSchedules }
from './backend/utils/scheduleImporterAdvanced.js';
import fs from 'fs/promises';
import path from 'path';

let scheduleImportConfig, mapelAliasConfig;
async function loadImportConfigs() {
const configPath1 = './backend/config/schedule-import.config.json';
const configPath2 = './backend/config/mapel-alias.json';

scheduleImportConfig = JSON.parse(await fs.readFile(configPath1, 'utf-8'));
mapelAliasConfig = JSON.parse(await fs.readFile(configPath2, 'utf-8'));
}
loadImportConfigs();

app.get('/api/admin/templates/jadwal-advanced',
authenticateToken, requireRole(['admin']), async (req, res) => {
const workbook = new ExcelJS.Workbook();

const ws = workbook.addWorksheet('JADWAL');
ws.columns = [
{ header: 'KELAS', key: 'kelas', width: 15 },
{ header: 'Senin-1', key: 'sen1', width: 10 },
{ header: 'Senin-2', key: 'sen2', width: 10 },
{ header: 'Selasa-1', key: 'sel1', width: 10 },
];

ws.addRow({ kelas: 'X IPA 1', sen1: 'G1', sen2: 'G1', sel1: 'G3' });
ws.addRow({ kelas: '', sen1: 'MTK', sen2: 'MTK', sel1: 'FIS' });
ws.addRow({ kelas: '', sen1: 'R.301', sen2: 'R.301', sel1: 'Lab' });

workbook.addWorksheet('MASTER GURU HARIAN');
workbook.addWorksheet('JAM GURU');

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', 'attachment; filename="template-jadwal-advanced.xlsx"');
await workbook.xlsx.write(res);
res.end();
});

app.post('/api/admin/import/jadwal-advanced',
authenticateToken, requireRole(['admin']),
upload.single('file'), async (req, res) => {
try {
if (!req.file) {
return res.status(400).json({ error: 'File tidak ditemukan' });
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(req.file.buffer);

const jadwalSheet = workbook.getWorksheet(scheduleImportConfig.sheetNames.jadwal);
if (!jadwalSheet) {
return res.status(400).json({
error: `Sheet "${scheduleImportConfig.sheetNames.jadwal}" tidak ditemukan`
});
}

const [guruRows] = await global.dbPool.execute(
'SELECT id, id_guru FROM guru WHERE status = "aktif"'
);
const guruCache = {};
for (const row of guruRows) {
guruCache[row.id_guru] = row.id;
}

const [kelasRows] = await global.dbPool.execute(
'SELECT id_kelas, nama_kelas FROM kelas WHERE status = "aktif"'
);
const kelasCache = {};
for (const row of kelasRows) {
kelasCache[row.nama_kelas] = row.id_kelas;
}

const [mapelRows] = await global.dbPool.execute(
'SELECT id_mapel, kode_mapel FROM mapel WHERE status = "aktif"'
);
const mapelCache = {};
for (const row of mapelRows) {
mapelCache[row.kode_mapel] = row.id_mapel;
}

const caches = {
guru: guruCache,
kelas: kelasCache,
mapel: mapelCache,
timeSlots: scheduleImportConfig.timeSlots,
aliasMap: mapelAliasConfig.aliases
};

const rawEntries = parseJadwalSheet(jadwalSheet, scheduleImportConfig);
const { valid, errors } = validateAndTransform(rawEntries, caches);

if (req.query.dryRun === 'true') {
return res.json({
success: true,
dryRun: true,
summary: {
total: rawEntries.length,
valid: valid.length,
invalid: errors.length
},
errors
});
}

if (valid.length === 0) {
return res.status(400).json({
error: 'Tidak ada data valid untuk diimpor',
errors
});
}

const { inserted, updated } = await upsertSchedules(valid, global.dbPool);

const reportFile = `reports/import-schedule-${Date.now()}.json`;
await fs.mkdir('./reports', { recursive: true });
await fs.writeFile(reportFile, JSON.stringify({
timestamp: new Date().toISOString(),
summary: { total: rawEntries.length, inserted, updated, errors: errors.length },
errors
}, null, 2));

res.json({
success: true,
summary: {
total: rawEntries.length,
inserted,
updated,
skipped: errors.length
},
errors,
reportFile
});

} catch (err) {
console.error('❌ Import jadwal advanced error:', err);
res.status(500).json({
error: 'Gagal impor jadwal',
message: err.message
});
}
});

## UI Component (Optional)

src/components/JadwalAdvancedImportView.tsx

Features:

- File upload dengan preview 3 sheets
- Validasi client-side (file size, extension)
- Dry-run preview dengan grid visualization
- Error display per row dengan context

Integration:
import JadwalAdvancedImportView from './JadwalAdvancedImportView';

<Button onClick={() => setShowAdvancedImport(true)}>
Import Jadwal (Format Matrix)
</Button>

{showAdvancedImport && (
<JadwalAdvancedImportView
onBack={() => setShowAdvancedImport(false)}
/>
)}

## Testing Plan

Unit Tests: Parse header dengan berbagai format (Senin-1, SEN-1, senin 1)

- [x] Parse guru code (G1, G12, g3)
- [x] Mapel alias lookup (case-insensitive)
- [x] Time slot mapping

### Integration Tests

- [x] Full import dengan sample Excel 10 kelas
- [x] Upsert: INSERT new + UPDATE existing
- [x] Dry-run tidak modifikasi DB
- [x] Transaction rollback on error

### Edge Cases

- [x] Empty cells in matrix
- [x] Invalid guru code (non-numeric)
- [x] Unmapped mapel alias
- [x] Duplicate (kelas, hari, jam_ke)
- [x] File >5MB rejection

## 📈 Performance Considerations

- **Batch Size**: Transaction per kelas (max ~100 entries per kelas)
- **File Size Limit**: 5MB (config)
- **Timeout**: 60s untuk import besar
- **Memory**: Stream processing jika Excel >1000 rows

## ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Format Excel tidak sesuai | Strict validation + template download |
| Nama kelas typo | Error jelas dengan suggestion (future: fuzzy match) |
| Guru/mapel tidak ditemukan | Pre-validation + cache check |
| Duplicate key conflict | Upsert logic handle gracefully |
| Performance issue | Transaction per kelas + file size limit |

## Deployment Checklist

- Create backend/config/ folder
- Add schedule-import.config.json
- Add mapel-alias.json
- Implement scheduleImporterAdvanced.js
- Add endpoint to server_modern.js
- Test dengan sample data
- Update EXCEL_IMPORT_GUIDE.md
- Create user documentation
- Deploy to staging
- User acceptance testing
- Deploy to production

## Documentation Updates

EXCEL_IMPORT_GUIDE.md - Tambahkan section baru:

Import Jadwal Format Matrix (Advanced)

Format:
File Excel dengan 3 sheets:

- JADWAL: Matrix grid (3 baris per kelas)
- MASTER GURU HARIAN: Ketersediaan guru per hari (reserved)
- JAM GURU: Total jam mengajar (reserved)

Cara Pakai:

1. Download template: "Unduh Template Jadwal Advanced"
2. Isi sheet JADWAL:

- Kolom header: Hari-JamKe (e.g., Senin-1, Selasa-2)
- Per kelas: 3 baris (guru, mapel, ruang)

3. Upload & validasi
4. Import

## Success Metrics

- Import 100+ jadwal entries dalam <10 detik
- Error rate <5% untuk file valid
- User dapat import jadwal mingguan (30 kelas) dalam 1 file
- Zero duplicate entries setelah import

## Timeline

Week 1-2: MVP Implementation (core features)
Week 3: Testing & bug fixes
Week 4: Documentation & deployment

### To-dos

- [ ] Tambah file konfigurasi backend/config/schedule-import.config.json untuk hari, slot jam, dan opsi impor
- [ ] Tambah file konfigurasi backend/config/mapel-alias.json untuk mapping alias mapel ke kode_mapel
- [ ] Implement parser Excel untuk sheet JADWAL dengan validasi struktur matrix grid
- [ ] Bangun cache mapping guru/mapel/kelas dari database dan config
- [ ] Transform sheet JADWAL menjadi entri terstruktur per (kelas,hari,jam)
- [ ] Implement upsert idempoten ke tabel jadwal dalam transaksi per kelas
- [ ] Tambahkan endpoint POST /api/admin/import/jadwal-advanced (admin-only, dry-run support)
- [ ] Output ringkasan JSON ke reports/ dan respons API terstruktur
- [ ] Hubungkan UI untuk upload file dan tampilkan hasil dry-run