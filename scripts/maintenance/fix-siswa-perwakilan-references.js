// Script untuk mengganti semua referensi siswa_perwakilan dengan siswa
import fs from 'fs';

const filePath = 'server_modern.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace patterns
const replacements = [
    // Table references
    { from: 'FROM siswa_perwakilan sp', to: 'FROM siswa s' },
    { from: 'FROM siswa_perwakilan', to: 'FROM siswa' },
    { from: 'JOIN siswa_perwakilan sp', to: 'JOIN siswa s' },
    { from: 'JOIN siswa_perwakilan', to: 'JOIN siswa' },
    { from: 'INNER JOIN siswa_perwakilan', to: 'INNER JOIN siswa' },
    { from: 'LEFT JOIN siswa_perwakilan', to: 'LEFT JOIN siswa' },
    
    // Column references
    { from: 'sp.id_siswa', to: 's.id_siswa' },
    { from: 'sp.nis', to: 's.nis' },
    { from: 'sp.nama', to: 's.nama' },
    { from: 'sp.kelas_id', to: 's.kelas_id' },
    { from: 'sp.user_id', to: 's.id_pengguna' },
    { from: 'sp.status', to: 's.status' },
    { from: 'sp.jabatan', to: 's.jabatan' },
    { from: 'sp.created_at', to: 's.dibuat_pada' },
    { from: 'sp.updated_at', to: 's.diperbarui_pada' },
    
    // WHERE clauses
    { from: 'WHERE sp.user_id = ?', to: 'WHERE s.id_pengguna = ?' },
    { from: 'WHERE sp.id_siswa = ?', to: 'WHERE s.id_siswa = ?' },
    { from: 'WHERE sp.kelas_id = ?', to: 'WHERE s.kelas_id = ?' },
    { from: 'WHERE sp.status = "aktif"', to: 'WHERE s.status = "aktif"' },
    
    // ORDER BY
    { from: 'ORDER BY sp.created_at', to: 'ORDER BY s.dibuat_pada' },
    { from: 'ORDER BY sp.nama', to: 'ORDER BY s.nama' },
    
    // COUNT queries
    { from: 'COUNT(*) as total FROM siswa_perwakilan', to: 'COUNT(*) as total FROM siswa' },
    
    // Specific patterns
    { from: 'siswa_perwakilan sp', to: 'siswa s' },
    { from: 'siswa_perwakilan', to: 'siswa' }
];

// Apply replacements
replacements.forEach(replacement => {
    const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, replacement.to);
});

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ All siswa_perwakilan references have been updated to siswa');
console.log('📝 Please review the changes and test the application');
