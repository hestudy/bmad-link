# BMad Link Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for BMad Link, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

N/A - Greenfield project

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-05 | v1.0 | Initial fullstack architecture document created by Winston | Winston (Architect) |

## High Level Architecture

### Technical Summary

BMad Link采用**本地优先的渐进式架构**，核心功能完全在Chrome扩展内运行，无需网络依赖。系统基于TensorFlow.js实现AI语义搜索，使用IndexedDB进行本地数据存储，通过TypeScript构建确保类型安全。MVP阶段专注本地功能，同时在数据层和服务层预留了云端同步的接口，支持未来的跨设备协作。前端采用现代Web Components模式，后端采用模块化的服务架构，整体设计围绕2秒内AI搜索响应和80%以上搜索成功率的性能目标。

### Platform and Infrastructure Choice

**平台选择：** Chrome扩展（主要） + Vercel Edge Functions（云端同步）  
**核心服务：** TensorFlow.js, IndexedDB, TypeScript, Webpack  
**云端扩展服务：** Vercel Functions, Vercel KV, Vercel Postgres  
**部署区域：** 全球边缘节点（Vercel Edge Network）

### Repository Structure

**结构选择：** Monorepo - 便于共享类型定义和工具配置  
**Monorepo工具：** Turborepo - 针对Vercel优化，构建缓存出色  
**包组织策略：** 
- `apps/extension` - Chrome扩展主应用
- `apps/sync-api` - 可选的云端同步API  
- `packages/shared` - 共享类型和工具
- `packages/ai-engine` - AI搜索引擎核心

### High Level Architecture Diagram

```mermaid
graph TD
    subgraph "用户环境"
        A[Chrome浏览器] --> B[BMad Link扩展]
        B --> C[扩展弹窗界面]
        B --> D[右键菜单]
        B --> E[后台脚本]
    end
    
    subgraph "本地数据层（MVP核心）"
        F[IndexedDB] --> G[书签数据]
        F --> H[AI向量索引]
        F --> I[用户偏好设置]
    end
    
    subgraph "AI处理引擎"
        J[TensorFlow.js] --> K[语义向量生成]
        J --> L[相似度计算]
        M[Universal Sentence Encoder] --> J
    end
    
    subgraph "扩展功能模块"
        N[网页内容抓取] --> O[AI内容分析]
        O --> P[向量化存储]
        Q[搜索查询处理] --> R[AI语义匹配]
        R --> S[结果排序展示]
    end
    
    subgraph "云端同步层（未来扩展）"
        T[Vercel Edge API] --> U[数据同步服务]
        T --> V[跨设备状态管理]
        W[Vercel KV缓存] --> T
        X[Vercel Postgres] --> T
    end
    
    C --> Q
    E --> N
    O --> F
    Q --> J
    F --> R
    
    %% 未来扩展连接（虚线）
    F -.->|"Future: 双向同步"| T
    I -.->|"Future: 设置同步"| T
    
    style T fill:#e1f5fe
    style U fill:#e1f5fe  
    style V fill:#e1f5fe
    style W fill:#e1f5fe
    style X fill:#e1f5fe
```

### Architectural Patterns

- **本地优先模式（Local-First Pattern）：** 所有核心功能在本地完成，云端仅作数据同步层 - _Rationale:_ 确保隐私安全和离线可用性，符合开发者用户需求
- **渐进增强架构（Progressive Enhancement）：** MVP完全本地运行，云端功能作为可选增强 - _Rationale:_ 降低初期开发复杂度，支持分阶段发布策略  
- **微前端组件模式（Micro-Frontend Components）：** 扩展UI基于独立组件构建 - _Rationale:_ 提高代码复用性，支持A/B测试和功能开关
- **事件驱动架构（Event-Driven Architecture）：** 本地数据变更通过事件通知云端同步 - _Rationale:_ 实现松耦合的同步机制，支持离线优先工作流
- **CQRS模式（Command Query Responsibility Segregation）：** 本地写操作和读操作分离，为云端同步优化 - _Rationale:_ 提高搜索性能，简化数据一致性处理
- **适配器模式（Adapter Pattern）：** 为云端同步预留统一的数据接口 - _Rationale:_ 支持多种云端服务提供商，保持架构灵活性

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | 扩展开发和类型安全 | 强类型支持AI向量计算，减少运行时错误 |
| Frontend Framework | Vanilla TypeScript + Web Components | ES2022 | Chrome扩展UI构建 | 避免框架开销，保持<10MB体积限制 |
| UI Component Library | 自定义组件 + Feather Icons | 最新 | 轻量级UI组件 | 完全控制样式，符合开发者深色主题需求 |
| State Management | 自定义EventEmitter模式 | - | 扩展状态管理 | 轻量级，支持跨组件通信和实时同步事件 |
| Backend Language | TypeScript | 5.3+ | 云端同步API | 与前端共享类型定义，减少集成错误 |
| Backend Framework | Vercel Edge Functions | 最新 | 无服务器API | 全球低延迟，自动扩展，简化部署 |
| API Style | REST + WebSocket | HTTP/1.1, WS | 实时同步通信 | REST处理CRUD，WebSocket处理实时冲突通知 |
| Database | Vercel KV + Postgres | 最新 | 云端数据存储 | KV做缓存和会话，Postgres存持久化数据 |
| Cache | 浏览器Cache API + Vercel KV | 本地+云端 | 多层缓存策略 | 本地缓存AI模型，云端缓存用户会话 |
| File Storage | IndexedDB(本地) + Vercel Blob(云端) | 最新 | 分层存储架构 | 本地存主要数据，云端存备份和同步 |
| Authentication | 渐进式身份验证：本地设备指纹 + JWT | - | 两阶段身份验证系统 | MVP本地设备认证，云端升级为标准JWT + CSRF防护 |
| Frontend Testing | Vitest + @testing-library | 最新 | 组件和逻辑测试 | 快速执行，TypeScript原生支持 |
| Backend Testing | Vitest + Supertest | 最新 | API集成测试 | 统一测试框架，简化CI配置 |
| E2E Testing | Playwright | 最新 | Chrome扩展端到端测试 | 最佳的扩展测试支持，跨浏览器兼容 |
| Build Tool | Vite | 5.0+ | 开发和构建工具 | 快速HMR，优秀的TypeScript支持 |
| Bundler | Rollup (via Vite) | 最新 | 扩展代码打包 | Tree-shaking优化，控制包体积 |
| IaC Tool | Vercel CLI | 最新 | 基础设施部署 | 简化云端资源管理，GitOps流程 |
| CI/CD | GitHub Actions | 最新 | 自动化构建部署 | 免费额度充足，与GitHub深度集成 |
| Monitoring | 自定义分析 + Vercel Analytics | 最新 | 性能和错误监控 | 隐私友好，专注核心指标 |
| Logging | Console API + Vercel Functions Logs | 最新 | 调试和监控日志 | 简单有效，符合扩展开发习惯 |
| CSS Framework | 自定义CSS + CSS Grid/Flexbox | CSS3 | 响应式样式系统 | 完全控制，支持深色主题和可访问性 |

## Data Models

### Bookmark

**Purpose:** 核心书签实体，存储网页信息和AI处理结果，支持语义搜索和同步

**Key Attributes:**
- id: string - 全局唯一标识符，支持跨设备同步
- url: string - 书签原始URL，用于访问和去重
- title: string - 网页标题，用于显示和关键词匹配
- description: string - AI提取的内容摘要，用于语义搜索
- content: string - 网页主要文本内容，AI向量化的数据源
- contentType: ContentType - AI识别的内容类型（技术文档/工具/教程等）
- aiVector: Float32Array - 语义向量，AI搜索的核心数据
- syncMetadata: SyncMetadata - 同步版本控制信息

#### TypeScript Interface
```typescript
interface Bookmark {
  // 核心标识
  id: string; // UUID v4 格式
  url: string;
  
  // 基础信息
  title: string;
  description: string;
  content: string;
  contentType: ContentType;
  favicon?: string;
  
  // AI 数据
  aiVector: Float32Array; // 512维语义向量
  aiConfidence: number; // AI分析置信度 0-1
  
  // 用户数据
  tags: string[];
  isArchived: boolean;
  isFavorite: boolean;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  
  // 同步元数据
  syncMetadata: SyncMetadata;
}
```

#### Relationships
- 一个Bookmark属于一个User（云端同步时）
- 一个Bookmark可以有多个SearchHistory记录
- 一个Bookmark可以关联多个ConflictResolution记录

### User

**Purpose:** 用户账户信息，支持跨设备同步和个性化设置

#### TypeScript Interface
```typescript
interface User {
  id: string;
  deviceId: string; // 基于浏览器指纹生成
  
  // 可选的用户信息
  email?: string;
  name?: string;
  avatar?: string;
  
  // 设置
  preferences: UserPreferences;
  syncEnabled: boolean;
  
  // 订阅信息（未来扩展）
  subscription?: SubscriptionInfo;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  
  // 同步元数据
  syncMetadata: SyncMetadata;
}
```

### SyncMetadata

**Purpose:** 实时同步的版本控制和冲突检测元数据

#### TypeScript Interface
```typescript
interface SyncMetadata {
  // 版本控制
  version: number;              // 单调递增版本号
  vectorClock: VectorClock;     // 分布式版本向量
  lastSyncedAt?: Date;          // 最后同步时间
  
  // 设备信息
  deviceId: string;             // 最后修改设备
  clientVersion: string;        // 客户端版本号
  
  // 冲突状态
  hasConflict: boolean;         // 是否存在同步冲突
  conflictData?: ConflictData;  // 冲突详细信息
  
  // 同步状态
  syncStatus: SyncStatus;       // 同步状态枚举
  retryCount: number;           // 同步重试次数
}
```

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: BMad Link Sync API
  version: 1.0.0
  description: |
    BMad Link云端同步API，支持书签数据的实时同步、冲突检测和解决。
    设计为可选服务，扩展本地功能而不替代。
    
servers:
  - url: https://bmad-link-api.vercel.app/api
    description: Vercel Edge Functions 生产环境

paths:
  /auth/device:
    post:
      summary: 设备认证
      description: |
        基于设备指纹获取JWT令牌。支持匿名使用，无需用户注册。
        首次访问时自动创建用户账户。
      responses:
        '200':
          description: 认证成功
          
  /sync/bookmarks:
    post:
      summary: 批量同步书签
      description: |
        上传本地书签变更，接收云端更新。支持增量同步和冲突检测。
        这是实时同步的核心端点。
      responses:
        '200':
          description: 同步成功
        '409':
          description: 发现冲突，需要用户处理
```

## Components

### AISearchEngine

**Responsibility:** 核心AI语义搜索引擎，处理TensorFlow.js模型加载、向量计算和相似度匹配

**Key Interfaces:**
- `initializeModel(): Promise<void>` - 加载和初始化AI模型
- `generateVector(text: string): Promise<Float32Array>` - 文本向量化
- `searchBookmarks(query: string, bookmarks: Bookmark[]): Promise<SearchResult[]>` - 语义搜索
- `calculateSimilarity(vector1: Float32Array, vector2: Float32Array): number` - 相似度计算

**Dependencies:** TensorFlow.js, Universal Sentence Encoder模型, WebWorker (用于非阻塞计算)

**Technology Stack:** TensorFlow.js 4.15+, Web Workers, IndexedDB缓存, 自定义向量索引算法

### SyncManager

**Responsibility:** 实时同步管理，处理本地-云端数据同步、冲突检测和解决

**Key Interfaces:**
- `enableSync(apiToken: string): Promise<void>` - 启用云端同步
- `syncNow(): Promise<SyncResult>` - 手动触发同步
- `handleConflict(conflict: ConflictData): Promise<ConflictResolution>` - 处理冲突
- `subscribeToChanges(callback: (event: SyncEvent) => void): void` - 监听同步事件

**Dependencies:** APIClient, WebSocket client, DataManager, EventBus

**Technology Stack:** 自定义版本向量算法, WebSocket连接管理, 指数退避重试策略, 事件驱动架构

## Core Workflows

### 智能书签收藏工作流

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as UIController
    participant BG as BackgroundService
    participant CE as ContentExtractor
    participant AI as AISearchEngine
    participant DM as DataManager
    participant SM as SyncManager
    
    User->>UI: 点击扩展图标/右键菜单
    UI->>BG: 请求收藏当前页面
    
    par 内容抓取
        BG->>CE: extractPageContent(tabId)
        CE-->>BG: 返回PageContent
    end
    
    par AI内容分析
        BG->>AI: analyzeContentType(content)
        AI-->>BG: 返回ContentType.REPOSITORY
        BG->>AI: generateVector(content.text)
        AI-->>BG: 返回Float32Array向量
    end
    
    BG->>DM: saveBookmark(bookmark)
    DM-->>BG: 确认保存成功
    BG->>UI: 显示收藏成功提示
    
    alt 如果启用云端同步
        BG->>SM: 触发实时同步事件
        SM->>SM: 加入同步队列
    end
```

### AI语义搜索工作流

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as UIController
    participant BG as BackgroundService
    participant AI as AISearchEngine
    participant DM as DataManager
    participant Cache as LRU缓存
    
    User->>UI: 输入"React状态管理库"
    UI->>BG: 发送搜索请求
    
    BG->>Cache: 检查查询缓存
    alt 缓存命中
        Cache-->>BG: 返回缓存结果
    else 缓存未命中
        BG->>AI: generateVector(query)
        BG->>DM: 获取所有书签
        BG->>AI: searchBookmarks(queryVector, bookmarks)
        AI-->>BG: 返回排序结果
        BG->>Cache: 缓存搜索结果
    end
    
    BG->>UI: 返回搜索结果
    UI->>User: 显示相关书签
```

## Database Schema

### 本地存储 (IndexedDB) Schema

```typescript
interface BMadLinkDB {
  version: 1;
  stores: {
    bookmarks: BookmarkStore;
    searchHistory: SearchHistoryStore; 
    userSettings: UserSettingsStore;
    syncQueue: SyncQueueStore;
    aiCache: AICacheStore;
  };
}
```

### 云端存储 (Vercel Postgres) Schema

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_metadata JSONB DEFAULT '{}'
);

-- 书签表 - 云端存储
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    content_type VARCHAR(50) NOT NULL,
    ai_vector VECTOR(512),           -- PostgreSQL pgvector扩展
    ai_confidence DECIMAL(3,2),
    tags TEXT[] DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sync_metadata JSONB DEFAULT '{}',
    CONSTRAINT unique_user_url UNIQUE(user_id, url)
);

-- 性能优化索引
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_vector_hnsw ON bookmarks 
    USING hnsw (ai_vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

## Frontend Architecture

### Component Architecture

#### Component Organization

```text
apps/extension/src/
├── components/                    # 可复用UI组件
│   ├── base/                      # 基础组件
│   ├── search/                    # 搜索相关组件
│   ├── bookmark/                  # 书签组件
│   └── layout/                    # 布局组件
├── services/                      # 前端服务层
├── stores/                        # 状态管理
├── utils/                         # 工具函数
└── styles/                        # 样式文件
```

#### Component Template

```typescript
abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  protected template: HTMLTemplateElement;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'closed' });
  }
  
  abstract render(): string;
  abstract getStyles(): string;
  
  protected mount() {
    this.template.innerHTML = this.render();
    this.shadow.appendChild(this.template.content.cloneNode(true));
    this.bindEvents();
  }
  
  protected bindEvents() {
    // 子类实现具体事件绑定
  }
}
```

### State Management Architecture

#### State Structure

```typescript
interface AppState {
  user: {
    id: string | null;
    deviceId: string;
    preferences: UserPreferences;
    syncEnabled: boolean;
  };
  ui: {
    currentTab: 'search' | 'browse' | 'settings';
    searchQuery: string;
    isLoading: boolean;
    error: string | null;
  };
  sync: {
    status: 'offline' | 'online' | 'syncing' | 'error';
    lastSyncAt: number | null;
    pendingChanges: number;
    conflictsCount: number;
  };
}
```

## Backend Architecture

### Service Architecture

#### Serverless Architecture

```text
apps/sync-api/api/
├── auth/
│   └── device.ts                  # 设备认证端点
├── sync/
│   ├── bookmarks.ts              # 书签批量同步
│   ├── status.ts                 # 同步状态查询
│   └── resolve-conflict.ts       # 冲突解决
└── bookmarks/
    └── [id].ts                   # 单个书签CRUD
```

#### Function Template

```typescript
// Vercel Edge Function 基础模板
async function syncBookmarksHandler(
  req: NextRequest,
  context: { user: AuthUser }
): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持POST请求' } },
      { status: 405 }
    );
  }

  try {
    const body: SyncRequest = await req.json();
    const syncService = new SyncService(context.user);
    const result = await syncService.processSyncRequest(body);

    if (result.conflicts.length > 0) {
      return NextResponse.json({
        error: { code: 'SYNC_CONFLICT', message: '检测到数据冲突' },
        conflicts: result.conflicts,
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      syncedBookmarks: result.syncedBookmarks,
      nextSyncToken: result.nextSyncToken,
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } },
      { status: 500 }
    );
  }
}
```

### Auth Architecture

#### 认证架构概述

BMad Link采用**渐进式身份验证架构**，支持从MVP阶段的纯本地认证无缝过渡到云端同步阶段的完整JWT认证体系。

**设计原则：**
- **隐私优先：** MVP阶段无需任何云端认证，完全本地运行
- **无缝升级：** 启用云端同步时自动升级认证级别，无需重新设置
- **设备绑定：** 基于浏览器指纹的强设备认证，支持多设备管理
- **安全防护：** CSRF保护、速率限制、异常检测等多重安全机制

#### MVP阶段：本地设备认证

**目标：**为扩展提供唯一设备标识，支持本地数据隔离和状态管理

**核心组件：**
- **设备指纹生成器：** 基于浏览器特征生成稳定的设备ID
- **本地认证管理器：** 管理设备认证状态和本地伪token
- **Chrome存储集成：** 安全存储认证状态到chrome.storage.local

```mermaid
sequenceDiagram
    participant User as 用户
    participant Ext as Chrome扩展
    participant LocalAuth as 本地认证管理器
    participant Storage as Chrome Storage
    participant FP as 设备指纹生成器
    
    User->>Ext: 首次启动扩展
    Ext->>LocalAuth: initialize()
    LocalAuth->>Storage: 加载认证状态
    Storage-->>LocalAuth: null (首次使用)
    
    LocalAuth->>FP: 生成设备指纹
    FP->>FP: 收集浏览器特征
    FP->>FP: 计算SHA-256指纹
    FP-->>LocalAuth: DeviceFingerprint
    
    LocalAuth->>LocalAuth: createLocalAuth()
    LocalAuth->>Storage: 保存认证状态
    LocalAuth-->>Ext: 本地认证完成
    
    Note over LocalAuth: 后续启动验证流程
    User->>Ext: 后续启动
    LocalAuth->>FP: 重新生成指纹
    LocalAuth->>LocalAuth: 验证设备一致性
    
    alt 设备指纹一致
        LocalAuth-->>Ext: 认证有效
    else 设备指纹变化
        LocalAuth->>LocalAuth: 重新创建认证
        LocalAuth->>Storage: 更新状态
    end
```

#### 云端同步阶段：完整JWT认证体系

**目标：**提供企业级的身份验证和授权，支持跨设备同步和安全的API访问

**核心组件：**
- **JWT令牌管理器：** 生成、验证、刷新JWT访问令牌
- **设备认证服务：** 基于设备指纹的无密码认证
- **会话管理：** Redis缓存的高性能会话存储
- **安全管理器：** CSRF保护、速率限制、异常检测

```mermaid
sequenceDiagram
    participant Ext as Chrome扩展
    participant LocalAuth as 本地认证
    participant CloudAuth as 云端认证
    participant API as Vercel API
    participant KV as Redis缓存
    participant DB as PostgreSQL
    
    Note over Ext,DB: MVP阶段 - 纯本地认证
    Ext->>LocalAuth: 启动扩展
    LocalAuth->>LocalAuth: 生成设备指纹
    LocalAuth->>LocalAuth: 创建本地认证状态
    LocalAuth-->>Ext: 返回本地token
    
    Note over Ext,DB: 云端同步启用
    Ext->>CloudAuth: 启用云端同步
    CloudAuth->>LocalAuth: 获取设备指纹
    CloudAuth->>API: POST /auth/device
    API->>DB: 查找/创建用户
    API->>DB: 注册设备信息
    API->>KV: 缓存会话
    API-->>CloudAuth: 返回JWT令牌对
    
    CloudAuth->>LocalAuth: 升级认证状态
    LocalAuth->>LocalAuth: 保存云端令牌
    CloudAuth-->>Ext: 云端认证完成
    
    Note over Ext,DB: 后续API调用
    Ext->>CloudAuth: API请求
    CloudAuth->>CloudAuth: 检查token是否需要刷新
    
    alt Token需要刷新
        CloudAuth->>API: POST /auth/refresh
        API->>KV: 验证refresh token
        API-->>CloudAuth: 新token对
        CloudAuth->>LocalAuth: 更新存储的token
    end
    
    CloudAuth->>API: 带JWT的API请求
    API->>KV: 验证token
    API-->>CloudAuth: API响应
    CloudAuth-->>Ext: 返回数据
```

#### 设备指纹算法

**指纹组件（按稳定性排序）：**

| 组件 | 稳定性 | 权重 | 说明 |
|------|--------|------|------|
| 扩展ID | 极高 | 25% | Chrome扩展的唯一标识符 |
| 用户代理 | 高 | 20% | 浏览器和操作系统信息 |
| 屏幕分辨率 | 高 | 15% | 主显示器分辨率 |
| 时区 | 高 | 15% | 系统时区设置 |
| 硬件并发 | 中 | 10% | CPU核心数量 |
| Canvas指纹 | 中 | 10% | 图形渲染特征 |
| 音频指纹 | 低 | 5% | 音频上下文特征 |

**指纹生成算法：**
```typescript
// 使用稳定组件生成主指纹，动态组件用于增强唯一性
const stableComponents = {
  extensionId: chrome.runtime.id,
  userAgent: navigator.userAgent,
  screenResolution: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  platform: navigator.platform
};

// SHA-256散列生成64字符设备ID
const deviceId = await crypto.subtle.digest('SHA-256', 
  new TextEncoder().encode(JSON.stringify(stableComponents))
);
```

#### JWT令牌结构

**访问令牌Payload：**
```json
{
  "iss": "bmad-link",
  "sub": "user_uuid",
  "aud": "bmad-link-extension",
  "exp": 1640995200,
  "iat": 1640991600,
  "nbf": 1640991600,
  "jti": "token_uuid",
  "deviceId": "device_fingerprint_hash",
  "authLevel": "cloud",
  "permissions": ["bookmark:read", "bookmark:write", "sync:read", "sync:write"],
  "sessionId": "session_uuid"
}
```

**令牌管理策略：**
- **访问令牌过期：** 1小时
- **刷新令牌过期：** 30天
- **自动刷新阈值：** 提前5分钟
- **令牌轮换：** 每24小时强制轮换

#### 安全防护机制

**CSRF保护：**
- 所有状态变更操作要求CSRF令牌
- 令牌通过secure cookie或请求头传输
- 时间安全比较防止时序攻击

**速率限制：**
- 认证请求：每IP每分钟5次
- API请求：每用户每分钟100次
- 同步请求：每设备每分钟50次
- 滑动窗口算法，Redis存储计数器

**异常检测：**
- IP地址变化检测（30分风险评分）
- 浏览器指纹变化（20分风险评分）
- 异常活动频率（40分风险评分）
- 设备特征漂移（25分风险评分）
- 风险评分≥50触发额外验证

**会话管理：**
- Redis存储活跃会话，7天TTL
- 支持单点登出和全设备登出
- 会话劫持检测（IP+UserAgent验证）
- 并发会话限制（每用户最多5个设备）

## Unified Project Structure

```text
bmad-link/
├── .github/                              # GitHub Actions CI/CD
├── apps/                                # 应用程序
│   ├── extension/                       # Chrome扩展主应用
│   │   ├── src/
│   │   │   ├── background/             # Service Worker
│   │   │   ├── content-scripts/        # 内容脚本
│   │   │   ├── popup/                  # 弹窗界面
│   │   │   ├── components/             # 前端组件
│   │   │   └── services/               # 前端服务
│   │   │       ├── local-auth.ts       # 本地认证管理器
│   │   │       ├── cloud-auth.ts       # 云端认证服务
│   │   │       └── device-fingerprint.ts # 设备指纹生成
│   │   └── manifest.json               # 扩展清单文件
│   └── sync-api/                       # 云端同步API
│       ├── api/                        # Vercel Edge Functions
│       │   ├── auth/                   # 认证相关端点
│       │   │   ├── device.ts          # 设备认证端点
│       │   │   ├── refresh.ts         # 令牌刷新端点
│       │   │   └── logout.ts          # 登出端点
│       │   └── sync/                   # 同步相关端点
│       └── libs/                       # 后端共享库
│           ├── auth/                   # 认证服务库
│           │   ├── jwt-manager.ts      # JWT管理器
│           │   ├── device-auth.ts      # 设备认证服务
│           │   └── security-manager.ts # 安全管理器
│           └── middleware/             # 中间件
│               ├── auth-middleware.ts  # 认证中间件
│               ├── rate-limit.ts       # 速率限制
│               └── security.ts         # 安全防护
├── packages/                           # 共享包
│   ├── shared/                        # 共享类型和工具
│   │   └── auth/                      # 认证相关类型和工具
│   │       ├── device-fingerprint.ts  # 设备指纹生成器
│   │       ├── auth-types.ts          # 认证相关类型定义
│   │       └── security-utils.ts      # 安全工具函数
│   ├── ai-engine/                     # AI搜索引擎核心
│   ├── ui-components/                # 共享UI组件库
│   └── config/                       # 共享配置
├── docs/                             # 项目文档
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── turbo.json                       # Turborepo配置
├── package.json                     # 根package.json
└── README.md
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
node --version          # >= 18.0.0
pnpm --version         # >= 8.15.0
git --version          # >= 2.40.0
```

#### Initial Setup

```bash
# 克隆项目
git clone https://github.com/your-org/bmad-link.git
cd bmad-link

# 安装所有依赖
pnpm install

# 复制环境变量模板
cp .env.example .env.local

# ⚠️ 第三方服务配置（重要）
# 请参考 deployment-setup.md 完成以下服务配置：
# 1. GitHub仓库设置（立即需要）
# 2. Vercel账户创建（云端同步时需要）  
# 3. Chrome开发者账户注册（发布时需要，$5费用）
# 4. 配置环境变量文件

# 构建所有共享包
pnpm run build --filter="@bmad/*"

# 验证安装
pnpm run health-check
```

#### Development Commands

```bash
# 全项目开发
pnpm dev                           # 启动所有应用的开发模式
pnpm dev:extension                 # 仅启动扩展开发
pnpm dev:api                      # 仅启动API开发

# 构建命令
pnpm build                        # 构建所有包和应用
pnpm extension:build              # 构建生产版扩展

# 测试命令
pnpm test                         # 运行所有测试套件
pnpm test:unit                    # 仅单元测试
pnpm test:e2e                    # 端到端测试

# 代码质量
pnpm lint                        # ESLint检查
pnpm format                      # Prettier格式化
pnpm typecheck                   # TypeScript类型检查
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_MODEL_URL=https://tfhub.dev/google/universal-sentence-encoder/4

# Backend (.env)
POSTGRES_URL="postgresql://username:password@localhost:5432/bmad_link_dev"
KV_URL="redis://localhost:6379"
JWT_SECRET="dev_secret_key_32_chars_minimum"
```

## Deployment Architecture

### Deployment Strategy

BMad Link采用**多平台分层部署策略**，确保MVP和云端同步阶段的平滑过渡：

**前端部署（Chrome扩展）：**
- **平台：** Chrome Web Store（主要）+ GitHub Releases（开发版本）
- **构建命令：** `pnpm build --filter=@bmad/extension`
- **输出目录：** `apps/extension/dist`
- **分发策略：** 自动化CI/CD发布到Chrome Web Store，支持版本回滚

**后端部署（云端同步API）：**
- **平台：** Vercel Edge Functions + Vercel KV + Vercel Postgres
- **构建命令：** `pnpm build --filter=@bmad/sync-api`
- **部署方式：** Git集成自动部署，支持预览和生产环境
- **全球分发：** Vercel Edge Network提供低延迟API访问

**⚠️ 重要提醒：** 完整的第三方服务设置指南请参考：[**deployment-setup.md**](./deployment-setup.md)

该文档包含：
- ✅ Vercel完整配置流程（KV、Postgres、Blob存储）
- ✅ Chrome Web Store发布详细步骤（包含审核要点）
- ✅ GitHub Actions CI/CD工作流配置
- ✅ TensorFlow.js模型获取和缓存策略
- ✅ 故障排除和成本管理指南

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yaml
name: Deploy BMad Link
on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Build applications
        run: pnpm build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v4.0.1
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | `chrome-extension://localhost` | `http://localhost:3000/api` | 本地开发环境 |
| Preview | `chrome-extension://preview-build` | `https://bmad-link-api-preview.vercel.app/api` | PR预览环境 |
| Production | `Chrome Web Store` | `https://bmad-link-api.vercel.app/api` | 生产环境 |

## Security and Performance

### Security Requirements

#### Frontend Security

**CSP Headers:** 严格的内容安全策略，仅允许必要的资源加载

**XSS Prevention:** 使用DOMPurify净化所有用户输入内容

**Secure Storage:** 敏感数据使用AES-GCM加密后存储在Chrome storage

#### Backend Security

**Input Validation:** 使用Zod进行严格的请求数据验证

**Rate Limiting:** 
- 认证：5分钟10次
- 同步：1分钟50次
- 搜索：1分钟100次

**CORS Policy:** 仅允许Chrome扩展和开发环境访问

#### Authentication Security

**Token Storage:** JWT令牌加密存储，支持自动刷新

**Session Management:** 基于Redis的会话管理，7天过期

**Password Policy:** 基于设备指纹的无密码认证

### Performance Optimization

#### Frontend Performance

**Bundle Size Target:** < 10MB (包含AI模型)

**Loading Strategy:** 
- AI模型懒加载
- 组件代码分割
- 渐进式功能加载

**Caching Strategy:** 
- AI向量：50MB LRU缓存
- 搜索结果：10MB，30分钟TTL
- 缩略图：20MB，7天TTL

#### Backend Performance

**Response Time Target:** < 500ms (API响应时间)

**Database Optimization:** 
- pgvector HNSW索引用于向量搜索
- 复合索引优化常见查询
- 连接池和查询缓存

**Caching Strategy:** 
- 内存缓存：5分钟
- Redis缓存：30分钟
- 智能缓存失效

## Testing Strategy

### Testing Pyramid

```text
                    E2E Tests (10%)
                 ┌─────────────────┐
                 │  User Journeys  │
                 │  Performance    │
                 └─────────────────┘
             ┌─────────────────────────┐
             │   Integration Tests (20%)  │
             │     API Integration        │
             │     AI Model Tests         │
             └─────────────────────────┘
      ┌─────────────────────────────────────┐
      │        Unit Tests (70%)               │
      │   Frontend Components                 │
      │   Backend Services                    │
      │   Business Logic                      │
      └─────────────────────────────────────┘
```

### Test Organization

#### Frontend Tests

```text
tests/
├── unit/                          # 单元测试
│   ├── components/               # UI组件测试
│   ├── services/                # 服务层测试
│   └── stores/                  # 状态管理测试
├── integration/                  # 集成测试
│   ├── ai-engine/              # AI引擎集成测试
│   ├── chrome-apis/            # Chrome API集成
│   └── data-sync/              # 数据同步集成
└── e2e/                         # 端到端测试
    ├── user-flows/             # 用户流程测试
    ├── performance/            # 性能测试
    └── cross-browser/          # 跨浏览器测试
```

#### Backend Tests

```text
apps/sync-api/tests/
├── unit/                        # API单元测试
│   ├── auth/
│   ├── sync/
│   └── database/
├── integration/                 # API集成测试
│   ├── endpoints/
│   ├── database/
│   └── external/
└── load/                       # 负载测试
    ├── api-stress.test.ts
    └── concurrent-sync.test.ts
```

### Test Examples

#### Frontend Component Test

```typescript
// tests/unit/components/search/SearchInput.test.ts
import { describe, it, expect } from 'vitest';
import { SearchInput } from '@bmad/ui-components';

describe('SearchInput Component', () => {
  it('应该在用户输入时发出搜索事件（带防抖）', async () => {
    const searchInput = new SearchInput();
    const mockHandler = vi.fn();
    searchInput.addEventListener('search', mockHandler);

    const input = searchInput.shadowRoot?.querySelector('.search-input');
    fireEvent.input(input, { target: { value: 'React' } });
    
    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { query: 'React' }
        })
      );
    }, { timeout: 500 });
  });
});
```

#### Backend API Test

```typescript
// apps/sync-api/tests/integration/endpoints/sync-endpoints.test.ts
import { describe, it, expect } from 'vitest';
import { testClient } from '../../test-utils/api-client';

describe('书签同步端点', () => {
  it('应该成功同步新书签', async () => {
    const bookmarks = createTestBookmarks(5);
    
    const response = await testClient
      .post('/api/sync/bookmarks')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ bookmarks, deviceId: testUser.deviceId });

    expect(response.status).toBe(200);
    expect(response.body.syncedBookmarks).toHaveLength(5);
  });

  it('应该检测并报告同步冲突', async () => {
    // 创建冲突场景测试
    const response = await testClient
      .post('/api/sync/bookmarks')
      .send(conflictedBookmark);

    expect(response.status).toBe(409);
    expect(response.body.conflicts).toHaveLength(1);
  });
});
```

#### E2E Test

```typescript
// tests/e2e/user-flows/bookmark-management.spec.ts
import { test, expect } from '@playwright/test';

test('完整的书签收藏和搜索流程', async ({ page }) => {
  // 1. 导航到测试页面
  await page.goto('https://react.dev/learn');

  // 2. 使用扩展收藏当前页面
  await page.click('[data-testid=bookmark-button]');
  await page.waitForSelector('[data-testid=bookmark-success]');

  // 3. 执行AI语义搜索
  await page.fill('[data-testid=search-input]', 'React学习指南');
  await page.waitForSelector('[data-testid=search-results]');

  // 4. 验证搜索结果
  const results = await page.locator('[data-testid=bookmark-card]').all();
  expect(results.length).toBeGreaterThan(0);
});
```

## 架构文档总结

**BMad Link全栈架构文档**现已完成，涵盖了AI智能书签管理应用的完整技术架构设计。

### 核心架构特点

1. **本地优先 + 云端增强**：90%功能本地完成，确保隐私和性能
2. **AI-First设计**：语义搜索将成功率从40%提升至80%+
3. **实时冲突解决**：支持多设备离线编辑和智能同步
4. **性能至上**：<2秒搜索、<50MB内存、<500ms API响应
5. **安全by Design**：端到端加密、零信任架构

### 实现路径

**Phase 1 - MVP核心功能（4-6周）**
- Chrome扩展基础框架
- AI语义搜索引擎
- 本地数据存储和管理

**Phase 2 - 云端同步（2-3周）**
- 云端API开发部署
- 实时同步机制
- 冲突检测和解决

**Phase 3 - 优化发布（2-3周）**
- 性能优化和测试
- Chrome Web Store发布
- 用户反馈迭代

这个架构在您的白帽安全研究背景下特别合适，既保护了用户隐私，又提供了强大的AI功能。现在您可以基于这个架构开始具体的开发工作了！