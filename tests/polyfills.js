// Polyfills for Jest environment
require('react-native-gesture-handler/jestSetup');

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console = originalConsole;
});

// Mock URL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock Blob
global.Blob = jest.fn(() => ({
  size: 0,
  type: '',
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(() => Promise.resolve('')),
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
}));

// Mock File
global.File = jest.fn(() => ({
  name: 'mock-file',
  size: 0,
  type: '',
  lastModified: Date.now(),
}));

// Mock FileReader
global.FileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: '',
  onload: null,
  onerror: null,
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint32Array(1)),
    randomUUID: jest.fn(() => 'mock-uuid'),
  },
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = jest.fn(() => ({
  encode: jest.fn(() => new Uint8Array()),
}));

global.TextDecoder = jest.fn(() => ({
  decode: jest.fn(() => ''),
}));

// Mock atob/btoa
global.atob = jest.fn(() => '');
global.btoa = jest.fn(() => '');

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock history
Object.defineProperty(window, 'history', {
  value: {
    length: 1,
    state: null,
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
    pushState: jest.fn(),
    replaceState: jest.fn(),
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'jest',
    language: 'en-US',
    languages: ['en-US', 'en'],
    platform: 'jest',
    cookieEnabled: true,
    onLine: true,
    hardwareConcurrency: 4,
    maxTouchPoints: 1,
    vendor: 'jest',
    vendorSub: '',
    product: 'jest',
    productSub: '',
    appCodeName: 'Netscape',
    appName: 'Netscape',
    appVersion: 'jest',
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    },
    permissions: {
      query: jest.fn(() => Promise.resolve({ state: 'granted' })),
      requestPermission: jest.fn(() => Promise.resolve('granted')),
    },
    serviceWorker: {
      register: jest.fn(() => Promise.resolve()),
      ready: Promise.resolve({
        scope: '/',
        active: null,
        installing: null,
        waiting: null,
        state: 'activated',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        postMessage: jest.fn(),
        unregister: jest.fn(() => Promise.resolve(true)),
        update: jest.fn(),
        getNotifications: jest.fn(() => Promise.resolve([])),
      }),
      controller: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    clipboard: {
      writeText: jest.fn(() => Promise.resolve()),
      readText: jest.fn(() => Promise.resolve('')),
      write: jest.fn(() => Promise.resolve()),
      read: jest.fn(() => Promise.resolve([])),
    },
    share: jest.fn(() => Promise.resolve()),
    canShare: jest.fn(() => true),
    mediaDevices: {
      getUserMedia: jest.fn(() => Promise.resolve({
        getTracks: jest.fn(() => []),
        getAudioTracks: jest.fn(() => []),
        getVideoTracks: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        stop: jest.fn(),
      })),
      enumerateDevices: jest.fn(() => Promise.resolve([])),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    vibrate: jest.fn(),
    getGamepads: jest.fn(() => []),
    getBattery: jest.fn(() => Promise.resolve({
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity,
      level: 1,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
    registerProtocolHandler: jest.fn(),
    unregisterProtocolHandler: jest.fn(),
  },
  writable: true,
});

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      id: '',
      className: '',
      style: {},
      innerHTML: '',
      textContent: '',
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      getElementsByTagName: jest.fn(() => []),
      getElementsByClassName: jest.fn(() => []),
      focus: jest.fn(),
      blur: jest.fn(),
      click: jest.fn(),
      scrollIntoView: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      })),
      offsetWidth: 0,
      offsetHeight: 0,
      offsetLeft: 0,
      offsetTop: 0,
      clientWidth: 0,
      clientHeight: 0,
      clientLeft: 0,
      clientTop: 0,
      scrollWidth: 0,
      scrollHeight: 0,
      scrollLeft: 0,
      scrollTop: 0,
      parentNode: null,
      parentElement: null,
      children: [],
      firstChild: null,
      lastChild: null,
      nextSibling: null,
      previousSibling: null,
      nodeType: 1,
      nodeName: 'DIV',
      nodeValue: null,
      ownerDocument: null,
    })),
    getElementById: jest.fn(),
    getElementsByTagName: jest.fn(),
    getElementsByClassName: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      style: {},
      innerHTML: '',
      textContent: '',
      getBoundingClientRect: jest.fn(() => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      })),
    },
    head: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    documentElement: {
      style: {},
      getBoundingClientRect: jest.fn(() => ({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      })),
    },
    activeElement: null,
    readyState: 'complete',
    visibilityState: 'visible',
    hidden: false,
    title: '',
    URL: 'http://localhost:3000',
    domain: 'localhost',
    referrer: '',
    cookie: '',
    designMode: 'off',
    compatMode: 'CSS1Compat',
    characterSet: 'UTF-8',
    charset: 'UTF-8',
    defaultView: window,
    defaultCharset: 'UTF-8',
    inputEncoding: 'UTF-8',
    location: window.location,
    lastModified: '',
    implementation: {
      createHTMLDocument: jest.fn(),
      hasFeature: jest.fn(),
    },
    importNode: jest.fn(),
    createDocumentFragment: jest.fn(),
    createTextNode: jest.fn(),
    createComment: jest.fn(),
    createCDATASection: jest.fn(),
    createProcessingInstruction: jest.fn(),
    createAttribute: jest.fn(),
    createEntityReference: jest.fn(),
    createElementNS: jest.fn(),
    createAttributeNS: jest.fn(),
    getElementsByTagNameNS: jest.fn(),
    getElementsByName: jest.fn(),
  },
  writable: true,
});
