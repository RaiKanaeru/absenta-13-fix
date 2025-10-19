import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast({
          title: "Error",
          description: "File harus berformat .xlsx",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error", 
          description: "Ukuran file maksimal 5MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setValidationResult(null);
      setImportResult(null);
      setShowPreview(false);
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
    if (!selectedFile) return;

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
        toast({
          title: "Validasi Selesai",
          description: `Ditemukan ${result.valid} baris valid dan ${result.invalid} baris invalid`
        });
      } else {
        throw new Error(result.error || 'Gagal validasi file');
      }
    } catch (error) {
      console.error('Error validating file:', error);
      toast({
        title: "Error",
        description: "Gagal memvalidasi file",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const importFile = async () => {
    if (!selectedFile) return;

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
        toast({
          title: "Import Berhasil",
          description: `Berhasil memproses ${result.processed || result.inserted_or_updated || result.inserted} baris data`
        });
      } else {
        throw new Error(result.error || 'Gagal import file');
      }
    } catch (error) {
      console.error('Error importing file:', error);
      toast({
        title: "Error",
        description: "Gagal mengimpor file",
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
            <Label htmlFor="file">Pilih File (.xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx"
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
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{validationResult.total}</div>
                <div className="text-sm text-gray-600">Total Baris</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validationResult.valid}</div>
                <div className="text-sm text-gray-600">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{validationResult.invalid}</div>
                <div className="text-sm text-gray-600">Invalid</div>
              </div>
            </div>

            {validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Error yang ditemukan:</h4>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Baris</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{error.index}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {error.errors.map((err, i) => (
                                <Badge key={i} variant="destructive" className="mr-1">
                                  {err}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

