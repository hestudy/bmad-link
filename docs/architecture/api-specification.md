# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: BMad Link Sync API
  version: 1.0.0
  description: |
    BMad Link云端同步API，支持书签数据的实时同步、冲突检测和解决。
    设计为可选服务，扩展本地功能而不替代。
    
servers:
  - url: https://bmad-link-api.vercel.app/api
    description: Vercel Edge Functions 生产环境

paths:
  /auth/device:
    post:
      summary: 设备认证
      description: |
        基于设备指纹获取JWT令牌。支持匿名使用，无需用户注册。
        首次访问时自动创建用户账户。
      responses:
        '200':
          description: 认证成功
          
  /sync/bookmarks:
    post:
      summary: 批量同步书签
      description: |
        上传本地书签变更，接收云端更新。支持增量同步和冲突检测。
        这是实时同步的核心端点。
      responses:
        '200':
          description: 同步成功
        '409':
          description: 发现冲突，需要用户处理
```
