// 测试环境设置
import { vi } from 'vitest';

// Mock Chrome APIs - 完整版本
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false),
    },
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false),
    },
    sendMessage: vi.fn().mockResolvedValue({}),
    lastError: null,
    getManifest: vi.fn().mockReturnValue({ version: '0.1.0' }),
    id: 'test-extension-id',
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false),
    },
    removeAll: vi.fn(),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn().mockReturnValue(false),
    },
    setPopup: vi.fn(),
    setTitle: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(),
      clear: vi.fn().mockResolvedValue(),
      remove: vi.fn().mockResolvedValue(),
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(),
      clear: vi.fn().mockResolvedValue(),
    },
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
    create: vi.fn().mockResolvedValue({ id: 1 }),
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  writable: true,
});

// Enhanced Mock CustomElementRegistry for Web Components
class MockCustomElementRegistry {
  private registry = new Map<string, CustomElementConstructor>();

  define(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    this.registry.set(name, constructor);
  }

  get(name: string): CustomElementConstructor | undefined {
    return this.registry.get(name);
  }

  whenDefined(name: string): Promise<CustomElementConstructor> {
    const constructor = this.registry.get(name);
    return constructor ? Promise.resolve(constructor) : Promise.reject(new Error(`${name} not defined`));
  }

  upgrade(root: Node): void {
    // Mock implementation
  }
}

const mockCustomElements = new MockCustomElementRegistry();

Object.defineProperty(global, 'customElements', {
  value: mockCustomElements,
  writable: true,
});

// 完全重写HTMLElement用于测试环境
class TestHTMLElement {
  shadow: any;
  template: HTMLTemplateElement;
  
  constructor() {
    // 创建一个不依赖JSDOM HTMLElement的测试版本
    this.shadow = {
      innerHTML: '',
      appendChild: vi.fn().mockImplementation((node: any) => node),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      mode: 'closed',
    };
    this.template = {
      content: {
        cloneNode: vi.fn().mockImplementation(() => ({ nodeName: 'DIV' }))
      },
      innerHTML: ''
    } as any;
  }
  
  attachShadow(init: ShadowRootInit): any {
    return this.shadow;
  }
  
  connectedCallback(): void {}
  disconnectedCallback(): void {}
  adoptedCallback(): void {}
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {}
  
  addEventListener(event: string, handler: Function): void {}
  removeEventListener(event: string, handler: Function): void {}
}

// 将TestHTMLElement替换到全局
global.HTMLElement = TestHTMLElement as any;

// Mock Document template creation and custom elements
const originalCreateElement = global.document.createElement.bind(global.document);
global.document.createElement = vi.fn().mockImplementation((tagName: string) => {
  if (tagName === 'template') {
    const template = originalCreateElement('template');
    Object.defineProperty(template, 'content', {
      value: {
        cloneNode: vi.fn().mockImplementation(() => originalCreateElement('div')),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(),
      },
      writable: true,
    });
    return template;
  }
  
  // 支持自定义元素创建
  if (tagName.includes('-')) {
    const CustomElementClass = mockCustomElements.get(tagName);
    if (CustomElementClass) {
      try {
        return new CustomElementClass();
      } catch (e) {
        // 如果构造失败，创建一个模拟元素
        const element = originalCreateElement('div');
        
        // 使用Object.defineProperty设置tagName
        Object.defineProperty(element, 'tagName', {
          value: tagName.toUpperCase(),
          writable: false,
          enumerable: true
        });
        
        // 添加自定义元素生命周期方法
        (element as any).connectedCallback = vi.fn();
        (element as any).disconnectedCallback = vi.fn();
        (element as any).adoptedCallback = vi.fn();
        (element as any).attributeChangedCallback = vi.fn();
        
        return element;
      }
    }
  }
  
  return originalCreateElement(tagName);
});

// Console mock to prevent unhandled promises in tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

export {};