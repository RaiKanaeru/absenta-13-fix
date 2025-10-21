# Deployment Guide - Opsi 2: Full Normalization

## 📋 Overview

Panduan lengkap untuk deployment Users-Siswa Full Normalization ke production environment dengan minimal downtime dan zero data loss.

## ⚠️ Pre-Deployment Checklist

### 1. **Backup Production Database**

```bash
# Full database backup
mysqldump -u root -p --single-transaction --routines --triggers absenta13 > backup_absenta13_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_absenta13_*.sql

# Test restore in separate database (optional but recommended)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS absenta13_backup_test"
mysql -u root -p absenta13_backup_test < backup_absenta13_*.sql
```

### 2. **Validate Staging Environment**

```bash
# Run migration in staging
mysql -u root -p absenta13_staging < database/migrations/2025-10-21-users-siswa-normalization.sql

# Validate migration
node database/scripts/validate-users-siswa-migration.js

# Run integration tests
node tests/integration/users-siswa-integration.test.js

# Expected results:
# - ✅ 0 broken relationships
# - ✅ All students have SISWA role
# - ✅ No duplicate usernames
# - ✅ All tests pass
```

### 3. **Code Review & Testing**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code review approved
- [ ] Performance benchmarks met
- [ ] Security audit passed

### 4. **Preparation**

- [ ] Notify users about maintenance window
- [ ] Prepare rollback plan
- [ ] Setup monitoring alerts
- [ ] Coordinate with team members
- [ ] Schedule deployment time (minimal traffic hours)

## 🚀 Deployment Steps

### Step 1: Enable Maintenance Mode (Optional)

```bash
# Create maintenance flag
touch /var/www/absenta/maintenance.flag

# Or set environment variable
export MAINTENANCE_MODE=true

# Backend will respond with 503 for all requests except health checks
```

### Step 2: Stop Application Services

```bash
# Stop backend services
pm2 stop absenta-backend

# Verify services are stopped
pm2 status
```

### Step 3: Run Database Migration

```bash
# Navigate to project directory
cd /var/www/absenta

# Run migration script
mysql -u root -p absenta13 < database/migrations/2025-10-21-users-siswa-normalization.sql

# Expected output:
# Query OK, X rows affected
# Query OK, Y rows affected
# ...
```

### Step 4: Validate Migration

```bash
# Run validation script
node database/scripts/validate-users-siswa-migration.js

# Expected output:
# ✅ MIGRATION VALIDATION: PASSED
# 
# 📊 Statistik Siswa:
#    Total: 78
#    Dengan akun: 78
#    Tanpa akun: 0
# 
# ❌ Broken relationships: 0
# ❌ Users dengan role tidak sesuai: 0
# ❌ Duplicate usernames: 0

# If validation fails, STOP and run rollback
```

### Step 5: Deploy New Backend Code

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application (if using TypeScript)
npm run build

# Verify build
ls -lh dist/
```

### Step 6: Start Application Services

```bash
# Start backend services
pm2 restart absenta-backend

# Or start fresh
pm2 start absenta-backend

# Monitor logs
pm2 logs absenta-backend --lines 100
```

### Step 7: Run Smoke Tests

```bash
# Run smoke test suite
node tests/smoke/post-deployment-smoke.test.js

# Expected output:
# ✅ Health check: OK
# ✅ Database connection: OK
# ✅ Admin login: OK
# ✅ Student creation: OK
# ✅ Student login: OK
# ✅ Attendance submission: OK
```

### Step 8: Monitor System Health

```bash
# Monitor application logs
pm2 logs absenta-backend

# Monitor error rates
tail -f /var/log/absenta/error.log

# Check system metrics
curl http://localhost:3001/api/health/detailed

# Expected response:
# {
#   "status": "healthy",
#   "database": { "connected": true, "queryTime": 15 },
#   "memory": { "heapUsed": "45MB", "heapTotal": "100MB" },
#   "connections": { "total": 10, "free": 8 }
# }
```

### Step 9: Disable Maintenance Mode

```bash
# Remove maintenance flag
rm /var/www/absenta/maintenance.flag

# Or unset environment variable
unset MAINTENANCE_MODE
```

### Step 10: Post-Deployment Validation

```bash
# Run full integration test suite
node tests/integration/users-siswa-integration.test.js

# Validate data integrity
node database/scripts/validate-users-siswa-migration.js

# Check user feedback
# Monitor error reporting systems
# Check application metrics dashboard
```

## 🔙 Rollback Procedure

### When to Rollback

Rollback immediately if:
- Migration validation fails
- Smoke tests fail
- Error rate > 5%
- Critical functionality broken
- Database integrity issues

### Rollback Steps

```bash
# Step 1: Stop application
pm2 stop absenta-backend

# Step 2: Run rollback script
mysql -u root -p absenta13 < database/migrations/2025-10-21-users-siswa-normalization-rollback.sql

# Step 3: Validate rollback
mysql -u root -p absenta13 -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM siswa;"

# Step 4: Revert code changes
git checkout HEAD~1  # or specific commit hash
npm install

# Step 5: Restart application
pm2 restart absenta-backend

# Step 6: Verify system health
curl http://localhost:3001/api/health
```

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

1. **Database Metrics**
   - Query execution time
   - Connection pool usage
   - Lock wait time
   - Slow query count

2. **Application Metrics**
   - Request rate
   - Response time (p50, p95, p99)
   - Error rate
   - Memory usage

3. **Business Metrics**
   - Login success rate
   - Student creation rate
   - Attendance submission rate
   - User active sessions

### Alert Thresholds

```javascript
const alertThresholds = {
  errorRate: 5,              // Alert if error rate > 5%
  responseTime: 3000,        // Alert if p99 > 3s
  brokenRelationships: 1,    // Alert if any broken relationships
  queryTime: 1000,           // Alert if query > 1s
  memoryUsage: 80            // Alert if memory > 80%
};
```

## 🔧 Troubleshooting

### Issue 1: Migration Fails with FK Error

**Symptoms**: `ERROR 1452: Cannot add or update a child row: a foreign key constraint fails`

**Solution**:
```bash
# Check broken relationships
mysql -u root -p absenta13 -e "
SELECT COUNT(*) FROM siswa s
WHERE s.user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);
"

# Fix broken relationships
mysql -u root -p absenta13 -e "
UPDATE siswa s
SET s.user_id = NULL
WHERE s.user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id);
"

# Retry migration
mysql -u root -p absenta13 < database/migrations/2025-10-21-users-siswa-normalization.sql
```

### Issue 2: Student Login Fails

**Symptoms**: Students cannot login with new credentials

**Solution**:
```bash
# Check user accounts
mysql -u root -p absenta13 -e "
SELECT u.id, u.username, u.role, s.nis, s.nama
FROM users u
JOIN siswa s ON u.id = s.user_id
WHERE u.role = 'SISWA'
LIMIT 10;
"

# Check if password is correct (hash should match)
# Students should use username: siswa_NIS, password: NIS@2024

# Reset password if needed
node database/scripts/reset-student-password.js --nis=2024001
```

### Issue 3: Data Integrity Issues

**Symptoms**: Broken relationships or inconsistent data

**Solution**:
```bash
# Run validation script
node database/scripts/validate-users-siswa-migration.js

# Auto-fix broken relationships
node database/scripts/fix-broken-relationships.js

# Verify fix
node database/scripts/validate-users-siswa-migration.js
```

## 📞 Support & Communication

### During Deployment

- **Primary Contact**: DevOps Team Leader
- **Backup Contact**: Backend Developer
- **Emergency Contact**: CTO

### Communication Channels

- **Slack**: #absenta-deployment
- **Email**: devops@school.edu
- **Phone**: +62-xxx-xxx-xxxx

### Status Updates

Send status updates every 15 minutes during deployment:
- ✅ Step X completed successfully
- ⚠️ Issue encountered in Step Y, investigating
- 🔴 Critical issue, initiating rollback

## 📝 Post-Deployment Tasks

### Immediate (Within 1 hour)

- [ ] Verify all critical functionality working
- [ ] Check error logs for anomalies
- [ ] Monitor system metrics
- [ ] Confirm with QA team

### Short Term (Within 24 hours)

- [ ] Collect user feedback
- [ ] Review performance metrics
- [ ] Update documentation
- [ ] Send deployment report

### Long Term (Within 1 week)

- [ ] Conduct post-mortem if issues occurred
- [ ] Update deployment procedures based on learnings
- [ ] Archive deployment artifacts
- [ ] Update runbooks

## ✅ Success Criteria

Deployment is considered successful if:

1. ✅ Migration validation passes (0 errors)
2. ✅ All smoke tests pass
3. ✅ Error rate < 1%
4. ✅ Response time p99 < 2s
5. ✅ No critical bugs reported
6. ✅ All students can login
7. ✅ Attendance system working
8. ✅ No data loss
9. ✅ System stable for 24 hours

## 📈 Performance Benchmarks

### Before Migration

- Average response time: 150ms
- p95 response time: 300ms
- p99 response time: 500ms
- Database query time: 50ms avg
- Memory usage: 200MB avg

### After Migration (Expected)

- Average response time: ≤ 200ms
- p95 response time: ≤ 400ms
- p99 response time: ≤ 600ms
- Database query time: ≤ 80ms avg
- Memory usage: ≤ 250MB avg

## 🎯 Conclusion

This deployment guide provides a comprehensive, step-by-step process for deploying the Users-Siswa Full Normalization with minimal risk and maximum reliability.

**Remember**:
- Always test in staging first
- Have a rollback plan ready
- Monitor actively during and after deployment
- Communicate clearly with all stakeholders
- Document any deviations or issues

Good luck with your deployment! 🚀

