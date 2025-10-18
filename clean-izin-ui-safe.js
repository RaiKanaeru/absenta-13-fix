#!/usr/bin/env node

/**
 * Script untuk membersihkan kode izin dari frontend tanpa mengubah UI/UX
 * Hanya menghapus kode yang tidak digunakan dan tidak mempengaruhi tampilan
 */

import fs from 'fs';

const FRONTEND_FILE = 'src/components/StudentDashboard_Modern.tsx';

async function cleanIzinCodeSafely() {
    console.log('🧹 Cleaning izin code from frontend safely...');
    
    try {
        const content = await fs.promises.readFile(FRONTEND_FILE, 'utf8');
        
        // Hapus hanya komentar yang sudah di-comment dan kode yang tidak digunakan
        let cleaned = content;
        
        // Hapus komentar yang sudah di-comment
        const lines = cleaned.split('\n');
        const filteredLines = lines.filter(line => {
            // Hapus baris yang hanya berisi komentar yang sudah di-comment
            const trimmed = line.trim();
            if (trimmed.startsWith('// State untuk form pengajuan izin (single student) - REMOVED')) return false;
            if (trimmed.startsWith('// const [formIzin, setFormIzin] = useState(')) return false;
            if (trimmed.startsWith('// const [showFormIzin, setShowFormIzin] = useState(false);')) return false;
            if (trimmed.startsWith('// const [showFormBanding, setShowFormBanding] = useState(false);')) return false;
            if (trimmed.startsWith('// State untuk form banding absen (single student) - REMOVED')) return false;
            if (trimmed.startsWith('// Submit pengajuan izin (single student) - REMOVED')) return false;
            if (trimmed.startsWith('// console.error(\'❌ Error submitting pengajuan izin\'')) return false;
            if (trimmed.startsWith('// console.error(\'Error submitting pengajuan izin\'')) return false;
            if (trimmed.startsWith('// });')) return false;
            if (trimmed.startsWith('// }')) return false;
            return true;
        });
        
        cleaned = filteredLines.join('\n');
        
        await fs.promises.writeFile(FRONTEND_FILE, cleaned);
        console.log('✅ Frontend cleaned safely - UI/UX preserved');
        
    } catch (error) {
        console.error('❌ Error cleaning frontend:', error);
    }
}

cleanIzinCodeSafely();