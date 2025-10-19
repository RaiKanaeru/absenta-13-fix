# 📊 API-FRONTEND MAPPING MATRIX

## 🎯 OVERVIEW
Matriks keterkaitan antara endpoint backend, komponen frontend, dan tabel database.

---

## 📋 ENDPOINT INVENTORY

### Authentication & Authorization
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/login` | POST | Index_Modern.tsx | users | - | ✅ |
| `/api/logout` | POST | Index_Modern.tsx | - | - | ✅ |
| `/api/verify` | GET | Index_Modern.tsx | users | - | ✅ |
| `/api/verify-token` | GET | Index_Modern.tsx | users | - | ✅ |

### Admin Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/admin/info` | GET | Index_Modern.tsx | users | admin | ✅ |
| `/api/admin/siswa` | GET | Admin Dashboard | siswa, kelas, users | admin | ✅ |
| `/api/admin/siswa` | POST | Admin Dashboard | siswa, users | admin | ✅ |
| `/api/admin/siswa` | PUT | Admin Dashboard | siswa, users | admin | ✅ |
| `/api/admin/siswa` | DELETE | Admin Dashboard | siswa, users | admin | ✅ |
| `/api/admin/guru` | GET | Admin Dashboard | guru, mapel, users | admin | ✅ |
| `/api/admin/guru` | POST | Admin Dashboard | guru, users | admin | ✅ |
| `/api/admin/guru` | PUT | Admin Dashboard | guru, users | admin | ✅ |
| `/api/admin/guru` | DELETE | Admin Dashboard | guru, users | admin | ✅ |
| `/api/admin/kelas` | GET | Admin Dashboard | kelas | admin | ✅ |
| `/api/admin/kelas` | POST | Admin Dashboard | kelas | admin | ✅ |
| `/api/admin/kelas` | PUT | Admin Dashboard | kelas | admin | ✅ |
| `/api/admin/kelas` | DELETE | Admin Dashboard | kelas | admin | ✅ |
| `/api/admin/mapel` | GET | Admin Dashboard | mapel | admin | ✅ |
| `/api/admin/mapel` | POST | Admin Dashboard | mapel | admin | ✅ |
| `/api/admin/mapel` | PUT | Admin Dashboard | mapel | admin | ✅ |
| `/api/admin/mapel` | DELETE | Admin Dashboard | mapel | admin | ✅ |

### Jadwal (Schedule) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/admin/jadwal` | GET | Admin Dashboard | jadwal, guru, mapel, kelas, ruang_kelas | admin | ✅ |
| `/api/admin/jadwal` | POST | Admin Dashboard | jadwal, guru, mapel, kelas, ruang_kelas | admin | ✅ |
| `/api/admin/jadwal` | PUT | Admin Dashboard | jadwal, guru, mapel, kelas, ruang_kelas | admin | ✅ |
| `/api/admin/jadwal` | DELETE | Admin Dashboard | jadwal, guru, mapel, kelas, ruang_kelas | admin | ✅ |
| `/api/admin/jadwal/preview` | GET | SchedulePreviewGrid.tsx | jadwal, guru, mapel, kelas | admin | ✅ |
| `/api/admin/jadwal/export` | GET | SchedulePreviewGrid.tsx | jadwal, guru, mapel, kelas | admin | ✅ |
| `/api/admin/jadwal/export/pdf` | GET | SchedulePreviewGrid.tsx | jadwal, guru, mapel, kelas | admin | ✅ |
| `/api/admin/jadwal/conflicts` | GET | Admin Dashboard | jadwal | admin | ✅ |
| `/api/admin/import/jadwal-advanced` | POST | JadwalAdvancedImportView.tsx | jadwal, guru, mapel, kelas | admin | ✅ |
| `/api/admin/templates/jadwal-advanced` | GET | JadwalAdvancedImportView.tsx | - | admin | ✅ |

### Absensi (Attendance) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/attendance/submit` | POST | Teacher Dashboard | absensi_guru, absensi_siswa | guru, admin | ✅ |
| `/api/schedule/:id/students` | GET | Teacher Dashboard | siswa, kelas, jadwal | guru, admin | ✅ |
| `/api/absensi` | POST | Student Dashboard | absensi_guru | siswa | ✅ |
| `/api/admin/student-attendance-report` | GET | Admin Dashboard | absensi_siswa, siswa, kelas | admin | ✅ |
| `/api/admin/teacher-attendance-report` | GET | Admin Dashboard | absensi_guru, guru | admin | ✅ |
| `/api/admin/student-attendance-summary` | GET | Admin Dashboard | absensi_siswa, siswa | admin | ✅ |
| `/api/admin/teacher-attendance-summary` | GET | Admin Dashboard | absensi_guru, guru | admin | ✅ |
| `/api/admin/live-student-attendance` | GET | MonitoringDashboard.tsx | absensi_siswa, siswa | admin | ✅ |
| `/api/admin/live-teacher-attendance` | GET | MonitoringDashboard.tsx | absensi_guru, guru | admin | ✅ |

### Pengajuan Izin (Permission Requests) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/siswa/:siswaId/pengajuan-izin` | GET | Student Dashboard | pengajuan_izin_siswa, siswa | siswa | ✅ |
| `/api/siswa/:siswaId/pengajuan-izin` | POST | Student Dashboard | pengajuan_izin_siswa, siswa | siswa | ✅ |
| `/api/guru/:guruId/pengajuan-izin` | GET | Teacher Dashboard | pengajuan_izin_siswa, siswa | guru | ✅ |
| `/api/guru/pengajuan-izin/:pengajuanId` | PUT | Teacher Dashboard | pengajuan_izin_siswa | guru | ✅ |
| `/api/pengajuan-izin/:pengajuanId/approve` | PUT | Teacher Dashboard | pengajuan_izin_siswa | guru | ✅ |
| `/api/admin/izin/:id` | PUT | Admin Dashboard | pengajuan_izin_siswa | admin | ✅ |

### Banding Absen (Attendance Appeals) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/siswa/:siswaId/banding-absen` | GET | Student Dashboard | pengajuan_banding_absen, siswa | siswa | ✅ |
| `/api/siswa/:siswaId/banding-absen` | POST | Student Dashboard | pengajuan_banding_absen, siswa | siswa | ✅ |
| `/api/siswa/:siswaId/banding-absen-kelas` | POST | Student Dashboard | pengajuan_banding_absen, siswa | siswa | ✅ |
| `/api/admin/banding-absen-report` | GET | Admin Dashboard | pengajuan_banding_absen, siswa | admin | ✅ |

### Siswa (Student) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/siswa/info` | GET | StudentDashboard_Modern.tsx | siswa, kelas | siswa | ✅ |
| `/api/siswa-perwakilan/info` | GET | StudentDashboard_Modern.tsx | siswa, kelas | siswa | ✅ (Alias) |
| `/api/siswa/:siswaId/jadwal-hari-ini` | GET | Student Dashboard | jadwal, guru, mapel | siswa | ✅ |
| `/api/siswa/:siswaId/jadwal-rentang` | GET | Student Dashboard | jadwal, guru, mapel | siswa | ✅ |
| `/api/siswa/:siswaId/riwayat-kehadiran` | GET | Student Dashboard | absensi_siswa, siswa | siswa | ✅ |
| `/api/siswa/:siswaId/daftar-siswa` | GET | Student Dashboard | siswa, kelas | siswa | ✅ |
| `/api/siswa/:siswaId/pengajuan-izin-kelas` | POST | Student Dashboard | pengajuan_izin_siswa, siswa | siswa | ✅ |
| `/api/siswa/submit-kehadiran-guru` | POST | Student Dashboard | absensi_guru | siswa | ✅ |

### Guru (Teacher) Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/guru/info` | GET | Index_Modern.tsx | guru, mapel, users | guru | ✅ |
| `/api/guru/classes` | GET | Teacher Dashboard | jadwal, kelas, guru | guru | ✅ |
| `/api/guru/attendance-summary` | GET | Teacher Dashboard | absensi_guru, guru | guru | ✅ |
| `/api/guru/download-attendance-excel` | GET | Teacher Dashboard | absensi_guru, guru | guru | ✅ |

### Dashboard & Analytics Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/dashboard/stats` | GET | Admin Dashboard | Multiple tables | All | ✅ |
| `/api/dashboard/chart` | GET | Admin Dashboard | Multiple tables | All | ✅ |
| `/api/admin/analytics` | GET | Admin Dashboard | Multiple tables | admin | ✅ |
| `/api/admin/monitoring-dashboard` | GET | MonitoringDashboard.tsx | Multiple tables | admin | ✅ |
| `/api/admin/resolve-alert/:alertId` | POST | MonitoringDashboard.tsx | - | admin | ✅ |
| `/api/admin/test-alert` | POST | MonitoringDashboard.tsx | - | admin | ✅ |

### Public Endpoints
| Endpoint | Method | Frontend Component | Database Tables | Role Required | Status |
|----------|--------|-------------------|-----------------|---------------|---------|
| `/api/kelas` | GET | Multiple components | kelas | All | ✅ |
| `/api/health` | GET | - | - | - | ✅ |

---

## 🔄 DATA FLOW PATTERNS

### 1. Authentication Flow
```
Frontend: Index_Modern.tsx
    ↓ POST /api/login
Backend: server_modern.js (login endpoint)
    ↓ Query users table
Database: users
    ↓ JWT token response
Frontend: Store token, redirect to dashboard
```

### 2. Student Data Flow
```
Frontend: StudentDashboard_Modern.tsx
    ↓ GET /api/siswa/info
Backend: server_modern.js (siswa info endpoint)
    ↓ Query siswa + kelas tables
Database: siswa, kelas
    ↓ Student data response
Frontend: Display student information
```

### 3. Schedule Management Flow
```
Frontend: JadwalAdvancedImportView.tsx
    ↓ POST /api/admin/import/jadwal-advanced
Backend: server_modern.js (import endpoint)
    ↓ Process Excel file, validate data
Database: jadwal, guru, mapel, kelas
    ↓ Import result response
Frontend: Show import results
```

### 4. Attendance Flow
```
Frontend: Teacher Dashboard
    ↓ POST /api/attendance/submit
Backend: server_modern.js (attendance endpoint)
    ↓ Insert/update absensi_guru, absensi_siswa
Database: absensi_guru, absensi_siswa
    ↓ Success response
Frontend: Update attendance display
```

---

## 🚨 ANOMALI DITEMUKAN

### 1. Missing Frontend Components
- **Admin Dashboard**: Referenced in mapping but not found in src/
- **Teacher Dashboard**: Referenced in mapping but not found in src/
- **Student Dashboard**: Only StudentDashboard_Modern.tsx found

### 2. API Contract Mismatches
- **Error Response Format**: Inconsistent between endpoints
- **Field Naming**: Some endpoints use different field names
- **Status Codes**: Not all endpoints return appropriate HTTP status codes

### 3. Database Query Issues
- **N+1 Queries**: Dashboard stats use multiple separate queries
- **Missing Indexes**: Some queries don't use optimal indexes
- **JOIN Patterns**: Some queries could be optimized

---

## 📊 STATISTICS

### Endpoint Distribution
- **Total Endpoints**: 130+
- **Admin Endpoints**: 60+ (46%)
- **Student Endpoints**: 15+ (12%)
- **Teacher Endpoints**: 10+ (8%)
- **Public Endpoints**: 5+ (4%)
- **Other Endpoints**: 40+ (30%)

### Frontend Component Distribution
- **Main Components**: 5
- **API Calls per Component**: 1-3 average
- **Authentication Required**: 95% of endpoints

### Database Table Usage
- **Most Used**: siswa, users, jadwal, absensi_siswa, absensi_guru
- **Least Used**: system_config, kop_laporan, banding_absen_detail
- **Cross-References**: High complexity due to multiple relationships

---

## 🎯 REKOMENDASI

### 1. Frontend Improvements
- **Create missing dashboard components**
- **Standardize error handling across components**
- **Implement proper loading states**
- **Add error boundaries**

### 2. Backend Improvements
- **Standardize API response format**
- **Implement comprehensive input validation**
- **Add API documentation**
- **Optimize database queries**

### 3. Database Improvements
- **Add missing indexes**
- **Optimize query patterns**
- **Implement proper foreign key constraints**
- **Add database monitoring**

---

*Mapping completed on: 2025-10-04*  
*Total endpoints analyzed: 130+*  
*Frontend components analyzed: 5*  
*Database tables analyzed: 15+*































