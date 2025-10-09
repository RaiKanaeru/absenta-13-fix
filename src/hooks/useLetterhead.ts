import { useState, useEffect, useCallback } from 'react';

export interface LetterheadConfig {
  enabled: boolean;
  logo: string;
  logoLeftUrl: string;
  logoRightUrl: string;
  lines: string[];
  alignment: 'left' | 'center' | 'right';
}

const DEFAULT_LETTERHEAD: LetterheadConfig = {
  enabled: true,
  logo: "",
  logoLeftUrl: "",
  logoRightUrl: "",
  lines: [
    "PEMERINTAH DAERAH PROVINSI DKI JAKARTA",
    "DINAS PENDIDIKAN",
    "SMK NEGERI 13 JAKARTA",
    "Jl. Raya Bekasi Km. 18, Cakung, Jakarta Timur 13910"
  ],
  alignment: "center"
};

// Cache untuk menyimpan konfigurasi kop per reportKey
const letterheadCache: Map<string, LetterheadConfig> = new Map();
const cacheTimestamps: Map<string, number> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export function useLetterhead(reportKey?: string) {
  const [letterhead, setLetterhead] = useState<LetterheadConfig>(DEFAULT_LETTERHEAD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLetterhead = useCallback(async (forceRefresh = false) => {
    const cacheKey = reportKey || 'global';
    
    // Cek cache jika tidak force refresh
    if (!forceRefresh && letterheadCache.has(cacheKey)) {
      const timestamp = cacheTimestamps.get(cacheKey) || 0;
      if ((Date.now() - timestamp) < CACHE_DURATION) {
        const cached = letterheadCache.get(cacheKey)!;
        setLetterhead(cached);
        return cached;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      // Gunakan endpoint baru yang mendukung reportKey
      const url = reportKey 
        ? `/api/admin/letterhead?reportKey=${encodeURIComponent(reportKey)}`
        : '/api/admin/letterhead';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const config = data.data as LetterheadConfig;
        
        // Update cache
        letterheadCache.set(cacheKey, config);
        cacheTimestamps.set(cacheKey, Date.now());
        
        setLetterhead(config);
        return config;
      } else {
        throw new Error(data.error || 'Gagal memuat konfigurasi kop laporan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat konfigurasi';
      setError(errorMessage);
      console.error('Error fetching letterhead:', err);
      
      // Fallback ke default jika gagal
      setLetterhead(DEFAULT_LETTERHEAD);
      return DEFAULT_LETTERHEAD;
    } finally {
      setLoading(false);
    }
  }, [reportKey]);

  const refreshLetterhead = useCallback(() => {
    return fetchLetterhead(true);
  }, [fetchLetterhead]);

  // Load letterhead on mount
  useEffect(() => {
    fetchLetterhead();
  }, [fetchLetterhead]);

  return {
    letterhead,
    loading,
    error,
    fetchLetterhead,
    refreshLetterhead
  };
}

// Utility function untuk render letterhead HTML
export function renderLetterheadHTML(letterhead: LetterheadConfig): string {
  if (!letterhead?.enabled || !letterhead.lines || letterhead.lines.length === 0) {
    return '';
  }

  const alignment = letterhead.alignment || 'center';
  
  // Logo tengah (jika ada)
  const logoElement = letterhead.logo ? 
    `<img src="${letterhead.logo}" style="height:64px;object-fit:contain;margin:0 auto 8px;display:block;" alt="Logo" />` : '';
  
  // Logo kiri dan kanan
  const logoKiriElement = letterhead.logoLeftUrl ? 
    `<img src="${letterhead.logoLeftUrl}" style="height:64px;object-fit:contain;float:left;margin-right:20px;" alt="Logo Kiri" />` : '';
  
  const logoKananElement = letterhead.logoRightUrl ? 
    `<img src="${letterhead.logoRightUrl}" style="height:64px;object-fit:contain;float:right;margin-left:20px;" alt="Logo Kanan" />` : '';
  
  const lines = letterhead.lines
    .filter(line => line.trim().length > 0)
    .map((line, index) => {
      const style = index === 0 ? 'font-weight:bold;font-size:18px;' : 'font-size:14px;';
      return `<div style="${style}">${escapeHtml(line)}</div>`;
    })
    .join('');

  return `
    <div style="margin-bottom:20px;overflow:hidden;">
      ${logoKiriElement}
      ${logoKananElement}
      <div style="text-align:${alignment};clear:both;">
        ${logoElement}
        ${lines}
      </div>
    </div>
    <hr style="margin:20px 0;border:1px solid #ddd;" />
  `;
}

// Utility function untuk escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility function untuk mendapatkan konfigurasi kop dengan fallback
export function getLetterheadConfig(reportKey?: string): LetterheadConfig {
  const cacheKey = reportKey || 'global';
  return letterheadCache.get(cacheKey) || DEFAULT_LETTERHEAD;
}

// Utility function untuk clear cache (untuk testing atau refresh manual)
export function clearLetterheadCache(reportKey?: string): void {
  if (reportKey) {
    letterheadCache.delete(reportKey);
    cacheTimestamps.delete(reportKey);
  } else {
    letterheadCache.clear();
    cacheTimestamps.clear();
  }
}
