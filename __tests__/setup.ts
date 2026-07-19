import { configure } from '@testing-library/jest-dom';
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native';
import 'jest';

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, expected: number, precision?: number) {
    const pass = Math.abs(received - expected) <= (precision || 0);
    return {
      message: () =>
        pass
          ? `expected ${received} to be within range of ${expected} ±${precision || 0}`
          : `expected ${received} not to be within range of ${expected} ±${precision || 0}`,
      pass,
    };
  },
  toBeValidPhoneNumber() {
    const phoneRegex = /^\+998\d{9}$/;
    const pass = phoneRegex.test(this.actual);
    return {
      message: () =>
        pass
          ? `expected ${this.actual} to be a valid phone number`
          : `expected ${this.actual} to be a valid phone number (+998XXXXXXXXX)`,
      pass,
    };
  },
  toBeStrongPassword() {
    const hasUpperCase = /[A-Z]/.test(this.actual);
    const hasLowerCase = /[a-z]/.test(this.actual);
    const hasNumbers = /\d/.test(this.actual);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.actual);
    const pass = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && this.actual.length >= 8;
    
    return {
      message: () =>
        pass
          ? `expected ${this.actual} to be a strong password`
          : `expected password to contain uppercase, lowercase, numbers, special characters and be at least 8 characters`,
      pass,
    };
  },
});

// Configure Jest for React Native
configure({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)',
    '**/?(test|spec)\\.(ts|tsx|js|jsx)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/node_modules/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'ios.js', 'android.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/*.spec.{ts,tsx,js,jsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  testRetryTimes: 3,
  verbose: true,
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/AsyncStorage', () =>
  ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiClear: jest.fn(),
  })
);

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(),
  isFocused: jest.fn(),
    dispatch: jest.fn(),
    resetRoot: jest.fn(),
    setOptions: jest.fn(),
    getCurrentRoute: jest.fn(),
    isReady: jest.fn(),
    getState: jest.fn(),
    getRootState: jest.fn(),
  })
);

// Mock React Native Animated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default = Reanimated.default;
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  State: {},
  StateHandlers: {},
  Directions: {},
  FlingGestureHandler: {},
  PanGestureHandler: {},
  PinchGestureHandler: {},
  RotationGestureHandler: {},
  Swipeable: {},
  TapGestureHandler: {},
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  default: {
    expoVersion: '50.0.0',
    platform: 'ios',
  },
  ...require('expo-constants'),
}));

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
    prompt: jest.fn(),
    confirm: jest.fn(),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  useNetInfo: jest.fn(),
}));

// Mock AsyncStorage for React Native
jest.mock('@react-native-async-storage/AsyncStorage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiClear: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
Date.now = jest.fn(() => mockDate.getTime());

// Mock Math.random for consistent testing
const mockRandom = Math.random;
Math.random = jest.fn(() => 0.123456789);

// Setup global test environment
beforeAll(async () => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Set up test environment
  jest.useFakeTimers();
  jest.setSystemTime(new Date(mockDate));
  
  // Mock any global setup needed
  console.log('🧪 Test environment setup complete');
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Clean up after all tests
  console.log('🧹 Test environment cleaned up');
});

// Global test utilities
global.testUtils = {
  // Mock user data
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    phoneNumber: '+998901234567',
    password: 'TestPass123!',
    role: 'customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // Mock product data
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-id',
    name: 'Test Product',
    price: 10000,
    originalPrice: 12000,
    unit: 'kg',
    image: 'https://example.com/product.jpg',
    badge: 'NEW',
    rating: '4.5',
    inStock: true,
    stockQuantity: 100,
    category: 'test-category',
    description: 'Test product description',
    brand: 'Test Brand',
    weight: '1.0',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // Mock order data
  createMockOrder: (overrides = {}) => ({
    id: 'test-order-id',
    customerName: 'Test Customer',
    phoneNumber: '+998901234567',
    address: 'Test Address',
    total: 10000,
    items: [],
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // Mock request
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    path: '/test',
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides
  }),
  
  // Mock response
  createMockResponse: (overrides = {}) => ({
    status: 200,
      json: jest.fn(),
    send: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    header: jest.fn(),
    locals: {},
    ...overrides
  }),
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Wait for element to appear
  waitForElement: async (testID: string, timeout = 5000) => {
    const { getByTestId } = require('@testing-library/react-native');
    await waitFor(() => {
      return getByTestId(testID);
    }, { timeout });
  },
  
  // Wait for element to be removed
  waitForElementToBeRemoved: async (testID: string, timeout = 5000) => {
    const { queryByTestId } = require('@testing-library/react-native');
    await waitFor(() => {
      expect(queryByTestId(testID)).not.toBeDefined();
    }, { timeout });
  },
  
  // Test if element is visible
  expectElementVisible: (testID: string) => {
    const { getByTestId } = require('@testing-library/react-native');
    const element = getByTestId(testID);
    expect(element).toBeVisible();
  },
  
  // Test if element has text
  expectElementText: (testID: string, text: string) => {
    const { getByTestId } = require('@testing-library/react-native');
      const element = getByTestId(testID);
      expect(element).toHaveTextContent(text);
  },
  
  // Test if element has specific props
  expectElementProps: (testID: string, props: Record<string, any>) => {
    const { getByTestId } = require('@testing-library/react-native');
      const element = getByTestId(testID);
      expect(element).toHaveProps(props);
  },
  
  // Mock async storage operations
  mockAsyncStorage: (key: string, value: any) => {
    const AsyncStorage = require('@react-native-async-storage/AsyncStorage').default;
    AsyncStorage.setItem(key, value);
  },
  
  // Mock fetch responses
  mockFetchResponse: (url: string, response: any, options: any = {}) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
      ...options
    });
  },
  
  // Mock fetch error
  mockFetchError: (url: string, error: any, status = 500) => {
    global.fetch = jest.fn().mockRejectedValue(new Error(error));
  },
  
  // Mock network conditions
  mockNetworkCondition: (condition: 'offline' | 'slow' | 'error') => {
    if (condition === 'offline') {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    } else if (condition === 'slow') {
      global.fetch = jest.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({}), 2000)
        )
      );
    } else if (condition === 'error') {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    }
  },
  
  // Clear all mocks
  clearAllMocks: () => {
    jest.clearAllMocks();
  }
};

// Export for use in test files
export default global.testUtils;
