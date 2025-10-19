# Script untuk menjalankan server dengan bypass rate limiting (untuk debug)
Write-Host "🔓 Starting server with login rate limit bypass for debug..." -ForegroundColor Green
$env:BYPASS_LOGIN_RATE_LIMIT="true"
$env:LOGIN_RATE_LIMIT_MAX_ATTEMPTS="15"
$env:RATE_LIMIT_WINDOW_MS="900000"
node server_modern.js
































