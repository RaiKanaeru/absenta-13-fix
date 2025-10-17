// tests/unit/hooks/usePerformance.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePerformance } from '../../../src/hooks/usePerformance';

// Mock Sentry functions
const mockCaptureMessage = jest.fn();
const mockAddBreadcrumb = jest.fn();

jest.mock('../../../src/hooks/useSentry', () => ({
  useSentry: () => ({
    captureMessage: mockCaptureMessage,
    addBreadcrumb: mockAddBreadcrumb,
  }),
}));

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
const mockObserver = {
  observe: jest.fn(),
  disconnect: jest.fn(),
};

const mockPerformanceObserver = jest.fn(() => mockObserver);

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true,
});

describe('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default metrics', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.metrics).toEqual({
      loadTime: 0,
      renderTime: 0,
      networkRequests: 0,
      errors: 0,
      userInteractions: 0,
    });
  });

  it('startTiming and endTiming work correctly', () => {
    const { result } = renderHook(() => usePerformance());

    act(() => {
      result.current.startTiming('test-operation');
    });

    // Advance time by 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const duration = act(() => {
      return result.current.endTiming('test-operation');
    });

    expect(duration).toBeGreaterThan(0);
  });

  it('endTiming returns 0 for non-existent timing', () => {
    const { result } = renderHook(() => usePerformance());

    const duration = act(() => {
      return result.current.endTiming('non-existent');
    });

    expect(duration).toBe(0);
  });

  it('recordUserInteraction increments userInteractions counter', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.metrics.userInteractions).toBe(0);

    act(() => {
      result.current.recordUserInteraction('click');
    });

    expect(result.current.metrics.userInteractions).toBe(1);
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      'User interaction: click',
      'user',
      'info',
      { action: 'click' }
    );
  });

  it('recordError increments errors counter', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.metrics.errors).toBe(0);

    const error = new Error('Test error');
    act(() => {
      result.current.recordError(error);
    });

    expect(result.current.metrics.errors).toBe(1);
    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      'Error occurred: Test error',
      'error',
      'error',
      {
        message: 'Test error',
        stack: error.stack,
      }
    );
  });

  it('recordNetworkRequest increments networkRequests counter', () => {
    const { result } = renderHook(() => usePerformance());

    expect(result.current.metrics.networkRequests).toBe(0);

    act(() => {
      result.current.recordNetworkRequest('/api/test', 1500);
    });

    expect(result.current.metrics.networkRequests).toBe(1);
  });

  it('recordNetworkRequest logs slow requests', () => {
    const { result } = renderHook(() => usePerformance());

    act(() => {
      result.current.recordNetworkRequest('/api/slow', 3000);
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      'Slow network request: /api/slow',
      'network',
      'warning',
      { url: '/api/slow', duration: 3000 }
    );

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Slow network request detected',
      'warning',
      { url: '/api/slow', duration: 3000 }
    );
  });

  it('getPerformanceReport returns current metrics', () => {
    const { result } = renderHook(() => usePerformance());

    act(() => {
      result.current.recordUserInteraction('click');
      result.current.recordError(new Error('Test error'));
      result.current.recordNetworkRequest('/api/test', 1000);
    });

    const report = act(() => {
      return result.current.getPerformanceReport();
    });

    expect(report.userInteractions).toBe(1);
    expect(report.errors).toBe(1);
    expect(report.networkRequests).toBe(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Performance report generated',
      'info',
      expect.objectContaining({
        userInteractions: 1,
        errors: 1,
        networkRequests: 1,
      })
    );
  });

  it('sets up PerformanceObserver on mount', () => {
    renderHook(() => usePerformance());

    expect(mockPerformanceObserver).toHaveBeenCalled();
    expect(mockObserver.observe).toHaveBeenCalledWith({
      entryTypes: ['navigation', 'resource'],
    });
  });

  it('cleans up PerformanceObserver on unmount', () => {
    const { unmount } = renderHook(() => usePerformance());

    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('handles navigation timing entries', () => {
    const mockNavigationEntry = {
      entryType: 'navigation',
      domContentLoadedEventStart: 100,
      domContentLoadedEventEnd: 200,
      loadEventStart: 300,
      loadEventEnd: 400,
      fetchStart: 0,
    };

    const mockObserverCallback = mockPerformanceObserver.mock.calls[0][0];
    
    act(() => {
      mockObserverCallback({
        getEntries: () => [mockNavigationEntry],
      });
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      'Navigation timing',
      'performance',
      'info',
      {
        domContentLoaded: 100,
        loadComplete: 100,
        totalTime: 400,
      }
    );
  });

  it('handles slow resource entries', () => {
    const mockResourceEntry = {
      entryType: 'resource',
      name: '/api/slow',
      duration: 2000,
      transferSize: 1024,
    };

    const mockObserverCallback = mockPerformanceObserver.mock.calls[0][0];
    
    act(() => {
      mockObserverCallback({
        getEntries: () => [mockResourceEntry],
      });
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      'Slow resource load',
      'performance',
      'warning',
      {
        name: '/api/slow',
        duration: 2000,
        size: 1024,
      }
    );
  });

  it('does not log fast resource entries', () => {
    const mockResourceEntry = {
      entryType: 'resource',
      name: '/api/fast',
      duration: 500,
      transferSize: 512,
    };

    const mockObserverCallback = mockPerformanceObserver.mock.calls[0][0];
    
    act(() => {
      mockObserverCallback({
        getEntries: () => [mockResourceEntry],
      });
    });

    expect(mockAddBreadcrumb).not.toHaveBeenCalledWith(
      'Slow resource load',
      'performance',
      'warning',
      expect.any(Object)
    );
  });
});
