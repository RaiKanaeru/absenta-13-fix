// src/components/admin/PerformanceMonitoringView.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { apiCall } from "@/lib/api";
import { Activity, Database, Memory, Cpu, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

interface PerformanceMetrics {
  requests: {
    total: number;
    averageDuration: number;
    averageMemory: number;
    slowRequests: number;
  };
  database: {
    total: number;
    averageDuration: number;
    slowQueries: number;
  };
  memory: {
    current: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    peak: number;
    usage: Array<{
      timestamp: string;
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    }>;
  };
  cpu: {
    current: {
      user: number;
      system: number;
    };
    peak: number;
    usage: Array<{
      timestamp: string;
      user: number;
      system: number;
    }>;
  };
  timestamp: string;
}

interface PerformanceHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    memory: any;
    requests: any;
    database: any;
  };
}

const PerformanceMonitoringView: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [health, setHealth] = useState<PerformanceHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/performance/metrics', { method: 'GET' });
      if (response.success) {
        setMetrics(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch performance metrics",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch performance metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await apiCall('/api/performance/health', { method: 'GET' });
      if (response.success) {
        setHealth(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch performance health",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch performance health",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
        fetchHealth();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            <Activity className="inline-block mr-2 h-6 w-6" /> Performance Monitoring
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
            >
              Auto Refresh
            </Button>
            <Button onClick={fetchMetrics} disabled={loading} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Monitor system performance, memory usage, and database performance.
          </p>
        </CardContent>
      </Card>

      {/* Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              {getStatusIcon(health.status)}
              <span className="ml-2">System Health</span>
              <Badge className={`ml-2 ${getStatusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Issues Detected:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {health.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {health.issues.length === 0 && (
              <p className="text-green-600">All systems are running normally.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.requests.total}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatDuration(metrics.requests.averageDuration)}
              </p>
              {metrics.requests.slowRequests > 0 && (
                <p className="text-xs text-red-600">
                  {metrics.requests.slowRequests} slow requests
                </p>
              )}
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.database.total}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatDuration(metrics.database.averageDuration)}
              </p>
              {metrics.database.slowQueries > 0 && (
                <p className="text-xs text-red-600">
                  {metrics.database.slowQueries} slow queries
                </p>
              )}
            </CardContent>
          </Card>

          {/* Memory */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory</CardTitle>
              <Memory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(metrics.memory.current.heapUsed)}
              </div>
              <p className="text-xs text-muted-foreground">
                Peak: {formatBytes(metrics.memory.peak)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total: {formatBytes(metrics.memory.current.heapTotal)}
              </p>
            </CardContent>
          </Card>

          {/* CPU */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(metrics.cpu.current.user + metrics.cpu.current.system)}
              </div>
              <p className="text-xs text-muted-foreground">
                Peak: {formatDuration(metrics.cpu.peak)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Memory Usage Chart */}
      {metrics && metrics.memory.usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Memory Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>RSS</TableHead>
                  <TableHead>Heap Used</TableHead>
                  <TableHead>Heap Total</TableHead>
                  <TableHead>External</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.memory.usage.slice(-10).map((usage, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {new Date(usage.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{formatBytes(usage.rss)}</TableCell>
                    <TableCell>{formatBytes(usage.heapUsed)}</TableCell>
                    <TableCell>{formatBytes(usage.heapTotal)}</TableCell>
                    <TableCell>{formatBytes(usage.external)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* CPU Usage Chart */}
      {metrics && metrics.cpu.usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">CPU Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.cpu.usage.slice(-10).map((usage, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {new Date(usage.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{formatDuration(usage.user)}</TableCell>
                    <TableCell>{formatDuration(usage.system)}</TableCell>
                    <TableCell>{formatDuration(usage.user + usage.system)}</TableCell>
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

export default PerformanceMonitoringView;
