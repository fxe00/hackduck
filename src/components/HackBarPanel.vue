<template>
  <div class="hackbar-panel" :style="{ height: panelHeight + 'px' }">
    <div class="hackbar-content-wrapper">
      <!-- 左侧：主要功能区域 (75%) -->
      <div class="hackbar-main-content">
        <!-- 请求编辑器 -->
        <div class="request-editor">
          <div class="editor-header">
            <h4>请求编辑器</h4>
            <div class="editor-actions">
              <a-button 
                @click="loadCurrentRequest" 
                :icon="h(DownloadOutlined)" 
                size="small"
                type="default"
              >
                Load
              </a-button>
              <a-button 
                @click="sendRequest" 
                :icon="h(SendOutlined)"
                :loading="isSendingRequest"
                :disabled="isSendingRequest || !editableRequest"
                size="small"
                type="primary"
              >
                {{ isSendingRequest ? '发送中...' : 'Send' }}
              </a-button>
            </div>
          </div>
      <a-form :model="editableRequest" layout="vertical" v-if="editableRequest" size="small">
        <a-row :gutter="12">
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tag color="blue" class="form-label-tag">方法</a-tag>
              </template>
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
            <a-form-item>
              <template #label>
                <a-tag color="green" class="form-label-tag">URL</a-tag>
              </template>
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
        <a-form-item>
          <template #label>
            <a-tag color="orange" class="form-label-tag">请求头</a-tag>
          </template>
          <a-collapse v-model:activeKey="activeHeaders" size="small" class="headers-collapse">
            <a-collapse-panel key="headers">
              <template #header>
                <div class="collapse-header-content">
                  <span class="collapse-header-icon">📋</span>
                  <span>Headers</span>
                  <a-badge :count="headerKeys.length" :number-style="{ backgroundColor: '#1890ff' }" class="header-count-badge" />
                </div>
              </template>
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
                <a-button @click="addHeader" :icon="h(PlusOutlined)" size="small" type="dashed" block class="add-header-btn">
                  添加 Header
                </a-button>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-form-item>
        
        <!-- Body 编辑 -->
        <a-form-item>
          <template #label>
            <a-tag color="purple" class="form-label-tag">请求体</a-tag>
          </template>
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
      </div>

      <!-- 右侧：用户笔记区域 (25%) -->
      <div class="notes-panel">
        <div class="notes-header">
          <h4>📝 用户笔记</h4>
          <a-button 
            type="text" 
            size="small" 
            @click="clearNotes"
            title="清空笔记"
          >
            清空
          </a-button>
        </div>
        <a-textarea
          v-model:value="userNotes"
          class="notes-textarea"
          placeholder="在这里记录你的测试笔记、思路、发现的问题等..."
          :auto-size="{ minRows: 10, maxRows: 50 }"
          @blur="saveNotes"
        />
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

// 用户笔记
const userNotes = ref<string>('');
const NOTES_STORAGE_KEY = 'hackduck_user_notes';

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
const formatCookiesToString = (cookies: any[]): string => {
  return cookies.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ');
};

// 获取指定域名的所有Cookie
const getAllCookiesForDomain = (domain: string): Promise<any[]> => {
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

    if (browserAPI?.cookies) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      browser.cookies.getAll({ domain }).then((cookies: any[]) => {
        resolve(cookies || []);
      }).catch((error: any) => {
        console.warn('Failed to get cookies:', error);
        resolve([]);
      });
    } else {
      // Chrome: Callback-based
      chrome.cookies.getAll({ domain }, (cookies) => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to get cookies:', chrome.runtime.lastError.message);
          resolve([]);
          return;
        }
        resolve(cookies || []);
      });
    }
  });
};

// 方法
const loadCurrentRequest = async () => {
  try {
    // DevTools 环境中无法直接访问 tabs API，需要通过 background script
    // Firefox 兼容性：通过 runtime.sendMessage 获取当前标签页
    // @ts-ignore - browser API 在 Firefox 中可用
    const browserAPI = typeof browser !== 'undefined' ? browser : null;
    const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
    const runtimeAPI = browserAPI?.runtime || chromeAPI?.runtime;
    
    if (!runtimeAPI) {
      message.error('无法访问运行时 API');
      return;
    }
    
    // 通过 background script 获取当前标签页
    let tab: any;
    if (browserAPI?.runtime) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      const response = await browser.runtime.sendMessage({ type: 'GET_CURRENT_TAB' });
      if (response && response.success && response.tab) {
        tab = response.tab;
      } else {
        message.error(response?.error || '无法获取当前标签页');
        return;
      }
    } else {
      // Chrome: Callback-based
      tab = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response: any) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success && response.tab) {
            resolve(response.tab);
          } else {
            reject(new Error(response?.error || '无法获取当前标签页'));
          }
        });
      });
    }
    
    if (!tab || !tab.id || !tab.url) {
      message.error('无法获取当前标签页信息');
      return;
    }
    
    // 创建基于当前URL的请求
    const currentUrl = new URL(tab.url);
    const domain = currentUrl.hostname;
    
    // 通过 background script 获取该域名的所有Cookie（DevTools 环境中无法直接访问 cookies API）
    let cookies: any[] = [];
    if (browserAPI?.runtime) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      const cookieResponse = await browser.runtime.sendMessage({ 
        type: 'GET_COOKIES_FOR_DOMAIN', 
        data: { domain } 
      });
      if (cookieResponse && cookieResponse.success) {
        cookies = cookieResponse.cookies || [];
      }
    } else {
      // Chrome: Callback-based
      cookies = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'GET_COOKIES_FOR_DOMAIN', 
          data: { domain } 
        }, (response: any) => {
          if (chrome.runtime.lastError) {
            console.warn('Failed to get cookies:', chrome.runtime.lastError);
            resolve([]);
          } else if (response && response.success) {
            resolve(response.cookies || []);
          } else {
            resolve([]);
          }
        });
      });
    }
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
  
  // 从请求中获取headers
  const headers: Record<string, string> = { ...(editableRequest.value.headers || {}) };
  
  // 如果请求有cookies但headers中没有Cookie，则添加
  if (editableRequest.value.cookies && editableRequest.value.cookies.length > 0) {
    const cookieString = formatCookiesToString(editableRequest.value.cookies);
    // 只有当headers中没有Cookie时才添加，避免重复
    if (!headers['Cookie'] && !headers['cookie']) {
      headers['Cookie'] = cookieString;
      // 更新请求的headers
      editableRequest.value.headers = headers;
      console.log('🍪 Added Cookie header from cookies:', headers['Cookie']);
    } else if (headers['Cookie'] || headers['cookie']) {
      // 如果headers中已经有Cookie，确保使用大写的Cookie
      if (headers['cookie']) {
        headers['Cookie'] = headers['cookie'];
        delete headers['cookie'];
        editableRequest.value.headers = headers;
      }
      console.log('🍪 Cookie header already exists:', headers['Cookie']);
    }
  }
  
  // 更新显示的headers列表
  headerKeys.value = Object.keys(headers);
  headerValues.value = Object.values(headers);
  
  console.log('📋 Updated headers display:', {
    headerCount: headerKeys.value.length,
    hasCookie: !!headers['Cookie'],
    cookieHeader: headers['Cookie'] ? 'exists' : 'missing'
  });
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
    
    // Firefox 兼容性：把请求数据发送给background script处理
    // @ts-ignore - browser API 在 Firefox 中可用
    const browserAPI = typeof browser !== 'undefined' ? browser : null;
    const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
    const runtimeAPI = browserAPI?.runtime || chromeAPI?.runtime;
    
    if (!runtimeAPI) {
      message.error('无法访问运行时 API');
      return;
    }
    
    const messageData = {
      type: 'SEND_REQUEST',
      data: {
        url: editableRequest.value.url,
        method: editableRequest.value.method,
        headers: editableRequest.value.headers,
        body: editableRequest.value.body
      }
    };
    
    if (browserAPI?.runtime) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      browser.runtime.sendMessage(messageData).catch((error: any) => {
        console.error('Failed to send request:', error);
        message.error('发送请求失败');
      });
    } else {
      // Chrome: Callback-based
      chrome.runtime.sendMessage(messageData, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to send request:', chrome.runtime.lastError);
          message.error('发送请求失败');
        }
      });
    }
    
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

// 笔记相关方法
const loadNotes = () => {
  try {
    const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
    if (savedNotes) {
      userNotes.value = savedNotes;
      console.log('📝 Loaded notes from storage');
    }
  } catch (error) {
    console.warn('Failed to load notes:', error);
  }
};

const saveNotes = () => {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, userNotes.value);
    console.log('📝 Saved notes to storage');
  } catch (error) {
    console.warn('Failed to save notes:', error);
  }
};

const clearNotes = () => {
  userNotes.value = '';
  saveNotes();
  message.success('笔记已清空');
};

// 生命周期
onMounted(() => {
  // 初始计算高度
  calculatePanelHeight();
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize);
  
  // 加载笔记
  loadNotes();
  
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
  padding: 12px 16px;
  width: 100%;
  overflow-y: auto;
  /* 高度现在完全由JavaScript控制 */
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  min-height: 100%;
}

.hackbar-content-wrapper {
  display: flex;
  gap: 16px;
  height: 100%;
  width: 100%;
}

.hackbar-main-content {
  flex: 3;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 确保请求编辑器能够正确滚动 */
.hackbar-main-content .request-editor {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 允许flex子元素缩小 */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8e8e8;
}

.editor-header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.2px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-actions .ant-btn {
  border-radius: 4px;
  font-size: 10px;
  height: 24px;
  padding: 0 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.editor-actions .ant-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.request-editor {
  margin-bottom: 12px;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.request-editor:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.request-editor h4 {
  margin: 0 0 10px 0;
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.2px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e8e8e8;
}

/* 动态调整HackBar中的textarea高度 - 现在由JavaScript控制 */
.request-editor .ant-textarea {
  resize: vertical;
  overflow-y: auto;
  font-weight: 600;
  border-radius: 6px;
  border-color: #e8e8e8;
  transition: all 0.2s ease;
  font-size: 11px;
}

.request-editor .ant-textarea:hover {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.request-editor .ant-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 表单样式优化 */
.request-editor .ant-form-item-label {
  padding-bottom: 6px;
}

.request-editor .ant-form-item-label > label {
  height: auto;
  line-height: 1;
}

.form-label-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: none;
}

.request-editor .ant-form-item {
  margin-bottom: 12px;
}

.request-editor .ant-input,
.request-editor .ant-select-selector {
  border-radius: 6px;
  border-color: #e8e8e8;
  transition: all 0.2s ease;
  font-size: 11px;
}

.request-editor .ant-input:hover,
.request-editor .ant-select-selector:hover {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.request-editor .ant-input:focus,
.request-editor .ant-input-focused,
.request-editor .ant-select-focused .ant-select-selector {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* Headers编辑器样式 */
.headers-editor {
  margin-bottom: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  padding: 8px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.header-row:hover {
  background: linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%);
  border-color: #1890ff;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.15);
  transform: translateY(-1px);
}

.header-row .ant-input {
  border-radius: 4px;
  font-size: 11px;
}

.header-row .ant-btn {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.header-row .ant-btn:hover {
  transform: scale(1.1);
}

/* Collapse样式优化 */
.request-editor .ant-collapse {
  background: transparent;
  border: none;
}

.headers-collapse .ant-collapse-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.headers-collapse .ant-collapse-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  transform: translateY(-1px);
}

.headers-collapse .ant-collapse-item-active {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.headers-collapse .ant-collapse-header {
  background: linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%);
  padding: 10px 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  transition: all 0.2s ease;
  font-size: 11px;
  border-radius: 8px 8px 0 0;
}

.headers-collapse .ant-collapse-header:hover {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f8ff 100%);
}

.collapse-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-header-icon {
  font-size: 14px;
}

.header-count-badge {
  margin-left: auto;
}

.add-header-btn {
  margin-top: 4px;
  border-style: dashed;
  border-color: #1890ff;
  color: #1890ff;
  font-weight: 500;
}

.add-header-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
  background: #f0f8ff;
}

.request-editor .ant-collapse-header:hover {
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
}

.request-editor .ant-collapse-content {
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
}

.request-editor .ant-collapse-content-box {
  padding: 10px;
}

/* 添加Header按钮样式 */
.headers-editor .ant-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  font-size: 11px;
}

.headers-editor .ant-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.no-request {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  border: 2px dashed #e8e8e8;
}

/* 自定义滚动条 */
.hackbar-panel::-webkit-scrollbar {
  width: 8px;
}

.hackbar-panel::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 4px;
}

.hackbar-panel::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.hackbar-panel::-webkit-scrollbar-thumb:hover {
  background: #1890ff;
}

/* 笔记面板样式 */
.notes-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.notes-header {
  padding: 10px 14px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.notes-header h4 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.2px;
}

.notes-header .ant-btn {
  font-size: 10px;
  padding: 2px 8px;
  height: 22px;
}

.notes-textarea {
  flex: 1;
  border: none;
  border-radius: 0;
  padding: 12px;
  font-size: 11px;
  line-height: 1.6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  resize: none;
  background: #ffffff;
  overflow-y: auto;
  min-height: 0;
}

.notes-textarea:focus {
  border: none;
  box-shadow: none;
  outline: none;
}

.notes-textarea::placeholder {
  color: rgba(0, 0, 0, 0.25);
  font-style: italic;
}

</style>
