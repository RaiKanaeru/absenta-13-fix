# 🚀 Opsi 2 Quick Reference Guide

**Status**: ✅ 100% Complete & Production Ready  
**Last Updated**: 21 Oktober 2025  
**Version**: 2.0 (Full Normalization)

## 📋 Executive Summary

Full normalization of `users` and `siswa` tables completed. All student accounts now use standardized 'SISWA' role with proper foreign key relationships.

## 🔑 Quick Access

### Default Login Credentials

**Admin Account**:
- Username: `admin`
- Password: `admin123`

**Teacher Account** (example):
- Username: `guru_[NIP]`
- Password: Set during creation

**Student Account** (NEW):
- Username: `siswa_[NIS]`
- Password: `[NIS]@2024` (e.g., `2024001@2024`)

### Database Connection
```bash
# MySQL Connection
mysql -u root -p absenta13

# Check tables
SHOW TABLES;

# Check students with accounts
SELECT s.nis, s.nama, u.username, u.role 
FROM siswa s 
LEFT JOIN users u ON s.user_id = u.id;
```

## 📊 Key Schema Changes

### `users` Table (Updated)
```sql
role ENUM('ADMIN','GURU','SISWA')  -- Updated from old enum
```

### `siswa` Table (Updated)
```sql
user_id INT(11) DEFAULT NULL  -- Now NULLABLE with proper FK
CONSTRAINT fk_siswa_user FOREIGN KEY (user_id) REFERENCES users(id)
```

## 🛠️ Essential Commands

### Validation
```bash
# Validate migration
node database/scripts/validate-users-siswa-migration.js

# Check for broken relationships
mysql -u root -p absenta13 -e "SELECT COUNT(*) FROM siswa s WHERE s.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)"
```

### Testing
```bash
# Run integration tests
npm test -- tests/integration/users-siswa-integration.test.js

# Run smoke tests
npm test -- tests/smoke/post-deployment-smoke.test.js

# Test student CRUD endpoints
node tests/api/test-siswa-crud-updated.js
```

### Deployment
```bash
# Backup database
mysqldump -u root -p absenta13 > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
node database/scripts/run-migration.js database/migrations/2025-10-21-users-siswa-normalization.sql

# Restart server
pm2 restart absenta-backend

# Monitor logs
pm2 logs absenta-backend --lines 100
```

## 📝 Common Queries

### Get Student with Account
```sql
SELECT 
  s.id_siswa, s.nis, s.nama, s.kelas_id,
  u.id as user_id, u.username, u.email, u.status as user_status
FROM siswa s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.id_siswa = ?;
```

### Create Student with Account (API)
```bash
POST /api/admin/siswa
Content-Type: application/json
Authorization: Bearer <token>

{
  "nis": "2024001",
  "nama": "Test Siswa",
  "kelas_id": 1,
  "username": "siswa_2024001",
  "password": "2024001@2024",
  "email": "test@example.com"
}
```

### Update Student (API)
```bash
PUT /api/admin/students/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "nis": "2024001",
  "nama": "Test Siswa Updated",
  "kelas_id": 2,
  "username": "siswa_2024001_new",
  "email": "updated@example.com"
}
```

### Delete Student (API)
```bash
DELETE /api/admin/students/:id
Authorization: Bearer <token>

# Returns:
# - "deactivated" if has attendance records
# - "deleted" if no attendance records
```

## 🔍 Troubleshooting

### Issue: Student can't login
```sql
-- Check if user account exists
SELECT u.*, s.nis, s.nama 
FROM users u 
JOIN siswa s ON u.id = s.user_id 
WHERE u.username = 'siswa_[NIS]';

-- Check role
SELECT role FROM users WHERE username = 'siswa_[NIS]';
-- Should be 'SISWA' (uppercase)

-- Check status
SELECT status FROM users WHERE username = 'siswa_[NIS]';
-- Should be 'aktif'
```

### Issue: Broken relationships
```sql
-- Find broken relationships
SELECT s.id_siswa, s.nis, s.nama, s.user_id
FROM siswa s
WHERE s.user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);

-- Fix: Set user_id to NULL
UPDATE siswa 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_id);
```

### Issue: Duplicate username
```sql
-- Find duplicates
SELECT username, COUNT(*) as count
FROM users
GROUP BY username
HAVING count > 1;

-- Fix: Update username
UPDATE users 
SET username = CONCAT(username, '_', id) 
WHERE username IN (
  SELECT username FROM (
    SELECT username FROM users GROUP BY username HAVING COUNT(*) > 1
  ) as dupes
);
```

## 📚 Documentation Links

### Technical Documentation
- [Complete Implementation Summary](../implementation/OPSI2_COMPLETE_SUMMARY.md)
- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE_OPSI2.md)
- [Database Schema 2025](.cursor/rules/absenta-database-schema-2025.mdc)
- [API Patterns 2025](.cursor/rules/absenta-api-patterns-2025.mdc)

### Scripts Location
- Migration: `database/migrations/2025-10-21-users-siswa-normalization.sql`
- Rollback: `database/migrations/2025-10-21-users-siswa-normalization-rollback.sql`
- Validation: `database/scripts/validate-users-siswa-migration.js`
- Audit: `database/scripts/audit-database-opsi2.js`

### Test Files
- Integration: `tests/integration/users-siswa-integration.test.js`
- Smoke Tests: `tests/smoke/post-deployment-smoke.test.js`
- API Tests: `tests/api/test-siswa-crud-updated.js`

## 🎯 Performance Benchmarks

### Database Indexes (Created)
- `idx_users_role_status` on `users(role, status)`
- `idx_siswa_user_id` on `siswa(user_id)`
- `idx_siswa_kelas_status` on `siswa(kelas_id, status)`
- `idx_siswa_nis` on `siswa(nis)`

### Expected Performance
- Student lookup: < 50ms
- Login authentication: < 100ms
- Student list (100 students): < 200ms
- CRUD operations: < 150ms

## ⚠️ Important Notes

### What Changed
1. ✅ `users.role` enum updated to include 'SISWA'
2. ✅ All 'KETOS' and 'perwakilan' roles migrated to 'SISWA'
3. ✅ `siswa.user_id` now properly links to `users.id`
4. ✅ Foreign key constraint added: `fk_siswa_user`
5. ✅ All broken relationships fixed

### What Stayed the Same
- ✅ Student attendance data (no changes)
- ✅ Teacher functionality (no changes)
- ✅ Admin functionality (enhanced)
- ✅ Schedule system (no changes)
- ✅ Multi-teacher system (no changes)

### Breaking Changes
- ❌ Old role values ('KETOS', 'perwakilan') deprecated
- ❌ Direct queries to `siswa_perwakilan` view deprecated (use `siswa` table)
- ❌ Assuming `siswa.user_id` is NOT NULL (it's nullable now)

## 🚨 Emergency Contacts

### Rollback Command
```bash
# If issues occur, rollback immediately
node database/scripts/run-migration.js database/migrations/2025-10-21-users-siswa-normalization-rollback.sql

# Restart server
pm2 restart absenta-backend
```

### Health Check
```bash
# Check server status
pm2 status

# Check database connection
mysql -u root -p absenta13 -e "SELECT 1"

# Check critical tables
mysql -u root -p absenta13 -e "SELECT COUNT(*) FROM users WHERE role = 'SISWA'"
mysql -u root -p absenta13 -e "SELECT COUNT(*) FROM siswa WHERE user_id IS NOT NULL"
```

## 📞 Support

### Getting Help
1. Check documentation first (links above)
2. Review troubleshooting section
3. Check logs: `pm2 logs absenta-backend`
4. Run validation script
5. Contact development team

### Reporting Issues
Include:
- Error message
- Timestamp
- User role (admin/guru/siswa)
- Steps to reproduce
- Server logs (last 50 lines)

---

**Remember**: Always backup before making changes! 🔐
