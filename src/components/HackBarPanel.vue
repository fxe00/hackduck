<template>
  <div class="hackbar-panel" :style="{ height: panelHeight + 'px' }">
    <!-- Load 操作区域 -->
    <div class="load-section">
      <h4>当前页面请求操作</h4>
      <div class="load-buttons">
        <a-button @click="loadCurrentRequest" :icon="h(DownloadOutlined)" type="primary">
          Load Current Page
        </a-button>
        <a-button 
          @click="sendRequest" 
          :icon="h(SendOutlined)"
          :loading="isSendingRequest"
          :disabled="isSendingRequest || !editableRequest"
          type="primary"
        >
          {{ isSendingRequest ? '发送中...' : 'Send Request' }}
        </a-button>
      </div>
    </div>

    <!-- 请求编辑器 -->
    <div class="request-editor">
      <h4>请求编辑器</h4>
      <a-form :model="editableRequest" layout="vertical" v-if="editableRequest">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="方法">
              <a-select v-model:value="editableRequest.method" style="width: 100%">
                <a-select-option value="GET">GET</a-select-option>
                <a-select-option value="POST">POST</a-select-option>
                <a-select-option value="PUT">PUT</a-select-option>
                <a-select-option value="DELETE">DELETE</a-select-option>
                <a-select-option value="PATCH">PATCH</a-select-option>
                <a-select-option value="HEAD">HEAD</a-select-option>
                <a-select-option value="OPTIONS">OPTIONS</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="18">
            <a-form-item label="URL">
              <a-input 
                v-model:value="editableRequest.url" 
                placeholder="https://example.com/api/endpoint"
                @contextmenu="handleRightClick"
                @keydown="handleKeyDown"
                ref="urlInputRef"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- Headers 编辑 -->
        <a-form-item label="请求头">
          <a-collapse v-model:activeKey="activeHeaders" size="small">
            <a-collapse-panel key="headers" header="Headers (点击展开)">
              <div class="headers-editor">
                <div
                  v-for="(key, index) in headerKeys"
                  :key="index"
                  class="header-row"
                >
                  <a-input
                    v-model:value="headerKeys[index]"
                    placeholder="Header名称"
                    style="width: 40%"
                    size="small"
                  />
                  <a-input
                    v-model:value="headerValues[index]"
                    placeholder="Header值"
                    style="width: 60%"
                    size="small"
                  />
                  <a-button
                    type="text"
                    danger
                    size="small"
                    :icon="h(DeleteOutlined)"
                    @click="removeHeader(index)"
                  />
                </div>
                <a-button @click="addHeader" :icon="h(PlusOutlined)" size="small">添加Header</a-button>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-form-item>
        
        <!-- Body 编辑 -->
        <a-form-item label="请求体">
          <a-textarea
            v-model:value="editableRequest.body"
            :style="{ height: Math.max(100, Math.min(300, panelHeight - 350)) + 'px' }"
            placeholder="请求体内容 (JSON, XML, 表单数据等)"
            @contextmenu="handleRightClick"
            @keydown="handleKeyDown"
            ref="bodyTextareaRef"
          />
        </a-form-item>
      </a-form>
      
      <div v-else class="no-request">
        <a-empty description="请先加载一个请求" />
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :selected-text="selectedText"
      :target-element="targetElement"
      @close="contextMenuVisible = false"
      @add-to-history="addToHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, h, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  DownloadOutlined,
  SendOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';
import type { HttpRequest } from '../types';
import ContextMenu from './ContextMenu.vue';

// 响应式数据
const editableRequest = ref<HttpRequest | null>(null);
const headerKeys = ref<string[]>([]);
const headerValues = ref<string[]>([]);
const isSendingRequest = ref(false);
const activeHeaders = ref<string[]>([]);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedText = ref('');
const targetElement = ref<HTMLElement | null>(null);
const urlInputRef = ref<HTMLInputElement>();
const bodyTextareaRef = ref<HTMLTextAreaElement>();

// 历史记录相关
const history = ref<Array<{ type: string; originalText: string; newText: string; timestamp: number }>>([]);
const historyIndex = ref(-1);
const maxHistorySize = 50;

// 动态高度相关
const panelHeight = ref(500);

// 计算动态高度
const calculatePanelHeight = () => {
  const windowHeight = window.innerHeight;
  // 为HackBar模式优化高度计算，确保请求体输入框完全可见
  const availableHeight = windowHeight - 100; // 和请求列表保持一致
  const minHeight = 200; // 降低最小高度，确保在小屏幕上也能显示
  const maxHeight = windowHeight - 50;
  
  // 确保有足够空间显示所有内容
  const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
  
  // 如果计算出的高度太小，增加一些额外空间
  if (calculatedHeight < 300) {
    panelHeight.value = Math.max(250, calculatedHeight);
  } else {
    panelHeight.value = calculatedHeight;
  }
  
  console.log('📏 Calculated HackBar panel height:', panelHeight.value, 'Window height:', windowHeight);
};

// 窗口大小变化监听
const handleWindowResize = () => {
  calculatePanelHeight();
};

// 将cookies数组转换为Cookie header字符串
const formatCookiesToString = (cookies: chrome.cookies.Cookie[]): string => {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
};

// 获取指定域名的所有Cookie
const getAllCookiesForDomain = (domain: string): Promise<chrome.cookies.Cookie[]> => {
  return new Promise((resolve) => {
    if (!chrome.cookies) {
      console.warn('chrome.cookies API not available');
      resolve([]);
      return;
    }

    chrome.cookies.getAll({ domain }, (cookies) => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to get cookies:', chrome.runtime.lastError.message);
        resolve([]);
        return;
      }
      resolve(cookies || []);
    });
  });
};

// 方法
const loadCurrentRequest = async () => {
  try {
    // 获取当前页面的URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) {
      message.error('无法获取当前标签页');
      return;
    }
    
    // 创建基于当前URL的请求
    const currentUrl = new URL(tab.url);
    const domain = currentUrl.hostname;
    
    // 获取该域名的所有Cookie
    const cookies = await getAllCookiesForDomain(domain);
    console.log('🍪 Loaded cookies for domain:', domain, cookies);
    
    // 构建headers，如果有cookies则添加Cookie header
    const headers: Record<string, string> = {
      'User-Agent': navigator.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // 如果有cookies，添加到headers中
    if (cookies && cookies.length > 0) {
      headers['Cookie'] = formatCookiesToString(cookies);
      console.log('🍪 Added Cookie header:', headers['Cookie']);
    }
    
    editableRequest.value = {
      id: `current-${Date.now()}`,
      url: tab.url,
      method: 'GET',
      headers: headers,
      body: '',
      timestamp: Date.now(),
      tabId: tab.id,
      cookies: cookies // 保存完整的cookie信息
    };
    
    updateHeaders();
    message.success('当前页面URL已加载' + (cookies.length > 0 ? ` (包含 ${cookies.length} 个Cookie)` : ''));
  } catch (error) {
    message.error('加载当前页面失败');
    console.error('Load current page error:', error);
  }
};

// 右键菜单处理
const handleRightClick = (event: MouseEvent) => {
  const target = event.target as HTMLTextAreaElement | HTMLInputElement;
  const selection = target.value.substring(target.selectionStart || 0, target.selectionEnd || 0);
  
  if (selection) {
    event.preventDefault();
    contextMenuVisible.value = true;
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    selectedText.value = selection;
    targetElement.value = target;
  }
};

// 历史记录处理
const addToHistory = (operation: { type: string; originalText: string; newText: string; timestamp: number }) => {
  // 如果当前不在历史记录的末尾，删除后面的记录
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  
  // 添加新记录
  history.value.push(operation);
  historyIndex.value = history.value.length - 1;
  
  // 限制历史记录大小
  if (history.value.length > maxHistorySize) {
    history.value.shift();
    historyIndex.value--;
  }
  
  console.log('📝 Added to history:', operation.type);
};

// 撤销操作
const undo = () => {
  if (historyIndex.value >= 0 && targetElement.value) {
    const operation = history.value[historyIndex.value];
    const target = targetElement.value as HTMLTextAreaElement | HTMLInputElement;
    
    // 找到并替换对应的文本
    const currentValue = target.value;
    const newValue = currentValue.replace(operation.newText, operation.originalText);
    target.value = newValue;
    
    // 触发input事件以更新Vue的v-model
    target.dispatchEvent(new Event('input', { bubbles: true }));
    
    historyIndex.value--;
    message.success(`已撤销: ${operation.type}`);
    console.log('↩️ Undo:', operation.type);
  } else {
    message.warning('没有可撤销的操作');
  }
};

// 重做操作
const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const operation = history.value[historyIndex.value];
    const target = targetElement.value as HTMLTextAreaElement | HTMLInputElement;
    
    if (target) {
      // 找到并替换对应的文本
      const currentValue = target.value;
      const newValue = currentValue.replace(operation.originalText, operation.newText);
      target.value = newValue;
      
      // 触发input事件以更新Vue的v-model
      target.dispatchEvent(new Event('input', { bubbles: true }));
      
      message.success(`已重做: ${operation.type}`);
      console.log('↪️ Redo:', operation.type);
    }
  } else {
    message.warning('没有可重做的操作');
  }
};

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault();
    redo();
  }
};

const updateHeaders = () => {
  if (!editableRequest.value) return;
  
  // 如果请求有cookies但headers中没有Cookie，则添加
  const headers: Record<string, string> = { ...(editableRequest.value.headers || {}) };
  
  if (editableRequest.value.cookies && editableRequest.value.cookies.length > 0) {
    const cookieString = formatCookiesToString(editableRequest.value.cookies);
    // 如果headers中已经有Cookie，则合并；否则添加新的
    if (headers['Cookie'] || headers['cookie']) {
      const existingCookie = headers['Cookie'] || headers['cookie'] || '';
      headers['Cookie'] = existingCookie ? `${existingCookie}; ${cookieString}` : cookieString;
      if (headers['cookie'] && headers['Cookie']) {
        delete headers['cookie'];
      }
    } else {
      headers['Cookie'] = cookieString;
    }
    
    // 更新请求的headers
    editableRequest.value.headers = headers;
  }
  
  headerKeys.value = Object.keys(headers);
  headerValues.value = Object.values(headers);
};

const addHeader = () => {
  headerKeys.value.push('');
  headerValues.value.push('');
  updateRequestHeaders();
};

const removeHeader = (index: number) => {
  headerKeys.value.splice(index, 1);
  headerValues.value.splice(index, 1);
  updateRequestHeaders();
};

const updateRequestHeaders = () => {
  if (!editableRequest.value) return;
  const headers: Record<string, string> = {};
  headerKeys.value.forEach((key, index) => {
    if (key && headerValues.value[index] !== undefined) {
      headers[key] = headerValues.value[index] || '';
    }
  });
  editableRequest.value.headers = headers;
};

const sendRequest = async () => {
  if (!editableRequest.value) {
    message.warning('请先加载一个请求');
    return;
  }
  
  isSendingRequest.value = true;
  
  try {
    updateRequestHeaders();
    
    console.log('🚀 Sending request from HackBar:', {
      url: editableRequest.value.url,
      method: editableRequest.value.method,
      headers: editableRequest.value.headers
    });
    
    // 把请求数据发送给background script处理
    chrome.runtime.sendMessage({
      type: 'SEND_REQUEST',
      data: {
        url: editableRequest.value.url,
        method: editableRequest.value.method,
        headers: editableRequest.value.headers,
        body: editableRequest.value.body
      }
    });
    
    message.success('请求已提交，浏览器正在处理…');
    
  } catch (error: any) {
    console.error('Request error:', error);
    message.error(`请求发送失败: ${error.message || '未知错误'}`);
  } finally {
    isSendingRequest.value = false;
  }
};



// 在当前页面显示响应内容
const displayResponseInCurrentPage = (responseBody: string, status: number, headers: Record<string, string>) => {
  try {
    console.log('🔄 Displaying response in current page:', { status, headersCount: Object.keys(headers).length, bodyLength: responseBody.length });
    
    // 直接使用响应内容替换当前页面
    let finalHtml = responseBody;
    
    // 如果响应内容不是完整的HTML文档，包装成HTML
    if (!responseBody.trim().toLowerCase().startsWith('<!doctype') && 
        !responseBody.trim().toLowerCase().startsWith('<html')) {
      
      // 检查Content-Type来决定如何处理
      const contentType = headers['content-type'] || headers['Content-Type'] || '';
      
      if (contentType.includes('application/json')) {
        // JSON响应，格式化为可读的HTML
        try {
          const jsonObj = JSON.parse(responseBody);
          finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON 响应结果</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        pre { background: #f8f8f8; padding: 16px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h2>JSON 响应 (状态码: ${status})</h2>
        <pre>${JSON.stringify(jsonObj, null, 2)}</pre>
    </div>
</body>
</html>`;
        } catch (e) {
          // JSON解析失败，直接显示原始内容
          finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应结果</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        pre { background: #f8f8f8; padding: 16px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h2>响应内容 (状态码: ${status})</h2>
        <pre>${responseBody}</pre>
    </div>
</body>
</html>`;
        }
      } else if (contentType.includes('text/plain')) {
        // 纯文本响应
        finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文本响应结果</title>
    <style>
        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        pre { background: #f8f8f8; padding: 16px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h2>文本响应 (状态码: ${status})</h2>
        <pre>${responseBody}</pre>
    </div>
</body>
</html>`;
      } else {
        // 其他类型，直接包装
        finalHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应结果</title>
</head>
<body>
    ${responseBody}
</body>
</html>`;
      }
    }
    
    // 直接替换当前标签页内容
    try {
      // 方法1: 使用location.replace替换当前页面
      const blob = new Blob([finalHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.location.replace(url);
      
      message.success('响应内容已显示在当前页面');
      
    } catch (locationError) {
      console.warn('location.replace failed:', locationError);
      
      // 方法2: 使用location.href替换当前页面
      try {
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.location.href = url;
        
        message.success('响应内容已显示在当前页面');
        
      } catch (hrefError) {
        console.warn('location.href failed:', hrefError);
        
        // 方法3: 使用window.parent操作主页面
        try {
          if (window.parent && window.parent !== window) {
            window.parent.document.open();
            window.parent.document.write(finalHtml);
            window.parent.document.close();
            
            message.success('响应内容已显示在当前页面');
            return;
          }
        } catch (parentError) {
          console.warn('window.parent failed:', parentError);
        }
        
        // 方法4: 使用window.top操作主页面
        try {
          if (window.top && window.top !== window) {
            window.top.document.open();
            window.top.document.write(finalHtml);
            window.top.document.close();
            
            message.success('响应内容已显示在当前页面');
            return;
          }
        } catch (topError) {
          console.warn('window.top failed:', topError);
        }
        
        // 方法5: 使用window.open在新标签页显示
        try {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(finalHtml);
            newWindow.document.close();
            message.success('响应内容已在新标签页显示');
          } else {
            throw new Error('无法打开新标签页');
          }
        } catch (openError) {
          console.warn('window.open failed:', openError);
          message.error('无法显示响应内容，请检查浏览器设置');
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to display response in current page:', error);
    message.error(`无法显示响应内容: ${error.message}`);
  }
};

// 尝试使用代理服务
const tryProxyRequest = async () => {
  if (!editableRequest.value) return;
  
  const proxyServices = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(editableRequest.value.url)}`,
    `https://cors-anywhere.herokuapp.com/${editableRequest.value.url}`,
    `https://thingproxy.freeboard.io/fetch/${editableRequest.value.url}`
  ];
  
  for (const proxyUrl of proxyServices) {
    try {
      console.log(`🔄 Trying proxy: ${proxyUrl}`);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const responseBody = await response.text();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        // 更新请求对象的响应数据
        editableRequest.value.status = response.status;
        editableRequest.value.responseHeaders = responseHeaders;
        editableRequest.value.responseBody = responseBody;
        editableRequest.value.responseTime = Date.now() - Date.now();
        
        message.success(`请求成功 (通过代理) - 状态: ${response.status}`);
        // 直接跳转到目标URL
        window.parent.location.href = editableRequest.value.url;
        return;
      }
    } catch (proxyError) {
      console.warn(`Proxy ${proxyUrl} failed:`, proxyError);
    }
  }
  
  message.error('所有代理服务都失败了，请检查网络连接或目标URL');
};

// 生命周期
onMounted(() => {
  // 初始计算高度
  calculatePanelHeight();
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize);
  
  console.log('🔧 HackBar panel mounted with dynamic height');
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', handleWindowResize);
});

// 监听header变化
watch([headerKeys, headerValues], updateRequestHeaders, { deep: true });
</script>

<style scoped>
.hackbar-panel {
  padding: 12px;
  width: 100%;
  overflow-y: auto;
  /* 高度现在完全由JavaScript控制 */
  display: flex;
  flex-direction: column;
}

/* 确保请求编辑器能够正确滚动 */
.request-editor {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 允许flex子元素缩小 */
}

.load-section {
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
}

.load-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
}

.load-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.request-editor {
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
}

.request-editor h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
}

/* 动态调整HackBar中的textarea高度 - 现在由JavaScript控制 */
.request-editor .ant-textarea {
  resize: vertical;
  overflow-y: auto;
}

.headers-editor {
  margin-bottom: 12px;
}

.header-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.no-request {
  text-align: center;
  padding: 40px 0;
}

</style>
