# BMad Link 编码标准

## 概述

本文档定义了BMad Link项目的编码标准和最佳实践，确保代码质量、可维护性和团队协作效率。所有代码必须严格遵守这些标准。

## TypeScript 编码规范

### 基本规则

```typescript
// ✅ 正确：使用interface定义数据结构
interface BookmarkData {
  readonly id: string;
  title: string;
  url: string;
  tags: readonly string[];
  createdAt: Date;
}

// ❌ 错误：使用type定义复杂结构（应该用interface）
type BookmarkData = {
  id: string;
  title: string;
}

// ✅ 正确：使用type定义联合类型
type ContentType = 'DOCUMENT' | 'TOOL' | 'TUTORIAL' | 'API_REFERENCE';

// ✅ 正确：使用枚举定义常量
enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  CONFLICT = 'conflict'
}
```

### 命名约定

```typescript
// ✅ 文件命名：kebab-case
// ai-search-engine.ts
// bookmark-manager.ts
// sync-conflict-resolver.ts

// ✅ 类命名：PascalCase
class AISearchEngine implements SearchEngine {
  // ✅ 私有属性：下划线前缀
  private _modelCache: Map<string, Model> = new Map();
  
  // ✅ 公共属性：camelCase
  public readonly modelVersion: string;
  
  // ✅ 方法命名：camelCase + 动词开头
  async generateVector(text: string): Promise<Float32Array> {
    return this._processText(text);
  }
  
  // ✅ 私有方法：下划线前缀
  private async _processText(text: string): Promise<Float32Array> {
    // 实现
  }
}

// ✅ 常量：SCREAMING_SNAKE_CASE
const MAX_BOOKMARK_TITLE_LENGTH = 200;
const DEFAULT_SEARCH_TIMEOUT = 5000;
const AI_MODEL_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

// ✅ 接口命名：PascalCase + 描述性后缀
interface SearchEngineConfig { }
interface BookmarkValidationResult { }
interface SyncOperationOptions { }
```

### 错误处理标准

```typescript
// ✅ 正确：自定义错误类
class BookmarkValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    message: string
  ) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'BookmarkValidationError';
  }
}

// ✅ 正确：使用Result模式处理可能失败的操作
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function validateBookmark(bookmark: unknown): Promise<Result<Bookmark, BookmarkValidationError>> {
  try {
    const validated = await performValidation(bookmark);
    return { success: true, data: validated };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof BookmarkValidationError 
        ? error 
        : new BookmarkValidationError('unknown', bookmark, error.message)
    };
  }
}

// ✅ 正确：错误处理链
async function searchBookmarks(query: string): Promise<SearchResult[]> {
  const vectorResult = await this.aiEngine.generateVector(query);
  if (!vectorResult.success) {
    // 降级到关键词搜索
    console.warn('AI向量生成失败，使用关键词搜索', vectorResult.error);
    return this.keywordSearch(query);
  }
  
  return this.vectorSearch(vectorResult.data);
}
```

### 异步代码规范

```typescript
// ✅ 正确：使用async/await，避免Promise链
async function processBookmarks(bookmarks: Bookmark[]): Promise<ProcessedBookmark[]> {
  const results: ProcessedBookmark[] = [];
  
  // ✅ 对于需要串行处理的操作
  for (const bookmark of bookmarks) {
    try {
      const processed = await this.processBookmark(bookmark);
      results.push(processed);
    } catch (error) {
      console.error(`处理书签 ${bookmark.id} 失败:`, error);
      // 继续处理其他书签
    }
  }
  
  return results;
}

// ✅ 正确：对于可以并行处理的操作
async function generateVectors(texts: string[]): Promise<Float32Array[]> {
  const promises = texts.map(text => this.generateVector(text));
  
  // 使用Promise.allSettled处理部分失败
  const results = await Promise.allSettled(promises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<Float32Array> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

// ✅ 正确：超时处理
async function searchWithTimeout(query: string, timeoutMs = 5000): Promise<SearchResult[]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Search timeout')), timeoutMs);
  });
  
  return Promise.race([
    this.performSearch(query),
    timeoutPromise
  ]);
}
```

## 文件组织规范

### 目录结构

```text
src/
├── components/                 # UI组件
│   ├── base/                  # 基础组件
│   │   ├── button.ts
│   │   ├── input.ts
│   │   └── modal.ts
│   ├── search/                # 搜索相关组件
│   │   ├── search-input.ts
│   │   ├── search-results.ts
│   │   └── search-filters.ts
│   └── bookmark/              # 书签相关组件
│       ├── bookmark-card.ts
│       ├── bookmark-list.ts
│       └── bookmark-editor.ts
├── services/                  # 业务服务
│   ├── ai/                   # AI相关服务
│   │   ├── search-engine.ts
│   │   ├── vector-store.ts
│   │   └── model-manager.ts
│   ├── data/                 # 数据管理
│   │   ├── bookmark-manager.ts
│   │   ├── storage-adapter.ts
│   │   └── migration-manager.ts
│   └── sync/                 # 同步服务
│       ├── sync-manager.ts
│       ├── conflict-resolver.ts
│       └── auth-manager.ts
├── types/                    # 类型定义
│   ├── bookmark.ts
│   ├── search.ts
│   ├── sync.ts
│   └── errors.ts
├── utils/                    # 工具函数
│   ├── validation.ts
│   ├── crypto.ts
│   ├── text-processing.ts
│   └── performance.ts
├── constants/                # 常量定义
│   ├── config.ts
│   ├── error-codes.ts
│   └── defaults.ts
└── tests/                   # 测试文件（与src结构对应）
    ├── components/
    ├── services/
    └── utils/
```

### 文件命名规范

```text
✅ 正确的文件名：
ai-search-engine.ts           # 服务类
bookmark-card.component.ts    # UI组件
sync-manager.service.ts       # 业务服务
validation.utils.ts           # 工具函数
bookmark.types.ts            # 类型定义
ai-engine.test.ts           # 测试文件
config.constants.ts         # 常量文件

❌ 错误的文件名：
AISearchEngine.ts           # 不使用PascalCase
bookmarkCard.ts            # 不使用camelCase
sync_manager.ts            # 不使用snake_case
Validation.ts              # 不使用不必要的大写
```

### 导入/导出规范

```typescript
// ✅ 文件顶部：导入顺序
// 1. Node.js 内置模块
import { readFile } from 'fs/promises';

// 2. 第三方库
import * as tf from '@tensorflow/tfjs';
import { z } from 'zod';

// 3. 项目内部模块（按层级排序）
import { BookmarkManager } from '../services/data/bookmark-manager';
import { AISearchEngine } from '../services/ai/search-engine';
import { Bookmark, SearchResult } from '../types/bookmark';
import { validateBookmark } from '../utils/validation';
import { AI_MODEL_URL, MAX_SEARCH_RESULTS } from '../constants/config';

// ✅ 具名导出优于默认导出
export class SearchService {
  // 实现
}

export interface SearchOptions {
  // 定义
}

// ✅ 默认导出只用于主要类/组件
export default class AISearchEngine {
  // 实现
}

// ✅ 重新导出用于创建清晰的API
// services/index.ts
export { BookmarkManager } from './data/bookmark-manager';
export { AISearchEngine } from './ai/search-engine';
export { SyncManager } from './sync/sync-manager';
```

## 注释和文档规范

### JSDoc注释

```typescript
/**
 * AI驱动的书签搜索引擎
 * 
 * 使用TensorFlow.js和Universal Sentence Encoder模型进行语义搜索，
 * 支持自然语言查询和相似度匹配。
 * 
 * @example
 * ```typescript
 * const engine = new AISearchEngine();
 * await engine.initialize({ modelUrl: 'https://...' });
 * const results = await engine.search('React状态管理');
 * ```
 * 
 * @since 1.0.0
 */
export class AISearchEngine {
  /**
   * 执行书签语义搜索
   * 
   * @param query - 搜索查询文本
   * @param options - 搜索选项配置
   * @returns 排序后的搜索结果数组
   * 
   * @throws {AIEngineError} 当模型未初始化时
   * @throws {SearchTimeoutError} 当搜索超时时
   * 
   * @example
   * ```typescript
   * const results = await engine.searchBookmarks('CSS布局工具', {
   *   maxResults: 10,
   *   minSimilarity: 0.6
   * });
   * ```
   */
  async searchBookmarks(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // 实现
  }
  
  /**
   * 为文本生成512维语义向量
   * 
   * @internal 此方法仅供内部使用
   * @param text - 待处理的文本内容
   * @returns 512维Float32Array向量
   */
  private async _generateVector(text: string): Promise<Float32Array> {
    // 实现
  }
}
```

### 内联注释规范

```typescript
class BookmarkManager {
  async createBookmark(data: CreateBookmarkRequest): Promise<Bookmark> {
    // 1. 输入验证 - 确保所有必需字段存在
    const validation = this._validateInput(data);
    if (!validation.valid) {
      throw new ValidationError(validation.errors[0]);
    }
    
    // 2. 重复检查 - 避免相同URL的书签
    const existing = await this._findByUrl(data.url);
    if (existing) {
      // TODO: 考虑提供"更新现有书签"的选项
      throw new DuplicateBookmarkError(data.url);
    }
    
    // 3. 生成向量 - 异步操作，可能失败
    let aiVector: Float32Array;
    try {
      aiVector = await this._aiEngine.generateVector(data.content);
    } catch (error) {
      // 降级处理：使用零向量，后续可重新生成
      console.warn('AI向量生成失败，使用零向量', error);
      aiVector = new Float32Array(512);
    }
    
    // 4. 构建书签对象
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      ...data,
      aiVector,
      createdAt: new Date(),
      updatedAt: new Date(),
      // NOTE: 同步元数据将在启用云同步时使用
      syncMetadata: this._createSyncMetadata()
    };
    
    // 5. 持久化存储
    await this._storage.save(bookmark);
    
    return bookmark;
  }
}
```

## 性能编码规范

### 内存管理

```typescript
// ✅ 正确：及时清理资源
class AIModelManager {
  private models = new Map<string, tf.LayersModel>();
  private vectorCache = new LRUCache<string, Float32Array>(100);
  
  async loadModel(url: string): Promise<tf.LayersModel> {
    // 检查是否已加载
    const existing = this.models.get(url);
    if (existing) {
      return existing;
    }
    
    // 加载新模型前清理旧模型
    this._cleanupOldModels();
    
    const model = await tf.loadLayersModel(url);
    this.models.set(url, model);
    
    return model;
  }
  
  private _cleanupOldModels(): void {
    // 如果模型太多，清理最旧的
    if (this.models.size >= 3) {
      const [oldestUrl] = this.models.keys();
      const oldModel = this.models.get(oldestUrl)!;
      
      // ✅ 重要：释放TensorFlow.js资源
      oldModel.dispose();
      this.models.delete(oldestUrl);
    }
  }
  
  dispose(): void {
    // ✅ 清理所有资源
    for (const model of this.models.values()) {
      model.dispose();
    }
    this.models.clear();
    this.vectorCache.clear();
  }
}
```

### 性能优化模式

```typescript
// ✅ 正确：批量处理
class BookmarkProcessor {
  // 使用批量处理提高性能
  async processBatch(bookmarks: Bookmark[]): Promise<ProcessedBookmark[]> {
    const BATCH_SIZE = 10;
    const results: ProcessedBookmark[] = [];
    
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(bookmark => this.processBookmark(bookmark))
      );
      results.push(...batchResults);
      
      // ✅ 避免阻塞主线程
      if (i % (BATCH_SIZE * 5) === 0) {
        await this._yield();
      }
    }
    
    return results;
  }
  
  private async _yield(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

// ✅ 正确：使用防抖和节流
class SearchController {
  private searchDebounced = this._debounce(this._performSearch.bind(this), 300);
  
  onSearchInput(query: string): void {
    this.searchDebounced(query);
  }
  
  private _debounce<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): T {
    let timeoutId: number;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    }) as T;
  }
}
```

## 测试编码规范

### 单元测试结构

```typescript
// ai-search-engine.test.ts
describe('AISearchEngine', () => {
  let engine: AISearchEngine;
  let mockModel: jest.Mocked<tf.LayersModel>;
  
  beforeEach(async () => {
    mockModel = createMockTensorFlowModel();
    engine = new AISearchEngine();
    
    // 注入mock依赖
    (engine as any)._model = mockModel;
  });
  
  afterEach(async () => {
    await engine.dispose();
    jest.clearAllMocks();
  });
  
  describe('searchBookmarks', () => {
    it('should return sorted results by similarity score', async () => {
      // Arrange
      const query = 'React状态管理';
      const bookmarks = createTestBookmarks(5);
      const context = { bookmarks, maxResults: 10 };
      
      mockModel.predict.mockReturnValue(
        tf.tensor1d([0.8, 0.6, 0.9, 0.4, 0.7])
      );
      
      // Act
      const results = await engine.searchBookmarks(query, context);
      
      // Assert
      expect(results).toHaveLength(5);
      expect(results[0].score).toBeGreaterThan(results[1].score);
      expect(results.every(r => r.score >= 0.4)).toBe(true);
    });
    
    it('should fallback to keyword search when AI fails', async () => {
      // Arrange
      const query = 'React';
      const context = { bookmarks: createTestBookmarks(3) };
      
      mockModel.predict.mockImplementation(() => {
        throw new Error('Model failed');
      });
      
      const fallbackSpy = jest.spyOn(engine as any, '_fallbackSearch');
      
      // Act
      const results = await engine.searchBookmarks(query, context);
      
      // Assert
      expect(fallbackSpy).toHaveBeenCalledWith(query, context);
      expect(results).toBeDefined();
    });
    
    it('should throw AIEngineError when not initialized', async () => {
      // Arrange
      const uninitializedEngine = new AISearchEngine();
      
      // Act & Assert
      await expect(
        uninitializedEngine.searchBookmarks('test', { bookmarks: [] })
      ).rejects.toThrow(AIEngineError);
    });
  });
  
  describe('generateVector', () => {
    it('should return cached vector for same input', async () => {
      // Arrange
      const text = '测试文本';
      const expectedVector = new Float32Array([0.1, 0.2, 0.3]);
      
      mockModel.predict.mockReturnValue(tf.tensor1d(expectedVector));
      
      // Act
      const vector1 = await engine.generateVector(text);
      const vector2 = await engine.generateVector(text);
      
      // Assert
      expect(vector1).toEqual(expectedVector);
      expect(vector2).toEqual(expectedVector);
      expect(mockModel.predict).toHaveBeenCalledTimes(1); // 第二次使用缓存
    });
  });
});

// 测试工具函数
function createTestBookmarks(count: number): Bookmark[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bookmark-${i}`,
    url: `https://example.com/${i}`,
    title: `Test Bookmark ${i}`,
    description: `Description for bookmark ${i}`,
    content: `Content for bookmark ${i}`,
    tags: [`tag${i}`],
    contentType: 'DOCUMENT',
    aiVector: new Float32Array(512),
    aiConfidence: 0.8,
    isArchived: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    syncMetadata: createTestSyncMetadata()
  }));
}
```

## Git提交规范

### 提交消息格式

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**类型 (type):**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构（不是新功能或bug修复）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

**示例:**
```text
feat(search): add semantic search with TensorFlow.js

- Implement Universal Sentence Encoder integration
- Add vector similarity calculation
- Support batch processing for better performance
- Include fallback to keyword search when AI fails

Closes #123
```

### 分支命名规范

```text
feature/add-semantic-search      # 新功能
bugfix/fix-memory-leak          # bug修复  
hotfix/critical-security-patch  # 紧急修复
refactor/simplify-ai-engine     # 代码重构
chore/update-dependencies       # 维护任务
```

## 代码审查清单

### 提交前检查

- [ ] 所有测试通过 (`npm test`)
- [ ] 代码通过linting (`npm run lint`)
- [ ] 类型检查通过 (`npm run typecheck`)
- [ ] 格式化正确 (`npm run format`)
- [ ] 没有console.log调试代码
- [ ] 没有TODO注释（或已创建对应issue）
- [ ] 性能敏感的代码已优化
- [ ] 添加了必要的错误处理
- [ ] 更新了相关文档

### 代码审查要点

- [ ] 代码逻辑清晰易懂
- [ ] 变量和函数命名恰当
- [ ] 没有重复代码
- [ ] 错误处理完整
- [ ] 边界条件已考虑
- [ ] 性能影响可接受
- [ ] 安全性没有问题
- [ ] 可测试性良好

## 工具配置

### ESLint配置 (.eslintrc.js)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
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
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Prettier配置 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

这份编码标准涵盖了：

1. **完整的TypeScript规范** - 类型定义、命名约定、错误处理
2. **文件组织标准** - 目录结构、导入导出规范
3. **注释和文档要求** - JSDoc、内联注释标准
4. **性能编码最佳实践** - 内存管理、批量处理
5. **测试编码规范** - 单元测试结构和工具函数
6. **Git工作流程** - 提交消息、分支命名
7. **代码审查流程** - 检查清单和要点
8. **工具配置** - ESLint和Prettier设置

这应该能确保整个团队（包括AI代理）的代码质量一致性。接下来我需要快速完成剩余的关键问题。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303", "status": "completed", "activeForm": "\u6b63\u5728\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303"}, {"content": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf", "status": "completed", "activeForm": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf"}, {"content": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6", "status": "completed", "activeForm": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6"}, {"content": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863", "status": "completed", "activeForm": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863"}, {"content": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b", "status": "in_progress", "activeForm": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b"}, {"content": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe", "status": "pending", "activeForm": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe"}, {"content": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565"}, {"content": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212", "status": "pending", "activeForm": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212"}, {"content": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236", "status": "pending", "activeForm": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236"}, {"content": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565", "status": "pending", "activeForm": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565"}, {"content": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565"}, {"content": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7", "status": "pending", "activeForm": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7"}, {"content": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282", "status": "pending", "activeForm": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282"}, {"content": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f", "status": "pending", "activeForm": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f"}]