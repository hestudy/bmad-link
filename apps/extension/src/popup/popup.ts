// BMad Link Popup Script
import '@bmad/ui-components';
import { errorHandler, ErrorSeverity, ErrorCategory } from '@bmad/shared';

// Popup 管理器类
class PopupManager {
  private readonly COMPONENT_NAME = 'Popup';
  private isInitialized = false;
  private errorDisplay: HTMLElement | null = null;

  constructor() {
    this.initializePopup();
  }

  private async initializePopup(): Promise<void> {
    console.log('BMad Link Popup 加载完成');

    // 等待DOM加载
    await this.waitForDOM();
    
    // 初始化UI
    await this.initializeUI();
    
    // 建立Service Worker连接
    await this.establishServiceWorkerConnection();
    
    this.isInitialized = true;
    console.log('Popup初始化完成:', this.isInitialized);
  }

  private async waitForDOM(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (document.readyState === 'loading') {
        const domResult = errorHandler.safeDOMOperation(
          () => {
            document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
          },
          'addEventListener_DOMContentLoaded',
          this.COMPONENT_NAME
        );

        domResult.then(result => {
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

  private async initializeUI(): Promise<void> {
    console.log('Popup DOM 加载完成');

    // 创建错误显示区域
    await this.createErrorDisplay();

    // 初始化UI组件
    await this.initializeUIComponents();

    // 设置事件监听器
    this.setupEventListeners();
  }

  private async createErrorDisplay(): Promise<void> {
    const displayResult = await errorHandler.safeDOMOperation(
      () => {
        // 创建错误显示容器
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-display';
        errorDiv.style.cssText = `
          display: none;
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 8px;
          margin: 8px 0;
          border-radius: 4px;
          font-size: 12px;
        `;
        
        document.body.insertBefore(errorDiv, document.body.firstChild);
        return errorDiv;
      },
      'createErrorDisplay',
      this.COMPONENT_NAME
    );

    if (displayResult.success) {
      this.errorDisplay = displayResult.data ?? null;
    }
  }

  private async initializeUIComponents(): Promise<void> {
    // 初始化Hello World组件
    const componentResult = await errorHandler.safeDOMOperation(
      () => {
        const helloWorld = document.createElement('hello-world');
        const container = document.querySelector('#app');
        if (container) {
          container.appendChild(helloWorld);
        }
        return helloWorld;
      },
      'initializeHelloWorldComponent',
      this.COMPONENT_NAME
    );

    if (!componentResult.success) {
      this.showError('UI组件初始化失败', componentResult.error);
    }
  }

  private setupEventListeners(): void {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(new Error(`Promise拒绝: ${event.reason}`), {
        reason: event.reason
      });
    });

    // 添加重新连接按钮点击处理
    this.addReconnectButton();
  }

  private async addReconnectButton(): Promise<void> {
    const buttonResult = await errorHandler.safeDOMOperation(
      () => {
        const button = document.createElement('button');
        button.textContent = '重新连接';
        button.style.cssText = 'margin: 8px; padding: 4px 8px; font-size: 12px;';
        button.addEventListener('click', () => this.handleReconnectClick());
        
        const container = document.querySelector('#app');
        if (container) {
          container.appendChild(button);
        }
        return button;
      },
      'addReconnectButton',
      this.COMPONENT_NAME
    );

    if (!buttonResult.success) {
      console.warn('添加重连按钮失败:', buttonResult.error?.message);
    }
  }

  private async handleReconnectClick(): Promise<void> {
    this.hideError();
    await this.establishServiceWorkerConnection();
  }

  private async establishServiceWorkerConnection(): Promise<void> {
    const connectionResult = await errorHandler.safeMessageSend(
      () => new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`通信失败: ${chrome.runtime.lastError.message}`));
          } else {
            resolve(response);
          }
        });
      }),
      { action: 'ping' },
      this.COMPONENT_NAME
    );

    if (connectionResult.success) {
      console.log('Service Worker响应:', connectionResult.data);
      this.showSuccess('与Service Worker连接成功');
    } else {
      const errorMsg = '无法连接到Service Worker';
      console.error(errorMsg, connectionResult.error);
      this.showError(errorMsg, connectionResult.error);
    }
  }

  /**
   * 发送消息到Service Worker
   */
  async sendMessage<T = any>(action: string, data?: any): Promise<T | null> {
    const messageResult = await errorHandler.safeMessageSend(
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
      { action, data },
      this.COMPONENT_NAME
    );

    if (!messageResult.success) {
      this.showError(`消息发送失败: ${action}`, messageResult.error);
      return null;
    }

    return messageResult.data ?? null;
  }

  /**
   * 获取书签列表
   */
  async getBookmarks(): Promise<any[]> {
    const bookmarks = await this.sendMessage<{bookmarks: any[]}>('getBookmarks');
    return bookmarks?.bookmarks || [];
  }

  /**
   * 保存当前页面书签
   */
  async saveCurrentPageBookmark(): Promise<boolean> {
    const result = await this.sendMessage('saveBookmark', {
      url: 'popup://current-page',
      title: 'Popup保存的书签',
      timestamp: Date.now()
    });

    return result?.success === true;
  }

  /**
   * 显示错误信息
   */
  private showError(message: string, error?: Error): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = `${message}${error ? ': ' + error.message : ''}`;
      this.errorDisplay.style.display = 'block';
      
      // 5秒后自动隐藏
      setTimeout(() => this.hideError(), 5000);
    }
  }

  /**
   * 显示成功信息
   */
  private showSuccess(message: string): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.backgroundColor = '#efe';
      this.errorDisplay.style.borderColor = '#cfc';
      this.errorDisplay.style.color = '#3c3';
      this.errorDisplay.style.display = 'block';
      
      // 3秒后自动隐藏
      setTimeout(() => {
        this.hideError();
        // 恢复错误样式
        if (this.errorDisplay) {
          this.errorDisplay.style.backgroundColor = '#fee';
          this.errorDisplay.style.borderColor = '#fcc';
          this.errorDisplay.style.color = '#c33';
        }
      }, 3000);
    }
  }

  /**
   * 隐藏错误/成功信息
   */
  private hideError(): void {
    if (this.errorDisplay) {
      this.errorDisplay.style.display = 'none';
    }
  }

  /**
   * 处理全局错误
   */
  private handleGlobalError(error: Error, metadata?: any): void {
    errorHandler.safeExecute(
      () => { throw error; },
      {
        component: this.COMPONENT_NAME,
        action: 'global_error_handler',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.UNKNOWN,
        metadata
      }
    );

    this.showError('发生未预期错误', error);
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    return errorHandler.getErrorStats();
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.isInitialized = false;
    this.hideError();
    // TODO: 清理事件监听器
  }
}

// 创建全局实例
const popupManager = new PopupManager();

// 导出到全局作用域
(window as any).bmadPopup = popupManager;