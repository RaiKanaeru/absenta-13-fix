# 🚀 ABSENTA 13 - Deployment Guide

**Versi**: 1.3.0 (OPTIMIZED)  
**Status**: Production Ready  
**Target**: 150+ Concurrent Users Support

## 📋 Prerequisites

### System Requirements
- **OS**: Windows 10/11, Linux Ubuntu 20.04+, macOS 12+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

### Software Requirements
- **Node.js**: v18.0.0 atau lebih baru
- **npm**: v8.0.0 atau lebih baru
- **MySQL**: v8.0.0 atau lebih baru
- **Redis**: v6.0.0 atau lebih baru
- **PM2**: v5.0.0+ (untuk production)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MySQL)       │
│   Port: 5173    │    │   Port: 3001    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 🔧 Development Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd absenta-optimize
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Import database schema
mysql -u root -p < absenta13.sql

# Verify database
mysql -u root -p -e "USE absenta113; SHOW TABLES;"
```

### 4. Setup Redis
```bash
# Windows
cd redis
redis-server.exe

# Linux/Mac
sudo systemctl start redis
# atau
redis-server
```

### 5. Start Development Server
```bash
# Terminal 1: Backend
node server_modern.js

# Terminal 2: Frontend
npm run dev
```

### 6. Verify Installation
```bash
# Check backend
curl http://localhost:3001/api/login

# Check frontend
open http://localhost:5173
```

## 🚀 Production Deployment

### 1. Server Preparation

#### Install Required Software
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm mysql-server redis-server nginx

# CentOS/RHEL
sudo yum install nodejs npm mysql-server redis nginx

# Windows
# Download dan install dari official websites
```

#### Configure MySQL
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database user
mysql -u root -p
CREATE USER 'absenta'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON absenta113.* TO 'absenta'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Configure Redis
```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set password (optional but recommended)
requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis
```

### 2. Application Deployment

#### Build Frontend
```bash
npm run build
```

#### Install PM2
```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'absenta-backend',
      script: 'server_modern.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'absenta-frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
```

#### Start Application with PM2
```bash
# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 3. Nginx Configuration

#### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/absenta
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
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

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/absenta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Configuration (Optional)

#### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 📊 Performance Optimization

### 1. Database Optimization
```bash
# Check database performance
mysql -u root -p -e "SHOW PROCESSLIST;"

# Optimize tables
mysql -u root -p -e "USE absenta113; OPTIMIZE TABLE absensi_siswa, absensi_guru;"
```

### 2. Redis Optimization
```bash
# Check Redis memory usage
redis-cli info memory

# Set memory policy
redis-cli config set maxmemory-policy allkeys-lru
```

### 3. Node.js Optimization
```bash
# Increase file descriptor limit
ulimit -n 65536

# Set PM2 max memory
pm2 start ecosystem.config.js --max-memory-restart 1G
```

## 🔍 Monitoring & Maintenance

### 1. System Monitoring
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs absenta-backend
pm2 logs absenta-frontend

# Monitor system resources
pm2 monit
```

### 2. Database Monitoring
```bash
# Check database connections
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# Check slow queries
mysql -u root -p -e "SHOW VARIABLES LIKE 'slow_query_log';"
```

### 3. Redis Monitoring
```bash
# Check Redis status
redis-cli ping

# Monitor Redis performance
redis-cli --latency
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check port usage
netstat -tulpn | grep :3001

# Kill process
sudo kill -9 <PID>
```

#### 2. Database Connection Error
```bash
# Check MySQL status
sudo systemctl status mysql

# Check database user
mysql -u absenta -p -e "SELECT USER();"
```

#### 3. Redis Connection Error
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

#### 4. PM2 Issues
```bash
# Restart PM2
pm2 restart all

# Reload PM2
pm2 reload all

# Delete PM2 processes
pm2 delete all
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] Server requirements met
- [ ] Database schema imported
- [ ] Redis server running
- [ ] Environment variables configured
- [ ] SSL certificates installed (if needed)
- [ ] Firewall configured
- [ ] Monitoring setup

### Post-Deployment
- [ ] Application accessible via domain
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Redis caching functional
- [ ] Performance monitoring active
- [ ] Backup system verified
- [ ] Security audit passed
- [ ] Load testing completed

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
# Create backup
mysqldump -u root -p absenta113 > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p absenta113 < backup_file.sql
```

### 2. Application Backup
```bash
# Backup application files
tar -czf absenta_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/absenta-optimize

# Backup PM2 configuration
pm2 save
```

### 3. Disaster Recovery
```bash
# Restore from backup
tar -xzf absenta_backup_file.tar.gz
pm2 start ecosystem.config.js
```

## 📞 Support

### Monitoring Commands
```bash
# System status
pm2 status
systemctl status nginx
systemctl status mysql
systemctl status redis

# Performance monitoring
pm2 monit
htop
iotop
```

### Log Locations
- **Application Logs**: `./logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **MySQL Logs**: `/var/log/mysql/`
- **Redis Logs**: `/var/log/redis/`

### Contact Information
- **Email**: support@absenta13.com
- **GitHub Issues**: [Create Issue]
- **Documentation**: README.md

---

**ABSENTA 13 DEPLOYMENT GUIDE** - Panduan lengkap untuk deployment production dengan performa tinggi 🚀
