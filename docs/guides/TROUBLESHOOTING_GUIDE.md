# 🔧 **TROUBLESHOOTING GUIDE - SISTEM ABSENTA**

## 📋 **DAFTAR ISI**

1. [Common Issues](#common-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Database Issues](#database-issues)
5. [Network Issues](#network-issues)
6. [Performance Issues](#performance-issues)
7. [Security Issues](#security-issues)

---

## 🚨 **COMMON ISSUES**

### **❌ Error: Cannot find module**
```bash
# Problem: Module not found error
# Solution: Reinstall dependencies
rm -rf node_modules
npm install
```

### **❌ Error: Port already in use**
```bash
# Problem: Port 3001 or 5173 already in use
# Solution: Kill process using port

# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### **❌ Error: Permission denied**
```bash
# Problem: Permission denied error
# Solution: Fix file permissions
chmod +x scripts/maintenance/server_modern.js
chmod 644 package.json
```

### **❌ Error: Out of memory**
```bash
# Problem: JavaScript heap out of memory
# Solution: Increase memory limit
node --max-old-space-size=4096 scripts/maintenance/server_modern.js
```

---

## 🔧 **BACKEND ISSUES**

### **❌ Database Connection Failed**
```bash
# Problem: Cannot connect to database
# Solution: Check database configuration

# 1. Check MySQL service
# Windows
net start mysql

# Linux
sudo systemctl start mysql

# 2. Check .env file
cat .env

# 3. Test database connection
mysql -u root -p -e "SELECT 1"
```

### **❌ JWT Token Invalid**
```bash
# Problem: JWT token validation failed
# Solution: Check JWT configuration

# 1. Check JWT_SECRET in .env
echo $JWT_SECRET

# 2. Clear browser cookies
# 3. Login again
```

### **❌ CORS Error**
```bash
# Problem: CORS policy error
# Solution: Check CORS configuration

# 1. Check CORS settings in server_modern.js
# 2. Ensure frontend URL is allowed
# 3. Check if backend is running on correct port
```

### **❌ File Upload Failed**
```bash
# Problem: File upload not working
# Solution: Check file upload configuration

# 1. Check multer configuration
# 2. Check file size limits
# 3. Check upload directory permissions
```

---

## 🎨 **FRONTEND ISSUES**

### **❌ Build Failed**
```bash
# Problem: Frontend build failed
# Solution: Check build configuration

# 1. Clear cache
npm run build -- --force

# 2. Check TypeScript errors
npm run type-check

# 3. Check dependencies
npm install
```

### **❌ Hot Reload Not Working**
```bash
# Problem: Hot reload not working
# Solution: Check Vite configuration

# 1. Check vite.config.ts
# 2. Restart development server
# 3. Clear browser cache
```

### **❌ API Calls Failed**
```bash
# Problem: API calls returning errors
# Solution: Check API configuration

# 1. Check API base URL
# 2. Check CORS settings
# 3. Check network connectivity
```

### **❌ Component Not Rendering**
```bash
# Problem: React component not rendering
# Solution: Check component code

# 1. Check console for errors
# 2. Check component imports
# 3. Check props passing
```

---

## 🗄️ **DATABASE ISSUES**

### **❌ Database Locked**
```bash
# Problem: Database is locked
# Solution: Check for long-running queries

# 1. Check running processes
SHOW PROCESSLIST;

# 2. Kill long-running queries
KILL <PROCESS_ID>;

# 3. Check for deadlocks
SHOW ENGINE INNODB STATUS;
```

### **❌ Table Not Found**
```bash
# Problem: Table doesn't exist
# Solution: Check database schema

# 1. Check if database exists
SHOW DATABASES;

# 2. Check if table exists
SHOW TABLES;

# 3. Import schema if missing
mysql -u root -p < database/schema/absenta13.sql
```

### **❌ Connection Pool Exhausted**
```bash
# Problem: Too many connections
# Solution: Check connection pool settings

# 1. Check max_connections
SHOW VARIABLES LIKE 'max_connections';

# 2. Increase connection limit
SET GLOBAL max_connections = 200;

# 3. Check connection pool in code
```

### **❌ Slow Queries**
```bash
# Problem: Database queries are slow
# Solution: Optimize queries

# 1. Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

# 2. Analyze slow queries
SHOW PROCESSLIST;

# 3. Add indexes
CREATE INDEX idx_user_id ON users(id);
```

---

## 🌐 **NETWORK ISSUES**

### **❌ Connection Refused**
```bash
# Problem: Connection refused error
# Solution: Check network configuration

# 1. Check if service is running
netstat -an | findstr :3001

# 2. Check firewall settings
# Windows
netsh advfirewall show allprofiles

# Linux
sudo ufw status
```

### **❌ Timeout Error**
```bash
# Problem: Request timeout
# Solution: Check timeout settings

# 1. Check server timeout
# 2. Check client timeout
# 3. Check network latency
```

### **❌ DNS Resolution Failed**
```bash
# Problem: Cannot resolve hostname
# Solution: Check DNS configuration

# 1. Check DNS settings
nslookup your-domain.com

# 2. Use IP address instead
# 3. Check hosts file
```

---

## ⚡ **PERFORMANCE ISSUES**

### **❌ High CPU Usage**
```bash
# Problem: High CPU usage
# Solution: Optimize performance

# 1. Check CPU usage
top
htop

# 2. Check Node.js processes
pm2 monit

# 3. Optimize code
# - Use async/await
# - Implement caching
# - Optimize database queries
```

### **❌ High Memory Usage**
```bash
# Problem: High memory usage
# Solution: Optimize memory usage

# 1. Check memory usage
free -h
pm2 monit

# 2. Optimize memory
# - Use streaming
# - Implement pagination
# - Clear unused variables
```

### **❌ Slow Response Time**
```bash
# Problem: Slow response time
# Solution: Optimize response time

# 1. Check response time
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/api/health"

# 2. Optimize database queries
# 3. Implement caching
# 4. Use CDN
```

---

## 🔒 **SECURITY ISSUES**

### **❌ SQL Injection**
```bash
# Problem: SQL injection vulnerability
# Solution: Use parameterized queries

# 1. Check for raw SQL queries
# 2. Use prepared statements
# 3. Validate input
```

### **❌ XSS Attack**
```bash
# Problem: Cross-site scripting
# Solution: Sanitize input

# 1. Escape HTML output
# 2. Use CSP headers
# 3. Validate input
```

### **❌ CSRF Attack**
```bash
# Problem: Cross-site request forgery
# Solution: Implement CSRF protection

# 1. Use CSRF tokens
# 2. Check referer header
# 3. Use SameSite cookies
```

---

## 🔍 **DEBUGGING TECHNIQUES**

### **1. Enable Debug Logging**
```bash
# Set debug environment
export DEBUG=*
export NODE_ENV=development

# Run with debug
node --inspect scripts/maintenance/server_modern.js
```

### **2. Check Logs**
```bash
# Check application logs
tail -f logs/server.log
tail -f logs/error.log

# Check system logs
sudo journalctl -u absenta-backend -f
```

### **3. Use Debugging Tools**
```bash
# Chrome DevTools
# 1. Open Chrome
# 2. Go to chrome://inspect
# 3. Click "Open dedicated DevTools for Node"
```

### **4. Database Debugging**
```sql
-- Enable query logging
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general.log';

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

---

## 🛠️ **MAINTENANCE TASKS**

### **Daily Tasks**
```bash
# Check system health
curl http://localhost:3001/api/health

# Check disk space
df -h

# Check memory usage
free -h

# Check logs for errors
grep "ERROR" logs/error.log | tail -10
```

### **Weekly Tasks**
```bash
# Update dependencies
npm update

# Check security vulnerabilities
npm audit

# Clean old logs
find logs/ -name "*.log" -mtime +7 -delete
```

### **Monthly Tasks**
```bash
# Database optimization
mysql -u root -p -e "OPTIMIZE TABLE users, jadwal, absensi_guru, absensi_siswa;"

# Backup verification
# Test restore from backup

# Performance analysis
# Analyze slow query log
```

---

## 📞 **GETTING HELP**

### **Self-Help Resources**
- 📄 **Full Guide**: `docs/guides/SISTEM_ABSENTA_GUIDE.md`
- 📄 **Quick Start**: `docs/guides/QUICK_START_GUIDE.md`
- 📄 **Deployment**: `docs/guides/DEPLOYMENT_GUIDE.md`

### **Log Analysis**
```bash
# Common error patterns
grep "ERROR" logs/error.log | sort | uniq -c | sort -nr

# Performance issues
grep "slow" logs/server.log

# Security issues
grep "unauthorized" logs/access.log
```

### **System Information**
```bash
# System info
uname -a
cat /etc/os-release

# Node.js info
node --version
npm --version

# Database info
mysql --version
```

---

## 🎯 **TROUBLESHOOTING CHECKLIST**

### **Before Reporting Issues**
- [ ] Check logs for error messages
- [ ] Verify system requirements
- [ ] Test with default configuration
- [ ] Check network connectivity
- [ ] Verify database connection
- [ ] Check file permissions
- [ ] Clear cache and restart services

### **When Reporting Issues**
- [ ] Include error messages
- [ ] Include system information
- [ ] Include steps to reproduce
- [ ] Include relevant logs
- [ ] Include configuration files

---

## 🎉 **KESIMPULAN**

Dengan mengikuti panduan troubleshooting ini, sebagian besar masalah dapat diselesaikan dengan cepat. Jika masalah masih berlanjut, gunakan checklist di atas untuk mengumpulkan informasi yang diperlukan.

**Happy Troubleshooting! 🔧**