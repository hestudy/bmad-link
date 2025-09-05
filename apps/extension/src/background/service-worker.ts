// BMad Link Chrome Extension Service Worker
console.log('BMad Link Service Worker 启动');

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener((details) => {
  console.log('BMad Link 安装完成', details.reason);
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'bmad-bookmark',
    title: '保存到 BMad Link',
    contexts: ['page', 'link']
  });
});

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'bmad-bookmark' && tab?.id) {
    console.log('用户点击右键菜单保存书签', {
      url: tab.url,
      title: tab.title
    });
    // TODO: 实现书签保存逻辑
  }
});

// 扩展图标点击处理
chrome.action.onClicked.addListener((tab) => {
  console.log('用户点击扩展图标', tab.url);
});

// 消息传递处理
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Service Worker 收到消息:', request);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
    return true;
  }
  
  return false;
});

export {};