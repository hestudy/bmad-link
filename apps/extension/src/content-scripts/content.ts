// BMad Link Content Script
console.log('BMad Link Content Script 加载完成', window.location.href);

// 页面加载完成后的处理
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

function initContentScript(): void {
  console.log('BMad Link Content Script 初始化');
  
  // 向Service Worker发送ping消息测试通信
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('通信失败:', chrome.runtime.lastError);
    } else {
      console.log('Service Worker 响应:', response);
    }
  });
}

export {};