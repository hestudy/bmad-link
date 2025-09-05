# BMad Link 第三方服务设置指南

本文档提供BMad Link项目所需的所有第三方服务的详细设置指南，确保开发团队能够快速配置和部署完整的技术栈。

## 概览

BMad Link项目采用现代化的技术栈，依赖以下核心第三方服务：

| 服务 | 用途 | MVP阶段 | 云端同步阶段 | 费用 |
|------|------|---------|-------------|------|
| **GitHub** | 代码托管、CI/CD | ✅ 必需 | ✅ 必需 | 免费 |
| **Chrome Web Store** | 扩展发布和分发 | ✅ 必需 | ✅ 必需 | $5一次性 |
| **Vercel** | 云端API、数据库、缓存 | ⚪ 可选 | ✅ 必需 | 免费额度 |
| **TensorFlow Hub** | AI模型下载 | ✅ 必需 | ✅ 必需 | 免费 |

---

# 1. Vercel 完整设置指南

## 1.1 账户创建和基础配置

### 步骤1：创建Vercel账户

1. **访问Vercel官网**
   ```bash
   # 在浏览器中访问
   https://vercel.com/signup
   ```

2. **选择注册方式**
   - **推荐**：使用GitHub账户注册（便于后续集成）
   - 点击"Continue with GitHub"
   - 授权Vercel访问您的GitHub账户

3. **完成账户验证**
   - 如果使用邮箱注册，需要验证邮箱
   - 设置用户名（建议使用与GitHub相同的用户名）

### 步骤2：安装Vercel CLI

```bash
# 使用npm全局安装Vercel CLI
npm i -g vercel

# 或使用pnpm
pnpm add -g vercel

# 验证安装
vercel --version
```

### 步骤3：本地认证

```bash
# 登录Vercel账户
vercel login

# 选择登录方式（建议选择GitHub）
# 按提示在浏览器中完成认证
```

### 步骤4：验证账户设置

```bash
# 查看当前用户信息
vercel whoami

# 查看团队信息（如果有）
vercel teams list
```

## 1.2 项目部署配置

### 步骤1：创建Vercel项目

1. **通过Dashboard创建**
   - 访问 https://vercel.com/dashboard
   - 点击"New Project"
   - 选择您的GitHub仓库 `bmad-link`
   - 配置项目设置：

```yaml
# 项目配置
Project Name: bmad-link
Framework Preset: Other
Root Directory: apps/sync-api  # 指向API应用目录
Build Command: pnpm build --filter=@bmad/sync-api
Output Directory: .vercel/output
Install Command: pnpm install --frozen-lockfile
```

2. **通过CLI创建（推荐）**

```bash
# 在项目根目录执行
cd /path/to/bmad-link

# 初始化Vercel项目
vercel --cwd apps/sync-api

# 按提示配置：
# Set up and deploy? [Y/n] Y
# Which scope? (选择个人账户或团队)
# Link to existing project? [Y/n] n
# What's your project's name? bmad-link-api
# In which directory is your code located? ./
```

### 步骤2：配置环境变量

```bash
# 添加生产环境变量
vercel env add POSTGRES_URL production
# 输入：postgresql://username:password@hostname:port/database

vercel env add KV_URL production  
# 输入：redis://username:password@hostname:port

vercel env add JWT_SECRET production
# 输入：至少32字符的随机字符串

# 添加预览环境变量
vercel env add POSTGRES_URL preview
vercel env add KV_URL preview
vercel env add JWT_SECRET preview

# 查看已配置的环境变量
vercel env ls
```

### 步骤3：配置域名（可选）

```bash
# 添加自定义域名
vercel domains add your-domain.com

# 配置域名到项目
vercel alias set bmad-link-api-xxx.vercel.app your-domain.com
```

## 1.3 Vercel KV (Redis) 设置

### 步骤1：创建KV数据库

1. **通过Dashboard创建**
   - 访问 https://vercel.com/dashboard
   - 进入您的项目
   - 点击"Storage"标签页
   - 点击"Create Database"
   - 选择"KV"
   - 配置数据库：

```yaml
Database Name: bmad-link-kv
Region: Washington D.C., USA (iad1)  # 选择离用户最近的区域
```

2. **通过CLI创建**

```bash
# 创建KV数据库
vercel kv create bmad-link-kv --region iad1

# 连接到项目
vercel env add KV_REST_API_URL production
vercel env add KV_REST_API_TOKEN production
```

### 步骤2：获取连接信息

```bash
# 查看KV连接信息
vercel kv ls

# 获取具体数据库信息
vercel kv info bmad-link-kv
```

连接信息示例：
```bash
KV_REST_API_URL=https://xxx-xxx-xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXXX
```

### 步骤3：本地开发配置

```bash
# 创建本地环境变量文件
cat > apps/sync-api/.env.local << EOF
KV_REST_API_URL="https://xxx-xxx-xxx.kv.vercel-storage.com"
KV_REST_API_TOKEN="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXXX"
EOF
```

## 1.4 Vercel Postgres 设置

### 步骤1：创建Postgres数据库

1. **通过Dashboard创建**
   - 进入项目Dashboard
   - 点击"Storage"标签页
   - 点击"Create Database"
   - 选择"Postgres"
   - 配置数据库：

```yaml
Database Name: bmad-link-db
Region: Washington D.C., USA (iad1)
```

2. **通过CLI创建**

```bash
# 创建Postgres数据库
vercel postgres create bmad-link-db --region iad1
```

### 步骤2：获取连接信息

连接信息会自动添加到环境变量：
```bash
POSTGRES_PRISMA_URL="postgresql://user:pass@host:port/database?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host:port/database"
```

### 步骤3：初始化数据库Schema

```bash
# 连接到生产数据库并执行Schema
vercel postgres sql bmad-link-db -- --file=./schema.sql

# 或使用环境变量连接
psql $POSTGRES_URL_NON_POOLING -f schema.sql
```

数据库Schema位置：
```
apps/sync-api/prisma/schema.sql
```

## 1.5 Vercel Blob (文件存储) 设置

### 步骤1：创建Blob存储

```bash
# 创建Blob存储
vercel blob create bmad-link-files --region iad1
```

### 步骤2：获取Blob令牌

```bash
# Blob令牌会自动添加到环境变量
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 1.6 部署和验证

### 步骤1：执行部署

```bash
# 部署到生产环境
vercel --prod

# 查看部署状态
vercel ls

# 查看部署日志
vercel logs
```

### 步骤2：验证部署结果

```bash
# 测试API端点
curl https://bmad-link-api.vercel.app/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2025-09-05T12:00:00.000Z",
  "services": {
    "postgres": "connected",
    "kv": "connected"
  }
}
```

### 步骤3：配置自动部署

在项目根目录创建 `vercel.json`：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/sync-api/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/sync-api/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "apps/sync-api/api/**/*.ts": {
      "runtime": "@vercel/node@18.x"
    }
  }
}
```

---

# 2. Chrome Web Store 发布指南

## 2.1 开发者账户设置

### 步骤1：注册Chrome开发者账户

1. **访问Chrome Web Store开发者控制台**
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. **注册开发者账户**
   - 使用Google账户登录
   - 支付$5一次性注册费用
   - 填写开发者信息：

```yaml
开发者姓名: Your Name
邮箱地址: your-email@example.com
网站: https://your-website.com (可选)
```

3. **验证身份（如果需要）**
   - 上传身份验证文档
   - 等待Google审核（通常1-3个工作日）

### 步骤2：准备发布材料

创建发布资源文件夹：
```bash
mkdir -p release-assets/chrome-store
cd release-assets/chrome-store
```

必需的发布材料：

1. **应用图标**
```bash
# 创建不同尺寸的图标
icon-16x16.png    # 16x16像素
icon-48x48.png    # 48x48像素  
icon-128x128.png  # 128x128像素
```

2. **商店展示图片**
```bash
screenshot-1.png  # 1280x800像素，展示主要功能
screenshot-2.png  # 1280x800像素，展示搜索界面
screenshot-3.png  # 1280x800像素，展示AI功能
promo-tile.png    # 440x280像素，商店推广图
```

3. **描述文本**
```yaml
简短描述: "AI智能书签管理器，支持自然语言搜索，为开发者打造"
详细描述: |
  BMad Link是专为开发者设计的智能书签管理Chrome扩展。
  
  核心功能：
  • 🤖 AI语义搜索 - 使用"React状态管理库"等自然语言查询
  • 📱 一键收藏 - 右键菜单快速保存技术资源
  • 🔍 智能分类 - 自动识别文档、工具、教程等内容类型
  • 🔒 隐私优先 - 所有数据本地存储，无云端上传
  • ⚡ 极速搜索 - 2秒内找到目标书签，85%+成功率
  
  适用场景：
  • 技术文档收藏和检索
  • 开源项目资源管理  
  • API参考快速查找
  • 学习资料分类整理
```

## 2.2 扩展打包和发布

### 步骤1：构建生产版本

```bash
# 在项目根目录执行
pnpm build --filter=@bmad/extension

# 验证构建结果
ls apps/extension/dist/
# 应该包含：
# - manifest.json
# - background.js
# - popup.html
# - popup.js
# - content.js
# - icons/
```

### 步骤2：创建发布包

```bash
# 打包扩展（注意：macOS用户需要使用特殊标志）
cd apps/extension/dist
tar --no-mac-metadata --no-xattrs --exclude='.DS_Store' -czf ../bmad-link-v1.0.0.tar.gz .

# 或者创建ZIP文件
zip -r ../bmad-link-v1.0.0.zip . -x "*.DS_Store"
```

### 步骤3：上传到Chrome Web Store

1. **创建新应用**
   - 访问开发者控制台
   - 点击"新增应用"
   - 上传ZIP文件

2. **填写应用信息**
```yaml
应用名称: "BMad Link - AI智能书签管理器"
分类: "生产力工具"
语言: "中文（简体）"
隐私权限: 
  - 详细说明为什么需要activeTab权限
  - 说明数据本地存储策略
```

3. **设置定价和分发**
```yaml
定价: 免费
分发区域: 全球
目标用户: 开发者和技术从业者
```

### 步骤4：发布和审核

```bash
# 提交审核
- 点击"提交审核"
- 等待Google审核（通常1-3个工作日）
- 关注审核状态和可能的反馈
```

## 2.3 发布后管理

### 步骤1：监控审核状态

```bash
# 检查发布状态的脚本
#!/bin/bash
echo "Chrome Web Store发布检查清单："
echo "□ 扩展已成功上传"
echo "□ 所有必需材料已提交"
echo "□ 隐私政策已配置"
echo "□ 权限说明已完善"
echo "□ 审核已通过"
echo "□ 扩展已公开发布"
```

### 步骤2：版本更新流程

```bash
# 更新版本的自动化脚本
#!/bin/bash
VERSION=$1

if [ -z "$VERSION" ]; then
  echo "用法: ./update-extension.sh <版本号>"
  exit 1
fi

# 更新manifest.json中的版本号
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" apps/extension/src/manifest.json

# 构建新版本
pnpm build --filter=@bmad/extension

# 打包新版本
cd apps/extension/dist
zip -r "../bmad-link-v$VERSION.zip" . -x "*.DS_Store"

echo "新版本 v$VERSION 已打包完成"
echo "请手动上传到Chrome Web Store进行更新"
```

---

# 3. GitHub Actions CI/CD 配置

## 3.1 GitHub仓库设置

### 步骤1：创建必要的Secrets

在GitHub仓库中配置以下Secrets：

```bash
# Chrome Web Store发布
CHROME_EXTENSION_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CHROME_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com  
CHROME_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
CHROME_REFRESH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vercel部署
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤2：创建CI/CD工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy BMad Link

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run tests
        run: pnpm test
        
      - name: Type check
        run: pnpm typecheck
        
      - name: Lint
        run: pnpm lint

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  build-extension:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build extension
        run: pnpm build --filter=@bmad/extension
        
      - name: Package extension
        run: |
          cd apps/extension/dist
          zip -r ../extension-build.zip . -x "*.DS_Store"
          
      - name: Upload extension artifact
        uses: actions/upload-artifact@v4
        with:
          name: extension-build
          path: apps/extension/extension-build.zip

  publish-extension:
    needs: [test, build-extension]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
      
      - name: Download extension artifact
        uses: actions/download-artifact@v4
        with:
          name: extension-build
          
      - name: Publish to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v4.0.1
        with:
          file-path: extension-build.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

---

# 4. TensorFlow.js 模型获取配置

## 4.1 模型下载设置

### 步骤1：确定模型来源

```bash
# Universal Sentence Encoder模型
MODEL_URL="https://tfhub.dev/google/universal-sentence-encoder/4"
MODEL_SIZE="约8MB"
```

### 步骤2：本地模型缓存配置

创建模型管理器：

```typescript
// packages/ai-engine/src/model-manager.ts
class ModelManager {
  private static readonly MODEL_CACHE_KEY = 'tensorflow_model_cache';
  private static readonly MODEL_VERSION = '4';
  
  async loadModel(): Promise<tf.GraphModel> {
    // 检查IndexedDB缓存
    const cachedModel = await this.getCachedModel();
    if (cachedModel) {
      return cachedModel;
    }
    
    // 从TensorFlow Hub下载
    const model = await tf.loadGraphModel(
      'https://tfhub.dev/google/universal-sentence-encoder/4',
      { fromTFHub: true }
    );
    
    // 缓存到本地
    await this.cacheModel(model);
    return model;
  }
}
```

### 步骤3：模型加载优化

```typescript
// 预加载策略
class AIEngine {
  async initialize(): Promise<void> {
    // 在扩展启动时预加载模型
    await this.modelManager.loadModel();
    
    // 预热模型（运行一次推理）
    const warmupText = "Hello world";
    await this.generateEmbedding(warmupText);
  }
}
```

---

# 5. 故障排除指南

## 5.1 Vercel常见问题

### 问题1：部署失败 - 构建超时
```bash
# 解决方案：优化构建配置
# 在vercel.json中增加
{
  "functions": {
    "apps/sync-api/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### 问题2：环境变量不生效
```bash
# 检查环境变量
vercel env ls

# 重新部署
vercel --force
```

### 问题3：数据库连接失败
```bash
# 检查数据库状态
vercel postgres info bmad-link-db

# 测试连接
psql $POSTGRES_URL_NON_POOLING -c "SELECT 1;"
```

## 5.2 Chrome Web Store常见问题

### 问题1：扩展审核被拒
常见拒绝原因和解决方案：

```yaml
原因: "权限请求过于宽泛"
解决: 在manifest.json中使用最小权限原则

原因: "隐私政策不明确"  
解决: 详细说明数据使用和存储策略

原因: "功能描述不清楚"
解决: 提供清晰的功能说明和使用截图
```

### 问题2：扩展无法上传
```bash
# 检查文件大小（限制10MB）
du -h apps/extension/dist/

# 检查manifest.json格式
cat apps/extension/dist/manifest.json | jq .
```

## 5.3 GitHub Actions故障排除

### 问题1：CI/CD流水线失败
```bash
# 检查日志
gh run list --repo your-username/bmad-link
gh run view RUN_ID --log
```

### 问题2：Secrets配置问题
```bash
# 验证secrets是否正确配置
gh secret list --repo your-username/bmad-link
```

---

# 6. 成本估算和配额管理

## 6.1 服务成本预估

| 服务 | 免费配额 | 预估MVP用量 | 预估云端阶段用量 | 月成本 |
|------|----------|-------------|------------------|--------|
| **GitHub** | 无限公开仓库 | 1个仓库 | 1个仓库 | $0 |
| **Vercel** | 100GB带宽/月 | 5GB | 50GB | $0-20 |
| **Chrome Web Store** | - | 一次性费用 | 一次性费用 | $5（一次） |
| **TensorFlow Hub** | 无限下载 | 模型缓存 | 模型缓存 | $0 |

## 6.2 配额监控

### Vercel配额检查
```bash
# 检查当前用量
vercel info

# 查看带宽使用情况
vercel analytics
```

### GitHub Actions配额
```bash
# 查看Actions使用情况
gh api user/settings/billing/actions
```

---

# 7. 安全最佳实践

## 7.1 API密钥管理

```bash
# 永不将密钥提交到代码库
echo "*.env*" >> .gitignore
echo ".vercel" >> .gitignore

# 使用环境变量
export VERCEL_TOKEN="your-token-here"

# 定期轮换密钥
vercel env rm OLD_SECRET production
vercel env add NEW_SECRET production
```

## 7.2 权限最小化原则

```json
// Chrome扩展权限配置
{
  "permissions": [
    "activeTab",      // 仅当前标签页，而非所有标签页
    "storage",        // 仅本地存储，而非所有存储
    "bookmarks"       // 仅书签API，而非全部浏览数据
  ]
}
```

---

这份详细的设置指南确保了项目团队能够快速、正确地配置所有必需的第三方服务，避免了常见的配置陷阱和问题。每个步骤都包含了验证方法和故障排除指南，为项目的顺利开发和部署提供了坚实的基础。