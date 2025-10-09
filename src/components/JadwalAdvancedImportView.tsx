import React, { useState, useRef } from 'react';
import { 
    Upload, 
    Download, 
    FileText, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';

interface ImportResult {
    success: boolean;
    dryRun?: boolean;
    summary?: {
        total: number;
        valid: number;
        invalid: number;
        inserted?: number;
        updated?: number;
        skipped?: number;
    };
    errors?: Array<{
        row: string;
        errors: string[];
        data?: {
            guruCode: string;
            mapelAlias: string;
            ruang: string;
        };
    }>;
    validEntries?: Array<{
        kelas_id: number;
        guru_id: number;
        mapel_id: number;
        hari: string;
        jam_ke: number;
        jam_mulai: string;
        jam_selesai: string;
        status: string;
    }>;
    recommendations?: string[];
    reportFile?: string;
}

interface JadwalAdvancedImportViewProps {
    onBack: () => void;
}

const JadwalAdvancedImportView: React.FC<JadwalAdvancedImportViewProps> = ({ onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDryRun, setIsDryRun] = useState(true);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [showValidEntries, setShowValidEntries] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel'
            ];
            
            if (!validTypes.includes(selectedFile.type)) {
                alert('Hanya file Excel (.xlsx, .xls) yang diperbolehkan');
                return;
            }
            
            // Validate file size (5MB limit)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert('File terlalu besar. Maksimal 5MB');
                return;
            }
            
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleDryRun = async () => {
        if (!file) return;
        
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/admin/import/jadwal-advanced?dryRun=true`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error during dry run:', error);
            alert('Gagal melakukan dry run');
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        
        if (!confirm('Apakah Anda yakin ingin mengimpor jadwal? Data yang sudah ada akan diupdate.')) {
            return;
        }
        
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/admin/import/jadwal-advanced', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const data = await response.json();
            setResult(data);
            setIsDryRun(false);
        } catch (error) {
            console.error('Error during import:', error);
            alert('Gagal mengimpor jadwal');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('/api/admin/templates/jadwal-advanced', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'template-jadwal-advanced.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Gagal mengunduh template');
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Gagal mengunduh template');
        }
    };

    const resetForm = () => {
        setFile(null);
        setResult(null);
        setShowErrors(false);
        setShowValidEntries(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Import Jadwal Advanced
                                </h1>
                                <p className="text-gray-600">
                                    Import jadwal dengan format matrix Excel (3 sheets)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Unduh Template</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Upload File Excel
                        </h2>
                        
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            {file ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <FileText className="w-8 h-8 text-green-600" />
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Ganti File
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                                    <div>
                                        <p className="text-lg font-medium text-gray-900">
                                            Pilih file Excel
                                        </p>
                                        <p className="text-gray-500">
                                            atau drag & drop file ke sini
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Pilih File
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {file && (
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="dryRun"
                                        checked={isDryRun}
                                        onChange={(e) => setIsDryRun(e.target.checked)}
                                        className="rounded"
                                    />
                                    <label htmlFor="dryRun" className="text-sm text-gray-700">
                                        Dry run (preview tanpa menyimpan ke database)
                                    </label>
                                </div>
                                
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleDryRun}
                                        disabled={isUploading}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isUploading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                        <span>Preview</span>
                                    </button>
                                    
                                    <button
                                        onClick={handleImport}
                                        disabled={isUploading || isDryRun}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isUploading ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        <span>Import</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Hasil Import
                        </h2>
                        
                        {!result ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Upload file untuk melihat hasil preview atau import</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-2">Ringkasan</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Total Entries:</span>
                                            <span className="ml-2 font-medium">{result.summary?.total || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Valid:</span>
                                            <span className="ml-2 font-medium text-green-600">
                                                {result.summary?.valid || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Invalid:</span>
                                            <span className="ml-2 font-medium text-red-600">
                                                {result.summary?.invalid || 0}
                                            </span>
                                        </div>
                                        {result.summary?.inserted !== undefined && (
                                            <div>
                                                <span className="text-gray-600">Inserted:</span>
                                                <span className="ml-2 font-medium text-blue-600">
                                                    {result.summary.inserted}
                                                </span>
                                            </div>
                                        )}
                                        {result.summary?.updated !== undefined && (
                                            <div>
                                                <span className="text-gray-600">Updated:</span>
                                                <span className="ml-2 font-medium text-orange-600">
                                                    {result.summary.updated}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center space-x-2">
                                    {result.success ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className={`font-medium ${
                                        result.success ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {result.dryRun ? 'Preview Berhasil' : 
                                         result.success ? 'Import Berhasil' : 'Import Gagal'}
                                    </span>
                                </div>

                                {/* Recommendations */}
                                {result.recommendations && result.recommendations.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">Rekomendasi:</h4>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            {result.recommendations.map((rec, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <span className="text-blue-600 mt-0.5">•</span>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Errors */}
                                {result.errors && result.errors.length > 0 && (
                                    <div>
                                        <button
                                            onClick={() => setShowErrors(!showErrors)}
                                            className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Lihat Error ({result.errors.length})</span>
                                            {showErrors ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        
                                        {showErrors && (
                                            <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                                                {result.errors.map((error, index) => (
                                                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                                                        <p className="font-medium text-red-900 text-sm">
                                                            {error.row}
                                                        </p>
                                                        <ul className="mt-1 text-xs text-red-700 space-y-1">
                                                            {error.errors.map((err, errIndex) => (
                                                                <li key={errIndex} className="flex items-start space-x-2">
                                                                    <span className="text-red-500 mt-0.5">•</span>
                                                                    <span>{err}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {error.data && (
                                                            <div className="mt-2 text-xs text-gray-600">
                                                                <p>Data: {error.data.guruCode} | {error.data.mapelAlias} | {error.data.ruang}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Valid Entries Preview */}
                                {result.validEntries && result.validEntries.length > 0 && (
                                    <div>
                                        <button
                                            onClick={() => setShowValidEntries(!showValidEntries)}
                                            className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Lihat Data Valid ({result.validEntries.length})</span>
                                            {showValidEntries ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        
                                        {showValidEntries && (
                                            <div className="mt-2 max-h-60 overflow-y-auto">
                                                <div className="bg-green-50 border border-green-200 rounded p-3">
                                                    <div className="text-xs text-green-800 space-y-1">
                                                        {result.validEntries.map((entry, index) => (
                                                            <div key={index} className="flex justify-between">
                                                                <span>{entry.kelas_id}</span>
                                                                <span>{entry.hari} Jam {entry.jam_ke}</span>
                                                                <span>G{entry.guru_id}</span>
                                                                <span>M{entry.mapel_id}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Petunjuk Penggunaan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Format File Excel:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Sheet 1: JADWAL (Matrix Grid)</li>
                                <li>• Sheet 2: MASTER GURU HARIAN (reserved)</li>
                                <li>• Sheet 3: JAM GURU (reserved)</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Struktur Sheet JADWAL:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Baris 1: Kode Guru (G1, G2, dst)</li>
                                <li>• Baris 2: Alias Mapel (MTK, BIO, dst)</li>
                                <li>• Baris 3: Ruang (opsional)</li>
                                <li>• Setiap 3 baris = 1 kelas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JadwalAdvancedImportView;