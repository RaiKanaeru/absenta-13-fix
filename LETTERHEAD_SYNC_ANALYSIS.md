# 🔍 Letterhead System - Analisis Singkronisasi

## 📋 Masalah yang Ditemukan

### ❌ **Critical Issues**

1. **Database Schema Tidak Lengkap**
   - `system_config` table belum ada migration SQL yang proper
   - Table mungkin belum ter-create dengan benar di database
   - Column type perlu diupdate ke `LONGTEXT` untuk support base64 images

2. **Data Flow Inconsistency**
   - Template JSON file: `backend/config/report-letterhead.json`
   - Backend expects: `letterhead_{reportKey}` format
   - Seed script: Perlu verification dan error handling

3. **Backend Endpoints**
   - Property inconsistency: `textLines` vs `lines`
   - Logo property: `logo`, `logoLeftUrl`, `logoRightUrl` tidak konsisten
   - Fallback mechanism perlu diperkuat

4. **Export Routes**
   - Some routes use `textLines`, some use `lines`
   - Letterhead fetch logic berbeda-beda per endpoint
   - Need centralized `fetchLetterheadConfig()` helper

---

## 🔧 Rencana Perbaikan

### **1. Database Setup** ✅
- [x] Create migration SQL file
- [ ] Run migration ke database
- [ ] Verify table structure

### **2. Standardize JSON Schema** ✅
```json
{
  "enabled": true,
  "logoLeftUrl": "/uploads/letterheads/logo-left.png",
  "logoRightUrl": "/uploads/letterheads/logo-right.png",
  "lines": [
    "Line 1",
    "Line 2",
    "..."
  ],
  "alignment": "center"
}
```

**Properties**:
- `enabled`: boolean
- `logoLeftUrl`: string (path atau base64)
- `logoRightUrl`: string (path atau base64)
- `lines`: array of strings
- `alignment`: "left" | "center" | "right"

### **3. Backend Endpoint Standardization**
- [ ] Update `GET /api/admin/letterhead` to use consistent schema
- [ ] Update `POST /api/admin/letterhead` to validate schema
- [ ] Update `GET /api/admin/letterhead/preview` to use standard schema

### **4. Export Routes Refactoring**
- [ ] Create `fetchLetterheadConfig(reportKey)` helper function
- [ ] Update all export endpoints to use helper
- [ ] Ensure consistent property names (`lines` not `textLines`)

### **5. Seed Script Enhancement**
- [ ] Add connection error handling
- [ ] Add schema validation before insert
- [ ] Add verification after seeding
- [ ] Add rollback on error

### **6. Testing & Verification**
- [ ] Create verification script
- [ ] Test all endpoints
- [ ] Test all export routes
- [ ] Test frontend component

---

## 📊 Current vs Target Architecture

### Current (Broken)
```
┌──────────────────┐
│ JSON Template    │ (backend/config/report-letterhead.json)
│ (Not used)       │
└──────────────────┘
         ❌
         
┌──────────────────┐
│ system_config    │ (Maybe not exists)
│ (No migration)   │
└──────────────────┘
         ❌
         
┌──────────────────┐       ┌──────────────────┐
│ Backend Endpoint │──❌──│ Inconsistent     │
│ GET/POST         │       │ Property Names   │
└──────────────────┘       └──────────────────┘
         ❌
         
┌──────────────────┐       ┌──────────────────┐
│ Export Routes    │──❌──│ Different Fetch  │
│ (6 endpoints)    │       │ Logic Each       │
└──────────────────┘       └──────────────────┘
```

### Target (Fixed)
```
┌──────────────────┐
│ JSON Template    │ (backend/config/report-letterhead.json)
│ (Template only)  │
└────────┬─────────┘
         │ seed-letterhead.cjs
         ↓
┌──────────────────────────────────────────────┐
│ system_config TABLE                          │
│ ┌──────────────────────────────────────────┐ │
│ │ letterhead_global                        │ │
│ │ letterhead_presensi-siswa                │ │
│ │ letterhead_rekap-ketidakhadiran          │ │
│ │ letterhead_rekap-ketidakhadiran-guru     │ │
│ │ letterhead_banding-absen                 │ │
│ │ letterhead_jadwal-global                 │ │
│ │ letterhead_jadwal-smkn13                 │ │
│ │ letterhead_teacher-summary               │ │
│ │ letterhead_student-summary               │ │
│ └──────────────────────────────────────────┘ │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ Backend Endpoints                            │
│ ┌──────────────────────────────────────────┐ │
│ │ GET /api/admin/letterhead?reportKey=X    │ │
│ │ POST /api/admin/letterhead               │ │
│ │ GET /api/admin/letterhead/preview        │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Consistent Schema:                           │
│ { enabled, logoLeftUrl, logoRightUrl,        │
│   lines[], alignment }                       │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ fetchLetterheadConfig(reportKey) Helper      │
│ ┌──────────────────────────────────────────┐ │
│ │ 1. Try report-specific letterhead        │ │
│ │ 2. Fallback to letterhead_global         │ │
│ │ 3. Fallback to default hardcoded         │ │
│ └──────────────────────────────────────────┘ │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ Export Routes (9 endpoints)                  │
│ ┌──────────────────────────────────────────┐ │
│ │ All use: fetchLetterheadConfig(key)      │ │
│ │ All use: consistent property names       │ │
│ │ All support: Excel + PDF export          │ │
│ └──────────────────────────────────────────┘ │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│ Frontend Component                           │
│ ┌──────────────────────────────────────────┐ │
│ │ ReportLetterheadSettings.tsx             │ │
│ │ - Load config via GET endpoint           │ │
│ │ - Save config via POST endpoint          │ │
│ │ - Preview via preview endpoint           │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 🔑 Key Fixes Required

### **A. Migration SQL** ✅
```sql
-- database/migrations/2025-10-22-system-config-letterhead.sql
CREATE TABLE IF NOT EXISTS `system_config` (
  `config_key` VARCHAR(255) NOT NULL PRIMARY KEY,
  `config_value` LONGTEXT NULL,  -- LONGTEXT for base64 images
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

### **B. Standardized Schema**
**Property Name Mapping**:
```javascript
// ❌ OLD (Inconsistent)
{
  textLines: [...],     // WRONG
  logo: "...",          // WRONG
  headerLines: [...]    // WRONG
}

// ✅ NEW (Standardized)
{
  lines: [...],         // CORRECT
  logoLeftUrl: "...",   // CORRECT
  logoRightUrl: "...",  // CORRECT
  alignment: "center"   // CORRECT
}
```

### **C. Backend Helper Function**
```javascript
// backend/utils/letterheadHelper.js
async function fetchLetterheadConfig(reportKey = 'global') {
  try {
    // Try report-specific config
    const [rows] = await db.execute(
      'SELECT config_value FROM system_config WHERE config_key = ?',
      [`letterhead_${reportKey}`]
    );
    
    if (rows.length > 0) {
      return JSON.parse(rows[0].config_value);
    }
    
    // Fallback to global
    const [globalRows] = await db.execute(
      'SELECT config_value FROM system_config WHERE config_key = ?',
      ['letterhead_global']
    );
    
    if (globalRows.length > 0) {
      return JSON.parse(globalRows[0].config_value);
    }
    
    // Fallback to default
    return {
      enabled: true,
      logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
      logoRightUrl: "/uploads/letterheads/logo-smk.png",
      lines: [
        "PEMERINTAH PROVINSI DKI JAKARTA",
        "DINAS PENDIDIKAN",
        "SMK NEGERI 13 JAKARTA",
        "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910",
        "Telp: (021) 4600005 | Email: smkn13jakarta@jakarta.go.id"
      ],
      alignment: "center"
    };
  } catch (error) {
    console.error('Error fetching letterhead config:', error);
    return null;
  }
}

module.exports = { fetchLetterheadConfig };
```

### **D. Export Routes Update**
```javascript
// backend/routes/export.js
const { fetchLetterheadConfig } = require('../utils/letterheadHelper');

// In each export endpoint:
router.get('/presensi-siswa/excel', async (req, res) => {
  try {
    // Fetch letterhead
    const letterheadConfig = await fetchLetterheadConfig('presensi-siswa');
    
    // Build Excel with letterhead
    const workbook = await buildExcel(data, {
      letterhead: letterheadConfig,
      // ... other options
    });
    
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
});
```

---

## 📝 Implementation Checklist

### Phase 1: Database Setup
- [x] Create migration SQL file
- [ ] Run migration: `mysql -u root -p absenta13 < database/migrations/2025-10-22-system-config-letterhead.sql`
- [ ] Verify table exists: `DESCRIBE system_config;`
- [ ] Verify column type: `SHOW CREATE TABLE system_config;`

### Phase 2: Seed Data
- [ ] Update `scripts/seed-letterhead.cjs` with proper error handling
- [ ] Run seed script: `node scripts/seed-letterhead.cjs`
- [ ] Verify data seeded: `SELECT config_key FROM system_config WHERE config_key LIKE 'letterhead_%';`

### Phase 3: Backend Standardization
- [ ] Create `backend/utils/letterheadHelper.js`
- [ ] Update `GET /api/admin/letterhead` endpoint
- [ ] Update `POST /api/admin/letterhead` endpoint
- [ ] Update `GET /api/admin/letterhead/preview` endpoint

### Phase 4: Export Routes Refactoring
- [ ] Update `backend/routes/export.js` to import helper
- [ ] Replace all inline letterhead fetch with helper call
- [ ] Ensure all use `lines` property (not `textLines`)
- [ ] Test all 9 export endpoints

### Phase 5: Testing
- [ ] Create `scripts/verify-letterhead.cjs` script
- [ ] Test database connection
- [ ] Test letterhead fetch for all report keys
- [ ] Test backend endpoints
- [ ] Test frontend component
- [ ] Test export functionality

---

## 🧪 Testing Plan

### Manual Testing
```bash
# 1. Database verification
mysql -u root -p absenta13
> DESCRIBE system_config;
> SELECT config_key FROM system_config WHERE config_key LIKE 'letterhead_%';
> SELECT LENGTH(config_value) FROM system_config WHERE config_key = 'letterhead_global';

# 2. Seed verification
node scripts/seed-letterhead.cjs

# 3. Backend endpoint testing
curl -X GET "http://localhost:3001/api/admin/letterhead?reportKey=global" \
  -H "Authorization: Bearer TOKEN"

# 4. Export testing
curl -X GET "http://localhost:3001/api/export/presensi-siswa/excel?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer TOKEN" \
  --output test.xlsx
```

### Automated Testing
```bash
# Run verification script
node scripts/verify-letterhead.cjs

# Expected output:
# ✅ Database connection successful
# ✅ system_config table exists
# ✅ 9 letterhead configurations found
# ✅ All configs have valid JSON
# ✅ Backend endpoints accessible
```

---

## 🎯 Success Criteria

✅ **Database**:
- [ ] `system_config` table exists
- [ ] Table has `LONGTEXT` column for `config_value`
- [ ] 9 letterhead configs exist in database

✅ **Backend**:
- [ ] All endpoints use consistent schema
- [ ] Helper function centralized
- [ ] Error handling robust

✅ **Export**:
- [ ] All export endpoints use letterhead helper
- [ ] All use `lines` property consistently
- [ ] Excel and PDF both render letterhead correctly

✅ **Frontend**:
- [ ] Component loads letterhead from backend
- [ ] Component saves letterhead to backend
- [ ] Preview works correctly
- [ ] Image upload and compression works

✅ **End-to-End**:
- [ ] User can configure letterhead via UI
- [ ] Letterhead appears in all exported reports
- [ ] Different report types can have different letterheads
- [ ] Fallback to global letterhead works

---

**Status**: 🔧 **IN PROGRESS**  
**Priority**: 🔴 **CRITICAL**  
**Date**: 22 Oktober 2025

