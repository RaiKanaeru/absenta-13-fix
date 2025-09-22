import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Eye, FileSpreadsheet, FileText } from 'lucide-react';

interface ExcelPreviewProps {
  title: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    format?: 'text' | 'number' | 'percentage' | 'date';
  }[];
  showPreview?: boolean;
  onExport?: () => void;
  onExportSMKN13?: () => void;
  className?: string;
  teacherName?: string;
  subjectName?: string;
  reportPeriod?: string;
  showLetterhead?: boolean;
}

const ExcelPreview: React.FC<ExcelPreviewProps> = ({
  title,
  data,
  columns,
  showPreview = true,
  onExport,
  onExportSMKN13,
  className = "",
  teacherName,
  subjectName,
  reportPeriod,
  showLetterhead = true
}) => {
  const formatCellValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '';
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('id-ID') : value;
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(2)}%` : value;
      case 'date':
        return value instanceof Date ? value.toLocaleDateString('id-ID') : value;
      default:
        return value;
    }
  };

  const getCellStyle = (format?: string, value?: any, columnKey?: string) => {
    const baseStyle = "px-2 py-1 text-xs border-r border-b border-gray-400";
    
    // Special styling for attendance columns
    if (columnKey === 'hadir' && value > 0) {
      return `${baseStyle} text-center font-semibold bg-emerald-50 text-emerald-700`;
    }
    if (columnKey === 'izin' && value > 0) {
      return `${baseStyle} text-center font-semibold bg-blue-50 text-blue-700`;
    }
    if (columnKey === 'sakit' && value > 0) {
      return `${baseStyle} text-center font-semibold bg-red-50 text-red-700`;
    }
    if (columnKey === 'alpa' && value > 0) {
      return `${baseStyle} text-center font-semibold bg-yellow-50 text-yellow-700`;
    }
    
    switch (format) {
      case 'number':
      case 'percentage':
        return `${baseStyle} text-right font-mono bg-white`;
      case 'date':
        return `${baseStyle} text-center bg-white`;
      default:
        return `${baseStyle} text-left bg-white`;
    }
  };

  const getHeaderStyle = (align?: string) => {
    const baseStyle = "px-2 py-1 text-xs font-semibold bg-gray-200 border-r border-b border-gray-500 text-gray-800";
    
    switch (align) {
      case 'center':
        return `${baseStyle} text-center`;
      case 'right':
        return `${baseStyle} text-right`;
      default:
        return `${baseStyle} text-left`;
    }
  };

  if (!showPreview || !data || data.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">
              {title} ({data.length} record)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            )}
            {onExportSMKN13 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportSMKN13}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export SMKN 13
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Teacher and Subject Information */}
        {(teacherName || subjectName || reportPeriod) && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {teacherName && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nama Guru:</span>
                  <span className="text-gray-600">{teacherName}</span>
                </div>
              )}
              {subjectName && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Mata Pelajaran:</span>
                  <span className="text-gray-600">{subjectName}</span>
                </div>
              )}
              {reportPeriod && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Periode:</span>
                  <span className="text-gray-600">{reportPeriod}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-auto border border-gray-400">
          <div className="min-w-full">
            {/* SMKN 13 Letterhead - only show if showLetterhead is true */}
            {showLetterhead && (
              <div className="text-center mb-6 p-4 bg-white border-2 border-gray-300">
                <div className="text-sm font-bold">
                  PEMERINTAH DAERAH PROVINSI JAWA BARAT<br />
                  DINAS PENDIDIKAN<br />
                  CABANG DINAS PENDIDIKAN WILAYAH VII<br />
                  SEKOLAH MENENGAH KEJURUAN NEGERI 13
                </div>
                <div className="text-xs mt-2">
                  Jalan Soekarno - Hatta Km.10 Telepon (022) 7318960: Ext. 114<br />
                  Telepon/Faksimil: (022) 7332252 – Bandung 40286<br />
                  Email: smk13bdg@gmail.com Home page: http://www.smkn13.sch.id
                </div>
                <div className="text-lg font-bold mt-4">
                  {title.toUpperCase()}
                </div>
              </div>
            )}
            
            {/* Excel-like Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-200 border-b border-gray-500">
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      className={getHeaderStyle(column.align)}
                      style={{ 
                        minWidth: column.width ? `${column.width}px` : '120px',
                        maxWidth: column.width ? `${column.width}px` : '200px'
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column.key}
                        className={getCellStyle(column.format, row[column.key], column.key)}
                        style={{ 
                          minWidth: column.width ? `${column.width}px` : '120px',
                          maxWidth: column.width ? `${column.width}px` : '200px'
                        }}
                      >
                        {formatCellValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Excel-like Footer Info */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>Total: {data.length} record</span>
            <span>Preview Excel Format</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelPreview;
