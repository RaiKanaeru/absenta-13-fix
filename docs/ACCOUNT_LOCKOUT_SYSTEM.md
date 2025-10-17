# Account Lockout System Documentation

## Overview

Sistem Account Lockout adalah fitur keamanan yang melindungi aplikasi Absenta dari serangan brute force dengan mengunci akun setelah beberapa percobaan login yang gagal. Sistem ini juga menyediakan monitoring dan manajemen keamanan yang komprehensif.

## Fitur Utama

### 1. Account Lockout Protection
- **Maksimal Percobaan**: 5 percobaan login yang gagal
- **Durasi Lockout**: 15 menit untuk lockout sementara
- **Window Waktu**: 30 menit untuk menghitung percobaan
- **Lockout Permanen**: Setelah 10 kali lockout dalam 24 jam

### 2. IP-based Protection
- Tracking percobaan login berdasarkan IP address
- Lockout IP address yang mencurigakan
- Monitoring aktivitas dari IP yang sama

### 3. Security Monitoring
- Real-time monitoring login attempts
- Security events logging
- Statistics dan analytics
- Audit trail lengkap

## Konfigurasi

### Lockout Settings
```javascript
const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,           // Maksimal percobaan login
  LOCKOUT_DURATION: 15,      // Durasi lockout dalam menit
  WINDOW_DURATION: 30,       // Window waktu untuk menghitung percobaan dalam menit
  PERMANENT_LOCKOUT_AFTER: 10 // Lockout permanen setelah berapa kali lockout
};
```

### Database Tables

#### 1. login_attempts
Mencatat semua percobaan login:
```sql
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    reason VARCHAR(255) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. account_lockouts
Mencatat akun yang terkunci:
```sql
CREATE TABLE account_lockouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NOT NULL,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_by VARCHAR(255) DEFAULT NULL,
    unlocked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. security_events
Mencatat kejadian keamanan:
```sql
CREATE TABLE security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    username VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Security Management
- `GET /api/security/lockout-stats` - Statistik lockout
- `GET /api/security/active-lockouts` - Daftar akun terkunci
- `POST /api/security/unlock-account` - Unlock akun
- `GET /api/security/login-attempts` - Riwayat login attempts
- `GET /api/security/security-events` - Security events
- `POST /api/security/cleanup` - Cleanup old records

### Authentication Integration
Login endpoint sudah terintegrasi dengan account lockout:
- `POST /api/auth/login` - Login dengan lockout protection

## Frontend Components

### SecurityManagementView
Komponen React untuk mengelola security settings:
- **Overview Tab**: Statistik keamanan
- **Active Lockouts Tab**: Daftar akun terkunci
- **Login Attempts Tab**: Riwayat percobaan login
- **Security Events Tab**: Log kejadian keamanan

## Workflow

### 1. Login Process
```
1. User mencoba login
2. Cek apakah akun/IP terkunci
3. Jika terkunci → Return error 423
4. Jika tidak terkunci → Lanjut validasi
5. Jika login gagal → Record failed attempt
6. Jika mencapai MAX_ATTEMPTS → Lock account
7. Jika login berhasil → Record successful attempt
```

### 2. Lockout Process
```
1. Failed attempt recorded
2. Count attempts dalam window waktu
3. Jika >= MAX_ATTEMPTS:
   - Create lockout record
   - Set locked_until timestamp
   - Log security event
4. Return lockout response
```

### 3. Unlock Process
```
1. Admin unlock account
2. Update locked_until = NOW()
3. Record unlock event
4. Log security event
```

## Security Features

### 1. Brute Force Protection
- Automatic account locking
- Progressive lockout duration
- Permanent lockout for repeat offenders

### 2. IP Monitoring
- Track suspicious IP addresses
- Block repeated failed attempts from same IP
- Geographic monitoring capabilities

### 3. Audit Trail
- Complete login attempt history
- Security event logging
- Admin action tracking
- Metadata storage for forensics

### 4. Admin Controls
- Manual account unlock
- Lockout statistics
- Security event monitoring
- Cleanup old records

## Monitoring & Analytics

### Statistics Available
- Total lockouts (all time)
- Active lockouts (current)
- Lockouts in last 24 hours
- Permanent lockouts
- Login attempt success rate
- Failed vs successful attempts

### Security Events
- Account locked events
- Account unlocked events
- Failed login attempts
- Admin actions
- System events

## Maintenance

### Automatic Cleanup
- Login attempts older than 90 days
- Expired lockouts older than 30 days
- Security events older than 1 year

### Manual Cleanup
Admin can trigger cleanup via API:
```bash
POST /api/security/cleanup
```

## Best Practices

### 1. Monitoring
- Regularly check active lockouts
- Monitor security events
- Review login attempt patterns
- Set up alerts for critical events

### 2. Maintenance
- Regular cleanup of old records
- Monitor database size
- Review lockout statistics
- Update security policies

### 3. User Communication
- Clear error messages for locked accounts
- Inform users about remaining attempts
- Provide contact information for unlock requests

## Error Codes

### HTTP Status Codes
- `401` - Invalid credentials
- `423` - Account locked
- `403` - Access denied (admin only)
- `500` - Server error

### Response Codes
- `ACCOUNT_LOCKED` - Account is locked
- `IP_LOCKED` - IP address is locked
- `PERMANENT_LOCKOUT` - Permanent lockout

## Configuration Examples

### Environment Variables
```env
# Account Lockout Settings
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
LOCKOUT_WINDOW_MINUTES=30
LOCKOUT_PERMANENT_AFTER=10

# Database Settings
DB_HOST=localhost
DB_USER=absenta_user
DB_PASSWORD=secure_password
DB_NAME=absenta13
```

### Production Settings
```javascript
// Production lockout configuration
const PRODUCTION_LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 3,           // Stricter for production
  LOCKOUT_DURATION: 30,      // Longer lockout
  WINDOW_DURATION: 60,       // Longer window
  PERMANENT_LOCKOUT_AFTER: 5  // Fewer chances
};
```

## Troubleshooting

### Common Issues

#### 1. Account Locked Immediately
- Check if IP is already locked
- Verify lockout configuration
- Check for permanent lockout

#### 2. Cannot Unlock Account
- Verify admin permissions
- Check database connection
- Verify account exists

#### 3. High Lockout Rate
- Review lockout thresholds
- Check for automated attacks
- Monitor IP patterns

### Debug Commands
```sql
-- Check active lockouts
SELECT * FROM account_lockouts WHERE locked_until > NOW();

-- Check recent attempts
SELECT * FROM login_attempts 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY created_at DESC;

-- Check security events
SELECT * FROM security_events 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;
```

## Security Considerations

### 1. Data Protection
- Encrypt sensitive data
- Secure database connections
- Regular security updates

### 2. Access Control
- Admin-only access to security features
- Audit admin actions
- Secure API endpoints

### 3. Monitoring
- Real-time security monitoring
- Alert on suspicious activity
- Regular security audits

## Future Enhancements

### Planned Features
- Geographic IP blocking
- Machine learning threat detection
- Advanced analytics dashboard
- Integration with external security tools
- Automated threat response
- Multi-factor authentication integration

### Performance Optimizations
- Database indexing optimization
- Caching for frequently accessed data
- Background cleanup processes
- Real-time monitoring improvements

## Support

### Documentation
- API documentation: `/docs`
- Database schema: `backend/migrations/account_lockout_tables.sql`
- Frontend components: `src/components/admin/SecurityManagementView.tsx`

### Contact
- Technical support: [support@absenta.com]
- Security issues: [security@absenta.com]
- Documentation: [docs@absenta.com]
