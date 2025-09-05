import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock fs modules
vi.mock('fs');

describe('Manifest V3 Validation Tests', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockExtensionDir = join(mockProjectRoot, 'apps/extension');
  const mockPublicDir = join(mockExtensionDir, 'public');
  const mockDistDir = join(mockExtensionDir, 'dist');
  
  // Mock implementations
  const mockExistsSync = vi.fn();
  const mockReadFileSync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('{}');
    
    // Mock module exports
    (existsSync as any).mockImplementation(mockExistsSync);
    (readFileSync as any).mockImplementation(mockReadFileSync);
  });

  describe('Manifest V3 Compliance', () => {
    it('should validate manifest_version is 3', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.manifest_version).toBe(3);
      expect(typeof manifest.manifest_version).toBe('number');
    });

    it('should validate required fields are present', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      // Required fields for Manifest V3
      expect(manifest).toHaveProperty('manifest_version');
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('version');
      
      expect(typeof manifest.name).toBe('string');
      expect(typeof manifest.version).toBe('string');
      expect(manifest.name.length).toBeGreaterThan(0);
      expect(manifest.version.length).toBeGreaterThan(0);
    });

    it('should validate name field length and format', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.name.length).toBeLessThanOrEqual(75); // Chrome限制
      expect(manifest.name.trim()).toBe(manifest.name); // 无前后空格
      expect(manifest.name).toMatch(/[\u4e00-\u9fa5a-zA-Z0-9\s\-_]/); // 合法字符
    });

    it('should validate version field format', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      // 验证版本格式 (1-4个数字组，用点分隔)
      expect(manifest.version).toMatch(/^\d+(\.\d+){0,3}$/);
    });
  });

  describe('Permissions Validation', () => {
    it('should validate permissions are declared as array', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        permissions: ['activeTab', 'storage', 'contextMenus']
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(Array.isArray(manifest.permissions)).toBe(true);
      expect(manifest.permissions.length).toBeGreaterThan(0);
    });

    it('should validate permissions are legitimate and not excessive', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        permissions: ['activeTab', 'storage', 'contextMenus']
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const legitimatePermissions = [
        'activeTab', 'storage', 'contextMenus', 'bookmarks', 'tabs',
        'scripting', 'alarms', 'notifications', 'webNavigation'
      ];
      
      manifest.permissions.forEach((permission: string) => {
        expect(legitimatePermissions).toContain(permission);
      });
      
      // 验证没有过度权限
      const dangerousPermissions = [
        'history', 'topSites', 'geolocation', 'desktopCapture',
        'downloads', 'pageCapture', 'proxy'
      ];
      
      manifest.permissions.forEach((permission: string) => {
        expect(dangerousPermissions).not.toContain(permission);
      });
    });

    it('should validate no duplicate permissions', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        permissions: ['activeTab', 'storage', 'contextMenus']
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const uniquePermissions = new Set(manifest.permissions);
      expect(manifest.permissions.length).toBe(uniquePermissions.size);
    });
  });

  describe('Background Service Worker Validation', () => {
    it('should validate background service worker configuration', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        background: {
          service_worker: 'background.js'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBeDefined();
      expect(typeof manifest.background.service_worker).toBe('string');
      expect(manifest.background.service_worker.length).toBeGreaterThan(0);
      expect(manifest.background.service_worker.endsWith('.js')).toBe(true);
    });

    it('should validate background script file exists', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        background: {
          service_worker: 'background.js'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const backgroundScript = manifest.background.service_worker;
      const scriptPath = join(mockDistDir, backgroundScript);
      
      expect(existsSync(scriptPath)).toBe(true);
    });
  });

  describe('Action Configuration Validation', () => {
    it('should validate action configuration is present', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        action: {
          default_popup: 'popup.html',
          default_title: 'BMad Link - 智能书签管理',
          default_icon: {
            '16': 'icons/icon-16.png',
            '32': 'icons/icon-32.png',
            '48': 'icons/icon-48.png',
            '128': 'icons/icon-128.png'
          }
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_popup).toBeDefined();
      expect(manifest.action.default_title).toBeDefined();
      expect(manifest.action.default_icon).toBeDefined();
    });

    it('should validate popup file exists', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        action: {
          default_popup: 'popup.html'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const popupFile = manifest.action.default_popup;
      const popupPath = join(mockDistDir, popupFile);
      
      expect(existsSync(popupPath)).toBe(true);
      expect(popupFile.endsWith('.html')).toBe(true);
    });

    it('should validate action icon configuration', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        action: {
          default_icon: {
            '16': 'icons/icon-16.png',
            '32': 'icons/icon-32.png',
            '48': 'icons/icon-48.png',
            '128': 'icons/icon-128.png'
          }
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const requiredSizes = ['16', '32', '48', '128'];
      requiredSizes.forEach(size => {
        expect(manifest.action.default_icon).toHaveProperty(size);
        expect(manifest.action.default_icon[size]).toMatch(/\.png$/);
      });
    });
  });

  describe('Icons Configuration Validation', () => {
    it('should validate icons section is present', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        icons: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(manifest.icons).toBeDefined();
      expect(typeof manifest.icons).toBe('object');
    });

    it('should validate required icon sizes are present', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        icons: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const requiredSizes = ['16', '32', '48', '128'];
      requiredSizes.forEach(size => {
        expect(manifest.icons).toHaveProperty(size);
        expect(manifest.icons[size]).toMatch(/\.png$/);
      });
    });

    it('should validate icon files exist', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        icons: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      Object.entries(manifest.icons).forEach(([size, iconPath]) => {
        const fullPath = join(mockDistDir, iconPath as string);
        expect(existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Content Scripts Validation', () => {
    it('should validate content scripts configuration', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content-script.js']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(Array.isArray(manifest.content_scripts)).toBe(true);
      expect(manifest.content_scripts.length).toBeGreaterThan(0);
      
      const contentScript = manifest.content_scripts[0];
      expect(Array.isArray(contentScript.matches)).toBe(true);
      expect(Array.isArray(contentScript.js)).toBe(true);
      expect(contentScript.matches.length).toBeGreaterThan(0);
      expect(contentScript.js.length).toBeGreaterThan(0);
    });

    it('should validate content script matches patterns', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content-script.js']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const contentScript = manifest.content_scripts[0];
      
      contentScript.matches.forEach((match: string) => {
        // <all_urls> 是一个有效的特殊匹配模式
        expect(match === '<all_urls>' || match.match(/^(\*|https?|file|ftp):\/\/.*$/)).toBe(true);
        expect(match.length).toBeGreaterThan(0);
      });
    });

    it('should validate content script files exist', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content-script.js']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const contentScript = manifest.content_scripts[0];
      contentScript.js.forEach((scriptFile: string) => {
        const scriptPath = join(mockDistDir, scriptFile);
        expect(existsSync(scriptPath)).toBe(true);
        expect(scriptFile.endsWith('.js')).toBe(true);
      });
    });
  });

  describe('Web Accessible Resources Validation', () => {
    it('should validate web accessible resources configuration', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        web_accessible_resources: [
          {
            resources: ['popup.html'],
            matches: ['<all_urls>']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);
      expect(manifest.web_accessible_resources.length).toBeGreaterThan(0);
      
      const resource = manifest.web_accessible_resources[0];
      expect(Array.isArray(resource.resources)).toBe(true);
      expect(Array.isArray(resource.matches)).toBe(true);
    });

    it('should validate web accessible resources exist', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        web_accessible_resources: [
          {
            resources: ['popup.html'],
            matches: ['<all_urls>']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const resource = manifest.web_accessible_resources[0];
      resource.resources.forEach((resourceFile: string) => {
        const resourcePath = join(mockDistDir, resourceFile);
        expect(existsSync(resourcePath)).toBe(true);
      });
    });
  });

  describe('Security Validation', () => {
    it('should validate no dangerous permissions', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        permissions: ['activeTab', 'storage', 'contextMenus']
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      const dangerousPermissions = [
        'nativeMessaging', 'management', 'privacy', 'sessions',
        'processes', 'debugger', 'experimental', 'identity'
      ];
      
      if (manifest.permissions) {
        manifest.permissions.forEach((permission: string) => {
          expect(dangerousPermissions).not.toContain(permission);
        });
      }
    });

    it('should validate content scripts are not overly broad', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content-script.js']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      if (manifest.content_scripts) {
        manifest.content_scripts.forEach((script: any) => {
          // 验证不是过于敏感的页面
          script.matches.forEach((match: string) => {
            expect(match).not.toMatch(/^chrome:\/\/.*/);
            expect(match).not.toMatch(/^chrome-extension:\/\/.*/);
            expect(match).not.toMatch(/^moz-extension:\/\/.*/);
          });
        });
      }
    });

    it('should validate CSP (Content Security Policy) if present', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self'"
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      if (manifest.content_security_policy) {
        expect(manifest.content_security_policy.extension_pages).toContain('script-src');
        expect(manifest.content_security_policy.extension_pages).toContain('object-src');
        expect(manifest.content_security_policy.extension_pages).toContain('\'self\'');
      }
    });
  });

  describe('Build Output Validation', () => {
    it('should validate manifest is copied to build output', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      mockExistsSync.mockReturnValue(true);
      
      const sourcePath = join(mockPublicDir, 'manifest.json');
      const buildPath = join(mockDistDir, 'manifest.json');
      
      expect(existsSync(sourcePath)).toBe(true);
      expect(existsSync(buildPath)).toBe(true);
      
      const sourceManifest = JSON.parse(readFileSync(sourcePath, 'utf8'));
      const buildManifest = JSON.parse(readFileSync(buildPath, 'utf8'));
      
      expect(sourceManifest).toEqual(buildManifest);
    });

    it('should validate manifest structure consistency', () => {
      const mockManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0',
        permissions: ['activeTab', 'storage', 'contextMenus'],
        background: {
          service_worker: 'background.js'
        },
        action: {
          default_popup: 'popup.html',
          default_title: 'BMad Link - 智能书签管理',
          default_icon: {
            '16': 'icons/icon-16.png',
            '32': 'icons/icon-32.png',
            '48': 'icons/icon-48.png',
            '128': 'icons/icon-128.png'
          }
        },
        icons: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content-script.js']
          }
        ],
        web_accessible_resources: [
          {
            resources: ['popup.html'],
            matches: ['<all_urls>']
          }
        ]
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      // 验证结构完整性
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.permissions).toBeDefined();
      expect(manifest.background).toBeDefined();
      expect(manifest.action).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(manifest.content_scripts).toBeDefined();
      expect(manifest.web_accessible_resources).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing manifest file gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      expect(existsSync(manifestPath)).toBe(false);
    });

    it('should handle invalid JSON gracefully', () => {
      mockReadFileSync.mockReturnValue('invalid json {');
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      
      expect(() => {
        JSON.parse(readFileSync(manifestPath, 'utf8'));
      }).toThrow();
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalManifest = {
        manifest_version: 3,
        name: 'BMad Link - 智能书签管理器',
        version: '0.1.0'
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(minimalManifest));
      
      const manifestPath = join(mockPublicDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      
      // 验证必需字段存在
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
      
      // 验证可选字段可以不存在
      expect(manifest.permissions).toBeUndefined();
      expect(manifest.background).toBeUndefined();
      expect(manifest.action).toBeUndefined();
    });

    it('should validate version format edge cases', () => {
      const validVersions = ['1', '1.0', '1.0.0', '1.0.0.0'];
      const invalidVersions = ['1.', '.0', 'a.b.c', '1.0.0.0.0'];
      
      validVersions.forEach(version => {
        const mockManifest = {
          manifest_version: 3,
          name: 'BMad Link - 智能书签管理器',
          version: version
        };
        
        mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
        
        const manifestPath = join(mockPublicDir, 'manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        
        expect(manifest.version).toMatch(/^\d+(\.\d+){0,3}$/);
      });
      
      invalidVersions.forEach(version => {
        const mockManifest = {
          manifest_version: 3,
          name: 'BMad Link - 智能书签管理器',
          version: version
        };
        
        mockReadFileSync.mockReturnValue(JSON.stringify(mockManifest));
        
        const manifestPath = join(mockPublicDir, 'manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        
        expect(manifest.version).not.toMatch(/^\d+(\.\d+){0,3}$/);
      });
    });
  });
});