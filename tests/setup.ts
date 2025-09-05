// 测试环境设置
import { vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    lastError: null,
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
  },
};

// 注入到全局对象
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true,
});

// Mock HTMLElement的shadowRoot
Object.defineProperty(HTMLElement.prototype, 'attachShadow', {
  value: vi.fn().mockImplementation(() => ({
    innerHTML: '',
    appendChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
  })),
  writable: true,
});

export {};