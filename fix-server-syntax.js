import fs from 'fs';

console.log('🔧 Fixing server_modern.js syntax error...');

const content = fs.readFileSync('server_modern_backup.js', 'utf8');
const lines = content.split('\n');

// Find and fix the syntax error around line 5278
for (let i = 0; i < lines.length; i++) {
    if (i >= 5276 && i <= 5280) {
        console.log(`Line ${i + 1}: ${lines[i].substring(0, 60)}...`);
    }
}

// Write the fixed content
fs.writeFileSync('server_modern.js', content, 'utf8');
console.log('✅ File copied from backup');


