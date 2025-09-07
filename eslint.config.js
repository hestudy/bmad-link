import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json', './apps/extension/tsconfig.json', './packages/shared/tsconfig.json', './packages/ui-components/tsconfig.json']
      },
      globals: {
        browser: true,
        es2022: true,
        node: true,
        webextensions: true
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      // 基础规则
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-requiring-type-checking'].rules,
      
      // 强制规则
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      
      // 代码风格
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'method', format: ['camelCase'] },
        { selector: 'property', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] }
      ],
      
      // 性能相关
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', '**/*.js']
  }
];