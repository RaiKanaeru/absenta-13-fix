# 🗂️ RENCANA REORGANISASI PROYEK ABSENTA

## 📊 **ANALISIS STRUKTUR SAAT INI**

### ✅ **FOLDER YANG SUDAH RAPI**
- `backend/` - Backend modular (sudah terorganisir)
- `src/` - Frontend React (sudah terorganisir)
- `public/` - Static assets
- `node_modules/` - Dependencies

### 🔄 **FILE YANG PERLU DIREORGANISASI**

## 🎯 **STRUKTUR TARGET YANG DIINGINKAN**

```
absenta-optimize-old/
├── 📁 backend/                    # Backend modular (sudah ada)
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── 📁 frontend/                   # Frontend (rename dari src/)
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── hooks/
│   └── lib/
├── 📁 database/                   # Database files
│   ├── schema/
│   ├── migrations/
│   ├── backups/
│   └── scripts/
├── 📁 scripts/                    # Utility scripts
│   ├── database/
│   ├── maintenance/
│   ├── testing/
│   └── deployment/
├── 📁 docs/                       # Documentation
│   ├── api/
│   ├── guides/
│   ├── troubleshooting/
│   └── analysis/
├── 📁 config/                     # Configuration files
│   ├── environment/
│   ├── deployment/
│   └── monitoring/
├── 📁 logs/                       # Log files
├── 📁 temp/                       # Temporary files
└── 📁 archives/                   # Archived files
```

## 📋 **RENCANA REORGANISASI**

### **Phase 1: Database Files** 🗄️
**Target Folder**: `database/`

**Files to move**:
- `absenta13.sql` → `database/schema/`
- `backup_absenta13_20251018_075721.sql` → `database/backups/`
- `database_updates.sql` → `database/migrations/`
- `database-migration-production.sql` → `database/migrations/`
- `drop-pengajuan-izin-tables.sql` → `database/scripts/`
- `migrate-add-flags.sql` → `database/scripts/`

### **Phase 2: Scripts & Utilities** 🔧
**Target Folder**: `scripts/`

**Database Scripts** → `scripts/database/`:
- `migrate_telepon_siswa.js`
- `migrate-ketos-to-perwakilan.js`
- `migrate-siswa-perwakilan.js`
- `run-migration-v2.js`
- `run-migration.js`
- `run-simple-migration.js`
- `simple-role-migration.js`

**Maintenance Scripts** → `scripts/maintenance/`:
- `backup-database.js`
- `backup-system.js`
- `restore-database.js`
- `aggressive-cleanup.js`
- `disaster-recovery-system.js`
- `monitoring-system.js`
- `security-system.js`
- `load-balancer.js`
- `queue-system.js`

**Testing Scripts** → `scripts/testing/`:
- `test-login.cjs`
- `test-login.js`
- `test-multi-student-constraint.js`
- `test-password.js`
- `test-perwakilan-normalization.js`
- `test-phase3-4-implementation.js`
- `test-rbac-consistency.js`
- `verify-absensi-structure.cjs`
- `verify-attendance-database.js`
- `verify-cleanup.js`
- `verify-multi-teacher-system.js`

**Database Analysis Scripts** → `scripts/database/`:
- `analyze-excel.cjs`
- `analyze-unused-tables.js`
- `audit-all-endpoints.js`
- `check-all-users.js`
- `check-password-hash.js`
- `check-siswa1.js`
- `check-student-data.js`
- `check-user-347.js`
- `check-users-structure.js`
- `database-index-audit.js`
- `database-optimization.js`

### **Phase 3: Documentation** 📚
**Target Folder**: `docs/`

**API Documentation** → `docs/api/`:
- `API_FE_MAPPING.md`

**Guides** → `docs/guides/`:
- `DEBUG_GUIDE.md`
- `DEBUG_KETERANGAN_KIMIA_GUIDE.md`
- `DEBUG_KETERANGAN_LOADING_GUIDE.md`
- `DEBUG_STUDENTS_GUIDE.md`
- `DEPLOYMENT_GUIDE.md`
- `DEPLOYMENT_MIGRATION_GUIDE.md`
- `EXCEL_EXPORT_ISSUE_ANALYSIS.md`
- `EXCEL_IMPORT_GUIDE.md`
- `GURU_REPORT_FILTER_GUIDE.md`
- `IMPORT_JADWAL_ADVANCED_GUIDE.md`
- `JADWAL_ADVANCED_IMPORT_GUIDE.md`
- `PANDUAN_CEPAT_PERBAIKAN_ABSENSI.md`
- `TESTING_GUIDE.md`
- `TESTING_ERROR_413_GUIDE.md`
- `TROUBLESHOOTING_GUIDE.md`

**Analysis Reports** → `docs/analysis/`:
- `ATTENDANCE_DUPLICATE_FIX_DOCUMENTATION.md`
- `AUDIT_REPORT.md`
- `BEFORE_AFTER_COMPARISON.md`
- `COMPREHENSIVE_SYSTEM_ANALYSIS.md`
- `DATABASE_STRUCTURE_ANALYSIS.md`
- `DETAILED_SYSTEM_ANALYSIS_V2.md`
- `ERROR_LOG_ANALYSIS_404_403.md`
- `FEATURE_REDUNDANCY_ANALYSIS.md`
- `FRONTEND-CACHE-FIX.md`
- `LOGIN_ERROR_ANALYSIS.md`
- `MIGRATION_SISWA_ANALYSIS.md`
- `PARSING_ERROR_FIX.md`
- `SAFETY_VALIDATION_REPORT.md`
- `SYSTEM_DIAGNOSIS.md`
- `SYSTEM_ROADMAP_TODO.md`

**Implementation Summaries** → `docs/implementation/`:
- `FINAL_IMPLEMENTATION_SUMMARY.md`
- `FINAL_PHASE3-4_RESULTS.md`
- `FINAL_SYSTEM_STATUS.md`
- `FINAL_TEST_RESULTS.md`
- `IMPLEMENTASI_JADWAL_ADVANCED_COMPLETE.md`
- `IMPLEMENTASI_VALIDASI_BENTROK_JADWAL.md`
- `IMPLEMENTATION_SUMMARY_BACKUP_ENDPOINTS.md`
- `IMPLEMENTATION_SUMMARY_ERROR_413_FIX.md`
- `IMPLEMENTATION_SUMMARY_KOP_LAPORAN.md`
- `IMPLEMENTATION-SUMMARY-ERROR-500.md`
- `IMPORT_JADWAL_ADVANCED_FIXES.md`
- `KA_JURUSAN_FIX.md`
- `KA_TO_AK_MAPPING_FIX.md`
- `KOP_LAPORAN_DATABASE_IMPLEMENTATION.md`
- `KOP_LAPORAN_IMPLEMENTATION.md`
- `MIGRASI_SISWA_PERWAKILAN_FINAL.md`
- `MULTI_TEACHER_SYSTEM_COMPLETE.md`
- `PENGAJUAN_IZIN_KELAS_GURU_FINAL.md`
- `PENGAJUAN_IZIN_KELAS_GURU.md`
- `PENGAJUAN_IZIN_KELAS_OPTIMIZATION.md`
- `PERBAIKAN_ERROR_401_UNAUTHORIZED.md`
- `PERBAIKAN_SISTEM_ABSENSI_GURU_LENGKAP.md`
- `PERBAIKAN_SISTEM_ABSENSI_GURU.md`
- `PERBAIKAN_STUDENT_DASHBOARD_API_ERROR.md`
- `PHASE_1_IMPLEMENTATION_EVALUATION.md`
- `PHASE3-4_IMPLEMENTATION_SUMMARY.md`
- `PREVIEW_JADWAL_FINAL_FIX.md`
- `PREVIEW_JADWAL_FIX.md`
- `PROMOTION_SYSTEM_FIXES.md`
- `RBAC_CONSISTENCY_IMPLEMENTATION_SUMMARY.md`
- `SINGLE_STUDENT_MIGRATION.md`
- `SISTEM_ABSENSI_COMPLETENESS_ANALYSIS.md`
- `SMART_PROMOTION_SYSTEM.md`
- `STUDENT_DASHBOARD_MULTIPLE_SUBMISSION_FIX.md`
- `TESTING_IMPLEMENTATION_COMPLETE.md`

**Fixes & Improvements** → `docs/fixes/`:
- `EXPORT_JADWAL_FIXES.md`
- `GURU_ATTENDANCE_SYSTEM_FIXES_DOCUMENTATION.md`
- `RINGKASAN_FINAL_PERBAIKAN.md`
- `RINGKASAN_PERBAIKAN_BACKEND_DATABASE.md`
- `RINGKASAN_PERBAIKAN_ERROR_DATA.md`
- `RINGKASAN_PERBAIKAN_TABLE_BAHASA_INDONESIA.md`

### **Phase 4: Configuration Files** ⚙️
**Target Folder**: `config/`

**Environment Files** → `config/environment/`:
- `env-setup.txt`
- `env.example`
- `env.frontend.example`

**Deployment Files** → `config/deployment/`:
- `start-server-debug.ps1`
- `ultimate-redis-fix.sh`

**Monitoring Files** → `config/monitoring/`:
- `swagger-config.js`

### **Phase 5: Server Files** 🖥️
**Keep in Root** (Main server files):
- `server_modern.js` (backup)
- `server_modular.js` (main)
- `server_https.js`
- `server-minimal.js`
- `db.js`

### **Phase 6: Frontend Reorganization** 🎨
**Rename**: `src/` → `frontend/`

### **Phase 7: Cleanup & Archives** 🗑️
**Target Folder**: `archives/`

**Old/Unused Files**:
- `server_modern_backup.js`
- `server-error.log`
- `server-output.log`
- `DELETED_FILES.md`
- `DEMO_SCRIPT.md`
- `DOCUMENTATION_INDEX.md`

**Temporary Files** → `temp/`:
- `backup_siswa.json`
- `backup_users.json`
- `backup-settings.json`

## 🚀 **IMPLEMENTATION STEPS**

1. **Create folder structure**
2. **Move database files**
3. **Move scripts**
4. **Move documentation**
5. **Move configuration files**
6. **Rename frontend folder**
7. **Clean up root directory**
8. **Update import paths**
9. **Test functionality**
10. **Update documentation**

## ⚠️ **PERHATIAN PENTING**

- **Backup semua file** sebelum reorganisasi
- **Update import paths** di semua file
- **Test functionality** setelah reorganisasi
- **Update package.json** scripts jika diperlukan
- **Update documentation** dengan struktur baru
