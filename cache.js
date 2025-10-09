// ================================================
// REDIS CACHE HELPER
// ================================================

import 'dotenv/config';
import Redis from 'ioredis';

// Redis configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300,
    enableOfflineQueue: true,
    maxLoadingTimeout: 10000,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
};

// Create Redis client - Disabled temporarily to avoid errors
let redis = null;
try {
    redis = new Redis(redisConfig);
} catch (error) {
    console.log('⚠️ Redis disabled due to configuration error:', error.message);
    redis = null;
}

// Cache helper functions
export const cache = {
    // Set cache with TTL
    async set(key, value, ttlSeconds = 3600) {
        try {
            if (!redis) {
                console.log('⚠️ Redis disabled, skipping cache set');
                return false;
            }
            if (redis.status !== 'ready') {
                console.log('⚠️ Redis not ready, skipping cache set');
                return false;
            }
            const serializedValue = JSON.stringify(value);
            await redis.setex(key, ttlSeconds, serializedValue);
            return true;
        } catch (error) {
            console.error('❌ Cache set error:', error);
            return false;
        }
    },

    // Get cache
    async get(key) {
        try {
            if (!redis) {
                console.log('⚠️ Redis disabled, skipping cache get');
                return null;
            }
            if (redis.status !== 'ready') {
                console.log('⚠️ Redis not ready, skipping cache get');
                return null;
            }
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('❌ Cache get error:', error);
            return null;
        }
    },

    // Delete cache
    async del(key) {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            console.error('❌ Cache delete error:', error);
            return false;
        }
    },

    // Delete multiple keys with pattern
    async delPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return keys.length;
        } catch (error) {
            console.error('❌ Cache delete pattern error:', error);
            return 0;
        }
    },

    // Check if key exists
    async exists(key) {
        try {
            const result = await redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('❌ Cache exists error:', error);
            return false;
        }
    },

    // Get TTL
    async ttl(key) {
        try {
            return await redis.ttl(key);
        } catch (error) {
            console.error('❌ Cache TTL error:', error);
            return -1;
        }
    },

    // Increment counter
    async incr(key, ttlSeconds = 3600) {
        try {
            const result = await redis.incr(key);
            if (result === 1) {
                await redis.expire(key, ttlSeconds);
            }
            return result;
        } catch (error) {
            console.error('❌ Cache incr error:', error);
            return 0;
        }
    },

    // Get cache stats
    async getStats() {
        try {
            if (!redis || redis.status !== 'ready') {
                return {
                    status: 'initializing',
                    memory: 'N/A',
                    keyspace: 'N/A',
                    connected: false
                };
            }
            
            const info = await redis.info('memory');
            const keyspace = await redis.info('keyspace');
            return {
                status: 'connected',
                memory: info,
                keyspace: keyspace,
                connected: true
            };
        } catch (error) {
            console.error('❌ Cache stats error:', error);
            return {
                status: 'error',
                memory: 'N/A',
                keyspace: 'N/A',
                connected: false,
                error: error.message
            };
        }
    },

    // Close connection
    async close() {
        try {
            if (redis && redis.status === 'ready') {
                await redis.quit();
                console.log('✅ Redis connection closed');
            } else {
                console.log('✅ Redis connection already closed');
            }
        } catch (error) {
            console.error('❌ Error closing Redis connection:', error);
        }
    }
};

// Cache middleware for Express
export const cacheMiddleware = (ttlSeconds = 3600, keyGenerator = null) => {
    return async (req, res, next) => {
        try {
            // Generate cache key
            const cacheKey = keyGenerator ? 
                keyGenerator(req) : 
                `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

            // Check cache
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                console.log(`📦 Cache hit: ${cacheKey}`);
                return res.json({
                    success: true,
                    data: cachedData,
                    cached: true,
                    cacheKey
                });
            }

            // Store original res.json
            const originalJson = res.json.bind(res);
            
            // Override res.json to cache response
            res.json = function(data) {
                // Cache the response
                cache.set(cacheKey, data, ttlSeconds).then(() => {
                    console.log(`💾 Cached: ${cacheKey} (TTL: ${ttlSeconds}s)`);
                }).catch(err => {
                    console.error('❌ Cache set error:', err);
                });

                // Send response
                return originalJson({
                    success: true,
                    data: data,
                    cached: false,
                    cacheKey
                });
            };

            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error);
            next();
        }
    };
};

// Cache invalidation helpers
export const cacheInvalidation = {
    // Invalidate user-related cache
    async invalidateUser(userId) {
        const patterns = [
            `cache:*:user:${userId}:*`,
            `cache:*:profile:${userId}:*`,
            `cache:*:dashboard:${userId}:*`
        ];
        
        for (const pattern of patterns) {
            await cache.delPattern(pattern);
        }
    },

    // Invalidate admin cache
    async invalidateAdmin() {
        const patterns = [
            `cache:*:admin:*`,
            `cache:*:dashboard:*`,
            `cache:*:stats:*`
        ];
        
        for (const pattern of patterns) {
            await cache.delPattern(pattern);
        }
    },

    // Invalidate specific endpoint cache
    async invalidateEndpoint(endpoint) {
        const pattern = `cache:*:${endpoint}:*`;
        await cache.delPattern(pattern);
    }
};

// Handle Redis connection events
redis.on('connect', () => {
    console.log('🔗 Redis connected');
});

redis.on('ready', () => {
    console.log('✅ Redis ready');
});

redis.on('error', (error) => {
    console.error('❌ Redis error:', error);
});

redis.on('close', () => {
    console.log('🔌 Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

export default cache;

