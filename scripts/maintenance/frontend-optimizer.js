/**
 * Frontend Optimization System
 * Handles smart retry, offline mode, progressive loading, and bundle optimization
 */

import { EventEmitter } from 'events';

class FrontendOptimizer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            retryMultiplier: options.retryMultiplier || 2,
            maxRetryDelay: options.maxRetryDelay || 10000,
            offlineTimeout: options.offlineTimeout || 5000,
            cacheSize: options.cacheSize || 100,
            ...options
        };
        
        this.retryQueue = [];
        this.offlineCache = new Map();
        this.isOnline = navigator.onLine;
        this.retryTimer = null;
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('🚀 Frontend Optimizer initialized');
    }
    
    /**
     * Setup event listeners for online/offline detection
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.emit('online');
            this.processRetryQueue();
            console.log('🌐 Network connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.emit('offline');
            console.log('📴 Network connection lost');
        });
    }
    
    /**
     * Smart retry mechanism for failed requests
     */
    async smartRetry(requestFn, options = {}) {
        const {
            maxRetries = this.options.maxRetries,
            retryDelay = this.options.retryDelay,
            retryMultiplier = this.options.retryMultiplier,
            maxRetryDelay = this.options.maxRetryDelay,
            retryCondition = () => true
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.executeWithTimeout(requestFn, this.options.offlineTimeout);
                
                // Success - clear any cached retry
                this.clearRetryCache(requestFn);
                
                return result;
            } catch (error) {
                lastError = error;
                
                // Check if we should retry
                if (attempt === maxRetries || !retryCondition(error)) {
                    break;
                }
                
                // Calculate delay with exponential backoff
                const delay = Math.min(
                    retryDelay * Math.pow(retryMultiplier, attempt),
                    maxRetryDelay
                );
                
                console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
                
                // Wait before retry
                await this.sleep(delay);
            }
        }
        
        // All retries failed - add to retry queue if offline
        if (!this.isOnline) {
            this.addToRetryQueue(requestFn, options);
        }
        
        throw lastError;
    }
    
    /**
     * Execute request with timeout
     */
    async executeWithTimeout(requestFn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, timeout);
            
            requestFn()
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }
    
    /**
     * Add request to retry queue
     */
    addToRetryQueue(requestFn, options) {
        const retryItem = {
            requestFn,
            options,
            timestamp: Date.now(),
            attempts: 0
        };
        
        this.retryQueue.push(retryItem);
        this.emit('retryQueued', retryItem);
        
        console.log(`📝 Added request to retry queue (${this.retryQueue.length} items)`);
    }
    
    /**
     * Process retry queue when online
     */
    async processRetryQueue() {
        if (this.retryQueue.length === 0) return;
        
        console.log(`🔄 Processing ${this.retryQueue.length} queued requests`);
        
        const queue = [...this.retryQueue];
        this.retryQueue = [];
        
        for (const item of queue) {
            try {
                await this.smartRetry(item.requestFn, item.options);
                this.emit('retrySuccess', item);
            } catch (error) {
                // Re-queue if still failing
                item.attempts++;
                if (item.attempts < this.options.maxRetries) {
                    this.retryQueue.push(item);
                } else {
                    this.emit('retryFailed', { item, error });
                }
            }
        }
    }
    
    /**
     * Clear retry cache for successful request
     */
    clearRetryCache(requestFn) {
        // Implementation would depend on how requests are identified
        // This is a placeholder for cache clearing logic
    }
    
    /**
     * Offline mode with localStorage
     */
    setOfflineData(key, data) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            // Store in memory cache
            this.offlineCache.set(key, cacheData);
            
            // Store in localStorage
            localStorage.setItem(`offline_${key}`, JSON.stringify(cacheData));
            
            this.emit('offlineDataStored', { key, data });
        } catch (error) {
            console.error('Error storing offline data:', error);
        }
    }
    
    /**
     * Get offline data
     */
    getOfflineData(key) {
        try {
            // Check memory cache first
            if (this.offlineCache.has(key)) {
                return this.offlineCache.get(key).data;
            }
            
            // Check localStorage
            const stored = localStorage.getItem(`offline_${key}`);
            if (stored) {
                const cacheData = JSON.parse(stored);
                this.offlineCache.set(key, cacheData);
                return cacheData.data;
            }
            
            return null;
        } catch (error) {
            console.error('Error retrieving offline data:', error);
            return null;
        }
    }
    
    /**
     * Clear offline data
     */
    clearOfflineData(key) {
        this.offlineCache.delete(key);
        localStorage.removeItem(`offline_${key}`);
        this.emit('offlineDataCleared', { key });
    }
    
    /**
     * Progressive loading for large datasets
     */
    async progressiveLoad(loadFn, options = {}) {
        const {
            batchSize = 50,
            delay = 100,
            onProgress = () => {},
            onComplete = () => {},
            onError = () => {}
        } = options;
        
        try {
            const results = [];
            let offset = 0;
            let hasMore = true;
            
            while (hasMore) {
                const batch = await loadFn(offset, batchSize);
                
                if (batch.length === 0) {
                    hasMore = false;
                } else {
                    results.push(...batch);
                    offset += batchSize;
                    
                    // Emit progress
                    onProgress({
                        loaded: results.length,
                        batch: batch.length,
                        percentage: Math.min(100, (results.length / (results.length + batchSize)) * 100)
                    });
                    
                    // Delay between batches
                    if (hasMore && delay > 0) {
                        await this.sleep(delay);
                    }
                }
            }
            
            onComplete(results);
            return results;
        } catch (error) {
            onError(error);
            throw error;
        }
    }
    
    /**
     * Bundle size optimization utilities
     */
    optimizeBundle() {
        // Code splitting suggestions
        const suggestions = [
            'Use dynamic imports for large components',
            'Implement lazy loading for routes',
            'Split vendor and app bundles',
            'Use tree shaking for unused code',
            'Compress images and assets',
            'Enable gzip compression'
        ];
        
        this.emit('bundleOptimization', { suggestions });
        return suggestions;
    }
    
    /**
     * Performance monitoring
     */
    measurePerformance(name, fn) {
        const startTime = performance.now();
        
        return fn().then(result => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.emit('performanceMeasured', { name, duration });
            
            // Log slow operations
            if (duration > 1000) {
                console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        }).catch(error => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.emit('performanceError', { name, duration, error });
            throw error;
        });
    }
    
    /**
     * Network quality detection
     */
    detectNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false
        };
    }
    
    /**
     * Adaptive loading based on network quality
     */
    adaptiveLoad(loadFn, options = {}) {
        const networkQuality = this.detectNetworkQuality();
        
        // Adjust options based on network quality
        if (networkQuality.effectiveType === 'slow-2g' || networkQuality.effectiveType === '2g') {
            return {
                ...options,
                batchSize: Math.min(options.batchSize || 50, 20),
                delay: Math.max(options.delay || 100, 500),
                enableCompression: true
            };
        } else if (networkQuality.effectiveType === '3g') {
            return {
                ...options,
                batchSize: Math.min(options.batchSize || 50, 30),
                delay: Math.max(options.delay || 100, 200)
            };
        }
        
        return options;
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        return {
            isOnline: this.isOnline,
            retryQueueSize: this.retryQueue.length,
            offlineCacheSize: this.offlineCache.size,
            networkQuality: this.detectNetworkQuality(),
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    /**
     * Get memory usage (if available)
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
        }
        
        this.retryQueue = [];
        this.offlineCache.clear();
        
        console.log('🧹 Frontend Optimizer cleaned up');
    }
}

export default FrontendOptimizer;
