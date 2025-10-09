/**
 * API Helper for Tests
 * Utilities untuk testing API endpoints
 */

import fetch from 'node-fetch';

export class ApiHelper {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: this.defaultHeaders
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            
            return {
                status: response.status,
                statusText: response.statusText,
                data: data,
                headers: response.headers,
                ok: response.ok
            };
        } catch (error) {
            return {
                status: 0,
                statusText: 'Network Error',
                data: { error: error.message },
                headers: {},
                ok: false,
                error: error
            };
        }
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} headers - Request headers
     * @returns {Promise<Object>} API response
     */
    async get(endpoint, headers = {}) {
        return await this.request(endpoint, {
            method: 'GET',
            headers
        });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Promise<Object>} API response
     */
    async post(endpoint, data = {}, headers = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {Object} headers - Request headers
     * @returns {Promise<Object>} API response
     */
    async put(endpoint, data = {}, headers = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} headers - Request headers
     * @returns {Promise<Object>} API response
     */
    async delete(endpoint, headers = {}) {
        return await this.request(endpoint, {
            method: 'DELETE',
            headers
        });
    }

    /**
     * Login and get token
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Login response with token
     */
    async login(username, password) {
        const response = await this.post('/api/login', {
            username,
            password
        });

        return {
            ...response,
            token: response.data?.data?.token || null
        };
    }

    /**
     * Make authenticated request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {string} token - JWT token
     * @returns {Promise<Object>} API response
     */
    async authenticatedRequest(endpoint, options = {}, token) {
        const authHeaders = {
            'Authorization': `Bearer ${token}`
        };

        return await this.request(endpoint, {
            ...options,
            headers: {
                ...options.headers,
                ...authHeaders
            }
        });
    }

    /**
     * Authenticated GET request
     * @param {string} endpoint - API endpoint
     * @param {string} token - JWT token
     * @param {Object} headers - Additional headers
     * @returns {Promise<Object>} API response
     */
    async authenticatedGet(endpoint, token, headers = {}) {
        return await this.authenticatedRequest(endpoint, {
            method: 'GET',
            headers
        }, token);
    }

    /**
     * Authenticated POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {string} token - JWT token
     * @param {Object} headers - Additional headers
     * @returns {Promise<Object>} API response
     */
    async authenticatedPost(endpoint, data, token, headers = {}) {
        return await this.authenticatedRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        }, token);
    }

    /**
     * Authenticated PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @param {string} token - JWT token
     * @param {Object} headers - Additional headers
     * @returns {Promise<Object>} API response
     */
    async authenticatedPut(endpoint, data, token, headers = {}) {
        return await this.authenticatedRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers
        }, token);
    }

    /**
     * Authenticated DELETE request
     * @param {string} endpoint - API endpoint
     * @param {string} token - JWT token
     * @param {Object} headers - Additional headers
     * @returns {Promise<Object>} API response
     */
    async authenticatedDelete(endpoint, token, headers = {}) {
        return await this.authenticatedRequest(endpoint, {
            method: 'DELETE',
            headers
        }, token);
    }

    /**
     * Test file upload
     * @param {string} endpoint - API endpoint
     * @param {Object} fileData - File data
     * @param {string} token - JWT token
     * @param {Object} additionalData - Additional form data
     * @returns {Promise<Object>} API response
     */
    async uploadFile(endpoint, fileData, token, additionalData = {}) {
        const FormData = require('form-data');
        const form = new FormData();
        
        // Add file
        form.append('file', fileData.buffer, {
            filename: fileData.originalname,
            contentType: fileData.mimetype
        });
        
        // Add additional data
        Object.keys(additionalData).forEach(key => {
            form.append(key, additionalData[key]);
        });

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        
        return {
            status: response.status,
            statusText: response.statusText,
            data: data,
            headers: response.headers,
            ok: response.ok
        };
    }

    /**
     * Test multiple requests concurrently
     * @param {Array} requests - Array of request functions
     * @returns {Promise<Array>} Array of responses
     */
    async concurrentRequests(requests) {
        return await Promise.all(requests);
    }

    /**
     * Test request with timeout
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<Object>} API response
     */
    async requestWithTimeout(endpoint, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await this.request(endpoint, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                return {
                    status: 0,
                    statusText: 'Request Timeout',
                    data: { error: 'Request timeout' },
                    headers: {},
                    ok: false,
                    timeout: true
                };
            }
            throw error;
        }
    }

    /**
     * Test rate limiting
     * @param {string} endpoint - API endpoint
     * @param {number} requests - Number of requests to make
     * @param {number} interval - Interval between requests in ms
     * @returns {Promise<Array>} Array of responses
     */
    async testRateLimit(endpoint, requests = 10, interval = 100) {
        const responses = [];
        
        for (let i = 0; i < requests; i++) {
            const response = await this.get(endpoint);
            responses.push(response);
            
            if (i < requests - 1) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        
        return responses;
    }

    /**
     * Validate response structure
     * @param {Object} response - API response
     * @param {Object} expectedStructure - Expected response structure
     * @returns {boolean} Validation result
     */
    validateResponse(response, expectedStructure) {
        if (!response.data) return false;
        
        const validateObject = (obj, structure) => {
            for (const key in structure) {
                if (!(key in obj)) return false;
                if (typeof structure[key] === 'object' && structure[key] !== null) {
                    if (!validateObject(obj[key], structure[key])) return false;
                }
            }
            return true;
        };
        
        return validateObject(response.data, expectedStructure);
    }

    /**
     * Wait for server to be ready
     * @param {number} maxAttempts - Maximum attempts
     * @param {number} interval - Interval between attempts
     * @returns {Promise<boolean>} Server ready status
     */
    async waitForServer(maxAttempts = 10, interval = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await this.get('/api/health');
                if (response.ok) return true;
            } catch (error) {
                // Server not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        return false;
    }
}

// Export singleton instance
export const apiHelper = new ApiHelper();
export default apiHelper;
