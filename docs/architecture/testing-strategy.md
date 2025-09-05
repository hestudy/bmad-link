# Testing Strategy

## Testing Pyramid

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

## Test Organization

### Frontend Tests

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

### Backend Tests

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

## Test Examples

### Frontend Component Test

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

### Backend API Test

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

### E2E Test

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
