// tests/unit/hooks/useSentry.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSentry } from '../../../src/hooks/useSentry';

// Mock Sentry functions
const mockCaptureException = jest.fn();
const mockCaptureMessage = jest.fn();
const mockAddBreadcrumb = jest.fn();
const mockSetUser = jest.fn();
const mockSetTag = jest.fn();
const mockSetContext = jest.fn();

jest.mock('../../../src/config/sentry', () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  addBreadcrumb: mockAddBreadcrumb,
  setUser: mockSetUser,
  setTag: mockSetTag,
  setContext: mockSetContext,
}));

describe('useSentry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides all Sentry functions', () => {
    const { result } = renderHook(() => useSentry());

    expect(result.current.captureException).toBeDefined();
    expect(result.current.captureMessage).toBeDefined();
    expect(result.current.addBreadcrumb).toBeDefined();
    expect(result.current.setUser).toBeDefined();
    expect(result.current.setTag).toBeDefined();
    expect(result.current.setContext).toBeDefined();
  });

  it('captureException calls Sentry captureException with error and context', () => {
    const { result } = renderHook(() => useSentry());
    const error = new Error('Test error');
    const context = { component: 'TestComponent' };

    act(() => {
      result.current.captureException(error, context);
    });

    expect(mockCaptureException).toHaveBeenCalledWith(error, context);
  });

  it('captureException calls Sentry captureException with error only', () => {
    const { result } = renderHook(() => useSentry());
    const error = new Error('Test error');

    act(() => {
      result.current.captureException(error);
    });

    expect(mockCaptureException).toHaveBeenCalledWith(error, {});
  });

  it('captureMessage calls Sentry captureMessage with message, level, and context', () => {
    const { result } = renderHook(() => useSentry());
    const message = 'Test message';
    const level = 'warning';
    const context = { userId: 123 };

    act(() => {
      result.current.captureMessage(message, level, context);
    });

    expect(mockCaptureMessage).toHaveBeenCalledWith(message, level, context);
  });

  it('captureMessage calls Sentry captureMessage with default level', () => {
    const { result } = renderHook(() => useSentry());
    const message = 'Test message';

    act(() => {
      result.current.captureMessage(message);
    });

    expect(mockCaptureMessage).toHaveBeenCalledWith(message, 'info', {});
  });

  it('addBreadcrumb calls Sentry addBreadcrumb with all parameters', () => {
    const { result } = renderHook(() => useSentry());
    const message = 'User clicked button';
    const category = 'ui';
    const level = 'info';
    const data = { button: 'submit' };

    act(() => {
      result.current.addBreadcrumb(message, category, level, data);
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(message, category, level, data);
  });

  it('addBreadcrumb calls Sentry addBreadcrumb with default parameters', () => {
    const { result } = renderHook(() => useSentry());
    const message = 'User action';

    act(() => {
      result.current.addBreadcrumb(message);
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(message, 'custom', 'info', {});
  });

  it('setUser calls Sentry setUser with user object', () => {
    const { result } = renderHook(() => useSentry());
    const user = { id: 123, username: 'testuser', email: 'test@example.com', role: 'admin' };

    act(() => {
      result.current.setUser(user);
    });

    expect(mockSetUser).toHaveBeenCalledWith(user);
  });

  it('setTag calls Sentry setTag with key and value', () => {
    const { result } = renderHook(() => useSentry());
    const key = 'environment';
    const value = 'test';

    act(() => {
      result.current.setTag(key, value);
    });

    expect(mockSetTag).toHaveBeenCalledWith(key, value);
  });

  it('setContext calls Sentry setContext with key and context', () => {
    const { result } = renderHook(() => useSentry());
    const key = 'request';
    const context = { method: 'GET', url: '/api/test' };

    act(() => {
      result.current.setContext(key, context);
    });

    expect(mockSetContext).toHaveBeenCalledWith(key, context);
  });

  it('functions are memoized and stable across renders', () => {
    const { result, rerender } = renderHook(() => useSentry());
    
    const firstRender = {
      captureException: result.current.captureException,
      captureMessage: result.current.captureMessage,
      addBreadcrumb: result.current.addBreadcrumb,
      setUser: result.current.setUser,
      setTag: result.current.setTag,
      setContext: result.current.setContext,
    };

    rerender();

    const secondRender = {
      captureException: result.current.captureException,
      captureMessage: result.current.captureMessage,
      addBreadcrumb: result.current.addBreadcrumb,
      setUser: result.current.setUser,
      setTag: result.current.setTag,
      setContext: result.current.setContext,
    };

    expect(firstRender.captureException).toBe(secondRender.captureException);
    expect(firstRender.captureMessage).toBe(secondRender.captureMessage);
    expect(firstRender.addBreadcrumb).toBe(secondRender.addBreadcrumb);
    expect(firstRender.setUser).toBe(secondRender.setUser);
    expect(firstRender.setTag).toBe(secondRender.setTag);
    expect(firstRender.setContext).toBe(secondRender.setContext);
  });
});
