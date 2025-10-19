const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyzeExcel() {
    try {
        console.log('🔍 Analyzing Excel files...\n');
        
        // Analyze matrix export
        console.log('📊 Analyzing test-matrix-export.xlsx...');
        const matrixWorkbook = new ExcelJS.Workbook();
        await matrixWorkbook.xlsx.readFile('test-matrix-export.xlsx');
        
        console.log('✅ Matrix file loaded successfully');
        console.log('📋 Worksheets:', matrixWorkbook.worksheets.map(ws => ws.name));
        
        const matrixWorksheet = matrixWorkbook.getWorksheet('Jadwal Matrix');
        if (matrixWorksheet) {
            console.log('📊 Matrix worksheet info:');
            console.log('  - Row count:', matrixWorksheet.rowCount);
            console.log('  - Column count:', matrixWorksheet.columnCount);
            console.log('  - Actual row count:', matrixWorksheet.actualRowCount);
            console.log('  - Actual column count:', matrixWorksheet.actualColumnCount);
            
            // Check first few rows
            console.log('\n📝 First 5 rows:');
            for (let i = 1; i <= Math.min(5, matrixWorksheet.actualRowCount); i++) {
                const row = matrixWorksheet.getRow(i);
                const values = [];
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    values.push(cell.value || '');
                });
                console.log(`  Row ${i}:`, values.slice(0, 10).join(' | '), values.length > 10 ? '...' : '');
            }
            
            // Check for any issues
            console.log('\n🔍 Checking for potential issues...');
            
            // Check if there are any merged cells
            const mergedCells = matrixWorksheet.model.merges || [];
            console.log('  - Merged cells:', mergedCells.length);
            
            // Check column definitions
            console.log('  - Column definitions:', matrixWorksheet.columns ? matrixWorksheet.columns.length : 'None');
            
            // Check for any undefined values
            let undefinedCount = 0;
            matrixWorksheet.eachRow((row, rowNumber) => {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    if (cell.value === undefined) {
                        undefinedCount++;
                    }
                });
            });
            console.log('  - Undefined cell values:', undefinedCount);
            
        } else {
            console.log('❌ Matrix worksheet not found');
        }
        
        // Analyze grid export
        console.log('\n📊 Analyzing test-grid-export.xlsx...');
        const gridWorkbook = new ExcelJS.Workbook();
        await gridWorkbook.xlsx.readFile('test-grid-export.xlsx');
        
        console.log('✅ Grid file loaded successfully');
        console.log('📋 Worksheets:', gridWorkbook.worksheets.map(ws => ws.name));
        
        const gridWorksheet = gridWorkbook.worksheets[0];
        if (gridWorksheet) {
            console.log('📊 Grid worksheet info:');
            console.log('  - Row count:', gridWorksheet.rowCount);
            console.log('  - Column count:', gridWorksheet.columnCount);
            console.log('  - Actual row count:', gridWorksheet.actualRowCount);
            console.log('  - Actual column count:', gridWorksheet.actualColumnCount);
        }
        
        // Test creating a simple Excel file
        console.log('\n🧪 Creating test Excel file...');
        const testWorkbook = new ExcelJS.Workbook();
        const testWorksheet = testWorkbook.addWorksheet('Test');
        
        testWorksheet.addRow(['Test', 'Data', '123']);
        testWorksheet.addRow(['A', 'B', 'C']);
        
        await testWorkbook.xlsx.writeFile('test-simple.xlsx');
        console.log('✅ Simple test file created successfully');
        
    } catch (error) {
        console.error('❌ Error analyzing Excel files:', error.message);
        console.error('Stack:', error.stack);
    }
}

analyzeExcel();
































