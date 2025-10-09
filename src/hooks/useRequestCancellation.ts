import { useRef, useCallback } from 'react';

interface RequestController {
  abort: () => void;
  signal: AbortSignal;
}

export const useRequestCancellation = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const createRequest = useCallback((): RequestController => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    return {
      abort: () => abortController.abort(),
      signal: abortController.signal
    };
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const isAborted = useCallback((error: any): boolean => {
    return error.name === 'AbortError';
  }, []);

  return {
    createRequest,
    cancelRequest,
    isAborted
  };
};

export default useRequestCancellation;
