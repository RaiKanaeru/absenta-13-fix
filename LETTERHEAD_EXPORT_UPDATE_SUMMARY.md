# 📦 Letterhead Export Routes Update Summary

**Date**: 22 Oktober 2025, 13:10 WIB  
**Status**: ✅ **IN PROGRESS**

---

## 🎯 Objective

Update semua export routes di `backend/routes/export.js` untuk menggunakan centralized `fetchLetterheadConfig()` helper function dari `backend/utils/letterheadHelper.js`.

---

## ✅ Changes Made

### 1. Import Statement
```javascript
// Added import
import { fetchLetterheadConfig } from '../utils/letterheadHelper.js';
```

### 2. Pattern Replacement

**Before** (Inline fetch - DEPRECATED):
```javascript
// Fetch letterhead config
let letterheadConfig = null;
try {
    const [letterheadData] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_xxx']
    );
    
    if (letterheadData.length > 0) {
        letterheadConfig = JSON.parse(letterheadData[0].config_value);
    }
} catch (error) {
    console.log('⚠️ No custom letterhead config found');
}

// Fallback to default
if (!letterheadConfig) {
    letterheadConfig = {
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
}
```

**After** (Using helper - CORRECT):
```javascript
// Fetch letterhead config using centralized helper
const letterheadConfig = await fetchLetterheadConfig('xxx');
```

---

## 📋 Endpoints to Update

### Summary

| # | Endpoint | Report Key | Status |
|---|----------|------------|--------|
| 1 | `/teacher-summary` | `teacher-summary` | 🔧 Pending |
| 2 | `/student-summary` | `student-summary` | 🔧 Pending |
| 3 | `/presensi-siswa/excel` | `presensi-siswa` | 🔧 Pending |
| 4 | `/rekap-ketidakhadiran/excel` | `rekap-ketidakhadiran` | 🔧 Pending |
| 5 | `/rekap-ketidakhadiran-guru/excel` | `rekap-ketidakhadiran-guru` | 🔧 Pending |
| 6 | `/banding-absen/excel` | `banding-absen` | 🔧 Pending |
| 7 | `/jadwal-global/excel` | `jadwal-global` | 🔧 Pending |
| 8 | `/jadwal-smkn13/excel` | `jadwal-smkn13` | 🔧 Pending |

---

## 🔍 Detailed Changes per Endpoint

### 1. Teacher Summary
**Location**: Line ~20  
**Report Key**: `teacher-summary`

**Change**:
```javascript
// OLD: Lines ~70-85 (inline fetch)
const letterheadConfig = await fetchLetterheadConfig('teacher-summary');
```

### 2. Student Summary  
**Location**: Line ~150  
**Report Key**: `student-summary`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('student-summary');
```

### 3. Presensi Siswa Excel
**Location**: Line ~280  
**Report Key**: `presensi-siswa`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('presensi-siswa');
```

### 4. Rekap Ketidakhadiran Excel
**Location**: Line ~410  
**Report Key**: `rekap-ketidakhadiran`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('rekap-ketidakhadiran');
```

### 5. Rekap Ketidakhadiran Guru Excel
**Location**: Line ~540  
**Report Key**: `rekap-ketidakhadiran-guru`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('rekap-ketidakhadiran-guru');
```

### 6. Banding Absen Excel
**Location**: Line ~670  
**Report Key**: `banding-absen`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('banding-absen');
```

### 7. Jadwal Global Excel
**Location**: Line ~800  
**Report Key**: `jadwal-global`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('jadwal-global');
```

### 8. Jadwal SMKN13 Excel
**Location**: Line ~930  
**Report Key**: `jadwal-smkn13`

**Change**:
```javascript
const letterheadConfig = await fetchLetterheadConfig('jadwal-smkn13');
```

---

## 📊 Progress Tracking

### Completed
- [x] Import letterhead helper
- [ ] Update teacher-summary endpoint
- [ ] Update student-summary endpoint
- [ ] Update presensi-siswa endpoint
- [ ] Update rekap-ketidakhadiran endpoint
- [ ] Update rekap-ketidakhadiran-guru endpoint
- [ ] Update banding-absen endpoint
- [ ] Update jadwal-global endpoint
- [ ] Update jadwal-smkn13 endpoint

### Testing
- [ ] Test teacher-summary export
- [ ] Test student-summary export
- [ ] Test presensi-siswa export
- [ ] Test rekap-ketidakhadiran export
- [ ] Test rekap-ketidakhadiran-guru export
- [ ] Test banding-absen export
- [ ] Test jadwal-global export
- [ ] Test jadwal-smkn13 export

---

## 🎯 Benefits

### Before (Inline Fetch)
❌ **Cons**:
- Code duplication (8 times!)
- Inconsistent fallback logic
- Hard to maintain
- Different property names (`textLines` vs `lines`)
- No centralized error handling

### After (Helper Function)
✅ **Pros**:
- DRY principle (Don't Repeat Yourself)
- Consistent fallback mechanism
- Easy to maintain (single source of truth)
- Standardized property names (`lines`)
- Centralized error handling
- Better testability

---

## 🚨 Critical Points

### Property Name Consistency
Ensure all exports use consistent property names:
- ✅ `lines` (CORRECT)
- ❌ `textLines` (WRONG)
- ❌ `headerLines` (WRONG)

### Fallback Mechanism
Helper provides automatic fallback:
1. Try report-specific: `letterhead_{reportKey}`
2. Fallback to global: `letterhead_global`
3. Fallback to hardcoded default

### Error Handling
Helper handles all errors gracefully:
- Database connection errors
- JSON parsing errors
- Missing configurations
- Always returns valid config object

---

## 🧪 Testing Plan

### Unit Testing
```javascript
describe('fetchLetterheadConfig', () => {
    it('should fetch report-specific letterhead', async () => {
        const config = await fetchLetterheadConfig('teacher-summary');
        expect(config).toHaveProperty('enabled');
        expect(config).toHaveProperty('lines');
    });
    
    it('should fallback to global letterhead', async () => {
        const config = await fetchLetterheadConfig('non-existent');
        expect(config).toBeDefined();
    });
});
```

### Integration Testing
```bash
# Test each export endpoint
curl -X GET "http://localhost:3001/api/export/teacher-summary?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer TOKEN" \
  --output test-teacher-summary.xlsx

# Verify letterhead in output
# Open Excel file and check header section
```

### Manual Testing Checklist
- [ ] Export without custom letterhead (use default)
- [ ] Export with global letterhead
- [ ] Export with report-specific letterhead
- [ ] Export with large logo images (>1MB)
- [ ] Export with different alignment settings
- [ ] Export with empty lines array
- [ ] Export with disabled letterhead

---

## 📝 Migration Steps

### Step 1: Backup Current File
```bash
cp backend/routes/export.js backend/routes/export.js.backup
```

### Step 2: Add Import
```javascript
import { fetchLetterheadConfig } from '../utils/letterheadHelper.js';
```

### Step 3: Find & Replace Pattern
Search for:
```javascript
// Fetch letterhead config
let letterheadConfig = null;
try {
    const [letterheadData] = await db.execute(
        'SELECT config_value FROM system_config WHERE config_key = ? LIMIT 1',
        ['letterhead_xxx']
    );
    
    if (letterheadData.length > 0) {
        letterheadConfig = JSON.parse(letterheadData[0].config_value);
    }
} catch (error) {
    console.log('⚠️ No custom letterhead config found');
}

if (!letterheadConfig) {
    letterheadConfig = { /* default */ };
}
```

Replace with:
```javascript
const letterheadConfig = await fetchLetterheadConfig('xxx');
```

### Step 4: Test Each Endpoint
After each replacement, test the endpoint to ensure it still works.

### Step 5: Commit Changes
```bash
git add backend/routes/export.js
git commit -m "refactor: use centralized letterhead helper in export routes"
```

---

## 🔗 Related Files

### Modified
- `backend/routes/export.js` - Export routes (8 endpoints)

### Dependencies
- `backend/utils/letterheadHelper.js` - Letterhead helper
- `backend/export/excelBuilder.js` - Excel builder (uses letterhead)
- `backend/export/pdfBuilder.js` - PDF builder (uses letterhead)

### Configuration
- `system_config` table - Database storage
- `backend/config/report-letterhead.json` - Template

---

## 📈 Impact Analysis

### Performance
- **Slight improvement**: Single helper function vs inline code
- **Caching potential**: Can add caching to helper later
- **Network**: No change (same database queries)

### Maintainability
- **Significant improvement**: 8 duplicated blocks → 1 helper
- **Future changes**: Update once, affects all exports
- **Bug fixes**: Fix once, fixes all exports

### Code Quality
- **Reduced complexity**: Less code duplication
- **Better structure**: Separation of concerns
- **Improved readability**: Clear intent

---

## 🎉 Success Criteria

✅ All 8 export endpoints updated  
✅ All endpoints use fetchLetterheadConfig()  
✅ All endpoints tested successfully  
✅ No regression in functionality  
✅ Letterhead appears in all exports  
✅ Fallback mechanism works correctly  
✅ Code review approved  
✅ Changes committed and pushed  

---

**Status**: 🔧 **IN PROGRESS** (1/8 endpoints updated)  
**Next Step**: Update remaining 8 export endpoints  
**ETA**: 30-60 minutes  
**Priority**: 🔴 High

