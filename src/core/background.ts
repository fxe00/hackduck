import type { HttpRequest, Message } from '../types';

// 立即输出测试日志
console.log('🚀 Background script starting...');

// Firefox 兼容性：统一的消息发送函数
function sendRuntimeMessage(message: any): void {
  // @ts-ignore - browser API 在 Firefox 中可用
  const browserAPI = typeof browser !== 'undefined' ? browser : null;
  const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
  
  // Firefox 优先：检查 browser API
  // @ts-ignore - browser API 在 Firefox 中可用
  if (browserAPI && browserAPI.runtime && browserAPI.runtime.sendMessage) {
    // Firefox: Promise-based
    try {
      // @ts-ignore - browser API 在 Firefox 中可用
      browser.runtime.sendMessage(message).catch((error: any) => {
        // 忽略连接错误（DevTools 可能未打开）
        if (error && error.message && !error.message.includes('Receiving end does not exist')) {
          console.warn('Failed to send message:', error);
        }
      });
    } catch (error: any) {
      // 如果 sendMessage 返回 undefined（某些 Firefox 版本）
      console.warn('Failed to send message (Firefox):', error);
    }
  } else if (chromeAPI && chromeAPI.runtime && chromeAPI.runtime.sendMessage) {
    // Chrome: Callback-based
    try {
      chrome.runtime.sendMessage(message, () => {
        // 忽略连接错误
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || '';
          if (!errorMsg.includes('Receiving end does not exist')) {
            console.warn('Failed to send message:', chrome.runtime.lastError);
          }
        }
      });
    } catch (error: any) {
      console.warn('Failed to send message (Chrome):', error);
    }
  } else {
    console.warn('⚠️ Runtime API not available');
  }
}

// 存储拦截的请求
let interceptedRequests: HttpRequest[] = [];
let isIntercepting = true; // 默认开启拦截

// 跟踪当前 DevTools 窗口的面板创建状态
// 使用时间戳来跟踪，每次 DevTools 打开时会重置（通过检查时间间隔）
let lastPanelCreationTime = 0;
const PANEL_CREATION_WINDOW = 5000; // 5秒内的重复创建请求会被阻止

// 跟踪 DevTools 面板是否已创建（Firefox 兼容性）
let devtoolsPanelCreated = false;

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
async function getAllCookiesForDomain(domain: string): Promise<any[]> {
  return new Promise((resolve) => {
    // Firefox 兼容性：检测并使用正确的 cookies API
    // @ts-ignore - browser API 在 Firefox 中可用
    const browserAPI = typeof browser !== 'undefined' ? browser : null;
    const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
    const cookiesAPI = browserAPI?.cookies || chromeAPI?.cookies;
    
    if (!cookiesAPI) {
      console.warn('Cookies API not available');
      resolve([]);
      return;
    }

    // 首先尝试获取精确域名的cookie
    const getAllCookies = (domainToQuery: string): Promise<any[]> => {
      if (browserAPI?.cookies) {
        // Firefox: Promise-based
        // @ts-ignore - browser API 在 Firefox 中可用
        return browser.cookies.getAll({ domain: domainToQuery });
      } else {
        // Chrome: Callback-based
        return new Promise((resolve) => {
          chrome.cookies.getAll({ domain: domainToQuery }, (cookies) => {
            if (chrome.runtime.lastError) {
              console.warn('Failed to get cookies:', chrome.runtime.lastError.message);
              resolve([]);
            } else {
              resolve(cookies || []);
            }
          });
        });
      }
    };

    getAllCookies(domain).then((cookies) => {
      const result = cookies || [];
      
      // 如果是子域名（如 www.example.com），也尝试获取父域名的cookie（如 .example.com）
      const parts = domain.split('.');
      if (parts.length > 2) {
        // 尝试获取父域名的cookie（带点前缀，如 .example.com）
        const parentDomain = '.' + parts.slice(-2).join('.');
        getAllCookies(parentDomain).then((parentCookies) => {
          if (parentCookies && parentCookies.length > 0) {
            // 合并结果，去重（基于name和domain）
            const existing = new Set(result.map((c: any) => `${c.name}@${c.domain}`));
            parentCookies.forEach((cookie: any) => {
              const key = `${cookie.name}@${cookie.domain}`;
              if (!existing.has(key)) {
                result.push(cookie);
                existing.add(key);
              }
            });
          }
          resolve(result);
        }).catch(() => {
          resolve(result);
        });
      } else {
        resolve(result);
      }
    }).catch((error) => {
      console.warn('Failed to get cookies:', error);
      resolve([]);
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
  
  // 获取当前活动标签页
  let currentTab: chrome.tabs.Tab | null = null;
  try {
    // @ts-ignore - browser API 在 Firefox 中可用
    const browserAPI = typeof browser !== 'undefined' ? (browser as any) : null;
    const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
    
    if (browserAPI?.tabs) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0] || null;
    } else if (chromeAPI?.tabs) {
      // Chrome: Callback-based
      currentTab = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs[0] || null);
        });
      }) as chrome.tabs.Tab | null;
    }
  } catch (error) {
    console.error('Failed to get current tab:', error);
  }
  
  // 对于 GET 请求，直接在当前标签页导航（即使有自定义 headers）
  if (method === 'GET' && !body) {
    console.log('📤 Direct navigation for GET request');
    try {
      // @ts-ignore - browser API 在 Firefox 中可用
      const browserAPI = typeof browser !== 'undefined' ? browser : null;
      const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
      
      if (currentTab && currentTab.id) {
        if (browserAPI?.tabs) {
          // Firefox: Promise-based
          // @ts-ignore - browser API 在 Firefox 中可用
          await browserAPI.tabs.update(currentTab.id, { url });
        } else if (chromeAPI?.tabs) {
          // Chrome: Callback-based
          await new Promise((resolve, reject) => {
            chrome.tabs.update(currentTab!.id!, { url }, (tab) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(tab);
              }
            });
          });
        }
        return;
      } else {
        // 如果没有当前标签页，创建新标签页
        if (browserAPI?.tabs) {
          // @ts-ignore - browser API 在 Firefox 中可用
          await browserAPI.tabs.create({ url });
        } else if (chromeAPI?.tabs) {
          await chrome.tabs.create({ url });
        }
        return;
      }
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  }
  
  // POST/PUT/DELETE 等需要 body 的请求：在当前标签页中注入脚本提交表单
  console.log('📤 Creating form submission for complex request');
  
  if (currentTab && currentTab.id) {
    // 在当前标签页中注入脚本提交表单
    const scriptCode = `
      (function() {
        const form = document.createElement('form');
        form.method = '${method}';
        form.action = ${JSON.stringify(url)};
        
        ${Object.entries(headers)
          .filter(([k]) => k.toLowerCase() !== 'cookie') // Cookie 无法通过表单提交
          .map(([k, v]) => {
            const safeKey = k.replace(/[^a-zA-Z0-9]/g, '_');
            return `const input_${safeKey} = document.createElement('input');
            input_${safeKey}.type = 'hidden';
            input_${safeKey}.name = ${JSON.stringify(k)};
            input_${safeKey}.value = ${JSON.stringify(String(v))};
            form.appendChild(input_${safeKey});`;
          })
          .join('\n')}
        
        ${body ? `const bodyInput = document.createElement('input');
        bodyInput.type = 'hidden';
        bodyInput.name = 'body';
        bodyInput.value = ${JSON.stringify(String(body))};
        form.appendChild(bodyInput);` : ''}
        
        document.body.appendChild(form);
        
        // 如果有自定义 headers（如 Cookie），使用 fetch API
        const customHeaders = ${JSON.stringify(headers)};
        const hasCustomHeaders = customHeaders.Cookie || customHeaders.cookie || Object.keys(customHeaders).some(k => 
          k.toLowerCase() !== 'user-agent' && 
          k.toLowerCase() !== 'accept' && 
          k.toLowerCase() !== 'accept-language' &&
          k.toLowerCase() !== 'accept-encoding' &&
          k.toLowerCase() !== 'connection' &&
          k.toLowerCase() !== 'upgrade-insecure-requests'
        );
        
        if (hasCustomHeaders) {
          // 使用 fetch API 发送请求
          fetch(${JSON.stringify(url)}, {
            method: '${method}',
            headers: customHeaders,
            ${body ? `body: ${JSON.stringify(String(body))},` : ''}
            credentials: 'include'
          }).then(response => {
            // 如果响应是 HTML，替换当前页面
            if (response.headers.get('content-type')?.includes('text/html')) {
              return response.text().then(html => {
                document.open();
                document.write(html);
                document.close();
              });
            } else {
              // 其他类型响应，跳转到响应 URL
              window.location.href = ${JSON.stringify(url)};
            }
          }).catch(error => {
            console.error('Fetch error:', error);
            // 如果 fetch 失败，回退到表单提交
            form.submit();
          });
        } else {
          // 没有自定义 headers，直接提交表单
          form.submit();
        }
      })();
    `;
    
    try {
      // @ts-ignore - browser API 在 Firefox 中可用
      const browserAPI = typeof browser !== 'undefined' ? browser : null;
      const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
      
      if (browserAPI?.tabs) {
        // Firefox: Promise-based
        // @ts-ignore - browser API 在 Firefox 中可用
        await browserAPI.tabs.executeScript(currentTab.id, {
          code: scriptCode
        });
      } else if (chromeAPI?.tabs) {
        // Chrome: Callback-based
        await new Promise((resolve, reject) => {
          chrome.tabs.executeScript(currentTab!.id!, {
            code: scriptCode
          }, (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(results);
            }
          });
        });
      }
      console.log('✅ HackBar form script injected in current tab');
      return;
    } catch (error) {
      console.error('Failed to inject script:', error);
      // 如果注入失败，回退到创建新标签页的方式
    }
  }
  
  // 回退方案：构造临时标签页 + 表单提交（仅当无法在当前标签页操作时）
  console.log('📤 Fallback: Creating form submission in new tab');
  
  const html = `
    <html>
    <head>
      <title>HackBar Request</title>
    </head>
    <body>
      <form id="hackbar-form" method="${method}" action="${url}">
        ${Object.entries(headers)
          .filter(([k]) => k.toLowerCase() !== 'cookie') // Cookie 无法通过表单提交
          .map(([k, v]) => `<input type="hidden" name="header_${k}" value="${String(v).replace(/"/g, '&quot;')}">`)
          .join('')}
        ${body ? `<input type="hidden" name="body" value="${String(body).replace(/"/g, '&quot;')}">` : ''}
      </form>
      <script>
        console.log('🚀 Submitting HackBar form...');
        const form = document.getElementById('hackbar-form');
        const headers = ${JSON.stringify(headers)};
        
        // 如果有 Cookie header，使用 fetch API
        if (headers.Cookie || headers.cookie) {
          fetch('${url}', {
            method: '${method}',
            headers: headers,
            ${body ? `body: ${JSON.stringify(String(body))},` : ''}
            credentials: 'include'
          }).then(response => {
            if (response.headers.get('content-type')?.includes('text/html')) {
              return response.text().then(html => {
                document.open();
                document.write(html);
                document.close();
              });
            } else {
              window.location.href = '${url}';
            }
          }).catch(() => {
            form.submit();
          });
        } else {
          form.submit();
        }
      </script>
    </body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  
  try {
    if (browserAPI?.tabs) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      const tab = await browserAPI.tabs.create({ url: blobUrl });
      console.log('✅ HackBar form created in tab:', tab.id);
      
      // 2秒后关闭临时标签（可选）
      setTimeout(() => {
        if (tab.id && browserAPI?.tabs) {
          (browserAPI.tabs as any).remove(tab.id).catch(() => {
            console.log('Tab already closed or not found');
          });
        }
      }, 2000);
    } else if (chromeAPI?.tabs) {
      // Chrome: Callback-based
      const tab = await chrome.tabs.create({ url: blobUrl });
      console.log('✅ HackBar form created in tab:', tab.id);
      
      // 2秒后关闭临时标签（可选）
      setTimeout(() => {
        chrome.tabs.remove(tab.id!).catch(() => {
          console.log('Tab already closed or not found');
        });
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to create HackBar form:', error);
  }
}

// 监听来自devtools的消息
// Firefox 兼容性：使用统一的 runtime API
// @ts-ignore - browser API 在 Firefox 中可用
const browserAPI = typeof browser !== 'undefined' ? browser : null;
const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
const runtimeAPI = browserAPI?.runtime || chromeAPI?.runtime;

if (runtimeAPI && runtimeAPI.onMessage) {
  runtimeAPI.onMessage.addListener((message: Message, sender: any, sendResponse: any) => {
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
    case 'GET_CURRENT_TAB':
      // 获取当前活动标签页信息（Firefox DevTools 兼容性）
      // @ts-ignore - browser API 在 Firefox 中可用
      const browserAPI = typeof browser !== 'undefined' ? browser : null;
      const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
      const tabsAPI = browserAPI?.tabs || chromeAPI?.tabs;
      
      if (tabsAPI) {
        if (browserAPI?.tabs) {
          // Firefox: Promise-based
          // @ts-ignore - browser API 在 Firefox 中可用
          browser.tabs.query({ active: true, currentWindow: true }).then((tabs: any[]) => {
            if (tabs && tabs.length > 0) {
              sendResponse({ success: true, tab: tabs[0] });
            } else {
              sendResponse({ success: false, error: 'No active tab found' });
            }
          }).catch((error: any) => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // 保持消息通道开放（异步响应）
        } else {
          // Chrome: Callback-based
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else if (tabs && tabs.length > 0) {
              sendResponse({ success: true, tab: tabs[0] });
            } else {
              sendResponse({ success: false, error: 'No active tab found' });
            }
          });
          return true; // 保持消息通道开放（异步响应）
        }
      } else {
        sendResponse({ success: false, error: 'Tabs API not available' });
      }
      break;
    case 'CHECK_AND_MARK_PANEL_CREATION':
      // 检查是否应该创建面板（防止短时间内重复创建）
      const now = Date.now();
      const timeSinceLastCreate = now - lastPanelCreationTime;
      
      if (timeSinceLastCreate < PANEL_CREATION_WINDOW) {
        // 5秒内已创建过，阻止创建
        sendResponse({ shouldCreate: false });
      } else {
        // 允许创建，记录时间
        lastPanelCreationTime = now;
        sendResponse({ shouldCreate: true });
      }
      break;
    case 'PANEL_CREATED_SUCCESS':
      // 面板创建成功，确认时间戳
      lastPanelCreationTime = Date.now();
      sendResponse({ success: true });
      break;
    case 'PANEL_CREATION_FAILED':
      // 面板创建失败（可能已存在），清除时间戳以便重试
      lastPanelCreationTime = 0;
      sendResponse({ success: true });
      break;
    case 'GET_COOKIES_FOR_DOMAIN':
      // 获取指定域名的所有Cookie（Firefox DevTools 兼容性）
      const domain = message.data?.domain;
      if (!domain) {
        sendResponse({ success: false, error: 'Domain is required' });
        break;
      }
      
      getAllCookiesForDomain(domain).then((cookies) => {
        sendResponse({ success: true, cookies: cookies });
      }).catch((error: any) => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // 保持消息通道开放（异步响应）
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
                sendRuntimeMessage({
                  type: 'REQUEST_CAPTURED',
                  data: interceptedRequests[requestIndex]
                });
              }
            }).catch((error) => {
              console.warn('Failed to get cookies:', error);
            });
          }
          
          // 通知所有devtools面板
          sendRuntimeMessage({
            type: 'REQUEST_CAPTURED',
            data: request
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
            sendRuntimeMessage({
              type: 'REQUEST_UPDATED',
              data: request
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
  
  // 对于异步响应，返回 true 以保持消息通道开放
  return true;
});
} else {
  console.warn('⚠️ Runtime API not available for message listener');
}

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

    // 检测WebSocket请求
    const isWebSocket = details.type === 'websocket' || 
                        details.url.startsWith('ws://') || 
                        details.url.startsWith('wss://');
    
    // 确定请求方法
    let requestMethod = details.method;
    if (isWebSocket) {
      // WebSocket请求在握手时使用GET方法，但我们标记为WEBSOCKET以便识别
      requestMethod = 'WEBSOCKET';
      console.log('🔌 WebSocket request detected:', details.url);
    }

            // 检查是否已存在相同的请求（基于URL和方法，忽略时间戳）
            console.log('🔍 Checking for duplicates:', {
              url: details.url,
              method: requestMethod,
              type: details.type,
              isWebSocket: isWebSocket,
              totalRequests: interceptedRequests.length
            });
            
            // 创建新请求
            const request: HttpRequest = {
              id: `${details.requestId}-${Date.now()}`,
              url: details.url,
              method: requestMethod,
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
                  sendRuntimeMessage({
                    type: 'REQUEST_UPDATED',
                    data: interceptedRequests[requestIndex]
                  });
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
                sendRuntimeMessage({
                  type: 'REQUEST_UPDATED',
                  data: interceptedRequests[requestIndex]
                });
              }
              pendingTimeouts.delete(latestRequest.id);
            }, PENDING_TIMEOUT);
            
            pendingTimeouts.set(latestRequest.id, timeoutId);
            
            // 通知devtools面板 - 直接发送更新消息
            sendRuntimeMessage({
              type: 'REQUEST_UPDATED',
              data: latestRequest
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

    // WebSocket请求也需要捕获请求头
    const isWebSocket = details.type === 'websocket' || 
                        details.url.startsWith('ws://') || 
                        details.url.startsWith('wss://');

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

    // 检测WebSocket请求
    const isWebSocket = details.type === 'websocket' || 
                        details.url.startsWith('ws://') || 
                        details.url.startsWith('wss://');
    
    // 更新请求的响应头 - 改进匹配逻辑
    let requestIndex = interceptedRequests.findIndex(
      req => req.id.includes(details.requestId)
    );
    
    // 如果直接匹配失败，尝试URL匹配作为备用方案
    if (requestIndex === -1) {
      // 对于WebSocket请求，method可能是GET但我们在创建时标记为WEBSOCKET
      if (isWebSocket) {
        requestIndex = interceptedRequests.findIndex(
          req => req.url === details.url && (req.method === 'WEBSOCKET' || req.method === details.method)
        );
      } else {
        requestIndex = interceptedRequests.findIndex(
          req => req.url === details.url && req.method === details.method
        );
      }
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
      sendRuntimeMessage({
        type: 'REQUEST_UPDATED',
        data: request
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
