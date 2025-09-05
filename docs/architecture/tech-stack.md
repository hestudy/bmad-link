# Tech Stack

## Technology Stack Table

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
