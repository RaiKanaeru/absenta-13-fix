# 👨‍🏫 README ROLE GURU - SISTEM ABSENTA

## 🎯 OVERVIEW
Sistem Absenta untuk **Role Guru** adalah dashboard khusus untuk guru yang memiliki akses untuk mengelola kehadiran siswa, menyetujui pengajuan izin, memproses banding absen, dan melihat berbagai laporan kehadiran.

---

## 🔐 FITUR UTAMA ROLE GURU

### 1. **LOGIN & AUTHENTICATION**
**Frontend:**
- File: `src/components/LoginForm_Modern.tsx`
- Line: 1-500 (komponen login utama)
- Line: 200-300 (validasi form login)
- Line: 400-500 (handle submit login)

**Backend:**
- File: `server_modern.js`
- Line: 439-460 (autentikasi role guru)
- Line: 244-271 (endpoint info guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - autentikasi)
- Line: 244-271 (tabel `guru` - data guru)

---

### 2. **DASHBOARD UTAMA**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 2984-3043 (komponen utama dashboard)
- Line: 3045-3214 (render layout dashboard)
- Line: 3074-3115 (navigasi sidebar)

**Backend:**
- File: `server_modern.js`
- Line: 439-460 (autentikasi role guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 244-271 (tabel `guru`)

---

### 3. **JADWAL HARI INI**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 182-270 (ScheduleListView component)
- Line: 2995-3039 (fetch schedules)
- Line: 3000-3030 (process schedule data)

**Backend:**
- File: `server_modern.js`
- Line: 3475-3516 (endpoint jadwal guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 278-316 (tabel `jadwal` - jadwal pelajaran)
- Line: 244-271 (tabel `guru` - data guru)

---

### 4. **ABSENSI SISWA**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 272-850 (AttendanceView component)
- Line: 400-600 (form input absensi siswa)
- Line: 700-800 (submit attendance)

**Backend:**
- File: `server_modern.js`
- Line: 1288-1397 (endpoint get students for schedule)
- Line: 1399-1567 (endpoint submit attendance)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran siswa)
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)

---

### 5. **PENGAJUAN IZIN SISWA**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 851-1071 (RiwayatPengajuanIzinView component)
- Line: 900-1000 (form approve/reject izin)
- Line: 1000-1070 (display pengajuan izin)

**Backend:**
- File: `server_modern.js`
- Line: 3007-3096 (endpoint get pengajuan izin guru)
- Line: 3099-3140 (endpoint approve/reject pengajuan izin)

**Database:**
- File: `absenta13 (1).sql`
- Line: 565-646 (tabel `pengajuan_izin_siswa` - data pengajuan izin)
- Line: 485-558 (tabel `pengajuan_izin_detail` - detail siswa yang izin)

---

### 6. **BANDING ABSEN SISWA**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 1074-1298 (RiwayatBandingAbsenView component)
- Line: 1100-1200 (form approve/reject banding)
- Line: 1200-1298 (display banding absen)

**Backend:**
- File: `server_modern.js`
- Line: 5385-5450 (endpoint get banding absen guru)
- Line: 5452-5520 (endpoint approve/reject banding absen)

**Database:**
- File: `absenta13 (1).sql`
- Line: 404-452 (tabel `pengajuan_banding_absen` - data banding absen)
- Line: 176-218 (tabel `banding_absen_detail` - detail siswa yang banding)

---

### 7. **RIWAYAT ABSENSI**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 2706-2981 (HistoryView component)
- Line: 2800-2900 (display history data)
- Line: 2900-2980 (pagination history)

**Backend:**
- File: `server_modern.js`
- Line: 3519-3550 (endpoint teacher history)
- Line: 3553-3658 (endpoint student attendance history)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran siswa)
- Line: 30-52 (tabel `absensi_guru` - data kehadiran guru)

---

### 8. **LAPORAN KEHADIRAN**
**Frontend:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 1300-2705 (ReportsView component)
- Line: 1400-1500 (laporan kehadiran siswa)
- Line: 1500-1600 (laporan pengajuan izin)
- Line: 1600-1700 (laporan banding absen)
- Line: 1700-1800 (laporan presensi SMK 13)
- Line: 1800-1900 (laporan rekap ketidakhadiran)

**Backend:**
- File: `server_modern.js`
- Line: 2310-2351 (endpoint attendance summary)
- Line: 2354-2446 (endpoint laporan kehadiran siswa)
- Line: 2449-2649 (endpoint download laporan kehadiran)
- Line: 2652-2700 (endpoint download attendance excel)
- Line: 5827-5879 (endpoint pengajuan izin history)
- Line: 5882-5934 (endpoint banding absen history)
- Line: 6164-6342 (endpoint presensi siswa SMK 13)
- Line: 6345-6500 (endpoint rekap ketidakhadiran)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran siswa)
- Line: 565-646 (tabel `pengajuan_izin_siswa` - data pengajuan izin)
- Line: 404-452 (tabel `pengajuan_banding_absen` - data banding absen)

---

## 🗂️ STRUKTUR FILE UTAMA

### **Frontend (React + TypeScript)**
```
src/
├── components/
│   ├── TeacherDashboard_Modern.tsx   # Dashboard utama guru
│   ├── LoginForm_Modern.tsx          # Form login
│   ├── ExcelPreview.tsx              # Preview Excel
│   └── ui/                           # Komponen UI (shadcn/ui)
├── pages/
│   └── Index_Modern.tsx              # Halaman utama
└── main.tsx                          # Entry point aplikasi
```

### **Backend (Node.js + Express)**
```
server_modern.js                       # Server utama (90,509 tokens)
├── Authentication (Line 439-460)
├── Guru Endpoints (Line 2294-8017)
├── Database Operations
└── API Routes
```

### **Database (MySQL)**
```
absenta13 (1).sql                      # Database schema
├── users (Line 720-753)               # Tabel user
├── guru (Line 244-271)                # Tabel guru
├── absensi_siswa (Line 79-134)        # Tabel kehadiran siswa
├── absensi_guru (Line 30-52)          # Tabel kehadiran guru
├── pengajuan_izin_siswa (Line 565-646) # Tabel pengajuan izin
└── pengajuan_banding_absen (Line 404-452) # Tabel banding absen
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
- Login sebagai guru

---

## 👤 CREDENTIALS LOGIN GURU

### **Guru Matematika:**
- **Username:** `guru_matematika`
- **Password:** `123456`
- **Role:** Guru Matematika

### **Guru Biologi:**
- **Username:** `guru_biologi`
- **Password:** `123456`
- **Role:** Guru Biologi

### **Guru Fisika:**
- **Username:** `guru_fisika`
- **Password:** `123456`
- **Role:** Guru Fisika

### **Guru Sejarah:**
- **Username:** `guru_sejarah`
- **Password:** `123456`
- **Role:** Guru Sejarah

---

## 📱 FITUR MOBILE RESPONSIVE

### **Responsive Design:**
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 3047-3147 (sidebar mobile)
- Line: 3152-3163 (header mobile)
- Line: 3120-3124 (font size control mobile)

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

### **Jumlah Endpoint API Guru:**
- **Total:** 19 endpoint khusus guru
- **Authentication:** 1 endpoint
- **Jadwal:** 1 endpoint
- **Absensi:** 3 endpoint
- **Pengajuan Izin:** 3 endpoint
- **Banding Absen:** 3 endpoint
- **Laporan:** 6 endpoint
- **Download:** 2 endpoint

### **Jumlah Tabel Database:**
- **Total:** 8 tabel terkait guru
- **Core Tables:** 4 tabel utama
- **Support Tables:** 4 tabel pendukung

### **Jumlah Komponen Frontend:**
- **Total:** 1 komponen utama
- **Sub-components:** 8 render functions
- **UI Components:** 25+ komponen shadcn/ui

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
- File: `src/components/TeacherDashboard_Modern.tsx`
- Line: 2996, 3000, 3034 (debug logs)

### **Server Logs:**
- File: `server_modern.js`
- Line: 2296, 2312, 2356 (API logs)

---

## 📝 CATATAN PENTING

1. **Role Guru** memiliki akses penuh ke semua fitur absensi
2. **Jadwal Hari Ini** menampilkan jadwal berdasarkan hari aktif
3. **Absensi Siswa** bisa dilakukan per jadwal pelajaran
4. **Pengajuan Izin** bisa disetujui/ditolak dengan catatan
5. **Banding Absen** untuk koreksi data kehadiran siswa
6. **Laporan** tersedia dalam berbagai format (Excel, CSV)

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

## 📋 DAFTAR LAPORAN TERSEDIA

### **1. Laporan Kehadiran Siswa**
- Ringkasan kehadiran per kelas
- Statistik H/I/S/A/D
- Export Excel/CSV

### **2. Laporan Pengajuan Izin**
- Riwayat pengajuan izin siswa
- Status persetujuan
- Filter berdasarkan periode

### **3. Laporan Banding Absen**
- Riwayat banding absen siswa
- Status keputusan
- Filter berdasarkan kelas

### **4. Laporan Presensi SMK 13**
- Data presensi khusus SMK 13
- Format laporan khusus
- Export Excel

### **5. Laporan Rekap Ketidakhadiran**
- Rekap ketidakhadiran siswa
- Analisis tren absensi
- Export Excel

---

## 🔄 WORKFLOW GURU

### **1. Login & Dashboard**
- Masuk dengan kredensial guru
- Lihat jadwal hari ini
- Navigasi ke fitur yang diinginkan

### **2. Absensi Siswa**
- Pilih jadwal pelajaran
- Input kehadiran siswa
- Simpan data absensi

### **3. Pengajuan Izin**
- Lihat daftar pengajuan izin
- Review alasan izin
- Setujui/tolak dengan catatan

### **4. Banding Absen**
- Lihat daftar banding absen
- Review alasan banding
- Setujui/tolak dengan catatan

### **5. Laporan**
- Pilih jenis laporan
- Set filter periode/kelas
- Download hasil laporan

---

*Dokumentasi ini dibuat untuk memudahkan pemahaman struktur dan implementasi fitur Role Guru dalam Sistem Absenta.*
