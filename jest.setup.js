// Add custom jest matchers from jest-dom
require('@testing-library/jest-dom');

// Mock localForage for tests
jest.mock('localforage', () => ({
  createInstance: jest.fn(() => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    keys: jest.fn(),
  })),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn(),
}));

// Mock BroadcastChannel for cross-tab tests
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }
  postMessage() {}
  close() {}
};
