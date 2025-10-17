// tests/utils/testUtils.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { FontSizeProvider } from '../../src/contexts/FontSizeContext';

// Create a test query client
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom render function with providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    store = null,
    ...renderOptions
  } = {}
) => {
  const queryClient = createTestQueryClient();
  
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FontSizeProvider>
          {children}
        </FontSizeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Mock API response
export const mockApiResponse = (data, success = true, error = null) => ({
  success,
  data,
  error,
  message: success ? 'Success' : 'Error',
});

// Mock API call
export const mockApiCall = (response) => {
  const { apiCall } = require('../../src/lib/api');
  apiCall.mockResolvedValue(response);
};

// Mock API error
export const mockApiError = (error) => {
  const { apiCall } = require('../../src/lib/api');
  apiCall.mockRejectedValue(new Error(error));
};

// Create mock user
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  nama: 'Test User',
  role: 'admin',
  email: 'test@example.com',
  ...overrides,
});

// Create mock student
export const createMockStudent = (overrides = {}) => ({
  id: 1,
  nama: 'Test Student',
  nis: '12345',
  kelas: 'X AK 1',
  ...overrides,
});

// Create mock teacher
export const createMockTeacher = (overrides = {}) => ({
  id: 1,
  nama: 'Test Teacher',
  nip: '12345',
  mata_pelajaran: 'Matematika',
  ...overrides,
});

// Create mock class
export const createMockClass = (overrides = {}) => ({
  id: 1,
  nama_kelas: 'X AK 1',
  tingkat: 'X',
  ruang: 'Ruang 101',
  ...overrides,
});

// Create mock subject
export const createMockSubject = (overrides = {}) => ({
  id: 1,
  nama_mapel: 'Matematika',
  kode_mapel: 'MAT',
  ...overrides,
});

// Create mock schedule
export const createMockSchedule = (overrides = {}) => ({
  id: 1,
  hari: 'Senin',
  jam_mulai: '08:00',
  jam_selesai: '09:00',
  kelas_id: 1,
  mapel_id: 1,
  guru_id: 1,
  ...overrides,
});

// Create mock attendance
export const createMockAttendance = (overrides = {}) => ({
  id: 1,
  tanggal: '2024-01-01',
  status: 'hadir',
  siswa_id: 1,
  jadwal_id: 1,
  ...overrides,
});

// Wait for element to appear
export const waitForElement = async (selector, timeout = 5000) => {
  return await waitFor(() => screen.getByTestId(selector), { timeout });
};

// Wait for text to appear
export const waitForText = async (text, timeout = 5000) => {
  return await waitFor(() => screen.getByText(text), { timeout });
};

// Simulate user typing
export const typeInInput = async (input, text) => {
  fireEvent.change(input, { target: { value: text } });
  await waitFor(() => expect(input.value).toBe(text));
};

// Simulate form submission
export const submitForm = async (form) => {
  fireEvent.submit(form);
  await waitFor(() => expect(form).toBeInTheDocument());
};

// Mock localStorage
export const mockLocalStorage = (data = {}) => {
  const store = { ...data };
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    },
    writable: true,
  });
  
  return store;
};

// Mock sessionStorage
export const mockSessionStorage = (data = {}) => {
  const store = { ...data };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    },
    writable: true,
  });
  
  return store;
};

// Mock fetch with response
export const mockFetch = (response, ok = true, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  );
};

// Mock fetch with error
export const mockFetchError = (error = 'Network error') => {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
};

// Create test data factory
export const createTestData = {
  user: createMockUser,
  student: createMockStudent,
  teacher: createMockTeacher,
  class: createMockClass,
  subject: createMockSubject,
  schedule: createMockSchedule,
  attendance: createMockAttendance,
};

// Assertion helpers
export const expectElementToBeInDocument = (element) => {
  expect(element).toBeInTheDocument();
};

export const expectElementNotToBeInDocument = (element) => {
  expect(element).not.toBeInDocument();
};

export const expectElementToHaveText = (element, text) => {
  expect(element).toHaveTextContent(text);
};

export const expectElementToHaveClass = (element, className) => {
  expect(element).toHaveClass(className);
};

export const expectElementToBeDisabled = (element) => {
  expect(element).toBeDisabled();
};

export const expectElementToBeEnabled = (element) => {
  expect(element).toBeEnabled();
};

// Test data generators
export const generateMockData = (count, factory) => {
  return Array.from({ length: count }, (_, index) => factory({ id: index + 1 }));
};

// Mock console methods
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
  
  return originalConsole;
};

export default {
  renderWithProviders,
  createTestQueryClient,
  mockApiResponse,
  mockApiCall,
  mockApiError,
  createMockUser,
  createMockStudent,
  createMockTeacher,
  createMockClass,
  createMockSubject,
  createMockSchedule,
  createMockAttendance,
  waitForElement,
  waitForText,
  typeInInput,
  submitForm,
  mockLocalStorage,
  mockSessionStorage,
  mockFetch,
  mockFetchError,
  createTestData,
  expectElementToBeInDocument,
  expectElementNotToBeInDocument,
  expectElementToHaveText,
  expectElementToHaveClass,
  expectElementToBeDisabled,
  expectElementToBeEnabled,
  generateMockData,
  mockConsole,
};
