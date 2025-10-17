// src/hooks/usePerformance.ts
import { useEffect, useCallback, useRef, useState } from 'react';
import { useSentry } from './useSentry';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  networkRequests: number;
  errors: number;
  userInteractions: number;
}

interface UsePerformanceReturn {
  metrics: PerformanceMetrics;
  startTiming: (name: string) => void;
  endTiming: (name: string) => void;
  recordUserInteraction: (action: string) => void;
  recordError: (error: Error) => void;
  recordNetworkRequest: (url: string, duration: number) => void;
  getPerformanceReport: () => PerformanceMetrics;
}

export const usePerformance = (): UsePerformanceReturn => {
  const { captureMessage, addBreadcrumb } = useSentry();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0,
    errors: 0,
    userInteractions: 0,
  });

  const timings = useRef<Map<string, number>>(new Map());
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(0);

  // Initialize performance monitoring
  useEffect(() => {
    // Record initial load time
    const loadTime = Date.now() - startTime.current;
    setMetrics(prev => ({ ...prev, loadTime }));

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({ 
        ...prev, 
        memoryUsage: memoryInfo.usedJSHeapSize 
      }));
    }

    // Add breadcrumb for page load
    addBreadcrumb({
      message: 'Page loaded',
      category: 'performance',
      level: 'info',
      data: { loadTime },
    });

    // Record render time
    renderStartTime.current = Date.now();
    const renderTime = Date.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));

    // Monitor performance entries
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          addBreadcrumb({
            message: 'Navigation timing',
            category: 'performance',
            level: 'info',
            data: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
            },
          });
        } else if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) { // 1 second
            addBreadcrumb({
              message: 'Slow resource load',
              category: 'performance',
              level: 'warning',
              data: {
                name: resourceEntry.name,
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize,
              },
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });

    return () => {
      observer.disconnect();
    };
  }, [addBreadcrumb]);

  // Start timing function
  const startTiming = useCallback((name: string) => {
    timings.current.set(name, Date.now());
  }, []);

  // End timing function
  const endTiming = useCallback((name: string) => {
    const startTime = timings.current.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      timings.current.delete(name);

      // Record slow operations
      if (duration > 1000) { // 1 second
        addBreadcrumb({
          message: `Slow operation: ${name}`,
          category: 'performance',
          level: 'warning',
          data: { name, duration },
        });

        captureMessage(`Slow operation detected: ${name}`, 'warning', {
          operation: name,
          duration: duration,
        });
      }

      return duration;
    }
    return 0;
  }, [addBreadcrumb, captureMessage]);

  // Record user interaction
  const recordUserInteraction = useCallback((action: string) => {
    setMetrics(prev => ({ 
      ...prev, 
      userInteractions: prev.userInteractions + 1 
    }));

    addBreadcrumb({
      message: `User interaction: ${action}`,
      category: 'user',
      level: 'info',
      data: { action },
    });
  }, [addBreadcrumb]);

  // Record error
  const recordError = useCallback((error: Error) => {
    setMetrics(prev => ({ 
      ...prev, 
      errors: prev.errors + 1 
    }));

    addBreadcrumb({
      message: `Error occurred: ${error.message}`,
      category: 'error',
      level: 'error',
      data: { 
        message: error.message,
        stack: error.stack,
      },
    });
  }, [addBreadcrumb]);

  // Record network request
  const recordNetworkRequest = useCallback((url: string, duration: number) => {
    setMetrics(prev => ({ 
      ...prev, 
      networkRequests: prev.networkRequests + 1 
    }));

    // Record slow network requests
    if (duration > 2000) { // 2 seconds
      addBreadcrumb({
        message: `Slow network request: ${url}`,
        category: 'network',
        level: 'warning',
        data: { url, duration },
      });

      captureMessage(`Slow network request detected`, 'warning', {
        url: url,
        duration: duration,
      });
    }
  }, [addBreadcrumb, captureMessage]);

  // Get performance report
  const getPerformanceReport = useCallback((): PerformanceMetrics => {
    const currentMetrics = {
      ...metrics,
      memoryUsage: 'memory' in performance ? (performance as any).memory.usedJSHeapSize : undefined,
    };

    // Send performance report to Sentry
    captureMessage('Performance report generated', 'info', currentMetrics);

    return currentMetrics;
  }, [metrics, captureMessage]);

  return {
    metrics,
    startTiming,
    endTiming,
    recordUserInteraction,
    recordError,
    recordNetworkRequest,
    getPerformanceReport,
  };
};
