#!/usr/bin/env node

import fs from 'fs/promises';

async function cleanIzinManually() {
    console.log('🗑️  Manually removing izin endpoints...');
    
    try {
        const serverPath = 'server_modern.js';
        const content = await fs.readFile(serverPath, 'utf8');
        
        console.log(`📄 Original file size: ${content.length} characters`);
        
        // Split into lines for easier processing
        const lines = content.split('\n');
        const cleanedLines = [];
        let skipUntilNextSection = false;
        let inIzinSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Check if we're entering an izin section
            if (trimmedLine.includes('PENGAJUAN IZIN SISWA ENDPOINTS')) {
                inIzinSection = true;
                skipUntilNextSection = true;
                console.log(`🗑️  Found izin section at line ${i + 1}`);
                continue;
            }
            
            // Check if we're leaving the izin section
            if (skipUntilNextSection && trimmedLine.startsWith('// ================================================') && i > 0) {
                const prevLine = lines[i - 1].trim();
                if (prevLine.includes('});') || prevLine.includes('}')) {
                    skipUntilNextSection = false;
                    inIzinSection = false;
                    console.log(`✅ End of izin section at line ${i + 1}`);
                    continue;
                }
            }
            
            // Skip lines in izin section
            if (skipUntilNextSection) {
                continue;
            }
            
            // Skip individual izin endpoints
            if (line.includes('/api/siswa/') && line.includes('pengajuan-izin')) {
                console.log(`🗑️  Removing izin endpoint at line ${i + 1}: ${line.trim()}`);
                // Skip this entire endpoint block
                let braceCount = 0;
                let foundOpeningBrace = false;
                
                for (let j = i; j < lines.length; j++) {
                    const currentLine = lines[j];
                    
                    if (currentLine.includes('{')) {
                        foundOpeningBrace = true;
                        braceCount++;
                    }
                    if (currentLine.includes('}')) {
                        braceCount--;
                    }
                    
                    if (foundOpeningBrace && braceCount === 0) {
                        i = j; // Skip to the end of this block
                        break;
                    }
                }
                continue;
            }
            
            // Skip other izin-related endpoints
            if (line.includes('pengajuan-izin') || 
                line.includes('izin-kelas') ||
                line.includes('riwayat-izin')) {
                console.log(`🗑️  Removing izin endpoint at line ${i + 1}: ${line.trim()}`);
                // Skip this entire endpoint block
                let braceCount = 0;
                let foundOpeningBrace = false;
                
                for (let j = i; j < lines.length; j++) {
                    const currentLine = lines[j];
                    
                    if (currentLine.includes('{')) {
                        foundOpeningBrace = true;
                        braceCount++;
                    }
                    if (currentLine.includes('}')) {
                        braceCount--;
                    }
                    
                    if (foundOpeningBrace && braceCount === 0) {
                        i = j; // Skip to the end of this block
                        break;
                    }
                }
                continue;
            }
            
            // Keep the line
            cleanedLines.push(line);
        }
        
        const cleanedContent = cleanedLines.join('\n');
        
        console.log(`📄 Cleaned file size: ${cleanedContent.length} characters`);
        console.log(`🗑️  Removed: ${content.length - cleanedContent.length} characters`);
        
        // Write back the cleaned content
        await fs.writeFile(serverPath, cleanedContent, 'utf8');
        console.log('✅ Successfully cleaned izin endpoints');
        
        // Verify cleanup
        const remainingIzin = cleanedContent.match(/pengajuan-izin|izin-kelas|riwayat-izin/gi);
        if (remainingIzin) {
            console.log('⚠️  Warning: Some izin references may still remain:', remainingIzin);
        } else {
            console.log('✅ No izin endpoint references found');
        }
        
    } catch (error) {
        console.error('❌ Error cleaning izin endpoints:', error);
        throw error;
    }
}

// Run the cleanup
cleanIzinManually().catch(console.error);

