import redisClient from '../utils/redisClient.js';

/**
 * Cache Middleware for API responses
 * Caches GET requests to reduce database load
 */

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
    const userId = req.user?.id || 'anonymous';
    const role = req.user?.role || 'guest';
    const path = req.originalUrl || req.url;
    
    // Include query parameters in cache key
    const queryString = Object.keys(req.query).length > 0 
        ? JSON.stringify(req.query) 
        : '';
    
    return `cache:${role}:${userId}:${path}:${queryString}`;
};

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 * @param {function} keyGenerator - Custom key generator function
 */
export const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req);
            
            // Try to get from cache
            const cachedData = await redisClient.get(cacheKey);
            
            if (cachedData) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json({
                    ...cachedData,
                    fromCache: true,
                    cacheKey: cacheKey
                });
            }
            
            console.log(`❌ Cache MISS: ${cacheKey}`);
            
            // Store original res.json
            const originalJson = res.json.bind(res);
            
            // Override res.json to cache the response
            res.json = (data) => {
                // Cache the response
                redisClient.set(cacheKey, data, ttl).catch(err => {
                    console.error('Failed to cache response:', err);
                });
                
                // Send response with cache info
                return originalJson({
                    ...data,
                    fromCache: false
                });
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            // Continue without caching on error
            next();
        }
    };
};

/**
 * Invalidate cache by pattern
 */
export const invalidateCache = async (pattern) => {
    try {
        await redisClient.delPattern(pattern);
        console.log(`🗑️  Cache invalidated: ${pattern}`);
        return true;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return false;
    }
};

/**
 * Invalidate cache for specific user
 */
export const invalidateUserCache = async (userId, role = '*') => {
    const pattern = `cache:${role}:${userId}:*`;
    return await invalidateCache(pattern);
};

/**
 * Invalidate cache for specific endpoint
 */
export const invalidateEndpointCache = async (endpoint) => {
    const pattern = `cache:*:*:${endpoint}*`;
    return await invalidateCache(pattern);
};

/**
 * Cache invalidation middleware
 * Automatically invalidates cache after POST/PUT/DELETE operations
 */
export const cacheInvalidationMiddleware = (patterns = []) => {
    return async (req, res, next) => {
        // Only for modifying operations
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            return next();
        }

        // Store original res.json
        const originalJson = res.json.bind(res);
        
        // Override res.json to invalidate cache after successful response
        res.json = async (data) => {
            // Only invalidate if response was successful
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Invalidate specified patterns
                for (const pattern of patterns) {
                    await invalidateCache(pattern);
                }
                
                // Also invalidate user-specific cache
                if (req.user) {
                    await invalidateUserCache(req.user.id, req.user.role);
                }
            }
            
            return originalJson(data);
        };
        
        next();
    };
};

/**
 * Specific cache patterns for common endpoints
 */
export const CachePatterns = {
    SCHEDULES: 'cache:*:*:/api/guru/jadwal*',
    STUDENTS: 'cache:*:*:/api/admin/siswa-perwakilan*',
    TEACHERS: 'cache:*:*:/api/admin/guru*',
    ATTENDANCE: 'cache:*:*:/api/attendance/*',
    LETTERHEAD: 'cache:*:*:/api/admin/letterhead*',
    EXPORTS: 'cache:*:*:/api/export/*',
    ALL: 'cache:*'
};

export default cacheMiddleware;




