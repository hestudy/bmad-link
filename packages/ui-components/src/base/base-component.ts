import { BaseComponent as IBaseComponent } from '@bmad/shared';

export abstract class BaseComponent extends HTMLElement implements IBaseComponent {
  protected shadow: ShadowRoot;
  protected template: HTMLTemplateElement;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'closed' });
    this.template = document.createElement('template');
  }
  
  connectedCallback(): void {
    this.render();
    this.attachEvents();
  }
  
  disconnectedCallback(): void {
    this.cleanup();
  }
  
  protected render(): void {
    const styles = this.getStyles();
    const content = this.getTemplate();
    
    this.template.innerHTML = `
      <style>${styles}</style>
      ${content}
    `;
    
    this.shadow.appendChild(this.template.content.cloneNode(true));
  }
  
  abstract getTemplate(): string;
  abstract getStyles(): string;
  
  protected attachEvents(): void {
    // 子类可重写此方法来绑定事件
  }
  
  protected cleanup(): void {
    // 子类可重写此方法来清理资源
  }
}