import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RotateCcw, Eye, Upload, Loader2, AlertTriangle } from "lucide-react";
import { REPORT_KEYS_OPTIONS } from "@/utils/reportKeys";
import imageCompression from 'browser-image-compression';
import { httpGet, httpPost, handleResponseError } from '@/utils/http';

interface LetterheadConfig {
  enabled: boolean;
  logo: string;
  logoLeftUrl: string;
  logoRightUrl: string;
  lines: string[];
  alignment: 'left' | 'center' | 'right';
}

type ScopeType = 'global' | 'report';

// Menggunakan REPORT_KEYS_OPTIONS dari utils

interface ReportLetterheadSettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

const DEFAULT_LETTERHEAD: LetterheadConfig = {
  enabled: true,
  logo: "",
  logoLeftUrl: "/uploads/letterheads/logo-jawa-barat.png",
  logoRightUrl: "/uploads/letterheads/logo-smk.png",
  lines: [
    "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
  ],
  alignment: "center"
};

export default function ReportLetterheadSettings({ onBack, onLogout }: ReportLetterheadSettingsProps) {
  const [config, setConfig] = useState<LetterheadConfig>(DEFAULT_LETTERHEAD);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [scope, setScope] = useState<ScopeType>('global');
  const [selectedReportKey, setSelectedReportKey] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoLeftFile, setLogoLeftFile] = useState<File | null>(null);
  const [logoLeftPreview, setLogoLeftPreview] = useState<string>("");
  const [logoRightFile, setLogoRightFile] = useState<File | null>(null);
  const [logoRightPreview, setLogoRightPreview] = useState<string>("");
  
  // File size tracking
  const [logoFileSize, setLogoFileSize] = useState<{original: number, compressed: number} | null>(null);
  const [logoLeftFileSize, setLogoLeftFileSize] = useState<{original: number, compressed: number} | null>(null);
  const [logoRightFileSize, setLogoRightFileSize] = useState<{original: number, compressed: number} | null>(null);
  
  // Processing states
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [isProcessingLogoLeft, setIsProcessingLogoLeft] = useState(false);
  const [isProcessingLogoRight, setIsProcessingLogoRight] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Reload config when scope or reportKey changes
  useEffect(() => {
    if (scope === 'report' && selectedReportKey) {
      loadConfig();
    } else if (scope === 'global') {
      loadConfig();
    }
  }, [scope, selectedReportKey]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const url = scope === 'global' 
        ? '/api/admin/letterhead'
        : `/api/admin/letterhead?reportKey=${selectedReportKey}`;
        
      const response = await httpGet(url);

      if (response.status === 403) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses konfigurasi kop laporan",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        await handleResponseError(response, 'Load letterhead config');
      }

      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
        if (data.data.logo) {
          setLogoPreview(data.data.logo);
        }
        if (data.data.logoLeftUrl) {
          setLogoLeftPreview(data.data.logoLeftUrl);
        }
        if (data.data.logoRightUrl) {
          setLogoRightPreview(data.data.logoRightUrl);
        }
      }
    } catch (error: any) {
      console.error('Error loading letterhead config:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memuat konfigurasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Handle logo upload if file is selected
      let logoDataUrl = config.logo;
      if (logoFile) {
        logoDataUrl = await convertFileToDataUrl(logoFile);
      }

      let logoLeftDataUrl = config.logoLeftUrl;
      if (logoLeftFile) {
        logoLeftDataUrl = await convertFileToDataUrl(logoLeftFile);
      }

      let logoRightDataUrl = config.logoRightUrl;
      if (logoRightFile) {
        logoRightDataUrl = await convertFileToDataUrl(logoRightFile);
      }

      const configToSave = {
        ...config,
        logo: logoDataUrl,
        logoLeftUrl: logoLeftDataUrl,
        logoRightUrl: logoRightDataUrl
      };

      const url = '/api/admin/letterhead';
        
      const response = await httpPost(url, {
        reportKey: scope === 'global' ? 'global' : selectedReportKey,
        config: configToSave
      });

      if (response.status === 403) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk menyimpan konfigurasi kop laporan",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        await handleResponseError(response, 'Save letterhead config');
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Konfigurasi kop laporan berhasil disimpan"
        });
        setConfig(configToSave);
        setLogoPreview(logoDataUrl);
        setLogoLeftPreview(logoLeftDataUrl);
        setLogoRightPreview(logoRightDataUrl);
      } else {
        // Handle different response types
        let errorMessage = 'Gagal menyimpan konfigurasi';
        
        if (response.status === 413) {
          errorMessage = 'File terlalu besar. Silakan gunakan file yang lebih kecil atau kompres gambar terlebih dahulu.';
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If response is not JSON (e.g., HTML error page)
            const responseText = await response.text();
            if (responseText.includes('413') || responseText.includes('Request Entity Too Large')) {
              errorMessage = 'File terlalu besar. Silakan gunakan file yang lebih kecil atau kompres gambar terlebih dahulu.';
            } else {
              errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving letterhead config:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_LETTERHEAD);
    setLogoFile(null);
    setLogoPreview("");
    setLogoLeftFile(null);
    setLogoLeftPreview("");
    setLogoRightFile(null);
    setLogoRightPreview("");
    
    // Reset file size tracking
    setLogoFileSize(null);
    setLogoLeftFileSize(null);
    setLogoRightFileSize(null);
    
    // Reset processing states
    setIsProcessingLogo(false);
    setIsProcessingLogoLeft(false);
    setIsProcessingLogoRight(false);
  };

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Kompres hingga maksimal 1MB
      maxWidthOrHeight: 1920, // Resize jika terlalu besar
      useWebWorker: true,
      fileType: file.type,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Gagal mengompres gambar');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFileSize = (file: File, maxSizeMB: number = 5): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file maksimal 5MB
    if (!validateFileSize(file, 5)) {
      toast({
        title: "Error",
        description: "Ukuran file logo maksimal 5MB",
        variant: "destructive"
      });
      return;
    }

    // Warning jika file > 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Peringatan",
        description: "File berukuran besar akan dikompres untuk mengurangi ukuran",
        variant: "default"
      });
    }

    try {
      setIsProcessingLogo(true);
      
      // Kompres gambar
      const compressedFile = await compressImage(file);
      
      // Set file dan preview
      setLogoFile(compressedFile);
      setLogoFileSize({
        original: file.size,
        compressed: compressedFile.size
      });
      
      const dataUrl = await convertFileToDataUrl(compressedFile);
      setLogoPreview(dataUrl);
      
      toast({
        title: "Berhasil",
        description: `Logo berhasil dikompres dari ${formatFileSize(file.size)} menjadi ${formatFileSize(compressedFile.size)}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing logo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses logo",
        variant: "destructive"
      });
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleLogoLeftChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file maksimal 5MB
    if (!validateFileSize(file, 5)) {
      toast({
        title: "Error",
        description: "Ukuran file logo kiri maksimal 5MB",
        variant: "destructive"
      });
      return;
    }

    // Warning jika file > 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Peringatan",
        description: "File berukuran besar akan dikompres untuk mengurangi ukuran",
        variant: "default"
      });
    }

    try {
      setIsProcessingLogoLeft(true);
      
      // Kompres gambar
      const compressedFile = await compressImage(file);
      
      // Set file dan preview
      setLogoLeftFile(compressedFile);
      setLogoLeftFileSize({
        original: file.size,
        compressed: compressedFile.size
      });
      
      const dataUrl = await convertFileToDataUrl(compressedFile);
      setLogoLeftPreview(dataUrl);
      
      toast({
        title: "Berhasil",
        description: `Logo kiri berhasil dikompres dari ${formatFileSize(file.size)} menjadi ${formatFileSize(compressedFile.size)}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing logo left:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses logo kiri",
        variant: "destructive"
      });
    } finally {
      setIsProcessingLogoLeft(false);
    }
  };

  const handleLogoRightChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi ukuran file maksimal 5MB
    if (!validateFileSize(file, 5)) {
      toast({
        title: "Error",
        description: "Ukuran file logo kanan maksimal 5MB",
        variant: "destructive"
      });
      return;
    }

    // Warning jika file > 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Peringatan",
        description: "File berukuran besar akan dikompres untuk mengurangi ukuran",
        variant: "default"
      });
    }

    try {
      setIsProcessingLogoRight(true);
      
      // Kompres gambar
      const compressedFile = await compressImage(file);
      
      // Set file dan preview
      setLogoRightFile(compressedFile);
      setLogoRightFileSize({
        original: file.size,
        compressed: compressedFile.size
      });
      
      const dataUrl = await convertFileToDataUrl(compressedFile);
      setLogoRightPreview(dataUrl);
      
      toast({
        title: "Berhasil",
        description: `Logo kanan berhasil dikompres dari ${formatFileSize(file.size)} menjadi ${formatFileSize(compressedFile.size)}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error processing logo right:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memproses logo kanan",
        variant: "destructive"
      });
    } finally {
      setIsProcessingLogoRight(false);
    }
  };

  const addLine = () => {
    setConfig(prev => ({
      ...prev,
      lines: [...prev.lines, ""]
    }));
  };

  const removeLine = (index: number) => {
    setConfig(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const updateLine = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => i === index ? value : line)
    }));
  };

  const renderPreview = () => {
    if (!config.enabled) return null;

    const alignment = config.alignment || 'center';
    
    // Logo tengah (jika ada)
    const logoElement = (config.logo || logoPreview) ? 
      <img src={config.logo || logoPreview} alt="Logo" className="h-16 object-contain mx-auto mb-2" /> : null;
    
    // Logo kiri dan kanan
    const logoKiriElement = (config.logoLeftUrl || logoLeftPreview) ? 
      <img src={config.logoLeftUrl || logoLeftPreview} alt="Logo Kiri" className="h-16 object-contain float-left mr-5" /> : null;
    
    const logoKananElement = (config.logoRightUrl || logoRightPreview) ? 
      <img src={config.logoRightUrl || logoRightPreview} alt="Logo Kanan" className="h-16 object-contain float-right ml-5" /> : null;

    return (
      <div className="border rounded-lg p-6 bg-white">
        <div className="overflow-hidden">
          {logoKiriElement}
          {logoKananElement}
          <div className={`space-y-1 clear-both ${alignment === 'left' ? 'text-left' : alignment === 'right' ? 'text-right' : 'text-center'}`}>
            {logoElement}
            {config.lines.map((line, index) => (
              <div key={index} className={index === 0 ? "font-bold text-lg" : "text-sm"}>
                {line || `Baris ${index + 1}`}
              </div>
            ))}
          </div>
        </div>
        <hr className="my-4" />
        <div className="text-center">
          <div className="font-bold text-lg">CONTOH JUDUL LAPORAN</div>
          <div className="text-sm text-gray-600">Periode: 01 Januari 2025 - 31 Januari 2025</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat konfigurasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Kop Laporan</h1>
                <p className="text-sm text-gray-600">Kelola header/kop untuk semua laporan sistem</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Konfigurasi Kop Laporan</CardTitle>
                <CardDescription>
                  Atur header/kop yang akan digunakan di semua laporan (cetak HTML dan ekspor Excel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scope Selection */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scope">Cakupan KOP</Label>
                    <p className="text-sm text-gray-600">Pilih apakah KOP berlaku global atau per jenis laporan</p>
                  </div>
                  <Select value={scope} onValueChange={(value: ScopeType) => setScope(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih cakupan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (Semua Laporan)</SelectItem>
                      <SelectItem value="report">Per Jenis Laporan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Report Key Selection */}
                {scope === 'report' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reportKey">Jenis Laporan</Label>
                      <p className="text-sm text-gray-600">Pilih jenis laporan yang akan dikonfigurasi</p>
                    </div>
                    <Select value={selectedReportKey} onValueChange={setSelectedReportKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis laporan" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_KEYS_OPTIONS.map((report) => (
                          <SelectItem key={report.value} value={report.value}>
                            {report.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Aktifkan Kop Laporan</Label>
                    <p className="text-sm text-gray-600">Tampilkan kop di semua laporan</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo Tengah (Opsional)</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="flex-1"
                        disabled={isProcessingLogo}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('logo')?.click()}
                        disabled={isProcessingLogo}
                      >
                        {isProcessingLogo ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {isProcessingLogo ? 'Memproses...' : 'Pilih File'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Format: JPG, PNG, GIF. Maksimal 5MB</p>
                    
                    {/* File size info */}
                    {logoFileSize && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Ukuran file: {formatFileSize(logoFileSize.original)} → {formatFileSize(logoFileSize.compressed)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoLeft">Logo Kiri (Opsional)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="logoLeft"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoLeftChange}
                          className="flex-1"
                          disabled={isProcessingLogoLeft}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById('logoLeft')?.click()}
                          disabled={isProcessingLogoLeft}
                        >
                          {isProcessingLogoLeft ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {logoLeftFileSize && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Ukuran: {formatFileSize(logoLeftFileSize.original)} → {formatFileSize(logoLeftFileSize.compressed)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoRight">Logo Kanan (Opsional)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="logoRight"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoRightChange}
                          className="flex-1"
                          disabled={isProcessingLogoRight}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById('logoRight')?.click()}
                          disabled={isProcessingLogoRight}
                        >
                          {isProcessingLogoRight ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {logoRightFileSize && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Ukuran: {formatFileSize(logoRightFileSize.original)} → {formatFileSize(logoRightFileSize.compressed)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Format: JPG, PNG, GIF. Maksimal 5MB per file</p>
                </div>

                {/* Alignment */}
                <div className="space-y-2">
                  <Label htmlFor="alignment">Posisi Teks</Label>
                  <Select
                    value={config.alignment}
                    onValueChange={(value: 'left' | 'center' | 'right') => 
                      setConfig(prev => ({ ...prev, alignment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Kiri</SelectItem>
                      <SelectItem value="center">Tengah</SelectItem>
                      <SelectItem value="right">Kanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Baris Teks</Label>
                    <Button variant="outline" size="sm" onClick={addLine}>
                      Tambah Baris
                    </Button>
                  </div>
                  
                  {config.lines.map((line, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={line}
                        onChange={(e) => updateLine(index, e.target.value)}
                        placeholder={`Baris ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLine(index)}
                        disabled={config.lines.length <= 1}
                      >
                        Hapus
                      </Button>
                    </div>
                  ))}
                  
                  <p className="text-xs text-gray-500">
                    Baris pertama biasanya nama instansi (akan ditampilkan tebal)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || isProcessingLogo || isProcessingLogoLeft || isProcessingLogoRight} 
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const reportKey = scope === 'global' ? 'global' : selectedReportKey;
                      window.open(`/api/admin/letterhead/preview?reportKey=${reportKey}`, '_blank');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview HTML
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Preview Kop Laporan</CardTitle>
                    <CardDescription>Pratinjau tampilan kop laporan</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {previewMode ? 'Sembunyikan' : 'Tampilkan'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  renderPreview()
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Klik "Tampilkan" untuk melihat preview
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Alert>
              <AlertDescription>
                <strong>Catatan:</strong> Kop laporan ini akan diterapkan ke semua laporan di sistem, 
                termasuk laporan cetak HTML dan ekspor Excel di halaman Admin dan Guru.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
