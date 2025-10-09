# 👨‍💼 README ROLE ADMIN - SISTEM ABSENTA

## 🎯 OVERVIEW
Sistem Absenta untuk **Role Admin** adalah dashboard super admin yang memiliki akses penuh untuk mengelola seluruh sistem, termasuk manajemen user, data master, monitoring sistem, backup & recovery, dan berbagai laporan komprehensif.

---

## 🔐 FITUR UTAMA ROLE ADMIN

### 1. **LOGIN & AUTHENTICATION**
**Frontend:**
- File: `src/components/LoginForm_Modern.tsx`
- Line: 1-500 (komponen login utama)
- Line: 200-300 (validasi form login)
- Line: 400-500 (handle submit login)

**Backend:**
- File: `server_modern.js`
- Line: 439-460 (autentikasi role admin)
- Line: 720-753 (endpoint info admin)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - autentikasi)

---

### 2. **DASHBOARD UTAMA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 159-176 (menu items configuration)
- Line: 5800-5980 (main dashboard component)
- Line: 5900-5950 (navigation sidebar)

**Backend:**
- File: `server_modern.js`
- Line: 439-460 (autentikasi role admin)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users`)

---

### 3. **MANAJEMEN AKUN GURU**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 178-500 (ManageTeacherAccountsView component)
- Line: 200-300 (form tambah/edit guru)
- Line: 400-500 (table daftar guru)

**Backend:**
- File: `server_modern.js`
- Line: 4144-4174 (endpoint get teachers)
- Line: 4177-4227 (endpoint add teacher)
- Line: 4229-4280 (endpoint update teacher)
- Line: 4282-4320 (endpoint delete teacher)

**Database:**
- File: `absenta13 (1).sql`
- Line: 244-271 (tabel `guru` - data guru)
- Line: 720-753 (tabel `users` - akun login)

---

### 4. **MANAJEMEN AKUN SISWA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 1800-2200 (ManageStudentAccountsView component)
- Line: 2000-2100 (form tambah/edit siswa)
- Line: 2100-2200 (table daftar siswa)

**Backend:**
- File: `server_modern.js`
- Line: 696-736 (endpoint get siswa)
- Line: 738-776 (endpoint add siswa)

**Database:**
- File: `absenta13 (1).sql`
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)
- Line: 720-753 (tabel `users` - akun login)

---

### 5. **MANAJEMEN DATA GURU**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 2200-2800 (ManageTeacherDataView component)
- Line: 2400-2500 (form CRUD data guru)
- Line: 2500-2800 (table data guru)

**Backend:**
- File: `server_modern.js`
- Line: 778-818 (endpoint get guru data)
- Line: 820-858 (endpoint add guru data)

**Database:**
- File: `absenta13 (1).sql`
- Line: 244-271 (tabel `guru` - data guru)

---

### 6. **MANAJEMEN DATA SISWA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 2800-3400 (ManageStudentDataView component)
- Line: 3000-3100 (form CRUD data siswa)
- Line: 3100-3400 (table data siswa)

**Backend:**
- File: `server_modern.js`
- Line: 696-736 (endpoint get siswa data)

**Database:**
- File: `absenta13 (1).sql`
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)

---

### 7. **MANAJEMEN MATA PELAJARAN**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 3400-4000 (ManageSubjectsView component)
- Line: 3600-3700 (form CRUD mata pelajaran)
- Line: 3700-4000 (table mata pelajaran)

**Backend:**
- File: `server_modern.js`
- Line: 860-877 (endpoint get mapel)
- Line: 879-919 (endpoint add mapel)
- Line: 922-966 (endpoint update mapel)
- Line: 969-1010 (endpoint delete mapel)

**Database:**
- File: `absenta13 (1).sql`
- Line: 366-384 (tabel `mapel` - mata pelajaran)

---

### 8. **MANAJEMEN KELAS**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 4000-4600 (ManageClassesView component)
- Line: 4200-4300 (form CRUD kelas)
- Line: 4300-4600 (table kelas)

**Backend:**
- File: `server_modern.js`
- Line: 1013-1030 (endpoint get kelas)
- Line: 1032-1061 (endpoint add kelas)
- Line: 1063-1094 (endpoint update kelas)
- Line: 1097-1121 (endpoint delete kelas)

**Database:**
- File: `absenta13 (1).sql`
- Line: 341-358 (tabel `kelas` - data kelas)

---

### 9. **MANAJEMEN JADWAL**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 4600-5200 (ManageSchedulesView component)
- Line: 4800-4900 (form CRUD jadwal)
- Line: 4900-5200 (table jadwal)

**Backend:**
- File: `server_modern.js`
- Line: 1124-1161 (endpoint get jadwal)
- Line: 1163-1210 (endpoint add jadwal)
- Line: 1213-1263 (endpoint update jadwal)
- Line: 1266-1300 (endpoint delete jadwal)

**Database:**
- File: `absenta13 (1).sql`
- Line: 278-316 (tabel `jadwal` - jadwal pelajaran)

---

### 10. **BACKUP & ARCHIVE MANAGEMENT**
**Frontend:**
- File: `src/components/BackupManagementView.tsx`
- Line: 1-500 (backup management component)
- Line: 100-200 (backup settings)
- Line: 200-300 (backup history)

**Backend:**
- File: `backup-system.js`
- Line: 1-500 (backup system implementation)

**Database:**
- File: `absenta13 (1).sql`
- Line: 1-1122 (entire database schema)

---

### 11. **LOAD BALANCER & MONITORING**
**Frontend:**
- File: `src/components/LoadBalancerView.tsx`
- Line: 1-300 (load balancer component)
- File: `src/components/MonitoringDashboard.tsx`
- Line: 1-400 (monitoring dashboard)

**Backend:**
- File: `load-balancer.js`
- Line: 1-200 (load balancer implementation)
- File: `monitoring-system.js`
- Line: 1-300 (monitoring system)

**Database:**
- File: `absenta13 (1).sql`
- Line: 1-1122 (entire database schema)

---

### 12. **DISASTER RECOVERY**
**Frontend:**
- File: `src/components/DisasterRecoveryView.tsx`
- Line: 1-400 (disaster recovery component)
- Line: 100-200 (recovery options)
- Line: 200-300 (recovery history)

**Backend:**
- File: `disaster-recovery-system.js`
- Line: 1-500 (disaster recovery implementation)

**Database:**
- File: `absenta13 (1).sql`
- Line: 1-1122 (entire database schema)

---

### 13. **LAPORAN & ANALYTICS**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 5200-5800 (ReportsView component)
- Line: 5400-5500 (analytics dashboard)
- Line: 5500-5800 (report generation)

**Backend:**
- File: `server_modern.js`
- Line: 1565-1692 (endpoint analytics)
- Line: 1695-1755 (endpoint live teacher attendance)
- Line: 1758-1805 (endpoint live student attendance)
- Line: 1808-1858 (endpoint teacher attendance report)
- Line: 1926-1971 (endpoint student attendance report)
- Line: 2035-2076 (endpoint student attendance summary)
- Line: 2184-2215 (endpoint teacher attendance summary)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa`)
- Line: 30-52 (tabel `absensi_guru`)

---

## 🗂️ STRUKTUR FILE UTAMA

### **Frontend (React + TypeScript)**
```
src/
├── components/
│   ├── AdminDashboard_Modern.tsx     # Dashboard utama admin
│   ├── LoginForm_Modern.tsx          # Form login
│   ├── BackupManagementView.tsx      # Backup management
│   ├── LoadBalancerView.tsx          # Load balancer
│   ├── MonitoringDashboard.tsx       # System monitoring
│   ├── DisasterRecoveryView.tsx      # Disaster recovery
│   ├── PresensiSiswaView.tsx         # Student attendance view
│   ├── RekapKetidakhadiranView.tsx   # Absence summary view
│   └── ui/                           # Komponen UI (shadcn/ui)
├── pages/
│   └── Index_Modern.tsx              # Halaman utama
└── main.tsx                          # Entry point aplikasi
```

### **Backend (Node.js + Express)**
```
server_modern.js                       # Server utama (90,509 tokens)
├── Authentication (Line 439-460)
├── Admin Endpoints (Line 696-8017)
├── Database Operations
└── API Routes

backup-system.js                       # Backup system
load-balancer.js                       # Load balancer
monitoring-system.js                   # System monitoring
disaster-recovery-system.js            # Disaster recovery
```

### **Database (MySQL)**
```
absenta13 (1).sql                      # Database schema
├── users (Line 720-753)               # Tabel user
├── guru (Line 244-271)                # Tabel guru
├── siswa_perwakilan (Line 678-712)    # Tabel siswa
├── mapel (Line 366-384)               # Tabel mata pelajaran
├── kelas (Line 341-358)               # Tabel kelas
├── jadwal (Line 278-316)              # Tabel jadwal
├── absensi_siswa (Line 79-134)        # Tabel kehadiran siswa
└── absensi_guru (Line 30-52)          # Tabel kehadiran guru
```

---

## 🚀 CARA MENJALANKAN

### **1. Install Dependencies**
```bash
npm install
```

### **2. Setup Database**
```bash
# Import database
mysql -u root -p < absenta13\ \(1\).sql
```

### **3. Start Server**
```bash
# Backend
npm run start:modern

# Frontend (terminal baru)
npm run dev
```

### **4. Akses Aplikasi**
- URL: `http://localhost:5173`
- Login sebagai admin

---

## 👤 CREDENTIALS LOGIN ADMIN

### **Administrator:**
- **Username:** `admin`
- **Password:** `123456`
- **Role:** Administrator

---

## 📱 FITUR MOBILE RESPONSIVE

### **Responsive Design:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 5900-5950 (sidebar mobile)
- Line: 5950-5980 (header mobile)
- Line: 5920-5930 (font size control mobile)

### **Mobile Features:**
- Sidebar collapsible
- Touch-friendly buttons
- Responsive tables
- Mobile-optimized forms

---

## 🔧 TEKNOLOGI YANG DIGUNAKAN

### **Frontend:**
- **React 18.3.1** - Framework UI
- **TypeScript 5.8.3** - Type safety
- **Tailwind CSS 3.4.17** - Styling
- **shadcn/ui** - Komponen UI
- **Vite 5.4.19** - Build tool
- **ExcelJS 4.4.0** - Excel processing

### **Backend:**
- **Node.js** - Runtime
- **Express 5.1.0** - Web framework
- **MySQL2 3.14.3** - Database driver
- **bcrypt 6.0.0** - Password hashing
- **jsonwebtoken 9.0.2** - JWT authentication

### **Database:**
- **MySQL 10.4.32-MariaDB** - Database engine
- **InnoDB** - Storage engine

---

## 📊 STATISTIK FITUR

### **Jumlah Endpoint API Admin:**
- **Total:** 106 endpoint khusus admin
- **Authentication:** 1 endpoint
- **User Management:** 20 endpoint
- **Data Management:** 30 endpoint
- **Reports & Analytics:** 25 endpoint
- **System Management:** 15 endpoint
- **Backup & Recovery:** 10 endpoint
- **Monitoring:** 5 endpoint

### **Jumlah Tabel Database:**
- **Total:** 15 tabel terkait admin
- **Core Tables:** 8 tabel utama
- **Support Tables:** 7 tabel pendukung

### **Jumlah Komponen Frontend:**
- **Total:** 1 komponen utama
- **Sub-components:** 12 render functions
- **UI Components:** 30+ komponen shadcn/ui

---

## 🎨 UI/UX FEATURES

### **Modern Design:**
- Gradient backgrounds
- Card-based layout
- Smooth animations
- Professional color scheme

### **User Experience:**
- Intuitive navigation
- Real-time feedback
- Error handling
- Loading states
- Toast notifications

### **Accessibility:**
- Keyboard navigation
- Screen reader support
- High contrast colors
- Font size control

---

## 🔒 SECURITY FEATURES

### **Authentication:**
- JWT token-based
- Role-based access control
- Password hashing (bcrypt)
- Session management

### **Authorization:**
- Role validation
- Endpoint protection
- Data access control
- Input validation

---

## 📈 PERFORMANCE OPTIMIZATION

### **Frontend:**
- Code splitting
- Lazy loading
- Memoization
- Optimized re-renders

### **Backend:**
- Database indexing
- Query optimization
- Connection pooling
- Caching strategies

---

## 🐛 DEBUGGING & LOGGING

### **Console Logs:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 200, 300, 400 (debug logs)

### **Server Logs:**
- File: `server_modern.js`
- Line: 698, 780, 862 (API logs)

---

## 📝 CATATAN PENTING

1. **Role Admin** memiliki akses penuh ke seluruh sistem
2. **User Management** untuk mengelola akun guru dan siswa
3. **Data Management** untuk mengelola data master
4. **System Monitoring** untuk memantau performa sistem
5. **Backup & Recovery** untuk keamanan data
6. **Reports & Analytics** untuk analisis komprehensif

---

## 🆘 TROUBLESHOOTING

### **Common Issues:**
1. **Server tidak berjalan:** Pastikan `npm run start:modern`
2. **Database error:** Check connection di `server_modern.js`
3. **Login gagal:** Verify credentials di database
4. **CORS error:** Check server configuration

### **Error Codes:**
- **401:** Unauthorized (token invalid)
- **403:** Forbidden (role tidak sesuai)
- **404:** Not found (endpoint tidak ada)
- **500:** Server error (database/network issue)

---

## 📋 DAFTAR FITUR ADMIN LENGKAP

### **1. User Management**
- Tambah/Edit/Hapus Akun Guru
- Tambah/Edit/Hapus Akun Siswa
- Manajemen Data Guru
- Manajemen Data Siswa

### **2. Data Master Management**
- Mata Pelajaran (CRUD)
- Kelas (CRUD)
- Jadwal Pelajaran (CRUD)

### **3. System Management**
- Backup & Archive Management
- Load Balancer & Performance Monitoring
- System Monitoring & Alerting
- Disaster Recovery & Restore

### **4. Reports & Analytics**
- Live Teacher Attendance
- Live Student Attendance
- Teacher Attendance Report
- Student Attendance Report
- Student Attendance Summary
- Teacher Attendance Summary
- Banding Absen Report
- Presensi Siswa SMK 13
- Rekap Ketidakhadiran

### **5. System Administration**
- Database Optimization
- Performance Monitoring
- Security Audit
- System Health Check

---

## 🔄 WORKFLOW ADMIN

### **1. Login & Dashboard**
- Masuk dengan kredensial admin
- Lihat overview sistem
- Navigasi ke fitur yang diinginkan

### **2. User Management**
- Kelola akun guru dan siswa
- Input data lengkap user
- Atur hak akses dan role

### **3. Data Master**
- Kelola mata pelajaran
- Kelola kelas
- Atur jadwal pelajaran

### **4. System Monitoring**
- Pantau performa sistem
- Kelola backup dan recovery
- Monitor load balancer

### **5. Reports & Analytics**
- Generate laporan kehadiran
- Analisis data absensi
- Export laporan Excel/CSV

---

## 🎯 PERBANDINGAN ROLE

### **Admin vs Guru vs Siswa:**

| Fitur | Admin | Guru | Siswa |
|-------|-------|------|-------|
| **User Management** | ✅ Full | ❌ | ❌ |
| **Data Master** | ✅ Full | ❌ | ❌ |
| **System Monitoring** | ✅ Full | ❌ | ❌ |
| **Backup & Recovery** | ✅ Full | ❌ | ❌ |
| **Absensi Siswa** | ✅ View | ✅ Full | ❌ |
| **Absensi Guru** | ✅ View | ❌ | ✅ Full |
| **Pengajuan Izin** | ✅ View | ✅ Approve | ✅ Submit |
| **Banding Absen** | ✅ View | ✅ Approve | ✅ Submit |
| **Laporan** | ✅ Full | ✅ Limited | ❌ |

---

*Dokumentasi ini dibuat untuk memudahkan pemahaman struktur dan implementasi fitur Role Admin dalam Sistem Absenta.*
