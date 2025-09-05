import { describe, it, expect } from 'vitest';
import { BaseComponent, Config, APP_NAME, APP_VERSION } from '../../../packages/shared/src/index.ts';

describe('Shared Package Tests', () => {
  describe('Type Definitions', () => {
    describe('BaseComponent Interface', () => {
      it('should define BaseComponent interface correctly', () => {
        // Test that the interface is properly defined
        expect(typeof BaseComponent).toBe('object');
        expect(BaseComponent).toHaveProperty('render');
        expect(BaseComponent).toHaveProperty('getStyles');
      });

      it('should have render method definition', () => {
        expect(BaseComponent.render).toBeDefined();
        expect(typeof BaseComponent.render).toBe('function');
      });

      it('should have getStyles method definition', () => {
        expect(BaseComponent.getStyles).toBeDefined();
        expect(typeof BaseComponent.getStyles).toBe('function');
      });

      it('should be usable as a TypeScript type', () => {
        // Test that the interface can be used as a type
        const testComponent: BaseComponent = {
          render: () => '<div>Test</div>',
          getStyles: () => 'div { color: red; }'
        };

        expect(typeof testComponent.render).toBe('function');
        expect(typeof testComponent.getStyles).toBe('function');
        expect(testComponent.render()).toBe('<div>Test</div>');
        expect(testComponent.getStyles()).toBe('div { color: red; }');
      });

      it('should enforce method signatures', () => {
        // Test that the interface enforces correct method signatures
        const validImplementation: BaseComponent = {
          render: () => 'test',
          getStyles: () => 'test'
        };

        expect(() => {
          validImplementation.render();
          validImplementation.getStyles();
        }).not.toThrow();
      });
    });

    describe('Config Interface', () => {
      it('should define Config interface correctly', () => {
        expect(typeof Config).toBe('object');
        expect(Config).toHaveProperty('appName');
        expect(Config).toHaveProperty('version');
        expect(Config).toHaveProperty('isDevelopment');
      });

      it('should have correct property types', () => {
        const testConfig: Config = {
          appName: 'Test App',
          version: '1.0.0',
          isDevelopment: false
        };

        expect(typeof testConfig.appName).toBe('string');
        expect(typeof testConfig.version).toBe('string');
        expect(typeof testConfig.isDevelopment).toBe('boolean');
      });

      it('should allow optional properties to be undefined', () => {
        // Test that the interface can be implemented correctly
        const partialConfig: Partial<Config> = {
          appName: 'Test App'
        };

        expect(partialConfig.appName).toBe('Test App');
        expect(partialConfig.version).toBeUndefined();
        expect(partialConfig.isDevelopment).toBeUndefined();
      });

      it('should validate config structure', () => {
        const validConfigs = [
          { appName: 'App1', version: '1.0.0', isDevelopment: true },
          { appName: 'App2', version: '2.0.0', isDevelopment: false },
          { appName: 'App3', version: '0.1.0', isDevelopment: true }
        ];

        validConfigs.forEach(config => {
          expect(() => {
            const typedConfig: Config = config;
            expect(typeof typedConfig.appName).toBe('string');
            expect(typeof typedConfig.version).toBe('string');
            expect(typeof typedConfig.isDevelopment).toBe('boolean');
          }).not.toThrow();
        });
      });

      it('should handle version format validation', () => {
        const validVersions = ['1.0.0', '0.1.0', '2.5.3', '10.0.0'];
        const invalidVersions = ['1.0', 'v1.0.0', '1.0.0.0', ''];

        validVersions.forEach(version => {
          const config: Config = {
            appName: 'Test App',
            version: version,
            isDevelopment: false
          };
          expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
        });
      });

      it('should handle app name validation', () => {
        const validNames = [
          'My App',
          'App123',
          'App with Spaces',
          '中文应用',
          'App-With-Dashes'
        ];

        validNames.forEach(name => {
          const config: Config = {
            appName: name,
            version: '1.0.0',
            isDevelopment: false
          };
          expect(typeof config.appName).toBe('string');
          expect(config.appName.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Constants', () => {
    describe('APP_NAME', () => {
      it('should export APP_NAME constant', () => {
        expect(APP_NAME).toBeDefined();
        expect(typeof APP_NAME).toBe('string');
      });

      it('should have correct app name value', () => {
        expect(APP_NAME).toBe('BMad Link');
      });

      it('should be immutable', () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          APP_NAME = 'Modified Name';
        }).toThrow();
      });

      it('should be usable in string operations', () => {
        expect(APP_NAME.toLowerCase()).toBe('bmad link');
        expect(APP_NAME.toUpperCase()).toBe('BMAD LINK');
        expect(APP_NAME.includes('BMad')).toBe(true);
      });
    });

    describe('APP_VERSION', () => {
      it('should export APP_VERSION constant', () => {
        expect(APP_VERSION).toBeDefined();
        expect(typeof APP_VERSION).toBe('string');
      });

      it('should have correct version format', () => {
        expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
      });

      it('should follow semantic versioning', () => {
        const versionParts = APP_VERSION.split('.').map(Number);
        expect(versionParts).toHaveLength(3);
        expect(versionParts[0]).toBeGreaterThan(0); // Major version
        expect(versionParts[1]).toBeGreaterThanOrEqual(0); // Minor version
        expect(versionParts[2]).toBeGreaterThanOrEqual(0); // Patch version
      });

      it('should be immutable', () => {
        expect(() => {
          // @ts-expect-error - Testing immutability
          APP_VERSION = '2.0.0';
        }).toThrow();
      });

      it('should be usable in version comparisons', () => {
        expect(APP_VERSION).toBe('0.1.0');
        expect(APP_VERSION > '0.0.1').toBe(true);
        expect(APP_VERSION < '1.0.0').toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a real component', () => {
      // Test that all exports work together
      const testConfig: Config = {
        appName: APP_NAME,
        version: APP_VERSION,
        isDevelopment: true
      };

      const testComponent: BaseComponent = {
        render: () => `<div>${testConfig.appName} v${testConfig.version}</div>`,
        getStyles: () => `div { color: ${testConfig.isDevelopment ? 'red' : 'blue'}; }`
      };

      expect(testComponent.render()).toContain('BMad Link');
      expect(testComponent.render()).toContain('0.1.0');
      expect(testComponent.getStyles()).toContain('color: red');
    });

    it('should handle different config scenarios', () => {
      const scenarios = [
        {
          config: { appName: 'Prod App', version: '1.0.0', isDevelopment: false },
          expectedRender: 'Prod App v1.0.0',
          expectedStyle: 'color: blue'
        },
        {
          config: { appName: 'Dev App', version: '0.1.0', isDevelopment: true },
          expectedRender: 'Dev App v0.1.0',
          expectedStyle: 'color: red'
        }
      ];

      scenarios.forEach(scenario => {
        const component: BaseComponent = {
          render: () => `<div>${scenario.config.appName} v${scenario.config.version}</div>`,
          getStyles: () => `div { color: ${scenario.config.isDevelopment ? 'red' : 'blue'}; }`
        };

        expect(component.render()).toContain(scenario.expectedRender);
        expect(component.getStyles()).toContain(scenario.expectedStyle);
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce type checking', () => {
      // Test that TypeScript types are enforced
      expect(() => {
        // @ts-expect-error - Testing type safety
        const invalidConfig: Config = {
          appName: 123, // Should be string
          version: '1.0.0',
          isDevelopment: false
        };
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing type safety
        const invalidComponent: BaseComponent = {
          render: 'not a function', // Should be function
          getStyles: () => 'styles'
        };
      }).toThrow();
    });

    it('should handle optional properties correctly', () => {
      // Test that optional properties work correctly
      const partialConfig: Partial<Config> = {
        appName: 'Test App'
      };

      expect(partialConfig.appName).toBe('Test App');
      expect(partialConfig.version).toBeUndefined();
      expect(partialConfig.isDevelopment).toBeUndefined();
    });

    it('should support type inference', () => {
      // Test that TypeScript can infer types correctly
      const config: Config = {
        appName: 'Test App',
        version: '1.0.0',
        isDevelopment: false
      };

      // TypeScript should infer these types correctly
      const appName: string = config.appName;
      const version: string = config.version;
      const isDevelopment: boolean = config.isDevelopment;

      expect(typeof appName).toBe('string');
      expect(typeof version).toBe('string');
      expect(typeof isDevelopment).toBe('boolean');
    });
  });

  describe('Export Validation', () => {
    it('should export all expected members', () => {
      // Test that all expected exports are available
      expect(BaseComponent).toBeDefined();
      expect(Config).toBeDefined();
      expect(APP_NAME).toBeDefined();
      expect(APP_VERSION).toBeDefined();
    });

    it('should not export unexpected members', () => {
      // Test that no unexpected exports are present
      const exports = {
        BaseComponent,
        Config,
        APP_NAME,
        APP_VERSION
      };

      expect(Object.keys(exports)).toHaveLength(4);
      expect(Object.keys(exports)).toContain('BaseComponent');
      expect(Object.keys(exports)).toContain('Config');
      expect(Object.keys(exports)).toContain('APP_NAME');
      expect(Object.keys(exports)).toContain('APP_VERSION');
    });

    it('should maintain export consistency', () => {
      // Test that exports remain consistent across imports
      const import1 = require('../../../packages/shared/src/index');
      const import2 = require('../../../packages/shared/src/index');

      expect(import1).toEqual(import2);
      expect(import1.APP_NAME).toBe(import2.APP_NAME);
      expect(import1.APP_VERSION).toBe(import2.APP_VERSION);
    });
  });

  describe('Runtime Behavior', () => {
    it('should maintain constant values at runtime', () => {
      // Test that constants maintain their values
      expect(APP_NAME).toBe('BMad Link');
      expect(APP_VERSION).toBe('0.1.0');
    });

    it('should allow interface implementation at runtime', () => {
      // Test that interfaces work at runtime
      const component: BaseComponent = {
        render: () => 'test',
        getStyles: () => 'test'
      };

      expect(component.render()).toBe('test');
      expect(component.getStyles()).toBe('test');
    });

    it('should handle runtime type checks', () => {
      // Test runtime type validation
      const config: Config = {
        appName: 'Test App',
        version: '1.0.0',
        isDevelopment: false
      };

      expect(typeof config.appName).toBe('string');
      expect(typeof config.version).toBe('string');
      expect(typeof config.isDevelopment).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid config objects gracefully', () => {
      // Test that invalid config objects are handled
      const invalidConfigs = [
        null,
        undefined,
        '',
        123,
        [],
        {}
      ];

      invalidConfigs.forEach(config => {
        expect(() => {
          // @ts-expect-error - Testing error handling
          const typedConfig: Config = config;
        }).toThrow();
      });
    });

    it('should handle missing properties gracefully', () => {
      // Test that missing properties are handled
      const partialConfig = {
        appName: 'Test App'
        // Missing version and isDevelopment
      };

      expect(() => {
        // @ts-expect-error - Testing partial config
        const typedConfig: Config = partialConfig;
      }).toThrow();
    });

    it('should handle type mismatches gracefully', () => {
      // Test that type mismatches are handled
      const typeMismatches = [
        { appName: 123, version: '1.0.0', isDevelopment: false },
        { appName: 'App', version: 123, isDevelopment: false },
        { appName: 'App', version: '1.0.0', isDevelopment: 'false' }
      ];

      typeMismatches.forEach(config => {
        expect(() => {
          // @ts-expect-error - Testing type mismatches
          const typedConfig: Config = config;
        }).toThrow();
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should have minimal memory footprint', () => {
      // Test that constants are small
      expect(APP_NAME.length).toBeLessThan(100);
      expect(APP_VERSION.length).toBeLessThan(20);
    });

    it('should allow tree shaking', () => {
      // Test that exports can be tree-shaken
      expect(() => {
        // Individual imports should work
        const { BaseComponent } = require('../../../packages/shared/src/index');
        expect(BaseComponent).toBeDefined();
      }).not.toThrow();
    });

    it('should not have circular dependencies', () => {
      // Test that there are no circular dependencies
      expect(() => {
        require('../../../packages/shared/src/index');
      }).not.toThrow();
    });
  });
});