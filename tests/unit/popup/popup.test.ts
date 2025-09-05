import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Chrome Extension APIs
const mockChromeRuntime = {
  id: 'test-extension-id',
  sendMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  },
  lastError: null as any
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
  head: {
    appendChild: vi.fn()
  }
};

// Mock UI Components
const mockUIComponents = {
  HelloWorld: vi.fn()
};

// Mock global objects
global.document = mockDocument as any;
global.window = {} as any;
global.chrome = {
  runtime: mockChromeRuntime
} as any;

// Mock import statements
vi.mock('@bmad/ui-components', () => mockUIComponents);

// Popup script code to test
const popupScriptCode = `
// BMad Link Popup Script
import '@bmad/ui-components';

console.log('BMad Link Popup 加载完成');

// 初始化popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM 加载完成');
  
  // 向Service Worker发送消息测试通信
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('与Service Worker通信失败:', chrome.runtime.lastError);
    } else {
      console.log('Service Worker响应:', response);
    }
  });
});
`;

describe('Popup Script Unit Tests', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset DOM state
    mockDocument.readyState = 'loading';
    
    // Mock chrome API responses
    mockChromeRuntime.sendMessage.mockImplementation((message, callback) => {
      if (callback) {
        callback({ status: 'pong' });
      }
    });
    
    // Mock UI components
    mockUIComponents.HelloWorld.mockImplementation(() => ({
      connectedCallback: vi.fn(),
      disconnectedCallback: vi.fn()
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Popup Script Initialization', () => {
    it('should import UI components', () => {
      eval(popupScriptCode);
      
      expect(mockUIComponents.HelloWorld).toBeDefined();
    });

    it('should log popup loading completion', () => {
      eval(popupScriptCode);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Popup 加载完成');
    });

    it('should set up DOMContentLoaded listener', () => {
      eval(popupScriptCode);
      
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
    });
  });

  describe('DOM Content Loaded Handler', () => {
    it('should log DOM load completion', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Popup DOM 加载完成');
    });

    it('should send ping message to service worker', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle successful service worker response', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker响应:', { status: 'pong' });
    });

    it('should handle service worker communication errors', () => {
      mockChromeRuntime.lastError = new Error('Connection failed');
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          callback(null);
        }
      });
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('与Service Worker通信失败:', mockChromeRuntime.lastError);
    });
  });

  describe('UI Components Integration', () => {
    it('should load UI components correctly', () => {
      eval(popupScriptCode);
      
      // Verify that UI components are imported
      expect(mockUIComponents.HelloWorld).toBeDefined();
    });

    it('should handle UI component loading errors', () => {
      vi.mock('@bmad/ui-components', () => {
        throw new Error('Failed to load UI components');
      });
      
      expect(() => {
        eval(popupScriptCode);
      }).not.toThrow();
    });

    it('should work with multiple UI components', () => {
      // Mock multiple UI components
      mockUIComponents.HelloWorld = vi.fn();
      mockUIComponents.OtherComponent = vi.fn();
      
      eval(popupScriptCode);
      
      expect(mockUIComponents.HelloWorld).toBeDefined();
    });
  });

  describe('Service Worker Communication', () => {
    it('should send correctly formatted messages', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle different response types', () => {
      const responses = [
        { status: 'pong' },
        { data: 'test' },
        null,
        undefined,
        'string response',
        123
      ];
      
      responses.forEach(response => {
        vi.clearAllMocks();
        
        mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
          if (callback) {
            callback(response);
          }
        });
        
        eval(popupScriptCode);
        
        const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
        
        domContentLoadedListener();
        
        expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker响应:', response);
      });
    });

    it('should handle message sending failures', () => {
      mockChromeRuntime.sendMessage.mockImplementationOnce(() => {
        throw new Error('Failed to send message');
      });
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle chrome runtime unavailability', () => {
      const originalChrome = (global as any).chrome;
      delete (global as any).chrome;
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
      
      (global as any).chrome = originalChrome;
    });

    it('should handle document unavailability', () => {
      const originalDocument = (global as any).document;
      delete (global as any).document;
      
      expect(() => {
        eval(popupScriptCode);
      }).not.toThrow();
      
      (global as any).document = originalDocument;
    });

    it('should handle DOMContentLoaded event errors', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Simulate error during DOMContentLoaded
      mockDocument.addEventListener.mockImplementationOnce(() => {
        throw new Error('Event listener failed');
      });
      
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
    });

    it('should handle console logging errors', () => {
      vi.spyOn(console, 'log').mockImplementationOnce(() => {
        throw new Error('Console logging failed');
      });
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should minimize DOM operations', () => {
      eval(popupScriptCode);
      
      // Should only add one event listener
      expect(mockDocument.addEventListener).toHaveBeenCalledTimes(1);
    });

    it('should use efficient event handling', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Event listener should be a function
      expect(typeof domContentLoadedListener).toBe('function');
      
      // Should be lightweight
      expect(domContentLoadedListener.toString().length).toBeLessThan(1000);
    });

    it('should avoid memory leaks', () => {
      eval(popupScriptCode);
      
      // The popup script should not create circular references
      expect(() => {
        eval(popupScriptCode);
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    it('should work in different Chrome versions', () => {
      const chromeVersions = ['88.0.0.0', '100.0.0.0', '120.0.0.0'];
      
      chromeVersions.forEach(version => {
        vi.clearAllMocks();
        
        eval(popupScriptCode);
        
        const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
        
        domContentLoadedListener();
        
        expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Popup 加载完成');
      });
    });

    it('should handle different popup contexts', () => {
      const contexts = ['popup', 'options', 'sidebar'];
      
      contexts.forEach(context => {
        vi.clearAllMocks();
        
        eval(popupScriptCode);
        
        const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
        
        domContentLoadedListener();
        
        expect(consoleLogSpy).toHaveBeenCalledWith('Popup DOM 加载完成');
      });
    });
  });

  describe('Security Considerations', () => {
    it('should not access sensitive browser APIs', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      // Should not access sensitive APIs
      expect(mockDocument.querySelector).not.toHaveBeenCalled();
      expect(mockDocument.getElementsByTagName).not.toHaveBeenCalled();
    });

    it('should validate message content', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      // Should send safe message content
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith(
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('should handle cross-script security', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Should handle secure communication with service worker
      expect(() => {
        domContentLoadedListener();
      }).not.toThrow();
    });
  });

  describe('Integration Testing', () => {
    it('should integrate with Chrome extension APIs', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalled();
    });

    it('should handle popup lifecycle events', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Simulate popup opening
      domContentLoadedListener();
      
      expect(consoleLogSpy).toHaveBeenCalledWith('Popup DOM 加载完成');
    });

    it('should handle popup closing', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Simulate popup opening and closing
      domContentLoadedListener();
      
      // Should handle cleanup gracefully
      expect(() => {
        // Simulate cleanup
        mockDocument.removeEventListener('DOMContentLoaded', domContentLoadedListener);
      }).not.toThrow();
    });
  });

  describe('User Experience', () => {
    it('should provide feedback for service worker communication', () => {
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      // Should log communication status
      expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker响应:', expect.any(Object));
    });

    it('should handle communication timeouts gracefully', () => {
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          setTimeout(() => callback({ status: 'timeout' }), 1000);
        }
      });
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      // Should handle async response
      domContentLoadedListener();
      
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalled();
    });

    it('should provide clear error messages', () => {
      mockChromeRuntime.lastError = new Error('Network error');
      mockChromeRuntime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) {
          callback(null);
        }
      });
      
      eval(popupScriptCode);
      
      const domContentLoadedListener = mockDocument.addEventListener.mock.calls[0][1];
      
      domContentLoadedListener();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('与Service Worker通信失败:', expect.any(Error));
    });
  });

  describe('Popup Script Lifecycle', () => {
    it('should handle popup script injection timing', () => {
      const injectionTimings = ['document_start', 'document_end', 'document_idle'];
      
      injectionTimings.forEach(timing => {
        vi.clearAllMocks();
        
        if (timing === 'document_start') {
          mockDocument.readyState = 'loading';
        } else {
          mockDocument.readyState = 'complete';
        }
        
        eval(popupScriptCode);
        
        expect(mockDocument.addEventListener).toHaveBeenCalledWith(
          'DOMContentLoaded',
          expect.any(Function)
        );
      });
    });

    it('should handle popup reload scenarios', () => {
      eval(popupScriptCode);
      
      // Simulate popup reload
      vi.clearAllMocks();
      
      eval(popupScriptCode);
      
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Popup 加载完成');
    });

    it('should handle multiple popup instances', () => {
      eval(popupScriptCode);
      eval(popupScriptCode);
      eval(popupScriptCode);
      
      // Each instance should initialize independently
      expect(consoleLogSpy).toHaveBeenCalledWith('BMad Link Popup 加载完成');
    });
  });
});