// Script untuk mengganti semua referensi id_pengguna dengan user_id
import fs from 'fs';

const filePath = 'server_modern.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace patterns
const replacements = [
    // Column references
    { from: 's.id_pengguna', to: 's.user_id' },
    { from: 'sp.id_pengguna', to: 'sp.user_id' },
    { from: 'siswa.id_pengguna', to: 'siswa.user_id' },
    { from: 'WHERE s.id_pengguna = ?', to: 'WHERE s.user_id = ?' },
    { from: 'WHERE sp.id_pengguna = ?', to: 'WHERE sp.user_id = ?' },
    { from: 'ON s.id_pengguna = u.id', to: 'ON s.user_id = u.id' },
    { from: 'ON sp.id_pengguna = u.id', to: 'ON sp.user_id = u.id' },
    { from: 'LEFT JOIN users u ON s.id_pengguna = u.id', to: 'LEFT JOIN users u ON s.user_id = u.id' },
    { from: 'LEFT JOIN users u ON sp.id_pengguna = u.id', to: 'LEFT JOIN users u ON sp.user_id = u.id' },
    { from: 'JOIN users u ON s.id_pengguna = u.id', to: 'JOIN users u ON s.user_id = u.id' },
    { from: 'JOIN users u ON sp.id_pengguna = u.id', to: 'JOIN users u ON sp.user_id = u.id' }
];

// Apply replacements
replacements.forEach(replacement => {
    const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, replacement.to);
});

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ All id_pengguna references have been updated to user_id');
console.log('📝 Please review the changes and test the application');
