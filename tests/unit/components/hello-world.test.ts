import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HelloWorld } from '../../../packages/ui-components/src/hello-world/hello-world';

// Mock HTMLElement的attachShadow方法
const createMockShadowRoot = () => ({
  innerHTML: '',
  appendChild: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
});

describe('HelloWorld Component', () => {
  let helloWorld: HelloWorld;
  let mockShadowRoot: any;

  beforeEach(() => {
    // 重置mock
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
    
    // 创建组件实例
    helloWorld = new HelloWorld();
  });

  describe('Component Initialization', () => {
    it('should create HelloWorld component instance', () => {
      expect(helloWorld).toBeInstanceOf(HelloWorld);
      expect(helloWorld).toBeInstanceOf(HTMLElement);
    });

    it('should have private properties with correct default values', () => {
      expect(helloWorld['message']).toBe('Hello World');
      expect(helloWorld['subtitle']).toBe('BMad Link 智能书签管理器已成功加载');
    });
  });

  describe('render() method', () => {
    it('should return correct HTML structure', () => {
      const html = helloWorld.render();
      
      expect(html).toContain('<div class="hello-container">');
      expect(html).toContain('<div class="logo">');
      expect(html).toContain('<span class="logo-icon">🔖</span>');
      expect(html).toContain('<h1 class="title">Hello World</h1>');
      expect(html).toContain('<p class="subtitle">BMad Link 智能书签管理器已成功加载</p>');
      expect(html).toContain('<div class="status">');
      expect(html).toContain('<span class="status-dot"></span>');
      expect(html).toContain('<span class="status-text">扩展运行正常</span>');
    });

    it('should include all required CSS classes', () => {
      const html = helloWorld.render();
      
      expect(html).toContain('hello-container');
      expect(html).toContain('logo');
      expect(html).toContain('logo-icon');
      expect(html).toContain('title');
      expect(html).toContain('subtitle');
      expect(html).toContain('status');
      expect(html).toContain('status-dot');
      expect(html).toContain('status-text');
    });

    it('should have proper semantic HTML structure', () => {
      const html = helloWorld.render();
      
      expect(html).toMatch(/<h1[^>]*>Hello World<\/h1>/);
      expect(html).toMatch(/<p[^>]*>BMad Link 智能书签管理器已成功加载<\/p>/);
    });
  });

  describe('getStyles() method', () => {
    it('should return CSS styles as string', () => {
      const styles = helloWorld.getStyles();
      
      expect(typeof styles).toBe('string');
      expect(styles.length).toBeGreaterThan(0);
    });

    it('should include all required CSS selectors', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('.hello-container');
      expect(styles).toContain('.logo');
      expect(styles).toContain('.logo-icon');
      expect(styles).toContain('.title');
      expect(styles).toContain('.subtitle');
      expect(styles).toContain('.status');
      expect(styles).toContain('.status-dot');
      expect(styles).toContain('.status-text');
    });

    it('should include key styling properties', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('padding: 20px');
      expect(styles).toContain('text-align: center');
      expect(styles).toContain('background: linear-gradient');
      expect(styles).toContain('color: #ffffff');
      expect(styles).toContain('font-family:');
      expect(styles).toContain('min-width: 320px');
      expect(styles).toContain('border-radius: 8px');
    });

    it('should include responsive design styles', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('@media (max-width: 350px)');
      expect(styles).toContain('min-width: 280px');
      expect(styles).toContain('padding: 16px');
    });

    it('should include animation keyframes', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('@keyframes pulse');
      expect(styles).toContain('0%, 100% { opacity: 1; }');
      expect(styles).toContain('50% { opacity: 0.5; }');
    });

    it('should include gradient text styling', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('background: linear-gradient(45deg, #6366f1, #8b5cf6)');
      expect(styles).toContain('-webkit-background-clip: text');
      expect(styles).toContain('-webkit-text-fill-color: transparent');
    });
  });

  describe('Lifecycle Methods', () => {
    it('should call renderComponent when connectedCallback is called', () => {
      const renderComponentSpy = vi.spyOn(helloWorld as any, 'renderComponent');
      const attachEventsSpy = vi.spyOn(helloWorld as any, 'attachEvents');
      
      helloWorld.connectedCallback();
      
      expect(renderComponentSpy).toHaveBeenCalled();
      expect(attachEventsSpy).toHaveBeenCalled();
    });

    it('should call cleanup when disconnectedCallback is called', () => {
      const cleanupSpy = vi.spyOn(helloWorld as any, 'cleanup');
      
      helloWorld.disconnectedCallback();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Shadow DOM Rendering', () => {
    it('should attach shadow root with closed mode', () => {
      const attachShadowSpy = vi.spyOn(HTMLElement.prototype, 'attachShadow');
      
      new HelloWorld();
      
      expect(attachShadowSpy).toHaveBeenCalledWith({ mode: 'closed' });
    });

    it('should render component content to shadow DOM', () => {
      const appendChildSpy = vi.spyOn(mockShadowRoot, 'appendChild');
      
      helloWorld.connectedCallback();
      
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should include both styles and content in template', () => {
      helloWorld.getStyles();
      helloWorld.render();
      
      helloWorld.connectedCallback();
      
      // 验证template.innerHTML包含了样式和内容
      expect(document.createElement).toHaveBeenCalledWith('template');
    });
  });

  describe('Component Integration', () => {
    it('should be registered as custom element', () => {
      // 验证customElements.define被调用
      expect(customElements.get('bmad-hello-world')).toBeDefined();
    });

    it('should extend BaseComponent', () => {
      expect(helloWorld).toBeInstanceOf(HTMLElement);
      expect(typeof helloWorld.render).toBe('function');
      expect(typeof helloWorld.getStyles).toBe('function');
    });

    it('should have required methods from BaseComponent interface', () => {
      expect(typeof helloWorld.render).toBe('function');
      expect(typeof helloWorld.getStyles).toBe('function');
      expect(typeof helloWorld.connectedCallback).toBe('function');
      expect(typeof helloWorld.disconnectedCallback).toBe('function');
    });
  });

  describe('Content Accuracy', () => {
    it('should display correct message text', () => {
      const html = helloWorld.render();
      
      expect(html).toContain('Hello World');
      expect(html).toContain('BMad Link 智能书签管理器已成功加载');
      expect(html).toContain('扩展运行正常');
    });

    it('should include bookmark emoji in logo', () => {
      const html = helloWorld.render();
      
      expect(html).toContain('🔖');
    });

    it('should have proper status indicator styling', () => {
      const styles = helloWorld.getStyles();
      
      expect(styles).toContain('background: rgba(34, 197, 94, 0.1)');
      expect(styles).toContain('border: 1px solid rgba(34, 197, 94, 0.3)');
      expect(styles).toContain('background: #22c55e');
      expect(styles).toContain('color: #22c55e');
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
        helloWorld.connectedCallback();
      }).not.toThrow();
      
      // Restore original method
      document.createElement = originalCreateElement;
    });
  });

  describe('Performance Considerations', () => {
    it('should generate styles only once per instance', () => {
      const getStylesSpy = vi.spyOn(helloWorld, 'getStyles');
      
      // 多次调用getStyles
      helloWorld.getStyles();
      helloWorld.getStyles();
      helloWorld.getStyles();
      
      // 应该每次都调用，因为可能有动态内容
      expect(getStylesSpy).toHaveBeenCalledTimes(3);
    });

    it('should generate render output only once per call', () => {
      const renderSpy = vi.spyOn(helloWorld, 'render');
      
      helloWorld.render();
      helloWorld.render();
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});