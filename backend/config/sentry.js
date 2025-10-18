// backend/config/sentry.js
import * as Sentry from '@sentry/node';

// Initialize Sentry
export const initSentry = () => {
  // Skip Sentry initialization if DSN is not configured
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Note: Profiling requires @sentry/profiling-node package
    // profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
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
  requestHandler: (req, res, next) => {
    if (!process.env.SENTRY_DSN) {
      return next();
    }
    return Sentry.requestHandler({
      user: ['id', 'username', 'email'],
      ip: true,
    })(req, res, next);
  },
  
  // Tracing handler
  tracingHandler: (req, res, next) => {
    if (!process.env.SENTRY_DSN) {
      return next();
    }
    return Sentry.tracingHandler()(req, res, next);
  },
  
  // Error handler
  errorHandler: (err, req, res, next) => {
    if (!process.env.SENTRY_DSN) {
      return next(err);
    }
    return Sentry.errorHandler({
      shouldHandleError(error) {
        // Don't report certain errors
        if (error.status === 404) return false;
        if (error.status === 401) return false;
        if (error.status === 403) return false;
        return true;
      },
    })(err, req, res, next);
  },
};

// Helper functions for manual error reporting
export const captureException = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) {
    console.error('Exception:', error, 'Context:', context);
    return;
  }
  
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
  if (!process.env.SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message, context);
    return;
  }
  
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
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export const setUser = (user) => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
};

export const setTag = (key, value) => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setTag(key, value);
};

export const setContext = (key, context) => {
  if (!process.env.SENTRY_DSN) return;
  
  Sentry.setContext(key, context);
};

export default Sentry;
