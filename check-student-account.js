import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

async function checkStudentAccount() {
  console.log('🔍 Checking student account...\n');

  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'absenta13'
    });

    // Check if student exists
    console.log('1️⃣ Checking if student perwakilan2002 exists...');
    const [students] = await connection.execute(
      'SELECT * FROM pengguna WHERE username = ? AND peran = ?',
      ['perwakilan2002', 'siswa']
    );

    if (students.length === 0) {
      console.log('❌ Student perwakilan2002 not found');
      
      // Check what students exist
      const [allStudents] = await connection.execute(
        'SELECT username, nama, peran FROM pengguna WHERE peran = ? LIMIT 5',
        ['siswa']
      );
      console.log('📋 Available students:', allStudents);
      
      await connection.end();
      return;
    }

    const student = students[0];
    console.log('✅ Student found:', {
      id: student.id,
      username: student.username,
      nama: student.nama,
      peran: student.peran
    });

    // Test password
    console.log('\n2️⃣ Testing password...');
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, student.password);
    console.log('🔐 Password test result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password is incorrect');
      
      // Check what the actual password hash looks like
      console.log('🔍 Password hash:', student.password);
      
      // Try to create a new password hash
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('🔧 New password hash would be:', newHash);
      
      // Update the password
      console.log('\n3️⃣ Updating password...');
      await connection.execute(
        'UPDATE pengguna SET password = ? WHERE username = ?',
        [newHash, 'perwakilan2002']
      );
      console.log('✅ Password updated successfully');
    }

    // Check student data in siswa table
    console.log('\n4️⃣ Checking student data in siswa table...');
    const [siswaData] = await connection.execute(
      'SELECT * FROM siswa WHERE id = ?',
      [student.id]
    );

    if (siswaData.length === 0) {
      console.log('❌ No student data found in siswa table');
    } else {
      console.log('✅ Student data found:', {
        id_siswa: siswaData[0].id_siswa,
        nama: siswaData[0].nama,
        nis: siswaData[0].nis,
        kelas_id: siswaData[0].kelas_id
      });
    }

    await connection.end();
    console.log('\n🎉 Student account check completed!');

  } catch (error) {
    console.error('❌ Error checking student account:', error);
  }
}

checkStudentAccount();

