# HTTPS Enforcement Implementation

## 🔒 Overview

Implementasi HTTPS enforcement untuk Absenta System yang memastikan semua komunikasi di production menggunakan SSL/TLS encryption.

## 🏗️ Architecture

### 1. Security Middleware Stack

```
Request → HTTPS Enforcement → Security Headers → Rate Limiting → CORS → Application
```

### 2. Components

- **HTTPS Enforcement**: Redirect HTTP ke HTTPS
- **Security Headers**: Helmet.js untuk security headers
- **Rate Limiting**: Perlindungan dari abuse
- **CORS**: Cross-origin resource sharing
- **Query Protection**: SQL injection prevention

## 🚀 Implementation

### 1. Security Middleware (`backend/middleware/security.js`)

```javascript
// HTTPS Enforcement
export const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      const httpsUrl = `https://${req.get('host')}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
  }
  next();
};

// Security Headers
export const securityHeaders = helmet({
  contentSecurityPolicy: { /* CSP configuration */ },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
});
```

### 2. SSL Configuration (`backend/config/ssl.js`)

```javascript
// SSL Certificate Loading
export const loadSSLCertificates = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
      ca: fs.readFileSync(process.env.SSL_CA_PATH)
    };
  }
  
  return null;
};
```

### 3. HTTPS Server (`server_https.js`)

```javascript
// Security Middleware Setup
const setupSecurityMiddleware = () => {
  if (process.env.NODE_ENV === 'production') {
    app.use(enforceHTTPS);
  }
  
  app.use(securityHeaders);
  app.use(securityLogger);
  app.use(queryProtection);
  app.use(requestSizeLimit('10mb'));
  app.use(cors(corsOptions));
  app.use('/api/auth', authRateLimit);
  app.use('/api/upload', uploadRateLimit);
  app.use('/api', apiRateLimit);
};
```

## 🔧 Configuration

### 1. Environment Variables

```bash
# Production Environment
NODE_ENV=production
SSL_TYPE=letsEncrypt
SSL_KEY_PATH=/etc/letsencrypt/live/domain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/domain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/domain.com/chain.pem

# Security Settings
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
```

### 2. SSL Certificate Types

#### Let's Encrypt (Recommended)
```bash
SSL_TYPE=letsEncrypt
SSL_KEY_PATH=/etc/letsencrypt/live/domain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/domain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/domain.com/chain.pem
```

#### Custom Certificates
```bash
SSL_TYPE=custom
CUSTOM_SSL_KEY_PATH=/path/to/private.key
CUSTOM_SSL_CERT_PATH=/path/to/certificate.crt
CUSTOM_SSL_CA_PATH=/path/to/ca-bundle.crt
```

## 🛡️ Security Features

### 1. HTTPS Enforcement

- **Automatic Redirect**: HTTP requests redirected to HTTPS
- **HSTS Headers**: Strict Transport Security
- **Certificate Validation**: SSL certificate verification
- **Protocol Enforcement**: TLS 1.2+ only

### 2. Security Headers

```javascript
// Content Security Policy
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}

// HTTP Strict Transport Security
hsts: {
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}
```

### 3. Rate Limiting

```javascript
// Authentication Rate Limiting
authRateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true
}

// API Rate Limiting
apiRateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  skipSuccessfulRequests: false
}

// Upload Rate Limiting
uploadRateLimit: {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per IP
  skipSuccessfulRequests: false
}
```

### 4. CORS Configuration

```javascript
corsOptions: {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'https://absenta.example.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}
```

## 🚀 Deployment

### 1. Production Setup

```bash
# Install dependencies
npm install

# Copy production environment
cp config/production.env .env

# Update environment variables
nano .env

# Start HTTPS server
npm run start:https
```

### 2. SSL Certificate Setup

#### Automated Setup (Linux)
```bash
# Run SSL setup script
sudo ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

#### Manual Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --webroot -w /var/www/absenta -d yourdomain.com

# Configure auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet --reload-hook 'systemctl reload nginx'
```

### 3. Nginx Configuration

```nginx
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
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔍 Monitoring

### 1. SSL Certificate Monitoring

```bash
# Check certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/domain.com/fullchain.pem

# Automated monitoring script
/usr/local/bin/check-ssl.sh
```

### 2. Security Monitoring

```javascript
// Security logging middleware
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  console.log(`[SECURITY] ${req.method} ${req.url} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    if (status === 401 || status === 403 || status === 429) {
      console.warn(`[SECURITY ALERT] ${req.method} ${req.url} - Status: ${status}`);
    }
  });
  
  next();
};
```

### 3. Health Checks

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ssl: req.secure ? 'enabled' : 'disabled',
    environment: process.env.NODE_ENV
  });
});
```

## 🧪 Testing

### 1. SSL Configuration Test

```bash
# Test SSL certificate
curl -I https://yourdomain.com

# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/
```

### 2. Security Headers Test

```bash
# Test security headers
curl -I https://yourdomain.com

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

### 3. Rate Limiting Test

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST https://yourdomain.com/api/auth/login; done
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Certificate Not Found
```bash
# Check certificate files
ls -la /etc/letsencrypt/live/yourdomain.com/

# Re-obtain certificate
sudo certbot certonly --webroot -w /var/www/absenta -d yourdomain.com
```

#### 2. SSL Handshake Failed
```bash
# Check SSL configuration
openssl s_client -connect yourdomain.com:443

# Verify certificate chain
openssl verify -CAfile /etc/letsencrypt/live/yourdomain.com/chain.pem /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

#### 3. HTTPS Redirect Not Working
```bash
# Check Nginx configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## 📊 Performance Impact

### 1. SSL Overhead

- **CPU Usage**: ~5-10% increase
- **Memory Usage**: ~2-5% increase
- **Latency**: ~10-20ms increase
- **Throughput**: ~5-10% decrease

### 2. Optimization

```javascript
// SSL session caching
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

// HTTP/2 support
listen 443 ssl http2;

// OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
```

## ✅ Security Checklist

- [ ] HTTPS enforcement enabled
- [ ] SSL certificate valid and not expired
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] HSTS headers
- [ ] Certificate auto-renewal
- [ ] Security monitoring
- [ ] Error handling
- [ ] Logging configured

## 📚 Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration](https://ssl-config.mozilla.org/)
