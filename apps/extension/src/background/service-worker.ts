// BMad Link Chrome Extension Service Worker
import { errorHandler, enhancedErrorHandler, ErrorSeverity, ErrorCategory, ChromeErrorType } from '@bmad/shared';

// Service Worker 类封装
class ServiceWorkerManager {
  private readonly COMPONENT_NAME = 'ServiceWorker';

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    const result = await errorHandler.safeExecute(
      async () => {
        console.log('BMad Link Service Worker 启动');
        this.registerEventListeners();
      },
      {
        component: this.COMPONENT_NAME,
        action: 'initializeServiceWorker',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.CHROME_API
      }
    );
    
    if (!result.success) {
      console.error('Service Worker初始化失败:', result.error);
    }
  }

  private registerEventListeners(): void {
    // 扩展安装时的处理
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // 右键菜单点击处理
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // 扩展图标点击处理
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    // 消息传递处理
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this.handleMessage(request, sender, sendResponse);
    });
  }

  private async handleInstallation(details: chrome.runtime.InstalledDetails): Promise<void> {
    const result = await errorHandler.safeExecute(
      async () => {
        console.log('BMad Link 安装完成', details.reason);

        // 创建右键菜单
        const menuResult = await errorHandler.safeChromeCall(
          () => chrome.contextMenus.create({
            id: 'bmad-bookmark',
            title: '保存到 BMad Link',
            contexts: ['page', 'link']
          }),
          'contextMenus.create',
          this.COMPONENT_NAME
        );

        if (!menuResult.success) {
          console.warn('创建右键菜单失败，但不影响核心功能:', menuResult.error?.message);
        }
      },
      {
        component: this.COMPONENT_NAME,
        action: 'handleInstallation',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.CHROME_API
      }
    );
    
    if (!result.success) {
      console.error('安装处理失败:', result.error);
    }
  }

  private async handleContextMenuClick(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ): Promise<void> {
    await errorHandler.safeExecute(
      async () => {
        if (info.menuItemId === 'bmad-bookmark' && tab?.id) {
          console.log('用户点击右键菜单保存书签', {
            url: tab.url,
            title: tab.title
          });
          
          // TODO: 实现书签保存逻辑
          await this.saveBookmark(tab.url || '', tab.title || '');
        }
      },
      {
        component: this.COMPONENT_NAME,
        action: 'handleContextMenuClick',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.CHROME_API
      }
    );
  }

  private async handleActionClick(tab: chrome.tabs.Tab): Promise<void> {
    await errorHandler.safeExecute(
      async () => {
        if (!tab) {
          console.warn('扩展图标点击但没有活跃标签页');
          return;
        }
        
        console.log('用户点击扩展图标', tab.url);
        // TODO: 实现扩展图标点击逻辑
      },
      {
        component: this.COMPONENT_NAME,
        action: 'handleActionClick',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.CHROME_API
      }
    );
  }

  private async handleMessage(
    request: any,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    console.log('Service Worker 收到消息:', request);

    // 使用增强版错误处理来包装消息处理逻辑
    const processingResult = await enhancedErrorHandler.safeMessageSendEnhanced(
      () => this.processMessage(request),
      { 
        action: request?.action || 'unknown',
        component: this.COMPONENT_NAME 
      },
      'service_worker_communication'
    );

    // 根据处理结果发送标准化响应
    if (processingResult.success) {
      sendResponse(processingResult.data);
    } else {
      // 发送错误响应，包含用户友好的错误信息
      const errorResponse = {
        error: this.getErrorMessage(processingResult.error?.type),
        code: processingResult.error?.code,
        retryable: processingResult.error?.retryable,
        timestamp: Date.now()
      };
      
      sendResponse(errorResponse);
    }

    return true; // 异步响应
  }

  /**
   * 实际的消息处理逻辑
   */
  private async processMessage(request: any): Promise<any> {
    // 验证消息格式
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid message format');
    }

    // 处理ping消息
    if (request.action === 'ping') {
      return { status: 'pong', timestamp: Date.now() };
    }

    // 处理其他消息类型
    switch (request.action) {
      case 'saveBookmark':
        await this.saveBookmark(request.url, request.title);
        return { success: true, action: 'saveBookmark' };

      case 'getBookmarks':
        const bookmarks = await this.getBookmarks();
        return { success: true, bookmarks, action: 'getBookmarks' };

      default:
        throw new Error(`Unknown message type: ${request.action}`);
    }
  }

  /**
   * 将错误类型转换为用户友好的消息
   */
  private getErrorMessage(errorType?: ChromeErrorType): string {
    switch (errorType) {
      case ChromeErrorType.EXTENSION_CONTEXT_INVALIDATED:
        return '扩展上下文已失效，请重新加载页面';
      case ChromeErrorType.SERVICE_WORKER_INACTIVE:
        return 'Service Worker 不活跃，正在重新启动';
      case ChromeErrorType.PERMISSION_DENIED:
        return '权限不足，请检查扩展权限设置';
      case ChromeErrorType.QUOTA_EXCEEDED:
        return '存储空间不足，请清理数据';
      case ChromeErrorType.NETWORK_ERROR:
        return '网络错误，请检查连接';
      case ChromeErrorType.TIMEOUT:
        return '操作超时，请重试';
      case ChromeErrorType.MALFORMED_RESPONSE:
        return '数据格式错误';
      default:
        return '操作失败，请重试';
    }
  }

  private async saveBookmark(url: string, title: string): Promise<void> {
    // TODO: 实现书签保存逻辑
    const result = await errorHandler.safeChromeCall(
      async () => {
        // 模拟保存到Chrome storage
        return chrome.storage.local.set({
          [`bookmark_${Date.now()}`]: { url, title, timestamp: Date.now() }
        });
      },
      'storage.local.set',
      this.COMPONENT_NAME
    );

    if (!result.success) {
      throw new Error(`保存书签失败: ${result.error?.message}`);
    }
  }

  private async getBookmarks(): Promise<any[]> {
    // TODO: 实现获取书签逻辑
    const result = await errorHandler.safeChromeCall(
      async () => chrome.storage.local.get(null),
      'storage.local.get',
      this.COMPONENT_NAME,
      {}
    );

    if (!result.success) {
      console.error('获取书签失败:', result.error);
      return [];
    }

    const storage = result.data || {};
    return Object.entries(storage)
      .filter(([key]) => key.startsWith('bookmark_'))
      .map(([, value]) => value);
  }
}

// 全局错误捕获
self.addEventListener('error', (event) => {
  errorHandler.safeExecute(
    () => {
      throw new Error(`未捕获错误: ${event.error?.message || event.message}`);
    },
    {
      component: 'ServiceWorker',
      action: 'global_error_handler',
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.UNKNOWN,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    }
  );
});

self.addEventListener('unhandledrejection', (event) => {
  errorHandler.safeExecute(
    () => {
      throw new Error(`未处理的Promise拒绝: ${event.reason}`);
    },
    {
      component: 'ServiceWorker',
      action: 'unhandled_rejection',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UNKNOWN,
      metadata: { reason: event.reason }
    }
  );
});

// 初始化Service Worker管理器
new ServiceWorkerManager();

export {};