// src/hooks/useSentry.ts
import { useCallback } from 'react';
import { captureException, captureMessage, addBreadcrumb, setUser, setTag, setContext } from '../config/sentry';

interface UseSentryReturn {
  captureException: (error: Error, context?: Record<string, any>) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error' | 'fatal' | 'debug', context?: Record<string, any>) => void;
  addBreadcrumb: (message: string, category?: string, level?: 'info' | 'warning' | 'error' | 'fatal' | 'debug', data?: Record<string, any>) => void;
  setUser: (user: { id: string | number; username: string; email?: string; role?: string }) => void;
  setTag: (key: string, value: string) => void;
  setContext: (key: string, context: Record<string, any>) => void;
}

export const useSentry = (): UseSentryReturn => {
  const handleCaptureException = useCallback((error: Error, context: Record<string, any> = {}) => {
    captureException(error, context);
  }, []);

  const handleCaptureMessage = useCallback((
    message: string, 
    level: 'info' | 'warning' | 'error' | 'fatal' | 'debug' = 'info', 
    context: Record<string, any> = {}
  ) => {
    captureMessage(message, level, context);
  }, []);

  const handleAddBreadcrumb = useCallback((
    message: string, 
    category: string = 'custom', 
    level: 'info' | 'warning' | 'error' | 'fatal' | 'debug' = 'info', 
    data: Record<string, any> = {}
  ) => {
    addBreadcrumb(message, category, level, data);
  }, []);

  const handleSetUser = useCallback((user: { id: string | number; username: string; email?: string; role?: string }) => {
    setUser(user);
  }, []);

  const handleSetTag = useCallback((key: string, value: string) => {
    setTag(key, value);
  }, []);

  const handleSetContext = useCallback((key: string, context: Record<string, any>) => {
    setContext(key, context);
  }, []);

  return {
    captureException: handleCaptureException,
    captureMessage: handleCaptureMessage,
    addBreadcrumb: handleAddBreadcrumb,
    setUser: handleSetUser,
    setTag: handleSetTag,
    setContext: handleSetContext,
  };
};
