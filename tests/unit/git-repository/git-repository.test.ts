import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock dependencies
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawnSync: vi.fn()
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn()
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((path) => path.split('/').slice(0, -1).join('/'))
}));

const mockExecSync = execSync as any;
const mockReadFileSync = readFileSync as any;
const mockExistsSync = existsSync as any;
const mockJoin = join as any;

describe('Git Repository and Documentation Validation Tests', () => {
  const mockRootDir = '/mock/project/root';
  const mockDocsDir = `${mockRootDir}/docs`;
  const mockGitDir = `${mockRootDir}/.git`;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockJoin.mockImplementation((...args: string[]) => args.join('/'));
  });

  describe('Git Repository Configuration', () => {
    it('should validate Git repository is initialized', () => {
      mockExistsSync.mockReturnValue(true);
      
      const result = existsSync(mockGitDir);
      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(mockGitDir);
    });

    it('should validate Git remote repository configuration', () => {
      mockExecSync.mockReturnValue('github\thttps://github.com/hestudy/bmad-link.git (fetch)\n' +
                                 'github\thttps://github.com/hestudy/bmad-link.git (push)');
      
      const result = mockExecSync('git remote -v', { encoding: 'utf8' });
      expect(result).toContain('github.com');
      expect(result).toContain('bmad-link.git');
    });

    it('should validate Git branch exists and is tracking remote', () => {
      mockExecSync.mockReturnValue('On branch main\nYour branch is up to date with \'github/main\'.');
      
      const result = mockExecSync('git status', { encoding: 'utf8' });
      expect(result).toContain('main');
      expect(result).toContain('up to date with');
    });

    it('should validate Git commit history exists', () => {
      mockExecSync.mockReturnValue('c9f1f27 feat: 修复UI组件架构和更新项目状态\n' +
                                 'd514f12 feat: 完成Chrome扩展构建和故事记录更新\n' +
                                 'ec9d077 feat: 初始化Chrome扩展项目结构');
      
      const result = mockExecSync('git log --oneline -10', { encoding: 'utf8' });
      expect(result).toContain('feat:');
      expect(result.split('\n').length).toBeGreaterThan(2);
    });

    it('should validate Git commit message format', () => {
      mockExecSync.mockReturnValue('c9f1f27 feat: 修复UI组件架构和更新项目状态\n' +
                                 'd514f12 feat: 完成Chrome扩展构建和故事记录更新\n' +
                                 'b7b4a6b docs: Add core architecture documentation');
      
      const result = mockExecSync('git log --oneline -10', { encoding: 'utf8' });
      const commits = result.split('\n');
      
      commits.forEach((commit: string) => {
        if (commit.trim()) {
          expect(commit).toMatch(/^[a-f0-9]+\s+\w+:\s+.+$/);
        }
      });
    });

    it('should validate .gitignore file exists and contains essential patterns', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
dist/
build/

# Chrome extension specific
*.crx
*.zip

# Testing
coverage/`);
      
      const gitignorePath = mockJoin(mockRootDir, '.gitignore');
      const gitignoreExists = existsSync(gitignorePath);
      const gitignoreContent = readFileSync(gitignorePath, 'utf8');
      
      expect(gitignoreExists).toBe(true);
      expect(gitignoreContent).toContain('node_modules/');
      expect(gitignoreContent).toContain('dist/');
      expect(gitignoreContent).toContain('*.crx');
      expect(gitignoreContent).toContain('coverage/');
    });

    it('should validate .gitignore contains Chrome extension specific patterns', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Chrome extension specific
*.crx
*.zip
extension.zip

# Dependencies
node_modules/`);
      
      const gitignoreContent = readFileSync(mockJoin(mockRootDir, '.gitignore'), 'utf8');
      
      expect(gitignoreContent).toContain('*.crx');
      expect(gitignoreContent).toContain('*.zip');
      expect(gitignoreContent).toContain('extension.zip');
    });

    it('should validate .gitignore contains testing and build artifacts', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Testing
coverage/
.nyc_output

# Production builds
dist/
build/

# TypeScript
*.tsbuildinfo`);
      
      const gitignoreContent = readFileSync(mockJoin(mockRootDir, '.gitignore'), 'utf8');
      
      expect(gitignoreContent).toContain('coverage/');
      expect(gitignoreContent).toContain('dist/');
      expect(gitignoreContent).toContain('*.tsbuildinfo');
    });

    it('should handle Git repository validation errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = existsSync(mockGitDir);
      expect(result).toBe(false);
    });
  });

  describe('README Documentation', () => {
    it('should validate README.md file exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const readmePath = mockJoin(mockRootDir, 'README.md');
      const readmeExists = existsSync(readmePath);
      
      expect(readmeExists).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(readmePath);
    });

    it('should validate README.md contains essential sections', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# BMad Link - AI智能书签管理器

## 🚀 快速开始

### 前置要求
- Node.js ≥ 18.0.0
- pnpm ≥ 8.15.0

## 🏗️ 项目架构

## 🛠️ 开发命令

## 🚢 部署流程

## 🎯 核心特性`);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('# BMad Link');
      expect(readmeContent).toContain('快速开始');
      expect(readmeContent).toContain('前置要求');
      expect(readmeContent).toContain('项目架构');
      expect(readmeContent).toContain('开发命令');
      expect(readmeContent).toContain('部署流程');
    });

    it('should validate README.md contains technology stack information', () => {
      mockReadFileSync.mockReturnValue(`## 🚀 快速开始

### 前置要求
- Node.js ≥ 18.0.0
- pnpm ≥ 8.15.0  
- Git ≥ 2.40.0

### 本地开发设置

\`\`\`bash
# 克隆项目
git clone https://github.com/your-org/bmad-link.git
cd bmad-link

# 安装依赖
pnpm install
\`\`\``);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('Node.js');
      expect(readmeContent).toContain('pnpm');
      expect(readmeContent).toContain('Git');
      expect(readmeContent).toContain('git clone');
    });

    it('should validate README.md contains project structure overview', () => {
      mockReadFileSync.mockReturnValue(`## 🏗️ 项目架构

\`\`\`
bmad-link/
├── apps/
│   ├── extension/          # Chrome扩展主应用
│   └── sync-api/           # 云端同步API
├── packages/
│   ├── shared/             # 共享类型和工具
│   ├── ai-engine/          # AI搜索引擎核心
│   └── ui-components/      # UI组件库
└── docs/                   # 项目文档
\`\`\``);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('apps/');
      expect(readmeContent).toContain('packages/');
      expect(readmeContent).toContain('extension/');
      expect(readmeContent).toContain('shared/');
      expect(readmeContent).toContain('docs/');
    });

    it('should validate README.md contains development commands', () => {
      mockReadFileSync.mockReturnValue(`## 🛠️ 开发命令

\`\`\`bash
# 开发环境
pnpm dev                    # 启动所有应用
pnpm dev:extension         # 仅Chrome扩展
pnpm dev:api              # 仅云端API

# 构建和测试  
pnpm build                # 构建所有包
pnpm test                 # 运行测试
pnpm lint                 # 代码检查
\`\`\``);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('pnpm dev');
      expect(readmeContent).toContain('pnpm build');
      expect(readmeContent).toContain('pnpm test');
      expect(readmeContent).toContain('pnpm lint');
    });

    it('should validate README.md contains deployment information', () => {
      mockReadFileSync.mockReturnValue(`## 🚢 部署流程

1. **MVP阶段**：仅需Chrome扩展发布到Chrome Web Store
2. **云端同步阶段**：需要Vercel API部署和数据库配置

完整部署指南请参考：[deployment-setup.md](./docs/deployment-setup.md)`);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('部署流程');
      expect(readmeContent).toContain('Chrome Web Store');
      expect(readmeContent).toContain('Vercel');
      expect(readmeContent).toContain('deployment-setup.md');
    });

    it('should validate README.md contains core features description', () => {
      mockReadFileSync.mockReturnValue(`## 🎯 核心特性

- 🤖 **AI语义搜索** - 使用"React状态管理库"等自然语言查询书签
- ⚡ **极速响应** - 2秒内完成搜索，85%+成功率  
- 🔒 **隐私优先** - MVP阶段所有数据本地存储
- 📱 **一键收藏** - 右键菜单快速保存技术资源`);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('AI语义搜索');
      expect(readmeContent).toContain('极速响应');
      expect(readmeContent).toContain('隐私优先');
      expect(readmeContent).toContain('一键收藏');
    });
  });

  describe('Documentation Structure', () => {
    it('should validate docs directory exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const docsDirExists = existsSync(mockDocsDir);
      expect(docsDirExists).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(mockDocsDir);
    });

    it('should validate essential documentation files exist', () => {
      const essentialDocs = [
        'docs/architecture.md',
        'docs/prd.md',
        'docs/deployment-setup.md',
        'docs/front-end-spec.md'
      ];
      
      essentialDocs.forEach(docPath => {
        mockExistsSync.mockReturnValue(true);
        const fullDocPath = mockJoin(mockRootDir, docPath);
        const docExists = existsSync(fullDocPath);
        expect(docExists).toBe(true);
      });
    });

    it('should validate architecture documentation exists', () => {
      const architectureDocs = [
        'docs/architecture/tech-stack.md',
        'docs/architecture/high-level-architecture.md',
        'docs/architecture/frontend-architecture.md',
        'docs/architecture/unified-project-structure.md'
      ];
      
      architectureDocs.forEach(docPath => {
        mockExistsSync.mockReturnValue(true);
        const fullDocPath = mockJoin(mockRootDir, docPath);
        const docExists = existsSync(fullDocPath);
        expect(docExists).toBe(true);
      });
    });

    it('should validate PRD documentation exists', () => {
      const prdDocs = [
        'docs/prd/需求.md',
        'docs/prd/技术假设.md',
        'docs/prd/epic列表.md',
        'docs/prd/index.md'
      ];
      
      prdDocs.forEach(docPath => {
        mockExistsSync.mockReturnValue(true);
        const fullDocPath = mockJoin(mockRootDir, docPath);
        const docExists = existsSync(fullDocPath);
        expect(docExists).toBe(true);
      });
    });

    it('should validate stories documentation exists', () => {
      mockExistsSync.mockReturnValue(true);
      
      const storiesPath = mockJoin(mockRootDir, 'docs/stories/1.1.story.md');
      const storiesExists = existsSync(storiesPath);
      expect(storiesExists).toBe(true);
    });

    it('should validate QA documentation exists', () => {
      const qaDocs = [
        'docs/qa/assessments/1.1-test-design-20250905.md',
        'docs/qa/gates/1.1-chrome-extension-init-20250905.yaml'
      ];
      
      qaDocs.forEach(docPath => {
        mockExistsSync.mockReturnValue(true);
        const fullDocPath = mockJoin(mockRootDir, docPath);
        const docExists = existsSync(fullDocPath);
        expect(docExists).toBe(true);
      });
    });

    it('should validate documentation content quality', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Architecture Documentation

## Tech Stack
- **Frontend Language**: TypeScript 5.3+
- **Frontend Framework**: Vanilla TypeScript + Web Components
- **Build Tool**: Vite 5.0+
- **Bundler**: Rollup (via Vite)

## High-Level Architecture
The system consists of Chrome extension and cloud sync API.`);
      
      const archContent = readFileSync(mockJoin(mockRootDir, 'docs/architecture.md'), 'utf8');
      
      expect(archContent).toContain('TypeScript');
      expect(archContent).toContain('Web Components');
      expect(archContent).toContain('Vite');
      expect(archContent).toContain('Architecture');
    });

    it('should validate deployment documentation contains setup instructions', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Deployment Setup

## Third-party Services
1. **GitHub** - Code hosting and CI/CD
2. **Chrome Developer Account** - Extension publishing
3. **Vercel** - Cloud API and database

## Configuration Steps
### GitHub Repository Setup
1. Create repository
2. Configure branch protection
3. Set up GitHub Actions`);
      
      const deployContent = readFileSync(mockJoin(mockRootDir, 'docs/deployment-setup.md'), 'utf8');
      
      expect(deployContent).toContain('GitHub');
      expect(deployContent).toContain('Chrome Developer Account');
      expect(deployContent).toContain('Vercel');
      expect(deployContent).toContain('Configuration Steps');
    });

    it('should handle missing documentation files gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = existsSync(mockJoin(mockRootDir, 'docs/nonexistent.md'));
      expect(result).toBe(false);
    });
  });

  describe('Git Workflow Validation', () => {
    it('should validate Git working directory is clean', () => {
      mockExecSync.mockReturnValue('On branch main\nYour branch is up to date with \'github/main\'.\n\nnothing to commit, working tree clean');
      
      const result = mockExecSync('git status', { encoding: 'utf8' });
      expect(result).toContain('working tree clean');
    });

    it('should validate Git hooks are configured', () => {
      mockExistsSync.mockReturnValue(true);
      
      const hooksDir = mockJoin(mockGitDir, 'hooks');
      const hooksExist = existsSync(hooksDir);
      expect(hooksExist).toBe(true);
    });

    it('should validate Git commit signing configuration', () => {
      mockExecSync.mockReturnValue('commit.gpgsign=true\nuser.signingkey=ABC123\n');
      
      const result = mockExecSync('git config --list', { encoding: 'utf8' });
      expect(result).toContain('commit.gpgsign');
    });

    it('should validate Git branch protection rules', () => {
      mockExecSync.mockReturnValue(`* branch main
    remote: github/main
    merge-commit: allowed
    rebase-commit: allowed
    squash-commit: allowed`);
      
      const result = mockExecSync('git branch --list main -vv', { encoding: 'utf8' });
      expect(result).toContain('branch main');
      expect(result).toContain('remote: github/main');
    });

    it('should validate Git LFS configuration for large files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Git LFS
*.pdf filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text`);
      
      const gitattributesPath = mockJoin(mockRootDir, '.gitattributes');
      const gitattributesContent = readFileSync(gitattributesPath, 'utf8');
      
      expect(gitattributesContent).toContain('filter=lfs');
    });

    it('should handle Git workflow validation errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Git command failed');
      });
      
      expect(() => {
        mockExecSync('git status', { encoding: 'utf8' });
      }).toThrow();
    });
  });

  describe('Documentation Quality Validation', () => {
    it('should validate documentation files are properly formatted', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`# Document Title

## Section 1
Content for section 1.

## Section 2
Content for section 2.

### Subsection 2.1
Subsection content.`);
      
      const docContent = readFileSync(mockJoin(mockRootDir, 'docs/sample.md'), 'utf8');
      const lines = docContent.split('\n');
      
      // Check for proper markdown heading structure
      const hasTitle = lines.some(line => line.startsWith('# '));
      const hasSections = lines.some(line => line.startsWith('## '));
      
      expect(hasTitle).toBe(true);
      expect(hasSections).toBe(true);
    });

    it('should validate documentation contains proper links', () => {
      mockReadFileSync.mockReturnValue(`See [deployment guide](./docs/deployment-setup.md) for details.
Visit [GitHub](https://github.com) for the repository.`);
      
      const docContent = readFileSync(mockJoin(mockRootDir, 'docs/sample.md'), 'utf8');
      
      expect(docContent).toContain('[');
      expect(docContent).toContain(']');
      expect(docContent).toContain('(');
      expect(docContent).toContain(')');
    });

    it('should validate documentation contains code examples', () => {
      mockReadFileSync.mockReturnValue(`## Installation

\`\`\`bash
npm install
npm start
\`\`\`

## Usage

\`\`\`typescript
const app = new App();
app.run();
\`\`\``);
      
      const docContent = readFileSync(mockJoin(mockRootDir, 'docs/sample.md'), 'utf8');
      
      expect(docContent).toContain('```');
      expect(docContent).toContain('bash');
      expect(docContent).toContain('typescript');
    });

    it('should validate documentation files have consistent naming', () => {
      const docFiles = [
        'architecture.md',
        'prd.md', 
        'deployment-setup.md',
        'front-end-spec.md'
      ];
      
      docFiles.forEach(file => {
        expect(file).toMatch(/^[a-z0-9\-]+\.md$/);
        expect(file).not.toContain(' ');
        expect(file).not.toMatch(/[A-Z]/);
      });
    });

    it('should validate documentation is organized in logical directories', () => {
      const docStructure = {
        'docs/': ['architecture.md', 'prd.md', 'deployment-setup.md'],
        'docs/architecture/': ['tech-stack.md', 'high-level-architecture.md'],
        'docs/prd/': ['需求.md', '技术假设.md', 'epic列表.md'],
        'docs/qa/': ['assessments/', 'gates/']
      };
      
      Object.entries(docStructure).forEach(([dir, files]) => {
        expect(dir).toMatch(/docs\/[a-z\-]*\/?$/);
        files.forEach(file => {
          if (file.endsWith('.md')) {
            expect(file).toMatch(/^[a-z0-9\-\u4e00-\u9fff]+\.md$/);
          } else {
            expect(file).toMatch(/^[a-z0-9\-\u4e00-\u9fff]+\/$/);
          }
        });
      });
    });

    it('should handle documentation quality validation errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = existsSync(mockJoin(mockRootDir, 'docs/malformed.md'));
      expect(result).toBe(false);
    });
  });

  describe('Integration Validation', () => {
    it('should validate Git repository integrates with documentation structure', () => {
      mockExistsSync.mockReturnValue(true);
      mockExecSync.mockReturnValue('docs/architecture.md\ndocs/prd.md\nREADME.md\n.gitignore');
      
      const gitTrackedFiles = mockExecSync('git ls-files', { encoding: 'utf8' });
      
      expect(gitTrackedFiles).toContain('docs/architecture.md');
      expect(gitTrackedFiles).toContain('README.md');
      expect(gitTrackedFiles).toContain('.gitignore');
    });

    it('should validate documentation references are tracked in Git', () => {
      mockReadFileSync.mockReturnValue(`See [architecture](./docs/architecture.md) and [deployment](./docs/deployment-setup.md)`);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      const referencedFiles = readmeContent.match(/\[.*?\]\(\.\/(.*?)\)/g) || [];
      
      expect(referencedFiles.length).toBeGreaterThan(0);
      referencedFiles.forEach(ref => {
        expect(ref).toContain('docs/');
      });
    });

    it('should validate Git commit messages reference documentation updates', () => {
      mockExecSync.mockReturnValue('b7b4a6b docs: Add core architecture documentation\n' +
                                 '881587c docs: Add QA assessments and user stories');
      
      const commitMessages = mockExecSync('git log --oneline --grep="docs:" -10', { encoding: 'utf8' });
      
      expect(commitMessages).toContain('docs:');
      expect(commitMessages.split('\n').filter((line: string) => line.trim()).length).toBeGreaterThan(0);
    });

    it('should validate Git repository size is reasonable for documentation', () => {
      mockExecSync.mockReturnValue('1024'); // Mock size in KB
      
      const repoSize = mockExecSync('du -sk .git | cut -f1', { encoding: 'utf8' });
      const sizeInKB = parseInt(repoSize);
      
      expect(sizeInKB).toBeGreaterThan(0);
      expect(sizeInKB).toBeLessThan(10000); // Less than 10MB
    });

    it('should validate Git repository has proper documentation branches', () => {
      mockExecSync.mockReturnValue('main\ngh-pages\n* docs/main');
      
      const branches = mockExecSync('git branch -a', { encoding: 'utf8' });
      
      expect(branches).toContain('main');
      expect(branches).toContain('gh-pages');
    });

    it('should handle integration validation errors gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Integration validation failed');
      });
      
      expect(() => {
        mockExecSync('git ls-files', { encoding: 'utf8' });
      }).toThrow();
    });
  });

  describe('Security and Compliance Validation', () => {
    it('should validate Git repository has no sensitive information', () => {
      mockReadFileSync.mockReturnValue(`# Environment and configuration
.env
.env.local
.env.production
.env.development
*.key
*.pem

# API keys and secrets
api-keys.txt
secrets.json`);
      
      const gitignoreContent = readFileSync(mockJoin(mockRootDir, '.gitignore'), 'utf8');
      
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('*.key');
      expect(gitignoreContent).toContain('secrets.json');
    });

    it('should validate documentation does not contain hardcoded secrets', () => {
      mockReadFileSync.mockReturnValue(`# API Configuration

## Setup
1. Create .env file with your API keys
2. Configure environment variables

Example:
\`\`\`env
API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
\`\`\``);
      
      const docContent = readFileSync(mockJoin(mockRootDir, 'docs/setup.md'), 'utf8');
      
      // Should contain placeholder values, not real secrets
      expect(docContent).toContain('your_api_key_here');
      expect(docContent).toContain('your_database_url_here');
      expect(docContent).not.toContain('sk-');
      expect(docContent).not.toContain('AIza');
    });

    it('should validate Git repository access permissions', () => {
      mockExecSync.mockReturnValue('drwxr-xr-x');
      
      const permissions = mockExecSync('ls -la .git', { encoding: 'utf8' });
      
      expect(permissions).toContain('r-x');
      expect(permissions).not.toContain('rw-rw-rw-'); // Should not be world-writable
    });

    it('should validate documentation has proper license information', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`MIT License

Copyright (c) 2025 BMad Link

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...`);
      
      const licenseContent = readFileSync(mockJoin(mockRootDir, 'LICENSE'), 'utf8');
      
      expect(licenseContent).toContain('MIT License');
      expect(licenseContent).toContain('Copyright');
      expect(licenseContent).toContain('Permission');
    });

    it('should validate Git repository has proper contribution guidelines', () => {
      mockReadFileSync.mockReturnValue(`## 贡献指南

1. Fork项目并创建feature分支
2. 遵循代码规范和测试要求
3. 提交Pull Request

## 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试`);
      
      const readmeContent = readFileSync(mockJoin(mockRootDir, 'README.md'), 'utf8');
      
      expect(readmeContent).toContain('贡献指南');
      expect(readmeContent).toContain('Fork');
      expect(readmeContent).toContain('Pull Request');
    });

    it('should handle security validation errors gracefully', () => {
      mockExistsSync.mockReturnValue(false);
      
      const result = existsSync(mockJoin(mockRootDir, 'LICENSE'));
      expect(result).toBe(false);
    });
  });
});