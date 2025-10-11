// 注入到页面的脚本，用于拦截fetch和XMLHttpRequest

console.log('HackDuck injected script loaded');

// 拦截fetch请求
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [resource, config] = args;
  
  console.log('HackDuck: Intercepting fetch request', resource);
  
  // 发送请求信息到content script
  const requestInfo = {
    url: typeof resource === 'string' ? resource : (resource as Request).url,
    method: config?.method || 'GET',
    headers: config?.headers || {},
    body: config?.body
  };
  
  console.log('HackDuck: Sending request info', requestInfo);
  
  // 通知扩展
  window.postMessage({
    type: 'HACKDUCK_REQUEST',
    data: requestInfo
  }, '*');
  
  // 拦截响应
  return originalFetch.apply(this, args).then(response => {
    // 克隆响应以便读取内容
    const clonedResponse = response.clone();
    
    // 读取响应体
    clonedResponse.text().then(responseBody => {
      // 获取响应头
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // 发送响应信息
      window.postMessage({
        type: 'HACKDUCK_RESPONSE',
        data: {
          url: requestInfo.url,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody
        }
      }, '*');
    }).catch(error => {
      console.log('HackDuck: Error reading response body', error);
    });
    
    return response;
  });
};

// 扩展XMLHttpRequest类型
interface ExtendedXMLHttpRequest extends XMLHttpRequest {
  _hackduckMethod?: string;
  _hackduckUrl?: string;
}

// 拦截XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
  (this as ExtendedXMLHttpRequest)._hackduckMethod = method;
  (this as ExtendedXMLHttpRequest)._hackduckUrl = url.toString();
  return originalXHROpen.call(this, method, url, async, username, password);
};

XMLHttpRequest.prototype.send = function(data) {
  const extendedThis = this as ExtendedXMLHttpRequest;
  
  // 获取请求头信息
  const headers: Record<string, string> = {};
  
  // 尝试获取所有请求头
  if (this.getAllRequestHeaders) {
    const allHeaders = this.getAllRequestHeaders();
    if (allHeaders) {
      allHeaders.split('\r\n').forEach(header => {
        const [key, value] = header.split(': ');
        if (key && value) {
          headers[key] = value;
        }
      });
    }
  }
  
  // 发送请求信息
  window.postMessage({
    type: 'HACKDUCK_REQUEST',
    data: {
      url: extendedThis._hackduckUrl,
      method: extendedThis._hackduckMethod,
      headers: headers,
      body: data
    }
  }, '*');
  
  return originalXHRSend.apply(this, [data]);
};

console.log('HackDuck injected script loaded');
