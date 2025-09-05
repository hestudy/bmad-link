# BMad Link 监控和日志系统

## 系统概述

BMad Link监控系统采用分层设计，前端（Chrome扩展）和后端（Vercel API）都具备完整的监控能力。系统专注于AI搜索性能、用户体验质量和安全事件检测。

### 监控架构原则

- **隐私优先**：所有用户数据匿名化，不收集敏感内容
- **轻量级**：监控开销<5%，不影响核心功能性能
- **实时性**：关键错误15秒内告警，性能指标30秒更新
- **渐进式**：MVP阶段基础监控，云端阶段完整可观测性

## 前端监控系统（Chrome扩展）

### 错误捕获和处理

```typescript
interface ExtensionError {
  errorId: string;                   // 错误唯一标识
  timestamp: number;                // 发生时间戳
  type: ErrorType;                  // 错误类型
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // 错误上下文
  message: string;                  // 错误消息
  stack?: string;                   // 调用栈（去敏化）
  component: string;                // 发生组件
  userAction?: string;              // 用户操作
  
  // 环境信息
  extensionVersion: string;         // 扩展版本
  browserInfo: BrowserInfo;         // 浏览器信息
  systemInfo: SystemInfo;           // 系统信息
  
  // AI相关上下文
  aiModelLoaded: boolean;           // AI模型状态
  searchQuery?: string;             // 搜索查询（哈希化）
  bookmarkCount: number;            // 书签数量
  
  // 用户影响
  userImpact: UserImpactLevel;      // 用户影响程度
  recoverable: boolean;             // 是否可恢复
  autoRecovered: boolean;           // 是否自动恢复
}

class ExtensionErrorMonitor {
  private errorBuffer: ExtensionError[] = [];
  private maxBufferSize = 100;
  private flushInterval = 60000; // 1分钟
  
  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.startPeriodicFlush();
  }
  
  private setupGlobalErrorHandlers(): void {
    // 全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'JAVASCRIPT_ERROR',
        severity: this.classifyErrorSeverity(event.error),
        message: event.message,
        stack: this.sanitizeStack(event.error?.stack),
        component: this.identifyComponent(event.filename),
        userAction: this.getCurrentUserAction()
      });
    });
    
    // Promise拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'UNHANDLED_PROMISE_REJECTION',
        severity: 'HIGH',
        message: event.reason?.message || 'Promise rejection',
        stack: this.sanitizeStack(event.reason?.stack),
        component: 'PROMISE_HANDLER'
      });
    });
    
    // Chrome扩展特定错误
    if (chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'ERROR_REPORT') {
          this.captureError({
            type: 'BACKGROUND_SCRIPT_ERROR',
            severity: message.severity,
            message: message.error.message,
            component: message.component
          });
        }
      });
    }
  }
  
  // AI特定错误监控
  async monitorAIOperations<T>(
    operation: () => Promise<T>,
    context: AIOperationContext
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      
      // 记录成功指标
      this.recordAIMetric({
        operation: context.operation,
        duration: performance.now() - startTime,
        status: 'SUCCESS',
        inputSize: context.inputSize,
        outputSize: this.calculateOutputSize(result)
      });
      
      return result;
      
    } catch (error) {
      const aiError: ExtensionError = {
        errorId: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'AI_OPERATION_ERROR',
        severity: this.classifyAIErrorSeverity(error, context),
        message: error.message,
        stack: this.sanitizeStack(error.stack),
        component: 'AI_ENGINE',
        extensionVersion: chrome.runtime.getManifest().version,
        browserInfo: await this.getBrowserInfo(),
        systemInfo: await this.getSystemInfo(),
        aiModelLoaded: context.modelLoaded,
        searchQuery: context.query ? this.hashSensitiveData(context.query) : undefined,
        bookmarkCount: context.bookmarkCount || 0,
        userImpact: this.assessUserImpact(error, context),
        recoverable: this.isRecoverable(error),
        autoRecovered: false
      };
      
      this.captureError(aiError);
      
      // 尝试自动恢复
      const recovered = await this.attemptAutoRecovery(error, context);
      if (recovered) {
        aiError.autoRecovered = true;
        return recovered;
      }
      
      throw error;
    }
  }
  
  private async attemptAutoRecovery(error: Error, context: AIOperationContext): Promise<any> {
    switch (context.operation) {
      case 'MODEL_LOAD':
        // 模型加载失败 - 尝试降级到关键词搜索
        console.warn('AI模型加载失败，降级到关键词搜索');
        return await this.fallbackToKeywordSearch(context.query);
        
      case 'VECTOR_GENERATION':
        // 向量生成失败 - 使用缓存或跳过向量化
        const cached = await this.getCachedVector(context.text);
        if (cached) return cached;
        
        return null; // 跳过向量化，使用文本搜索
        
      case 'SIMILARITY_SEARCH':
        // 相似度搜索失败 - 使用简单文本匹配
        return await this.fallbackToTextSearch(context.query, context.bookmarks);
        
      default:
        return null;
    }
  }
}
```

### 性能监控

```typescript
interface PerformanceMetric {
  metricId: string;                 // 指标标识
  timestamp: number;               // 测量时间
  category: MetricCategory;        // 指标类别
  name: string;                    // 指标名称
  value: number;                   // 指标数值
  unit: string;                    // 数值单位
  tags: Record<string, string>;    // 标签
  threshold?: number;              // 告警阈值
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private performanceObserver?: PerformanceObserver;
  
  startMonitoring(): void {
    // 监控扩展启动性能
    this.monitorExtensionStartup();
    
    // 监控AI模型性能
    this.monitorAIPerformance();
    
    // 监控搜索性能
    this.monitorSearchPerformance();
    
    // 监控UI响应性能
    this.monitorUIPerformance();
    
    // 监控内存使用
    this.monitorMemoryUsage();
  }
  
  private monitorAIPerformance(): void {
    // TensorFlow.js模型加载时间
    this.trackMetric({
      category: 'AI_PERFORMANCE',
      name: 'model_load_time',
      threshold: 5000, // 5秒阈值
      unit: 'milliseconds'
    });
    
    // 向量生成时间
    this.trackMetric({
      category: 'AI_PERFORMANCE',
      name: 'vector_generation_time',
      threshold: 2000, // 2秒阈值
      unit: 'milliseconds'
    });
    
    // 搜索响应时间
    this.trackMetric({
      category: 'AI_PERFORMANCE',
      name: 'search_response_time',
      threshold: 2000, // 2秒阈值
      unit: 'milliseconds'
    });
  }
  
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        
        this.recordMetric({
          category: 'RESOURCE_USAGE',
          name: 'heap_used',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          threshold: 50 * 1024 * 1024, // 50MB阈值
          tags: { component: 'extension' }
        });
        
        this.recordMetric({
          category: 'RESOURCE_USAGE',
          name: 'heap_total',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
          tags: { component: 'extension' }
        });
      }, 30000); // 30秒检查一次
    }
  }
  
  // 用户体验指标
  monitorUserExperience(): void {
    // 搜索成功率
    let searchAttempts = 0;
    let successfulSearches = 0;
    
    window.addEventListener('search-attempt', () => {
      searchAttempts++;
    });
    
    window.addEventListener('search-success', () => {
      successfulSearches++;
      
      const successRate = successfulSearches / searchAttempts;
      this.recordMetric({
        category: 'USER_EXPERIENCE',
        name: 'search_success_rate',
        value: successRate,
        unit: 'percentage',
        threshold: 0.8, // 80%成功率阈值
        tags: { period: '1hour' }
      });
    });
    
    // 用户交互延迟
    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime;
        
        this.recordMetric({
          category: 'USER_EXPERIENCE',
          name: 'click_response_time',
          value: responseTime,
          unit: 'milliseconds',
          threshold: 100, // 100ms阈值
          tags: { 
            element: (event.target as Element)?.tagName || 'unknown'
          }
        });
      });
    });
  }
}
```

## 后端监控系统（Vercel API）

### API监控

```typescript
interface APIMetric {
  requestId: string;               // 请求标识
  timestamp: number;              // 请求时间
  endpoint: string;               // 端点路径
  method: string;                 // HTTP方法
  statusCode: number;             // 响应状态码
  duration: number;               // 处理时长
  
  // 请求信息
  userAgent?: string;             // User-Agent（哈希化）
  ipAddress?: string;             // IP地址（哈希化）
  userId?: string;                // 用户标识
  
  // 性能指标
  memoryUsage: number;            // 内存使用量
  cpuUsage?: number;              // CPU使用率
  databaseQueries: number;        // 数据库查询次数
  cacheHits: number;              // 缓存命中次数
  
  // 错误信息
  error?: APIError;               // 错误详情
  
  // 业务指标
  syncedBookmarks?: number;       // 同步的书签数量
  conflictsDetected?: number;     // 检测到的冲突数量
}

class APIMonitor {
  private metrics: APIMetric[] = [];
  private errorCounts = new Map<string, number>();
  
  // Express中间件
  createMonitoringMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      const requestId = crypto.randomUUID();
      
      // 在请求对象上添加监控上下文
      req.monitoring = {
        requestId,
        startTime,
        startMemory,
        databaseQueries: 0,
        cacheHits: 0
      };
      
      // 监听响应结束
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();
        
        const metric: APIMetric = {
          requestId,
          timestamp: startTime,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent') ? this.hashSensitiveData(req.get('User-Agent')!) : undefined,
          ipAddress: this.hashSensitiveData(req.ip || ''),
          userId: req.user?.id,
          memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
          databaseQueries: req.monitoring.databaseQueries,
          cacheHits: req.monitoring.cacheHits
        };
        
        // 记录业务指标
        if (req.path.includes('/sync/bookmarks')) {
          metric.syncedBookmarks = req.body?.bookmarks?.length || 0;
          metric.conflictsDetected = res.locals?.conflicts?.length || 0;
        }
        
        this.recordAPIMetric(metric);
        
        // 检查告警条件
        this.checkAlertConditions(metric);
      });
      
      next();
    };
  }
  
  private checkAlertConditions(metric: APIMetric): void {
    // 响应时间告警
    if (metric.duration > 5000) { // 5秒
      this.triggerAlert({
        type: 'SLOW_RESPONSE',
        severity: 'HIGH',
        message: `API响应时间过长: ${metric.duration}ms`,
        metric
      });
    }
    
    // 错误率告警
    if (metric.statusCode >= 500) {
      const errorKey = `${metric.endpoint}-5xx`;
      const errorCount = (this.errorCounts.get(errorKey) || 0) + 1;
      this.errorCounts.set(errorKey, errorCount);
      
      // 5分钟内5xx错误超过10次
      if (errorCount > 10) {
        this.triggerAlert({
          type: 'HIGH_ERROR_RATE',
          severity: 'CRITICAL',
          message: `端点 ${metric.endpoint} 5分钟内5xx错误${errorCount}次`,
          metric
        });
      }
    }
    
    // 内存使用告警
    if (metric.memoryUsage > 100 * 1024 * 1024) { // 100MB
      this.triggerAlert({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'MEDIUM',
        message: `单请求内存使用过高: ${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        metric
      });
    }
  }
}
```

### 数据库监控

```typescript
class DatabaseMonitor {
  private queryMetrics: QueryMetric[] = [];
  
  // 数据库查询监控装饰器
  monitorQuery(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const queryId = crypto.randomUUID();
      
      try {
        const result = await method.apply(this, args);
        
        const metric: QueryMetric = {
          queryId,
          timestamp: startTime,
          duration: Date.now() - startTime,
          query: propertyName,
          status: 'SUCCESS',
          rowsAffected: Array.isArray(result) ? result.length : 1,
          parameters: this.sanitizeParameters(args)
        };
        
        this.recordQueryMetric(metric);
        
        // 递增请求级别的查询计数
        if (context.req?.monitoring) {
          context.req.monitoring.databaseQueries++;
        }
        
        return result;
        
      } catch (error) {
        const metric: QueryMetric = {
          queryId,
          timestamp: startTime,
          duration: Date.now() - startTime,
          query: propertyName,
          status: 'ERROR',
          error: {
            code: error.code,
            message: error.message
          }
        };
        
        this.recordQueryMetric(metric);
        
        // 数据库错误告警
        this.triggerDatabaseAlert({
          type: 'QUERY_ERROR',
          severity: 'HIGH',
          message: `数据库查询失败: ${propertyName}`,
          error,
          metric
        });
        
        throw error;
      }
    };
  }
  
  // 连接池监控
  monitorConnectionPool(): void {
    setInterval(async () => {
      const poolStats = await this.getConnectionPoolStats();
      
      this.recordMetric({
        category: 'DATABASE',
        name: 'active_connections',
        value: poolStats.active,
        unit: 'count',
        threshold: 50,
        tags: { pool: 'postgres' }
      });
      
      this.recordMetric({
        category: 'DATABASE',
        name: 'idle_connections',
        value: poolStats.idle,
        unit: 'count',
        tags: { pool: 'postgres' }
      });
      
      this.recordMetric({
        category: 'DATABASE',
        name: 'waiting_connections',
        value: poolStats.waiting,
        unit: 'count',
        threshold: 10,
        tags: { pool: 'postgres' }
      });
    }, 30000); // 30秒检查一次
  }
}
```

## 日志系统

### 结构化日志

```typescript
interface LogEntry {
  timestamp: string;               // ISO 8601时间戳
  level: LogLevel;                // 日志级别
  message: string;                // 日志消息
  component: string;              // 组件标识
  
  // 上下文信息
  requestId?: string;             // 请求标识
  userId?: string;                // 用户标识
  sessionId?: string;             // 会话标识
  
  // 结构化数据
  data?: Record<string, any>;     // 附加数据
  error?: LogError;               // 错误信息
  
  // 元数据
  environment: 'development' | 'staging' | 'production';
  version: string;               // 应用版本
  buildId?: string;              // 构建标识
}

class StructuredLogger {
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 500;
  private flushInterval = 30000; // 30秒
  
  constructor(
    private component: string,
    private environment: string,
    private version: string
  ) {
    this.startPeriodicFlush();
  }
  
  // 不同级别的日志方法
  info(message: string, data?: Record<string, any>): void {
    this.log('INFO', message, data);
  }
  
  warn(message: string, data?: Record<string, any>): void {
    this.log('WARN', message, data);
  }
  
  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.log('ERROR', message, data, error);
  }
  
  debug(message: string, data?: Record<string, any>): void {
    if (this.environment === 'development') {
      this.log('DEBUG', message, data);
    }
  }
  
  // AI操作专用日志
  logAIOperation(operation: string, context: AIContext, result?: any, error?: Error): void {
    const logData = {
      operation,
      modelVersion: context.modelVersion,
      inputSize: context.inputSize,
      duration: context.duration,
      success: !error
    };
    
    if (result) {
      logData.outputSize = this.calculateSize(result);
    }
    
    if (error) {
      this.error(`AI操作失败: ${operation}`, error, logData);
    } else {
      this.info(`AI操作完成: ${operation}`, logData);
    }
  }
  
  // 用户行为日志
  logUserAction(action: string, context: UserActionContext): void {
    const logData = {
      action,
      timestamp: Date.now(),
      userAgent: context.userAgent ? this.hashSensitiveData(context.userAgent) : undefined,
      searchQuery: context.searchQuery ? this.hashSensitiveData(context.searchQuery) : undefined,
      resultCount: context.resultCount,
      clickPosition: context.clickPosition
    };
    
    this.info(`用户操作: ${action}`, logData);
  }
  
  private log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component: this.component,
      environment: this.environment as any,
      version: this.version,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.sanitizeStack(error.stack)
      } : undefined
    };
    
    // 添加上下文信息
    const context = this.getCurrentContext();
    if (context) {
      entry.requestId = context.requestId;
      entry.userId = context.userId;
      entry.sessionId = context.sessionId;
    }
    
    this.logBuffer.push(entry);
    
    // 控制台输出（开发环境）
    if (this.environment === 'development') {
      console[level.toLowerCase()](message, data, error);
    }
    
    // 缓冲区满时立即刷新
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }
  
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      // 发送到日志收集服务
      await this.sendToLogService(logsToFlush);
    } catch (error) {
      // 日志发送失败时的处理
      console.error('日志发送失败:', error);
      
      // 重要日志保留到本地
      const criticalLogs = logsToFlush.filter(log => 
        log.level === 'ERROR' || log.level === 'CRITICAL'
      );
      
      if (criticalLogs.length > 0) {
        await this.storeLogsLocally(criticalLogs);
      }
    }
  }
}
```

## 告警系统

### 告警规则和处理

```typescript
interface AlertRule {
  id: string;                     // 规则标识
  name: string;                  // 规则名称
  condition: AlertCondition;     // 触发条件
  severity: AlertSeverity;       // 告警级别
  enabled: boolean;              // 是否启用
  
  // 通知配置
  notifications: NotificationConfig[];
  
  // 抑制配置
  suppressionPeriod: number;     // 抑制时长（秒）
  maxAlertsPerHour: number;      // 每小时最大告警数
}

class AlertManager {
  private activeAlerts = new Map<string, ActiveAlert>();
  private suppressedAlerts = new Set<string>();
  
  // 预定义告警规则
  private alertRules: AlertRule[] = [
    {
      id: 'ai-model-load-failure',
      name: 'AI模型加载失败',
      condition: {
        metric: 'ai_model_load_errors',
        operator: 'greater_than',
        threshold: 3,
        timeWindow: 300000 // 5分钟
      },
      severity: 'HIGH',
      enabled: true,
      notifications: [
        { type: 'console', enabled: true },
        { type: 'storage', enabled: true }
      ],
      suppressionPeriod: 900, // 15分钟
      maxAlertsPerHour: 4
    },
    
    {
      id: 'search-performance-degradation',
      name: '搜索性能下降',
      condition: {
        metric: 'search_response_time',
        operator: 'greater_than',
        threshold: 5000, // 5秒
        timeWindow: 600000 // 10分钟
      },
      severity: 'MEDIUM',
      enabled: true,
      notifications: [
        { type: 'console', enabled: true }
      ],
      suppressionPeriod: 600, // 10分钟
      maxAlertsPerHour: 6
    },
    
    {
      id: 'high-error-rate',
      name: '高错误率',
      condition: {
        metric: 'error_rate',
        operator: 'greater_than',
        threshold: 0.1, // 10%
        timeWindow: 300000 // 5分钟
      },
      severity: 'CRITICAL',
      enabled: true,
      notifications: [
        { type: 'console', enabled: true },
        { type: 'storage', enabled: true },
        { type: 'user_notification', enabled: true }
      ],
      suppressionPeriod: 300, // 5分钟
      maxAlertsPerHour: 10
    }
  ];
  
  async evaluateAlerts(metric: PerformanceMetric | ExtensionError): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      
      const shouldTrigger = await this.evaluateCondition(rule.condition, metric);
      
      if (shouldTrigger) {
        await this.triggerAlert(rule, metric);
      }
    }
  }
  
  private async triggerAlert(rule: AlertRule, context: any): Promise<void> {
    const alertKey = `${rule.id}-${Date.now()}`;
    
    // 检查抑制状态
    if (this.suppressedAlerts.has(rule.id)) {
      return;
    }
    
    // 检查频率限制
    if (!this.checkRateLimit(rule)) {
      return;
    }
    
    const alert: ActiveAlert = {
      id: alertKey,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      triggeredAt: Date.now(),
      context,
      acknowledged: false,
      resolved: false
    };
    
    this.activeAlerts.set(alertKey, alert);
    
    // 执行通知
    await this.sendNotifications(rule.notifications, alert);
    
    // 设置抑制期
    this.suppressedAlerts.add(rule.id);
    setTimeout(() => {
      this.suppressedAlerts.delete(rule.id);
    }, rule.suppressionPeriod * 1000);
    
    // 记录告警日志
    this.logger.warn(`告警触发: ${rule.name}`, {
      alertId: alertKey,
      rule: rule.id,
      severity: rule.severity,
      context
    });
  }
  
  private async sendNotifications(configs: NotificationConfig[], alert: ActiveAlert): Promise<void> {
    for (const config of configs) {
      if (!config.enabled) continue;
      
      try {
        switch (config.type) {
          case 'console':
            console.warn(`🚨 ${alert.ruleName}`, alert.context);
            break;
            
          case 'storage':
            await this.storeAlert(alert);
            break;
            
          case 'user_notification':
            if (chrome.notifications) {
              await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/warning.png',
                title: 'BMad Link 告警',
                message: alert.ruleName
              });
            }
            break;
        }
      } catch (error) {
        console.error(`通知发送失败: ${config.type}`, error);
      }
    }
  }
}
```

## 指标收集和分析

### 关键业务指标

```typescript
interface BusinessMetrics {
  // 用户活跃度
  dailyActiveUsers: number;        // 日活用户
  weeklyActiveUsers: number;       // 周活用户
  monthlyActiveUsers: number;      // 月活用户
  
  // 功能使用情况
  bookmarksCreated: number;        // 创建书签数
  searchesPerformed: number;       // 执行搜索数
  searchSuccessRate: number;       // 搜索成功率
  averageSearchTime: number;       // 平均搜索时间
  
  // AI性能指标
  aiModelLoadTime: number;         // AI模型加载时间
  vectorGenerationTime: number;    // 向量生成时间
  searchAccuracy: number;          // 搜索准确率
  
  // 同步指标（云端阶段）
  syncOperations: number;          // 同步操作次数
  syncConflicts: number;          // 同步冲突次数
  syncSuccessRate: number;        // 同步成功率
  
  // 系统性能
  extensionStartupTime: number;    // 扩展启动时间
  memoryUsage: number;            // 内存使用量
  errorRate: number;              // 错误率
}

class MetricsCollector {
  private metricsCache = new Map<string, number>();
  private dailyMetrics: BusinessMetrics = this.initializeMetrics();
  
  // 初始化指标收集
  startCollection(): void {
    // 每小时计算一次业务指标
    setInterval(() => {
      this.calculateBusinessMetrics();
    }, 60 * 60 * 1000);
    
    // 每天重置日指标
    setInterval(() => {
      this.resetDailyMetrics();
    }, 24 * 60 * 60 * 1000);
    
    // 设置事件监听器
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 书签创建
    window.addEventListener('bookmark-created', () => {
      this.incrementMetric('bookmarksCreated');
    });
    
    // 搜索执行
    window.addEventListener('search-performed', (event: CustomEvent) => {
      this.incrementMetric('searchesPerformed');
      this.recordMetric('searchTime', event.detail.duration);
    });
    
    // 搜索成功
    window.addEventListener('search-success', () => {
      this.incrementMetric('successfulSearches');
    });
    
    // AI操作
    window.addEventListener('ai-operation', (event: CustomEvent) => {
      const { operation, duration, success } = event.detail;
      
      this.recordMetric(`ai_${operation}_time`, duration);
      
      if (!success) {
        this.incrementMetric(`ai_${operation}_errors`);
      }
    });
  }
  
  // 生成指标报告
  generateReport(period: 'daily' | 'weekly' | 'monthly'): MetricsReport {
    const endTime = Date.now();
    const startTime = this.getReportStartTime(period, endTime);
    
    const report: MetricsReport = {
      period,
      startTime,
      endTime,
      generatedAt: Date.now(),
      
      // 核心业务指标
      userEngagement: {
        activeUsers: this.getActiveUsers(period),
        avgSessionDuration: this.getAvgSessionDuration(period),
        retentionRate: this.getRetentionRate(period)
      },
      
      // 功能使用指标
      featureUsage: {
        bookmarksCreated: this.getMetricSum('bookmarksCreated', period),
        searchesPerformed: this.getMetricSum('searchesPerformed', period),
        searchSuccessRate: this.calculateSuccessRate(period),
        avgSearchTime: this.getMetricAverage('searchTime', period)
      },
      
      // 性能指标
      performance: {
        aiModelLoadTime: this.getMetricAverage('ai_model_load_time', period),
        searchResponseTime: this.getMetricAverage('searchTime', period),
        extensionStartupTime: this.getMetricAverage('extensionStartupTime', period),
        memoryUsage: this.getMetricAverage('memoryUsage', period)
      },
      
      // 质量指标
      quality: {
        errorRate: this.calculateErrorRate(period),
        crashRate: this.calculateCrashRate(period),
        searchAccuracy: this.calculateSearchAccuracy(period)
      },
      
      // 改进建议
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
}
```

这个监控和日志系统提供了：

1. **完整的错误捕获** - 前端和后端全覆盖
2. **实时性能监控** - 关键指标持续跟踪
3. **智能告警系统** - 自动检测异常和性能下降
4. **结构化日志** - 便于分析和调试
5. **业务指标收集** - 支持产品决策
6. **隐私保护** - 敏感数据哈希化处理

接下来我继续解决第3个问题。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303", "status": "completed", "activeForm": "\u6b63\u5728\u5b9a\u4e49\u8be6\u7ec6\u7684\u5b89\u5168\u63a7\u5236\u89c4\u8303"}, {"content": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf", "status": "completed", "activeForm": "\u5efa\u7acb\u9519\u8bef\u76d1\u63a7\u548c\u65e5\u5fd7\u7cfb\u7edf"}, {"content": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6", "status": "in_progress", "activeForm": "\u5b8c\u5584\u7ec4\u4ef6\u63a5\u53e3\u5951\u7ea6"}, {"content": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863", "status": "pending", "activeForm": "\u5236\u5b9a\u7f16\u7801\u6807\u51c6\u6587\u6863"}, {"content": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b", "status": "pending", "activeForm": "\u8bbe\u8ba1\u51b2\u7a81\u89e3\u51b3\u7528\u6237\u6d41\u7a0b"}, {"content": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe", "status": "pending", "activeForm": "\u9a8c\u8bc1TensorFlow.js\u6027\u80fd\u5047\u8bbe"}, {"content": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49Chrome\u6269\u5c55CSP\u7b56\u7565"}, {"content": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212", "status": "pending", "activeForm": "\u5efa\u7acb\u53ef\u8bbf\u95ee\u6027\u5b9e\u73b0\u8ba1\u5212"}, {"content": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236", "status": "pending", "activeForm": "\u5b8c\u5584API\u9519\u8bef\u5904\u7406\u673a\u5236"}, {"content": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565", "status": "pending", "activeForm": "\u8bbe\u8ba1\u6570\u636e\u8fc1\u79fb\u7b56\u7565"}, {"content": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565", "status": "pending", "activeForm": "\u5b9a\u4e49\u4f9d\u8d56\u7ba1\u7406\u7b56\u7565"}, {"content": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7", "status": "pending", "activeForm": "\u5efa\u7acb\u6027\u80fd\u57fa\u51c6\u548c\u76d1\u63a7"}, {"content": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282", "status": "pending", "activeForm": "\u5b8c\u5584\u6d4b\u8bd5\u7b56\u7565\u7ec6\u8282"}, {"content": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f", "status": "pending", "activeForm": "\u5236\u5b9a\u90e8\u7f72\u548c\u56de\u6eda\u7a0b\u5e8f"}]