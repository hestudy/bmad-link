# Frontend Architecture

## Component Architecture

### Component Organization

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

### Component Template

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

## State Management Architecture

### State Structure

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
