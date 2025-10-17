# Password Policy Implementation

## 🔒 Overview

Implementasi comprehensive password policy untuk Absenta System yang memastikan keamanan password yang optimal.

## 🏗️ Architecture

### 1. Password Policy Components

```
Frontend (React) → API Endpoints → Password Policy Middleware → Database
```

### 2. Security Features

- **Password Strength Validation**: Real-time password strength checking
- **Password History**: Mencegah penggunaan password lama
- **Password Expiry**: Password otomatis expired setelah periode tertentu
- **Rate Limiting**: Mencegah abuse pada password reset
- **Account Lockout**: Lock account setelah failed attempts
- **Two-Factor Authentication**: Support untuk 2FA (preparation)

## 🚀 Implementation

### 1. Password Policy Middleware (`backend/middleware/passwordPolicy.js`)

```javascript
// Password Strength Requirements
export const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  forbiddenPatterns: [/password/i, /123456/i, /qwerty/i],
  maxRepeatingChars: 3,
  maxSequentialChars: 3
};

// Password Strength Checker
export const checkPasswordStrength = (password) => {
  // Comprehensive password validation
  // Returns: isValid, errors, warnings, strengthScore, strengthLevel
};
```

### 2. Database Schema

```sql
-- Password History Table
CREATE TABLE password_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset Attempts
CREATE TABLE password_reset_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login Attempts Tracking
CREATE TABLE login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. API Endpoints

```javascript
// Password Policy Information
GET /api/password/policy

// Check Password Strength
POST /api/password/check-strength

// Change Password
POST /api/password/change

// Request Password Reset
POST /api/password/reset-request

// Confirm Password Reset
POST /api/password/reset-confirm

// Check Password Expiry
GET /api/password/expiry

// Get Security Status
GET /api/password/security-status
```

## 🔧 Configuration

### 1. Environment Variables

```bash
# Password Policy Settings
BCRYPT_ROUNDS=12
PASSWORD_MAX_AGE_DAYS=90
PASSWORD_RESET_MAX_ATTEMPTS=3
PASSWORD_RESET_COOLDOWN_MINUTES=15

# Security Settings
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30
SESSION_TIMEOUT_MINUTES=60
```

### 2. Password Requirements

```javascript
const passwordRequirements = {
  minLength: 8,                    // Minimum 8 characters
  maxLength: 128,                   // Maximum 128 characters
  requireUppercase: true,           // At least 1 uppercase letter
  requireLowercase: true,           // At least 1 lowercase letter
  requireNumbers: true,             // At least 1 number
  requireSpecialChars: true,        // At least 1 special character
  minSpecialChars: 1,               // Minimum special characters
  maxRepeatingChars: 3,             // Max 3 repeating characters
  maxSequentialChars: 3,            // Max 3 sequential characters
  forbiddenPatterns: [              // Forbidden patterns
    /password/i,
    /123456/i,
    /qwerty/i,
    /admin/i,
    /user/i,
    /login/i,
    /absenta/i
  ]
};
```

## 🛡️ Security Features

### 1. Password Strength Scoring

```javascript
// Strength Score Calculation (0-100)
let strengthScore = 0;

// Length score (0-25 points)
if (password.length >= 12) strengthScore += 25;
else if (password.length >= 8) strengthScore += 15;

// Character variety (0-25 points)
if (/[a-z]/.test(password)) varietyScore += 5;
if (/[A-Z]/.test(password)) varietyScore += 5;
if (/[0-9]/.test(password)) varietyScore += 5;
if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) varietyScore += 10;

// Complexity score (0-25 points)
// Based on special characters and numbers

// Uniqueness score (0-25 points)
// Based on character uniqueness ratio
```

### 2. Password History Protection

```javascript
// Check password history (last 5 passwords)
export const checkPasswordHistory = async (userId, newPassword, db) => {
  const [history] = await db.execute(
    'SELECT password FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
    [userId]
  );
  
  for (const record of history) {
    const isMatch = await verifyPassword(newPassword, record.password);
    if (isMatch) {
      return {
        isValid: false,
        message: 'Password tidak boleh sama dengan 5 password sebelumnya'
      };
    }
  }
  
  return { isValid: true };
};
```

### 3. Rate Limiting

```javascript
// Password Reset Rate Limiting
export const checkPasswordResetLimits = async (userId, db) => {
  // Check daily reset limit (max 3 per day)
  const [todayResets] = await db.execute(
    'SELECT COUNT(*) as count FROM password_reset_attempts WHERE user_id = ? AND DATE(created_at) = DATE(NOW())',
    [userId]
  );
  
  if (todayResets[0].count >= 3) {
    return {
      canReset: false,
      message: 'Maksimal 3 reset password per hari'
    };
  }
  
  // Check cooldown period (15 minutes between resets)
  const [lastReset] = await db.execute(
    'SELECT created_at FROM password_reset_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  
  if (lastReset.length > 0) {
    const timeSinceLastReset = Date.now() - new Date(lastReset[0].created_at);
    if (timeSinceLastReset < 15 * 60 * 1000) {
      return {
        canReset: false,
        message: 'Tunggu 15 menit sebelum reset password lagi'
      };
    }
  }
  
  return { canReset: true };
};
```

## 🎨 Frontend Components

### 1. Password Policy Component

```tsx
<PasswordPolicy
  onPasswordChange={(password, isValid) => {
    // Handle password change
  }}
  showStrengthIndicator={true}
  showRequirements={true}
/>
```

### 2. Change Password Form

```tsx
<ChangePasswordForm
  onSuccess={() => {
    // Handle success
  }}
  onCancel={() => {
    // Handle cancel
  }}
/>
```

### 3. Password Strength Indicator

- **Visual Progress Bar**: Shows password strength (0-100)
- **Color Coding**: Red (weak) → Orange → Yellow → Blue → Green (strong)
- **Real-time Validation**: Updates as user types
- **Error Messages**: Specific feedback for each requirement
- **Warning Messages**: Suggestions for improvement

## 📊 Monitoring & Analytics

### 1. Security Dashboard

```sql
-- Password Security Summary View
CREATE VIEW password_security_summary AS
SELECT 
    u.id,
    u.username,
    u.nama,
    u.password_changed_at,
    u.password_reset_required,
    u.failed_login_attempts,
    u.account_locked_until,
    u.two_factor_enabled,
    CASE 
        WHEN u.account_locked_until > NOW() THEN 'LOCKED'
        WHEN u.password_reset_required = TRUE THEN 'PASSWORD_RESET_REQUIRED'
        WHEN u.failed_login_attempts >= 5 THEN 'HIGH_FAILURE_COUNT'
        WHEN DATEDIFF(NOW(), u.password_changed_at) > 90 THEN 'PASSWORD_EXPIRED'
        ELSE 'ACTIVE'
    END as security_status
FROM pengguna u;
```

### 2. Login Attempts Monitoring

```sql
-- Login Attempts Summary
CREATE VIEW login_attempts_summary AS
SELECT 
    DATE(created_at) as attempt_date,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_attempts,
    SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_attempts,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT user_id) as unique_users
FROM login_attempts 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at);
```

## 🔄 Password Lifecycle

### 1. Password Creation

```
User Input → Strength Check → Policy Validation → Hash & Store → Save to History
```

### 2. Password Change

```
Current Password Verification → New Password Validation → History Check → Update & Save
```

### 3. Password Reset

```
Reset Request → Rate Limit Check → Token Generation → Email/SMS → Token Verification → New Password
```

## 🧪 Testing

### 1. Password Strength Tests

```javascript
// Test cases for password validation
const testCases = [
  { password: 'password', expected: false, reason: 'Too common' },
  { password: '123456', expected: false, reason: 'Too simple' },
  { password: 'Password123!', expected: true, reason: 'Meets all requirements' },
  { password: 'P@ssw0rd!', expected: true, reason: 'Strong password' }
];
```

### 2. Security Tests

```javascript
// Test rate limiting
for (let i = 0; i < 5; i++) {
  await apiCall.post('/api/password/reset-request', { username: 'test' });
}

// Test password history
await apiCall.post('/api/password/change', {
  currentPassword: 'oldPassword',
  newPassword: 'newPassword'
});
// Try to use old password again
```

## 📈 Performance Optimization

### 1. Password Hashing

```javascript
// Optimized bcrypt configuration
const saltRounds = 12; // Balance between security and performance
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 2. Database Indexing

```sql
-- Optimized indexes for password security tables
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
CREATE INDEX idx_password_history_created_at ON password_history(created_at);
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
```

### 3. Caching Strategy

```javascript
// Cache password policy configuration
const policyCache = new Map();
const getPasswordPolicy = () => {
  if (!policyCache.has('policy')) {
    policyCache.set('policy', passwordPolicyConfig.getPolicyInfo());
  }
  return policyCache.get('policy');
};
```

## 🔧 Maintenance

### 1. Data Cleanup

```sql
-- Automated cleanup procedure
CREATE PROCEDURE CleanupPasswordSecurityData()
BEGIN
    -- Clean old password history (1 year)
    DELETE FROM password_history 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    
    -- Clean old login attempts (6 months)
    DELETE FROM login_attempts 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    
    -- Clean expired reset tokens
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW();
END;
```

### 2. Monitoring Alerts

```javascript
// Password expiry alerts
const checkPasswordExpiry = async () => {
  const [users] = await db.execute(
    'SELECT id, username, password_changed_at FROM pengguna WHERE password_changed_at < DATE_SUB(NOW(), INTERVAL 85 DAY)'
  );
  
  for (const user of users) {
    // Send expiry warning
    console.log(`Password expires soon for user: ${user.username}`);
  }
};
```

## ✅ Security Checklist

- [ ] Password strength validation implemented
- [ ] Password history protection enabled
- [ ] Password expiry policy configured
- [ ] Rate limiting for password reset
- [ ] Account lockout mechanism
- [ ] Secure password hashing (bcrypt)
- [ ] Password reset token security
- [ ] Login attempt monitoring
- [ ] Security dashboard implemented
- [ ] Automated cleanup procedures
- [ ] Password policy documentation
- [ ] Security testing completed
- [ ] Performance optimization
- [ ] Monitoring and alerting

## 📚 Additional Resources

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [Password Security Best Practices](https://owasp.org/www-project-authentication-cheat-sheet/)
