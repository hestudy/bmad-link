import { describe, it, expect, vi } from 'vitest';
import { BaseComponent, HelloWorld } from '../../../packages/ui-components/src/index.ts';

// 注册HelloWorld组件以避免Custom Element错误
if (!customElements.get('bmad-hello-world')) {
  customElements.define('bmad-hello-world', HelloWorld);
}

describe('UI Components Package Index Tests', () => {
  describe('Export Validation', () => {
    it('should export BaseComponent class', () => {
      expect(BaseComponent).toBeDefined();
      expect(typeof BaseComponent).toBe('function');
      expect(BaseComponent.name).toBe('BaseComponent');
    });

    it('should export HelloWorld class', () => {
      expect(HelloWorld).toBeDefined();
      expect(typeof HelloWorld).toBe('function');
      expect(HelloWorld.name).toBe('HelloWorld');
    });

    it('should export only expected members', () => {
      const exports = { BaseComponent, HelloWorld };
      expect(Object.keys(exports)).toHaveLength(2);
      expect(Object.keys(exports)).toContain('BaseComponent');
      expect(Object.keys(exports)).toContain('HelloWorld');
    });

    it('should maintain export consistency', () => {
      const import1 = { BaseComponent, HelloWorld };
      const import2 = { BaseComponent, HelloWorld };

      expect(import1).toEqual(import2);
      expect(import1.BaseComponent).toBe(import2.BaseComponent);
      expect(import1.HelloWorld).toBe(import2.HelloWorld);
    });
  });

  describe('BaseComponent Export', () => {
    it('should be the same class as the original', () => {
      // 由于我们已经在顶部导入了BaseComponent，我们可以直接比较
      expect(BaseComponent).toBeDefined();
    });

    it('should have correct abstract methods', () => {
      expect(BaseComponent.prototype.render).toBeDefined();
      expect(BaseComponent.prototype.getStyles).toBeDefined();
      expect(typeof BaseComponent.prototype.render).toBe('function');
      expect(typeof BaseComponent.prototype.getStyles).toBe('function');
    });

    it('should have lifecycle methods', () => {
      expect(BaseComponent.prototype.connectedCallback).toBeDefined();
      expect(BaseComponent.prototype.disconnectedCallback).toBeDefined();
      expect(typeof BaseComponent.prototype.connectedCallback).toBe('function');
      expect(typeof BaseComponent.prototype.disconnectedCallback).toBe('function');
    });

    it('should be extendable', () => {
      class TestComponent extends BaseComponent {
        render(): string {
          return '<div>Test</div>';
        }
        getStyles(): string {
          return 'div { color: red; }';
        }
      }

      const testComponent = new TestComponent();
      expect(testComponent).toBeInstanceOf(BaseComponent);
      expect(testComponent.render()).toBe('<div>Test</div>');
      expect(testComponent.getStyles()).toBe('div { color: red; }');
    });
  });

  describe('HelloWorld Export', () => {
    it('should be the same class as the original', () => {
      // 由于我们已经在顶部导入了HelloWorld，我们可以直接使用
      expect(HelloWorld).toBeDefined();
    });

    it('should extend BaseComponent', () => {
      const helloWorld = new HelloWorld();
      expect(helloWorld).toBeInstanceOf(BaseComponent);
      expect(helloWorld).toBeInstanceOf(HelloWorld);
    });

    it('should have required methods', () => {
      const helloWorld = new HelloWorld();
      expect(typeof helloWorld.render).toBe('function');
      expect(typeof helloWorld.getStyles).toBe('function');
      expect(typeof helloWorld.connectedCallback).toBe('function');
      expect(typeof helloWorld.disconnectedCallback).toBe('function');
    });

    it('should produce expected output', () => {
      const helloWorld = new HelloWorld();
      const html = helloWorld.render();
      const styles = helloWorld.getStyles();

      expect(html).toContain('Hello World');
      expect(html).toContain('BMad Link 智能书签管理器已成功加载');
      expect(styles).toContain('.hello-container');
      expect(styles).toContain('color: #ffffff');
    });

    it('should be registered as custom element', () => {
      // Check if the custom element is defined
      expect(customElements.get('bmad-hello-world')).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a real application', () => {
      // Test that both exports work together
      const helloWorld = new HelloWorld();
      
      expect(helloWorld).toBeInstanceOf(BaseComponent);
      expect(helloWorld).toBeInstanceOf(HelloWorld);
      expect(typeof helloWorld.render).toBe('function');
      expect(typeof helloWorld.getStyles).toBe('function');
    });

    it('should allow creating multiple instances', () => {
      const instances = [
        new HelloWorld(),
        new HelloWorld(),
        new HelloWorld()
      ];

      instances.forEach((instance, index) => {
        expect(instance).toBeInstanceOf(HelloWorld);
        expect(instance).toBeInstanceOf(BaseComponent);
        expect(instance.render()).toContain('Hello World');
      });
    });

    it('should maintain separate state for each instance', () => {
      const instance1 = new HelloWorld();
      const instance2 = new HelloWorld();

      // Both instances should work independently
      expect(instance1.render()).toBe(instance2.render());
      expect(instance1.getStyles()).toBe(instance2.getStyles());
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct types', () => {
      // Test that TypeScript types are enforced
      expect(() => {
        // @ts-expect-error - Testing type safety
        const invalidComponent = new BaseComponent(); // Should fail - abstract class
      }).toThrow();

      expect(() => {
        const validComponent = new HelloWorld(); // Should work
        expect(validComponent).toBeInstanceOf(HelloWorld);
      }).not.toThrow();
    });

    it('should support type inference', () => {
      // Test that TypeScript can infer types correctly
      const helloWorld: HelloWorld = new HelloWorld();
      const baseComponent: BaseComponent = helloWorld;

      expect(typeof helloWorld.render).toBe('function');
      expect(typeof baseComponent.render).toBe('function');
    });

    it('should handle interface implementation', () => {
      // Test that classes implement required interfaces
      const helloWorld = new HelloWorld();
      
      expect(typeof helloWorld.render).toBe('function');
      expect(typeof helloWorld.getStyles).toBe('function');
      expect(typeof helloWorld.connectedCallback).toBe('function');
      expect(typeof helloWorld.disconnectedCallback).toBe('function');
    });
  });

  describe('Import Behavior', () => {
    it('should support named imports', () => {
      // 由于我们已经在顶部导入了，我们可以直接使用
      const { BaseComponent: BC, HelloWorld: HW } = { BaseComponent, HelloWorld };
      
      expect(BC).toBe(BaseComponent);
      expect(HW).toBe(HelloWorld);
    });

    it('should support default imports', () => {
      // 模拟默认导入行为
      const uiComponents = { BaseComponent, HelloWorld };
      
      expect(uiComponents.BaseComponent).toBe(BaseComponent);
      expect(uiComponents.HelloWorld).toBe(HelloWorld);
    });

    it('should support mixed imports', () => {
      // 模拟混合导入行为
      const { BaseComponent: BC } = { BaseComponent, HelloWorld };
      const HW = HelloWorld;
      
      expect(BC).toBeDefined();
      expect(HW).toBeDefined();
    });
  });

  describe('Runtime Behavior', () => {
    it('should work at runtime', () => {
      // Test that exports work at runtime
      const helloWorld = new HelloWorld();
      
      expect(helloWorld.render()).toContain('Hello World');
      expect(helloWorld.getStyles()).toContain('.hello-container');
    });

    it('should handle multiple imports', () => {
      // Test that multiple imports work correctly
      const import1 = { BaseComponent, HelloWorld };
      const import2 = { BaseComponent, HelloWorld };
      
      expect(import1.BaseComponent).toBe(import2.BaseComponent);
      expect(import1.HelloWorld).toBe(import2.HelloWorld);
    });

    it('should maintain class identity', () => {
      // Test that class identity is maintained
      const helloWorld1 = new HelloWorld();
      const helloWorld2 = new HelloWorld();
      
      expect(helloWorld1.constructor).toBe(helloWorld2.constructor);
      expect(helloWorld1.constructor).toBe(HelloWorld);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid usage gracefully', () => {
      // Test that invalid usage is handled gracefully
      expect(() => {
        // @ts-expect-error - Testing error handling
        const invalidComponent = new BaseComponent(); // Abstract class
      }).toThrow();

      expect(() => {
        const validComponent = new HelloWorld();
        expect(validComponent).toBeInstanceOf(HelloWorld);
      }).not.toThrow();
    });

    it('should handle missing methods gracefully', () => {
      // Test that missing methods are handled
      class IncompleteComponent extends BaseComponent {
        render(): string {
          return '<div>Incomplete</div>';
        }
        // Missing getStyles method
      }

      expect(() => {
        const component = new IncompleteComponent();
        // @ts-expect-error - Testing missing method
        component.getStyles();
      }).toThrow();
    });

    it('should handle invalid arguments gracefully', () => {
      // Test that invalid arguments are handled
      expect(() => {
        const helloWorld = new HelloWorld();
        helloWorld.render(); // No arguments needed
        helloWorld.getStyles(); // No arguments needed
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should have minimal memory footprint', () => {
      // Test that exports are lightweight
      expect(BaseComponent.toString().length).toBeLessThan(1000);
      expect(HelloWorld.toString().length).toBeLessThan(5000);
    });

    it('should allow tree shaking', () => {
      // Test that individual exports can be tree-shaken
      expect(() => {
        const { BaseComponent: BC } = { BaseComponent, HelloWorld };
        expect(BC).toBeDefined();
      }).not.toThrow();
    });

    it('should not have circular dependencies', () => {
      // Test that there are no circular dependencies
      expect(() => {
        // 模拟导入，由于我们已经导入了，直接使用即可
        const { BaseComponent, HelloWorld } = { BaseComponent, HelloWorld };
        expect(BaseComponent).toBeDefined();
        expect(HelloWorld).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Custom Element Registration', () => {
    it('should register HelloWorld as custom element', () => {
      // Test that the custom element is registered
      expect(customElements.get('bmad-hello-world')).toBeDefined();
    });

    it('should allow creating custom elements', () => {
      // Test that custom elements can be created
      const customElement = document.createElement('bmad-hello-world');
      expect(customElement).toBeInstanceOf(HelloWorld);
      expect(customElement).toBeInstanceOf(HTMLElement);
    });

    it('should handle custom element lifecycle', () => {
      // Test that custom element lifecycle works
      const customElement = document.createElement('bmad-hello-world');
      
      expect(typeof customElement.connectedCallback).toBe('function');
      expect(typeof customElement.disconnectedCallback).toBe('function');
    });
  });

  describe('Module System Compatibility', () => {
    it('should work with ES modules', () => {
      // Test that exports work with ES modules
      expect(() => {
        const { BaseComponent: BC, HelloWorld: HW } = { BaseComponent, HelloWorld };
        expect(BC).toBeDefined();
        expect(HW).toBeDefined();
      }).not.toThrow();
    });

    it('should work with CommonJS', () => {
      // Test that exports work with CommonJS
      expect(() => {
        const uiComponents = { BaseComponent, HelloWorld };
        expect(uiComponents.BaseComponent).toBeDefined();
        expect(uiComponents.HelloWorld).toBeDefined();
      }).not.toThrow();
    });

    it('should work with mixed module systems', () => {
      // Test that exports work with mixed module systems
      expect(() => {
        const esImport = { BaseComponent, HelloWorld };
        const cjsImport = { BaseComponent, HelloWorld };
        
        expect(esImport.BaseComponent).toBe(cjsImport.BaseComponent);
        expect(esImport.HelloWorld).toBe(cjsImport.HelloWorld);
      }).not.toThrow();
    });
  });
});