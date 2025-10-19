/**
 * Response Helper - Standardized API responses
 * Provides consistent response format across all endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        ...(data && { data }),
        timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} details - Additional error details
 */
export const sendError = (res, message = 'Internal server error', statusCode = 500, details = null) => {
    const response = {
        success: false,
        error: message,
        ...(details && { details }),
        timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 */
export const sendValidationError = (res, errors) => {
    return sendError(res, 'Validation failed', 400, { validation_errors: errors });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
export const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
export const sendForbidden = (res, message = 'Insufficient permissions') => {
    return sendError(res, message, 403);
};

/**
 * Send conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 */
export const sendConflict = (res, message = 'Resource conflict') => {
    return sendError(res, message, 409);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
export const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
        },
        timestamp: new Date().toISOString()
    };
    
    return res.status(200).json(response);
};

/**
 * Send file download response
 * @param {Object} res - Express response object
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Download filename
 * @param {string} mimeType - File MIME type
 */
export const sendFile = (res, fileBuffer, filename, mimeType = 'application/octet-stream') => {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    return res.send(fileBuffer);
};

/**
 * Send Excel file response
 * @param {Object} res - Express response object
 * @param {Object} workbook - ExcelJS workbook
 * @param {string} filename - Download filename
 */
export const sendExcel = (res, workbook, filename) => {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return workbook.xlsx.write(res).then(() => {
        res.end();
    });
};
