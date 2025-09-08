/**
 * 统一错误处理工具类
 * 提供统一的错误处理、日志记录和错误恢复机制
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  CHROME_API = 'chrome_api',
  COMMUNICATION = 'communication',
  DOM_OPERATION = 'dom_operation',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component: string;
  action: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface ErrorResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  errorCode?: string;
  retryable?: boolean;
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: number;
  }> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 安全执行函数，自动处理错误
   */
  async safeExecute<T>(
    fn: () => T | Promise<T>,
    context: ErrorContext,
    fallback?: T
  ): Promise<ErrorResult<T>> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError(errorObj, context);
      
      return {
        success: false,
        error: errorObj,
        errorCode: this.generateErrorCode(context),
        retryable: this.isRetryableError(errorObj, context),
        data: fallback
      };
    }
  }

  /**
   * Chrome API安全包装器
   */
  async safeChromeCall<T>(
    apiCall: () => T | Promise<T>,
    apiName: string,
    component: string,
    fallback?: T
  ): Promise<ErrorResult<T>> {
    return this.safeExecute(
      apiCall,
      {
        component,
        action: `chrome.${apiName}`,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.CHROME_API
      },
      fallback
    );
  }

  /**
   * DOM操作安全包装器
   */
  async safeDOMOperation<T>(
    operation: () => T,
    operationName: string,
    component: string,
    fallback?: T
  ): Promise<ErrorResult<T>> {
    return this.safeExecute(
      operation,
      {
        component,
        action: operationName,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.DOM_OPERATION
      },
      fallback
    );
  }

  /**
   * 带重试的安全执行
   */
  async safeExecuteWithRetry<T>(
    fn: () => T | Promise<T>,
    context: ErrorContext,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<ErrorResult<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.safeExecute(fn, {
        ...context,
        metadata: { ...context.metadata, attempt }
      });

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries && result.retryable) {
        await this.delay(retryDelay * Math.pow(2, attempt)); // 指数退避
      }
    }

    return {
      success: false,
      error: lastError!,
      errorCode: this.generateErrorCode(context),
      retryable: false
    };
  }

  /**
   * 消息传递安全包装器
   */
  async safeMessageSend<T>(
    sendFn: () => Promise<T>,
    message: any,
    component: string
  ): Promise<ErrorResult<T>> {
    return this.safeExecuteWithRetry(
      sendFn,
      {
        component,
        action: 'message_send',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.COMMUNICATION,
        metadata: { messageType: message?.action || 'unknown' }
      },
      2, // 最多重试2次
      500 // 500ms延迟
    );
  }

  /**
   * 记录错误
   */
  private logError(error: Error, context: ErrorContext): void {
    const timestamp = Date.now();
    const logEntry = { error, context: { ...context, timestamp }, timestamp };
    
    this.errorLog.push(logEntry);
    
    // 保持错误日志大小在合理范围内
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // 根据严重程度决定日志级别
    const logMessage = this.formatErrorMessage(error, context);
    
    switch (context.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
        break;
    }
  }

  /**
   * 格式化错误消息
   */
  private formatErrorMessage(error: Error, context: ErrorContext): string {
    return `[${context.severity.toUpperCase()}] ${context.component}:${context.action} - ${error.message}${
      context.metadata ? ` (${JSON.stringify(context.metadata)})` : ''
    }`;
  }

  /**
   * 生成错误码
   */
  private generateErrorCode(context: ErrorContext): string {
    const timestamp = Date.now().toString(36);
    return `${context.category.toUpperCase()}_${context.component.toUpperCase()}_${timestamp}`;
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: Error, context: ErrorContext): boolean {
    const message = error.message.toLowerCase();
    
    // Chrome API相关的重试策略
    if (context.category === ErrorCategory.CHROME_API) {
      return message.includes('not available') || 
             message.includes('disconnected') ||
             message.includes('context invalidated');
    }

    // 通信相关的重试策略
    if (context.category === ErrorCategory.COMMUNICATION) {
      return message.includes('connection') || 
             message.includes('timeout') ||
             message.includes('network');
    }

    // DOM操作通常不重试
    if (context.category === ErrorCategory.DOM_OPERATION) {
      return false;
    }

    return false;
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recent: number; // 最近1小时的错误数
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recent = this.errorLog.filter(log => log.timestamp > oneHourAgo).length;

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errorLog.filter(log => log.context.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const byCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = this.errorLog.filter(log => log.context.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    return {
      total: this.errorLog.length,
      bySeverity,
      byCategory,
      recent
    };
  }

  /**
   * 清除错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

/**
 * 扩展Chrome错误类型定义
 */
export enum ChromeErrorType {
  EXTENSION_CONTEXT_INVALIDATED = 'extension_context_invalidated',
  SERVICE_WORKER_INACTIVE = 'service_worker_inactive', 
  PERMISSION_DENIED = 'permission_denied',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  MALFORMED_RESPONSE = 'malformed_response',
  UNKNOWN = 'unknown'
}

/**
 * 标准化的API响应格式
 */
export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    type: ChromeErrorType;
    severity: ErrorSeverity;
    retryable: boolean;
    timestamp: number;
  };
  metadata?: {
    requestId: string;
    processingTime: number;
    retryCount?: number;
  };
}

/**
 * 错误恢复策略配置
 */
export interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  timeoutMs: number;
  fallbackEnabled: boolean;
}

/**
 * 增强版错误处理器 - 支持降级和用户提示
 */
export class EnhancedErrorHandler extends ErrorHandler {
  private static enhancedInstance: EnhancedErrorHandler;
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private activeRequests: Map<string, AbortController> = new Map();
  private userNotificationEnabled = true;

  constructor() {
    super();
    this.initializeDefaultStrategies();
  }

  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.enhancedInstance) {
      EnhancedErrorHandler.enhancedInstance = new EnhancedErrorHandler();
    }
    return EnhancedErrorHandler.enhancedInstance;
  }

  private initializeDefaultStrategies(): void {
    this.recoveryStrategies.set('service_worker_communication', {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      timeoutMs: 5000,
      fallbackEnabled: true
    });

    this.recoveryStrategies.set('chrome_api_call', {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 1.5,
      timeoutMs: 3000,
      fallbackEnabled: true
    });

    this.recoveryStrategies.set('storage_operation', {
      maxRetries: 2,
      retryDelay: 200,
      backoffMultiplier: 2,
      timeoutMs: 2000,
      fallbackEnabled: false
    });
  }

  /**
   * 增强版消息发送 - 支持重试、降级和用户提示
   */
  async safeMessageSendEnhanced<T = any>(
    messageFn: () => Promise<T>,
    context: { action: string; data?: any; component: string },
    strategyKey = 'service_worker_communication'
  ): Promise<StandardResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const strategy = this.recoveryStrategies.get(strategyKey)!;
    const abortController = new AbortController();
    
    this.activeRequests.set(requestId, abortController);

    try {
      const result = await this.executeWithRetry(
        messageFn,
        strategy,
        abortController.signal,
        context
      );

      return this.createSuccessResponse(result, {
        requestId,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorDetails = this.classifyError(error, context);
      
      // 显示用户友好的错误提示
      if (this.userNotificationEnabled) {
        this.showUserFriendlyError(errorDetails, context);
      }
      
      // 尝试降级策略
      if (strategy.fallbackEnabled && errorDetails.retryable) {
        const fallbackResult = await this.executeFallbackStrategy(context);
        if (fallbackResult !== null) {
          return this.createSuccessResponse(fallbackResult, {
            requestId,
            processingTime: Date.now() - startTime
          });
        }
      }

      return this.createErrorResponse(errorDetails, {
        requestId,
        processingTime: Date.now() - startTime
      });

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    strategy: RecoveryStrategy,
    signal: AbortSignal,
    context: { action: string; component: string }
  ): Promise<T> {
    let lastError: Error;
    let currentDelay = strategy.retryDelay;

    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      if (signal.aborted) {
        throw new Error('请求已取消');
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), strategy.timeoutMs);
        });

        const result = await Promise.race([fn(), timeoutPromise]);
        
        if (attempt > 0) {
          console.log(`${context.component}: ${context.action} 重试成功 (第${attempt}次)`);
        }
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < strategy.maxRetries) {
          const errorType = this.getErrorType(lastError);
          
          if (this.isNonRetryableError(errorType)) {
            break;
          }

          console.warn(`${context.component}: ${context.action} 失败，${currentDelay}ms后重试 (${attempt + 1}/${strategy.maxRetries})`, lastError.message);
          
          await this.delayEnhanced(currentDelay);
          currentDelay *= strategy.backoffMultiplier;
        }
      }
    }

    throw lastError!;
  }

  private classifyError(error: unknown, context: { action: string; component: string }): {
    code: string;
    message: string;
    type: ChromeErrorType;
    severity: ErrorSeverity;
    retryable: boolean;
    timestamp: number;
  } {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message.toLowerCase();

    let type = ChromeErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let retryable = true;

    if (message.includes('extension context invalidated')) {
      type = ChromeErrorType.EXTENSION_CONTEXT_INVALIDATED;
      severity = ErrorSeverity.HIGH;
      retryable = false;
    } else if (message.includes('service worker') || message.includes('inactive')) {
      type = ChromeErrorType.SERVICE_WORKER_INACTIVE;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
    } else if (message.includes('permissions') || message.includes('denied')) {
      type = ChromeErrorType.PERMISSION_DENIED;
      severity = ErrorSeverity.HIGH;
      retryable = false;
    } else if (message.includes('quota') || message.includes('exceeded')) {
      type = ChromeErrorType.QUOTA_EXCEEDED;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
    } else if (message.includes('network') || message.includes('fetch')) {
      type = ChromeErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.LOW;
      retryable = true;
    } else if (message.includes('timeout') || message.includes('超时')) {
      type = ChromeErrorType.TIMEOUT;
      severity = ErrorSeverity.LOW;
      retryable = true;
    } else if (message.includes('invalid') || message.includes('malformed')) {
      type = ChromeErrorType.MALFORMED_RESPONSE;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
    }

    return {
      code: `${context.component.toUpperCase()}_${context.action.toUpperCase()}_ERROR`,
      message: this.sanitizeErrorMessage(err.message),
      type,
      severity,
      retryable,
      timestamp: Date.now()
    };
  }

  private async executeFallbackStrategy(context: { action: string; data?: any; component: string }): Promise<any> {
    console.log(`${context.component}: 执行 ${context.action} 的降级策略`);

    switch (context.action) {
      case 'ping':
        return { status: 'offline', timestamp: Date.now(), fallback: true };
        
      case 'saveBookmark':
        return await this.saveToLocalCache(context.data);
        
      case 'getBookmarks':
        return await this.getFromLocalCache();
        
      default:
        return null;
    }
  }

  private async saveToLocalCache(bookmarkData: any): Promise<{ success: boolean; fallback: boolean }> {
    try {
      const cached = await chrome.storage.local.get('cached_bookmarks');
      const cachedBookmarks = cached.cached_bookmarks || [];
      
      cachedBookmarks.push({
        ...bookmarkData,
        id: this.generateRequestId(),
        cachedAt: Date.now(),
        synced: false
      });
      
      await chrome.storage.local.set({ cached_bookmarks: cachedBookmarks });
      
      return { success: true, fallback: true };
    } catch (error) {
      console.error('本地缓存失败:', error);
      return { success: false, fallback: true };
    }
  }

  private async getFromLocalCache(): Promise<any[]> {
    try {
      const cached = await chrome.storage.local.get('cached_bookmarks');
      return cached.cached_bookmarks || [];
    } catch (error) {
      console.error('读取本地缓存失败:', error);
      return [];
    }
  }

  private showUserFriendlyError(error: {
    type: ChromeErrorType;
    message: string;
    severity: ErrorSeverity;
  }, _context: { action: string; component: string }): void {
    const friendlyMessages = {
      [ChromeErrorType.EXTENSION_CONTEXT_INVALIDATED]: '扩展需要重新启动，请重新加载页面',
      [ChromeErrorType.SERVICE_WORKER_INACTIVE]: 'BMad Link 服务暂时不可用，正在重试连接...',
      [ChromeErrorType.PERMISSION_DENIED]: '权限不足，请检查扩展权限设置',
      [ChromeErrorType.QUOTA_EXCEEDED]: '存储空间不足，请清理部分书签',
      [ChromeErrorType.NETWORK_ERROR]: '网络连接异常，请检查网络设置',
      [ChromeErrorType.TIMEOUT]: '操作超时，请稍后重试',
      [ChromeErrorType.MALFORMED_RESPONSE]: '数据格式异常，操作失败',
      [ChromeErrorType.UNKNOWN]: '发生未知错误，请重试'
    };

    const friendlyMessage = friendlyMessages[error.type] || friendlyMessages[ChromeErrorType.UNKNOWN];
    
    // 只在高优先级错误时显示用户提示
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      console.error(`BMad Link: ${friendlyMessage}`);
      
      // 在实际环境中，这里可以通过popup或通知显示给用户
      // 现在先通过console输出用户友好的消息
    }
  }

  private createSuccessResponse<T>(data: T, metadata: { requestId: string; processingTime: number }): StandardResponse<T> {
    return {
      success: true,
      data,
      metadata
    };
  }

  private createErrorResponse(error: {
    code: string;
    message: string;
    type: ChromeErrorType;
    severity: ErrorSeverity;
    retryable: boolean;
    timestamp: number;
  }, metadata: { requestId: string; processingTime: number }): StandardResponse {
    return {
      success: false,
      error,
      metadata
    };
  }

  private getErrorType(error: Error): ChromeErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('extension context')) return ChromeErrorType.EXTENSION_CONTEXT_INVALIDATED;
    if (message.includes('service worker')) return ChromeErrorType.SERVICE_WORKER_INACTIVE;
    if (message.includes('permission')) return ChromeErrorType.PERMISSION_DENIED;
    if (message.includes('quota')) return ChromeErrorType.QUOTA_EXCEEDED;
    if (message.includes('network')) return ChromeErrorType.NETWORK_ERROR;
    if (message.includes('timeout')) return ChromeErrorType.TIMEOUT;
    if (message.includes('invalid')) return ChromeErrorType.MALFORMED_RESPONSE;
    
    return ChromeErrorType.UNKNOWN;
  }

  private isNonRetryableError(errorType: ChromeErrorType): boolean {
    return [
      ChromeErrorType.EXTENSION_CONTEXT_INVALIDATED,
      ChromeErrorType.PERMISSION_DENIED,
      ChromeErrorType.QUOTA_EXCEEDED,
      ChromeErrorType.MALFORMED_RESPONSE
    ].includes(errorType);
  }

  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/chrome-extension:\/\/[a-z]+/g, 'chrome-extension://***')
      .replace(/file:\/\/\/.*?/g, 'file:///***')
      .substring(0, 200);
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delayEnhanced(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置用户通知开关
   */
  setUserNotificationEnabled(enabled: boolean): void {
    this.userNotificationEnabled = enabled;
  }

  /**
   * 取消所有活跃的请求
   */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.activeRequests) {
      controller.abort();
      console.log(`取消请求: ${requestId}`);
    }
    this.activeRequests.clear();
  }

  /**
   * 获取增强版错误统计信息
   */
  getEnhancedErrorStats(): { 
    activeRequests: number; 
    strategies: string[];
    errorsByType: Record<ChromeErrorType, number>;
  } {
    // 这里需要访问父类的errorLog，但它是private，所以先用基本实现
    return {
      activeRequests: this.activeRequests.size,
      strategies: Array.from(this.recoveryStrategies.keys()),
      errorsByType: Object.values(ChromeErrorType).reduce((acc, type) => {
        acc[type] = 0; // 实际实现中需要统计错误类型
        return acc;
      }, {} as Record<ChromeErrorType, number>)
    };
  }
}

// 导出增强版单例实例
export const enhancedErrorHandler = EnhancedErrorHandler.getInstance();

/**
 * 装饰器：自动错误处理
 */
export function SafeCall(context: Partial<ErrorContext>) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // 如果没有descriptor，创建一个新的（用于方法装饰器）
    if (!descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {
        value: target[propertyKey],
        writable: true,
        enumerable: true,
        configurable: true
      };
    }

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fullContext: ErrorContext = {
        component: target.constructor?.name || target.name || 'unknown',
        action: propertyKey,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.UNKNOWN,
        ...context
      };

      const result = await errorHandler.safeExecute(
        () => originalMethod.apply(this, args),
        fullContext
      );

      if (!result.success && fullContext.severity === ErrorSeverity.CRITICAL) {
        throw result.error;
      }

      return result.success ? result.data : undefined;
    };

    // 如果原始方法没有descriptor，设置到target上
    if (!Object.getOwnPropertyDescriptor(target, propertyKey)) {
      Object.defineProperty(target, propertyKey, descriptor);
    }

    return descriptor;
  };
}