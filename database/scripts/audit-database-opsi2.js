import db from '../../db.js';
import fs from 'fs/promises';
import path from 'path';

async function auditDatabase() {
  console.log('🔍 Starting Database Audit for Opsi 2 Full Normalization...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    tableStructures: {},
    dataAnalysis: {},
    dependencies: [],
    issues: [],
    recommendations: []
  };

  try {
    // ==============================
    // 1. CHECK TABLE STRUCTURES
    // ==============================
    console.log('📋 Step 1: Checking table structures...');
    
    const tables = ['users', 'siswa', 'pengguna', 'guru'];
    for (const table of tables) {
      try {
        const [structure] = await db.execute(`SHOW CREATE TABLE ${table}`);
        report.tableStructures[table] = structure[0]['Create Table'];
        console.log(`  ✅ ${table} table found`);
      } catch (error) {
        console.log(`  ❌ ${table} table not found: ${error.message}`);
        report.issues.push({
          severity: 'HIGH',
          table: table,
          issue: 'Table does not exist',
          message: error.message
        });
      }
    }

    // ==============================
    // 2. CHECK FOR DATA DUPLICATION
    // ==============================
    console.log('\n📊 Step 2: Analyzing data duplication...');
    
    try {
      const [dupData] = await db.execute(`
        SELECT 
          s.id_siswa, 
          s.nama as siswa_nama, 
          s.user_id, 
          u.id as user_id_actual, 
          u.nama as user_nama, 
          u.role
        FROM siswa s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id IS NOT NULL
        LIMIT 10
      `);
      
      report.dataAnalysis.duplication = {
        sampleSize: dupData.length,
        samples: dupData
      };
      console.log(`  📌 Found ${dupData.length} siswa records with user_id`);
    } catch (error) {
      console.log(`  ⚠️ Could not check duplication: ${error.message}`);
    }

    // ==============================
    // 3. CHECK BROKEN RELATIONSHIPS
    // ==============================
    console.log('\n🔗 Step 3: Checking for broken relationships...');
    
    try {
      const [broken] = await db.execute(`
        SELECT s.id_siswa, s.nama, s.user_id
        FROM siswa s
        WHERE s.user_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.user_id)
      `);
      
      report.dataAnalysis.brokenRelationships = {
        count: broken.length,
        samples: broken.slice(0, 10)
      };
      
      if (broken.length > 0) {
        console.log(`  ❌ Found ${broken.length} broken user_id relationships`);
        report.issues.push({
          severity: 'CRITICAL',
          table: 'siswa',
          issue: 'Broken foreign key relationships',
          count: broken.length,
          message: 'siswa.user_id references non-existent users.id'
        });
      } else {
        console.log(`  ✅ No broken relationships found`);
      }
    } catch (error) {
      console.log(`  ⚠️ Could not check broken relationships: ${error.message}`);
    }

    // ==============================
    // 4. CHECK ROLE ENUM CONSISTENCY
    // ==============================
    console.log('\n🏷️  Step 4: Checking role enum consistency...');
    
    try {
      const [roles] = await db.execute(`SELECT DISTINCT role FROM users`);
      report.dataAnalysis.userRoles = roles.map(r => r.role);
      console.log(`  📌 Found roles: ${roles.map(r => r.role).join(', ')}`);
      
      const [enumDef] = await db.execute(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'absenta13' 
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'role'
      `);
      
      if (enumDef.length > 0) {
        report.dataAnalysis.roleEnumDefinition = enumDef[0].COLUMN_TYPE;
        console.log(`  📌 Enum definition: ${enumDef[0].COLUMN_TYPE}`);
        
        // Check if 'SISWA' is in enum
        if (!enumDef[0].COLUMN_TYPE.includes('SISWA')) {
          report.issues.push({
            severity: 'HIGH',
            table: 'users',
            issue: 'Missing SISWA role in enum',
            message: 'Role enum needs to be updated to include SISWA'
          });
          console.log(`  ⚠️ Role enum does not include 'SISWA'`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Could not check role enum: ${error.message}`);
    }

    // ==============================
    // 5. CHECK FOREIGN KEY DEPENDENCIES
    // ==============================
    console.log('\n🔗 Step 5: Checking foreign key dependencies...');
    
    try {
      const [dependencies] = await db.execute(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME IN ('siswa', 'users')
          AND TABLE_SCHEMA = 'absenta13'
      `);
      
      report.dependencies = dependencies;
      console.log(`  📌 Found ${dependencies.length} foreign key dependencies`);
      dependencies.forEach(dep => {
        console.log(`    - ${dep.TABLE_NAME}.${dep.COLUMN_NAME} → ${dep.REFERENCED_TABLE_NAME}.${dep.REFERENCED_COLUMN_NAME}`);
      });
    } catch (error) {
      console.log(`  ⚠️ Could not check dependencies: ${error.message}`);
    }

    // ==============================
    // 6. STATISTICS
    // ==============================
    console.log('\n📊 Step 6: Gathering statistics...');
    
    try {
      const [siswaStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_siswa,
          SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as dengan_akun,
          SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as tanpa_akun
        FROM siswa
      `);
      
      report.dataAnalysis.siswaStatistics = siswaStats[0];
      console.log(`  📊 Siswa Statistics:`);
      console.log(`     Total: ${siswaStats[0].total_siswa}`);
      console.log(`     Dengan akun: ${siswaStats[0].dengan_akun}`);
      console.log(`     Tanpa akun: ${siswaStats[0].tanpa_akun}`);
      
      const [userStats] = await db.execute(`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);
      
      report.dataAnalysis.userStatistics = userStats;
      console.log(`\n  📊 Users Statistics:`);
      userStats.forEach(stat => {
        console.log(`     ${stat.role}: ${stat.count}`);
      });
    } catch (error) {
      console.log(`  ⚠️ Could not gather statistics: ${error.message}`);
    }

    // ==============================
    // 7. GENERATE RECOMMENDATIONS
    // ==============================
    console.log('\n💡 Step 7: Generating recommendations...');
    
    if (report.dataAnalysis.brokenRelationships?.count > 0) {
      report.recommendations.push({
        priority: 'HIGH',
        action: 'Fix broken relationships',
        description: 'Set user_id to NULL for siswa with non-existent user references'
      });
    }
    
    if (report.dataAnalysis.roleEnumDefinition && !report.dataAnalysis.roleEnumDefinition.includes('SISWA')) {
      report.recommendations.push({
        priority: 'HIGH',
        action: 'Update role enum',
        description: 'Add SISWA to users.role enum and migrate KETOS/perwakilan to SISWA'
      });
    }
    
    if (report.dataAnalysis.siswaStatistics?.tanpa_akun > 0) {
      report.recommendations.push({
        priority: 'MEDIUM',
        action: 'Create user accounts',
        description: `Create ${report.dataAnalysis.siswaStatistics.tanpa_akun} user accounts for siswa without accounts`
      });
    }

    // ==============================
    // 8. SAVE REPORT
    // ==============================
    console.log('\n💾 Step 8: Saving audit report...');
    
    const reportDir = path.join(process.cwd(), 'docs', 'analysis');
    await fs.mkdir(reportDir, { recursive: true });
    
    const reportPath = path.join(reportDir, 'database-audit-opsi2.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    const mdReportPath = path.join(reportDir, 'database-audit-opsi2.md');
    const mdContent = generateMarkdownReport(report);
    await fs.writeFile(mdReportPath, mdContent);
    
    console.log(`  ✅ Report saved to:`);
    console.log(`     - ${reportPath}`);
    console.log(`     - ${mdReportPath}`);

    // ==============================
    // 9. SUMMARY
    // ==============================
    console.log('\n' + '='.repeat(60));
    console.log('📋 AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Issues Found: ${report.issues.length}`);
    console.log(`Critical: ${report.issues.filter(i => i.severity === 'CRITICAL').length}`);
    console.log(`High: ${report.issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`Medium: ${report.issues.filter(i => i.severity === 'MEDIUM').length}`);
    console.log(`\nRecommendations: ${report.recommendations.length}`);
    console.log('='.repeat(60));

    return report;

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
}

function generateMarkdownReport(report) {
  let md = `# Database Audit Report - Opsi 2 Full Normalization\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  
  md += `## Executive Summary\n\n`;
  md += `- **Total Issues:** ${report.issues.length}\n`;
  md += `- **Critical Issues:** ${report.issues.filter(i => i.severity === 'CRITICAL').length}\n`;
  md += `- **High Priority Issues:** ${report.issues.filter(i => i.severity === 'HIGH').length}\n`;
  md += `- **Recommendations:** ${report.recommendations.length}\n\n`;
  
  if (report.issues.length > 0) {
    md += `## Issues Found\n\n`;
    report.issues.forEach((issue, idx) => {
      md += `### ${idx + 1}. ${issue.issue} (${issue.severity})\n\n`;
      md += `- **Table:** ${issue.table}\n`;
      md += `- **Message:** ${issue.message}\n`;
      if (issue.count) md += `- **Count:** ${issue.count}\n`;
      md += `\n`;
    });
  }
  
  if (report.recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, idx) => {
      md += `### ${idx + 1}. ${rec.action} (${rec.priority})\n\n`;
      md += `${rec.description}\n\n`;
    });
  }
  
  if (report.dataAnalysis.siswaStatistics) {
    md += `## Siswa Statistics\n\n`;
    const stats = report.dataAnalysis.siswaStatistics;
    md += `- **Total Siswa:** ${stats.total_siswa}\n`;
    md += `- **Dengan Akun:** ${stats.dengan_akun}\n`;
    md += `- **Tanpa Akun:** ${stats.tanpa_akun}\n\n`;
  }
  
  if (report.dependencies.length > 0) {
    md += `## Foreign Key Dependencies\n\n`;
    md += `| Table | Column | References |\n`;
    md += `|-------|--------|------------|\n`;
    report.dependencies.forEach(dep => {
      md += `| ${dep.TABLE_NAME} | ${dep.COLUMN_NAME} | ${dep.REFERENCED_TABLE_NAME}.${dep.REFERENCED_COLUMN_NAME} |\n`;
    });
    md += `\n`;
  }
  
  return md;
}

// Run audit
auditDatabase()
  .then(() => {
    console.log('\n✅ Audit completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  });


