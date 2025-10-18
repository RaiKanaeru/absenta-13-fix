#!/usr/bin/env node

/**
 * Script untuk memperbaiki frontend tanpa mengubah UI/UX
 * Hanya menghapus kode yang tidak digunakan dan tidak mempengaruhi tampilan
 */

import fs from 'fs';

const FRONTEND_FILE = 'src/components/StudentDashboard_Modern.tsx';

async function fixFrontendSafely() {
    console.log('🔧 Fixing frontend safely without changing UI/UX...');
    
    try {
        const content = await fs.promises.readFile(FRONTEND_FILE, 'utf8');
        
        // Hapus hanya komentar yang sudah di-comment dan kode yang tidak digunakan
        let cleaned = content;
        
        // Hapus komentar yang sudah di-comment
        const lines = cleaned.split('\n');
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            // Hapus baris yang hanya berisi komentar yang sudah di-comment
            if (trimmed.startsWith('// State untuk form pengajuan izin kelas')) return false;
            if (trimmed.startsWith('//       console.error(\'❌ Error submitting pengajuan izin\'')) return false;
            if (trimmed.startsWith('//         description: errorData.error || "Gagal mengirim pengajuan izin",')) return false;
            if (trimmed.startsWith('//     console.error(\'Error submitting pengajuan izin\'')) return false;
            return true;
        });
        
        cleaned = filteredLines.join('\n');
        
        await fs.promises.writeFile(FRONTEND_FILE, cleaned);
        console.log('✅ Frontend fixed safely - UI/UX preserved');
        
    } catch (error) {
        console.error('❌ Error fixing frontend:', error);
    }
}

fixFrontendSafely();

