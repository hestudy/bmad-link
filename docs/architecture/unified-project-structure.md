# Unified Project Structure

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
