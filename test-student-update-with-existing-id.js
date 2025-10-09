// Test Student Update with Existing ID
import mysql from 'mysql2/promise';
import 'dotenv/config';

const testStudentUpdateWithExistingId = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🧪 Testing student update with existing ID...\n');

        // Get existing student
        const [students] = await connection.execute(`
            SELECT id_siswa, nama, user_id FROM siswa LIMIT 1
        `);
        
        if (students.length === 0) {
            console.log('❌ No students found');
            return;
        }
        
        const student = students[0];
        console.log(`👨‍🎓 Using student: ${student.nama} (id_siswa: ${student.id_siswa})`);

        // Test the update endpoint
        console.log('\n🔄 Testing update endpoint...');
        
        const updateData = {
            nama: student.nama + ' (Updated)',
            nis: '1234567890',
            username: 'teststudent' + Date.now(),
            kelas_id: 353,
            jabatan: 'Siswa',
            jenis_kelamin: 'L',
            email: 'teststudent@example.com',
            alamat: 'Jl. Test No. 1 (Updated)',
            telepon_orangtua: '08123456789',
            telepon_siswa: '08123456788',
            status: 'aktif'
        };

        const token = await getToken();
        console.log(`   Token: ${token ? 'Valid' : 'Invalid'}`);
        
        const updateResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${student.id_siswa}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        const updateResult = await updateResponse.json();
        console.log(`   Update response status: ${updateResponse.status}`);
        console.log(`   Update response data:`, JSON.stringify(updateResult, null, 2));

        if (updateResponse.ok && updateResult.success) {
            console.log(`   ✅ Update successful!`);
            
            // Verify the update
            console.log(`\n🔍 Verifying update...`);
            const [updatedStudent] = await connection.execute(
                'SELECT nama, alamat FROM siswa WHERE id_siswa = ?',
                [student.id_siswa]
            );
            
            if (updatedStudent.length > 0) {
                console.log(`   Updated name: ${updatedStudent[0].nama}`);
                console.log(`   Updated address: ${updatedStudent[0].alamat}`);
                console.log(`   Update verified: ${updatedStudent[0].nama.includes('(Updated)') ? 'Yes' : 'No'}`);
            }
        } else {
            console.log(`   ❌ Update failed: ${updateResult.error}`);
        }

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDisconnected from database.');
        }
    }
};

const getToken = async () => {
    try {
        const loginResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        
        const loginData = await loginResponse.json();
        console.log('   Login response:', loginData);
        return loginData.data?.token;
    } catch (error) {
        console.error('   Error getting token:', error);
        return null;
    }
};

testStudentUpdateWithExistingId();
