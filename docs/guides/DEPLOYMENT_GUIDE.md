# 🚀 **DEPLOYMENT GUIDE - SISTEM ABSENTA**

## 📋 **DAFTAR ISI**

1. [Persiapan Deployment](#persiapan-deployment)
2. [Deployment Backend](#deployment-backend)
3. [Deployment Frontend](#deployment-frontend)
4. [Konfigurasi Production](#konfigurasi-production)
5. [Monitoring](#monitoring)
6. [Backup Strategy](#backup-strategy)

---

## 🛠️ **PERSIAPAN DEPLOYMENT**

### **1. Build Production**
```bash
# Build frontend
npm run build

# Build akan menghasilkan folder dist/
```

### **2. Environment Production**
```bash
# Copy environment production
cp config/environment/production.env .env

# Edit konfigurasi production
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
DB_NAME=absenta13
NODE_ENV=production
```

### **3. Database Production**
```bash
# Backup database development
mysqldump -u root -p absenta13 > backup_development.sql

# Import ke production
mysql -u root -p < database/schema/absenta13.sql
```

---

## 🔧 **DEPLOYMENT BACKEND**

### **Metode 1: PM2 (RECOMMENDED)**
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start scripts/maintenance/server_modern.js --name "absenta-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### **Metode 2: Systemd (Linux)**
```bash
# Create service file
sudo nano /etc/systemd/system/absenta-backend.service

# Content:
[Unit]
Description=Absenta Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/absenta
ExecStart=/usr/bin/node scripts/maintenance/server_modern.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable absenta-backend
sudo systemctl start absenta-backend
```

### **Metode 3: Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "scripts/maintenance/server_modern.js"]
```

```bash
# Build Docker image
docker build -t absenta-backend .

# Run container
docker run -d -p 3001:3001 --name absenta-backend absenta-backend
```

---

## 🎨 **DEPLOYMENT FRONTEND**

### **Metode 1: Nginx (RECOMMENDED)**
```nginx
# /etc/nginx/sites-available/absenta
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/absenta/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/absenta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Metode 2: Apache**
```apache
# /etc/apache2/sites-available/absenta.conf
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/absenta/dist
    
    <Directory /path/to/absenta/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/
    ProxyPassReverse /api/ http://localhost:3001/
</VirtualHost>
```

### **Metode 3: CDN (Cloudflare, AWS CloudFront)**
```bash
# Upload dist/ ke CDN
# Konfigurasi routing untuk SPA
# Setup API proxy ke backend
```

---

## ⚙️ **KONFIGURASI PRODUCTION**

### **1. Database Optimization**
```sql
-- Optimize MySQL untuk production
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 64M;
```

### **2. Security Headers**
```javascript
// backend/middleware/security.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
```

### **3. Rate Limiting**
```javascript
// backend/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### **4. SSL/HTTPS**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **MONITORING**

### **1. Application Monitoring**
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### **2. Database Monitoring**
```sql
-- Monitor slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Monitor connections
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

### **3. System Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor resources
htop
iotop
nethogs
```

### **4. Log Monitoring**
```bash
# Monitor application logs
tail -f logs/server.log
tail -f logs/error.log

# Monitor system logs
sudo journalctl -u absenta-backend -f
```

---

## 💾 **BACKUP STRATEGY**

### **1. Database Backup**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
DB_NAME="absenta13"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p $DB_NAME > $BACKUP_DIR/absenta_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/absenta_$DATE.sql

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: absenta_$DATE.sql.gz"
```

### **2. File Backup**
```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/files"
SOURCE_DIR="/path/to/absenta"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup files
tar -czf $BACKUP_DIR/absenta_files_$DATE.tar.gz $SOURCE_DIR

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "File backup completed: absenta_files_$DATE.tar.gz"
```

### **3. Automated Backup**
```bash
# Add to crontab
sudo crontab -e

# Daily database backup at 2 AM
0 2 * * * /path/to/backup-database.sh

# Daily file backup at 3 AM
0 3 * * * /path/to/backup-files.sh
```

---

## 🔄 **DEPLOYMENT WORKFLOW**

### **1. Development to Staging**
```bash
# Push to staging branch
git push origin staging

# Deploy to staging server
ssh staging-server "cd /path/to/absenta && git pull origin staging && npm install && npm run build"
```

### **2. Staging to Production**
```bash
# Merge to main branch
git checkout main
git merge staging
git push origin main

# Deploy to production
ssh production-server "cd /path/to/absenta && git pull origin main && npm install && npm run build && pm2 restart absenta-backend"
```

### **3. Rollback Strategy**
```bash
# Rollback to previous version
git checkout HEAD~1
git push origin main --force

# Restart services
pm2 restart absenta-backend
sudo systemctl reload nginx
```

---

## 🚨 **DISASTER RECOVERY**

### **1. Database Recovery**
```bash
# Restore from backup
gunzip -c /backups/database/absenta_20250101_020000.sql.gz | mysql -u root -p absenta13
```

### **2. Application Recovery**
```bash
# Restore from backup
tar -xzf /backups/files/absenta_files_20250101_030000.tar.gz -C /
```

### **3. Full System Recovery**
```bash
# 1. Restore database
gunzip -c /backups/database/absenta_20250101_020000.sql.gz | mysql -u root -p absenta13

# 2. Restore files
tar -xzf /backups/files/absenta_files_20250101_030000.tar.gz -C /

# 3. Restart services
pm2 restart absenta-backend
sudo systemctl reload nginx
```

---

## 📞 **SUPPORT & MAINTENANCE**

### **Health Checks**
```bash
# Backend health
curl http://localhost:3001/api/health

# Frontend health
curl http://localhost:80

# Database health
mysql -u root -p -e "SELECT 1"
```

### **Performance Monitoring**
```bash
# Monitor PM2
pm2 monit

# Monitor system resources
htop
iotop
nethogs
```

### **Log Analysis**
```bash
# Analyze error logs
grep "ERROR" logs/error.log | tail -100

# Analyze access logs
grep "404" logs/access.log | tail -100
```

---

## 🎯 **CHECKLIST DEPLOYMENT**

### **Pre-Deployment**
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Rate limiting enabled

### **Deployment**
- [ ] Backend deployed and running
- [ ] Frontend built and deployed
- [ ] Database migrated
- [ ] Services started
- [ ] Health checks passing

### **Post-Deployment**
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Performance optimized
- [ ] Security hardened

---

## 🎉 **KESIMPULAN**

Sistem Absenta telah siap untuk deployment production dengan konfigurasi yang aman, scalable, dan mudah dipelihara. Ikuti panduan di atas untuk deployment yang sukses.

**Happy Deploying! 🚀**