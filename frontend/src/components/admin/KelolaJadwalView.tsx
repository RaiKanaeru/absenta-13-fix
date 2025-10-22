import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays } from 'lucide-react';
import JadwalKhususManagement from './JadwalKhususManagement';

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

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                Kelola Jadwal
              </CardTitle>
              <CardDescription className="text-base">
                Atur jadwal pelajaran untuk setiap kelas dengan mudah
              </CardDescription>
            </div>
            {onBack && (
              <Button onClick={handleBack} variant="outline" size="sm">
                ← Kembali
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs - Cleaner Design */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
          <TabsTrigger 
            value="jadwal-regular" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Jadwal Regular</span>
          </TabsTrigger>
          <TabsTrigger 
            value="jadwal-khusus" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">Jadwal Khusus</span>
          </TabsTrigger>
        </TabsList>

        {/* Jadwal Regular Tab */}
        <TabsContent value="jadwal-regular" className="mt-6 space-y-4">
          {ManageSchedulesView && (
            <ManageSchedulesView onBack={handleBack} onLogout={handleLogout} />
          )}
        </TabsContent>

        {/* Jadwal Khusus Tab */}
        <TabsContent value="jadwal-khusus" className="mt-6 space-y-4">
          <JadwalKhususManagement onBack={handleBack} onLogout={handleLogout} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KelolaJadwalView;

