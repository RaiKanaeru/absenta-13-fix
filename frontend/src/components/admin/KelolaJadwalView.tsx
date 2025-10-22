import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, AlertTriangle, Eye, FileUp, Download } from 'lucide-react';
import JadwalKhususManagement from './JadwalKhususManagement';
import GlobalScheduleView from './GlobalScheduleView';
import SchedulePreviewGrid from '../SchedulePreviewGrid';

interface KelolaJadwalViewProps {
  onBack?: () => void;
  onLogout?: () => void;
  ManageSchedulesView?: React.ComponentType<{ onBack: () => void; onLogout: () => void }>;
}

const KelolaJadwalView: React.FC<KelolaJadwalViewProps> = ({
  onBack,
  onLogout,
  ManageSchedulesView
}) => {
  const [activeTab, setActiveTab] = useState('jadwal-regular');
  const [showConflicts, setShowConflicts] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Kelola Jadwal
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Atur jadwal pelajaran untuk setiap kelas dengan mudah
            </p>
          </div>
          {onBack && (
            <Button onClick={handleBack} variant="outline">
              ← Kembali
            </Button>
          )}
        </CardHeader>
        
        {/* Action Buttons Header */}
        <CardContent className="border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showConflicts ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowConflicts(!showConflicts);
                setShowPreview(false);
                setShowImport(false);
                setShowAdvancedImport(false);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Cek Bentrok
            </Button>
            
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowPreview(!showPreview);
                setShowConflicts(false);
                setShowImport(false);
                setShowAdvancedImport(false);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Jadwal
            </Button>
            
            <Button
              variant={showAdvancedImport ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowAdvancedImport(!showAdvancedImport);
                setShowConflicts(false);
                setShowPreview(false);
                setShowImport(false);
              }}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Import Advanced
            </Button>
            
            <Button
              variant={showImport ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowImport(!showImport);
                setShowConflicts(false);
                setShowPreview(false);
                setShowAdvancedImport(false);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Different Schedule Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="jadwal-regular" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Jadwal Regular</span>
          </TabsTrigger>
          <TabsTrigger value="jadwal-khusus" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Jadwal Khusus</span>
          </TabsTrigger>
        </TabsList>

        {/* Jadwal Regular Tab */}
        <TabsContent value="jadwal-regular" className="space-y-4">
          {ManageSchedulesView && (
            <ManageSchedulesView onBack={handleBack} onLogout={handleLogout} />
          )}
        </TabsContent>

        {/* Jadwal Khusus Tab */}
        <TabsContent value="jadwal-khusus" className="space-y-4">
          <JadwalKhususManagement onBack={handleBack} onLogout={handleLogout} />
        </TabsContent>
      </Tabs>

      {/* Conditional Renders for Action Buttons */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <SchedulePreviewGrid />
          </CardContent>
        </Card>
      )}

      {showConflicts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Deteksi Konflik Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GlobalScheduleView />
          </CardContent>
        </Card>
      )}

      {/* Import modals will be triggered from ManageSchedulesView component */}
    </div>
  );
};

export default KelolaJadwalView;

