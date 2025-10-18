# Deployment Migration Guide - PERWAKILAN Role Normalization

## Pre-Migration Checklist

- [ ] Backup database: `mysqldump absenta13 > backup_pre_migration_20250118.sql`
- [ ] Verify backup integrity
- [ ] Notify all users about maintenance window
- [ ] Stop all running server instances
- [ ] Clear Redis cache if applicable

## Migration Steps

### 1. Database Migration
```bash
mysql -u root -p absenta13 < database-migration-production.sql
```

### 2. Verify Migration Success

```bash
mysql -u root -p absenta13 -e "SELECT role, COUNT(*) FROM users GROUP BY role;"
mysql -u root -p absenta13 -e "SHOW INDEX FROM siswa WHERE Key_name = 'idx_siswa_user_id';"
```

### 3. Update Application Files

- Deploy updated `backend/routes/attendance.js`
- No frontend changes needed (already completed)

### 4. Restart Services

```bash
pm2 restart absenta-backend
# or
node server_modern.js
```

### 5. Post-Migration Testing

- [ ] Test login with perwakilan account
- [ ] Test attendance submission by perwakilan
- [ ] Verify JWT payload contains lowercase role
- [ ] Verify multiple students can share user_id

## Rollback Procedure

If migration fails:

```bash
mysql -u root -p absenta13 < backup_pre_migration_20250118.sql
pm2 restart absenta-backend
```

## Expected Behavior After Migration

✅ All 'KETOS'/'ketos' roles → 'perwakilan'

✅ JWT tokens generate with lowercase 'perwakilan' role

✅ RBAC middleware accepts 'perwakilan' in requireRole checks

✅ Multiple siswa can share same user_id

✅ Legacy attendance routes work with new role

## Support Contacts

- Technical Lead: [contact]
- Database Admin: [contact]
- On-Call Engineer: [contact]
