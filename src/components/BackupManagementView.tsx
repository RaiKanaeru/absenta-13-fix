/**
 * BACKUP MANAGEMENT VIEW
 * UI Component for managing backup and archive operations
 * Phase 2: Backup & Archive System
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, Download, Archive, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, Database, FileSpreadsheet, Settings, Play, Pause, RotateCcw, Info, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface BackupInfo {
    id: string;
    filename: string;
    size: number;
    created: string;
    modified: string;
    semester?: string;
    year?: number;
    type?: string;
    status?: string;
    backupType?: 'semester' | 'date';
}

interface BackupProgress {
    isRunning: boolean;
    progress: number;
    currentStep: string;
    estimatedTime: string;
}

interface ArchiveStats {
    studentRecords: number;
    teacherRecords: number;
    totalSize: number;
    lastArchive: string;
}

interface BackupSettings {
    autoBackupSchedule: string;
    maxBackups: number;
    archiveAge: number;
    compression: boolean;
    emailNotifications: boolean;
    lastBackupDate?: string;
    nextBackupDate?: string;
    customScheduleDate?: string;
    customScheduleTime?: string;
    customScheduleEnabled?: boolean;
}

interface CustomSchedule {
    id: string;
    name: string;
    date: string;
    time: string;
    enabled: boolean;
    created: string;
    lastRun?: string;
}

const BackupManagementView: React.FC = () => {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [backupProgress, setBackupProgress] = useState<BackupProgress>({
        isRunning: false,
        progress: 0,
        currentStep: '',
        estimatedTime: ''
    });
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [backupType, setBackupType] = useState<'semester' | 'date'>('semester');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedEndDate, setSelectedEndDate] = useState<string>('');
    const [archiveStats, setArchiveStats] = useState<ArchiveStats>({
        studentRecords: 0,
        teacherRecords: 0,
        totalSize: 0,
        lastArchive: ''
    });
    const [backupSettings, setBackupSettings] = useState<BackupSettings>({
        autoBackupSchedule: 'weekly',
        maxBackups: 10,
        archiveAge: 24,
        compression: true,
        emailNotifications: false,
        customScheduleDate: '',
        customScheduleTime: '02:00',
        customScheduleEnabled: false
    });
    const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([]);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [newSchedule, setNewSchedule] = useState<Partial<CustomSchedule>>({
        name: '',
        date: '',
        time: '02:00',
        enabled: true
    });
    const [archiveLoading, setArchiveLoading] = useState(false);
    const { toast } = useToast();

    // Load backups on component mount
    useEffect(() => {
        loadBackups();
        loadArchiveStats();
        loadBackupSettings();
        loadCustomSchedules();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-refresh custom schedules every minute to update countdown
    useEffect(() => {
        const interval = setInterval(() => {
            loadCustomSchedules();
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, []);

    const loadBackups = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/admin/backups', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setBackups(data.backups || []);
            } else {
                throw new Error('Failed to load backups');
            }
        } catch (error) {
            console.error('Error loading backups:', error);
            toast({
                title: "Error",
                description: "Gagal memuat daftar backup",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const loadArchiveStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/archive-stats', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setArchiveStats(data.stats || {
                    studentRecords: 0,
                    teacherRecords: 0,
                    totalSize: 0,
                    lastArchive: ''
                });
            }
        } catch (error) {
            console.error('Error loading archive stats:', error);
        }
    };

    const loadBackupSettings = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/backup-settings', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setBackupSettings(data.settings || backupSettings);
            }
        } catch (error) {
            console.error('Error loading backup settings:', error);
        }
    };

    const loadCustomSchedules = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/custom-schedules', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCustomSchedules(data.schedules || []);
            }
        } catch (error) {
            console.error('Error loading custom schedules:', error);
        }
    };

    const createCustomSchedule = async () => {
        if (!newSchedule.name || !newSchedule.date || !newSchedule.time) {
            toast({
                title: "Error",
                description: "Isi semua field yang diperlukan",
                variant: "destructive"
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/admin/custom-schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(newSchedule)
            });

            if (response.ok) {
                setShowScheduleDialog(false);
                setNewSchedule({
                    name: '',
                    date: '',
                    time: '02:00',
                    enabled: true
                });
                loadCustomSchedules();
                toast({
                    title: "Berhasil",
                    description: "Jadwal backup custom berhasil dibuat",
                });
            } else {
                throw new Error('Failed to create custom schedule');
            }
        } catch (error) {
            console.error('Error creating custom schedule:', error);
            toast({
                title: "Error",
                description: "Gagal membuat jadwal backup custom",
                variant: "destructive"
            });
        }
    };

    const deleteCustomSchedule = async (scheduleId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal backup ini?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/admin/custom-schedules/${scheduleId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                loadCustomSchedules();
                toast({
                    title: "Berhasil",
                    description: "Jadwal backup berhasil dihapus",
                });
            } else {
                throw new Error('Failed to delete custom schedule');
            }
        } catch (error) {
            console.error('Error deleting custom schedule:', error);
            toast({
                title: "Error",
                description: "Gagal menghapus jadwal backup",
                variant: "destructive"
            });
        }
    };

    const toggleCustomSchedule = async (scheduleId: string, enabled: boolean) => {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/custom-schedules/${scheduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ enabled })
            });

            if (response.ok) {
                loadCustomSchedules();
                toast({
                    title: "Berhasil",
                    description: `Jadwal backup ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
                });
            } else {
                throw new Error('Failed to toggle custom schedule');
            }
        } catch (error) {
            console.error('Error toggling custom schedule:', error);
            toast({
                title: "Error",
                description: "Gagal mengubah status jadwal backup",
                variant: "destructive"
            });
        }
    };

    const runCustomSchedule = async (scheduleId: string) => {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/run-custom-schedule/${scheduleId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                loadCustomSchedules();
                loadBackups();
                toast({
                    title: "Berhasil",
                    description: "Jadwal backup berhasil dijalankan",
                });
            } else {
                throw new Error('Failed to run custom schedule');
            }
        } catch (error) {
            console.error('Error running custom schedule:', error);
            toast({
                title: "Error",
                description: "Gagal menjalankan jadwal backup",
                variant: "destructive"
            });
        }
    };

    const createBackup = async () => {
        // Validasi berdasarkan tipe backup
        if (backupType === 'semester' && !selectedSemester) {
            toast({
                title: "Error",
                description: "Pilih semester terlebih dahulu",
                variant: "destructive"
            });
            return;
        }

        if (backupType === 'date' && !selectedDate) {
            toast({
                title: "Error",
                description: "Pilih tanggal mulai backup terlebih dahulu",
                variant: "destructive"
            });
            return;
        }

        try {
            setBackupProgress({
                isRunning: true,
                progress: 0,
                currentStep: 'Menginisialisasi backup...',
                estimatedTime: '5-10 menit'
            });

            // Tentukan endpoint dan payload berdasarkan tipe backup
            const endpoint = backupType === 'semester' 
                ? 'http://localhost:3001/api/admin/create-semester-backup'
                : 'http://localhost:3001/api/admin/create-date-backup';

            const payload = backupType === 'semester' 
                ? {
                    semester: selectedSemester,
                    year: selectedYear
                }
                : {
                    startDate: selectedDate,
                    endDate: selectedEndDate || selectedDate
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to create backup');
            }

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setBackupProgress(prev => {
                    if (prev.progress >= 90) {
                        clearInterval(progressInterval);
                        return {
                            ...prev,
                            progress: 100,
                            currentStep: 'Backup selesai!',
                            estimatedTime: '0 menit'
                        };
                    }
                    return {
                        ...prev,
                        progress: prev.progress + 10,
                        currentStep: getProgressStep(prev.progress + 10)
                    };
                });
            }, 2000);

            const result = await response.json();
            
            setTimeout(() => {
                setBackupProgress({
                    isRunning: false,
                    progress: 0,
                    currentStep: '',
                    estimatedTime: ''
                });
                setShowCreateDialog(false);
                loadBackups();
                toast({
                    title: "Berhasil",
                    description: `Backup berhasil dibuat: ${result.data?.backupId || 'Backup'}`,
                });
            }, 10000);

        } catch (error) {
            console.error('Error creating backup:', error);
            setBackupProgress({
                isRunning: false,
                progress: 0,
                currentStep: '',
                estimatedTime: ''
            });
            toast({
                title: "Error",
                description: "Gagal membuat backup",
                variant: "destructive"
            });
        }
    };

    const getProgressStep = (progress: number): string => {
        if (progress < 20) return 'Membuat backup database...';
        if (progress < 40) return 'Mengekspor data absensi siswa...';
        if (progress < 60) return 'Mengekspor data absensi guru...';
        if (progress < 80) return 'Membuat laporan Excel...';
        if (progress < 90) return 'Mengarsipkan data lama...';
        return 'Menyelesaikan backup...';
    };

    const downloadBackup = async (backupId: string) => {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/download-backup/${backupId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${backupId}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast({
                    title: "Berhasil",
                    description: "Backup berhasil diunduh",
                });
            } else {
                throw new Error('Failed to download backup');
            }
        } catch (error) {
            console.error('Error downloading backup:', error);
            toast({
                title: "Error",
                description: "Gagal mengunduh backup",
                variant: "destructive"
            });
        }
    };

    const deleteBackup = async (backupId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus backup ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/admin/delete-backup/${backupId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                loadBackups();
                toast({
                    title: "Berhasil",
                    description: "Backup berhasil dihapus",
                });
            } else {
                throw new Error('Failed to delete backup');
            }
        } catch (error) {
            console.error('Error deleting backup:', error);
            toast({
                title: "Error",
                description: "Gagal menghapus backup",
                variant: "destructive"
            });
        }
    };

    const restoreBackup = async (backupId: string) => {
        if (!confirm('Apakah Anda yakin ingin memulihkan backup ini? Ini akan menimpa data saat ini.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/admin/restore-backup/${backupId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                toast({
                    title: "Berhasil",
                    description: "Backup berhasil dipulihkan",
                });
            } else {
                throw new Error('Failed to restore backup');
            }
        } catch (error) {
            console.error('Error restoring backup:', error);
            toast({
                title: "Error",
                description: "Gagal memulihkan backup",
                variant: "destructive"
            });
        }
    };

    const archiveOldData = async () => {
        try {
            setArchiveLoading(true);
            const response = await fetch('http://localhost:3001/api/admin/archive-old-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    monthsOld: backupSettings.archiveAge
                })
            });

            if (response.ok) {
                loadArchiveStats();
                toast({
                    title: "Berhasil",
                    description: "Data lama berhasil diarsipkan",
                });
            } else {
                throw new Error('Failed to archive old data');
            }
        } catch (error) {
            console.error('Error archiving old data:', error);
            toast({
                title: "Error",
                description: "Gagal mengarsipkan data lama",
                variant: "destructive"
            });
        } finally {
            setArchiveLoading(false);
        }
    };

    const createTestArchiveData = async () => {
        try {
            setArchiveLoading(true);
            const response = await fetch('http://localhost:3001/api/admin/create-test-archive-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                loadArchiveStats();
                toast({
                    title: "Berhasil",
                    description: `Data test berhasil dibuat: ${data.data.studentRecordsCreated} siswa, ${data.data.teacherRecordsCreated} guru`,
                });
            } else {
                throw new Error('Failed to create test archive data');
            }
        } catch (error) {
            console.error('Error creating test archive data:', error);
            toast({
                title: "Error",
                description: "Gagal membuat data test",
                variant: "destructive",
            });
        } finally {
            setArchiveLoading(false);
        }
    };

    const saveBackupSettings = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/backup-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(backupSettings)
            });

            if (response.ok) {
                toast({
                    title: "Berhasil",
                    description: "Pengaturan backup berhasil disimpan",
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving backup settings:', error);
            toast({
                title: "Error",
                description: "Gagal menyimpan pengaturan backup",
                variant: "destructive"
            });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Backup & Archive Management</h2>
                    <p className="text-muted-foreground">
                        Kelola backup database dan operasi arsip
                    </p>
                    {customSchedules.filter(s => s.enabled && !s.lastRun).length > 0 && (
                        <div className="mt-2 text-sm text-blue-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {customSchedules.filter(s => s.enabled && !s.lastRun).length} jadwal backup aktif menunggu waktu
                        </div>
                    )}
                    {customSchedules.filter(s => s.lastRun).length > 0 && (
                        <div className="mt-1 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            {customSchedules.filter(s => s.lastRun).length} jadwal backup sudah dijalankan
                        </div>
                    )}
                    {customSchedules.length === 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Belum ada jadwal backup custom yang dikonfigurasi
                        </div>
                    )}
                    {customSchedules.filter(s => s.enabled && !s.lastRun).length > 0 && (
                        <div className="mt-1 text-sm text-orange-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Jadwal berikutnya: {(() => {
                                const nextSchedule = customSchedules
                                    .filter(s => s.enabled && !s.lastRun)
                                    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];
                                if (nextSchedule) {
                                    return new Date(`${nextSchedule.date}T${nextSchedule.time}`).toLocaleDateString('id-ID', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                }
                                return '';
                            })()}
                        </div>
                    )}
                    {customSchedules.filter(s => s.enabled && !s.lastRun).length > 0 && (
                        <div className="mt-1 text-sm text-blue-600">
                            <Info className="w-4 h-4 inline mr-1" />
                            Server akan otomatis menjalankan backup pada waktu yang dijadwalkan
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadBackups} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Database className="h-4 w-4 mr-2" />
                                Buat Backup
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Buat Backup</DialogTitle>
                                <DialogDescription>
                                    Pilih tipe backup yang ingin dibuat
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {/* Tipe Backup */}
                                <div className="space-y-2">
                                    <Label>Tipe Backup</Label>
                                    <Select value={backupType} onValueChange={(value: 'semester' | 'date') => setBackupType(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="semester">Backup Semester</SelectItem>
                                            <SelectItem value="date">Backup Berdasarkan Tanggal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Form Semester Backup */}
                                {backupType === 'semester' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Semester</Label>
                                            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih semester" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Ganjil">Ganjil</SelectItem>
                                                    <SelectItem value="Genap">Genap</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tahun</Label>
                                            <Input 
                                                type="number" 
                                                value={selectedYear} 
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                min="2020"
                                                max="2030"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Form Date Backup */}
                                {backupType === 'date' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Tanggal Mulai</Label>
                                            <Input 
                                                type="date" 
                                                value={selectedDate} 
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tanggal Selesai (Opsional)</Label>
                                            <Input 
                                                type="date" 
                                                value={selectedEndDate} 
                                                onChange={(e) => setSelectedEndDate(e.target.value)}
                                                min={selectedDate}
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Kosongkan untuk backup satu hari saja
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Button 
                                    onClick={createBackup} 
                                    className="w-full" 
                                    disabled={
                                        (backupType === 'semester' && !selectedSemester) ||
                                        (backupType === 'date' && !selectedDate)
                                    }
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Buat Backup
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Backup Progress */}
            {backupProgress.isRunning && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Backup Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{backupProgress.currentStep}</span>
                                    <span>{backupProgress.progress}%</span>
                                </div>
                                <Progress value={backupProgress.progress} className="w-full" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Estimasi waktu: {backupProgress.estimatedTime}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="backups" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="backups">Backups</TabsTrigger>
                    <TabsTrigger value="archive">Archive</TabsTrigger>
                    <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                </TabsList>

                <TabsContent value="backups" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Backup Tersedia</CardTitle>
                            <CardDescription>
                                Kelola backup database dan titik pemulihan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                    Memuat backup...
                                </div>
                            ) : backups.length === 0 ? (
                                <div className="text-center py-8">
                                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Belum ada backup</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Buat backup pertama untuk melindungi data Anda
                                    </p>
                                    <Button onClick={() => setShowCreateDialog(true)}>
                                        <Database className="h-4 w-4 mr-2" />
                                        Buat Backup Pertama
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama File</TableHead>
                                            <TableHead>Ukuran</TableHead>
                                            <TableHead>Dibuat</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>Info</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backups.map((backup) => (
                                            <TableRow key={backup.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileSpreadsheet className="h-4 w-4" />
                                                        {backup.filename}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatFileSize(backup.size)}</TableCell>
                                                <TableCell>{formatDate(backup.created)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={backup.backupType === 'semester' ? 'default' : 'secondary'}>
                                                        {backup.backupType === 'semester' ? 'Semester' : 'Tanggal'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {backup.backupType === 'semester' ? (
                                                        <Badge variant="outline">
                                                            {backup.semester} {backup.year}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            Date Range
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {backup.status || 'Siap'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => downloadBackup(backup.id)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => restoreBackup(backup.id)}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => deleteBackup(backup.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="archive" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Archive Management</CardTitle>
                            <CardDescription>
                                Kelola data arsip dan pembersihan record lama
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Sistem arsip secara otomatis memindahkan data lama ke tabel arsip untuk meningkatkan performa.
                                    Data yang lebih tua dari {backupSettings.archiveAge} bulan akan diarsipkan secara otomatis.
                                </AlertDescription>
                            </Alert>
                            
                            {archiveStats.studentRecords === 0 && archiveStats.teacherRecords === 0 && (
                                <Alert variant="default">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Info:</strong> Tidak ada data yang perlu diarsipkan saat ini. 
                                        Data akan diarsipkan secara otomatis ketika berusia lebih dari {backupSettings.archiveAge} bulan.
                                        <br />
                                        <span className="text-sm text-muted-foreground">
                                            Data saat ini masih baru dan belum memenuhi kriteria arsip.
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Archive className="h-5 w-5" />
                                            Arsip Siswa
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">{archiveStats.studentRecords.toLocaleString()}</div>
                                        <p className="text-sm text-muted-foreground">
                                            Record siswa yang diarsipkan
                                        </p>
                                        {archiveStats.studentRecords === 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Belum ada data siswa yang diarsipkan
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Archive className="h-5 w-5" />
                                            Arsip Guru
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{archiveStats.teacherRecords.toLocaleString()}</div>
                                        <p className="text-sm text-muted-foreground">
                                            Record guru yang diarsipkan
                                        </p>
                                        {archiveStats.teacherRecords === 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Belum ada data guru yang diarsipkan
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            
                            {archiveStats.totalSize > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informasi Arsip</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Ukuran Arsip</p>
                                                <p className="text-lg font-semibold">{formatFileSize(archiveStats.totalSize)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Arsip Terakhir</p>
                                                <p className="text-lg font-semibold">
                                                    {archiveStats.lastArchive ? formatDate(archiveStats.lastArchive) : 'Belum ada'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Kriteria Arsip</p>
                                                <p className="text-lg font-semibold">{backupSettings.archiveAge} bulan</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex gap-2 flex-wrap">
                                <Button 
                                    onClick={archiveOldData} 
                                    disabled={archiveLoading}
                                    variant="outline"
                                    className="flex-1 min-w-[200px]"
                                >
                                    {archiveLoading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Archive className="h-4 w-4 mr-2" />
                                    )}
                                    Arsipkan Data Lama ({backupSettings.archiveAge} bulan)
                                </Button>
                                <Button onClick={loadArchiveStats} variant="outline" className="flex-1 min-w-[150px]">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Stats
                                </Button>
                                <Button 
                                    onClick={createTestArchiveData} 
                                    disabled={archiveLoading}
                                    variant="secondary"
                                    className="flex-1 min-w-[180px]"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Buat Data Test (25 bulan)
                                </Button>
                            </div>
                            
                            <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                                <p><strong>Catatan:</strong></p>
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li>Data yang berusia lebih dari {backupSettings.archiveAge} bulan akan dipindahkan ke tabel arsip</li>
                                    <li>Proses arsip akan memindahkan data dari tabel utama ke tabel arsip</li>
                                    <li>Data yang diarsipkan tetap dapat diakses melalui sistem backup</li>
                                    <li>Arsip otomatis berjalan setiap hari pada jam 02:00 WIB</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Tabs defaultValue="general" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="general">Pengaturan Umum</TabsTrigger>
                            <TabsTrigger value="schedule">Jadwal Backup</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pengaturan Backup</CardTitle>
                                    <CardDescription>
                                        Konfigurasi pengaturan backup dan arsip
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Jadwal Auto Backup</Label>
                                            <Select 
                                                value={backupSettings.autoBackupSchedule} 
                                                onValueChange={(value) => setBackupSettings(prev => ({ ...prev, autoBackupSchedule: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Harian</SelectItem>
                                                    <SelectItem value="weekly">Mingguan</SelectItem>
                                                    <SelectItem value="monthly">Bulanan</SelectItem>
                                                    <SelectItem value="disabled">Nonaktif</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                
                                <div className="space-y-2">
                                    <Label>Max Backup yang Disimpan</Label>
                                    <Input 
                                        type="number" 
                                        value={backupSettings.maxBackups} 
                                        onChange={(e) => setBackupSettings(prev => ({ ...prev, maxBackups: parseInt(e.target.value) }))}
                                        min="1" 
                                        max="50" 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Usia Arsip (bulan)</Label>
                                    <Input 
                                        type="number" 
                                        value={backupSettings.archiveAge} 
                                        onChange={(e) => setBackupSettings(prev => ({ ...prev, archiveAge: parseInt(e.target.value) }))}
                                        min="6" 
                                        max="60" 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Kompresi</Label>
                                    <Select 
                                        value={backupSettings.compression ? 'enabled' : 'disabled'} 
                                        onValueChange={(value) => setBackupSettings(prev => ({ ...prev, compression: value === 'enabled' }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="enabled">Aktif</SelectItem>
                                            <SelectItem value="disabled">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Custom Schedule Section */}
                            <Card className="border-orange-200 bg-orange-50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                                        <Clock className="h-5 w-5" />
                                        Jadwal Backup Kustom
                                    </CardTitle>
                                    <CardDescription className="text-orange-700">
                                        Atur jadwal backup khusus dengan tanggal dan waktu tertentu
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tanggal Backup</Label>
                                            <Input 
                                                type="date" 
                                                value={backupSettings.customScheduleDate || ''} 
                                                onChange={(e) => setBackupSettings(prev => ({ ...prev, customScheduleDate: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Waktu Backup</Label>
                                            <Input 
                                                type="time" 
                                                value={backupSettings.customScheduleTime || '02:00'} 
                                                onChange={(e) => setBackupSettings(prev => ({ ...prev, customScheduleTime: e.target.value }))}
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>Aktifkan Jadwal Kustom</Label>
                                            <Select 
                                                value={backupSettings.customScheduleEnabled ? 'enabled' : 'disabled'} 
                                                onValueChange={(value) => setBackupSettings(prev => ({ ...prev, customScheduleEnabled: value === 'enabled' }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="enabled">Aktif</SelectItem>
                                                    <SelectItem value="disabled">Nonaktif</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    {backupSettings.customScheduleEnabled && backupSettings.customScheduleDate && (
                                        <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                                <span className="font-medium text-orange-800">Jadwal Kustom Aktif</span>
                                            </div>
                                            <p className="text-sm text-orange-700">
                                                Backup akan dijalankan pada: <strong>
                                                {new Date(`${backupSettings.customScheduleDate}T${backupSettings.customScheduleTime}`).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                                </strong>
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            
                            {/* Informasi Tanggal Backup */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Informasi Tanggal Backup
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-blue-800">Backup Terakhir</Label>
                                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                                            <p className="text-sm text-gray-600">
                                                {backupSettings.lastBackupDate 
                                                    ? new Date(backupSettings.lastBackupDate).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'Belum ada backup'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-blue-800">Backup Berikutnya</Label>
                                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                                            <p className="text-sm text-gray-600">
                                                {backupSettings.nextBackupDate 
                                                    ? new Date(backupSettings.nextBackupDate).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : 'Tidak terjadwal'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Informasi Tambahan */}
                                <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Status Backup</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Total Backup:</span>
                                            <span className="font-medium text-blue-900">{backups.length} file</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Jadwal:</span>
                                            <span className="font-medium text-blue-900">
                                                {backupSettings.autoBackupSchedule === 'daily' ? 'Harian' :
                                                 backupSettings.autoBackupSchedule === 'weekly' ? 'Mingguan' :
                                                 backupSettings.autoBackupSchedule === 'monthly' ? 'Bulanan' : 'Nonaktif'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Usia Arsip:</span>
                                            <span className="font-medium text-blue-900">{backupSettings.archiveAge} bulan</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <Button onClick={saveBackupSettings} className="w-full">
                                <Settings className="h-4 w-4 mr-2" />
                                Simpan Pengaturan
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jadwal Backup Custom</CardTitle>
                            <CardDescription>
                                Kelola jadwal backup berdasarkan tanggal dan waktu spesifik
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold">Jadwal Backup yang Dikonfigurasi</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Buat jadwal backup untuk tanggal dan waktu tertentu
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={loadCustomSchedules} variant="outline" size="sm">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>
                                    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Tambah Jadwal
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Tambah Jadwal Backup</DialogTitle>
                                            <DialogDescription>
                                                Buat jadwal backup untuk tanggal dan waktu tertentu
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Nama Jadwal</Label>
                                                <Input 
                                                    placeholder="Contoh: Backup Akhir Semester"
                                                    value={newSchedule.name || ''}
                                                    onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tanggal Backup</Label>
                                                <Input 
                                                    type="date" 
                                                    value={newSchedule.date || ''}
                                                    onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Waktu Backup</Label>
                                                <Input 
                                                    type="time" 
                                                    value={newSchedule.time || '02:00'}
                                                    onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="enabled"
                                                    checked={newSchedule.enabled || false}
                                                    onChange={(e) => setNewSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                                                    className="rounded"
                                                />
                                                <Label htmlFor="enabled">Aktifkan jadwal ini</Label>
                                            </div>
                                            <Button onClick={createCustomSchedule} className="w-full">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Buat Jadwal
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                </div>
                            </div>

                            {/* Status Jadwal */}
                            {customSchedules.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Status Jadwal Backup
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {customSchedules.filter(s => s.enabled).length}
                                            </div>
                                            <p className="text-sm text-blue-800">Jadwal Aktif</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {customSchedules.filter(s => s.lastRun).length}
                                            </div>
                                            <p className="text-sm text-green-800">Sudah Dijalankan</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {customSchedules.filter(s => s.enabled && !s.lastRun).length}
                                            </div>
                                            <p className="text-sm text-orange-800">Menunggu Waktu</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {customSchedules.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Belum ada jadwal custom</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Buat jadwal backup untuk tanggal dan waktu tertentu
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Jadwal</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Waktu</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Terakhir Dijalankan</TableHead>
                                            <TableHead>Dibuat</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customSchedules.map((schedule) => (
                                            <TableRow key={schedule.id}>
                                                <TableCell className="font-medium">
                                                    {schedule.name}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(schedule.date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.time}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                                                        {schedule.enabled ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.lastRun 
                                                        ? new Date(schedule.lastRun).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                        : 'Belum pernah dijalankan'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(schedule.created).toLocaleDateString('id-ID')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => runCustomSchedule(schedule.id)}
                                                            title="Jalankan sekarang"
                                                        >
                                                            <Zap className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleCustomSchedule(schedule.id, !schedule.enabled)}
                                                            title={schedule.enabled ? "Nonaktifkan jadwal" : "Aktifkan jadwal"}
                                                        >
                                                            {schedule.enabled ? (
                                                                <Pause className="h-4 w-4" />
                                                            ) : (
                                                                <Play className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => deleteCustomSchedule(schedule.id)}
                                                            title="Hapus jadwal"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Jadwal yang Sudah Dijalankan */}
                            {customSchedules.filter(s => s.lastRun).length > 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Jadwal yang Sudah Dijalankan
                                    </h4>
                                    <div className="space-y-2">
                                        {customSchedules
                                            .filter(s => s.lastRun)
                                            .sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime())
                                            .slice(0, 3)
                                            .map((schedule) => (
                                                <div key={schedule.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                                    <div>
                                                        <span className="font-medium">{schedule.name}</span>
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            Dijalankan: {new Date(schedule.lastRun).toLocaleDateString('id-ID', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <Badge variant="default" className="text-green-700 bg-green-100">
                                                        Selesai
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Jadwal Mendatang */}
                            {customSchedules.filter(s => s.enabled && !s.lastRun).length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Jadwal Mendatang
                                    </h4>
                                    <div className="space-y-2">
                                        {customSchedules
                                            .filter(s => s.enabled && !s.lastRun)
                                            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                                            .slice(0, 3)
                                            .map((schedule) => (
                                                <div key={schedule.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                                    <div>
                                                        <span className="font-medium">{schedule.name}</span>
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            {new Date(`${schedule.date}T${schedule.time}`).toLocaleDateString('id-ID', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {(() => {
                                                                const now = new Date();
                                                                const scheduleTime = new Date(`${schedule.date}T${schedule.time}`);
                                                                const diff = scheduleTime.getTime() - now.getTime();
                                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                                
                                                                if (days > 0) {
                                                                    return `Tersisa ${days} hari ${hours} jam`;
                                                                } else if (hours > 0) {
                                                                    return `Tersisa ${hours} jam ${minutes} menit`;
                                                                } else if (minutes > 0) {
                                                                    return `Tersisa ${minutes} menit`;
                                                                } else {
                                                                    return 'Akan segera dijalankan';
                                                                }
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-green-700 border-green-300">
                                                        Menunggu
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Info:</strong> Jadwal backup custom akan berjalan pada tanggal dan waktu yang ditentukan. 
                                    Pastikan server berjalan pada waktu yang dijadwalkan untuk memastikan backup berhasil dibuat.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </TabsContent>
            </Tabs>
        </div>
    );
};

export default BackupManagementView;