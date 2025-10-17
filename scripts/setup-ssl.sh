#!/bin/bash

# SSL Certificate Setup Script untuk Absenta System
# Script untuk mengatur SSL certificate di production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"absenta.example.com"}
EMAIL=${2:-"admin@absenta.example.com"}
WEBROOT="/var/www/absenta"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
NGINX_CONF="/etc/nginx/sites-available/absenta"

echo -e "${BLUE}🔒 SSL Certificate Setup untuk Absenta System${NC}"
echo "=============================================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Webroot: $WEBROOT"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Script harus dijalankan sebagai root${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt install -y nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create webroot directory
echo -e "${YELLOW}📁 Creating webroot directory...${NC}"
mkdir -p $WEBROOT
chown -R www-data:www-data $WEBROOT

# Create temporary index.html for domain validation
cat > $WEBROOT/index.html << EOF
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

# Configure Nginx for domain validation
echo -e "${YELLOW}⚙️  Configuring Nginx...${NC}"
cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $WEBROOT;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
}
EOF

# Enable site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Obtain SSL certificate
echo -e "${YELLOW}🔐 Obtaining SSL certificate...${NC}"
certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Update Nginx configuration with SSL
echo -e "${YELLOW}🔒 Updating Nginx with SSL configuration...${NC}"
cat > $NGINX_CONF << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    ssl_trusted_certificate $CERT_DIR/chain.pem;
    
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /static/ {
        alias $WEBROOT/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Setup automatic certificate renewal
echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-hook 'systemctl reload nginx'") | crontab -

# Create SSL status check script
cat > /usr/local/bin/check-ssl.sh << 'EOF'
#!/bin/bash
DOMAIN="absenta.example.com"
CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ -f "$CERT_FILE" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt 30 ]; then
        echo "⚠️  SSL certificate expires in $DAYS_LEFT days"
        exit 1
    else
        echo "✅ SSL certificate valid for $DAYS_LEFT days"
        exit 0
    fi
else
    echo "❌ SSL certificate not found"
    exit 1
fi
EOF

chmod +x /usr/local/bin/check-ssl.sh

# Test SSL configuration
echo -e "${YELLOW}🧪 Testing SSL configuration...${NC}"
if curl -s -I https://$DOMAIN | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ SSL certificate is working correctly${NC}"
else
    echo -e "${RED}❌ SSL certificate test failed${NC}"
    exit 1
fi

# Display final information
echo -e "${GREEN}🎉 SSL Certificate Setup Complete!${NC}"
echo "=============================================="
echo "Domain: https://$DOMAIN"
echo "Certificate: $CERT_DIR"
echo "Auto-renewal: Enabled"
echo "Firewall: Configured"
echo "Nginx: Configured with SSL"
echo "=============================================="
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Update your DNS records to point to this server"
echo "2. Configure your Node.js application with SSL paths:"
echo "   SSL_KEY_PATH=$CERT_DIR/privkey.pem"
echo "   SSL_CERT_PATH=$CERT_DIR/fullchain.pem"
echo "   SSL_CA_PATH=$CERT_DIR/chain.pem"
echo "3. Test your application at https://$DOMAIN"
echo "4. Monitor certificate expiry with: /usr/local/bin/check-ssl.sh"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "- Keep your private key secure"
echo "- Monitor certificate expiry (auto-renewal enabled)"
echo "- Test your application thoroughly"
echo "- Consider implementing HSTS preload"
