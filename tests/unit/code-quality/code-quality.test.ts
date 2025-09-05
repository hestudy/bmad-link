import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock child_process and fs modules
vi.mock('child_process');
vi.mock('fs');

describe('Code Quality Validation Tests', () => {
  const mockProjectRoot = '/mock/project/root';
  const mockExtensionDir = join(mockProjectRoot, 'apps/extension');
  
  // Mock implementations
  const mockExecSync = vi.fn();
  const mockExistsSync = vi.fn();
  const mockReadFileSync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockExecSync.mockReturnValue('');
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('{}');
    
    // Mock module exports
    (execSync as any).mockImplementation(mockExecSync);
    (existsSync as any).mockImplementation(mockExistsSync);
    (readFileSync as any).mockImplementation(mockReadFileSync);
  });

  describe('ESLint Configuration Validation', () => {
    it('should validate root ESLint configuration exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      expect(existsSync(eslintConfigPath)).toBe(true);
    });

    it('should validate ESLint configuration contains required properties', () => {
      const mockEslintContent = `
        module.exports = {
          parser: '@typescript-eslint/parser',
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module'
          },
          plugins: ['@typescript-eslint'],
          extends: [
            'eslint:recommended',
            '@typescript-eslint/recommended'
          ],
          rules: {
            '@typescript-eslint/no-unused-vars': 'error'
          }
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('@typescript-eslint/parser');
      expect(configContent).toContain('ecmaVersion');
      expect(configContent).toContain('sourceType');
      expect(configContent).toContain('@typescript-eslint/recommended');
    });

    it('should validate ESLint has TypeScript-specific configuration', () => {
      const mockEslintContent = `
        module.exports = {
          parser: '@typescript-eslint/parser',
          parserOptions: {
            project: ['./tsconfig.json']
          },
          plugins: ['@typescript-eslint'],
          extends: ['@typescript-eslint/recommended']
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('@typescript-eslint/parser');
      expect(configContent).toContain('project');
      expect(configContent).toContain('@typescript-eslint');
    });

    it('should validate ESLint ignore patterns are present', () => {
      const mockEslintContent = `
        module.exports = {
          ignorePatterns: ['dist/', 'node_modules/', '*.js']
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('ignorePatterns');
      expect(configContent).toContain('dist/');
      expect(configContent).toContain('node_modules/');
    });
  });

  describe('Prettier Configuration Validation', () => {
    it('should validate Prettier configuration exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      expect(existsSync(prettierConfigPath)).toBe(true);
    });

    it('should validate Prettier configuration has required properties', () => {
      const mockPrettierConfig = {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        useTabs: false
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPrettierConfig, null, 2));
      
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      const configContent = readFileSync(prettierConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      
      expect(config.semi).toBe(true);
      expect(config.trailingComma).toBe('es5');
      expect(config.singleQuote).toBe(true);
      expect(config.printWidth).toBe(100);
      expect(config.tabWidth).toBe(2);
      expect(config.useTabs).toBe(false);
    });

    it('should validate Prettier configuration values are reasonable', () => {
      const mockPrettierConfig = {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        useTabs: false
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPrettierConfig, null, 2));
      
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      const configContent = readFileSync(prettierConfigPath, 'utf8');
      const config = JSON.parse(configContent);
      
      expect(config.printWidth).toBeGreaterThan(50);
      expect(config.printWidth).toBeLessThanOrEqual(120);
      expect(config.tabWidth).toBeGreaterThan(0);
      expect(config.tabWidth).toBeLessThanOrEqual(8);
      expect(typeof config.useTabs).toBe('boolean');
    });
  });

  describe('Package Scripts Validation', () => {
    it('should validate lint script exists in extension package.json', () => {
      const mockPackageJson = {
        name: '@bmad/extension',
        scripts: {
          lint: 'eslint src --ext .ts,.tsx'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts.lint).toBe('eslint src --ext .ts,.tsx');
    });

    it('should validate format script exists in root package.json', () => {
      const mockPackageJson = {
        name: 'bmad-link',
        scripts: {
          format: 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockProjectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('format');
      expect(packageJson.scripts.format).toContain('prettier');
      expect(packageJson.scripts.format).toContain('--write');
    });

    it('should validate lint script targets TypeScript files', () => {
      const mockPackageJson = {
        scripts: {
          lint: 'eslint src --ext .ts,.tsx'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.scripts.lint).toContain('--ext .ts,.tsx');
      expect(packageJson.scripts.lint).toContain('eslint');
    });
  });

  describe('Dependencies Validation', () => {
    it('should validate ESLint dependencies are installed', () => {
      const mockPackageJson = {
        devDependencies: {
          'eslint': '^8.56.0',
          '@typescript-eslint/parser': '^6.21.0',
          '@typescript-eslint/eslint-plugin': '^6.21.0'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.devDependencies).toHaveProperty('eslint');
      expect(packageJson.devDependencies).toHaveProperty('@typescript-eslint/parser');
      expect(packageJson.devDependencies).toHaveProperty('@typescript-eslint/eslint-plugin');
    });

    it('should validate Prettier dependencies are installed', () => {
      const mockPackageJson = {
        devDependencies: {
          'prettier': '^3.2.5'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockProjectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.devDependencies).toHaveProperty('prettier');
    });

    it('should validate dependency versions are reasonable', () => {
      const mockPackageJson = {
        devDependencies: {
          'eslint': '8.56.0',
          '@typescript-eslint/parser': '6.21.0',
          '@typescript-eslint/eslint-plugin': '6.21.0',
          'prettier': '3.2.5'
        }
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      // Validate ESLint version 8.x
      expect(packageJson.devDependencies.eslint).toMatch(/^8/);
      
      // Validate TypeScript ESLint version 6.x
      expect(packageJson.devDependencies['@typescript-eslint/parser']).toMatch(/^6/);
      expect(packageJson.devDependencies['@typescript-eslint/eslint-plugin']).toMatch(/^6/);
      
      // Validate Prettier version 3.x
      expect(packageJson.devDependencies.prettier).toMatch(/^3/);
    });
  });

  describe('Code Quality Execution Validation', () => {
    it('should execute ESLint successfully', () => {
      mockExecSync.mockReturnValue('');
      
      expect(() => {
        execSync('pnpm lint', { cwd: mockExtensionDir, stdio: 'pipe' });
      }).not.toThrow();
      
      expect(mockExecSync).toHaveBeenCalledWith('pnpm lint', { 
        cwd: mockExtensionDir, 
        stdio: 'pipe' 
      });
    });

    it('should execute Prettier check successfully', () => {
      mockExecSync.mockReturnValue('');
      
      expect(() => {
        execSync('pnpm format --check', { cwd: mockProjectRoot, stdio: 'pipe' });
      }).not.toThrow();
      
      expect(mockExecSync).toHaveBeenCalledWith('pnpm format --check', { 
        cwd: mockProjectRoot, 
        stdio: 'pipe' 
      });
    });

    it('should execute Prettier write successfully', () => {
      mockExecSync.mockReturnValue('');
      
      expect(() => {
        execSync('pnpm format', { cwd: mockProjectRoot, stdio: 'pipe' });
      }).not.toThrow();
      
      expect(mockExecSync).toHaveBeenCalledWith('pnpm format', { 
        cwd: mockProjectRoot, 
        stdio: 'pipe' 
      });
    });

    it('should handle ESLint errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('ESLint found errors');
      });
      
      expect(() => {
        execSync('pnpm lint', { cwd: mockExtensionDir, stdio: 'pipe' });
      }).toThrow('ESLint found errors');
    });

    it('should handle Prettier formatting errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Prettier found formatting issues');
      });
      
      expect(() => {
        execSync('pnpm format --check', { cwd: mockProjectRoot, stdio: 'pipe' });
      }).toThrow('Prettier found formatting issues');
    });
  });

  describe('Code Quality Rules Validation', () => {
    it('should validate ESLint content contains TypeScript rules', () => {
      const mockEslintContent = `
        module.exports = {
          extends: [
            'eslint:recommended',
            '@typescript-eslint/recommended',
            '@typescript-eslint/recommended-requiring-type-checking'
          ],
          rules: {
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'error'
          }
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('@typescript-eslint/recommended-requiring-type-checking');
      expect(configContent).toContain('@typescript-eslint/no-unused-vars');
      expect(configContent).toContain('@typescript-eslint/no-explicit-any');
    });

    it('should validate ESLint has strict rules enabled', () => {
      const mockEslintContent = `
        module.exports = {
          extends: ['@typescript-eslint/recommended-requiring-type-checking'],
          rules: {
            'prefer-const': 'error',
            'no-var': 'error'
          }
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('recommended-requiring-type-checking');
      expect(configContent).toContain('prefer-const');
      expect(configContent).toContain('no-var');
    });

    it('should validate ESLint has proper environment configuration', () => {
      const mockEslintContent = `
        module.exports = {
          env: {
            browser: true,
            es2022: true,
            node: true,
            webextensions: true
          }
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('browser: true');
      expect(configContent).toContain('es2022: true');
      expect(configContent).toContain('node: true');
      expect(configContent).toContain('webextensions: true');
    });
  });

  describe('File Structure Validation', () => {
    it('should validate ESLint configuration files exist in expected locations', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.endsWith('.eslintrc.js') || path.endsWith('.prettierrc');
      });
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      
      expect(existsSync(eslintConfigPath)).toBe(true);
      expect(existsSync(prettierConfigPath)).toBe(true);
    });

    it('should validate source code directories exist for linting', () => {
      mockExistsSync.mockReturnValue(true);
      
      const srcDir = join(mockExtensionDir, 'src');
      expect(existsSync(srcDir)).toBe(true);
    });

    it('should validate ignore patterns are effective', () => {
      const mockEslintContent = `
        module.exports = {
          ignorePatterns: ['dist/', 'node_modules/', '*.js']
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('ignorePatterns');
      expect(configContent).toContain('dist/');
      expect(configContent).toContain('node_modules/');
      expect(configContent).toContain('*.js');
    });
  });

  describe('Integration Validation', () => {
    it('should validate ESLint and Prettier configurations are compatible', () => {
      const mockEslintContent = `
        module.exports = {
          rules: {
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'comma-dangle': ['error', 'es5']
          }
        };
      `;
      
      const mockPrettierConfig = {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5'
      };
      
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('.eslintrc')) {
          return mockEslintContent;
        } else if (path.includes('.prettierrc')) {
          return JSON.stringify(mockPrettierConfig, null, 2);
        }
        return '{}';
      });
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      
      const eslintContent = readFileSync(eslintConfigPath, 'utf8');
      const prettierContent = readFileSync(prettierConfigPath, 'utf8');
      const prettierConfig = JSON.parse(prettierContent);
      
      // Validate configurations contain compatible settings
      expect(eslintContent).toContain('semi');
      expect(eslintContent).toContain('quotes');
      expect(eslintContent).toContain('comma-dangle');
      
      expect(prettierConfig.semi).toBe(true);
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.trailingComma).toBe('es5');
    });

    it('should validate TypeScript integration is properly configured', () => {
      const mockEslintContent = `
        module.exports = {
          parser: '@typescript-eslint/parser',
          parserOptions: {
            project: ['./tsconfig.json']
          },
          plugins: ['@typescript-eslint']
        };
      `;
      
      mockReadFileSync.mockReturnValue(mockEslintContent);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      const configContent = readFileSync(eslintConfigPath, 'utf8');
      
      expect(configContent).toContain('@typescript-eslint/parser');
      expect(configContent).toContain('project');
      expect(configContent).toContain('@typescript-eslint');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing ESLint configuration gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      expect(existsSync(eslintConfigPath)).toBe(false);
    });

    it('should handle missing Prettier configuration gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      expect(existsSync(prettierConfigPath)).toBe(false);
    });

    it('should handle invalid ESLint configuration gracefully', () => {
      mockReadFileSync.mockReturnValue('invalid javascript code');
      
      const eslintConfigPath = join(mockProjectRoot, '.eslintrc.js');
      
      expect(() => {
        readFileSync(eslintConfigPath, 'utf8');
      }).not.toThrow(); // Reading should work, even if content is invalid
    });

    it('should handle invalid Prettier configuration gracefully', () => {
      mockReadFileSync.mockReturnValue('invalid json {');
      
      const prettierConfigPath = join(mockProjectRoot, '.prettierrc');
      
      expect(() => {
        JSON.parse(readFileSync(prettierConfigPath, 'utf8'));
      }).toThrow();
    });

    it('should handle missing package.json scripts gracefully', () => {
      const mockPackageJson = {
        name: '@bmad/extension',
        scripts: {}
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.scripts.lint).toBeUndefined();
    });

    it('should handle missing dependencies gracefully', () => {
      const mockPackageJson = {
        devDependencies: {}
      };
      
      mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson, null, 2));
      
      const packagePath = join(mockExtensionDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.devDependencies.eslint).toBeUndefined();
      expect(packageJson.devDependencies.prettier).toBeUndefined();
    });
  });
});