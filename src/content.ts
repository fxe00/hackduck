// Content script for HackDuck
// 这个脚本在页面中运行，用于与页面交互

console.log('HackDuck content script loaded');

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CAPTURED') {
    // 可以在这里添加页面级别的请求处理逻辑
    console.log('Request captured in content script:', message.data);
  } else if (message.type === 'SEND_REQUEST') {
    // 处理发送请求的消息
    handleSendRequest(message.data, sendResponse);
    return true; // 保持消息通道开放
  }
});

// 处理发送请求
async function handleSendRequest(requestData: any, sendResponse: any) {
  try {
    const startTime = Date.now();
    
    // 构建请求选项，处理CORS问题
    const requestOptions: RequestInit = {
      method: requestData.method,
      mode: 'no-cors', // 使用no-cors模式避免CORS问题
      credentials: 'omit', // 不发送凭据，避免CORS问题
      headers: {
        // 只保留基本的请求头，避免CORS问题
        'Accept': '*/*'
      }
    };
    
    // 如果有请求体，添加到选项中
    if (requestData.body) {
      requestOptions.body = requestData.body;
    }
    
    console.log('Sending request:', {
      url: requestData.url,
      method: requestData.method,
      headers: requestOptions.headers
    });
    
    const response = await fetch(requestData.url, requestOptions);
    
    const responseTime = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    
    // 获取响应头
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // 获取响应体
    const responseBody = await response.text();
    
    console.log('Request completed:', {
      status: response.status,
      responseTime,
      headers: responseHeaders
    });
    
    sendResponse({
      success: true,
      status: response.status,
      responseTime,
      headers: responseHeaders,
      body: responseBody
    });
  } catch (error: any) {
    console.error('Request failed:', error);
    sendResponse({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
}

// 暂时禁用injected script监听，避免与webRequest冲突
// window.addEventListener('message', (event) => {
//   if (event.source !== window) return;
//   
//   if (event.data.type === 'HACKDUCK_REQUEST') {
//     console.log('Request intercepted from injected script:', event.data.data);
//     
//     // 转发给background script
//     chrome.runtime.sendMessage({
//       type: 'REQUEST_CAPTURED',
//       data: {
//         id: `injected-${Date.now()}-${Math.random()}`,
//         url: event.data.data.url,
//         method: event.data.data.method,
//         headers: event.data.data.headers || {},
//         body: event.data.data.body,
//         timestamp: Date.now(),
//         tabId: null // 将在background script中设置
//       }
//     });
//   } else if (event.data.type === 'HACKDUCK_RESPONSE') {
//     console.log('Response intercepted from injected script:', event.data.data);
//     
//     // 转发响应信息给background script
//     chrome.runtime.sendMessage({
//       type: 'RESPONSE_CAPTURED',
//       data: event.data.data
//     });
//   }
// });

// 暂时禁用injected script注入，避免与webRequest冲突
// const script = document.createElement('script');
// script.src = chrome.runtime.getURL('injected.js');
// script.onload = function() {
//   const element = this as HTMLScriptElement;
//   if (element.parentNode) {
//     element.parentNode.removeChild(element);
//   }
// };
// (document.head || document.documentElement).appendChild(script);
