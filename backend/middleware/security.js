/**
 * Security Middleware untuk Absenta System
 * Implementasi HTTPS enforcement, security headers, dan proteksi lainnya
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * HTTPS Enforcement Middleware
 * Memaksa semua request menggunakan HTTPS di production
 */
export const enforceHTTPS = (req, res, next) => {
  // Hanya aktif di production
  if (process.env.NODE_ENV === 'production') {
    // Check jika request tidak menggunakan HTTPS
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      // Redirect ke HTTPS
      const httpsUrl = `https://${req.get('host')}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
  }
  next();
};

/**
 * Security Headers Middleware
 * Menggunakan Helmet untuk security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 tahun
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: []
  }
});

/**
 * Rate Limiting untuk Authentication
 * Mencegah brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login per IP
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Gunakan IP address atau user ID jika sudah login
    return req.ip || req.user?.id || 'anonymous';
  }
});

/**
 * Rate Limiting untuk API endpoints
 * Mencegah API abuse
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Rate Limiting untuk file upload
 * Mencegah abuse pada upload endpoint
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10, // Maksimal 10 upload per IP per jam
  message: {
    success: false,
    message: 'Terlalu banyak upload. Coba lagi dalam 1 jam.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CORS Configuration
 * Konfigurasi CORS yang aman
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Di development, allow semua origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Di production, hanya allow domain yang diizinkan
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'https://absenta.example.com',
      'https://admin.absenta.example.com'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 jam
};

/**
 * Request Size Limiter
 * Membatasi ukuran request body
 */
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSizeBytes = parseInt(maxSize.replace('mb', '')) * 1024 * 1024;
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request body terlalu besar',
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * IP Whitelist Middleware
 * Hanya allow IP tertentu untuk endpoint admin
 */
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    // Skip di development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak dari IP ini',
        code: 'IP_NOT_ALLOWED'
      });
    }
  };
};

/**
 * Security Logging Middleware
 * Log semua security-related events
 */
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[SECURITY] ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    // Log security events
    if (status === 401 || status === 403 || status === 429) {
      console.warn(`[SECURITY ALERT] ${req.method} ${req.url} - Status: ${status} - IP: ${req.ip} - Duration: ${duration}ms`);
    }
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`[PERFORMANCE] Slow request: ${req.method} ${req.url} - Duration: ${duration}ms`);
    }
  });
  
  next();
};

/**
 * Database Query Protection
 * Mencegah SQL injection dan query yang berbahaya
 */
export const queryProtection = (req, res, next) => {
  // Check untuk SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i
  ];
  
  const checkForSQLInjection = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(obj[key])) {
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Check request body, query, dan params
  if (checkForSQLInjection(req.body) || 
      checkForSQLInjection(req.query) || 
      checkForSQLInjection(req.params)) {
    
    console.warn(`[SECURITY ALERT] Potential SQL injection attempt from IP: ${req.ip}`);
    
    return res.status(400).json({
      success: false,
      message: 'Request mengandung karakter yang tidak diizinkan',
      code: 'INVALID_INPUT'
    });
  }
  
  next();
};

export default {
  enforceHTTPS,
  securityHeaders,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  corsOptions,
  requestSizeLimit,
  ipWhitelist,
  securityLogger,
  queryProtection
};
