# SSL/TLS Setup Guide untuk Absenta System

## 🔒 Overview

Panduan lengkap untuk mengatur SSL/TLS encryption pada Absenta System di production environment.

## 📋 Prerequisites

- Server Linux (Ubuntu 20.04+ recommended)
- Domain name yang sudah di-point ke server
- Root access ke server
- Port 80 dan 443 terbuka

## 🚀 Quick Setup

### 1. Automated Setup (Linux)

```bash
# Clone repository dan masuk ke direktori
cd absenta-optimize-old

# Jalankan script setup SSL
sudo ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### 2. Manual Setup

#### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx ufw
```

#### Step 2: Configure Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable
```

#### Step 3: Setup Nginx

```bash
# Create webroot directory
sudo mkdir -p /var/www/absenta
sudo chown -R www-data:www-data /var/www/absenta

# Create temporary index.html
sudo tee /var/www/absenta/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Absenta System</title>
</head>
<body>
    <h1>Absenta System</h1>
    <p>SSL certificate setup in progress...</p>
</body>
</html>
EOF
```

#### Step 4: Configure Nginx for Domain Validation

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/absenta > /dev/null << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/absenta;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/absenta;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/absenta /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Step 5: Obtain SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/absenta \
    --email admin@yourdomain.com \
    --agree-tos \
    --no-eff-email \
    --domains yourdomain.com,www.yourdomain.com
```

#### Step 6: Configure Nginx with SSL

```bash
# Update Nginx configuration with SSL
sudo tee /etc/nginx/sites-available/absenta > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /static/ {
        alias /var/www/absenta/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/absenta;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

#### Step 7: Setup Auto-Renewal

```bash
# Add cron job for automatic renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-hook 'systemctl reload nginx'") | sudo crontab -
```

## 🔧 Node.js Application Configuration

### 1. Update Environment Variables

```bash
# Update production environment
NODE_ENV=production
SSL_TYPE=letsEncrypt
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/yourdomain.com/chain.pem
```

### 2. Start HTTPS Server

```bash
# Start the HTTPS server
node server_https.js
```

### 3. Verify SSL Configuration

```bash
# Test SSL certificate
curl -I https://yourdomain.com

# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 🛡️ Security Best Practices

### 1. SSL/TLS Configuration

- ✅ Use TLS 1.2+ only
- ✅ Strong cipher suites
- ✅ HSTS headers
- ✅ OCSP stapling
- ✅ Perfect Forward Secrecy

### 2. Security Headers

```nginx
# Security headers yang sudah dikonfigurasi
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Certificate Management

- ✅ Automatic renewal
- ✅ Monitoring expiry
- ✅ Backup certificates
- ✅ Key rotation

## 📊 Monitoring SSL Certificate

### 1. Check Certificate Expiry

```bash
# Manual check
openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem

# Automated check script
/usr/local/bin/check-ssl.sh
```

### 2. Monitor Certificate Status

```bash
# Check certificate details
certbot certificates

# Test renewal
certbot renew --dry-run
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Certificate Not Found

```bash
# Check certificate files
ls -la /etc/letsencrypt/live/yourdomain.com/

# Re-obtain certificate
sudo certbot certonly --webroot -w /var/www/absenta -d yourdomain.com
```

#### 2. Nginx Configuration Error

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. SSL Handshake Failed

```bash
# Check SSL configuration
openssl s_client -connect yourdomain.com:443

# Verify certificate chain
openssl verify -CAfile /etc/letsencrypt/live/yourdomain.com/chain.pem /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

## 📈 Performance Optimization

### 1. SSL Session Caching

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 2. HTTP/2 Support

```nginx
listen 443 ssl http2;
```

### 3. OCSP Stapling

```nginx
ssl_stapling on;
ssl_stapling_verify on;
```

## 🔄 Certificate Renewal

### Automatic Renewal

Certificate akan diperbarui otomatis setiap hari pada jam 12:00. Untuk memverifikasi:

```bash
# Check cron job
sudo crontab -l

# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

### Manual Renewal

```bash
# Force renewal
sudo certbot renew --force-renewal

# Renew specific domain
sudo certbot renew --cert-name yourdomain.com
```

## 📝 Environment Configuration

### Production Environment File

```bash
# config/production.env
NODE_ENV=production
SSL_TYPE=letsEncrypt
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/yourdomain.com/chain.pem
```

### Application Startup

```bash
# Start HTTPS server
NODE_ENV=production node server_https.js

# Or using PM2
pm2 start server_https.js --name absenta-https --env production
```

## ✅ Verification Checklist

- [ ] SSL certificate obtained
- [ ] Nginx configured with SSL
- [ ] HTTP to HTTPS redirect working
- [ ] Security headers implemented
- [ ] Auto-renewal configured
- [ ] Application accessible via HTTPS
- [ ] SSL grade A+ (check with SSL Labs)
- [ ] HSTS preload ready
- [ ] Certificate monitoring setup

## 🆘 Support

Jika mengalami masalah dengan SSL setup:

1. Check logs: `/var/log/nginx/error.log`
2. Verify domain DNS: `nslookup yourdomain.com`
3. Test SSL: `https://www.ssllabs.com/ssltest/`
4. Check firewall: `sudo ufw status`
5. Verify certificate: `certbot certificates`

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
