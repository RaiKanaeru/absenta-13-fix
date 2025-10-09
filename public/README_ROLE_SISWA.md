# 📚 README ROLE SISWA - SISTEM ABSENTA

## 🎯 OVERVIEW
Sistem Absenta untuk **Role Siswa** adalah dashboard khusus untuk siswa perwakilan kelas yang memiliki akses untuk mengelola kehadiran guru dan mengajukan izin/banding absen untuk seluruh siswa di kelasnya.

---

## 🔐 FITUR UTAMA ROLE SISWA

### 1. **LOGIN & AUTHENTICATION**
**Frontend:**
- File: `src/components/LoginForm_Modern.tsx`
- Line: 1-500 (komponen login utama)
- Line: 200-300 (validasi form login)
- Line: 400-500 (handle submit login)

**Backend:**
- File: `server_modern.js`
- Line: 439-460 (autentikasi role siswa)
- Line: 3702-3735 (endpoint info siswa perwakilan)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - autentikasi)
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)

---

### 2. **DASHBOARD UTAMA**
**Frontend:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 225-300 (komponen utama dashboard)
- Line: 2209-2368 (render layout dashboard)
- Line: 2240-2278 (navigasi sidebar)

**Backend:**
- File: `server_modern.js`
- Line: 3702-3735 (endpoint info siswa perwakilan)

**Database:**
- File: `absenta13 (1).sql`
- Line: 678-712 (tabel `siswa_perwakilan`)

---

### 3. **MENU KEHADIRAN GURU**
**Frontend:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 838-1158 (render kehadiran content)
- Line: 1020-1110 (form input kehadiran guru)
- Line: 715-786 (submit kehadiran)
- Line: 380-428 (load jadwal hari ini)
- Line: 430-482 (load jadwal by date)

**Backend:**
- File: `server_modern.js`
- Line: 3737-3792 (endpoint jadwal hari ini)
- Line: 3795-3872 (endpoint jadwal rentang tanggal)
- Line: 3875-3986 (endpoint submit kehadiran guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 278-316 (tabel `jadwal` - jadwal pelajaran)
- Line: 30-52 (tabel `absensi_guru` - data kehadiran guru)
- Line: 244-271 (tabel `guru` - data guru)

---

### 4. **RIWAYAT KEHADIRAN KELAS**
**Frontend:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 1160-1383 (render riwayat content)
- Line: 1298-1380 (modal detail riwayat)
- Line: 518-538 (load riwayat data)

**Backend:**
- File: `server_modern.js`
- Line: 3989-4070 (endpoint riwayat kehadiran kelas)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran siswa)
- Line: 30-52 (tabel `absensi_guru` - data kehadiran guru)

---

### 5. **PENGAJUAN IZIN KELAS**
**Frontend:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 1386-1718 (render pengajuan izin content)
- Line: 1405-1577 (form pengajuan izin)
- Line: 574-647 (submit pengajuan izin)
- Line: 540-572 (load pengajuan izin)
- Line: 484-516 (load daftar siswa)

**Backend:**
- File: `server_modern.js`
- Line: 2885-2946 (endpoint get pengajuan izin)
- Line: 5111-5207 (endpoint submit pengajuan izin kelas)
- Line: 5077-5108 (endpoint daftar siswa)

**Database:**
- File: `absenta13 (1).sql`
- Line: 565-646 (tabel `pengajuan_izin_siswa` - data pengajuan izin)
- Line: 485-558 (tabel `pengajuan_izin_detail` - detail siswa yang izin)

---

### 6. **PENGAJUAN BANDING ABSEN KELAS**
**Frontend:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 1722-2074 (render banding absen content)
- Line: 1741-1936 (form banding absen)
- Line: 2077-2145 (submit banding absen)
- Line: 669-698 (load banding absen)

**Backend:**
- File: `server_modern.js`
- Line: 5210-5251 (endpoint get banding absen)
- Line: 5299-5400 (endpoint submit banding absen kelas)

**Database:**
- File: `absenta13 (1).sql`
- Line: 404-452 (tabel `pengajuan_banding_absen` - data banding absen)
- Line: 176-218 (tabel `banding_absen_detail` - detail siswa yang banding)

---

## 🗂️ STRUKTUR FILE UTAMA

### **Frontend (React + TypeScript)**
```
src/
├── components/
│   ├── StudentDashboard_Modern.tsx    # Dashboard utama siswa
│   ├── LoginForm_Modern.tsx           # Form login
│   └── ui/                            # Komponen UI (shadcn/ui)
├── pages/
│   └── Index_Modern.tsx               # Halaman utama
└── main.tsx                           # Entry point aplikasi
```

### **Backend (Node.js + Express)**
```
server_modern.js                       # Server utama (90,509 tokens)
├── Authentication (Line 439-460)
├── Siswa Endpoints (Line 2885-5400)
├── Database Operations
└── API Routes
```

### **Database (MySQL)**
```
absenta13 (1).sql                      # Database schema
├── users (Line 720-753)               # Tabel user
├── siswa_perwakilan (Line 678-712)    # Tabel siswa
├── absensi_guru (Line 30-52)          # Tabel kehadiran guru
├── absensi_siswa (Line 79-134)        # Tabel kehadiran siswa
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
- Login sebagai siswa perwakilan kelas

---

## 👤 CREDENTIALS LOGIN SISWA

### **Siswa Perwakilan Kelas:**
- **Username:** `perwakilan_x_ipa1`
- **Password:** `123456`
- **Role:** Siswa Perwakilan Kelas X IPA 1

### **Siswa Biasa:**
- **Username:** `siswa_x_ipa1`
- **Password:** `123456`
- **Role:** Siswa Kelas X IPA 1

---

## 📱 FITUR MOBILE RESPONSIVE

### **Responsive Design:**
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 2212-2315 (sidebar mobile)
- Line: 2320-2331 (header mobile)
- Line: 2364-2365 (font size control mobile)

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

### **Jumlah Endpoint API Siswa:**
- **Total:** 12 endpoint khusus siswa
- **Authentication:** 1 endpoint
- **Kehadiran:** 3 endpoint
- **Pengajuan Izin:** 3 endpoint
- **Banding Absen:** 3 endpoint
- **Data Support:** 2 endpoint

### **Jumlah Tabel Database:**
- **Total:** 8 tabel terkait siswa
- **Core Tables:** 4 tabel utama
- **Support Tables:** 4 tabel pendukung

### **Jumlah Komponen Frontend:**
- **Total:** 1 komponen utama
- **Sub-components:** 6 render functions
- **UI Components:** 20+ komponen shadcn/ui

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
- File: `src/components/StudentDashboard_Modern.tsx`
- Line: 226, 296, 307, 322, 327 (debug logs)

### **Server Logs:**
- File: `server_modern.js`
- Line: 2888, 2953, 5115 (API logs)

---

## 📝 CATATAN PENTING

1. **Role Siswa** hanya untuk siswa perwakilan kelas
2. **Edit Mode** memungkinkan edit absen 7 hari terakhir
3. **Pengajuan Izin** bisa untuk multiple siswa sekaligus
4. **Banding Absen** untuk koreksi data kehadiran
5. **Real-time Updates** untuk semua perubahan data

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

*Dokumentasi ini dibuat untuk memudahkan pemahaman struktur dan implementasi fitur Role Siswa dalam Sistem Absenta.*
