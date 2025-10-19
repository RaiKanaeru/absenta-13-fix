#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

async function removeIzinEndpoints() {
    console.log('🗑️  Removing all izin endpoints from server_modern.js...');
    
    try {
        // Read the server file
        const serverPath = path.join(process.cwd(), 'server_modern.js');
        const content = await fs.readFile(serverPath, 'utf8');
        
        console.log(`📄 File size before: ${content.length} characters`);
        
        // Remove all izin-related sections
        let cleanedContent = content;
        
        // Remove entire sections between comments
        const izinSections = [
            // PENGAJUAN IZIN SISWA ENDPOINTS section
            /\/\/ ================================================\s*\n\/\/ PENGAJUAN IZIN SISWA ENDPOINTS\s*\n\/\/ ================================================.*?(?=\/\/ ================================================|$)/gs,
            
            // Individual izin endpoints - fixed regex
            /\/\/ Get pengajuan izin by siswa ID[\s\S]*?});/g,
            /\/\/ Submit new pengajuan izin[\s\S]*?});/g,
            /\/\/ Get pengajuan izin for guru[\s\S]*?});/g,
            /\/\/ Approve or reject pengajuan izin[\s\S]*?});/g,
            /\/\/ Approve or reject pengajuan izin by ID[\s\S]*?});/g,
            /\/\/ Submit pengajuan izin kelas[\s\S]*?});/g,
            /\/\/ Get riwayat pengajuan izin for admin[\s\S]*?});/g,
            
            // Any remaining izin references
            /app\.(get|post|put|delete)\('\/api\/.*?izin.*?\)[\s\S]*?});/g,
            /app\.(get|post|put|delete)\('\/api\/.*?pengajuan.*?\)[\s\S]*?});/g,
        ];
        
        for (const pattern of izinSections) {
            const beforeLength = cleanedContent.length;
            cleanedContent = cleanedContent.replace(pattern, '');
            const removed = beforeLength - cleanedContent.length;
            if (removed > 0) {
                console.log(`🗑️  Removed ${removed} characters with pattern`);
            }
        }
        
        // Remove specific lines containing izin references
        const lines = cleanedContent.split('\n');
        const filteredLines = lines.filter(line => {
            const lowerLine = line.toLowerCase();
            return !(
                lowerLine.includes('pengajuan_izin') ||
                lowerLine.includes('pengajuan izin') ||
                lowerLine.includes('izin kelas') ||
                lowerLine.includes('izin-kelas') ||
                lowerLine.includes('leaveRequest') ||
                lowerLine.includes('leave request') ||
                lowerLine.includes('dispensasi') ||
                (lowerLine.includes('izin') && lowerLine.includes('api'))
            );
        });
        
        cleanedContent = filteredLines.join('\n');
        
        // Clean up multiple empty lines
        cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        console.log(`📄 File size after: ${cleanedContent.length} characters`);
        console.log(`🗑️  Removed: ${content.length - cleanedContent.length} characters`);
        
        // Write back the cleaned content
        await fs.writeFile(serverPath, cleanedContent, 'utf8');
        console.log('✅ Successfully removed all izin endpoints');
        
        // Verify no izin references remain
        const remainingIzin = cleanedContent.match(/izin|pengajuan|leave/i);
        if (remainingIzin) {
            console.log('⚠️  Warning: Some izin references may still remain:', remainingIzin);
        } else {
            console.log('✅ No izin references found in cleaned file');
        }
        
    } catch (error) {
        console.error('❌ Error removing izin endpoints:', error);
        throw error;
    }
}

// Run the cleanup
removeIzinEndpoints().catch(console.error);
