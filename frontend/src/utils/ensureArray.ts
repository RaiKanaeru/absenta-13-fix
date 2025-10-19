/**
 * Utility to normalize API responses that may return arrays directly
 * or wrapped in objects with { data, pagination } structure
 * 
 * Handles multiple common response patterns:
 * - Direct array: [item1, item2, ...]
 * - Wrapped in data: { data: [...], pagination: {...} }
 * - Wrapped in items: { items: [...] }
 * - Wrapped in results: { results: [...] }
 * - Success wrapper: { success: true, data: [...] }
 * 
 * @param value - Any value that might be an array or contain an array
 * @returns Always returns an array (empty array if value is invalid)
 * 
 * @example
 * ```typescript
 * // Direct array
 * const teachers = ensureArray<Teacher>([{id: 1, name: "John"}]);
 * // => [{id: 1, name: "John"}]
 * 
 * // Wrapped in data + pagination
 * const teachers = ensureArray<Teacher>({ data: [{id: 1}], pagination: {...} });
 * // => [{id: 1}]
 * 
 * // Invalid/null
 * const teachers = ensureArray<Teacher>(null);
 * // => []
 * ```
 */
export function ensureArray<T>(value: unknown): T[] {
  // Already an array - return as is
  if (Array.isArray(value)) {
    return value;
  }
  
  // Check if value is object and has nested array
  if (value && typeof value === 'object') {
    const obj = value as any;
    
    // Check common property names that might contain the array
    const arrayKeys = ['data', 'items', 'results', 'rows', 'records'];
    
    for (const key of arrayKeys) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
    }
    
    // If object has success flag, try to extract data
    if (obj.success === true && obj.data !== undefined) {
      // Recursively call to handle nested structures
      return ensureArray<T>(obj.data);
    }
  }
  
  // Default: return empty array for safety
  return [];
}

/**
 * Normalize API response to extract data and pagination
 * 
 * @param response - API response that may have { data, pagination } structure
 * @returns Object with data array and optional pagination info
 * 
 * @example
 * ```typescript
 * const result = normalizeApiResponse<Teacher>(response);
 * console.log(result.data); // Always an array
 * console.log(result.pagination); // May be undefined
 * ```
 */
export function normalizeApiResponse<T>(response: unknown): {
  data: T[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
} {
  // If response is already normalized (has data array)
  if (response && typeof response === 'object') {
    const obj = response as any;
    
    // Handle { success: true, data: [...], pagination: {...} }
    if (obj.success === true) {
      return {
        data: ensureArray<T>(obj.data),
        pagination: obj.pagination
      };
    }
    
    // Handle { data: [...], pagination: {...} }
    if (obj.data !== undefined) {
      return {
        data: ensureArray<T>(obj.data),
        pagination: obj.pagination
      };
    }
  }
  
  // If response is direct array
  if (Array.isArray(response)) {
    return {
      data: response
    };
  }
  
  // Default: empty array
  return {
    data: []
  };
}

/**
 * Safe array find with fallback
 * 
 * @param array - Array or unknown value
 * @param predicate - Find predicate function
 * @returns Found item or null
 * 
 * @example
 * ```typescript
 * const found = safeFind(teachers, t => t.id === 123);
 * // Returns item or null (never throws)
 * ```
 */
export function safeFind<T>(
  array: unknown,
  predicate: (item: T, index: number, array: T[]) => boolean
): T | null {
  const arr = ensureArray<T>(array);
  const found = arr.find(predicate);
  return found ?? null;
}

/**
 * Safe array filter
 * 
 * @param array - Array or unknown value
 * @param predicate - Filter predicate function
 * @returns Filtered array (never throws)
 * 
 * @example
 * ```typescript
 * const filtered = safeFilter(teachers, t => t.active === true);
 * // Always returns array
 * ```
 */
export function safeFilter<T>(
  array: unknown,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  const arr = ensureArray<T>(array);
  return arr.filter(predicate);
}

/**
 * Safe array map
 * 
 * @param array - Array or unknown value
 * @param mapper - Map function
 * @returns Mapped array (never throws)
 */
export function safeMap<T, R>(
  array: unknown,
  mapper: (item: T, index: number, array: T[]) => R
): R[] {
  const arr = ensureArray<T>(array);
  return arr.map(mapper);
}
