// 最简单的background script测试
console.log('🚀 Simple background script starting...');

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message);
  if (message.type === 'GET_REQUESTS') {
    sendResponse({ requests: [] });
  }
});

// 设置webRequest监听器
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log('🔍 Request intercepted:', details.url);
  },
  { urls: ['<all_urls>'] }
);

console.log('🚀 Simple background script loaded successfully!');
