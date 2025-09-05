# Data Models

## Bookmark

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

### TypeScript Interface
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

### Relationships
- 一个Bookmark属于一个User（云端同步时）
- 一个Bookmark可以有多个SearchHistory记录
- 一个Bookmark可以关联多个ConflictResolution记录

## User

**Purpose:** 用户账户信息，支持跨设备同步和个性化设置

### TypeScript Interface
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

## SyncMetadata

**Purpose:** 实时同步的版本控制和冲突检测元数据

### TypeScript Interface
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
