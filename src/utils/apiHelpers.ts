/**
 * API Helpers for consistent authentication and error handling
 */

/**
 * Get authorization headers with Bearer token from localStorage
 * 
 * @returns Headers object with Authorization and Content-Type
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Enhanced fetch with automatic auth headers and credentials
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options (will be merged with auth headers)
 * @returns Fetch response
 * 
 * @example
 * ```typescript
 * const response = await fetchWithAuth('/api/admin/letterhead');
 * const data = await response.json();
 * ```
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  // Merge provided headers with auth headers
  const mergedHeaders = {
    ...authHeaders,
    ...(options.headers || {})
  };
  
  return fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include' // Include cookies for httpOnly token
  });
}

/**
 * Fetch JSON data with automatic auth and error handling
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error with user-friendly message
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await fetchJsonWithAuth('/api/admin/guru');
 *   console.log(data.data); // Array of teachers
 * } catch (error) {
 *   console.error(error.message); // User-friendly error
 * }
 * ```
 */
export async function fetchJsonWithAuth<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetchWithAuth(url, options);
  
  if (!response.ok) {
    // Handle specific error codes
    if (response.status === 401) {
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
    
    if (response.status === 403) {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    
    if (response.status === 404) {
      throw new Error('Data yang diminta tidak ditemukan.');
    }
    
    if (response.status === 413) {
      throw new Error('File terlalu besar. Silakan gunakan file yang lebih kecil.');
    }
    
    if (response.status === 500) {
      throw new Error('Terjadi kesalahan server. Silakan coba lagi nanti.');
    }
    
    // Try to parse error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    } catch (parseError) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  
  return response.json();
}

/**
 * POST request with auth and JSON body
 * 
 * @param url - API endpoint URL
 * @param body - Request body (will be JSON.stringify'd)
 * @returns Parsed JSON response
 */
export async function postJsonWithAuth<T = any>(
  url: string,
  body: any
): Promise<T> {
  return fetchJsonWithAuth<T>(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * PUT request with auth and JSON body
 */
export async function putJsonWithAuth<T = any>(
  url: string,
  body: any
): Promise<T> {
  return fetchJsonWithAuth<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/**
 * DELETE request with auth
 */
export async function deleteWithAuth<T = any>(
  url: string
): Promise<T> {
  return fetchJsonWithAuth<T>(url, {
    method: 'DELETE'
  });
}

/**
 * Check if error is auth-related and should trigger logout
 * 
 * @param error - Error object or message
 * @returns True if error is auth-related
 */
export function isAuthError(error: any): boolean {
  const message = typeof error === 'string' ? error : error?.message || '';
  
  return (
    message.includes('Sesi Anda telah berakhir') ||
    message.includes('Unauthorized') ||
    message.includes('401') ||
    message.includes('token')
  );
}

/**
 * Safe value extractor for Select components
 * Ensures value is always a string and not empty/undefined
 * 
 * @param value - Value to convert
 * @param fallback - Fallback value (default: "0")
 * @returns String value safe for Select.Item
 * 
 * @example
 * ```typescript
 * <Select.Item value={safeSelectValue(class.id)}>
 *   {class.nama}
 * </Select.Item>
 * ```
 */
export function safeSelectValue(value: any, fallback: string = "0"): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

/**
 * Safe number parser for Select component values
 * 
 * @param value - String value from Select
 * @param fallback - Fallback number (default: 0)
 * @returns Parsed number
 */
export function parseSelectValue(value: string, fallback: number = 0): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}
