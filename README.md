# BMad Link - AI智能书签管理器

BMad Link是专为开发者设计的智能Chrome扩展，通过AI语义搜索技术重新定义书签管理体验。

## 🚀 快速开始

### 前置要求
- Node.js ≥ 18.0.0
- pnpm ≥ 8.15.0  
- Git ≥ 2.40.0

### 本地开发设置

```bash
# 克隆项目
git clone https://github.com/your-org/bmad-link.git
cd bmad-link

# 安装依赖
pnpm install

# 构建共享包
pnpm build --filter="@bmad/*"

# 启动开发环境
pnpm dev
```

## 📚 重要文档

| 文档 | 用途 | 何时查看 |
|------|------|----------|
| **[deployment-setup.md](./docs/deployment-setup.md)** | 🔧 第三方服务详细设置指南 | **立即查看** - 包含Vercel、Chrome Web Store等必需服务的完整配置流程 |
| [architecture.md](./docs/architecture.md) | 🏗️ 完整技术架构文档 | 开发前必读 |
| [prd.md](./docs/prd.md) | 📋 产品需求文档 | 理解产品定位和功能范围 |
| [front-end-spec.md](./docs/front-end-spec.md) | 🎨 UI/UX设计规范 | 前端开发时参考 |

## ⚙️ 第三方服务配置

**开发前必须配置的服务：**

1. **GitHub** - 代码托管和CI/CD（免费）
2. **Chrome开发者账户** - 扩展发布（$5一次性费用）
3. **Vercel** - 云端API和数据库（免费额度）

**详细配置步骤请查看：** [deployment-setup.md](./docs/deployment-setup.md)

## 🏗️ 项目架构

```
bmad-link/
├── apps/
│   ├── extension/          # Chrome扩展主应用
│   └── sync-api/           # 云端同步API
├── packages/
│   ├── shared/             # 共享类型和工具
│   ├── ai-engine/          # AI搜索引擎核心
│   └── ui-components/      # UI组件库
└── docs/                   # 项目文档
```

## 🛠️ 开发命令

```bash
# 开发环境
pnpm dev                    # 启动所有应用
pnpm dev:extension         # 仅Chrome扩展
pnpm dev:api              # 仅云端API

# 构建和测试  
pnpm build                # 构建所有包
pnpm test                 # 运行测试
pnpm lint                 # 代码检查
pnpm typecheck           # 类型检查

# Chrome扩展专用
pnpm extension:build     # 构建生产版扩展
pnpm extension:pack      # 打包扩展为ZIP
```

## 🚢 部署流程

1. **MVP阶段**：仅需Chrome扩展发布到Chrome Web Store
2. **云端同步阶段**：需要Vercel API部署和数据库配置

完整部署指南请参考：[deployment-setup.md](./docs/deployment-setup.md)

## 🎯 核心特性

- 🤖 **AI语义搜索** - 使用"React状态管理库"等自然语言查询书签
- ⚡ **极速响应** - 2秒内完成搜索，85%+成功率  
- 🔒 **隐私优先** - MVP阶段所有数据本地存储
- 📱 **一键收藏** - 右键菜单快速保存技术资源
- 🎨 **开发者友好** - 深色主题，键盘导航，简洁界面

## 📊 项目状态

- **MVP阶段**：本地AI书签管理 ✅ 架构设计完成
- **云端同步**：多设备数据同步 🚧 待开发  
- **高级功能**：团队协作、数据分析 📋 规划中

## 🤝 贡献指南

1. Fork项目并创建feature分支
2. 参考 [deployment-setup.md](./docs/deployment-setup.md) 配置开发环境
3. 遵循代码规范和测试要求
4. 提交Pull Request

## 📄 许可证

[MIT License](./LICENSE)

---

**⚠️ 重要提醒：** 开始开发前，请务必完整阅读 [deployment-setup.md](./docs/deployment-setup.md) 文档，其中包含了所有必需的第三方服务配置步骤。