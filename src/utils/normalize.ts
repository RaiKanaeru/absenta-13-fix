/**
 * Utility functions untuk normalisasi data list yang inkonsisten
 * Menangani format response API yang berbeda-beda
 */

/**
 * Memastikan value adalah array, menangani berbagai format response
 * @param value - Data yang mungkin array atau object dengan property data/items/results
 * @returns Array yang aman untuk operasi filter, map, dll
 */
export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  
  if (value && typeof value === 'object') {
    const v: any = value;
    if (Array.isArray(v.data)) return v.data as T[];
    if (Array.isArray(v.items)) return v.items as T[];
    if (Array.isArray(v.results)) return v.results as T[];
  }
  
  return [];
}

/**
 * Normalisasi response list dengan pagination
 * @param value - Data yang mungkin array atau object dengan pagination
 * @returns Object dengan items array dan pagination info
 */
export function normalizeList<T>(value: unknown): { items: T[]; pagination?: any } {
  if (Array.isArray(value)) return { items: value as T[] };
  
  if (value && typeof value === 'object') {
    const v: any = value;
    const items = Array.isArray(v.data)
      ? v.data
      : Array.isArray(v.items)
      ? v.items
      : Array.isArray(v.results)
      ? v.results
      : [];
    return { items, pagination: v.pagination };
  }
  
  return { items: [] };
}

/**
 * Helper untuk mendapatkan value yang aman untuk Select component
 * @param value - Value yang mungkin null, undefined, atau empty string
 * @returns String yang valid untuk Select.Item value prop
 */
export function getSelectValue(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

/**
 * Helper untuk memastikan item memiliki ID yang valid
 * @param item - Object yang mungkin memiliki id, kode, atau property identifier lain
 * @returns Boolean apakah item memiliki identifier yang valid
 */
export function hasValidId(item: any): boolean {
  return !!(item?.id || item?.kode || item?.value);
}
































