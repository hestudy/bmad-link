# Deployment Architecture

## Deployment Strategy

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

## CI/CD Pipeline

```yaml