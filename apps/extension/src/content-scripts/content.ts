// BMad Link Content Script
import { errorHandler, enhancedErrorHandler, ErrorSeverity, ErrorCategory } from '@bmad/shared';

// Content Script 管理器类
class ContentScriptManager {
  private readonly COMPONENT_NAME = 'ContentScript';
  private isInitialized = false;

  constructor() {
    this.initializeContentScript();
  }

  private async initializeContentScript(): Promise<void> {
    if (this.isInitialized) return;

    const result = await errorHandler.safeExecute(
      async () => {
        console.log('BMad Link Content Script 加载完成', window.location.href);

        // 等待DOM准备
        await this.waitForDOMReady();
        
        // 初始化核心功能
        await this.initializeCore();
        
        this.isInitialized = true;
      },
      {
        component: this.COMPONENT_NAME,
        action: 'initializeContentScript',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.DOM_OPERATION
      }
    );
    
    if (!result.success) {
      console.error('Content Script初始化失败:', result.error);
    }
  }

  private async waitForDOMReady(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (document.readyState === 'loading') {
        const domReadyResult = errorHandler.safeDOMOperation(
          () => {
            document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
          },
          'addEventListener_DOMContentLoaded',
          this.COMPONENT_NAME
        );

        domReadyResult.then(result => {
          if (!result.success) {
            console.warn('DOM事件监听器设置失败，直接继续:', result.error?.message);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  private async initializeCore(): Promise<void> {
    console.log('BMad Link Content Script 初始化');

    // 建立与Service Worker的通信
    await this.establishServiceWorkerConnection();

    // 初始化页面监控
    this.initializePageMonitoring();

    // 设置全局错误捕获
    this.setupGlobalErrorHandling();
  }

  private async establishServiceWorkerConnection(): Promise<void> {
    // 使用增强版错误处理，支持重试和降级
    const connectionResult = await enhancedErrorHandler.safeMessageSendEnhanced(
      () => new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`通信失败: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(response);
          }
        });
      }),
      { 
        action: 'ping', 
        component: this.COMPONENT_NAME 
      },
      'service_worker_communication'
    );

    if (connectionResult.success) {
      console.log('Service Worker 连接成功:', connectionResult.data);
      
      // 检查是否是降级模式
      if (connectionResult.data && typeof connectionResult.data === 'object' && 'fallback' in connectionResult.data) {
        console.warn('Service Worker 运行在离线模式');
      }
    } else {
      console.error('Service Worker 连接失败:', connectionResult.error?.message);
      
      // 根据错误类型决定后续处理
      if (connectionResult.error?.retryable) {
        console.log('连接失败但可重试，扩展将继续运行');
      } else {
        console.error('严重连接错误，部分功能可能不可用');
      }
    }
  }

  private async initializePageMonitoring(): Promise<void> {
    // 监控页面变化
    const observer = new MutationObserver((mutations) => {
      this.handlePageMutations(mutations);
    });

    const observeResult = await errorHandler.safeDOMOperation(
      () => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: false
        });
        return observer;
      },
      'MutationObserver_observe',
      this.COMPONENT_NAME
    );

    if (!observeResult.success) {
      console.warn('页面监控初始化失败:', observeResult.error?.message);
    }
  }

  private async handlePageMutations(_mutations: MutationRecord[]): Promise<void> {
    // 处理页面变化，可以在这里检测书签相关的内容
    // TODO: 实现智能书签检测逻辑
  }

  /**
   * 发送消息到Service Worker - 增强版带重试和降级
   */
  async sendMessage<T = any>(action: string, data?: any): Promise<T | null> {
    const messageResult = await enhancedErrorHandler.safeMessageSendEnhanced(
      () => new Promise<T>((resolve, reject) => {
        const message = { action, ...data, timestamp: Date.now() };
        
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`消息发送失败: ${chrome.runtime.lastError.message}`));
          } else if (response?.error) {
            reject(new Error(`Service Worker错误: ${response.error}`));
          } else {
            resolve(response);
          }
        });
      }),
      { 
        action, 
        data, 
        component: this.COMPONENT_NAME 
      },
      'service_worker_communication'
    );

    if (messageResult.success) {
      // 成功情况，可能是正常响应或降级响应
      if (messageResult.data && typeof messageResult.data === 'object' && 'fallback' in messageResult.data) {
        console.warn(`${action} 操作使用了降级方案`);
      }
      return messageResult.data ?? null;
    } else {
      // 失败情况，记录详细错误信息
      console.error(`${action} 操作失败:`, {
        errorCode: messageResult.error?.code,
        errorType: messageResult.error?.type,
        retryable: messageResult.error?.retryable,
        message: messageResult.error?.message
      });
      
      return null;
    }
  }

  /**
   * 保存当前页面为书签
   */
  async saveCurrentPage(): Promise<boolean> {
    const pageInfo = await errorHandler.safeDOMOperation(
      () => ({
        url: window.location.href,
        title: document.title,
        description: this.extractPageDescription(),
        keywords: this.extractPageKeywords()
      }),
      'extractPageInfo',
      this.COMPONENT_NAME,
      {
        url: window.location.href,
        title: 'Unknown Page',
        description: '',
        keywords: []
      }
    );

    if (!pageInfo.success || !pageInfo.data) {
      console.error('获取页面信息失败:', pageInfo.error);
      return false;
    }

    const saveResult = await this.sendMessage('saveBookmark', pageInfo.data);
    return saveResult?.success === true;
  }

  private extractPageDescription(): string {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      return metaDesc.getAttribute('content') || '';
    }

    // 从第一段文本中提取描述
    const firstParagraph = document.querySelector('p');
    return firstParagraph?.textContent?.substring(0, 200) || '';
  }

  private extractPageKeywords(): string[] {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      const content = metaKeywords.getAttribute('content');
      return content ? content.split(',').map(k => k.trim()) : [];
    }

    // 从标题中提取关键词
    return document.title.split(/\s+/).filter(word => word.length > 2);
  }

  private setupGlobalErrorHandling(): void {
    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      errorHandler.safeExecute(
        () => {
          throw new Error(`页面脚本错误: ${event.error?.message || event.message}`);
        },
        {
          component: this.COMPONENT_NAME,
          action: 'global_error_handler',
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.UNKNOWN,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            url: window.location.href
          }
        }
      );
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      errorHandler.safeExecute(
        () => {
          throw new Error(`未处理的Promise拒绝: ${event.reason}`);
        },
        {
          component: this.COMPONENT_NAME,
          action: 'unhandled_rejection',
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.UNKNOWN,
          metadata: { 
            reason: event.reason,
            url: window.location.href
          }
        }
      );
    });
  }

  /**
   * 获取错误统计信息
   */
  getErrorStats() {
    return errorHandler.getErrorStats();
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.isInitialized = false;
    // TODO: 清理事件监听器和观察者
  }
}

// 创建全局实例
const contentScriptManager = new ContentScriptManager();

// 导出到全局作用域供其他脚本使用
(window as any).bmadContentScript = contentScriptManager;

export {};