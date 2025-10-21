import { createClient } from 'redis';

/**
 * Redis Client Utility
 * Centralized Redis connection management for Absenta system
 */
class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            // Redis configuration from environment
            const redisConfig = {
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    reconnectStrategy: (retries) => {
                        if (retries > this.maxRetries) {
                            console.error('❌ Redis: Max reconnection attempts reached');
                            return new Error('Redis reconnection failed');
                        }
                        
                        const delay = Math.min(retries * 100, 3000);
                        console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries}/${this.maxRetries})`);
                        return delay;
                    }
                },
                password: process.env.REDIS_PASSWORD || undefined,
                database: parseInt(process.env.REDIS_DB || '0')
            };

            this.client = createClient(redisConfig);

            // Error handlers
            this.client.on('error', (err) => {
                console.error('❌ Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('🔗 Redis: Connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis: Connected and ready');
                this.isConnected = true;
                this.retryCount = 0;
            });

            this.client.on('reconnecting', () => {
                console.log('🔄 Redis: Reconnecting...');
                this.retryCount++;
            });

            this.client.on('end', () => {
                console.log('🔌 Redis: Connection closed');
                this.isConnected = false;
            });

            await this.client.connect();
            
            // Test connection
            await this.ping();
            
            return true;
        } catch (error) {
            console.error('❌ Redis connection failed:', error.message);
            console.warn('⚠️  Running without Redis cache (fallback to in-memory)');
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Ping Redis to check connection
     */
    async ping() {
        if (!this.client) return false;
        
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('❌ Redis ping failed:', error.message);
            return false;
        }
    }

    /**
     * Get value from cache
     */
    async get(key) {
        if (!this.isConnected || !this.client) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            console.error(`❌ Redis GET error for key "${key}":`, error.message);
            return null;
        }
    }

    /**
     * Set value in cache with TTL
     */
    async set(key, value, ttl = 3600) {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            await this.client.setEx(key, ttl, serialized);
            return true;
        } catch (error) {
            console.error(`❌ Redis SET error for key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Delete key from cache
     */
    async del(key) {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`❌ Redis DEL error for key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern
     */
    async delPattern(pattern) {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log(`🗑️  Redis: Deleted ${keys.length} keys matching pattern "${pattern}"`);
            }
            return true;
        } catch (error) {
            console.error(`❌ Redis DEL pattern error for "${pattern}":`, error.message);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`❌ Redis EXISTS error for key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Get TTL of a key
     */
    async ttl(key) {
        if (!this.isConnected || !this.client) {
            return -1;
        }

        try {
            return await this.client.ttl(key);
        } catch (error) {
            console.error(`❌ Redis TTL error for key "${key}":`, error.message);
            return -1;
        }
    }

    /**
     * Flush all cache (use with caution)
     */
    async flushAll() {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            await this.client.flushDb();
            console.log('🗑️  Redis: All cache cleared');
            return true;
        } catch (error) {
            console.error('❌ Redis FLUSH error:', error.message);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.isConnected || !this.client) {
            return {
                connected: false,
                keys: 0,
                memory: 0,
                uptime: 0
            };
        }

        try {
            const info = await this.client.info();
            const dbSize = await this.client.dbSize();
            
            return {
                connected: true,
                keys: dbSize,
                info: info,
                uptime: this.client.isReady ? 'ready' : 'not ready'
            };
        } catch (error) {
            console.error('❌ Redis STATS error:', error.message);
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * Disconnect Redis
     */
    async disconnect() {
        if (this.client) {
            try {
                await this.client.quit();
                console.log('✅ Redis: Disconnected gracefully');
            } catch (error) {
                console.error('❌ Redis disconnect error:', error.message);
            }
        }
    }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;


