# 🔄 MIGRATION ANALYSIS - siswa_perwakilan → siswa (Base Table)

## 📊 EXECUTIVE SUMMARY

**Task:** Migrate VIEW `siswa` menjadi BASE TABLE, hapus `siswa_perwakilan`, dan adjust seluruh kode project.

**Current State:** 
- `siswa` = VIEW dari `siswa_perwakilan`
- Semua relasi menggunakan `siswa_perwakilan.id_siswa` sebagai FK
- Backend: 30+ query references ke `siswa_perwakilan`
- Frontend: 3 endpoint references ke `/api/siswa-perwakilan/`

**Target State:**
- `siswa` = BASE TABLE (dari `siswa_perwakilan`)
- Hapus tabel `siswa_perwakilan`
- `user_id` menjadi NULLABLE (akun opsional)
- Semua relasi tetap menggunakan `id_siswa` untuk backward compatibility

**Risk Level:** 🔴 HIGH - Banyak foreign keys dan query dependencies

---

## 🗂️ DATABASE STRUCTURE ANALYSIS

### Current Table: `siswa_perwakilan`

```sql
CREATE TABLE `siswa_perwakilan` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `id_siswa` int(11) NOT NULL UNIQUE,           -- ← FK target (CRITICAL)
  `user_id` int(11) NOT NULL,                   -- ← Will be NULLABLE
  `username` varchar(50) NOT NULL,
  `nis` varchar(30) NOT NULL UNIQUE,
  `nama` varchar(100) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `jabatan` varchar(50) DEFAULT 'Sekretaris Kelas',
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `telepon_orangtua` varchar(20) DEFAULT NULL,
  `telepon_siswa` varchar(20) DEFAULT NULL,
  `status` enum('aktif','tidak_aktif','lulus','pindah','alumni','keluar') NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Current VIEW: `siswa`

```sql
CREATE VIEW `siswa` AS 
SELECT 
  `siswa_perwakilan`.`id` AS `id`, 
  `siswa_perwakilan`.`id_siswa` AS `id_siswa`,     -- ← FK key used everywhere
  `siswa_perwakilan`.`user_id` AS `user_id`, 
  -- ... all other columns
FROM `siswa_perwakilan`;
```

### Foreign Key Dependencies (CRITICAL!)

| Table | Column | References | Count |
|-------|--------|------------|-------|
| `absensi_siswa` | `siswa_id` | `siswa_perwakilan(id_siswa)` | FK constraint |
| `pengajuan_izin_siswa` | `siswa_id` | `siswa_perwakilan(id_siswa)` | FK constraint |
| `pengajuan_banding_absen` | `siswa_id` | `siswa_perwakilan(id_siswa)` | FK constraint |
| `absensi_guru` | `siswa_pencatat_id` | `siswa_perwakilan(id_siswa)` | FK constraint |
| `detail_pengajuan_izin_siswa` | (via `pengajuan_id`) | Indirect | Via parent FK |

**Total FK constraints to migrate:** 4 direct FKs

---

## 🔍 CODE IMPACT ANALYSIS

### Backend: server_modern.js

#### Direct References to `siswa_perwakilan` (30+ locations)

**Category 1: SELECT Queries (20+ occurrences)**

```javascript
// Line 775-779: Admin list siswa
FROM siswa_perwakilan sp
JOIN kelas k ON sp.kelas_id = k.id_kelas
JOIN users u ON sp.user_id = u.id

// Line 1489: Siswa info endpoint
FROM siswa_perwakilan sp
LEFT JOIN kelas k ON sp.kelas_id = k.id_kelas

// Line 2746: Pengajuan izin list
FROM siswa_perwakilan sp
WHERE sp.id_siswa = ?

// Line 2903-2918: Multiple absensi queries
FROM siswa_perwakilan s
WHERE s.kelas_id = ?

// Line 2988: Pengajuan with siswa details
JOIN siswa_perwakilan s ON pi.siswa_id = s.id_siswa

// Line 3234, 3282: Absensi siswa reports
JOIN siswa_perwakilan s ON a.siswa_id = s.id_siswa

// Line 3749, 3812: Banding absen
JOIN siswa_perwakilan sp ON pba.siswa_id = sp.id_siswa

// Line 4030: Pengajuan guru approval
JOIN siswa_perwakilan sp ON pi.siswa_id = sp.id_siswa

// Line 4272, 4335: Absensi guru reports
JOIN siswa_perwakilan sp ON ag.siswa_pencatat_id = sp.id_siswa
```

**Category 2: INSERT/UPDATE/DELETE (6+ occurrences)**

```javascript
// Line 827: Create siswa account
INSERT INTO siswa_perwakilan (nis, nama, kelas_id, user_id, jabatan, status) 
VALUES (?, ?, ?, ?, ?, "aktif")

// Line 1522: Check duplicate NIS
SELECT id FROM siswa_perwakilan WHERE nis = ?

// Line 1539: Insert new siswa
INSERT INTO siswa_perwakilan (id_siswa, user_id, username, nis, nama, ...) 
VALUES (?, ?, ?, ?, ?, ...)

// Line 1576: Update siswa
UPDATE siswa_perwakilan SET username = ?, nis = ?, ... WHERE id = ?

// Line 1596, 1604: Delete siswa
SELECT user_id FROM siswa_perwakilan WHERE id = ?
DELETE FROM siswa_perwakilan WHERE id = ?
```

**Category 3: Count Queries (3+ occurrences)**

```javascript
// Line 613: Count active students
SELECT COUNT(*) as count FROM siswa_perwakilan WHERE status = "aktif"

// Line 779: Pagination count
SELECT COUNT(*) as total FROM siswa_perwakilan sp 
JOIN kelas k ON sp.kelas_id = k.id_kelas

// Line 2910, 2957: Class student counts
FROM siswa_perwakilan s WHERE s.kelas_id = ?
```

---

### Frontend Impact

#### API Endpoints Used (3 locations)

```typescript
// Index_Modern.tsx line 91 (2 occurrences)
await fetch('/api/siswa-perwakilan/info', { ... });

// StudentDashboard_Modern.tsx line 472
await fetch('/api/siswa-perwakilan/info', { ... });
```

**Frontend Changes Required:** Update 3 endpoint paths from `/siswa-perwakilan/` to `/siswa/`

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Database Schema Migration ✅

**Step 1.1: Backup Current Data**
```sql
-- Create backup table
CREATE TABLE siswa_perwakilan_backup LIKE siswa_perwakilan;
INSERT INTO siswa_perwakilan_backup SELECT * FROM siswa_perwakilan;
```

**Step 1.2: Drop View and Foreign Keys**
```sql
-- Drop existing view
DROP VIEW IF EXISTS siswa;

-- Drop foreign key constraints
ALTER TABLE absensi_siswa DROP FOREIGN KEY fk_absensi_siswa_siswa;
ALTER TABLE absensi_guru DROP FOREIGN KEY fk_absensi_siswa;
ALTER TABLE pengajuan_izin_siswa DROP FOREIGN KEY fk_pengajuan_siswa;
ALTER TABLE pengajuan_banding_absen DROP FOREIGN KEY fk_banding_absen_siswa;
```

**Step 1.3: Rename Table**
```sql
-- Rename siswa_perwakilan to siswa
RENAME TABLE siswa_perwakilan TO siswa;
```

**Step 1.4: Modify Schema**
```sql
-- Make user_id NULLABLE (allow siswa without account)
ALTER TABLE siswa 
  MODIFY COLUMN user_id int(11) NULL DEFAULT NULL COMMENT 'NULL = siswa belum punya akun login';

-- Make username NULLABLE too
ALTER TABLE siswa 
  MODIFY COLUMN username varchar(50) NULL DEFAULT NULL;

-- Add index on id_siswa if not exists (it's unique already)
-- Already has UNIQUE constraint, good!
```

**Step 1.5: Recreate Foreign Keys**
```sql
-- Recreate FK constraints pointing to new table name
ALTER TABLE absensi_siswa
  ADD CONSTRAINT fk_absensi_siswa_siswa 
  FOREIGN KEY (siswa_id) REFERENCES siswa(id_siswa) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE absensi_guru
  ADD CONSTRAINT fk_absensi_siswa 
  FOREIGN KEY (siswa_pencatat_id) REFERENCES siswa(id_siswa) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pengajuan_izin_siswa
  ADD CONSTRAINT fk_pengajuan_siswa 
  FOREIGN KEY (siswa_id) REFERENCES siswa(id_siswa) 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pengajuan_banding_absen
  ADD CONSTRAINT fk_banding_absen_siswa 
  FOREIGN KEY (siswa_id) REFERENCES siswa(id_siswa) 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### Phase 2: Backend Code Migration 🔄

**Step 2.1: Global Find & Replace**

```javascript
// Find: siswa_perwakilan
// Replace: siswa

// This affects 30+ locations in server_modern.js
```

**Step 2.2: Adjust Account Creation Logic**

**BEFORE (Required Account):**
```javascript
// Line 825-830: Current logic - user_id is REQUIRED
const [userResult] = await db.execute(
  'INSERT INTO users (username, password, role, status) VALUES (?, ?, "siswa-perwakilan", "aktif")',
  [username, hashedPassword]
);
const userId = userResult.insertId;

await db.execute(
  'INSERT INTO siswa_perwakilan (nis, nama, kelas_id, user_id, jabatan, status) VALUES (?, ?, ?, ?, ?, "aktif")',
  [nis, nama, kelasId, userId, jabatan]
);
```

**AFTER (Optional Account):**
```javascript
// New logic - user_id is OPTIONAL (can be NULL)

// Step 1: Create siswa record FIRST (without account)
const [siswaResult] = await db.execute(
  `INSERT INTO siswa 
   (id_siswa, nis, nama, kelas_id, jabatan, jenis_kelamin, email, alamat, 
    telepon_orangtua, telepon_siswa, status, user_id, username) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif', NULL, NULL)`,
  [id_siswa, nis, nama, kelas_id, jabatan, jenis_kelamin, email, 
   alamat, telepon_orangtua, telepon_siswa]
);

// Step 2: Optionally create user account (if registerAccount = true)
if (registerAccount) {
  const [userResult] = await db.execute(
    'INSERT INTO users (username, password, role, status) VALUES (?, ?, "siswa", "aktif")',
    [username, hashedPassword]
  );
  const userId = userResult.insertId;
  
  // Step 3: Link user account to siswa
  await db.execute(
    'UPDATE siswa SET user_id = ?, username = ? WHERE id = ?',
    [userId, username, siswaResult.insertId]
  );
}
```

**Step 2.3: Update Validation Logic**

```javascript
// BEFORE: user_id is required
if (!req.body.user_id) {
  return res.error('user_id is required');
}

// AFTER: user_id is optional
// Remove validation for user_id
// Add validation: if username provided, user_id must also be provided
if (req.body.username && !req.body.user_id) {
  return res.error('user_id required when username is provided');
}
```

**Step 2.4: Update JOIN Logic**

```javascript
// BEFORE: INNER JOIN (requires account)
FROM siswa_perwakilan sp
JOIN users u ON sp.user_id = u.id

// AFTER: LEFT JOIN (account optional)
FROM siswa s
LEFT JOIN users u ON s.user_id = u.id
```

---

### Phase 3: Frontend Code Migration 📱

**Step 3.1: Update API Endpoints**

```typescript
// BEFORE: /api/siswa-perwakilan/info
// AFTER: /api/siswa/info

// Files to update:
// - src/pages/Index_Modern.tsx (line 91) - 2 occurrences
// - src/components/StudentDashboard_Modern.tsx (line 472) - 1 occurrence
```

**Step 3.2: No Type Changes Required**

```typescript
// Frontend already uses these fields - NO CHANGE NEEDED:
interface Student {
  id: number;              // PK - unchanged
  id_siswa: number;        // Unique key - unchanged
  user_id: number | null;  // Now nullable - add | null
  username: string | null; // Now nullable - add | null
  nis: string;
  nama: string;
  kelas_id: number;
  // ... rest unchanged
}
```

---

## 📋 MIGRATION CHECKLIST

### Pre-Migration ✅

- [ ] **Backup database** (full dump)
- [ ] **Test in development** environment first
- [ ] **Document rollback** procedure
- [ ] **Notify team** about maintenance window
- [ ] **Stop application** services (backend, frontend)

### Database Migration ✅

- [ ] Create backup table `siswa_perwakilan_backup`
- [ ] Drop VIEW `siswa`
- [ ] Drop 4 foreign key constraints
- [ ] Rename `siswa_perwakilan` → `siswa`
- [ ] Modify `user_id` to NULLABLE
- [ ] Modify `username` to NULLABLE
- [ ] Recreate 4 foreign key constraints
- [ ] Verify FK constraints exist
- [ ] Test SELECT queries work

### Backend Migration ✅

- [ ] Global replace: `siswa_perwakilan` → `siswa` (30+ locations)
- [ ] Update account creation logic (make optional)
- [ ] Update validation logic (remove user_id requirement)
- [ ] Update JOIN queries (INNER → LEFT JOIN where needed)
- [ ] Update API endpoint: `/api/admin/siswa-perwakilan` → `/api/admin/siswa`
- [ ] Update API endpoint: `/api/siswa-perwakilan/info` → `/api/siswa/info`
- [ ] Test all CRUD operations
- [ ] Test account creation (with & without account)

### Frontend Migration ✅

- [ ] Update endpoint: `/api/siswa-perwakilan/info` → `/api/siswa/info` (3 locations)
- [ ] Update TypeScript types: Add `| null` to `user_id` and `username`
- [ ] Test login flow
- [ ] Test siswa dashboard
- [ ] Test admin siswa management

### Post-Migration Testing ✅

- [ ] **CRUD Operations:**
  - [ ] Create siswa without account ✅
  - [ ] Create siswa with account ✅
  - [ ] Update siswa data ✅
  - [ ] Delete siswa ✅
  
- [ ] **Account Registration:**
  - [ ] Register account for existing siswa ✅
  - [ ] Login with siswa account ✅
  - [ ] Update siswa profile ✅
  
- [ ] **Related Features:**
  - [ ] Absensi siswa (check FK) ✅
  - [ ] Pengajuan izin (check FK) ✅
  - [ ] Banding absen (check FK) ✅
  - [ ] Absensi guru with siswa_pencatat_id (check FK) ✅
  
- [ ] **Reports:**
  - [ ] Laporan absensi siswa ✅
  - [ ] Laporan ketidakhadiran ✅
  - [ ] Rekap per kelas ✅

### Rollback Plan 🔄

If migration fails:

```sql
-- Step 1: Drop new constraints
ALTER TABLE absensi_siswa DROP FOREIGN KEY fk_absensi_siswa_siswa;
ALTER TABLE absensi_guru DROP FOREIGN KEY fk_absensi_siswa;
ALTER TABLE pengajuan_izin_siswa DROP FOREIGN KEY fk_pengajuan_siswa;
ALTER TABLE pengajuan_banding_absen DROP FOREIGN KEY fk_banding_absen_siswa;

-- Step 2: Rename back
RENAME TABLE siswa TO siswa_perwakilan;

-- Step 3: Restore view
CREATE VIEW siswa AS SELECT * FROM siswa_perwakilan;

-- Step 4: Recreate original constraints
ALTER TABLE absensi_siswa
  ADD CONSTRAINT fk_absensi_siswa_siswa 
  FOREIGN KEY (siswa_id) REFERENCES siswa_perwakilan(id_siswa) 
  ON DELETE CASCADE ON UPDATE CASCADE;
-- (repeat for other 3 FKs)

-- Step 5: Restore code from git
git checkout server_modern.js
git checkout src/pages/Index_Modern.tsx
git checkout src/components/StudentDashboard_Modern.tsx
```

---

## 🎯 DECISION POINTS

### ✅ CONFIRMED DECISIONS (Using Defaults)

| Decision | Option | Rationale |
|----------|--------|-----------|
| **1. Relasi Akun** | A: `siswa.user_id` (nullable) | Backward compatible, minimal schema change |
| **2. Kunci Referensi** | A: Tetap `id_siswa` | Minimal FK migration, safer |
| **3. Kolom Perwakilan** | A: Pertahankan semua | Keep all fields for backward compatibility |

### Key Changes Summary:

1. ✅ **user_id: NOT NULL → NULL** (allow siswa without account)
2. ✅ **username: NOT NULL → NULL** (allow siswa without account)
3. ✅ **Table rename:** `siswa_perwakilan` → `siswa`
4. ✅ **Keep all columns** (jabatan, telepon_orangtua, etc.)
5. ✅ **Keep id_siswa** as FK target (no need to migrate to PK `id`)

---

## 🔒 RISK MITIGATION

### High Risks ⚠️

**Risk 1: FK Constraint Violations**
- **Mitigation:** Drop all FKs before rename, recreate after
- **Verification:** Run FK check queries before proceeding

**Risk 2: Query Failures During Migration**
- **Mitigation:** Stop application services before DB changes
- **Verification:** Test all queries in staging first

**Risk 3: Data Loss**
- **Mitigation:** Full backup before migration + backup table
- **Verification:** Row count before = row count after

**Risk 4: Code References Missed**
- **Mitigation:** Global search with regex for all variations
- **Verification:** Grep for `siswa_perwakilan`, `siswa-perwakilan`, `siswaPerwakilan`

### Medium Risks ⚠️

**Risk 5: Frontend Cache Issues**
- **Mitigation:** Clear localStorage, force refresh
- **Verification:** Test in incognito mode

**Risk 6: Session Tokens Invalid**
- **Mitigation:** Force re-login after migration
- **Verification:** Test login flow post-migration

---

## 📊 ESTIMATED IMPACT

### Database:
- **Tables Modified:** 1 (siswa_perwakilan → siswa)
- **Views Dropped:** 1 (siswa view)
- **FK Constraints Recreated:** 4
- **Columns Modified:** 2 (user_id, username)
- **Data Loss Risk:** 🟢 LOW (rename operation is atomic)

### Backend:
- **Files Modified:** 1 (server_modern.js)
- **Lines Changed:** ~50+ lines
- **Endpoints Modified:** 2 (/api/admin/siswa, /api/siswa/info)
- **Query Changes:** 30+ query references
- **Breaking Changes:** ⚠️ MEDIUM (account creation logic)

### Frontend:
- **Files Modified:** 2 (Index_Modern.tsx, StudentDashboard_Modern.tsx)
- **Lines Changed:** ~6 lines
- **API Calls Modified:** 3 fetch calls
- **Type Changes:** 2 fields (add | null)
- **Breaking Changes:** 🟢 LOW (minimal changes)

### Total Estimated Time:
- **Database Migration:** 15 minutes
- **Backend Migration:** 30 minutes
- **Frontend Migration:** 10 minutes
- **Testing:** 60 minutes
- **Total:** ~2 hours

---

## ✅ SUCCESS CRITERIA

Migration is successful when:

1. ✅ Table `siswa` exists as BASE TABLE (not view)
2. ✅ Table `siswa_perwakilan` no longer exists
3. ✅ All 4 FK constraints point to `siswa(id_siswa)`
4. ✅ Column `user_id` and `username` are NULLABLE
5. ✅ Can create siswa WITHOUT account (user_id = NULL)
6. ✅ Can create siswa WITH account (user_id = <id>)
7. ✅ Can register account for existing siswa
8. ✅ All queries in server_modern.js use `FROM/JOIN siswa`
9. ✅ All frontend endpoints use `/api/siswa/`
10. ✅ Login as siswa works correctly
11. ✅ All related features work (absensi, pengajuan, reports)
12. ✅ No console errors in browser
13. ✅ No SQL errors in backend logs

---

## 🚀 NEXT STEPS

**Ready for Implementation?**

Please confirm:

1. ✅ **Review this analysis** - All risks understood?
2. ✅ **Backup ready** - Database backup taken?
3. ✅ **Test environment** - Will test in dev first?
4. ✅ **Maintenance window** - Can stop services for 2 hours?
5. ✅ **Rollback plan** - Team ready to rollback if needed?

**After confirmation, I will:**

1. Generate complete SQL migration script
2. Create backend code patches (find & replace script)
3. Create frontend code patches
4. Provide step-by-step execution commands
5. Provide verification queries for each step

**Reply with:** 
- ✅ "CONFIRMED - Proceed with migration" 
- OR
- ❌ "WAIT - I have questions about: [specific concern]"

---

**Document Version:** 1.0  
**Created:** 2025-10-04  
**Status:** 🟡 AWAITING CONFIRMATION  
**Risk Level:** 🔴 HIGH (Requires careful execution)

