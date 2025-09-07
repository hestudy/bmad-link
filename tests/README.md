# BMad Link 测试系统

统一的测试报告生成系统，提供多种格式的测试输出和覆盖率报告。

## 🎯 功能特性

- **统一报告格式**: 标准化的HTML、JSON、JUnit格式输出
- **视觉化界面**: 现代化的深色主题HTML报告
- **实时统计**: 测试通过率、失败数、执行时间等关键指标
- **模块化展示**: 按测试模块分组显示详细结果
- **自动生成**: 集成到CI/CD流程中的自动化报告生成

## 📁 目录结构

```
tests/
├── config/
│   └── report.config.ts        # 报告配置文件
├── templates/
│   └── report-template.html    # HTML报告模板
├── utils/
│   └── report-generator.ts     # TypeScript报告生成器
├── reports/                    # 生成的报告输出目录
│   ├── bmad-report.html       # 主要HTML报告
│   ├── vitest-results.json    # JSON格式测试结果
│   ├── junit.xml              # JUnit格式报告
│   └── coverage/              # 代码覆盖率报告
├── unit/                       # 单元测试目录
└── setup.ts                   # 测试环境设置
```

## 🚀 使用方法

### 基本测试命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试并生成统一HTML报告
pnpm test:report

# 启动交互式测试UI
pnpm test:ui

# 监视模式运行测试
pnpm test:watch
```

### 生成报告的步骤

1. **运行测试并生成JSON结果**:
   ```bash
   pnpm vitest run --reporter=json --outputFile=tests/reports/vitest-results.json
   ```

2. **生成HTML报告**:
   ```bash
   node scripts/generate-report.js
   ```

3. **查看报告**:
   - HTML报告: `tests/reports/bmad-report.html`
   - JSON数据: `tests/reports/vitest-results.json`

## 📊 报告格式说明

### HTML报告特性

- **响应式设计**: 适配不同屏幕尺寸
- **深色主题**: 符合开发者使用习惯的视觉风格
- **交互功能**: 可展开/折叠的模块详情
- **实时统计**: 动态显示测试指标和通过率

### JSON报告结构

```json
{
  "timestamp": "2025-09-07 09:53:32",
  "stats": {
    "total": 74,
    "passed": 74,
    "failed": 0,
    "skipped": 0,
    "duration": 548
  },
  "modules": [...],
  "coverage": {...}
}
```

### JUnit格式

标准的JUnit XML格式，兼容大多数CI/CD系统：
- Jenkins
- GitLab CI
- GitHub Actions
- Azure DevOps

## ⚙️ 配置说明

### vitest.config.ts 配置

```typescript
export default defineConfig({
  test: {
    reporter: [
      'default',
      ['json', { outputFile: 'tests/reports/vitest-results.json' }],
      ['junit', { outputFile: 'tests/reports/junit.xml' }],
      ['html', { outputFile: 'tests/reports/vitest-report.html' }]
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'tests/reports/coverage'
    }
  }
});
```

### 报告生成器配置

可在 `tests/config/report.config.ts` 中自定义：
- 输出目录
- 报告格式
- 覆盖率阈值
- 自定义样式

## 🎨 自定义样式

HTML报告使用CSS变量，可轻松自定义主题：

```css
:root {
  --primary-gradient: linear-gradient(45deg, #6366f1, #8b5cf6);
  --success-color: #22c55e;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
}
```

## 📈 覆盖率报告

系统自动生成代码覆盖率报告，包括：
- **语句覆盖率**: 执行的语句百分比
- **分支覆盖率**: 执行的分支路径百分比
- **函数覆盖率**: 调用的函数百分比  
- **行覆盖率**: 执行的代码行百分比

## 🔧 故障排除

### 常见问题

1. **报告生成失败**
   ```bash
   # 确保报告目录存在
   mkdir -p tests/reports
   
   # 检查JSON文件是否存在
   ls -la tests/reports/vitest-results.json
   ```

2. **样式显示异常**
   - 检查浏览器是否支持CSS Grid
   - 确认模板文件完整性

3. **覆盖率数据缺失**
   ```bash
   # 安装覆盖率依赖
   pnpm add -D @vitest/coverage-v8
   ```

## 🤝 贡献指南

1. 报告模板位于 `tests/templates/report-template.html`
2. 生成逻辑在 `scripts/generate-report.js`
3. 遵循现有的代码风格和命名约定
4. 提交前运行 `pnpm test` 确保所有测试通过

## 📄 许可证

MIT License - 详见项目根目录 LICENSE 文件