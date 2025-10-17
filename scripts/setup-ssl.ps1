# SSL Certificate Setup Script untuk Absenta System (Windows)
# PowerShell script untuk mengatur SSL certificate di production

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [string]$WebRoot = "C:\inetpub\wwwroot\absenta"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🔒 SSL Certificate Setup untuk Absenta System" -ForegroundColor $Blue
Write-Host "=============================================="
Write-Host "Domain: $Domain"
Write-Host "Email: $Email"
Write-Host "Webroot: $WebRoot"
Write-Host "=============================================="

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Script harus dijalankan sebagai Administrator" -ForegroundColor $Red
    exit 1
}

# Install Chocolatey if not installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey..." -ForegroundColor $Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install required packages
Write-Host "📦 Installing required packages..." -ForegroundColor $Yellow
choco install -y nginx certbot-windows openssl

# Create webroot directory
Write-Host "📁 Creating webroot directory..." -ForegroundColor $Yellow
New-Item -ItemType Directory -Path $WebRoot -Force
New-Item -ItemType Directory -Path "$WebRoot\static" -Force

# Create temporary index.html for domain validation
$indexContent = @"
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
"@

Set-Content -Path "$WebRoot\index.html" -Value $indexContent

# Configure Nginx
Write-Host "⚙️  Configuring Nginx..." -ForegroundColor $Yellow
$nginxConf = @"
server {
    listen 80;
    server_name $Domain www.$Domain;
    
    root $WebRoot;
    index index.html;
    
    location / {
        try_files `$uri `$uri/ =404;
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WebRoot;
    }
}
"@

Set-Content -Path "C:\nginx\conf\nginx.conf" -Value $nginxConf

# Start Nginx
Write-Host "🚀 Starting Nginx..." -ForegroundColor $Yellow
Start-Process -FilePath "C:\nginx\nginx.exe" -ArgumentList "-c C:\nginx\conf\nginx.conf"

# Wait for Nginx to start
Start-Sleep -Seconds 5

# Obtain SSL certificate
Write-Host "🔐 Obtaining SSL certificate..." -ForegroundColor $Yellow
$certbotPath = "C:\ProgramData\chocolatey\lib\certbot-windows\tools\certbot.exe"

& $certbotPath certonly `
    --webroot `
    --webroot-path $WebRoot `
    --email $Email `
    --agree-tos `
    --no-eff-email `
    --domains $Domain,www.$Domain

# Update Nginx configuration with SSL
Write-Host "🔒 Updating Nginx with SSL configuration..." -ForegroundColor $Yellow
$sslConf = @"
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $Domain www.$Domain;
    return 301 https://`$server_name`$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name $Domain www.$Domain;
    
    # SSL Configuration
    ssl_certificate C:\Certbot\live\$Domain\fullchain.pem;
    ssl_certificate_key C:\Certbot\live\$Domain\privkey.pem;
    ssl_trusted_certificate C:\Certbot\live\$Domain\chain.pem;
    
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
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /static/ {
        alias $WebRoot/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root $WebRoot;
    }
}
"@

Set-Content -Path "C:\nginx\conf\nginx.conf" -Value $sslConf

# Restart Nginx
Write-Host "🔄 Restarting Nginx..." -ForegroundColor $Yellow
Stop-Process -Name "nginx" -Force -ErrorAction SilentlyContinue
Start-Process -FilePath "C:\nginx\nginx.exe" -ArgumentList "-c C:\nginx\conf\nginx.conf"

# Setup automatic certificate renewal
Write-Host "🔄 Setting up automatic certificate renewal..." -ForegroundColor $Yellow
$taskAction = New-ScheduledTaskAction -Execute $certbotPath -Argument "renew --quiet"
$taskTrigger = New-ScheduledTaskTrigger -Daily -At 12:00PM
$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -Action $taskAction -Trigger $taskTrigger -Settings $taskSettings -TaskName "AbsentaSSLRenewal" -Description "Automatic SSL certificate renewal for Absenta System"

# Create SSL status check script
$checkScript = @"
# SSL Certificate Status Check Script
`$Domain = "$Domain"
`$CertFile = "C:\Certbot\live\`$Domain\fullchain.pem"

if (Test-Path `$CertFile) {
    `$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2(`$CertFile)
    `$expiry = `$cert.NotAfter
    `$daysLeft = (`$expiry - (Get-Date)).Days
    
    if (`$daysLeft -lt 30) {
        Write-Host "⚠️  SSL certificate expires in `$daysLeft days" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✅ SSL certificate valid for `$daysLeft days" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "❌ SSL certificate not found" -ForegroundColor Red
    exit 1
}
"@

Set-Content -Path "C:\Scripts\check-ssl.ps1" -Value $checkScript

# Test SSL configuration
Write-Host "🧪 Testing SSL configuration..." -ForegroundColor $Yellow
try {
    `$response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10
    if (`$response.StatusCode -eq 200) {
        Write-Host "✅ SSL certificate is working correctly" -ForegroundColor $Green
    } else {
        Write-Host "❌ SSL certificate test failed" -ForegroundColor $Red
        exit 1
    }
} catch {
    Write-Host "❌ SSL certificate test failed: `$(`$_.Exception.Message)" -ForegroundColor $Red
    exit 1
}

# Display final information
Write-Host "🎉 SSL Certificate Setup Complete!" -ForegroundColor $Green
Write-Host "=============================================="
Write-Host "Domain: https://$Domain"
Write-Host "Certificate: C:\Certbot\live\$Domain\"
Write-Host "Auto-renewal: Enabled"
Write-Host "Nginx: Configured with SSL"
Write-Host "=============================================="
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor $Blue
Write-Host "1. Update your DNS records to point to this server"
Write-Host "2. Configure your Node.js application with SSL paths:"
Write-Host "   SSL_KEY_PATH=C:\Certbot\live\$Domain\privkey.pem"
Write-Host "   SSL_CERT_PATH=C:\Certbot\live\$Domain\fullchain.pem"
Write-Host "   SSL_CA_PATH=C:\Certbot\live\$Domain\chain.pem"
Write-Host "3. Test your application at https://$Domain"
Write-Host "4. Monitor certificate expiry with: C:\Scripts\check-ssl.ps1"
Write-Host ""
Write-Host "⚠️  Important Notes:" -ForegroundColor $Yellow
Write-Host "- Keep your private key secure"
Write-Host "- Monitor certificate expiry (auto-renewal enabled)"
Write-Host "- Test your application thoroughly"
Write-Host "- Consider implementing HSTS preload"
