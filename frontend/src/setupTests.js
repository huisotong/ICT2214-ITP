require("@testing-library/jest-dom");

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch if not already done
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Setup for each test
beforeEach(() => {
  fetch.mockClear();
  Object.values(mockSessionStorage).forEach((mock) => mock.mockClear());
});
