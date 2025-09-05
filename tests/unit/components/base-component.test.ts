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

describe('BaseComponent Abstract Class', () => {
  let mockShadowRoot: any;
  let mockTemplate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ShadowRoot
    mockShadowRoot = {
      appendChild: vi.fn()
    };
    
    // Mock Template
    mockTemplate = {
      innerHTML: '',
      content: {
        cloneNode: vi.fn().mockReturnValue({})
      }
    };
    
    // Mock DOM APIs
    vi.spyOn(HTMLElement.prototype, 'attachShadow').mockReturnValue(mockShadowRoot);
    vi.spyOn(document, 'createElement').mockReturnValue(mockTemplate);
    
    // 注册自定义元素以避免"not part of the custom element registry"错误
    if (!customElements.get('test-component')) {
      customElements.define('test-component', TestComponent);
    }
  });

  describe('Basic Functionality', () => {
    it('should be instantiable', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(component).toBeInstanceOf(BaseComponent);
      expect(component).toBeInstanceOf(HTMLElement);
    });

    it('should implement required abstract methods', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(component.render()).toBe('<div>Test</div>');
      expect(component.getStyles()).toBe('div { color: red; }');
    });

    it('should have lifecycle methods', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(typeof component.connectedCallback).toBe('function');
      expect(typeof component.disconnectedCallback).toBe('function');
    });
  });

  describe('Shadow DOM', () => {
    it('should attach shadow root', () => {
      document.createElement('test-component');
      expect(HTMLElement.prototype.attachShadow).toHaveBeenCalledWith({ mode: 'closed' });
    });

    it('should create template element', () => {
      document.createElement('test-component');
      expect(document.createElement).toHaveBeenCalledWith('template');
    });
  });

  describe('Lifecycle', () => {
    it('should call connectedCallback', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(() => {
        component.connectedCallback();
      }).not.toThrow();
    });

    it('should call disconnectedCallback', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(() => {
        component.disconnectedCallback();
      }).not.toThrow();
    });
  });

  describe('Protected Methods', () => {
    it('should have attachEvents method', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(() => {
        (component as any).attachEvents();
      }).not.toThrow();
    });

    it('should have cleanup method', () => {
      const component = document.createElement('test-component') as TestComponent;
      expect(() => {
        (component as any).cleanup();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle attachShadow errors', () => {
      vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementationOnce(() => {
        throw new Error('Shadow DOM not supported');
      });
      
      expect(() => {
        document.createElement('test-component');
      }).not.toThrow();
    });

    it('should handle createElement errors', () => {
      vi.spyOn(document, 'createElement').mockImplementationOnce(() => {
        throw new Error('DOM not available');
      });
      
      expect(() => {
        document.createElement('test-component');
      }).not.toThrow();
    });
  });
});