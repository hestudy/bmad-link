import { BaseComponent } from '../base/base-component';

export class HelloWorld extends BaseComponent {
  private message = 'Hello World';
  private subtitle = 'BMad Link 智能书签管理器已成功加载';
  
  render(): string {
    return `
      <div class="hello-container">
        <div class="logo">
          <span class="logo-icon">🔖</span>
          <h1 class="title">${this.message}</h1>
        </div>
        <p class="subtitle">${this.subtitle}</p>
        <div class="status">
          <span class="status-dot"></span>
          <span class="status-text">扩展运行正常</span>
        </div>
      </div>
    `;
  }
  
  getStyles(): string {
    return `
      .hello-container {
        padding: 20px;
        text-align: center;
        background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3a 100%);
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 320px;
        border-radius: 8px;
      }
      
      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .logo-icon {
        font-size: 24px;
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
      }
      
      .title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        background: linear-gradient(45deg, #6366f1, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .subtitle {
        margin: 0 0 20px;
        font-size: 14px;
        color: #a1a1aa;
        line-height: 1.5;
      }
      
      .status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(34, 197, 94, 0.1);
        border-radius: 20px;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      .status-text {
        font-size: 12px;
        color: #22c55e;
        font-weight: 500;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* 响应式设计 */
      @media (max-width: 350px) {
        .hello-container {
          min-width: 280px;
          padding: 16px;
        }
        
        .title {
          font-size: 18px;
        }
        
        .subtitle {
          font-size: 13px;
        }
      }
    `;
  }
}

// 注册自定义元素
customElements.define('bmad-hello-world', HelloWorld);