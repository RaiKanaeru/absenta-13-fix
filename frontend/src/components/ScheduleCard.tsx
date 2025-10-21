/**
 * Reusable Schedule Card Component
 * Displays both regular schedules and special schedules (jadwal khusus)
 * with visual differentiation
 */

import React from 'react';
import { Clock, User, MapPin, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import {
  MergedSchedule,
  getScheduleColorClass,
  getScheduleBadgeColor,
  getScheduleIcon,
  formatTimeRange,
  getJenisKegiatanLabel,
  getScheduleStatus
} from '../utils/jadwalKhususHelpers';

interface ScheduleCardProps {
  schedule: MergedSchedule;
  onClick?: (schedule: MergedSchedule) => void;
  showStatus?: boolean;
  showKeterangan?: boolean;
  className?: string;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onClick,
  showStatus = true,
  showKeterangan = true,
  className = ''
}) => {
  const colorClass = getScheduleColorClass(schedule.type, schedule.jenis_kegiatan);
  const badgeColor = getScheduleBadgeColor(schedule.type, schedule.jenis_kegiatan);
  const icon = getScheduleIcon(schedule.type, schedule.jenis_kegiatan);
  const status = getScheduleStatus(schedule.jam_mulai, schedule.jam_selesai);
  
  const statusColors = {
    current: 'bg-green-500 text-white',
    upcoming: 'bg-blue-500 text-white',
    completed: 'bg-gray-400 text-white'
  };
  
  const statusLabels = {
    current: 'Sedang Berlangsung',
    upcoming: 'Akan Datang',
    completed: 'Selesai'
  };
  
  return (
    <Card 
      className={`border-2 ${colorClass} transition-all cursor-pointer ${className}`}
      onClick={() => onClick?.(schedule)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 flex-1">
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {schedule.nama}
                {schedule.type === 'special' && (
                  <Badge className={`text-xs ${badgeColor}`}>
                    {schedule.jenis_kegiatan && getJenisKegiatanLabel(schedule.jenis_kegiatan)}
                  </Badge>
                )}
              </h3>
              {schedule.type === 'special' && schedule.nama_kelas && (
                <p className="text-sm text-gray-600 mt-1">{schedule.nama_kelas}</p>
              )}
              {schedule.type === 'regular' && schedule.nama_kelas && (
                <p className="text-sm text-gray-600 mt-1">{schedule.nama_kelas}</p>
              )}
            </div>
          </div>
          
          {showStatus && (
            <Badge className={`${statusColors[status]} text-xs`}>
              {statusLabels[status]}
            </Badge>
          )}
        </div>
        
        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{formatTimeRange(schedule.jam_mulai, schedule.jam_selesai)}</span>
          {schedule.jam_ke && (
            <span className="text-gray-500">• Jam ke-{schedule.jam_ke}</span>
          )}
        </div>
        
        {/* Teacher */}
        {schedule.nama_guru && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <User className="w-4 h-4" />
            <span>{schedule.nama_guru}</span>
          </div>
        )}
        
        {/* Keterangan */}
        {showKeterangan && schedule.keterangan && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-600 text-sm leading-relaxed">{schedule.keterangan}</p>
            </div>
          </div>
        )}
        
        {/* For special schedules, show type badge at bottom */}
        {schedule.type === 'special' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Jadwal Khusus</span>
              {schedule.type === 'special' && schedule.jenis_kegiatan === 'upacara' && (
                <span className="text-xs text-gray-500">Semua Kelas</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Compact version for list views
 */
export const ScheduleCardCompact: React.FC<ScheduleCardProps> = ({
  schedule,
  onClick,
  className = ''
}) => {
  const colorClass = getScheduleColorClass(schedule.type, schedule.jenis_kegiatan);
  const badgeColor = getScheduleBadgeColor(schedule.type, schedule.jenis_kegiatan);
  const icon = getScheduleIcon(schedule.type, schedule.jenis_kegiatan);
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${colorClass} cursor-pointer transition-all ${className}`}
      onClick={() => onClick?.(schedule)}
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{schedule.nama}</h4>
          {schedule.type === 'special' && schedule.jenis_kegiatan && (
            <Badge className={`text-xs ${badgeColor}`}>
              {getJenisKegiatanLabel(schedule.jenis_kegiatan)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <Clock className="w-3 h-3" />
          <span>{formatTimeRange(schedule.jam_mulai, schedule.jam_selesai)}</span>
          {schedule.nama_guru && (
            <>
              <span>•</span>
              <User className="w-3 h-3" />
              <span className="truncate">{schedule.nama_guru}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;

