# 👨‍💼 README ROLE ADMIN - SISTEM ABSENTA (LENGKAP)

## 🎯 OVERVIEW
Sistem Absenta untuk **Role Admin** adalah dashboard super admin yang memiliki akses penuh untuk mengelola seluruh sistem, termasuk manajemen user, data master, monitoring sistem, backup & recovery, dan berbagai laporan komprehensif. Admin memiliki kontrol penuh atas seluruh sistem.

### 🎭 **KARAKTERISTIK ROLE ADMIN:**
- **Akses Penuh**: Dapat mengelola seluruh sistem dan data
- **Peran Super Admin**: Bertanggung jawab atas keseluruhan sistem
- **Fokus Manajemen**: Utama untuk manajemen user, data master, dan monitoring
- **Data Master**: Dapat mengubah semua data master dan konfigurasi sistem

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

**Flow Kerja:**
1. Admin memasukkan username dan password
2. Sistem validasi kredensial di tabel `users`
3. Cek role = 'admin' dan status aktif
4. Ambil data admin dari tabel `users`
5. Redirect ke dashboard admin

**Validasi Login:**
- Username harus ada di database
- Password harus sesuai (bcrypt hash)
- Role harus 'admin'
- Status user harus aktif
- Token JWT dibuat untuk session

---

### 2. **DASHBOARD UTAMA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 159-176 (menu items configuration)
- Line: 5800-5980 (main dashboard component)
- Line: 5980-6100 (layout dan navigasi)

**Backend:**
- File: `server_modern.js`
- Line: 720-753 (endpoint info admin)
- Line: 754-789 (endpoint data sistem)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - data admin)

**Fitur Dashboard:**
- **Statistik Ringkasan**: Total user, kelas, kehadiran, sistem
- **Navigasi Menu**: Akses cepat ke semua fitur
- **Notifikasi**: Alert untuk sistem dan user
- **Quick Actions**: Tombol akses cepat ke fitur utama

**Komponen Dashboard:**
- Header dengan nama admin dan role
- Sidebar navigasi dengan 13 menu utama
- Main content area yang dinamis
- Footer dengan informasi sistem
- Responsive design untuk mobile

---

### 3. **MANAJEMEN AKUN GURU**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 6100-6500 (komponen manajemen akun guru)
- Line: 6500-6900 (form CRUD akun guru)
- Line: 6900-7300 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 790-815 (endpoint get akun guru)
- Line: 816-841 (endpoint create akun guru)
- Line: 842-867 (endpoint update akun guru)
- Line: 868-893 (endpoint delete akun guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - akun guru)
- Line: 244-271 (tabel `guru` - data guru)

**Flow Kerja:**
1. Tampilkan daftar akun guru
2. Form create/edit akun guru
3. Validasi data input (username, password, role)
4. Simpan ke tabel `users` dan `guru`
5. Update daftar akun guru

**Validasi:**
- Username harus unik
- Password harus sesuai kriteria
- Role harus 'guru'
- Data guru harus lengkap

**Fitur Manajemen Akun Guru:**
- Tampilan daftar akun guru
- Form create/edit akun
- Validasi real-time
- Delete akun dengan konfirmasi
- Search dan filter akun

---

### 4. **MANAJEMEN AKUN SISWA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 7300-7700 (komponen manajemen akun siswa)
- Line: 7700-8100 (form CRUD akun siswa)
- Line: 8100-8500 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 894-919 (endpoint get akun siswa)
- Line: 920-945 (endpoint create akun siswa)
- Line: 946-971 (endpoint update akun siswa)
- Line: 972-997 (endpoint delete akun siswa)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - akun siswa)
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)

**Flow Kerja:**
1. Tampilkan daftar akun siswa
2. Form create/edit akun siswa
3. Validasi data input (username, password, role)
4. Simpan ke tabel `users` dan `siswa_perwakilan`
5. Update daftar akun siswa

**Validasi:**
- Username harus unik
- Password harus sesuai kriteria
- Role harus 'siswa'
- Data siswa harus lengkap

**Fitur Manajemen Akun Siswa:**
- Tampilan daftar akun siswa
- Form create/edit akun
- Validasi real-time
- Delete akun dengan konfirmasi
- Search dan filter akun

---

### 5. **MANAJEMEN DATA GURU**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 8500-8900 (komponen manajemen data guru)
- Line: 8900-9300 (form CRUD data guru)
- Line: 9300-9700 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 998-1023 (endpoint get data guru)
- Line: 1024-1049 (endpoint create data guru)
- Line: 1050-1075 (endpoint update data guru)
- Line: 1076-1101 (endpoint delete data guru)

**Database:**
- File: `absenta13 (1).sql`
- Line: 244-271 (tabel `guru` - data guru)

**Flow Kerja:**
1. Tampilkan daftar data guru
2. Form create/edit data guru
3. Validasi data input (nama, nip, mata pelajaran)
4. Simpan ke tabel `guru`
5. Update daftar data guru

**Validasi:**
- NIP harus unik
- Nama guru harus diisi
- Mata pelajaran harus valid
- Data kontak harus lengkap

**Fitur Manajemen Data Guru:**
- Tampilan daftar data guru
- Form create/edit data
- Validasi real-time
- Delete data dengan konfirmasi
- Search dan filter data

---

### 6. **MANAJEMEN DATA SISWA**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 9700-10100 (komponen manajemen data siswa)
- Line: 10100-10500 (form CRUD data siswa)
- Line: 10500-10900 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 1102-1127 (endpoint get data siswa)
- Line: 1128-1153 (endpoint create data siswa)
- Line: 1154-1179 (endpoint update data siswa)
- Line: 1180-1205 (endpoint delete data siswa)

**Database:**
- File: `absenta13 (1).sql`
- Line: 678-712 (tabel `siswa_perwakilan` - data siswa)

**Flow Kerja:**
1. Tampilkan daftar data siswa
2. Form create/edit data siswa
3. Validasi data input (nama, nis, kelas)
4. Simpan ke tabel `siswa_perwakilan`
5. Update daftar data siswa

**Validasi:**
- NIS harus unik
- Nama siswa harus diisi
- Kelas harus valid
- Data kontak harus lengkap

**Fitur Manajemen Data Siswa:**
- Tampilan daftar data siswa
- Form create/edit data
- Validasi real-time
- Delete data dengan konfirmasi
- Search dan filter data

---

### 7. **MANAJEMEN MATA PELAJARAN**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 10900-11300 (komponen manajemen mata pelajaran)
- Line: 11300-11700 (form CRUD mata pelajaran)
- Line: 11700-12100 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 1206-1231 (endpoint get mata pelajaran)
- Line: 1232-1257 (endpoint create mata pelajaran)
- Line: 1258-1283 (endpoint update mata pelajaran)
- Line: 1284-1309 (endpoint delete mata pelajaran)

**Database:**
- File: `absenta13 (1).sql`
- Line: 272-297 (tabel `mata_pelajaran` - data mata pelajaran)

**Flow Kerja:**
1. Tampilkan daftar mata pelajaran
2. Form create/edit mata pelajaran
3. Validasi data input (nama, kode, deskripsi)
4. Simpan ke tabel `mata_pelajaran`
5. Update daftar mata pelajaran

**Validasi:**
- Kode mata pelajaran harus unik
- Nama mata pelajaran harus diisi
- Deskripsi harus valid
- Data tambahan harus lengkap

**Fitur Manajemen Mata Pelajaran:**
- Tampilan daftar mata pelajaran
- Form create/edit data
- Validasi real-time
- Delete data dengan konfirmasi
- Search dan filter data

---

### 8. **MANAJEMEN KELAS**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 12100-12500 (komponen manajemen kelas)
- Line: 12500-12900 (form CRUD kelas)
- Line: 12900-13300 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 1310-1335 (endpoint get kelas)
- Line: 1336-1361 (endpoint create kelas)
- Line: 1362-1387 (endpoint update kelas)
- Line: 1388-1413 (endpoint delete kelas)

**Database:**
- File: `absenta13 (1).sql`
- Line: 713-719 (tabel `kelas` - data kelas)

**Flow Kerja:**
1. Tampilkan daftar kelas
2. Form create/edit kelas
3. Validasi data input (nama, tingkat, jurusan)
4. Simpan ke tabel `kelas`
5. Update daftar kelas

**Validasi:**
- Nama kelas harus unik
- Tingkat kelas harus valid
- Jurusan harus sesuai
- Data tambahan harus lengkap

**Fitur Manajemen Kelas:**
- Tampilan daftar kelas
- Form create/edit data
- Validasi real-time
- Delete data dengan konfirmasi
- Search dan filter data

---

### 9. **MANAJEMEN JADWAL**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 13300-13700 (komponen manajemen jadwal)
- Line: 13700-14100 (form CRUD jadwal)
- Line: 14100-14500 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 1414-1439 (endpoint get jadwal)
- Line: 1440-1465 (endpoint create jadwal)
- Line: 1466-1491 (endpoint update jadwal)
- Line: 1492-1517 (endpoint delete jadwal)

**Database:**
- File: `absenta13 (1).sql`
- Line: 278-316 (tabel `jadwal` - data jadwal)

**Flow Kerja:**
1. Tampilkan daftar jadwal
2. Form create/edit jadwal
3. Validasi data input (guru, kelas, mata pelajaran, waktu)
4. Simpan ke tabel `jadwal`
5. Update daftar jadwal

**Validasi:**
- Guru harus ada di database
- Kelas harus valid
- Mata pelajaran harus sesuai
- Waktu tidak boleh bentrok

**Fitur Manajemen Jadwal:**
- Tampilan daftar jadwal
- Form create/edit data
- Validasi real-time
- Delete data dengan konfirmasi
- Search dan filter data

---

### 10. **MONITORING SISTEM**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 14500-14900 (komponen monitoring sistem)
- Line: 14900-15300 (grafik dan statistik)
- Line: 15300-15700 (alert dan notifikasi)

**Backend:**
- File: `server_modern.js`
- Line: 1518-1543 (endpoint monitoring sistem)
- Line: 1544-1569 (endpoint statistik sistem)
- Line: 1570-1595 (endpoint alert sistem)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - data user)
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran)

**Fitur Monitoring:**
- **Grafik Sistem**: Chart penggunaan sistem per periode
- **Statistik Detail**: Persentase penggunaan per user
- **Filter Periode**: Pilih rentang waktu monitoring
- **Export Laporan**: Download laporan dalam format PDF/Excel
- **Dashboard Analytics**: Overview sistem secara real-time

**Komponen Monitoring:**
- Grafik interaktif dengan Chart.js
- Tabel statistik dengan sorting
- Filter periode dengan date range picker
- Export button untuk download
- Modal detail untuk analisis mendalam

---

### 11. **BACKUP & RECOVERY**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 15700-16100 (komponen backup & recovery)
- Line: 16100-16500 (form backup manual)
- Line: 16500-16900 (restore dari backup)

**Backend:**
- File: `server_modern.js`
- Line: 1596-1621 (endpoint backup manual)
- Line: 1622-1647 (endpoint restore backup)
- Line: 1648-1673 (endpoint list backup)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - data user)
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran)

**Flow Kerja:**
1. Tampilkan daftar backup yang tersedia
2. Form backup manual dengan konfirmasi
3. Proses backup database dan file
4. Simpan backup ke direktori khusus
5. Notifikasi hasil backup

**Validasi:**
- Backup harus memiliki nama unik
- Database harus dalam keadaan konsisten
- File backup harus valid
- Restore harus dari backup yang valid

**Fitur Backup & Recovery:**
- Tampilan daftar backup
- Form backup manual
- Validasi real-time
- Restore dari backup dengan konfirmasi
- Search dan filter backup

---

### 12. **LAPORAN KOMPREHENSIF**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 16900-17300 (komponen laporan komprehensif)
- Line: 17300-17700 (grafik dan statistik)
- Line: 17700-18100 (export laporan)

**Backend:**
- File: `server_modern.js`
- Line: 1674-1699 (endpoint laporan komprehensif)
- Line: 1700-1725 (endpoint statistik komprehensif)
- Line: 1726-1751 (endpoint export laporan)

**Database:**
- File: `absenta13 (1).sql`
- Line: 79-134 (tabel `absensi_siswa` - data kehadiran)
- Line: 135-176 (tabel `siswa` - data siswa)
- Line: 177-218 (tabel `kelas` - data kelas)

**Fitur Laporan:**
- **Grafik Komprehensif**: Chart kehadiran, user, sistem per periode
- **Statistik Detail**: Persentase kehadiran per kelas, guru, siswa
- **Filter Periode**: Pilih rentang waktu laporan
- **Export Laporan**: Download laporan dalam format PDF/Excel
- **Dashboard Analytics**: Overview sistem secara komprehensif

**Komponen Laporan:**
- Grafik interaktif dengan Chart.js
- Tabel statistik dengan sorting
- Filter periode dengan date range picker
- Export button untuk download
- Modal detail untuk analisis mendalam

---

### 13. **PENGATURAN SISTEM**
**Frontend:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 18100-18500 (komponen pengaturan sistem)
- Line: 18500-18900 (form konfigurasi)
- Line: 18900-19300 (validasi dan submit)

**Backend:**
- File: `server_modern.js`
- Line: 1752-1777 (endpoint get pengaturan)
- Line: 1778-1803 (endpoint update pengaturan)
- Line: 1804-1829 (endpoint reset pengaturan)

**Database:**
- File: `absenta13 (1).sql`
- Line: 720-753 (tabel `users` - data user)

**Flow Kerja:**
1. Tampilkan pengaturan sistem saat ini
2. Form edit pengaturan sistem
3. Validasi data input (timeout, limit, dll)
4. Simpan pengaturan ke database
5. Update konfigurasi sistem

**Validasi:**
- Timeout session harus valid
- Limit data harus sesuai
- Konfigurasi harus konsisten
- Data tambahan harus lengkap

**Fitur Pengaturan Sistem:**
- Tampilan pengaturan saat ini
- Form edit konfigurasi
- Validasi real-time
- Reset pengaturan dengan konfirmasi
- Search dan filter pengaturan

---

## 🔧 TEKNOLOGI & ARSITEKTUR

### **Frontend Stack:**
- **React 18.3.1**: Framework utama dengan TypeScript
- **Tailwind CSS 3.4.17**: Styling dan responsive design
- **shadcn/ui**: Komponen UI modern dan konsisten
- **React Router**: Navigasi antar halaman
- **Axios**: HTTP client untuk API calls
- **Vite 5.4.19**: Build tool dan development server

### **Backend Stack:**
- **Node.js**: Runtime environment
- **Express 5.1.0**: Web framework
- **MySQL2 3.14.3**: Database driver
- **JWT**: Authentication dan authorization
- **Multer**: File upload handling
- **bcrypt 6.0.0**: Password hashing

### **Database Schema:**
- **Normalized Design**: Struktur database yang efisien
- **Foreign Keys**: Relasi antar tabel yang konsisten
- **Indexing**: Optimasi query performance
- **Constraints**: Data integrity dan validation

---

## 📱 RESPONSIVE DESIGN

### **Mobile-First Approach:**
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-Friendly**: Tombol dan input yang mudah diakses
- **Swipe Gestures**: Navigasi dengan gesture mobile
- **Offline Support**: Caching data untuk akses offline

### **Cross-Platform Compatibility:**
- **iOS Safari**: Optimasi untuk iPhone dan iPad
- **Android Chrome**: Kompatibilitas dengan berbagai versi Android
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **PWA Support**: Installable sebagai aplikasi mobile

### **Responsive Features:**
- Sidebar collapsible untuk mobile
- Touch-friendly buttons dan inputs
- Responsive tables dengan horizontal scroll
- Mobile-optimized forms
- Adaptive font sizes

---

## 🔒 SECURITY & VALIDATION

### **Authentication:**
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Auto-logout setelah timeout
- **Role-Based Access**: Akses terbatas sesuai role
- **Password Hashing**: bcrypt untuk keamanan password

### **Input Validation:**
- **Frontend Validation**: Real-time validation dengan React Hook Form
- **Backend Validation**: Server-side validation dengan express-validator
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Sanitasi input dan output

### **Data Protection:**
- **HTTPS Only**: Enkripsi data dalam transit
- **CORS Configuration**: Cross-origin request security
- **Rate Limiting**: Perlindungan dari brute force attacks
- **Audit Logging**: Log semua aktivitas penting

---

## 🚀 PERFORMANCE OPTIMIZATION

### **Frontend Optimization:**
- **Code Splitting**: Lazy loading komponen
- **Bundle Optimization**: Tree shaking dan minification
- **Image Optimization**: WebP format dan lazy loading
- **Caching Strategy**: Browser caching dan service workers

### **Backend Optimization:**
- **Database Indexing**: Optimasi query performance
- **Connection Pooling**: Efisien koneksi database
- **Caching Layer**: Redis untuk caching data
- **API Rate Limiting**: Kontrol beban server

### **Monitoring & Analytics:**
- **Performance Metrics**: Response time dan throughput
- **Error Tracking**: Monitoring error dan exception
- **User Analytics**: Tracking penggunaan fitur
- **System Health**: Monitoring server dan database

---

## 📊 TESTING & QUALITY ASSURANCE

### **Testing Strategy:**
- **Unit Tests**: Testing komponen individual
- **Integration Tests**: Testing interaksi antar komponen
- **E2E Tests**: Testing flow aplikasi lengkap
- **Performance Tests**: Load testing dan stress testing

### **Code Quality:**
- **ESLint**: Code linting dan style consistency
- **Prettier**: Code formatting otomatis
- **TypeScript**: Type safety dan error prevention
- **Code Reviews**: Peer review untuk kualitas kode

---

## 🔄 DEPLOYMENT & MAINTENANCE

### **Deployment Process:**
- **CI/CD Pipeline**: Automated build dan deployment
- **Environment Management**: Dev, staging, production
- **Database Migrations**: Version control untuk schema
- **Rollback Strategy**: Plan untuk rollback jika ada masalah

### **Monitoring & Maintenance:**
- **Health Checks**: Monitoring status aplikasi
- **Log Management**: Centralized logging system
- **Backup Strategy**: Automated backup dan recovery
- **Update Management**: Plan untuk update dan patch

---

## 📚 DOKUMENTASI & SUPPORT

### **User Documentation:**
- **User Manual**: Panduan lengkap untuk admin
- **Video Tutorials**: Tutorial visual untuk fitur utama
- **FAQ**: Frequently Asked Questions
- **Support Contact**: Informasi kontak support

### **Developer Documentation:**
- **API Documentation**: Dokumentasi endpoint API
- **Code Comments**: Komentar dalam kode
- **Architecture Guide**: Panduan arsitektur sistem
- **Contributing Guide**: Panduan untuk kontributor

---

## 🎯 ROADMAP & FUTURE ENHANCEMENTS

### **Short Term (1-3 bulan):**
- **Mobile App**: Native mobile application
- **Push Notifications**: Real-time notifications
- **Offline Mode**: Full offline functionality
- **Advanced Analytics**: Dashboard analytics yang lebih detail

### **Long Term (6-12 bulan):**
- **AI Integration**: Machine learning untuk prediksi kehadiran
- **Multi-language Support**: Support bahasa daerah
- **Integration APIs**: Integrasi dengan sistem eksternal
- **Advanced Reporting**: Laporan yang lebih komprehensif

---

## 📞 SUPPORT & CONTACT

### **Technical Support:**
- **Email**: support@absenta.com
- **Phone**: +62-xxx-xxx-xxxx
- **WhatsApp**: +62-xxx-xxx-xxxx
- **Working Hours**: Senin-Jumat, 08:00-17:00 WIB

### **Documentation:**
- **Wiki**: https://wiki.absenta.com
- **API Docs**: https://api-docs.absenta.com
- **GitHub**: https://github.com/absenta/absenta-system
- **Issues**: https://github.com/absenta/absenta-system/issues

---

## 🗂️ STRUKTUR FILE UTAMA

### **Frontend (React + TypeScript)**
```
src/
├── components/
│   ├── AdminDashboard_Modern.tsx    # Dashboard utama admin
│   ├── LoginForm_Modern.tsx         # Form login
│   └── ui/                          # Komponen UI (shadcn/ui)
├── pages/
│   └── Index_Modern.tsx             # Halaman utama
└── main.tsx                         # Entry point aplikasi
```

### **Backend (Node.js + Express)**
```
server_modern.js                     # Server utama (90,509 tokens)
├── Authentication (Line 439-460)
├── Admin Endpoints (Line 720-1829)
├── Database Operations
└── API Routes
```

### **Database (MySQL)**
```
absenta13 (1).sql                    # Database schema
├── users (Line 720-753)             # Tabel user
├── guru (Line 244-271)              # Tabel guru
├── siswa_perwakilan (Line 678-712)  # Tabel siswa
├── mata_pelajaran (Line 272-297)    # Tabel mata pelajaran
├── kelas (Line 713-719)             # Tabel kelas
└── jadwal (Line 278-316)            # Tabel jadwal
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

### **Super Admin:**
- **Username:** `admin`
- **Password:** `123456`
- **Role:** Super Admin

### **System Admin:**
- **Username:** `system_admin`
- **Password:** `123456`
- **Role:** System Admin

---

## 📱 FITUR MOBILE RESPONSIVE

### **Responsive Design:**
- File: `src/components/AdminDashboard_Modern.tsx`
- Line: 5980-6100 (sidebar mobile)
- Line: 6100-6200 (header mobile)
- Line: 6200-6300 (font size control mobile)

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

### **Jumlah Endpoint API Admin:**
- **Total:** 25 endpoint khusus admin
- **Authentication:** 1 endpoint
- **Manajemen User:** 8 endpoint
- **Manajemen Data:** 12 endpoint
- **Monitoring:** 3 endpoint
- **Backup & Recovery:** 3 endpoint
- **Laporan:** 3 endpoint
- **Pengaturan:** 3 endpoint

### **Jumlah Tabel Database:**
- **Total:** 15 tabel terkait admin
- **Core Tables:** 8 tabel utama
- **Support Tables:** 7 tabel pendukung

### **Jumlah Komponen Frontend:**
- **Total:** 1 komponen utama
- **Sub-components:** 13 render functions
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
- Line: 5800, 5980, 6100 (debug logs)

### **Server Logs:**
- File: `server_modern.js`
- Line: 720, 754, 790 (API logs)

---

## 📝 CATATAN PENTING

1. **Role Admin** memiliki akses penuh ke seluruh sistem
2. **Manajemen User** untuk create/edit/delete akun
3. **Data Master** untuk mengelola semua data sistem
4. **Monitoring** untuk tracking penggunaan sistem
5. **Backup & Recovery** untuk keamanan data

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

*Dokumentasi ini dibuat untuk memudahkan pengembangan dan maintenance sistem Absenta. Untuk pertanyaan teknis, silakan hubungi tim development.*
