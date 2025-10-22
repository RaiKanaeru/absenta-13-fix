import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Search, Filter } from "lucide-react";

interface ExcelImportViewProps {
  entityType: 'mapel' | 'kelas' | 'guru' | 'siswa' | 'jadwal';
  entityName: string;
  onBack: () => void;
}

interface ValidationError {
  index: number;
  errors: string[];
}

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  errors: ValidationError[];
}

const ExcelImportView: React.FC<ExcelImportViewProps> = ({ entityType, entityName, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errorSearchTerm, setErrorSearchTerm] = useState('');
  const [selectedErrorType, setSelectedErrorType] = useState<string>('all');

  // Compute error summary by type
  const errorSummary = useMemo(() => {
    if (!validationResult || validationResult.errors.length === 0) return {};
    
    const summary: Record<string, number> = {};
    validationResult.errors.forEach(error => {
      error.errors.forEach(err => {
        summary[err] = (summary[err] || 0) + 1;
      });
    });
    return summary;
  }, [validationResult]);

  // Get unique error types for filter
  const errorTypes = useMemo(() => {
    return Object.keys(errorSummary).sort();
  }, [errorSummary]);

  // Filter errors based on search term and selected type
  const filteredErrors = useMemo(() => {
    if (!validationResult || validationResult.errors.length === 0) return [];
    
    let filtered = validationResult.errors;
    
    // Filter by error type
    if (selectedErrorType !== 'all') {
      filtered = filtered.filter(error => 
        error.errors.some(err => err === selectedErrorType)
      );
    }
    
    // Filter by search term
    if (errorSearchTerm.trim() !== '') {
      const searchLower = errorSearchTerm.toLowerCase();
      filtered = filtered.filter(error => 
        error.index.toString().includes(searchLower) ||
        error.errors.some(err => err.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [validationResult, selectedErrorType, errorSearchTerm]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Allowed MIME types for Excel and CSV files
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // alternate CSV MIME type
      ];
      
      // Get file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['xlsx', 'xls', 'csv'];
      
      // Validate file type by MIME type or extension
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        toast({
          title: "Format File Tidak Valid",
          description: "File harus berformat .xlsx, .xls, atau .csv. Format yang Anda upload tidak didukung.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ukuran File Terlalu Besar", 
          description: `Ukuran file maksimal 5MB. File Anda berukuran ${(file.size / 1024 / 1024).toFixed(2)}MB. Mohon perkecil ukuran file atau hapus baris yang tidak diperlukan.`,
          variant: "destructive"
        });
        return;
      }
      
      // File validation passed
      setSelectedFile(file);
      setValidationResult(null);
      setImportResult(null);
      setShowPreview(false);
      
      toast({
        title: "File Terpilih",
        description: `File "${file.name}" siap untuk divalidasi.`
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/templates/${entityType}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-${entityType}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Template berhasil diunduh"
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh template",
        variant: "destructive"
      });
    }
  };

  const validateFile = async () => {
    if (!selectedFile) {
      toast({
        title: "File Tidak Dipilih",
        description: "Silakan pilih file terlebih dahulu sebelum validasi.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/admin/import/${entityType}?dryRun=true`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setValidationResult(result);
        setShowPreview(true);
        
        if (result.invalid === 0) {
          toast({
            title: "✅ Validasi Berhasil",
            description: `Semua ${result.valid} baris data valid dan siap diimpor!`
          });
        } else {
          toast({
            title: "⚠️ Validasi Selesai dengan Peringatan",
            description: `Ditemukan ${result.valid} baris valid dan ${result.invalid} baris invalid. Mohon perbaiki baris yang error sebelum import.`,
            variant: "destructive"
          });
        }
      } else {
        const errorMessage = result.message || result.error || 'Gagal validasi file';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error validating file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal memvalidasi file';
      toast({
        title: "❌ Error Validasi",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const importFile = async () => {
    if (!selectedFile) {
      toast({
        title: "File Tidak Dipilih",
        description: "Silakan pilih file terlebih dahulu sebelum import.",
        variant: "destructive"
      });
      return;
    }
    
    // Prevent import if validation shows errors
    if (validationResult && validationResult.invalid > 0) {
      toast({
        title: "⚠️ Data Invalid Ditemukan",
        description: `Mohon perbaiki ${validationResult.invalid} baris yang error sebelum melanjutkan import.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/admin/import/${entityType}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResult(result);
        const processedCount = result.processed || result.inserted || result.valid || 0;
        const insertedCount = result.inserted || 0;
        const updatedCount = result.updated || 0;
        
        let description = `Berhasil memproses ${processedCount} baris data`;
        if (insertedCount > 0 || updatedCount > 0) {
          description += ` (${insertedCount} ditambahkan, ${updatedCount} diperbarui)`;
        }
        
        toast({
          title: "✅ Import Berhasil",
          description: description
        });
        
        // Clear file selection after successful import
        setSelectedFile(null);
        setValidationResult(null);
        setShowPreview(false);
        
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
      } else {
        const errorMessage = result.message || result.error || 'Gagal import file';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal mengimpor file';
      toast({
        title: "❌ Error Import",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getEntityInstructions = () => {
    const instructions = {
      mapel: {
        title: "Template Mata Pelajaran",
        description: "Format: kode_mapel, nama_mapel, deskripsi (opsional), status (aktif/tidak_aktif)",
        example: "BING-01, Bahasa Inggris, Mata pelajaran bahasa asing, aktif"
      },
      kelas: {
        title: "Template Kelas", 
        description: "Format: nama_kelas, tingkat (opsional), status (aktif/tidak_aktif)",
        example: "X IPA 1, X, aktif"
      },
      guru: {
        title: "Template Data Guru",
        description: "Format: nip, nama, mapel_id (opsional), username (opsional), password (opsional), no_telp (opsional), alamat (opsional), jenis_kelamin (L/P), status (aktif/tidak_aktif/pensiun)",
        example: "198001012005011001, Budi Santoso, 1, guru_matematika, Rahasia123, 081234567890, Jl. Mawar No. 1, L, aktif"
      },
      siswa: {
        title: "Template Data Siswa",
        description: "Format: nis, nama, kelas_id, username (opsional), password (opsional), jenis_kelamin (L/P), email (opsional), alamat (opsional), telepon_orangtua (opsional), telepon_siswa (opsional), status (aktif/tidak_aktif/lulus)",
        example: "25001, Ahmad Rizki, 1, siswa_ahmad, Rahasia123, L, ahmad@sch.id, Jl. Melati No. 1, 0811223344, 081234567890, aktif"
      },
      jadwal: {
        title: "Template Jadwal Pelajaran",
        description: "Format: kelas_id, mapel_id, guru_id, hari (Senin-Sabtu), jam_ke (angka), jam_mulai (HH:MM:SS), jam_selesai (HH:MM:SS), status (aktif/tidak_aktif)",
        example: "1, 1, 1, Senin, 1, 07:00:00, 07:45:00, aktif"
      }
    };
    return instructions[entityType];
  };

  const instructions = getEntityInstructions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import {entityName} via Excel</h2>
          <p className="text-gray-600">Upload file Excel untuk menambah data {entityName} secara massal</p>
        </div>
        <Button onClick={onBack} variant="outline">
          ← Kembali
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {instructions.title}
          </CardTitle>
          <CardDescription>{instructions.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Contoh format:</p>
            <code className="block p-2 bg-gray-100 rounded text-sm">{instructions.example}</code>
          </div>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Unduh Template
          </CardTitle>
          <CardDescription>Download template Excel yang sudah disesuaikan dengan format yang benar</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Unduh Template {entityName}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File Excel
          </CardTitle>
          <CardDescription>Pilih file Excel yang sudah diisi sesuai template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Pilih File (.xlsx, .xls, atau .csv)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet className="w-4 h-4" />
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex gap-2">
              <Button 
                onClick={validateFile} 
                disabled={isValidating}
                variant="outline"
                className="flex-1"
              >
                {isValidating ? "Memvalidasi..." : "Validasi File"}
              </Button>
              {validationResult && validationResult.valid > 0 && (
                <Button 
                  onClick={importFile} 
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Mengimpor..." : "Import Data"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Hasil Validasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">{validationResult.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total Baris</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{validationResult.valid}</div>
                <div className="text-sm text-gray-600 mt-1">Valid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{validationResult.invalid}</div>
                <div className="text-sm text-gray-600 mt-1">Invalid</div>
              </div>
            </div>

            {/* Success Message */}
            {validationResult.invalid === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Semua data valid! Anda dapat melanjutkan proses import dengan menekan tombol "Import Data".
                </AlertDescription>
              </Alert>
            )}

            {/* Error Summary & Filtering */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Ringkasan Error</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {errorTypes.map(errorType => (
                      <div key={errorType} className="text-sm">
                        <span className="font-medium text-yellow-900">{errorSummary[errorType]}x</span>
                        <span className="text-yellow-700 ml-1">{errorType}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Daftar Error Detail:</h4>
                  
                  {/* Filter Controls */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Cari baris atau error..."
                          value={errorSearchTerm}
                          onChange={(e) => setErrorSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <select
                        value={selectedErrorType}
                        onChange={(e) => setSelectedErrorType(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      >
                        <option value="all">Semua Error ({validationResult.errors.length})</option>
                        {errorTypes.map(errorType => (
                          <option key={errorType} value={errorType}>
                            {errorType} ({errorSummary[errorType]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Error Table */}
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {filteredErrors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada error yang cocok dengan filter</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Baris Excel</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredErrors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-bold text-center">{error.index}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {error.errors.map((err, i) => (
                                    <Badge key={i} variant="destructive" className="text-xs">
                                      {err}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <p className="text-sm text-gray-600">
                    Menampilkan {filteredErrors.length} dari {validationResult.errors.length} baris error
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Hasil Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Berhasil memproses {importResult.valid} baris data.
                {importResult.invalid > 0 && ` ${importResult.invalid} baris dilewati karena error.`}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      {(isValidating || isUploading) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isValidating ? "Memvalidasi file..." : "Mengimpor data..."}</span>
                <span>Mohon tunggu...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExcelImportView;

