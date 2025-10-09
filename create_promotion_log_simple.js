import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absenta13',
  port: 3306
};

async function createPromotionLogTable() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Create promotion_log table
    console.log('📝 Creating promotion_log table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`promotion_log\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`from_class_id\` int(11) NOT NULL COMMENT 'ID kelas asal',
        \`to_class_id\` int(11) NOT NULL COMMENT 'ID kelas tujuan',
        \`student_ids\` json NOT NULL COMMENT 'Array ID siswa yang dipromosikan',
        \`promoted_at\` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Waktu promosi dilakukan',
        \`admin_user_id\` int(11) NOT NULL COMMENT 'ID admin yang melakukan promosi',
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_from_class\` (\`from_class_id\`),
        KEY \`idx_to_class\` (\`to_class_id\`),
        KEY \`idx_promoted_at\` (\`promoted_at\`),
        KEY \`idx_admin_user\` (\`admin_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Audit log untuk promosi siswa antar kelas'
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Created promotion_log table');

    // Test the table
    console.log('🧪 Testing promotion_log table...');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM promotion_log');
    console.log('✅ Promotion log table accessible, current records:', rows[0].count);

    console.log('🎉 Promotion log table created successfully!');

  } catch (error) {
    console.error('❌ Failed to create promotion log table:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createPromotionLogTable().catch(console.error);

