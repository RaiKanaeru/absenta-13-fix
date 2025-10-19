/**
 * Security Utility - Security helpers and validators
 * Provides security-related utilities for authentication, authorization, and data protection
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Password security utilities
 */
export const passwordSecurity = {
    /**
     * Hash password with salt
     * @param {string} password - Plain text password
     * @param {number} rounds - Bcrypt rounds (default: 10)
     * @returns {Promise<string>} Hashed password
     */
    async hash(password, rounds = 10) {
        try {
            return await bcrypt.hash(password, rounds);
        } catch (error) {
            throw new Error('Password hashing failed');
        }
    },

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Password match result
     */
    async compare(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error('Password comparison failed');
        }
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validateStrength(password) {
        const errors = [];
        const requirements = {
            minLength: 6,
            maxLength: 50,
            requireUppercase: false,
            requireLowercase: false,
            requireNumbers: false,
            requireSpecialChars: false
        };

        if (password.length < requirements.minLength) {
            errors.push(`Password must be at least ${requirements.minLength} characters long`);
        }

        if (password.length > requirements.maxLength) {
            errors.push(`Password must be no more than ${requirements.maxLength} characters long`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculateStrength(password)
        };
    },

    /**
     * Calculate password strength score
     * @param {string} password - Password to score
     * @returns {number} Strength score (0-100)
     */
    calculateStrength(password) {
        let score = 0;
        
        // Length bonus
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 10;
        
        // Character variety bonus
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[^a-zA-Z0-9]/.test(password)) score += 20;
        
        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
        if (/123|abc|qwe/i.test(password)) score -= 10; // Common patterns
        
        return Math.max(0, Math.min(100, score));
    }
};

/**
 * Input sanitization utilities
 */
export const sanitization = {
    /**
     * Sanitize string input
     * @param {string} input - Input string
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized string
     */
    sanitizeString(input, options = {}) {
        if (typeof input !== 'string') return '';
        
        let sanitized = input.trim();
        
        // Remove HTML tags
        if (options.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }
        
        // Remove special characters
        if (options.removeSpecialChars) {
            sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
        }
        
        // Limit length
        if (options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }
        
        return sanitized;
    },

    /**
     * Sanitize email
     * @param {string} email - Email to sanitize
     * @returns {string} Sanitized email
     */
    sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        
        return email.toLowerCase().trim();
    },

    /**
     * Sanitize phone number
     * @param {string} phone - Phone number to sanitize
     * @returns {string} Sanitized phone number
     */
    sanitizePhone(phone) {
        if (typeof phone !== 'string') return '';
        
        // Remove all non-digit characters except +
        return phone.replace(/[^\d+]/g, '');
    }
};

/**
 * Rate limiting utilities
 */
export const rateLimiting = {
    /**
     * Simple in-memory rate limiter
     */
    memoryStore: new Map(),

    /**
     * Check if request is rate limited
     * @param {string} key - Rate limit key (usually IP or user ID)
     * @param {number} limit - Request limit
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Object} Rate limit result
     */
    check(key, limit = 100, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get existing requests for this key
        const requests = this.memoryStore.get(key) || [];
        
        // Filter requests within the time window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (validRequests.length >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: Math.min(...validRequests) + windowMs
            };
        }
        
        // Add current request
        validRequests.push(now);
        this.memoryStore.set(key, validRequests);
        
        return {
            allowed: true,
            remaining: limit - validRequests.length,
            resetTime: now + windowMs
        };
    },

    /**
     * Clear expired entries
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [key, requests] of this.memoryStore.entries()) {
            const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
            
            if (validRequests.length === 0) {
                this.memoryStore.delete(key);
            } else {
                this.memoryStore.set(key, validRequests);
            }
        }
    }
};

/**
 * Token utilities
 */
export const tokenUtils = {
    /**
     * Generate random token
     * @param {number} length - Token length
     * @returns {string} Random token
     */
    generate(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    },

    /**
     * Generate secure random string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    generateSecure(length = 16) {
        return crypto.randomBytes(length).toString('base64url');
    },

    /**
     * Hash token for storage
     * @param {string} token - Token to hash
     * @returns {string} Hashed token
     */
    hash(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};

/**
 * SQL injection prevention
 */
export const sqlSecurity = {
    /**
     * Validate SQL parameter
     * @param {any} param - Parameter to validate
     * @returns {boolean} Is parameter safe
     */
    validateParam(param) {
        if (typeof param === 'string') {
            // Check for common SQL injection patterns
            const dangerousPatterns = [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
                /(--|\/\*|\*\/)/,
                /(\b(OR|AND)\b.*\b(OR|AND)\b)/i,
                /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/i
            ];
            
            return !dangerousPatterns.some(pattern => pattern.test(param));
        }
        
        return true;
    },

    /**
     * Escape SQL string
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escape(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\0/g, '\\0')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\x1a/g, '\\Z');
    }
};

/**
 * XSS prevention
 */
export const xssProtection = {
    /**
     * Escape HTML characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return str;
        
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return str.replace(/[&<>"'/]/g, match => htmlEscapes[match]);
    },

    /**
     * Validate and sanitize HTML content
     * @param {string} html - HTML content
     * @returns {string} Sanitized HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        
        // Remove script tags and their content
        let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove javascript: protocols
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Remove on* event handlers
        sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
        
        return sanitized;
    }
};

/**
 * Security headers
 */
export const securityHeaders = {
    /**
     * Get security headers
     * @returns {Object} Security headers
     */
    getHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
    }
};

/**
 * Security middleware factory
 * @param {Object} options - Security options
 * @returns {Function} Express middleware
 */
export const createSecurityMiddleware = (options = {}) => {
    return (req, res, next) => {
        // Add security headers
        const headers = securityHeaders.getHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        
        // Rate limiting
        const ip = req.ip || req.connection.remoteAddress;
        const rateLimit = rateLimiting.check(ip, options.rateLimit || 100, options.windowMs || 900000);
        
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            });
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', options.rateLimit || 100);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);
        
        next();
    };
};
