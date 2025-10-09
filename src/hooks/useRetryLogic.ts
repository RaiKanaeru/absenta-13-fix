import { useCallback, useState } from 'react';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

interface RetryState {
  retryCount: number;
  isRetrying: boolean;
}

export const useRetryLogic = (options: RetryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => {
      // Retry on network errors, 5xx errors, and 429 (rate limit)
      return (
        !error.name || // Network error
        error.name === 'TypeError' || // Network error
        (error.status >= 500 && error.status < 600) || // Server errors
        error.status === 429 // Rate limit
      );
    }
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    retryCount: 0,
    isRetrying: false
  });

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    onRetry?: (retryCount: number, error: any) => void
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setRetryState({ retryCount: attempt, isRetrying: true });
          
          if (onRetry) {
            onRetry(attempt, lastError);
          }
          
          // Calculate delay with exponential backoff
          const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        
        // Reset retry state on success
        setRetryState({ retryCount: 0, isRetrying: false });
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt < maxRetries && retryCondition(error)) {
          continue;
        }
        
        // Reset retry state on final failure
        setRetryState({ retryCount: 0, isRetrying: false });
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError;
  }, [maxRetries, retryDelay, backoffMultiplier, retryCondition]);

  const resetRetry = useCallback(() => {
    setRetryState({ retryCount: 0, isRetrying: false });
  }, []);

  return {
    executeWithRetry,
    resetRetry,
    retryCount: retryState.retryCount,
    isRetrying: retryState.isRetrying
  };
};

export default useRetryLogic;
