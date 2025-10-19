# 🚀 **PANDUAN MENJALANKAN SISTEM ABSENTA**

## 📋 **DAFTAR ISI**

1. [Persyaratan Sistem](#persyaratan-sistem)
2. [Instalasi dan Setup](#instalasi-dan-setup)
3. [Menjalankan Backend](#menjalankan-backend)
4. [Menjalankan Frontend](#menjalankan-frontend)
5. [Menjalankan Keduanya](#menjalankan-keduanya)
6. [Akses Sistem](#akses-sistem)
7. [Troubleshooting](#troubleshooting)
8. [Struktur Proyek](#struktur-proyek)

---

## 🖥️ **PERSYARATAN SISTEM**

### **Software yang Diperlukan**
- **Node.js**: v18.0.0 atau lebih tinggi
- **npm**: v8.0.0 atau lebih tinggi
- **MySQL**: v8.0.0 atau lebih tinggi
- **Git**: v2.30.0 atau lebih tinggi

### **Sistem Operasi**
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Ubuntu 18.04+
- ✅ CentOS 7+

### **Spesifikasi Minimum**
- **RAM**: 4GB (8GB recommended)
- **Storage**: 2GB free space
- **CPU**: 2 cores (4 cores recommended)

---

## ⚙️ **INSTALASI DAN SETUP**

### **1. Clone Repository**
```bash
git clone https://github.com/RaiKanaeru/absenta-13-v1.git
cd absenta-13-v1
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Setup Database**
```bash
# Import database schema
mysql -u root -p < database/schema/absenta13.sql

# Atau menggunakan MySQL Workbench
# Buka file: database/schema/absenta13.sql
# Jalankan script SQL
```

### **4. Konfigurasi Environment**
```bash
# Copy file environment
cp config/environment/.env.example .env

# Edit file .env dengan konfigurasi database Anda
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=absenta13
```

---

## 🔧 **MENJALANKAN BACKEND**

### **Metode 1: Menggunakan npm Script (RECOMMENDED)**
```bash
# Menjalankan server modern
npm run start:modern

# Menjalankan server modular
npm run start:modular

# Menjalankan server HTTPS
npm run start:https
```

### **Metode 2: Langsung dengan Node.js**
```bash
# Server modern
node scripts/maintenance/server_modern.js

# Server modular
node scripts/maintenance/server_modular.js

# Server HTTPS
node scripts/maintenance/server_https.js
```

### **Verifikasi Backend Berjalan**
```bash
# Cek port 3001
netstat -an | findstr :3001

# Test API
curl http://localhost:3001/api/health
```

**✅ Backend berhasil jika:**
- Port 3001 listening
- API health check mengembalikan response
- Database connection berhasil

---

## 🎨 **MENJALANKAN FRONTEND**

### **Metode 1: Menggunakan npm Script (RECOMMENDED)**
```bash
# Menjalankan frontend development server
npm run dev
```

### **Metode 2: Langsung ke Folder Frontend**
```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies (jika belum)
npm install

# Jalankan development server
npm run dev
```

### **Verifikasi Frontend Berjalan**
```bash
# Cek port 5173
netstat -an | findstr :5173
```

**✅ Frontend berhasil jika:**
- Port 5173 listening
- Browser dapat mengakses http://localhost:5173
- Vite development server running

---

## 🚀 **MENJALANKAN KEDUANYA**

### **Metode 1: Menggunakan npm Script**
```bash
# Menjalankan backend dan frontend bersamaan
npm run dev:full
```

### **Metode 2: Manual (2 Terminal)**
```bash
# Terminal 1 - Backend
npm run start:modern

# Terminal 2 - Frontend
npm run dev
```

### **Metode 3: PowerShell (Windows)**
```powershell
# Terminal 1 - Backend
node scripts/maintenance/server_modern.js

# Terminal 2 - Frontend
cd frontend; npm run dev
```

---

## 🌐 **AKSES SISTEM**

### **URL Akses**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### **Akun Default**
```
Admin:
- Username: admin
- Password: admin123

Guru:
- Username: guru1
- Password: guru123

Siswa:
- Username: siswa1
- Password: siswa123
```

### **Fitur Utama**
- ✅ **Login System**: Multi-role authentication
- ✅ **Dashboard**: Role-based dashboard
- ✅ **Attendance**: Teacher & student attendance
- ✅ **Schedule**: Class schedule management
- ✅ **Reports**: Attendance reports
- ✅ **Admin Panel**: User management

---

## 🔧 **TROUBLESHOOTING**

### **❌ Error: Cannot find module**
```bash
# Solusi: Install dependencies
npm install

# Atau clear cache
npm cache clean --force
```

### **❌ Error: Port already in use**
```bash
# Cek port yang digunakan
netstat -an | findstr :3001
netstat -an | findstr :5173

# Kill process yang menggunakan port
# Windows
taskkill /F /PID <PID>

# Linux/Mac
kill -9 <PID>
```

### **❌ Error: Database connection failed**
```bash
# Cek MySQL service
# Windows
net start mysql

# Linux
sudo systemctl start mysql

# Cek konfigurasi .env
cat .env
```

### **❌ Error: Frontend tidak bisa akses backend**
```bash
# Cek CORS configuration
# Pastikan backend berjalan di port 3001
# Pastikan frontend berjalan di port 5173
```

### **❌ Error: Import path tidak ditemukan**
```bash
# Pastikan file db.js ada di root
ls -la db.js

# Jika tidak ada, copy dari scripts/maintenance/
cp scripts/maintenance/db.js .
```

---

## 📁 **STRUKTUR PROYEK**

```
absenta-optimize-old/
├── 📁 backend/                    # Backend modular
│   ├── controllers/              # HTTP request handlers
│   ├── services/                 # Business logic
│   ├── repositories/              # Database operations
│   ├── routes/                   # API endpoints
│   ├── middleware/               # Express middleware
│   ├── utils/                    # Utility functions
│   └── export/                   # Export functionality
├── 📁 frontend/                   # Frontend React
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── hooks/                    # Custom hooks
│   ├── utils/                    # Frontend utilities
│   └── lib/                      # Library utilities
├── 📁 database/                   # Database files
│   ├── schema/                   # Database schema
│   ├── backups/                  # Database backups
│   ├── migrations/               # Database migrations
│   └── scripts/                 # Database scripts
├── 📁 scripts/                    # Utility scripts
│   ├── database/                 # Database scripts
│   ├── maintenance/              # Maintenance scripts
│   ├── testing/                  # Testing scripts
│   └── deployment/               # Deployment scripts
├── 📁 docs/                       # Documentation
│   ├── guides/                   # User guides
│   ├── api/                      # API documentation
│   ├── analysis/                 # System analysis
│   ├── implementation/           # Implementation docs
│   └── fixes/                    # Fix documentation
├── 📁 config/                     # Configuration files
├── 📁 tests/                      # Test files
├── 📁 logs/                       # Log files
├── 📁 backups/                    # Backup files
├── 📁 temp/                       # Temporary files
├── 📁 archives/                   # Archive files
├── 📁 cache/                      # Cache files
├── 📁 dist/                       # Build output
├── 📁 downloads/                  # Download files
├── 📁 migrations/                 # Migration files
├── 📁 node_modules/               # Dependencies
├── 📁 public/                     # Public assets
├── 📁 redis/                      # Redis files
├── 📁 reports/                    # Report files
├── 📁 backup/                     # Backup files
├── 📄 .env                        # Environment variables
├── 📄 .gitignore                  # Git ignore
├── 📄 .cursorignore               # Cursor ignore
├── 📄 package.json                # Package configuration
└── 📄 db.js                       # Database connection
```

---

## 🎯 **SCRIPT YANG TERSEDIA**

### **Backend Scripts**
```bash
npm run start:modern      # Server modern
npm run start:modular     # Server modular
npm run start:https       # Server HTTPS
```

### **Frontend Scripts**
```bash
npm run dev              # Frontend development
npm run build            # Build frontend
npm run preview          # Preview build
```

### **Combined Scripts**
```bash
npm run dev:full         # Backend + Frontend
npm run dev:setup        # Setup database + Backend + Frontend
```

### **Testing Scripts**
```bash
npm run test             # Run tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
```

---

## 📊 **MONITORING DAN LOGS**

### **Log Files**
- **Server Logs**: `logs/server.log`
- **Error Logs**: `logs/error.log`
- **Access Logs**: `logs/access.log`

### **Health Check**
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend health
curl http://localhost:5173
```

### **Performance Monitoring**
```bash
# Cek penggunaan port
netstat -an | findstr :3001
netstat -an | findstr :5173

# Cek proses Node.js
tasklist | findstr node
```

---

## 🔒 **SECURITY**

### **Environment Variables**
- ✅ JWT_SECRET: Secret key untuk JWT
- ✅ DB_PASSWORD: Database password
- ✅ SESSION_SECRET: Session secret

### **Database Security**
- ✅ Password hashing dengan bcrypt
- ✅ SQL injection prevention
- ✅ Input validation

### **API Security**
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Authentication middleware

---

## 📞 **SUPPORT**

### **Dokumentasi Lengkap**
- 📁 `docs/guides/` - User guides
- 📁 `docs/api/` - API documentation
- 📁 `docs/analysis/` - System analysis

### **Troubleshooting**
- 📄 `docs/guides/DEBUG_GUIDE.md`
- 📄 `docs/guides/TROUBLESHOOTING_GUIDE.md`
- 📄 `docs/guides/TESTING_GUIDE.md`

### **Contact**
- **GitHub**: https://github.com/RaiKanaeru/absenta-13-v1
- **Issues**: https://github.com/RaiKanaeru/absenta-13-v1/issues

---

## 🎉 **KESIMPULAN**

Sistem Absenta telah berhasil direorganisasi dan siap digunakan dengan struktur yang rapi dan terorganisir. Ikuti panduan di atas untuk menjalankan sistem dengan benar.

**Happy Coding! 🚀**
