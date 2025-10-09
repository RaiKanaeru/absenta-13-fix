import ExcelJS from 'exceljs';

/**
 * Build Excel workbook with styled header and data
 * @param {Object} options - Configuration options
 * @param {string} options.title - Main title
 * @param {string} options.subtitle - Subtitle
 * @param {string} options.reportPeriod - Report period string
 * @param {boolean} options.showLetterhead - Whether to show letterhead (deprecated, use letterhead.enabled)
 * @param {Object} options.letterhead - Letterhead configuration
 * @param {string} options.letterhead.logoLeftUrl - URL logo kiri
 * @param {string} options.letterhead.logoRightUrl - URL logo kanan
 * @param {Array} options.letterhead.lines - Array baris teks KOP
 * @param {string} options.letterhead.alignment - Perataan teks (left/center/right)
 * @param {boolean} options.letterhead.enabled - Status aktif KOP
 * @param {Array} options.columns - Column definitions
 * @param {Array} options.rows - Data rows
 * @returns {Promise<ExcelJS.Workbook>} - Excel workbook
 */
async function buildExcel(options) {
    const {
        title,
        subtitle,
        reportPeriod,
        showLetterhead = false,
        letterhead = {},
        columns = [],
        rows = []
    } = options;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan');

    // Set column widths
    columns.forEach((col, index) => {
        worksheet.getColumn(index + 1).width = col.width || 15;
    });

    let currentRow = 1;

    // Letterhead (if enabled)
    const shouldShowLetterhead = letterhead.enabled !== undefined ? letterhead.enabled : showLetterhead;
    if (shouldShowLetterhead && letterhead.lines && letterhead.lines.length > 0) {
        // Render dynamic letterhead
        const alignment = letterhead.alignment || 'center';
        
        // Add logo row if logos are provided
        if (letterhead.logoLeftUrl || letterhead.logoRightUrl) {
            const logoRow = worksheet.getRow(currentRow);
            
            // Logo kiri
            if (letterhead.logoLeftUrl) {
                logoRow.getCell(1).value = '[LOGO KIRI]';
                logoRow.getCell(1).font = { italic: true, size: 10 };
                logoRow.getCell(1).alignment = { horizontal: 'left' };
            }
            
            // Logo kanan
            if (letterhead.logoRightUrl) {
                const rightCell = Math.max(columns.length, 3);
                logoRow.getCell(rightCell).value = '[LOGO KANAN]';
                logoRow.getCell(rightCell).font = { italic: true, size: 10 };
                logoRow.getCell(rightCell).alignment = { horizontal: 'right' };
            }
            
            currentRow++;
        }

        // Add letterhead lines
        letterhead.lines.forEach((line, index) => {
            const lineRow = worksheet.getRow(currentRow);
            lineRow.getCell(1).value = line;
            
            // Style based on line position
            if (index === 0) {
                // First line (usually institution name) - bold and larger
                lineRow.getCell(1).font = { bold: true, size: 16 };
            } else {
                // Other lines - normal size
                lineRow.getCell(1).font = { size: 12 };
            }
            
            lineRow.getCell(1).alignment = { horizontal: alignment };
            worksheet.mergeCells(currentRow, 1, currentRow, Math.max(columns.length, 1));
            currentRow++;
        });

        // Separator
        currentRow++;
    } else if (showLetterhead) {
        // Fallback to old hardcoded letterhead for backward compatibility
        const schoolHeader = worksheet.getRow(currentRow);
        schoolHeader.getCell(1).value = 'SMK NEGERI 13 JAKARTA';
        schoolHeader.getCell(1).font = { bold: true, size: 16 };
        schoolHeader.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
        currentRow++;

        const addressHeader = worksheet.getRow(currentRow);
        addressHeader.getCell(1).value = 'Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910';
        addressHeader.getCell(1).font = { size: 12 };
        addressHeader.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
        currentRow++;

        // Separator
        currentRow++;
    }

    // Title
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    currentRow++;

    // Subtitle
    if (subtitle) {
        const subtitleRow = worksheet.getRow(currentRow);
        subtitleRow.getCell(1).value = subtitle;
        subtitleRow.getCell(1).font = { size: 12 };
        subtitleRow.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
        currentRow++;
    }

    // Report period
    if (reportPeriod) {
        const periodRow = worksheet.getRow(currentRow);
        periodRow.getCell(1).value = `Periode: ${reportPeriod}`;
        periodRow.getCell(1).font = { size: 11 };
        periodRow.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
        currentRow++;
    }

    // Separator
    currentRow++;

    // Column headers
    const headerRow = worksheet.getRow(currentRow);
    columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.label;
        cell.font = { bold: true, size: 11 };
        cell.alignment = { 
            horizontal: col.align || 'left',
            vertical: 'middle'
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });
    currentRow++;

    // Data rows
    rows.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(currentRow);
        columns.forEach((col, colIndex) => {
            const cell = dataRow.getCell(colIndex + 1);
            let value = row[col.key];

            // Format value based on column format
            if (col.format === 'number') {
                value = Number(value) || 0;
            } else if (col.format === 'percentage') {
                value = Number(value) || 0;
                cell.numFmt = '0.00%';
            } else if (col.format === 'date') {
                if (value) {
                    const date = new Date(value);
                    value = date.toLocaleDateString('id-ID');
                }
            }

            cell.value = value;
            cell.alignment = { 
                horizontal: col.align || 'left',
                vertical: 'middle'
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Alternate row colors
            if (rowIndex % 2 === 0) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8F9FA' }
                };
            }
        });
        currentRow++;
    });

    // Auto-fit columns
    columns.forEach((col, index) => {
        const column = worksheet.getColumn(index + 1);
        if (col.width) {
            column.width = col.width;
        } else {
            column.width = 15;
        }
    });

    return workbook;
}

export {
    buildExcel
};
