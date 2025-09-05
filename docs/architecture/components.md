# Components

## AISearchEngine

**Responsibility:** 核心AI语义搜索引擎，处理TensorFlow.js模型加载、向量计算和相似度匹配

**Key Interfaces:**
- `initializeModel(): Promise<void>` - 加载和初始化AI模型
- `generateVector(text: string): Promise<Float32Array>` - 文本向量化
- `searchBookmarks(query: string, bookmarks: Bookmark[]): Promise<SearchResult[]>` - 语义搜索
- `calculateSimilarity(vector1: Float32Array, vector2: Float32Array): number` - 相似度计算

**Dependencies:** TensorFlow.js, Universal Sentence Encoder模型, WebWorker (用于非阻塞计算)

**Technology Stack:** TensorFlow.js 4.15+, Web Workers, IndexedDB缓存, 自定义向量索引算法

## SyncManager

**Responsibility:** 实时同步管理，处理本地-云端数据同步、冲突检测和解决

**Key Interfaces:**
- `enableSync(apiToken: string): Promise<void>` - 启用云端同步
- `syncNow(): Promise<SyncResult>` - 手动触发同步
- `handleConflict(conflict: ConflictData): Promise<ConflictResolution>` - 处理冲突
- `subscribeToChanges(callback: (event: SyncEvent) => void): void` - 监听同步事件

**Dependencies:** APIClient, WebSocket client, DataManager, EventBus

**Technology Stack:** 自定义版本向量算法, WebSocket连接管理, 指数退避重试策略, 事件驱动架构
