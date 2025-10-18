#!/usr/bin/env node

import fs from 'fs/promises';

async function cleanStudentDashboard() {
    console.log('🗑️  Cleaning izin code from StudentDashboard_Modern.tsx...');
    
    try {
        const filePath = 'src/components/StudentDashboard_Modern.tsx';
        const content = await fs.readFile(filePath, 'utf8');
        
        console.log(`📄 Original file size: ${content.length} characters`);
        
        // Remove izin-related interfaces and types
        let cleanedContent = content
            // Remove PengajuanIzin interface
            .replace(/interface PengajuanIzin[\s\S]*?^}/gm, '')
            // Remove izin-related state variables
            .replace(/const \[pengajuanIzin, setPengajuanIzin\] = useState<PengajuanIzin\[\]>\(\[\]\);/g, '')
            .replace(/const \[pengajuanIzinPage, setPengajuanIzinPage\] = useState\(1\);/g, '')
            .replace(/pengajuanIzin: false,/g, '')
            // Remove izin form state
            .replace(/const \[formIzinKelas, setFormIzinKelas\] = useState<\{[\s\S]*?\}>\([\s\S]*?\);/g, '')
            // Remove izin-related functions
            .replace(/\/\/ Load pengajuan izin data[\s\S]*?}, \[siswaId\]\);/g, '')
            .replace(/\/\/ Submit pengajuan izin \(single student\) - REMOVED[\s\S]*?\/\/   };/g, '')
            .replace(/\/\/ Submit pengajuan izin kelas[\s\S]*?}, \[siswaId\]\);/g, '')
            // Remove izin-related useEffect
            .replace(/if \(siswaId && activeTab === 'pengajuan-izin'\) \{[\s\S]*?\}/g, '')
            // Remove izin-related pagination
            .replace(/const paginatedPengajuanIzin = useMemo\(\(\) => \{[\s\S]*?\}, \[pengajuanIzin, pengajuanIzinPage, itemsPerPage\]\);/g, '')
            .replace(/const totalPengajuanIzinPages = useMemo\(\(\) => \{[\s\S]*?\}, \[pengajuanIzin\.length, itemsPerPage\]\);/g, '')
            // Remove izin-related UI elements
            .replace(/<Tab value="pengajuan-izin">[\s\S]*?<\/Tab>/g, '')
            .replace(/<TabsContent value="pengajuan-izin">[\s\S]*?<\/TabsContent>/g, '')
            // Remove izin-related API calls
            .replace(/\/api\/siswa\/\$\{siswaId\}\/pengajuan-izin/g, '')
            .replace(/\/api\/siswa\/\$\{siswaId\}\/pengajuan-izin-kelas/g, '')
            // Clean up multiple empty lines
            .replace(/\n\s*\n\s*\n/g, '\n\n');
        
        console.log(`📄 Cleaned file size: ${cleanedContent.length} characters`);
        console.log(`🗑️  Removed: ${content.length - cleanedContent.length} characters`);
        
        // Write back the cleaned content
        await fs.writeFile(filePath, cleanedContent, 'utf8');
        console.log('✅ Successfully cleaned StudentDashboard_Modern.tsx');
        
        // Verify cleanup
        const remainingIzin = cleanedContent.match(/pengajuan|izin|leave/gi);
        if (remainingIzin) {
            console.log('⚠️  Warning: Some izin references may still remain:', remainingIzin.slice(0, 5));
        } else {
            console.log('✅ No izin references found');
        }
        
    } catch (error) {
        console.error('❌ Error cleaning StudentDashboard_Modern.tsx:', error);
        throw error;
    }
}

// Run the cleanup
cleanStudentDashboard().catch(console.error);

