/**
 * Monitoring Dashboard
 * Phase 6: Real-time monitoring, Alert system, Performance tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
    Activity, 
    Server, 
    Database, 
    Zap, 
    AlertTriangle, 
    CheckCircle, 
    XCircle,
    RefreshCw,
    BarChart3,
    Clock,
    Users,
    Bell,
    TrendingUp,
    Cpu,
    HardDrive,
    Wifi,
    WifiOff
} from 'lucide-react';

interface SystemMetrics {
    system: {
        memory: { used: number; total: number; percentage: number };
        cpu: { usage: number; loadAverage: number[] };
        disk: { used: number; total: number; percentage: number };
        uptime: number;
    };
    application: {
        requests: { total: number; active: number; completed: number; failed: number };
        responseTime: { average: number; min: number; max: number };
        errors: { count: number; lastError: any };
    };
    database: {
        connections: { active: number; idle: number; total: number };
        queries: { total: number; slow: number; failed: number };
        responseTime: { average: number; min: number; max: number };
    };
}

interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    timestamp: string;
}

interface Alert {
    id: string;
    type: string;
    severity: 'warning' | 'critical' | 'emergency';
    message: string;
    data: any;
    timestamp: string;
    resolved?: boolean;
    resolvedAt?: string;
    resolution?: string;
}

interface AlertStatistics {
    total: number;
    active: number;
    resolved: number;
    last24h: number;
    bySeverity: {
        warning: number;
        critical: number;
        emergency: number;
    };
    byType: { [key: string]: number };
}

interface MonitoringData {
    metrics: SystemMetrics;
    health: SystemHealth;
    alerts: Alert[];
    alertStats: AlertStatistics;
    loadBalancer: any;
    queryOptimizer: any;
    redis: any;
    system: {
        uptime: number;
        memory: any;
        cpu: any;
    };
}

const MonitoringDashboard: React.FC = () => {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(() => {
        // Load auto refresh state from localStorage, default to true
        const saved = localStorage.getItem('monitoringAutoRefresh');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const { toast } = useToast();

    const fetchMonitoringData = async () => {
        try {
            const response = await fetch('/api/admin/monitoring-dashboard', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
                }
                throw new Error('Failed to fetch monitoring data');
            }
            
            const result = await response.json();
            setData(result.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const resolveAlert = async (alertId: string) => {
        try {
            const response = await fetch(`/api/admin/resolve-alert/${alertId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ resolution: 'manual' })
            });
            
            if (response.ok) {
                // Refresh data
                await fetchMonitoringData();
            }
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    const testAlert = async (type: string, severity: string) => {
        try {
            console.log(`🔔 Sending test alert: ${type} - ${severity}`);
            
            const response = await fetch('/api/admin/test-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type, severity })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Test alert sent successfully:', result);
                
                // Show success toast
                toast({
                    title: "Test Alert Sent",
                    description: `${type.charAt(0).toUpperCase() + type.slice(1)} alert (${severity}) has been sent successfully`,
                    variant: "default"
                });
                
                // Refresh data to show the new alert
                await fetchMonitoringData();
            } else {
                const errorData = await response.json();
                console.error('❌ Failed to send test alert:', errorData);
                
                toast({
                    title: "Error",
                    description: errorData.error || "Failed to send test alert",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error('❌ Error sending test alert:', err);
            toast({
                title: "Error",
                description: "Network error while sending test alert",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        fetchMonitoringData();
        
        if (autoRefresh) {
            const interval = setInterval(fetchMonitoringData, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const formatBytes = (bytes: number) => {
        // Handle invalid or undefined values
        if (!bytes || bytes === 0 || isNaN(bytes) || !isFinite(bytes)) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const sizeIndex = Math.min(i, sizes.length - 1);
        
        return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
    };

    const formatUptime = (seconds: number) => {
        // Handle invalid or undefined values
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0d 0h 0m';
        
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'critical': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'critical': return 'bg-orange-100 text-orange-800';
            case 'emergency': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading monitoring data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Error loading monitoring data: {error}
                </AlertDescription>
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    No monitoring data available
                </AlertDescription>
            </Alert>
        );
    }

    // Safe destructuring with fallback values
    const metrics = data?.metrics || {};
    const health = data?.health || { status: 'unknown', issues: [] };
    const alerts = data?.alerts || [];
    const alertStats = data?.alertStats || { active: 0, total: 0, resolved: 0 };
    const loadBalancer = data?.loadBalancer || { totalRequests: 0, activeRequests: 0, completedRequests: 0, failedRequests: 0 };
    const system = data?.system || { uptime: 0 };

    // Safe access to nested properties with fallbacks
    const memoryUsed = metrics?.system?.memory?.used || 0;
    const memoryTotal = metrics?.system?.memory?.total || 0;
    const memoryPercentage = metrics?.system?.memory?.percentage || 0;
    const cpuUsage = metrics?.system?.cpu?.usage || 0;
    const diskUsed = metrics?.system?.disk?.used || 0;
    const diskTotal = metrics?.system?.disk?.total || 0;
    const diskPercentage = metrics?.system?.disk?.percentage || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">System Monitoring Dashboard</h2>
                    <p className="text-gray-600">Real-time system monitoring and alerting</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newState = !autoRefresh;
                            setAutoRefresh(newState);
                            // Save to localStorage
                            localStorage.setItem('monitoringAutoRefresh', JSON.stringify(newState));
                        }}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMonitoringData}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Bell className="h-4 w-4 mr-2" />
                                Test Alert
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Send Test Alert</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button onClick={() => testAlert('memory', 'warning')}>
                                        Test Memory Alert
                                    </Button>
                                    <Button onClick={() => testAlert('cpu', 'critical')}>
                                        Test CPU Alert
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* System Health Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(health?.status || 'unknown')} mr-3`}></div>
                        System Health Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <Badge 
                                variant="outline" 
                                className={health?.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                                         health?.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'}
                            >
                                {(health?.status || 'unknown').toUpperCase()}
                            </Badge>
                            {health?.issues && health.issues.length > 0 && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Issues: {health.issues.join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">System Uptime</p>
                            <p className="font-semibold">{formatUptime(system.uptime)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(memoryUsed)}</div>
                        <Progress 
                            value={Math.min(Math.max(memoryPercentage, 0), 100)} 
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {memoryPercentage.toFixed(1)}% of {formatBytes(memoryTotal)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cpuUsage.toFixed(1)}%</div>
                        <Progress 
                            value={Math.min(Math.max(cpuUsage, 0), 100)} 
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(metrics?.application?.requests?.total || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics?.application?.requests?.completed || 0} completed, {metrics?.application?.requests?.failed || 0} failed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(metrics?.application?.responseTime?.average || 0).toFixed(2)}ms</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="database">Database</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Database Connections */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Database className="h-5 w-5 mr-2" />
                                    Database Connections
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Active:</span>
                                    <Badge variant="outline">{metrics.database.connections.active || 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Idle:</span>
                                    <Badge variant="outline">{metrics.database.connections.idle || 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total:</span>
                                    <Badge variant="outline">{metrics.database.connections.total || 0}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Load Balancer Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Activity className="h-5 w-5 mr-2" />
                                    Load Balancer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Active Requests:</span>
                                    <Badge variant="outline">{loadBalancer?.activeRequests || 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Queue Size:</span>
                                    <Badge variant="outline">{loadBalancer?.totalQueueSize || 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Circuit Breaker:</span>
                                    <Badge 
                                        variant="outline" 
                                        className={loadBalancer?.circuitBreaker?.isOpen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                                    >
                                        {loadBalancer?.circuitBreaker?.isOpen ? 'OPEN' : 'CLOSED'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-4">
                    {/* Alert Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{alertStats?.total || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{alertStats?.active || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{alertStats?.resolved || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{alertStats?.last24h || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Active Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(alerts || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                    <p>No active alerts</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(alerts || []).map((alert) => (
                                        <div key={alert.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Badge className={getSeverityColor(alert.severity)}>
                                                        {alert.severity.toUpperCase()}
                                                    </Badge>
                                                    <div>
                                                        <h4 className="font-medium">{alert.type}</h4>
                                                        <p className="text-sm text-gray-600">{alert.message}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(alert.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedAlert(alert)}
                                                    >
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => resolveAlert(alert.id)}
                                                    >
                                                        Resolve
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Response Time Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Response Time Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Average:</span>
                                    <Badge variant="outline">{(metrics.application.responseTime.average || 0).toFixed(2)}ms</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Minimum:</span>
                                    <Badge variant="outline">{(metrics.application.responseTime.min || 0).toFixed(2)}ms</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Maximum:</span>
                                    <Badge variant="outline">{(metrics.application.responseTime.max || 0).toFixed(2)}ms</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Database Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Database className="h-5 w-5 mr-2" />
                                    Database Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Total Queries:</span>
                                    <Badge variant="outline">{metrics.database.queries.total || 0}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Slow Queries:</span>
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                        {metrics.database.queries.slow || 0}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span>Failed Queries:</span>
                                    <Badge variant="outline" className="bg-red-100 text-red-800">
                                        {metrics.database.queries.failed || 0}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Database Tab */}
                <TabsContent value="database" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Database className="h-5 w-5 mr-2" />
                                Database Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{metrics.database.connections.active || 0}</div>
                                    <p className="text-sm text-gray-600">Active Connections</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{metrics.database.connections.idle || 0}</div>
                                    <p className="text-sm text-gray-600">Idle Connections</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{metrics.database.queries.total || 0}</div>
                                    <p className="text-sm text-gray-600">Total Queries</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{(metrics.database.responseTime.average || 0).toFixed(2)}ms</div>
                                    <p className="text-sm text-gray-600">Avg Query Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Alert Details Dialog */}
            {selectedAlert && (
                <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Alert Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium">Type: {selectedAlert.type}</h4>
                                <Badge className={getSeverityColor(selectedAlert.severity)}>
                                    {selectedAlert.severity.toUpperCase()}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-medium">Message:</h4>
                                <p className="text-sm text-gray-600">{selectedAlert.message}</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Timestamp:</h4>
                                <p className="text-sm text-gray-600">
                                    {new Date(selectedAlert.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium">Data:</h4>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(selectedAlert.data, null, 2)}
                                </pre>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedAlert(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        resolveAlert(selectedAlert.id);
                                        setSelectedAlert(null);
                                    }}
                                >
                                    Resolve Alert
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default MonitoringDashboard;
