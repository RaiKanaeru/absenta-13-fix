// API utility functions for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  cached?: boolean;
  cacheKey?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

// Generic API call function
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
        message: errorData.message,
        details: errorData.details
      };
      throw error;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    if (error instanceof Error) {
      const apiError: ApiError = {
        success: false,
        error: error.message,
        message: 'Network error occurred'
      };
      throw apiError;
    }
    throw error;
  }
};

// Specific API methods
export const api = {
  // GET request
  get: <T = any>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),
  
  // POST request
  post: <T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  // PUT request
  put: <T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  // DELETE request
  delete: <T = any>(endpoint: string) => 
    apiCall<T>(endpoint, { method: 'DELETE' }),
};

// Specific endpoint functions
export const endpoints = {
  // Authentication
  login: (credentials: { username: string; password: string }) => 
    api.post('/api/login', credentials),
  
  logout: () => api.post('/api/logout'),
  
  // Profile management
  updateProfile: (role: 'siswa' | 'guru' | 'admin', data: any) => 
    api.put(`/api/${role}/update-profile`, data),
  
  // Admin - Guru management
  getGuru: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get(`/api/admin/guru${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  createGuru: (data: any) => api.post('/api/admin/guru', data),
  
  updateGuru: (id: string, data: any) => api.put(`/api/admin/guru/${id}`, data),
  
  deleteGuru: (id: string) => api.delete(`/api/admin/guru/${id}`),
  
  // Admin - Siswa management
  getSiswa: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get(`/api/admin/siswa${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  createSiswa: (data: any) => api.post('/api/admin/siswa', data),
  
  updateSiswa: (id: string, data: any) => api.put(`/api/admin/siswa/${id}`, data),
  
  deleteSiswa: (id: string) => api.delete(`/api/admin/siswa/${id}`),
  
  // Admin - Mapel management
  getMapel: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get(`/api/admin/mapel${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  createMapel: (data: any) => api.post('/api/admin/mapel', data),
  
  updateMapel: (id: string, data: any) => api.put(`/api/admin/mapel/${id}`, data),
  
  deleteMapel: (id: string) => api.delete(`/api/admin/mapel/${id}`),
  
  // Admin - Kelas management
  getKelas: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get(`/api/admin/kelas${params ? '?' + new URLSearchParams(params as any).toString() : ''}`),
  
  createKelas: (data: any) => api.post('/api/admin/kelas', data),
  
  updateKelas: (id: string, data: any) => api.put(`/api/admin/kelas/${id}`, data),
  
  deleteKelas: (id: string) => api.delete(`/api/admin/kelas/${id}`),
  
  // Dashboard
  getDashboardStats: () => api.get('/api/dashboard/stats'),
  
  getDashboardChart: (period?: string) => 
    api.get(`/api/dashboard/chart${period ? '?period=' + period : ''}`),
  
  // Health check
  getHealth: () => api.get('/api/health'),
};

export default apiCall;
