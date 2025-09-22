import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Download
} from 'lucide-react';

interface SimpleRestoreViewProps {
  onBack: () => void;
  onLogout: () => void;
}

const SimpleRestoreView: React.FC<SimpleRestoreViewProps> = ({ onBack, onLogout }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'uploading' | 'restoring' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.sql', '.zip'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('File harus berformat .sql atau .zip');
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError('Ukuran file maksimal 100MB');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setUploading(true);
    setRestoreStatus('uploading');
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('backupFile', selectedFile);

      const response = await fetch('http://localhost:3001/api/admin/restore-backup', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRestoreStatus('success');
        setMessage('Restorasi database berhasil! Data telah dipulihkan.');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setRestoreStatus('error');
        setError(result.error || 'Gagal melakukan restorasi database');
      }
    } catch (err) {
      console.error('Error during restore:', err);
      setRestoreStatus('error');
      setError('Terjadi kesalahan saat melakukan restorasi');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a simple SQL template file
    const templateContent = `-- Template SQL untuk Backup Database
-- File ini adalah contoh struktur backup database
-- Ganti dengan file backup yang sebenarnya

-- Contoh struktur tabel (jangan dijalankan langsung)
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL,
--     email VARCHAR(100) NOT NULL
-- );

-- Untuk backup lengkap, gunakan perintah:
-- mysqldump -u username -p database_name > backup.sql
`;

    const blob = new Blob([templateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_template.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setError('');
    setMessage('');
    setRestoreStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restorasi Backup Database</h1>
              <p className="text-gray-600">Upload file backup SQL atau ZIP untuk memulihkan database</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload File Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Pilih file backup (.sql atau .zip)'}
                </p>
                <p className="text-sm text-gray-500">
                  Maksimal 100MB • Format: .sql, .zip
                </p>
              </div>
              
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".sql,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mr-2"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Pilih File
                </Button>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="ghost"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mengupload file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Restore Database
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetForm}
                variant="outline"
                disabled={uploading}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Berhasil</AlertTitle>
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Petunjuk Penggunaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Format File yang Didukung:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• File SQL (.sql) - Backup database MySQL</li>
                  <li>• File ZIP (.zip) - Backup terkompresi</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Catatan Penting:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Backup akan mengganti data yang ada</li>
                  <li>• Pastikan file backup valid dan tidak rusak</li>
                  <li>• Proses restore tidak dapat dibatalkan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleRestoreView;

