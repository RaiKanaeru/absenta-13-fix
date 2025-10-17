// backend/middleware/sentry.js
import { captureException, captureMessage, addBreadcrumb, setUser, setTag, setContext } from '../config/sentry.js';
import { logger } from '../utils/logger.js';

// Middleware to add Sentry context to requests
export const sentryContextMiddleware = (req, res, next) => {
  // Add request breadcrumb
  addBreadcrumb({
    message: `${req.method} ${req.path}`,
    category: 'http',
    level: 'info',
    data: {
      method: req.method,
      url: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    },
  });

  // Set request context
  setContext('request', {
    method: req.method,
    url: req.path,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
    },
    ip: req.ip,
  });

  // Set user if authenticated
  if (req.user) {
    setUser({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    });
  }

  // Set tags
  setTag('environment', process.env.NODE_ENV || 'development');
  setTag('component', 'backend');

  next();
};

// Middleware to capture API errors
export const sentryErrorMiddleware = (error, req, res, next) => {
  // Don't capture certain errors
  if (error.status === 404 || error.status === 401 || error.status === 403) {
    return next(error);
  }

  // Add request context to error
  const errorContext = {
    request: {
      method: req.method,
      url: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    } : null,
  };

  // Capture the exception
  captureException(error, errorContext);

  // Log the error
  logger.error('API Error captured by Sentry', {
    error: error.message,
    stack: error.stack,
    request: {
      method: req.method,
      url: req.path,
      user: req.user?.username,
    },
  });

  next(error);
};

// Helper function to capture API errors manually
export const captureApiError = (error, req, additionalContext = {}) => {
  const context = {
    request: {
      method: req.method,
      url: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    } : null,
    ...additionalContext,
  };

  captureException(error, context);
};

// Helper function to capture API messages
export const captureApiMessage = (message, level = 'info', req, additionalContext = {}) => {
  const context = {
    request: {
      method: req.method,
      url: req.path,
      user: req.user?.username,
    },
    ...additionalContext,
  };

  captureMessage(message, level, context);
};

// Helper function to add API breadcrumbs
export const addApiBreadcrumb = (message, category = 'api', level = 'info', data = {}) => {
  addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};

export default {
  sentryContextMiddleware,
  sentryErrorMiddleware,
  captureApiError,
  captureApiMessage,
  addApiBreadcrumb,
};
