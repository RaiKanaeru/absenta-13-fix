import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build PDF document with styled header and data
 * @param {Object} options - Configuration options
 * @param {string} options.title - Main title
 * @param {string} options.subtitle - Subtitle
 * @param {string} options.reportPeriod - Report period string
 * @param {Object} options.letterhead - Letterhead configuration
 * @param {string} options.letterhead.logoLeftUrl - URL logo kiri (base64 or file path)
 * @param {string} options.letterhead.logoRightUrl - URL logo kanan (base64 or file path)
 * @param {Array} options.letterhead.lines - Array baris teks KOP
 * @param {string} options.letterhead.alignment - Perataan teks (left/center/right)
 * @param {boolean} options.letterhead.enabled - Status aktif KOP
 * @param {Array} options.columns - Column definitions
 * @param {Array} options.rows - Data rows
 * @param {string} options.orientation - Page orientation ('portrait' or 'landscape')
 * @returns {Promise<jsPDF>} - PDF document
 */
async function buildPDF(options) {
    const {
        title,
        subtitle,
        reportPeriod,
        letterhead = {},
        columns = [],
        rows = [],
        orientation = 'landscape'
    } = options;

    // Create new PDF document
    const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
    });

    let currentY = 10;

    // Letterhead (if enabled)
    const shouldShowLetterhead = letterhead.enabled !== undefined ? letterhead.enabled : false;
    
    if (shouldShowLetterhead) {
        const alignment = letterhead.alignment || 'center';
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Add logos if provided
        if (letterhead.logoLeftUrl || letterhead.logoRightUrl) {
            const logoSize = 25; // mm
            const logoY = currentY;
            
            // Logo kiri
            if (letterhead.logoLeftUrl) {
                try {
                    let imageData = letterhead.logoLeftUrl;
                    
                    // If not base64, try to read from file
                    if (!imageData.startsWith('data:image/')) {
                        try {
                            const logoPath = path.join(process.cwd(), 'public', letterhead.logoLeftUrl);
                            const buffer = await fs.readFile(logoPath);
                            const ext = path.extname(logoPath).toLowerCase();
                            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                            imageData = `data:${mimeType};base64,${buffer.toString('base64')}`;
                        } catch (err) {
                            console.warn('Failed to load left logo from file:', err.message);
                        }
                    }
                    
                    if (imageData.startsWith('data:image/')) {
                        doc.addImage(imageData, 'PNG', 15, logoY, logoSize, logoSize);
                    }
                } catch (error) {
                    console.warn('Failed to add left logo:', error.message);
                }
            }
            
            // Logo kanan
            if (letterhead.logoRightUrl) {
                try {
                    let imageData = letterhead.logoRightUrl;
                    
                    // If not base64, try to read from file
                    if (!imageData.startsWith('data:image/')) {
                        try {
                            const logoPath = path.join(process.cwd(), 'public', letterhead.logoRightUrl);
                            const buffer = await fs.readFile(logoPath);
                            const ext = path.extname(logoPath).toLowerCase();
                            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
                            imageData = `data:${mimeType};base64,${buffer.toString('base64')}`;
                        } catch (err) {
                            console.warn('Failed to load right logo from file:', err.message);
                        }
                    }
                    
                    if (imageData.startsWith('data:image/')) {
                        doc.addImage(imageData, 'PNG', pageWidth - 15 - logoSize, logoY, logoSize, logoSize);
                    }
                } catch (error) {
                    console.warn('Failed to add right logo:', error.message);
                }
            }
            
            currentY += logoSize + 5;
        }
        
        // Add letterhead text lines
        if (letterhead.lines && letterhead.lines.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            
            letterhead.lines.forEach((line, index) => {
                const fontSize = index === 0 ? 14 : index === 1 ? 12 : 10;
                const fontWeight = index < 2 ? 'bold' : 'normal';
                
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', fontWeight);
                
                let x;
                if (alignment === 'center') {
                    x = pageWidth / 2;
                    doc.text(line, x, currentY, { align: 'center' });
                } else if (alignment === 'right') {
                    x = pageWidth - 15;
                    doc.text(line, x, currentY, { align: 'right' });
                } else {
                    x = 15;
                    doc.text(line, x, currentY);
                }
                
                currentY += fontSize * 0.4;
            });
            
            currentY += 5;
        }
        
        // Add separator line
        doc.setLineWidth(0.5);
        doc.line(15, currentY, pageWidth - 15, currentY);
        currentY += 5;
    }
    
    // Title
    if (title) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 8;
    }
    
    // Subtitle
    if (subtitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 6;
    }
    
    // Report period
    if (reportPeriod) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Periode: ${reportPeriod}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
        currentY += 8;
    }
    
    // Prepare table columns
    const tableColumns = columns.map(col => ({
        header: col.label,
        dataKey: col.key
    }));
    
    // Prepare table data with formatting
    const tableData = rows.map(row => {
        const formattedRow = {};
        columns.forEach(col => {
            let value = row[col.key];
            
            // Format based on column format
            if (col.format === 'number') {
                value = Number(value) || 0;
            } else if (col.format === 'percentage') {
                value = Number(value) || 0;
                value = (value * 100).toFixed(2) + '%';
            } else if (col.format === 'date') {
                if (value) {
                    const date = new Date(value);
                    value = date.toLocaleDateString('id-ID');
                }
            }
            
            formattedRow[col.key] = value || '-';
        });
        return formattedRow;
    });
    
    // Add table
    doc.autoTable({
        startY: currentY,
        columns: tableColumns,
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [66, 139, 202], // Blue header
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 2
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: columns.reduce((acc, col, index) => {
            acc[col.key] = {
                halign: col.align || 'left',
                cellWidth: col.width ? col.width * 0.25 : 'auto' // Convert to mm (rough approximation)
            };
            return acc;
        }, {}),
        margin: { top: 10, left: 15, right: 15 },
        didDrawPage: (data) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            
            // Page number
            const pageText = `Halaman ${data.pageNumber} dari ${pageCount}`;
            doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Generated date
            const generatedDate = new Date().toLocaleString('id-ID');
            doc.text(`Dicetak: ${generatedDate}`, 15, pageHeight - 10);
        }
    });
    
    return doc;
}

export {
    buildPDF
};



