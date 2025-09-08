// 基础类型定义
export interface BaseComponent {
  render(): string;
  getStyles(): string;
}

// 基础配置类型
export interface Config {
  appName: string;
  version: string;
  isDevelopment: boolean;
}

// 导出常量
export const APP_NAME = 'BMad Link';
export const APP_VERSION = '0.1.0';

// 错误处理相关导出
export * from './error-handler';