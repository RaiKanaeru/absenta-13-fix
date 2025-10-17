// src/config/sentry.ts
import * as Sentry from '@sentry/react';
import { browserProfilingIntegration } from '@sentry/profiling';

// Initialize Sentry for frontend
export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    profilesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    integrations: [
      // Add profiling integration
      browserProfilingIntegration(),
      // Add HTTP integration for request tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Add React Router integration
      new Sentry.Integrations.ReactRouterV6BrowserTracing({
        useEffect: React.useEffect,
      }),
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
        component: 'frontend',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
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

// Helper functions for manual error reporting
export const captureException = (error: Error, context: Record<string, any> = {}) => {
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the exception
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context: Record<string, any> = {}) => {
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

export const addBreadcrumb = (message: string, category: string = 'custom', level: Sentry.SeverityLevel = 'info', data: Record<string, any> = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export const setUser = (user: { id: string | number; username: string; email?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  });
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const setContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

export default Sentry;
