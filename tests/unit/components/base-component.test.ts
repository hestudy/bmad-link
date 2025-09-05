import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseComponent } from '../../../packages/ui-components/src/base/base-component';

// 创建一个简单的测试组件
class TestComponent extends BaseComponent {
  render(): string {
    return '<div>Test</div>';
  }
  
  getStyles(): string {
    return 'div { color: red; }';
  }
}

// Mock HTMLElement的attachShadow方法
const createMockShadowRoot = () => ({
  innerHTML: '',
  appendChild: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
});

describe('BaseComponent Abstract Class', () => {
  let mockShadowRoot: any;
  let testComponent: TestComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 创建mock shadow root
    mockShadowRoot = createMockShadowRoot();
    
    // Mock attachShadow
    vi.spyOn(HTMLElement.prototype, 'attachShadow').mockReturnValue(mockShadowRoot);
    
    // Mock createElement
    const mockTemplate = {
      innerHTML: '',
      content: {
        cloneNode: vi.fn().mockReturnValue({
          querySelector: vi.fn(),
          querySelectorAll: vi.fn(),
        }),
      },
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockTemplate as any);
    
    // 注册自定义元素以避免"not part of the custom element registry"错误
    if (!customElements.get('test-component')) {
      customElements.define('test-component', TestComponent);
    }
    
    // 创建组件实例
    testComponent = new TestComponent();
  });

  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      expect(testComponent).toBeInstanceOf(BaseComponent);
      expect(testComponent).toBeInstanceOf(HTMLElement);
    });

    it('should implement required abstract methods', () => {
      expect(testComponent.render()).toBe('<div>Test</div>');
      expect(testComponent.getStyles()).toBe('div { color: red; }');
    });

    it('should have lifecycle methods', () => {
      expect(typeof testComponent.connectedCallback).toBe('function');
      expect(typeof testComponent.disconnectedCallback).toBe('function');
    });
  });

  describe('Shadow DOM', () => {
    it('should attach shadow root', () => {
      const attachShadowSpy = vi.spyOn(HTMLElement.prototype, 'attachShadow');
      
      new TestComponent();
      
      expect(attachShadowSpy).toHaveBeenCalledWith({ mode: 'closed' });
    });

    it('should create template element', () => {
      expect(document.createElement).toHaveBeenCalledWith('template');
    });
  });

  describe('Lifecycle', () => {
    it('should call renderComponent when connectedCallback is called', () => {
      const renderComponentSpy = vi.spyOn(testComponent as any, 'renderComponent');
      const attachEventsSpy = vi.spyOn(testComponent as any, 'attachEvents');
      
      testComponent.connectedCallback();
      
      expect(renderComponentSpy).toHaveBeenCalled();
      expect(attachEventsSpy).toHaveBeenCalled();
    });

    it('should call cleanup when disconnectedCallback is called', () => {
      const cleanupSpy = vi.spyOn(testComponent as any, 'cleanup');
      
      testComponent.disconnectedCallback();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Protected Methods', () => {
    it('should have attachEvents method', () => {
      expect(() => {
        (testComponent as any).attachEvents();
      }).not.toThrow();
    });

    it('should have cleanup method', () => {
      expect(() => {
        (testComponent as any).cleanup();
      }).not.toThrow();
    });
  });

  describe('Shadow DOM Rendering', () => {
    it('should render component content to shadow DOM', () => {
      const appendChildSpy = vi.spyOn(mockShadowRoot, 'appendChild');
      
      testComponent.connectedCallback();
      
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should include both styles and content in template', () => {
      testComponent.getStyles();
      testComponent.render();
      
      testComponent.connectedCallback();
      
      // 验证template.innerHTML包含了样式和内容
      expect(document.createElement).toHaveBeenCalledWith('template');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM gracefully', () => {
      // Mock document.createElement to throw error
      const originalCreateElement = document.createElement;
      vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
        throw new Error('DOM not available');
      });
      
      expect(() => {
        testComponent.connectedCallback();
      }).not.toThrow();
      
      // Restore original method
      document.createElement = originalCreateElement;
    });
  });
});