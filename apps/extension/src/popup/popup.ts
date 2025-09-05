// BMad Link Popup Script
import '@bmad/ui-components';

console.log('BMad Link Popup 加载完成');

// 初始化popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM 加载完成');
  
  // 向Service Worker发送消息测试通信
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('与Service Worker通信失败:', chrome.runtime.lastError);
    } else {
      console.log('Service Worker响应:', response);
    }
  });
});