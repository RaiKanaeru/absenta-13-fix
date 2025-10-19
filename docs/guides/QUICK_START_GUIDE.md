# ⚡ **QUICK START GUIDE - SISTEM ABSENTA**

## 🚀 **MENJALANKAN SISTEM DALAM 5 MENIT**

### **1. Prerequisites Check**
```bash
# Cek Node.js
node --version
# Harus v18.0.0+

# Cek npm
npm --version
# Harus v8.0.0+

# Cek MySQL
mysql --version
# Harus v8.0.0+
```

### **2. Setup Database**
```bash
# Login ke MySQL
mysql -u root -p

# Buat database
CREATE DATABASE absenta13;
USE absenta13;

# Import schema
SOURCE database/schema/absenta13.sql;
```

### **3. Install Dependencies**
```bash
npm install
```

### **4. Konfigurasi Environment**
```bash
# Copy environment file
cp config/environment/.env.example .env

# Edit .env file
# Set DB_PASSWORD=your_mysql_password
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

## 🔧 **TROUBLESHOOTING CEPAT**

### **❌ Port 3001 sudah digunakan**
```bash
# Kill process
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

### **❌ Port 5173 sudah digunakan**
```bash
# Kill process
netstat -ano | findstr :5173
taskkill /F /PID <PID>
```

### **❌ Database connection failed**
```bash
# Cek MySQL service
net start mysql

# Cek .env file
cat .env
```

### **❌ Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📋 **CHECKLIST SETUP**

- [ ] Node.js v18+ installed
- [ ] MySQL v8+ installed and running
- [ ] Database `absenta13` created
- [ ] Schema imported
- [ ] Dependencies installed
- [ ] Environment configured
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173

---

## 🎯 **AKUN DEFAULT**

```
Admin:
Username: admin
Password: admin123

Guru:
Username: guru1
Password: guru123

Siswa:
Username: siswa1
Password: siswa123
```

---

## 📞 **BUTUH BANTUAN?**

- 📄 **Full Guide**: `docs/guides/SISTEM_ABSENTA_GUIDE.md`
- 📄 **Debug Guide**: `docs/guides/DEBUG_GUIDE.md`
- 📄 **Troubleshooting**: `docs/guides/TROUBLESHOOTING_GUIDE.md`

**Sistem siap digunakan! 🎉**
