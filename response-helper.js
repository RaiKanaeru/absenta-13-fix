// ================================================
// STANDARDIZED RESPONSE HELPER
// ================================================

/**
 * Standardized API response helper
 * Ensures all API responses follow the same format: {success, data, meta, error}
 */

export const createResponse = {
    // Success response
    success: (data = null, message = 'Success', meta = {}) => ({
        success: true,
        data,
        message,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Error response
    error: (error = 'Internal server error', message = null, details = null, meta = {}) => ({
        success: false,
        error,
        message,
        details,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Pagination response
    paginated: (data = [], pagination = {}, message = 'Data retrieved successfully', meta = {}) => ({
        success: true,
        data,
        message,
        meta: {
            timestamp: new Date().toISOString(),
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                totalPages: pagination.totalPages || 0,
                hasNext: pagination.hasNext || false,
                hasPrev: pagination.hasPrev || false,
                ...pagination
            },
            ...meta
        }
    }),

    // Validation error response
    validation: (errors = [], message = 'Validation failed', meta = {}) => ({
        success: false,
        error: 'Validation Error',
        message,
        details: {
            validationErrors: errors
        },
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Not found response
    notFound: (resource = 'Resource', message = null, meta = {}) => ({
        success: false,
        error: 'Not Found',
        message: message || `${resource} not found`,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Unauthorized response
    unauthorized: (message = 'Unauthorized access', meta = {}) => ({
        success: false,
        error: 'Unauthorized',
        message,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Forbidden response
    forbidden: (message = 'Access forbidden', meta = {}) => ({
        success: false,
        error: 'Forbidden',
        message,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    // Rate limit response
    rateLimited: (message = 'Too many requests', meta = {}) => ({
        success: false,
        error: 'Rate Limited',
        message,
        meta: {
            timestamp: new Date().toISOString(),
            retryAfter: meta.retryAfter || 60,
            ...meta
        }
    }),

    // Cache response
    cached: (data = null, message = 'Data retrieved from cache', cacheKey = null, meta = {}) => ({
        success: true,
        data,
        message,
        cached: true,
        cacheKey,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    })
};

// Express middleware for standardized responses
export const responseMiddleware = (req, res, next) => {
    // Add response helpers to res object
    res.success = (data, message, meta) => {
        return res.json(createResponse.success(data, message, meta));
    };

    res.error = (error, message, details, meta) => {
        return res.json(createResponse.error(error, message, details, meta));
    };

    res.paginated = (data, pagination, message, meta) => {
        return res.json(createResponse.paginated(data, pagination, message, meta));
    };

    res.validation = (errors, message, meta) => {
        return res.status(400).json(createResponse.validation(errors, message, meta));
    };

    res.notFound = (resource, message, meta) => {
        return res.status(404).json(createResponse.notFound(resource, message, meta));
    };

    res.unauthorized = (message, meta) => {
        return res.status(401).json(createResponse.unauthorized(message, meta));
    };

    res.forbidden = (message, meta) => {
        return res.status(403).json(createResponse.forbidden(message, meta));
    };

    res.rateLimited = (message, meta) => {
        return res.status(429).json(createResponse.rateLimited(message, meta));
    };

    res.cached = (data, message, cacheKey, meta) => {
        return res.json(createResponse.cached(data, message, cacheKey, meta));
    };

    next();
};

// Helper for pagination calculation
export const calculatePagination = (page = 1, limit = 10, total = 0) => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages,
        hasNext,
        hasPrev
    };
};

// Helper for error handling
export const handleError = (error, req, res, next) => {
    console.error('API Error:', error);

    // Database errors
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json(createResponse.error(
            'Duplicate Entry',
            'Data already exists',
            { field: error.sqlMessage?.split("'")[1] || 'unknown' }
        ));
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json(createResponse.error(
            'Foreign Key Constraint',
            'Referenced data does not exist'
        ));
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json(createResponse.error(
            'Foreign Key Constraint',
            'Cannot delete data that is being referenced by other records'
        ));
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(createResponse.unauthorized('Invalid token'));
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json(createResponse.unauthorized('Token expired'));
    }

    // Validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json(createResponse.validation(
            error.details || [error.message],
            'Validation failed'
        ));
    }

    // Default error
    return res.status(500).json(createResponse.error(
        'Internal Server Error',
        process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : null
    ));
};

export default createResponse;




