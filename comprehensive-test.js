// Comprehensive Test Suite for Absenta System
import 'dotenv/config';

const comprehensiveTest = async () => {
    let token;
    let testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    const addTest = (name, passed, message) => {
        testResults.tests.push({ name, passed, message });
        if (passed) {
            testResults.passed++;
            console.log(`✅ ${name}: ${message}`);
        } else {
            testResults.failed++;
            console.log(`❌ ${name}: ${message}`);
        }
    };
    
    try {
        console.log('🧪 Starting Comprehensive Test Suite...\n');
        
        // Test 1: Login
        console.log('🔐 Test 1: Authentication');
        try {
            const loginResponse = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: 'admin123' })
            });
            
            const loginData = await loginResponse.json();
            token = loginData.data?.token;
            
            if (token && loginData.success) {
                addTest('Login', true, 'Admin login successful');
            } else {
                addTest('Login', false, 'Login failed or no token received');
                return;
            }
        } catch (error) {
            addTest('Login', false, error.message);
            return;
        }
        
        // Test 2: Student Management
        console.log('\n👨‍🎓 Test 2: Student Management');
        try {
            // GET students
            const studentsResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const studentsData = await studentsResponse.json();
            if (studentsData.success && studentsData.data?.data) {
                addTest('GET Students', true, `Found ${studentsData.data.data.length} students`);
            } else {
                addTest('GET Students', false, 'Failed to fetch students');
            }
            
            // POST new student
            const newStudent = {
                username: 'teststudent123',
                nis: '20249999',
                nama: 'Test Student',
                kelas_id: 353,
                jabatan: 'Sekretaris Kelas',
                jenis_kelamin: 'L',
                email: 'test@example.com'
            };
            
            const createResponse = await fetch('http://localhost:3001/api/admin/siswa-perwakilan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newStudent)
            });
            
            const createData = await createResponse.json();
            if (createData.success) {
                addTest('POST Student', true, 'Student created successfully');
                
                // Test PUT student
                const studentId = createData.data?.id;
                if (studentId) {
                    const updateStudent = { ...newStudent, nama: 'Test Student Updated' };
                    const updateResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${studentId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateStudent)
                    });
                    
                    const updateData = await updateResponse.json();
                    if (updateData.success) {
                        addTest('PUT Student', true, 'Student updated successfully');
                    } else {
                        addTest('PUT Student', false, 'Failed to update student');
                    }
                    
                    // Test DELETE student
                    const deleteResponse = await fetch(`http://localhost:3001/api/admin/siswa-perwakilan/${studentId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const deleteData = await deleteResponse.json();
                    if (deleteData.success) {
                        addTest('DELETE Student', true, 'Student deleted successfully');
                    } else {
                        addTest('DELETE Student', false, 'Failed to delete student');
                    }
                }
            } else {
                addTest('POST Student', false, 'Failed to create student');
            }
            
        } catch (error) {
            addTest('Student Management', false, error.message);
        }
        
        // Test 3: Teacher Management
        console.log('\n👨‍🏫 Test 3: Teacher Management');
        try {
            const teachersResponse = await fetch('http://localhost:3001/api/admin/guru', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const teachersData = await teachersResponse.json();
            if (teachersData.success && teachersData.data) {
                addTest('GET Teachers', true, `Found ${teachersData.data.length} teachers`);
            } else {
                addTest('GET Teachers', false, 'Failed to fetch teachers');
            }
        } catch (error) {
            addTest('Teacher Management', false, error.message);
        }
        
        // Test 4: Subject Management
        console.log('\n📚 Test 4: Subject Management');
        try {
            const subjectsResponse = await fetch('http://localhost:3001/api/admin/mapel', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const subjectsData = await subjectsResponse.json();
            if (subjectsData.success && subjectsData.data) {
                addTest('GET Subjects', true, `Found ${subjectsData.data.length} subjects`);
            } else {
                addTest('GET Subjects', false, 'Failed to fetch subjects');
            }
        } catch (error) {
            addTest('Subject Management', false, error.message);
        }
        
        // Test 5: Class Management
        console.log('\n🏫 Test 5: Class Management');
        try {
            const classesResponse = await fetch('http://localhost:3001/api/admin/kelas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const classesData = await classesResponse.json();
            if (classesData.success && classesData.data) {
                addTest('GET Classes', true, `Found ${classesData.data.length} classes`);
            } else {
                addTest('GET Classes', false, 'Failed to fetch classes');
            }
        } catch (error) {
            addTest('Class Management', false, error.message);
        }
        
        // Test 6: Health Check
        console.log('\n🏥 Test 6: Health Check');
        try {
            const healthResponse = await fetch('http://localhost:3001/api/health');
            const healthData = await healthResponse.json();
            if (healthData.status === 'ok') {
                addTest('Health Check', true, 'System is healthy');
            } else {
                addTest('Health Check', false, 'System health check failed');
            }
        } catch (error) {
            addTest('Health Check', false, error.message);
        }
        
        // Test Summary
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All tests passed! System is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the issues above.');
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
};

comprehensiveTest();
