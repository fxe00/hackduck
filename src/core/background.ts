import type { HttpRequest, Message } from '../types';

// 立即输出测试日志
console.log('🚀 Background script starting...');

// 存储拦截的请求
let interceptedRequests: HttpRequest[] = [];
let isIntercepting = true; // 默认开启拦截

// 从URL中提取域名
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.warn('Failed to extract domain from URL:', url, error);
    return null;
  }
}

// 获取指定域名的所有Cookie（包括子域名）
async function getAllCookiesForDomain(domain: string): Promise<chrome.cookies.Cookie[]> {
  return new Promise((resolve) => {
    if (!chrome.cookies) {
      console.warn('chrome.cookies API not available');
      resolve([]);
      return;
    }

    // 首先尝试获取精确域名的cookie
    chrome.cookies.getAll({ domain }, (cookies) => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to get cookies:', chrome.runtime.lastError.message);
        resolve([]);
        return;
      }
      
      const result = cookies || [];
      
      // 如果是子域名（如 www.example.com），也尝试获取父域名的cookie（如 .example.com）
      const parts = domain.split('.');
      if (parts.length > 2) {
        // 尝试获取父域名的cookie（带点前缀，如 .example.com）
        const parentDomain = '.' + parts.slice(-2).join('.');
        chrome.cookies.getAll({ domain: parentDomain }, (parentCookies) => {
          if (!chrome.runtime.lastError && parentCookies) {
            // 合并结果，去重（基于name和domain）
            const existing = new Set(result.map(c => `${c.name}@${c.domain}`));
            parentCookies.forEach(cookie => {
              const key = `${cookie.name}@${cookie.domain}`;
              if (!existing.has(key)) {
                result.push(cookie);
                existing.add(key);
              }
            });
          }
          resolve(result);
        });
      } else {
        resolve(result);
      }
    });
  });
}

// 提取请求体内容
function extractRequestBody(requestBody: any): string | undefined {
  if (!requestBody) return undefined;
  
  try {
    // 处理表单数据
    if (requestBody.formData) {
      const formData = requestBody.formData;
      const params = new URLSearchParams();
      
      for (const [key, values] of Object.entries(formData)) {
        if (Array.isArray(values)) {
          values.forEach(value => params.append(key, value));
        } else {
          params.append(key, values as string);
        }
      }
      return params.toString();
    }
    
    // 处理原始数据
    if (requestBody.raw && requestBody.raw.length > 0) {
      const rawData = requestBody.raw[0];
      if (rawData.bytes) {
        // 尝试解码为文本
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(rawData.bytes);
      }
    }
    
    return undefined;
  } catch (error) {
    console.warn('Failed to extract request body:', error);
    return undefined;
  }
}

// 去重函数：移除重复请求，保留最新的
function removeDuplicates(newRequest: HttpRequest) {
  // 查找是否有相同的URL和方法的请求
  const existingIndex = interceptedRequests.findIndex(
    req => req.url === newRequest.url && req.method === newRequest.method
  );
  
  if (existingIndex !== -1) {
    // 移除旧的请求
    const removedRequest = interceptedRequests.splice(existingIndex, 1)[0];
    console.log('🔄 Removed duplicate request:', {
      url: newRequest.url,
      method: newRequest.method,
      oldIndex: existingIndex,
      removedId: removedRequest.id,
      newId: newRequest.id
    });
  }
  
  // 添加新请求到列表顶部
  interceptedRequests.unshift(newRequest);
  console.log('✅ Added new request to list:', {
    url: newRequest.url,
    method: newRequest.method,
    totalRequests: interceptedRequests.length
  });
}

// 超时处理机制
const PENDING_TIMEOUT = 30000; // 30秒超时
const pendingTimeouts = new Map<string, NodeJS.Timeout>();

// HackBar请求处理函数
async function handleHackBarRequest(data: any) {
  const { url, method, headers, body } = data;
  
  console.log('🚀 HackBar request received:', { url, method, headers, body });
  
  // 简单场景：GET 且无自定义头 → 直接跳转
  const hasCustomHeader = Object.keys(headers).some(k => 
    k.toLowerCase() !== 'user-agent' && 
    k.toLowerCase() !== 'accept' && 
    k.toLowerCase() !== 'accept-language' &&
    k.toLowerCase() !== 'accept-encoding' &&
    k.toLowerCase() !== 'connection' &&
    k.toLowerCase() !== 'upgrade-insecure-requests'
  );
  
  if (method === 'GET' && !hasCustomHeader && !body) {
    console.log('📤 Direct navigation for GET request');
    try {
      await chrome.tabs.update({ url });
      return;
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  }
  
  // 其余情况：构造临时标签页 + 表单提交
  console.log('📤 Creating form submission for complex request');
  
  const html = `
    <html>
    <head>
      <title>HackBar Request</title>
    </head>
    <body>
      <form id="hackbar-form" method="${method}" action="${url}">
        ${Object.entries(headers)
          .map(([k, v]) => `<input type="hidden" name="header_${k}" value="${String(v).replace(/"/g, '&quot;')}">`)
          .join('')}
        ${body ? `<input type="hidden" name="body" value="${String(body).replace(/"/g, '&quot;')}">` : ''}
      </form>
      <script>
        console.log('🚀 Submitting HackBar form...');
        document.getElementById('hackbar-form').submit();
      </script>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  
  try {
    const tab = await chrome.tabs.create({ url: blobUrl });
    console.log('✅ HackBar form created in tab:', tab.id);
    
    // 2秒后关闭临时标签（可选）
    setTimeout(() => {
      chrome.tabs.remove(tab.id!).catch(() => {
        console.log('Tab already closed or not found');
      });
    }, 2000);
  } catch (error) {
    console.error('Failed to create HackBar form:', error);
  }
}

// 监听来自devtools的消息
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  switch (message.type) {
    case 'CLEAR_REQUESTS':
      // 清除所有超时处理
      pendingTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingTimeouts.clear();
      interceptedRequests = [];
      break;
    case 'GET_REQUESTS':
      sendResponse({ requests: interceptedRequests });
      break;
    case 'SEND_REQUEST':
      // HackBar请求处理
      handleHackBarRequest(message.data);
      break;
    case 'REQUEST_CAPTURED':
      // 处理来自content script的请求
      if (message.data) {
        const request = message.data as HttpRequest;
        request.tabId = sender.tab?.id || null;
        
        // 简化去重逻辑，只使用webRequest
        const existingIndex = interceptedRequests.findIndex(
          req => req.url === request.url && 
                 req.method === request.method && 
                 Math.abs(req.timestamp - request.timestamp) < 2000 // 2秒内的请求认为是重复的
        );
        
        if (existingIndex === -1) {
          interceptedRequests.unshift(request);
          console.log('✅ New request captured:', {
            id: request.id,
            url: request.url,
            method: request.method,
            source: 'webRequest'
          });
          
          // 异步获取该域名的所有Cookie
          const domain = extractDomain(request.url);
          if (domain) {
            getAllCookiesForDomain(domain).then((cookies) => {
              const requestIndex = interceptedRequests.findIndex(req => req.id === request.id);
              if (requestIndex !== -1) {
                interceptedRequests[requestIndex].cookies = cookies;
                console.log('🍪 Cookies fetched for request:', {
                  url: request.url,
                  domain: domain,
                  cookieCount: cookies.length
                });
                
                // 通知所有devtools面板
                chrome.runtime.sendMessage({
                  type: 'REQUEST_CAPTURED',
                  data: interceptedRequests[requestIndex]
                }).catch(() => {});
              }
            }).catch((error) => {
              console.warn('Failed to get cookies:', error);
            });
          }
          
          // 通知所有devtools面板
          chrome.runtime.sendMessage({
            type: 'REQUEST_CAPTURED',
            data: request
          }).catch(() => {
            // 忽略无法发送消息的错误
          });
        } else {
          console.log('🔄 Duplicate request ignored:', {
            url: request.url,
            method: request.method,
            existingId: interceptedRequests[existingIndex].id,
            newId: request.id
          });
        }
      }
      break;
    case 'RESPONSE_CAPTURED':
      // 处理来自content script的响应
      if (message.data) {
        const responseData = message.data;
        console.log('Response captured from content script:', responseData);
        
        // 查找对应的请求并更新 - 改进匹配逻辑
        let requestIndex = interceptedRequests.findIndex(
          req => req.url === responseData.url && req.method === responseData.method
        );
        
        // 如果精确匹配失败，尝试URL匹配
        if (requestIndex === -1) {
          requestIndex = interceptedRequests.findIndex(
            req => req.url === responseData.url
          );
        }
        
        if (requestIndex !== -1) {
          const request = interceptedRequests[requestIndex];
          
          // 清除超时处理
          const timeoutId = pendingTimeouts.get(request.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pendingTimeouts.delete(request.id);
          }
          
          // 只有当状态更好时才更新（避免从200降级到pending）
          if (!request.status || request.status < responseData.status || responseData.status < 400) {
            request.status = responseData.status;
            request.responseHeaders = responseData.headers;
            request.responseBody = responseData.body;
            request.responseTime = Date.now() - request.timestamp;
            
            console.log('✅ Response processed and updated:', {
              url: responseData.url,
              status: responseData.status,
              responseTime: request.responseTime,
              previousStatus: request.status
            });
            
            // 通知devtools面板更新
            chrome.runtime.sendMessage({
              type: 'REQUEST_UPDATED',
              data: request
            }).catch(() => {
              // 忽略无法发送消息的错误
            });
          } else {
            console.log('🔄 Response update skipped (better status already exists):', {
              url: responseData.url,
              currentStatus: request.status,
              newStatus: responseData.status
            });
          }
        } else {
          console.warn('❌ Could not find matching request for response:', {
            url: responseData.url,
            method: responseData.method,
            availableRequests: interceptedRequests.map(req => ({
              url: req.url,
              method: req.method,
              id: req.id,
              status: req.status
            }))
          });
        }
      }
      break;
  }
});

// 拦截HTTP请求 (Manifest V3兼容)
console.log('🚀 Setting up webRequest listeners, isIntercepting:', isIntercepting);
console.log('🚀 Background script is running!');

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log('🔍 WebRequest triggered:', { 
      url: details.url, 
      method: details.method, 
      isIntercepting,
      requestId: details.requestId,
      tabId: details.tabId,
      type: details.type
    });
    
    if (!isIntercepting) {
      console.log('Intercepting is disabled, skipping request');
      return { cancel: false }; // 明确允许请求继续
    }

    // 跳过一些特殊请求，避免CORB问题
    if (details.url.startsWith('chrome-extension://') || 
        details.url.startsWith('moz-extension://') ||
        details.url.startsWith('edge-extension://') ||
        details.url.includes('devtools://') ||
        details.url.includes('ztbox') || // 跳过百度的ztbox请求，避免CORB问题
        details.url.includes('baidu.com/ztbox')) {
      console.log('Skipping special request:', details.url);
      return { cancel: false }; // 明确允许请求继续
    }

            // 检查是否已存在相同的请求（基于URL和方法，忽略时间戳）
            console.log('🔍 Checking for duplicates:', {
              url: details.url,
              method: details.method,
              totalRequests: interceptedRequests.length
            });
            
            // 创建新请求
            const request: HttpRequest = {
              id: `${details.requestId}-${Date.now()}`,
              url: details.url,
              method: details.method,
              headers: {}, // 将在onBeforeSendHeaders中填充
              body: extractRequestBody(details.requestBody),
              timestamp: Date.now(),
              tabId: details.tabId || null
            };

            // 使用去重函数处理请求
            removeDuplicates(request);
            
            // 异步获取该域名的所有Cookie
            const domain = extractDomain(details.url);
            if (domain) {
              getAllCookiesForDomain(domain).then((cookies) => {
                // 找到对应的请求并更新cookie信息
                const requestIndex = interceptedRequests.findIndex(req => req.id === request.id);
                if (requestIndex !== -1) {
                  interceptedRequests[requestIndex].cookies = cookies;
                  console.log('🍪 Cookies fetched for request:', {
                    url: details.url,
                    domain: domain,
                    cookieCount: cookies.length,
                    cookies: cookies
                  });
                  
                  // 通知devtools面板更新
                  chrome.runtime.sendMessage({
                    type: 'REQUEST_UPDATED',
                    data: interceptedRequests[requestIndex]
                  }).catch(() => {});
                }
              }).catch((error) => {
                console.warn('Failed to get cookies:', error);
              });
            }
            
            console.log('✅ Request processed via webRequest:', {
              id: request.id,
              url: request.url,
              method: request.method,
              timestamp: request.timestamp,
              body: request.body,
              bodyLength: request.body ? request.body.length : 0,
              totalRequests: interceptedRequests.length
            });
            
            // 为所有请求设置超时处理
            const latestRequest = interceptedRequests[0]; // 获取最新添加的请求
            const timeoutId = setTimeout(() => {
              const requestIndex = interceptedRequests.findIndex(req => req.id === latestRequest.id);
              if (requestIndex !== -1 && !interceptedRequests[requestIndex].status) {
                console.warn('⏰ Request timeout, marking as failed:', {
                  id: latestRequest.id,
                  url: latestRequest.url,
                  method: latestRequest.method
                });
                
                interceptedRequests[requestIndex].status = 408; // Request Timeout
                interceptedRequests[requestIndex].responseTime = PENDING_TIMEOUT;
                
                // 通知devtools面板更新
                chrome.runtime.sendMessage({
                  type: 'REQUEST_UPDATED',
                  data: interceptedRequests[requestIndex]
                }).catch(() => {});
              }
              pendingTimeouts.delete(latestRequest.id);
            }, PENDING_TIMEOUT);
            
            pendingTimeouts.set(latestRequest.id, timeoutId);
            
            // 通知devtools面板 - 直接发送更新消息
            chrome.runtime.sendMessage({
              type: 'REQUEST_UPDATED',
              data: latestRequest
            }).catch((error) => {
              console.log('Failed to send message to devtools:', error);
            });
            
            // 明确允许请求继续
            return { cancel: false };
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// 拦截HTTP请求头
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!isIntercepting) return;

    // 跳过一些特殊请求，避免CORB问题
    if (details.url.startsWith('chrome-extension://') || 
        details.url.startsWith('moz-extension://') ||
        details.url.startsWith('edge-extension://') ||
        details.url.includes('devtools://') ||
        details.url.includes('ztbox') || // 跳过百度的ztbox请求，避免CORB问题
        details.url.includes('baidu.com/ztbox')) {
      return;
    }

    // 查找对应的请求并更新headers
    const requestIndex = interceptedRequests.findIndex(
      req => req.id.includes(details.requestId)
    );
    
    if (requestIndex !== -1) {
      const headers: Record<string, string> = {};
      
      // 处理请求头
      if (details.requestHeaders) {
        details.requestHeaders.forEach(header => {
          if (header.name && header.value) {
            headers[header.name] = header.value;
          }
        });
      }
      
      interceptedRequests[requestIndex].headers = headers;
      
      console.log('📋 Request headers captured:', {
        url: details.url,
        method: details.method,
        headersCount: Object.keys(headers).length,
        hasCookie: !!headers['Cookie'] || !!headers['cookie'],
        cookieValue: headers['Cookie'] || headers['cookie'] || 'No cookie',
        headers: headers
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

// 拦截HTTP响应头
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!isIntercepting) return;

    // 跳过一些特殊请求，避免CORB问题
    if (details.url.startsWith('chrome-extension://') || 
        details.url.startsWith('moz-extension://') ||
        details.url.startsWith('edge-extension://') ||
        details.url.includes('devtools://') ||
        details.url.includes('ztbox') || // 跳过百度的ztbox请求，避免CORB问题
        details.url.includes('baidu.com/ztbox')) {
      return;
    }

    // 更新请求的响应头 - 改进匹配逻辑
    let requestIndex = interceptedRequests.findIndex(
      req => req.id.includes(details.requestId)
    );
    
    // 如果直接匹配失败，尝试URL匹配作为备用方案
    if (requestIndex === -1) {
      requestIndex = interceptedRequests.findIndex(
        req => req.url === details.url && req.method === details.method
      );
    }
    
    if (requestIndex !== -1) {
      const responseHeaders: Record<string, string> = {};
      details.responseHeaders?.forEach(header => {
        if (header.name && header.value) {
          // 确保CORS响应头值有效
          try {
            // 验证header值是否包含有效字符
            if (header.value && typeof header.value === 'string' && header.value.trim()) {
              responseHeaders[header.name] = header.value;
            }
          } catch (error) {
            console.warn('Invalid header value:', header.name, header.value);
          }
        }
      });
      interceptedRequests[requestIndex].responseHeaders = responseHeaders;
      console.log('Response headers captured:', responseHeaders);
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// 拦截HTTP响应完成
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isIntercepting) return;

    // 跳过一些特殊请求，避免CORB问题
    if (details.url.startsWith('chrome-extension://') || 
        details.url.startsWith('moz-extension://') ||
        details.url.startsWith('edge-extension://') ||
        details.url.includes('devtools://') ||
        details.url.includes('ztbox') || // 跳过百度的ztbox请求，避免CORB问题
        details.url.includes('baidu.com/ztbox')) {
      return;
    }

    // 更新请求状态 - 改进匹配逻辑
    let requestIndex = interceptedRequests.findIndex(
      req => req.id.includes(details.requestId)
    );
    
    // 如果直接匹配失败，尝试URL匹配作为备用方案
    if (requestIndex === -1) {
      requestIndex = interceptedRequests.findIndex(
        req => req.url === details.url && req.method === details.method
      );
    }
    
    console.log('Looking for request completion:', {
      requestId: details.requestId,
      url: details.url,
      statusCode: details.statusCode,
      totalRequests: interceptedRequests.length,
      foundIndex: requestIndex
    });
    
    if (requestIndex !== -1) {
      const request = interceptedRequests[requestIndex];
      
      // 清除超时处理
      const timeoutId = pendingTimeouts.get(request.id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        pendingTimeouts.delete(request.id);
      }
      
      // 只有当状态更好时才更新（避免从200降级到pending）
      if (!request.status || request.status < details.statusCode || details.statusCode < 400) {
        request.status = details.statusCode;
        // 修复时间戳计算
        const responseTime = details.timeStamp ? 
          Math.round(details.timeStamp - request.timestamp) : 
          Date.now() - request.timestamp;
        request.responseTime = responseTime;
        
        console.log('✅ Request completed and updated:', {
          url: details.url,
          status: details.statusCode,
          responseTime: responseTime,
          requestId: details.requestId,
          previousStatus: request.status,
          note: 'Response body not available via webRequest API'
        });
      } else {
        console.log('🔄 Request completion update skipped (better status already exists):', {
          url: details.url,
          currentStatus: request.status,
          newStatus: details.statusCode,
          requestId: details.requestId
        });
      }
      
      // 通知devtools面板更新
      chrome.runtime.sendMessage({
        type: 'REQUEST_UPDATED',
        data: request
      }).catch((error) => {
        console.warn('Failed to send request update:', error);
      });
    } else {
      console.warn('❌ Could not find matching request for completion:', {
        requestId: details.requestId,
        url: details.url,
        availableIds: interceptedRequests.map(req => req.id)
      });
    }
  },
  { urls: ['<all_urls>'] }
);

// 开发者工具连接时发送现有请求
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'devtools') {
    try {
      port.postMessage({
        type: 'REQUESTS_LOADED',
        data: { requests: interceptedRequests }
      });
    } catch (error) {
      console.warn('Failed to send requests to devtools:', error);
    }
  }
});

// 添加错误处理
chrome.runtime.onStartup.addListener(() => {
  console.log('HackDuck extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('HackDuck extension installed');
});
