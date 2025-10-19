// src/components/ErrorBoundary.tsx
import React from 'react';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  eventId: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, eventId }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            {eventId && (
              <p className="text-sm text-gray-500">
                Error ID: {eventId}
              </p>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800 font-medium">Development Error Details:</p>
              <pre className="mt-2 text-xs text-red-700 overflow-auto">
                {error.message}
              </pre>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={resetError}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleReload}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            
            <Button 
              onClick={handleGoHome}
              className="w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  beforeCapture?: (scope: any, error: Error, errorInfo: any) => void;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback = ErrorFallback,
  beforeCapture 
}) => {
  return (
    <SentryErrorBoundary
      fallback={fallback}
      beforeCapture={(scope, error, errorInfo) => {
        // Add custom context before capturing
        scope.setTag('errorBoundary', 'true');
        scope.setContext('errorInfo', {
          componentStack: errorInfo.componentStack,
        });
        
        // Call custom beforeCapture if provided
        if (beforeCapture) {
          beforeCapture(scope, error, errorInfo);
        }
      }}
      showDialog={false} // We're using our custom fallback
    >
      {children}
    </SentryErrorBoundary>
  );
};

export default ErrorBoundary;