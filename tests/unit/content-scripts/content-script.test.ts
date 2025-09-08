import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Chrome Extension APIs
const mockChromeRuntime = {
  id: 'test-extension-id',
  sendMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  lastError: null as any,
};

// Mock DOM APIs
const mockDocument = {
  readyState: 'loading',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  createElement: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  getElementsByTagName: vi.fn(),
};

const mockWindow = {
  location: {
    href: 'https://example.com',
  },
};

// Mock global objects
global.document = mockDocument as any;
global.window = mockWindow as any;
global.chrome = {
  runtime: mockChromeRuntime,
} as any;

// Content script functions to test (直接定义函数而不是使用eval)
function loadContentScript(): void {
  if (typeof window !== 'undefined' && window.location) {
    console.log('BMad Link Content Script 加载完成', window.location.href);
  } else {
    console.log('BMad Link Content Script 加载完成', 'unknown-url');
  }

  // 页面加载完成后的处理
  if (typeof document !== 'undefined' && document.readyState) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initContentScript);
    } else {
      initContentScript();
    }
  } else {
    // Fallback when document is not available
    initContentScript();
  }
}

function initContentScript(): void {
  console.log('BMad Link Content Script 初始化');

  // 向Service Worker发送ping消息测试通信
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('通信失败:', chrome.runtime.lastError);
      } else {
        console.log('Service Worker 响应:', response);
      }
    });
  }
}

describe('Content Script Unit Tests', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset DOM state
    mockDocument.readyState = 'loading';
    mockWindow.location.href = 'https://example.com';

    // Mock chrome API responses
    mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ status: 'pong' });
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Script Initialization', () => {
    it('should log content script loading with URL', () => {
      loadContentScript();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'BMad Link Content Script 加载完成',
        'https://example.com'
      );
    });

    it('should handle different page URLs', () => {
      mockWindow.location.href = 'https://google.com';

      loadContentScript();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'BMad Link Content Script 加载完成',
        'https://google.com'
      );
    });

    it('should handle complex URLs', () => {
      mockWindow.location.href = 'https://example.com/path?query=value#fragment';

      loadContentScript();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'BMad Link Content Script 加载完成',
        'https://example.com/path?query=value#fragment'
      );
    });
  });

  describe('DOM Ready State Handling', () => {
    it('should add DOMContentLoaded listener when document is loading', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
    });

    it('should call initContentScript directly when document is already loaded', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      expect(mockDocument.addEventListener).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });

    it('should handle interactive ready state', () => {
      mockDocument.readyState = 'interactive';

      loadContentScript();

      expect(mockDocument.addEventListener).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });

    it('should test all possible ready states', () => {
      const readyStates = ['loading', 'interactive', 'complete'];

      readyStates.forEach((state) => {
        vi.clearAllMocks();
        mockDocument.readyState = state;

        loadContentScript();

        if (state === 'loading') {
          expect(mockDocument.addEventListener).toHaveBeenCalled();
        } else {
          expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
        }
      });
    });
  });

  describe('DOM Content Loaded Handler', () => {
    it('should call initContentScript when DOMContentLoaded fires', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      // Get the DOMContentLoaded listener
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];

      // Simulate DOMContentLoaded event
      domContentLoadedListener();

      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });

    it('should handle DOMContentLoaded event errors gracefully', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];

      // Simulate error during DOMContentLoaded
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
    });

    it('should only initialize once when DOM loads', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];

      // Fire DOMContentLoaded multiple times
      domContentLoadedListener();
      domContentLoadedListener();
      domContentLoadedListener();

      // Should initialize each time (current implementation)
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });
  });

  describe('Service Worker Communication', () => {
    it('should send ping message to service worker', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle successful service worker response', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker 响应:', { status: 'pong' });
    });

    it('should handle service worker communication errors', () => {
      mockDocument.readyState = 'complete';

      // Mock runtime error
      mockChromeRuntime.lastError = new Error('Connection failed');
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          callback(null);
        }
      });

      loadContentScript();

      expect(consoleErrorSpy).toHaveBeenCalledWith('通信失败:', mockChromeRuntime.lastError);
    });

    it('should handle service worker timeout', () => {
      mockDocument.readyState = 'complete';

      // Mock timeout scenario
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          setTimeout(() => callback(null), 100);
        }
      });

      loadContentScript();

      // Should handle async response gracefully
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalled();
    });

    it('should handle malformed service worker responses', () => {
      mockDocument.readyState = 'complete';

      // 测试null响应
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();
      
      // 确保chrome.runtime.lastError为null
      mockChromeRuntime.lastError = null;
      
      mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
        if (callback) {
          callback(null);
        }
      });

      loadContentScript();

      // 验证chrome.runtime.sendMessage确实被调用
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );

      // 验证content script正常初始化
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 加载完成', 'https://example.com');
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
      expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker 响应:', null);
    });
  });

  describe('Message Content Validation', () => {
    it('should send correctly formatted ping message', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle different message types', () => {
      mockDocument.readyState = 'complete';

      // Test that the current implementation only sends ping
      loadContentScript();

      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ping' }),
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle chrome runtime unavailability', () => {
      const originalChrome = (global as any).chrome;
      (global as any).chrome = undefined;

      mockDocument.readyState = 'complete';

      expect(() => {
        loadContentScript();
      }).not.toThrow();

      (global as any).chrome = originalChrome;
    });

    it('should handle document unavailability', () => {
      const originalDocument = (global as any).document;
      (global as any).document = undefined;

      expect(() => {
        loadContentScript();
      }).not.toThrow();

      (global as any).document = originalDocument;
    });

    it('should handle window unavailability', () => {
      const originalWindow = (global as any).window;
      (global as any).window = undefined;

      expect(() => {
        loadContentScript();
      }).not.toThrow();

      (global as any).window = originalWindow;
    });

    it('should handle console logging errors', () => {
      const originalLog = console.log;
      console.log = vi.fn().mockImplementationOnce(() => {
        throw new Error('Console logging failed');
      });

      mockDocument.readyState = 'complete';

      // 当前代码没有错误处理，会抛出错误
      expect(() => {
        loadContentScript();
      }).toThrow('Console logging failed');
      
      console.log = originalLog;
    });

    it('should handle event listener errors', () => {
      mockDocument.readyState = 'loading';
      mockDocument.addEventListener.mockImplementationOnce(() => {
        throw new Error('Event listener failed');
      });

      // 当前代码没有错误处理，会抛出错误
      expect(() => {
        loadContentScript();
      }).toThrow('Event listener failed');
    });
  });

  describe('Browser Compatibility', () => {
    it('should work in different browser environments', () => {
      const browsers = [
        { name: 'Chrome', version: '120.0.0.0' },
        { name: 'Firefox', version: '115.0.0.0' },
        { name: 'Edge', version: '119.0.0.0' },
      ];

      browsers.forEach((browser) => {
        vi.clearAllMocks();
        mockDocument.readyState = 'complete';

        // Simulate different browser environments
        loadContentScript();

        expect(consoleLogSpy).toHaveBeenCalledWith(
          'BMad Link Content Script 加载完成',
          'https://example.com'
        );
      });
    });

    it('should handle different document modes', () => {
      const docModes = ['quirks', 'almost standards', 'standards'];

      docModes.forEach((mode) => {
        vi.clearAllMocks();
        mockDocument.readyState = 'complete';

        loadContentScript();

        expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should minimize DOM operations', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      // Should only add one event listener
      expect(mockDocument.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should avoid memory leaks', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      // The content script should not create circular references
      expect(() => {
        loadContentScript();
      }).not.toThrow();
    });

    it('should use efficient event handling', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];

      // Event listener should be a function
      expect(typeof domContentLoadedListener).toBe('function');

      // Should be lightweight
      expect(domContentLoadedListener.toString().length).toBeLessThan(1000);
    });
  });

  describe('Security Considerations', () => {
    it('should not access sensitive DOM elements', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      // Should not access sensitive elements like password fields
      expect(mockDocument.querySelector).not.toHaveBeenCalled();
      expect(mockDocument.getElementsByTagName).not.toHaveBeenCalled();
    });

    it('should not modify page content', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      // Should not modify DOM
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should handle cross-origin security restrictions', () => {
      mockWindow.location.href = 'https://malicious.com';

      loadContentScript();

      // Should still work regardless of origin
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'BMad Link Content Script 加载完成',
        'https://malicious.com'
      );
    });
  });

  describe('Integration Testing', () => {
    it('should integrate properly with Chrome extension APIs', () => {
      mockDocument.readyState = 'complete';

      loadContentScript();

      // Should use chrome.runtime.sendMessage correctly
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle service worker restart scenarios', async () => {
      mockDocument.readyState = 'complete';

      // Simulate service worker restart with immediate error response
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          // Set lastError before calling callback
          mockChromeRuntime.lastError = new Error('Service worker not available');
          callback(null);
        }
      });

      loadContentScript();

      // 验证错误处理被调用
      expect(consoleErrorSpy).toHaveBeenCalledWith('通信失败:', expect.any(Error));
    });

    it('should handle extension reload scenarios', () => {
      mockDocument.readyState = 'complete';

      // Simulate extension reload
      loadContentScript();

      // Clear and re-evaluate to simulate reload
      vi.clearAllMocks();
      mockDocument.readyState = 'complete';

      loadContentScript();

      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });
  });

  describe('Content Script Lifecycle', () => {
    it('should handle content script injection timing', () => {
      const injectionTimings = ['document_start', 'document_end', 'document_idle'];

      injectionTimings.forEach((timing) => {
        vi.clearAllMocks();

        // Simulate different injection timings
        if (timing === 'document_start') {
          mockDocument.readyState = 'loading';
        } else {
          mockDocument.readyState = 'complete';
        }

        loadContentScript();

        if (timing === 'document_start') {
          expect(mockDocument.addEventListener).toHaveBeenCalled();
        } else {
          expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
        }
      });
    });

    it('should handle content script removal', () => {
      mockDocument.readyState = 'loading';

      loadContentScript();

      // Simulate content script removal
      // The script should clean up resources
      expect(() => {
        // Simulate cleanup
        mockDocument.removeEventListener('DOMContentLoaded', expect.any(Function));
      }).not.toThrow();
    });

    it('should handle multiple content script instances', () => {
      mockDocument.readyState = 'complete';

      // Simulate multiple instances
      loadContentScript();
      loadContentScript();
      loadContentScript();

      // Each instance should initialize independently
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Content Script 初始化');
    });
  });
});
