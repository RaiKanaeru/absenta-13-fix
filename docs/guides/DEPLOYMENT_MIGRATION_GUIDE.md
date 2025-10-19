# Deployment and Database Migration Guide

This guide outlines the steps to deploy the latest changes, including database migrations, to the production environment.

## ⚠️ Important Pre-deployment Steps

1. **Full Database Backup**:
   Before proceeding with any migration, ensure a complete backup of your production database is created.
   ```bash
   mysqldump -u [your_db_user] -p[your_db_password] [your_database_name] > backup_absenta_$(date +%Y%m%d_%H%M%S).sql
   ```
   Verify the backup file's integrity.

2. **Application Downtime**:
   It is highly recommended to put the application into maintenance mode or stop the application servers during the database migration to prevent data inconsistencies.

3. **Environment Variables**:
   Ensure all necessary environment variables (e.g., `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) are correctly set in your production environment.

## 🚀 Database Migration Steps

The following steps will apply the necessary schema changes, including the removal of the `idx_siswa_user_id` unique constraint.

1. **Access Database Server**:
   Log in to your production database server.

2. **Execute Migration Script**:
   Run the `database-migration-production.sql` script. This script contains the `ALTER TABLE` statements to modify the `siswa` table.
   ```bash
   mysql -u [your_db_user] -p[your_db_password] [your_database_name] < database-migration-production.sql
   ```
   Replace `[your_db_user]`, `[your_db_password]`, and `[your_database_name]` with your actual database credentials and name.

3. **Verify Migration**:
   After execution, verify the changes by checking the table structure:
   ```sql
   SHOW CREATE TABLE `siswa`;
   SHOW INDEX FROM `siswa`;
   ```
   Confirm that `idx_siswa_user_id` is no longer a `UNIQUE` key and is either a regular index or completely removed as per the script.

## ✅ Post-deployment Verification

1. **Restart Application Servers**:
   Once the database migration is complete, restart your application servers to ensure they pick up the latest code and database schema.

2. **Smoke Testing**:
   Perform a series of smoke tests on the application to ensure critical functionalities (login, attendance submission, dashboard views) are working as expected.
   - Login as `admin`, `guru`, and `perwakilan` (siswa).
   - Submit attendance.
   - Check attendance recap reports.
   - Verify that multiple students can now be associated with a single `user_id` (if applicable to your data model).

## ↩️ Rollback Procedure (if necessary)

In case of critical issues after migration:

1. **Stop Application Servers**.
2. **Restore Database**:
   Restore the database from the full backup taken before migration.
   ```bash
   mysql -u [your_db_user] -p[your_db_password] [your_database_name] < [path_to_your_backup_file].sql
   ```
3. **Investigate and Fix**:
   Analyze the root cause of the issue and prepare a new migration or fix.