/**
 * HTTP utility functions dengan authentication
 * Menangani Bearer token dan credentials untuk semua request
 */

// Base URL untuk API - menggunakan environment variable atau fallback ke proxy
// Dalam development, Vite proxy akan menangani /api/* ke http://localhost:3001
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Mendapatkan headers authentication yang diperlukan
 * @returns Object berisi headers dengan Authorization Bearer token
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json' 
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * HTTP GET request dengan authentication
 * @param url - URL endpoint
 * @param init - RequestInit options tambahan
 * @returns Promise<Response>
 */
export async function httpGet(url: string, init: RequestInit = {}): Promise<Response> {
  // Tambahkan base URL jika URL tidak dimulai dengan http
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...init,
    method: 'GET',
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
    credentials: 'include',
  });
  
  return response;
}

/**
 * HTTP POST request dengan authentication
 * @param url - URL endpoint
 * @param data - Data yang akan dikirim
 * @param init - RequestInit options tambahan
 * @returns Promise<Response>
 */
export async function httpPost(url: string, data: any, init: RequestInit = {}): Promise<Response> {
  // Tambahkan base URL jika URL tidak dimulai dengan http
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...init,
    method: 'POST',
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  return response;
}

/**
 * HTTP PUT request dengan authentication
 * @param url - URL endpoint
 * @param data - Data yang akan dikirim
 * @param init - RequestInit options tambahan
 * @returns Promise<Response>
 */
export async function httpPut(url: string, data: any, init: RequestInit = {}): Promise<Response> {
  // Tambahkan base URL jika URL tidak dimulai dengan http
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...init,
    method: 'PUT',
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  return response;
}

/**
 * HTTP DELETE request dengan authentication
 * @param url - URL endpoint
 * @param init - RequestInit options tambahan
 * @returns Promise<Response>
 */
export async function httpDelete(url: string, init: RequestInit = {}): Promise<Response> {
  // Tambahkan base URL jika URL tidak dimulai dengan http
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...init,
    method: 'DELETE',
    headers: { ...getAuthHeaders(), ...(init.headers || {}) },
    credentials: 'include',
  });
  
  return response;
}

/**
 * Helper untuk menangani response error dengan pesan yang jelas
 * @param response - Response object
 * @param context - Konteks error untuk debugging
 * @throws Error jika response tidak OK
 */
export async function handleResponseError(response: Response, context: string = 'Request'): Promise<void> {
  if (!response.ok) {
    let errorMessage = `${context} failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Jika response bukan JSON, gunakan status text
      errorMessage = `${context} failed: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
}
