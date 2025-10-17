// backend/config/sentry.js
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      // Add profiling integration
      nodeProfilingIntegration(),
      // Add HTTP integration for request tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Add Express integration
      new Sentry.Integrations.Express({ app: undefined }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive body data
        if (event.request.data) {
          const data = event.request.data;
          if (typeof data === 'object') {
            if (data.password) data.password = '[REDACTED]';
            if (data.kata_sandi) data.kata_sandi = '[REDACTED]';
            if (data.token) data.token = '[REDACTED]';
          }
        }
      }
      
      // Add custom tags
      event.tags = {
        ...event.tags,
        component: 'backend',
        version: process.env.npm_package_version || '1.0.0',
      };
      
      return event;
    },
    beforeSendTransaction(event) {
      // Filter out sensitive transaction data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  });
};

// Sentry middleware for Express
export const sentryMiddleware = {
  // Request handler
  requestHandler: Sentry.requestHandler({
    // Customize request handler options
    user: ['id', 'username', 'email'],
    ip: true,
  }),
  
  // Tracing handler
  tracingHandler: Sentry.tracingHandler(),
  
  // Error handler
  errorHandler: Sentry.errorHandler({
    shouldHandleError(error) {
      // Don't report certain errors
      if (error.status === 404) return false;
      if (error.status === 401) return false;
      if (error.status === 403) return false;
      return true;
    },
  }),
};

// Helper functions for manual error reporting
export const captureException = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the exception
    Sentry.captureException(error);
  });
};

export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Set level
    scope.setLevel(level);
    
    // Capture the message
    Sentry.captureMessage(message);
  });
};

export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export const setUser = (user) => {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
};

export const setTag = (key, value) => {
  Sentry.setTag(key, value);
};

export const setContext = (key, context) => {
  Sentry.setContext(key, context);
};

export default Sentry;
