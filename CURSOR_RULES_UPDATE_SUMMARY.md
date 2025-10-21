# 📚 Cursor Rules Update Summary - Oktober 2025

**Date**: 21 Oktober 2025  
**Status**: ✅ **COMPLETED**  
**Purpose**: Update Cursor Rules untuk mencerminkan sistem terkini (Post Opsi 2 Normalization)

---

## 🎯 Overview

Cursor Rules telah di-update untuk:
1. ✅ Menghapus referensi ke **pengajuan izin siswa** (fitur sudah dihapus)
2. ✅ Mencerminkan **database normalization** (Opsi 2)
3. ✅ Dokumentasi **multi-teacher system**
4. ✅ Dokumentasi **banding absen system**
5. ✅ Update dengan kondisi sistem **2025** (production-ready)

---

## 🗑️ Rules Deleted

### **1. absenta-permission-system.mdc** ❌ **REMOVED**
**Reason**: Feature pengajuan izin siswa sudah tidak digunakan lagi

**Previously Contained**:
- Database schema untuk `pengajuan_izin_siswa`
- API endpoints untuk permission requests
- Frontend components untuk izin siswa
- Notification system untuk izin
- Permission analytics

**Impact**: NONE - Feature already deprecated and removed from codebase

---

## ✨ New Rules Created

### **1. absenta-system-architecture-2025.mdc** ⭐ **NEW**
**Type**: Always Applied  
**Purpose**: Core system architecture guide (updated for 2025)

**Contents**:
```markdown
- System Status: Production Ready
- Database: 19 active tables + 2 views
- Features: Multi-Teacher ✅ | Banding Absen ✅ | Normalized DB ✅

Key Topics:
- Database normalization (Opsi 2 completed)
- Multi-teacher system (3 new tables)
- Banding absen system (2 tables)
- Removed features (pengajuan izin siswa)
- Query patterns (multi-guru, nullable user_id)
- Security patterns
- Transaction patterns
- Performance optimizations
```

**Critical Information**:
- `users` table: role ENUM('ADMIN','GURU','SISWA')
- `siswa` table: user_id NULLABLE ⚠️
- `siswa_perwakilan`: NOW A VIEW (backward compatibility)
- Username format: `siswa_[NIS]`
- Password format: `[NIS]@2024`

### **2. absenta-quick-reference-2025.mdc** ⭐ **NEW**
**Type**: Manual/Description-based  
**Purpose**: Quick lookup for common patterns

**Contents**:
```markdown
- Core tables summary (19 tables)
- Critical patterns (multi-guru, nullable user, transactions)
- Common mistakes to avoid
- Quick fixes for common issues
- API endpoints quick list
- Smart delete pattern
- Performance tips
```

**Key Patterns**:
```sql
-- Multi-Guru Pattern
LEFT JOIN jadwal_guru jg ON j.id_jadwal = jg.jadwal_id 
  AND jg.guru_id = ? AND jg.status = 'aktif'
WHERE (j.guru_id = ? OR jg.guru_id IS NOT NULL)

-- Nullable User Pattern
SELECT s.*, u.username FROM siswa s 
LEFT JOIN users u ON s.user_id = u.id
```

### **3. absenta-rules-index-2025.mdc** ⭐ **NEW**
**Type**: Manual/Description-based  
**Purpose**: Complete index of all rules

**Contents**:
```markdown
- All 26 rules categorized
- Rule priority levels (Critical, Important, Reference)
- Usage guide (when to use which rule)
- Recent updates log
- Checklist for new developers
- Rule maintenance guide
```

**Rule Categories**:
- Core Architecture (1 rule - always applied)
- Database (5 rules)
- API (3 rules)
- Frontend (2 rules)
- Feature-Specific (3 rules)
- Security (1 rule)
- Performance (2 rules)
- Deployment (2 rules)
- Testing (2 rules)
- Business Logic (1 rule)
- Development Workflow (2 rules)
- Reference (2 rules)

---

## 🔄 Rules Updated

### **1. absenta-database-schema-final.mdc** 📝 **UPDATED**
**Previous**: Schema dengan `siswa_perwakilan` sebagai main table  
**Now**: Normalized schema dengan `siswa` sebagai main table

**Changes**:
```diff
+ users.role ENUM('ADMIN','GURU','SISWA')  // Added 'SISWA'
+ siswa.user_id INT NULL                    // Made NULLABLE
+ FK siswa.user_id → users.id ON DELETE SET NULL
+ jadwal_guru (NEW - multi-teacher)
+ absensi_guru_jadwal (NEW - per-schedule attendance)
+ absensi_guru_mapping (NEW - per-teacher mapping)
- pengajuan_izin_siswa (REMOVED)
- pengajuan_izin_detail (REMOVED)
```

### **2. absenta-api-patterns-2025.mdc** 📝 **UPDATED**
**Previous**: API patterns untuk old schema  
**Now**: API patterns untuk normalized schema

**Changes**:
```diff
+ POST /api/admin/siswa - Transaction-based creation
+ PUT /api/admin/siswa/:id - Smart update with id_siswa mapping
+ DELETE /api/admin/siswa/:id - Smart delete (deactivate vs hard delete)
+ Multi-guru query patterns
+ Banding absen endpoints
- Pengajuan izin endpoints (REMOVED)
```

---

## 📊 Rules Status Summary

### **Total Rules**: 26 rules

#### **By Status**:
- ✅ Active: 26 rules
- ❌ Removed: 1 rule (absenta-permission-system.mdc)
- ⭐ New (2025): 3 rules
- 📝 Updated (2025): 2 rules

#### **By Type**:
- Always Applied: 1 rule
- Globs-based: 18 rules
- Description-based: 7 rules

#### **By Priority**:
- 🔴 Critical: 4 rules
- 🟡 Important: 4 rules
- 🟢 Reference: 18 rules

---

## 🎯 Key Changes Reflected in Rules

### **1. Database Normalization (Opsi 2)**
✅ Documented in:
- `absenta-system-architecture-2025.mdc`
- `absenta-database-schema-final.mdc`
- `absenta-api-patterns-2025.mdc`

**Key Points**:
- `users` table untuk akun (ADMIN, GURU, SISWA)
- `siswa` table untuk data siswa (user_id NULLABLE)
- `guru` table untuk data guru (user_id REQUIRED)
- FK constraints dengan ON DELETE SET NULL/CASCADE
- Username format: `siswa_[NIS]`

### **2. Multi-Teacher System**
✅ Documented in:
- `absenta-multi-teacher.mdc` (existing)
- `absenta-system-architecture-2025.mdc` (updated)
- `absenta-quick-reference-2025.mdc` (new)

**Key Points**:
- `jadwal_guru` - Teacher assignments
- `absensi_guru_jadwal` - Per-schedule attendance
- `absensi_guru_mapping` - Per-teacher mapping
- Multi-guru query patterns
- Conflict detection

### **3. Banding Absen System**
✅ Documented in:
- `absenta-dispute-system.mdc` (existing)
- `absenta-system-architecture-2025.mdc` (updated)
- `absenta-quick-reference-2025.mdc` (new)

**Key Points**:
- Individual banding
- Class banding (1 student only)
- Multi-guru support
- Duplicate prevention
- Audit trail

### **4. Removed Features**
✅ Documented in:
- `absenta-system-architecture-2025.mdc`
- `absenta-rules-index-2025.mdc`

**Removed**:
- ❌ Pengajuan izin siswa
- ❌ Old `siswa_perwakilan` table (now VIEW)
- ❌ Roles 'KETOS', 'perwakilan' (migrated to 'SISWA')

---

## 🔍 Rules Update Details

### **absenta-system-architecture-2025.mdc**

**Location**: `.cursor/rules/absenta-system-architecture-2025.mdc`  
**Type**: Always Applied  
**Lines**: ~350 lines

**Sections**:
1. System Status
2. Core Technology Stack
3. Database Architecture (19 tables + 2 views)
4. Key System Changes (2025)
5. API Structure
6. Security Patterns
7. Query Patterns
8. Performance Optimizations
9. Deployment Checklist
10. Important Reminders

**Critical Warnings**:
```markdown
⚠️ IMPORTANT REMINDERS
1. ALWAYS use `siswa` table (not `siswa_perwakilan` - it's just a VIEW)
2. Role must be 'SISWA' (uppercase in DB, lowercase in token)
3. user_id is NULLABLE in siswa table (check for NULL before using)
4. Use transactions for multi-table operations
5. Smart delete (deactivate if has history, else hard delete)
6. Multi-guru queries always use LEFT JOIN jadwal_guru
7. NO pengajuan izin siswa (feature removed)
```

### **absenta-quick-reference-2025.mdc**

**Location**: `.cursor/rules/absenta-quick-reference-2025.mdc`  
**Type**: Description-based  
**Lines**: ~270 lines

**Sections**:
1. System Overview
2. Core Tables (19 tables)
3. Critical Patterns (multi-guru, nullable user, transactions)
4. Common Mistakes to Avoid
5. Authentication (roles, username formats, passwords)
6. API Endpoints Quick List
7. Smart Delete Pattern
8. Performance Tips
9. Quick Fixes
10. Documentation Files
11. Development Workflow

**Most Useful For**:
- Quick pattern lookup
- Common mistake prevention
- API endpoint reference
- Troubleshooting

### **absenta-rules-index-2025.mdc**

**Location**: `.cursor/rules/absenta-rules-index-2025.mdc`  
**Type**: Description-based  
**Lines**: ~400 lines

**Sections**:
1. Overview (26 rules summary)
2. All Rules Categorized (by function)
3. Rule Usage Guide
4. Rule Priority Levels
5. Recent Updates (Oktober 2025)
6. Getting Help (which rule to consult)
7. Rule Maintenance
8. Checklist for New Developers

**Most Useful For**:
- Finding the right rule for a task
- Understanding rule priorities
- Onboarding new developers
- Rule maintenance

---

## 📝 Migration Guide for Developers

### **If You Were Using Old Rules**:

1. **Stop referencing `absenta-permission-system.mdc`**
   - File has been deleted
   - Feature is deprecated
   - Use banding absen instead for attendance appeals

2. **Update to new core rule**
   - Old: `absenta-system-architecture.mdc`
   - New: `absenta-system-architecture-2025.mdc`
   - Always applied automatically

3. **Use updated database schema**
   - Old: `absenta-database-schema-2025.mdc`
   - New: `absenta-database-schema-final.mdc`
   - Reflects normalized schema

4. **Update API patterns**
   - Old: `absenta-api-patterns.mdc`
   - New: Also use `absenta-api-patterns-2025.mdc`
   - Both are valid, 2025 has newer patterns

5. **Use quick reference for fast lookup**
   - New: `absenta-quick-reference-2025.mdc`
   - Faster than reading full rules

---

## ✅ Verification Checklist

- [x] Deleted `absenta-permission-system.mdc`
- [x] Created `absenta-system-architecture-2025.mdc` (always applied)
- [x] Created `absenta-quick-reference-2025.mdc` (description-based)
- [x] Created `absenta-rules-index-2025.mdc` (description-based)
- [x] Updated `absenta-database-schema-final.mdc`
- [x] Updated `absenta-api-patterns-2025.mdc`
- [x] Verified all rules have proper frontmatter
- [x] Verified no broken references to deleted rule
- [x] Verified all new rules follow MDC format
- [x] Created this summary document

---

## 📚 Documentation Created

1. ✅ `CURSOR_RULES_UPDATE_SUMMARY.md` - This document
2. ✅ `.cursor/rules/absenta-system-architecture-2025.mdc`
3. ✅ `.cursor/rules/absenta-quick-reference-2025.mdc`
4. ✅ `.cursor/rules/absenta-rules-index-2025.mdc`

---

## 🎯 Next Steps for Users

### **For New Developers**
1. Read `absenta-system-architecture-2025.mdc` (auto-applied)
2. Read `absenta-quick-reference-2025.mdc` for patterns
3. Consult `absenta-rules-index-2025.mdc` to find specific rules

### **For Existing Developers**
1. Note: `absenta-permission-system.mdc` is DELETED
2. Review: `absenta-system-architecture-2025.mdc` for updates
3. Bookmark: `absenta-quick-reference-2025.mdc` for quick lookup

### **For Cursor AI**
- Will automatically apply `absenta-system-architecture-2025.mdc`
- Can fetch other rules by description when needed
- Has access to quick reference for pattern lookup

---

## 🎉 Summary

**Total Changes**:
- 🗑️ Deleted: 1 rule
- ✨ Created: 3 new rules
- 📝 Updated: 2 existing rules
- ✅ Total Active Rules: 26 rules

**Impact**:
- ✅ Rules now reflect current system (2025)
- ✅ No references to deprecated features
- ✅ Complete documentation for new features
- ✅ Easy onboarding for new developers
- ✅ Quick reference for experienced developers

**Status**: ✅ **ALL CURSOR RULES UPDATED & VERIFIED**

---

**Updated By**: AI Assistant  
**Completed**: 21 Oktober 2025, 04:00 WIB  
**Status**: ✅ COMPLETE

---

**For questions or updates, refer to**: `absenta-rules-index-2025.mdc`

