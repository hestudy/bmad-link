# Database Schema

## 本地存储 (IndexedDB) Schema

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

## 云端存储 (Vercel Postgres) Schema

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
