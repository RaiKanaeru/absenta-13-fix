// tests/unit/utils/api.test.ts
import { apiCall } from '../../../src/lib/api';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('apiCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  it('makes GET request successfully', async () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await apiCall('/api/test', { method: 'GET' });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('makes POST request with body', async () => {
    const mockResponse = { success: true, data: { id: 1 } };
    const requestBody = { name: 'Test' };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await apiCall('/api/test', {
      method: 'POST',
      body: requestBody,
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
      },
      body: JSON.stringify(requestBody),
    });
    expect(result).toEqual(mockResponse);
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiCall('/api/test')).rejects.toThrow('Network error');
  });

  it('handles HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(apiCall('/api/test')).rejects.toThrow('HTTP error! status: 404');
  });

  it('handles JSON parsing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(apiCall('/api/test')).rejects.toThrow('Invalid JSON');
  });

  it('includes authorization header when token exists', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiCall('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token',
      },
    });
  });

  it('does not include authorization header when no token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiCall('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('handles custom headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await apiCall('/api/test', {
      method: 'GET',
      headers: {
        'Custom-Header': 'custom-value',
      },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token',
        'Custom-Header': 'custom-value',
      },
    });
  });

  it('handles different HTTP methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiCall('/api/test', { method: method as any });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
      });
    }
  });

  it('handles empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(null),
    });

    const result = await apiCall('/api/test');
    expect(result).toBeNull();
  });

  it('handles text response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('Success'),
    });

    const result = await apiCall('/api/test');
    expect(result).toBe('Success');
  });

  it('handles timeout', async () => {
    jest.useFakeTimers();
    
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        }), 10000);
      })
    );

    const promise = apiCall('/api/test');
    
    // Fast-forward time to trigger timeout
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await expect(promise).resolves.toEqual({ success: true });
    
    jest.useRealTimers();
  });
});
