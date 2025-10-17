/**
 * Security Management View
 * Komponen untuk mengelola security settings dan account lockouts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { apiCall } from '../../utils/api';
import { toast } from '../../hooks/use-toast';

interface LockoutStats {
  lockouts: {
    total_lockouts: number;
    permanent_lockouts: number;
    active_lockouts: number;
    lockouts_24h: number;
  };
  attempts: {
    total_attempts: number;
    failed_attempts: number;
    successful_attempts: number;
    attempts_24h: number;
  };
}

interface ActiveLockout {
  id: number;
  username: string;
  ip_address: string;
  attempt_count: number;
  locked_until: string;
  is_permanent: boolean;
  created_at: string;
  remaining_minutes: number;
  status: string;
}

interface LoginAttempt {
  id: number;
  username: string;
  ip_address: string;
  success: boolean;
  reason: string;
  user_agent: string;
  created_at: string;
}

interface SecurityEvent {
  id: number;
  event_type: string;
  username: string;
  ip_address: string;
  description: string;
  severity: string;
  metadata: any;
  created_at: string;
}

const SecurityManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lockouts' | 'attempts' | 'events'>('overview');
  const [stats, setStats] = useState<LockoutStats | null>(null);
  const [activeLockouts, setActiveLockouts] = useState<ActiveLockout[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    username: '',
    ip_address: '',
    success: '',
    event_type: '',
    severity: '',
    start_date: '',
    end_date: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Load overview stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiCall.get('/api/security/lockout-stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat statistik keamanan',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load active lockouts
  const loadActiveLockouts = async () => {
    try {
      setLoading(true);
      const response = await apiCall.get('/api/security/active-lockouts');
      if (response.success) {
        setActiveLockouts(response.data);
      }
    } catch (error) {
      console.error('Error loading active lockouts:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar akun terkunci',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load login attempts
  const loadLoginAttempts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await apiCall.get(`/api/security/login-attempts?${params}`);
      if (response.success) {
        setLoginAttempts(response.data.attempts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading login attempts:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat login attempts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load security events
  const loadSecurityEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });
      
      const response = await apiCall.get(`/api/security/security-events?${params}`);
      if (response.success) {
        setSecurityEvents(response.data.events);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading security events:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat security events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Unlock account
  const handleUnlockAccount = async (username: string) => {
    try {
      const response = await apiCall.post('/api/security/unlock-account', { username });
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message
        });
        loadActiveLockouts();
        loadStats();
      }
    } catch (error) {
      console.error('Error unlocking account:', error);
      toast({
        title: 'Error',
        description: 'Gagal meng-unlock akun',
        variant: 'destructive'
      });
    }
  };

  // Cleanup old records
  const handleCleanup = async () => {
    try {
      const response = await apiCall.post('/api/security/cleanup');
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message
        });
        loadStats();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: 'Error',
        description: 'Gagal melakukan cleanup',
        variant: 'destructive'
      });
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadStats();
        break;
      case 'lockouts':
        loadActiveLockouts();
        break;
      case 'attempts':
        loadLoginAttempts();
        break;
      case 'events':
        loadSecurityEvents();
        break;
    }
  }, [activeTab, pagination.page, filters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const formatRemainingTime = (minutes: number) => {
    if (minutes <= 0) return 'Expired';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Management</h2>
        <p className="text-muted-foreground">
          Kelola keamanan sistem dan monitor aktivitas login
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'lockouts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('lockouts')}
        >
          Active Lockouts
        </Button>
        <Button
          variant={activeTab === 'attempts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('attempts')}
        >
          Login Attempts
        </Button>
        <Button
          variant={activeTab === 'events' ? 'default' : 'outline'}
          onClick={() => setActiveTab('events')}
        >
          Security Events
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lockouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.lockouts.total_lockouts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.lockouts.lockouts_24h || 0} dalam 24 jam terakhir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Lockouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.lockouts.active_lockouts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.lockouts.permanent_lockouts || 0} permanen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attempts.total_attempts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.attempts.attempts_24h || 0} dalam 24 jam terakhir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.attempts.total_attempts > 0 
                  ? Math.round((stats.attempts.successful_attempts / stats.attempts.total_attempts) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.attempts.successful_attempts || 0} berhasil dari {stats?.attempts.total_attempts || 0} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Lockouts Tab */}
      {activeTab === 'lockouts' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Account Lockouts</CardTitle>
            <CardDescription>
              Daftar akun yang sedang terkunci
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remaining Time</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLockouts.map((lockout) => (
                  <TableRow key={lockout.id}>
                    <TableCell>{lockout.username}</TableCell>
                    <TableCell>{lockout.ip_address}</TableCell>
                    <TableCell>{lockout.attempt_count}</TableCell>
                    <TableCell>
                      <Badge variant={lockout.is_permanent ? 'destructive' : 'default'}>
                        {lockout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatRemainingTime(lockout.remaining_minutes)}
                    </TableCell>
                    <TableCell>{formatDate(lockout.created_at)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Unlock
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unlock Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin meng-unlock akun {lockout.username}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnlockAccount(lockout.username)}
                            >
                              Unlock
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Login Attempts Tab */}
      {activeTab === 'attempts' && (
        <Card>
          <CardHeader>
            <CardTitle>Login Attempts</CardTitle>
            <CardDescription>
              Riwayat percobaan login
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={filters.username}
                  onChange={(e) => setFilters({...filters, username: e.target.value})}
                  placeholder="Filter by username"
                />
              </div>
              <div>
                <Label htmlFor="ip_address">IP Address</Label>
                <Input
                  id="ip_address"
                  value={filters.ip_address}
                  onChange={(e) => setFilters({...filters, ip_address: e.target.value})}
                  placeholder="Filter by IP"
                />
              </div>
              <div>
                <Label htmlFor="success">Status</Label>
                <Select value={filters.success} onValueChange={(value) => setFilters({...filters, success: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>{attempt.username}</TableCell>
                    <TableCell>{attempt.ip_address}</TableCell>
                    <TableCell>
                      <Badge variant={attempt.success ? 'default' : 'destructive'}>
                        {attempt.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{attempt.reason}</TableCell>
                    <TableCell>{formatDate(attempt.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Security Events Tab */}
      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Events</CardTitle>
            <CardDescription>
              Log kejadian keamanan sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Input
                  id="event_type"
                  value={filters.event_type}
                  onChange={(e) => setFilters({...filters, event_type: e.target.value})}
                  placeholder="Filter by event type"
                />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleCleanup} variant="outline">
                  Cleanup Old Records
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.username || '-'}</TableCell>
                    <TableCell>{event.ip_address}</TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(event.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityManagementView;
