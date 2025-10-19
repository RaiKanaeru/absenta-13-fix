# 📚 **DOKUMENTASI SISTEM ABSENTA**

## 🎯 **PANDUAN LENGKAP**

Selamat datang di dokumentasi Sistem Absenta! Dokumentasi ini berisi panduan lengkap untuk menggunakan, mengembangkan, dan memelihara sistem Absenta.

---

## 📋 **DAFTAR DOKUMENTASI**

### 🚀 **Getting Started**
- [**Quick Start Guide**](guides/QUICK_START_GUIDE.md) - Menjalankan sistem dalam 5 menit
- [**Sistem Absenta Guide**](guides/SISTEM_ABSENTA_GUIDE.md) - Panduan lengkap sistem
- [**Deployment Guide**](guides/DEPLOYMENT_GUIDE.md) - Panduan deployment production

### 🔧 **Troubleshooting**
- [**Troubleshooting Guide**](guides/TROUBLESHOOTING_GUIDE.md) - Solusi masalah umum
- [**Debug Guide**](guides/DEBUG_GUIDE.md) - Panduan debugging
- [**Testing Guide**](guides/TESTING_GUIDE.md) - Panduan testing

### 📊 **Analysis & Implementation**
- [**System Analysis**](analysis/) - Analisis sistem
- [**Implementation Docs**](implementation/) - Dokumentasi implementasi
- [**Fix Documentation**](fixes/) - Dokumentasi perbaikan

### 🔌 **API Documentation**
- [**API Endpoints**](api/) - Dokumentasi API
- [**Frontend Integration**](api/) - Integrasi frontend

---

## 🚀 **QUICK START**

### **1. Prerequisites**
```bash
# Cek Node.js
node --version  # Harus v18.0.0+

# Cek MySQL
mysql --version  # Harus v8.0.0+
```

### **2. Setup Database**
```bash
# Import database
mysql -u root -p < database/schema/absenta13.sql
```

### **3. Install Dependencies**
```bash
npm install
```

### **4. Konfigurasi Environment**
```bash
# Copy environment file
cp config/environment/.env.example .env
# Edit .env dengan konfigurasi database Anda
```

### **5. Jalankan Sistem**
```bash
# Terminal 1 - Backend
npm run start:modern

# Terminal 2 - Frontend
npm run dev
```

### **6. Akses Sistem**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

---

## 🏗️ **STRUKTUR PROYEK**

```
absenta-optimize-old/
├── 📁 backend/                    # Backend modular
│   ├── controllers/               # HTTP request handlers
│   ├── services/                  # Business logic
│   ├── repositories/              # Database operations
│   ├── routes/                    # API endpoints
│   ├── middleware/                # Express middleware
│   ├── utils/                     # Utility functions
│   └── export/                    # Export functionality
├── 📁 frontend/                   # Frontend React
│   ├── components/                # React components
│   ├── pages/                     # Page components
│   ├── hooks/                     # Custom hooks
│   ├── utils/                     # Frontend utilities
│   └── lib/                       # Library utilities
├── 📁 database/                   # Database files
│   ├── schema/                    # Database schema
│   ├── backups/                   # Database backups
│   ├── migrations/                # Database migrations
│   └── scripts/                   # Database scripts
├── 📁 scripts/                    # Utility scripts
│   ├── database/                  # Database scripts
│   ├── maintenance/               # Maintenance scripts
│   ├── testing/                   # Testing scripts
│   └── deployment/                # Deployment scripts
├── 📁 docs/                       # Documentation
│   ├── guides/                    # User guides
│   ├── api/                       # API documentation
│   ├── analysis/                  # System analysis
│   ├── implementation/            # Implementation docs
│   └── fixes/                     # Fix documentation
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
├── 📁 reports/                  # Report files
├── 📁 backup/                     # Backup files
├── 📄 .env                        # Environment variables
├── 📄 .gitignore                  # Git ignore
├── 📄 .cursorignore               # Cursor ignore
├── 📄 package.json                # Package configuration
└── 📄 db.js                       # Database connection
```

---

## 🎯 **FITUR UTAMA**

### **🔐 Authentication & Authorization**
- Multi-role authentication (Admin, Guru, Siswa)
- JWT token-based authentication
- Password hashing dengan bcrypt
- Session management

### **📊 Attendance Management**
- Teacher attendance recording
- Student attendance tracking
- Attendance reports
- Schedule management

### **👥 User Management**
- Admin panel untuk user management
- Role-based access control
- Profile management
- Password management

### **📈 Reporting System**
- Attendance reports
- Performance analytics
- Export functionality (Excel, PDF)
- Custom report generation

### **🔧 System Features**
- Real-time updates
- Responsive design
- Mobile-friendly interface
- Offline capability

---

## 🛠️ **DEVELOPMENT**

### **Scripts yang Tersedia**
```bash
# Backend
npm run start:modern      # Server modern
npm run start:modular     # Server modular
npm run start:https       # Server HTTPS

# Frontend
npm run dev              # Frontend development
npm run build            # Build frontend
npm run preview          # Preview build

# Combined
npm run dev:full         # Backend + Frontend
npm run dev:setup        # Setup database + Backend + Frontend

# Testing
npm run test             # Run tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
```

### **Development Workflow**
1. **Setup**: Clone repository dan install dependencies
2. **Database**: Setup database dan import schema
3. **Environment**: Konfigurasi environment variables
4. **Development**: Jalankan development server
5. **Testing**: Jalankan tests
6. **Deployment**: Deploy ke production

---

## 🔒 **SECURITY**

### **Security Features**
- ✅ Password hashing dengan bcrypt
- ✅ JWT token authentication
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection

### **Security Best Practices**
- ✅ Environment variables untuk sensitive data
- ✅ HTTPS enforcement
- ✅ Security headers
- ✅ Input sanitization
- ✅ Output encoding

---

## 📞 **SUPPORT**

### **Dokumentasi Lengkap**
- 📁 `docs/guides/` - User guides
- 📁 `docs/api/` - API documentation
- 📁 `docs/analysis/` - System analysis
- 📁 `docs/implementation/` - Implementation docs
- 📁 `docs/fixes/` - Fix documentation

### **Troubleshooting**
- 📄 `docs/guides/TROUBLESHOOTING_GUIDE.md`
- 📄 `docs/guides/DEBUG_GUIDE.md`
- 📄 `docs/guides/TESTING_GUIDE.md`

### **Contact**
- **GitHub**: https://github.com/RaiKanaeru/absenta-13-v1
- **Issues**: https://github.com/RaiKanaeru/absenta-13-v1/issues

---

## 🎉 **KESIMPULAN**

Sistem Absenta adalah sistem manajemen kehadiran yang lengkap dengan fitur-fitur modern dan arsitektur yang scalable. Dokumentasi ini menyediakan panduan lengkap untuk menggunakan, mengembangkan, dan memelihara sistem.

**Happy Coding! 🚀**

---

## 📝 **CHANGELOG**

### **v1.0.0** - Initial Release
- ✅ Modular architecture
- ✅ React frontend
- ✅ MySQL database
- ✅ JWT authentication
- ✅ Attendance management
- ✅ Reporting system
- ✅ Admin panel
- ✅ Mobile responsive

### **v1.1.0** - Reorganization
- ✅ Project reorganization
- ✅ Documentation update
- ✅ Performance optimization
- ✅ Security improvements
- ✅ Testing framework
- ✅ Deployment guide

---

**© 2025 Sistem Absenta. All rights reserved.**
