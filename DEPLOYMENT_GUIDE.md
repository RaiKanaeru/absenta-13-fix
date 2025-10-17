# Absenta Deployment Guide

## 📋 Daftar Isi

1. [Prasyarat Sistem](#prasyarat-sistem)
2. [Persiapan Environment](#persiapan-environment)
3. [Konfigurasi Database](#konfigurasi-database)
4. [Deployment Backend](#deployment-backend)
5. [Deployment Frontend](#deployment-frontend)
6. [Konfigurasi Production](#konfigurasi-production)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## 🖥️ Prasyarat Sistem

### Server Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

**Backend:**
- Node.js 18.0+
- MySQL 8.0+ atau MariaDB 10.4+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)

**Frontend:**
- Node.js 18.0+
- Nginx (Web Server)

**Optional:**
- Redis 6.0+ (Caching)
- Docker & Docker Compose
- SSL Certificate

## 🔧 Persiapan Environment

### 1. Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

### 3. Install Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Install PM2

```bash
sudo npm install -g pm2
```

## 🗄️ Konfigurasi Database

### 1. Buat Database dan User

```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE absenta13 CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Buat user untuk aplikasi
CREATE USER 'absenta_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON absenta13.* TO 'absenta_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 2. Import Database Schema

```bash
# Import schema
mysql -u absenta_user -p absenta13 < absenta13.sql

# Verify import
mysql -u absenta_user -p absenta13 -e "SHOW TABLES;"
```

### 3. Konfigurasi MySQL untuk Production

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Performance tuning
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 200
max_connect_errors = 1000

# Query cache
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Security
local_infile = 0
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

## 🚀 Deployment Backend

### 1. Clone Repository

```bash
# Clone repository
git clone <repository-url> /var/www/absenta
cd /var/www/absenta

# Install dependencies
npm install
```

### 2. Konfigurasi Environment

Buat file `.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=absenta_user
DB_PASSWORD=strong_password_here
DB_NAME=absenta13
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Optional: Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Build dan Start dengan PM2

```bash
# Build aplikasi (jika ada build step)
npm run build

# Start dengan PM2
pm2 start server_modular.js --name "absenta-backend"

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor aplikasi
pm2 status
pm2 logs absenta-backend
```

### 4. Konfigurasi Nginx untuk Backend

Buat file `/etc/nginx/sites-available/absenta-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3001/api/health;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/absenta-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🌐 Deployment Frontend

### 1. Build Frontend

```bash
cd /var/www/absenta
npm run build
```

### 2. Konfigurasi Nginx untuk Frontend

Buat file `/etc/nginx/sites-available/absenta-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/absenta/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
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

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/absenta-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Konfigurasi Production

### 1. SSL Certificate dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. Database Security

```sql
-- Remove test databases
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Create backup user
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON absenta13.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Application Security

```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/absenta
sudo chmod -R 755 /var/www/absenta

# Hide sensitive files
echo "node_modules/" >> /var/www/absenta/.gitignore
echo ".env" >> /var/www/absenta/.gitignore
```

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. Nginx Logging

Edit `/etc/nginx/nginx.conf`:

```nginx
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
}
```

### 3. Database Monitoring

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Monitor connections
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
```

## 💾 Backup & Recovery

### 1. Database Backup Script

Buat file `/var/www/absenta/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/absenta"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="absenta13"
DB_USER="backup_user"
DB_PASS="backup_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/absenta_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/absenta_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "absenta_*.sql.gz" -mtime +30 -delete

echo "Backup completed: absenta_$DATE.sql.gz"
```

Make executable:
```bash
chmod +x /var/www/absenta/scripts/backup-db.sh
```

### 2. Automated Backup

```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /var/www/absenta/scripts/backup-db.sh

# Weekly full backup
0 1 * * 0 /var/www/absenta/scripts/backup-db.sh && rsync -av /var/www/absenta/ /var/backups/absenta/full/
```

### 3. Recovery Procedure

```bash
# Stop application
pm2 stop absenta-backend

# Restore database
gunzip -c /var/backups/absenta/absenta_YYYYMMDD_HHMMSS.sql.gz | mysql -u absenta_user -p absenta13

# Start application
pm2 start absenta-backend
```

## 🔧 Troubleshooting

### Common Issues

**1. Application won't start:**
```bash
# Check logs
pm2 logs absenta-backend

# Check environment variables
pm2 show absenta-backend

# Restart application
pm2 restart absenta-backend
```

**2. Database connection issues:**
```bash
# Test database connection
mysql -u absenta_user -p absenta13 -e "SELECT 1;"

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

**3. Nginx issues:**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

**4. SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### Performance Issues

**1. High CPU usage:**
```bash
# Check PM2 processes
pm2 monit

# Check system resources
htop
```

**2. High memory usage:**
```bash
# Check memory usage
free -h

# Check MySQL memory usage
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
```

**3. Slow database queries:**
```bash
# Check slow query log
sudo tail -f /var/log/mysql/slow.log

# Analyze slow queries
mysqldumpslow /var/log/mysql/slow.log
```

## 🔄 Maintenance

### Daily Tasks

```bash
# Check application status
pm2 status

# Check disk space
df -h

# Check system resources
htop
```

### Weekly Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check log files
sudo journalctl -u nginx --since "1 week ago"
sudo journalctl -u mysql --since "1 week ago"
```

### Monthly Tasks

```bash
# Review security updates
sudo apt list --upgradable

# Check backup integrity
ls -la /var/backups/absenta/

# Performance analysis
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"
```

## 📞 Support

Untuk bantuan teknis atau pertanyaan deployment:

- **Email**: support@absenta.com
- **Documentation**: https://docs.absenta.com
- **API Documentation**: https://api.absenta.com/docs
- **Health Check**: https://api.absenta.com/api/health

---

**Last Updated**: 2025-01-09
**Version**: 1.0.0
**Maintained By**: Absenta Development Team