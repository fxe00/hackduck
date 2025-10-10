<template>
  <div class="burp-suite-panel">
    <!-- 左侧：请求列表 -->
    <div class="request-list-panel" :style="{ width: leftWidth + '%' }">
      <div class="panel-header">
        <h3>请求列表 ({{ filteredRequests.length }})</h3>
      </div>
      
      <!-- 过滤控件 -->
      <div class="filter-controls">
        <a-row :gutter="12" align="middle" justify="space-between">
          <a-col :span="10">
            <a-input
              v-model:value="filterText"
              placeholder="过滤请求..."
              :prefix="h(SearchOutlined)"
              allow-clear
              size="small"
            />
          </a-col>
          <a-col :span="7">
            <a-switch 
              v-model:checked="showCurrentDomainOnly" 
              checked-children="当前域名" 
              un-checked-children="全部域名"
              size="small"
            />
          </a-col>
          <a-col :span="7">
            <a-switch 
              v-model:checked="hideStaticResources" 
              checked-children="隐藏静态资源" 
              un-checked-children="显示静态资源"
              size="small"
            />
          </a-col>
        </a-row>
      </div>
      
      <!-- 请求列表 -->
      <div class="request-list">
        <a-list
          :data-source="filteredRequests"
          size="small"
        >
          <template #renderItem="{ item }: { item: HttpRequest }">
            <a-list-item
              :class="{ active: selectedRequest?.id === item.id }"
              @click="selectRequest(item)"
            >
              <a-list-item-meta>
                <template #title>
                  <div class="request-info">
                    <a-tag
                      :color="getStatusColor(item.status)"
                      class="method-tag"
                    >
                      {{ item.method }}
                    </a-tag>
                    <span class="url">{{ item.url }}</span>
                  </div>
                </template>
                <template #description>
                  <div class="request-meta">
                    <span class="status">{{ item.status || 'Pending' }}</span>
                    <span class="time">{{ formatTime(item.timestamp) }}</span>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>

    <!-- 可拖拽分割线 -->
    <div class="resizer" @mousedown="startResize"></div>

    <!-- 右侧：编辑器 -->
    <div class="editor-panel" :style="{ width: rightWidth + '%' }">
      <div class="editor-toolbar">
        <a-button 
          type="primary" 
          @click="sendRequest" 
          :icon="h(SendOutlined)"
          :loading="isSendingRequest"
          :disabled="isSendingRequest"
        >
          {{ isSendingRequest ? '发送中...' : 'Send Request' }}
        </a-button>
        <a-select 
          v-model:value="selectedMethod" 
          @change="changeMethod"
          style="width: 150px"
          placeholder="选择方法"
        >
          <a-select-option value="GET">GET</a-select-option>
          <a-select-option value="POST">POST</a-select-option>
          <a-select-option value="PUT">PUT</a-select-option>
          <a-select-option value="DELETE">DELETE</a-select-option>
          <a-select-option value="PATCH">PATCH</a-select-option>
          <a-select-option value="HEAD">HEAD</a-select-option>
          <a-select-option value="OPTIONS">OPTIONS</a-select-option>
        </a-select>
      </div>
      
      <a-row :gutter="16" class="editor-row" :style="{ height: editorHeight + 'px' }">
        <!-- 左侧：请求编辑器 -->
        <a-col :span="12">
          <div class="request-editor" :style="{ height: editorHeight + 'px' }">
            <h4>请求编辑器</h4>
            <a-textarea
              v-model:value="requestText"
              :style="{ height: Math.max(150, editorHeight - 60) + 'px' }"
              placeholder="原始HTTP请求内容...&#10;&#10;例如：&#10;GET /api/users HTTP/1.1&#10;Host: example.com&#10;User-Agent: Mozilla/5.0...&#10;Accept: application/json"
              @contextmenu="handleRightClick"
              @keydown="handleKeyDown"
              ref="requestTextareaRef"
            />
          </div>
        </a-col>
        
        <!-- 右侧：响应查看器 -->
        <a-col :span="12">
          <div class="response-viewer" :style="{ height: editorHeight + 'px' }">
            <h4>响应查看器</h4>
            <div v-if="isSendingRequest" class="loading-container" :style="{ height: Math.max(150, editorHeight - 60) + 'px' }">
              <a-spin size="large" />
              <p>正在发送请求...</p>
            </div>
            <a-textarea
              v-else
              :value="responseText"
              :style="{ height: Math.max(150, editorHeight - 60) + 'px' }"
              readonly
              class="readonly-response"
              placeholder="响应内容..."
            />
          </div>
        </a-col>
      </a-row>
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
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SearchOutlined, 
  SendOutlined, 
  EditOutlined 
} from '@ant-design/icons-vue';
import type { HttpRequest } from '../types';
import { URLParser } from '../utils/urlParser';
import ContextMenu from './ContextMenu.vue';

// Props
const props = defineProps<{
  requests: HttpRequest[];
  currentDomain: string;
}>();

// 响应式数据
const selectedRequest = ref<HttpRequest | null>(null);
const filterText = ref('');
const showCurrentDomainOnly = ref(true); // 默认显示当前域名
const hideStaticResources = ref(true);
const requestText = ref('');
const responseText = ref('');
const isSendingRequest = ref(false);
const selectedMethod = ref<string>('');

// 拖拽相关
const leftWidth = ref(30);
const rightWidth = ref(70);
const isResizing = ref(false);

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedText = ref('');
const targetElement = ref<HTMLElement | null>(null);
const requestTextareaRef = ref<HTMLTextAreaElement>();

// 历史记录相关
const history = ref<Array<{ type: string; originalText: string; newText: string; timestamp: number }>>([]);
const historyIndex = ref(-1);
const maxHistorySize = 50;

// 动态高度相关
const editorHeight = ref(400);

// 计算动态高度
const calculateEditorHeight = () => {
  const windowHeight = window.innerHeight;
  // 使用和请求列表相同的高度计算方式
  const availableHeight = windowHeight - 100; // 和请求列表保持一致
  const minHeight = 200; // 降低最小高度，确保在小屏幕上也能使用
  const maxHeight = windowHeight - 50;
  
  // 确保有足够空间显示编辑器内容
  const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
  
  // 如果计算出的高度太小，增加一些额外空间
  if (calculatedHeight < 250) {
    editorHeight.value = Math.max(200, calculatedHeight);
  } else {
    editorHeight.value = calculatedHeight;
  }
  
  console.log('📏 Calculated BurpSuite editor height:', editorHeight.value, 'Window height:', windowHeight);
};

// 窗口大小变化监听
const handleWindowResize = () => {
  calculateEditorHeight();
};

// 计算属性 - 过滤后的请求
const filteredRequests = computed(() => {
  let filtered = props.requests;
  
  // 静态资源过滤
  if (hideStaticResources.value) {
    filtered = filtered.filter(req => {
      return !URLParser.shouldFilter(req.url);
    });
  }
  
  // 域名过滤
  if (showCurrentDomainOnly.value && props.currentDomain) {
    filtered = filtered.filter(req => {
      try {
        const url = new URL(req.url);
        return url.hostname === props.currentDomain;
      } catch {
        return false;
      }
    });
  }
  
  // 文本过滤
  if (filterText.value) {
    filtered = filtered.filter(req => 
      req.url.toLowerCase().includes(filterText.value.toLowerCase()) ||
      req.method.toLowerCase().includes(filterText.value.toLowerCase())
    );
  }
  
  return filtered;
});

// 方法
const selectRequest = (request: HttpRequest) => {
  selectedRequest.value = request;
  loadRequestToEditor(request);
  console.log('📝 Selected request:', request.url);
};

// 右键菜单处理
const handleRightClick = (event: MouseEvent) => {
  const target = event.target as HTMLTextAreaElement;
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
    const target = targetElement.value as HTMLTextAreaElement;
    
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
    const target = targetElement.value as HTMLTextAreaElement;
    
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

const loadRequestToEditor = (request: HttpRequest) => {
  // 设置选中的方法
  selectedMethod.value = request.method;
  
  // 将请求转换为原始HTTP格式
  const url = new URL(request.url);
  let requestLines = [];
  
  // 请求行
  requestLines.push(`${request.method} ${url.pathname}${url.search} HTTP/1.1`);
  requestLines.push(`Host: ${url.host}`);
  
  // 请求头
  if (request.headers) {
    for (const [key, value] of Object.entries(request.headers)) {
      requestLines.push(`${key}: ${value}`);
    }
  }
  
  // 空行分隔
  requestLines.push('');
  
  // 请求体
  if (request.body) {
    requestLines.push(request.body);
  }
  
  requestText.value = requestLines.join('\n');
  
  // 加载响应
  loadResponseToViewer(request);
};

const loadResponseToViewer = (request: HttpRequest) => {
  let responseLines = [];
  
  // 响应行
  const status = request.status || 'Pending';
  const statusText = status === 'Pending' ? 'Pending' : 
                     status >= 200 && status < 300 ? 'OK' :
                     status >= 300 && status < 400 ? 'Redirect' :
                     status >= 400 && status < 500 ? 'Client Error' :
                     status >= 500 ? 'Server Error' : 'Unknown';
  
  responseLines.push(`HTTP/1.1 ${status} ${statusText}`);
  
  // 响应头
  if (request.responseHeaders && Object.keys(request.responseHeaders).length > 0) {
    for (const [key, value] of Object.entries(request.responseHeaders)) {
      responseLines.push(`${key}: ${value}`);
    }
  } else {
    responseLines.push('(No response headers available)');
  }
  
  // 空行分隔
  responseLines.push('');
  
  // 响应体
  if (request.responseBody && request.responseBody.trim()) {
    responseLines.push(request.responseBody);
  } else {
    responseLines.push('(点击"Send Request"按钮发起请求后获得完整响应体)');
  }
  
  responseText.value = responseLines.join('\n');
};

const sendRequest = async () => {
  if (!selectedRequest.value) {
    message.warning('请先选择一个请求');
    return;
  }
  
  isSendingRequest.value = true;
  
  try {
    // 直接使用原始请求数据，确保完整性
    const originalRequest = selectedRequest.value;
    const method = originalRequest.method;
    const fullUrl = originalRequest.url;
    const headers = { ...originalRequest.headers }; // 复制所有原始头部
    const body = originalRequest.body || '';
    
    console.log('🚀 Sending single request:', {
      url: fullUrl,
      method: method,
      headers: headers,
      body: body
    });
    
    const startTime = Date.now();
    
    // 尝试使用cors模式获取真实响应
    try {
      const response = await fetch(fullUrl, {
        method: method,
        mode: 'cors', // 尝试cors模式获取真实响应
        credentials: 'include', // 包含Cookie和认证信息
        headers: {
          ...headers // 使用原始请求的所有头部信息，不覆盖
        },
        body: body || undefined
      });
      
      const responseTime = Date.now() - startTime;
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      const responseBody = await response.text();
      
      message.success(`请求发送成功: ${response.status}`);
      
      // 构建真实的响应内容
      let responseContent = `HTTP/1.1 ${response.status} ${response.statusText}\n`;
      
      // 添加响应头
      for (const [key, value] of Object.entries(responseHeaders)) {
        responseContent += `${key}: ${value}\n`;
      }
      
      responseContent += '\n';
      responseContent += responseBody;
      
      responseText.value = responseContent;
      
      // 更新选中请求的状态
      if (selectedRequest.value) {
        selectedRequest.value.status = response.status;
        selectedRequest.value.responseTime = responseTime;
        selectedRequest.value.responseHeaders = responseHeaders;
        selectedRequest.value.responseBody = responseBody;
      }
      
    } catch (corsError: any) {
      console.warn('CORS request failed, trying proxy services:', corsError);
      
      // 尝试多个代理服务
      const proxyServices = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(fullUrl)}`,
        `https://cors-anywhere.herokuapp.com/${fullUrl}`,
        `https://thingproxy.freeboard.io/fetch/${fullUrl}`
      ];
      
      let proxySuccess = false;
      
      for (const proxyUrl of proxyServices) {
        try {
          console.log('Trying proxy:', proxyUrl);
          const proxyResponse = await fetch(proxyUrl, {
            method: method,
            credentials: 'include', // 包含Cookie和认证信息
            headers: {
              ...headers // 使用原始请求的所有头部信息，不覆盖
            },
            body: body || undefined
          });
          
          const proxyBody = await proxyResponse.text();
          
          message.success('请求通过代理发送成功');
          responseText.value = `HTTP/1.1 ${proxyResponse.status} ${proxyResponse.statusText}\nContent-Type: ${proxyResponse.headers.get('content-type') || 'text/plain'}\nContent-Length: ${proxyBody.length}\n\n${proxyBody}`;
          
          // 更新选中请求的状态
          if (selectedRequest.value) {
            selectedRequest.value.status = proxyResponse.status;
            selectedRequest.value.responseTime = Date.now() - startTime;
            selectedRequest.value.responseHeaders = {
              'Content-Type': proxyResponse.headers.get('content-type') || 'text/plain',
              'Content-Length': proxyBody.length.toString()
            };
            selectedRequest.value.responseBody = proxyBody;
          }
          
          proxySuccess = true;
          break;
          
        } catch (proxyError) {
          console.warn('Proxy failed:', proxyUrl, proxyError);
          continue;
        }
      }
      
      if (!proxySuccess) {
        // 如果所有代理都失败，提供降级方案
        if (method === 'GET') {
          window.open(fullUrl, '_blank');
          message.warning('CORS限制，请求已在新标签页中打开');
          responseText.value = `HTTP/1.1 200 OK\nContent-Type: text/plain\n\nRequest opened in new tab due to CORS restrictions\nURL: ${fullUrl}\nMethod: ${method}\n\nNote: Please check the new tab for the actual response\n\nTo get full response:\n1. Use HackBar mode for same-origin requests\n2. Check the new tab's Network panel in DevTools\n3. Use a CORS proxy service manually`;
        } else {
          message.warning('非GET请求受CORS限制，请使用HackBar模式');
          responseText.value = `HTTP/1.1 403 Forbidden\nContent-Type: text/plain\n\nNon-GET requests are blocked by CORS policy\n\nRecommendations:\n1. Use HackBar mode for same-origin requests\n2. Use browser's DevTools Network panel\n3. Use a CORS proxy service\n\nURL: ${fullUrl}\nMethod: ${method}`;
        }
      }
    }
  } catch (error: any) {
    const errorMsg = error.message || '网络错误或CORS限制';
    message.error(`请求发送失败: ${errorMsg}`);
    console.error('Request error:', error);
  } finally {
    isSendingRequest.value = false;
  }
};

const changeMethod = (newMethod: string) => {
  if (!requestText.value) {
    message.warning('请先加载一个请求');
    return;
  }
  
  if (!newMethod) {
    message.warning('请选择一个HTTP方法');
    return;
  }
  
  const lines = requestText.value.split('\n');
  const [requestLine, ...rest] = lines;
  const [currentMethod, path] = requestLine.split(' ');
  
  // 如果方法没有变化，直接返回
  if (currentMethod === newMethod) {
    return;
  }
  
  // 解析URL和查询参数
  const url = new URL(path.startsWith('http') ? path : `https://example.com${path}`);
  const queryParams = url.searchParams;
  
  // 找到请求体开始的位置（空行后）
  let bodyStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      bodyStartIndex = i;
      break;
    }
  }
  
  // 获取现有的请求体内容
  const existingBody = bodyStartIndex !== -1 ? lines.slice(bodyStartIndex + 1).join('\n') : '';
  
  let newPath = url.pathname;
  let newBody = existingBody;
  
  if (currentMethod === 'GET' && newMethod === 'POST') {
    // GET → POST: 将URL参数移到请求体
    if (queryParams.size > 0) {
      const formData = new URLSearchParams();
      queryParams.forEach((value, key) => {
        formData.append(key, value);
      });
      newBody = formData.toString();
      newPath = url.pathname; // 移除查询参数
    }
  } else if (currentMethod === 'POST' && newMethod === 'GET') {
    // POST → GET: 将请求体参数移到URL
    if (existingBody.trim()) {
      try {
        // 清理请求体中的换行符和多余空白
        const cleanedBody = existingBody.replace(/\r\n/g, '&').replace(/\n/g, '&').replace(/\r/g, '&').trim();
        
        // 尝试解析为表单数据
        const formData = new URLSearchParams(cleanedBody);
        if (formData.size > 0) {
          formData.forEach((value, key) => {
            // 清理参数值中的换行符
            const cleanedValue = value.replace(/[\r\n]/g, '').trim();
            if (cleanedValue) {
              queryParams.set(key, cleanedValue);
            }
          });
          newPath = `${url.pathname}?${queryParams.toString()}`;
          newBody = ''; // 清空请求体
        }
      } catch (e) {
        // 如果不是表单数据，保持原样
        console.warn('Could not parse body as form data:', e);
      }
    }
  }
  
  // 更新请求行
  lines[0] = `${newMethod} ${newPath} HTTP/1.1`;
  
  // 更新请求体
  if (bodyStartIndex !== -1) {
    // 替换现有请求体
    lines.splice(bodyStartIndex + 1);
    if (newBody.trim()) {
      lines.push(''); // 空行
      lines.push(newBody);
    }
  } else if (newBody.trim()) {
    // 添加新的请求体
    lines.push(''); // 空行
    lines.push(newBody);
  }
  
  requestText.value = lines.join('\n');
  
  message.success(`请求方法已切换为: ${newMethod}`);
};

const getStatusColor = (status?: number) => {
  if (!status) return 'default';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'warning';
  return 'error';
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

// 拖拽方法
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  
  const container = document.querySelector('.burp-suite-panel') as HTMLElement;
  if (!container) return;
  
  const containerRect = container.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;
  const containerWidth = containerRect.width;
  
  const newLeftWidth = (mouseX / containerWidth) * 100;
  const newRightWidth = 100 - newLeftWidth;
  
  if (newLeftWidth >= 20 && newRightWidth >= 20) {
    leftWidth.value = Math.round(newLeftWidth);
    rightWidth.value = Math.round(newRightWidth);
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
};

// 生命周期
onMounted(() => {
  // 初始计算高度
  calculateEditorHeight();
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleWindowResize);
  
  // 监听DevTools面板大小变化（如果可用）
  if (window.chrome && window.chrome.devtools) {
    // DevTools特有的API
    console.log('🔧 DevTools environment detected');
  }
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<style scoped>
.burp-suite-panel {
  display: flex;
  height: calc(100vh - 100px);
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

/* 动态高度支持 */
.editor-row {
  height: calc(100vh - 250px);
  min-height: 300px;
  max-height: calc(100vh - 150px);
}

/* 当DevTools面板较小时，使用更灵活的高度 */
@media (max-height: 600px) {
  .editor-row {
    height: calc(100vh - 200px);
    min-height: 200px;
  }
}

@media (max-height: 400px) {
  .editor-row {
    height: calc(100vh - 150px);
    min-height: 150px;
  }
}

.request-list-panel {
  border-right: 1px solid #d9d9d9;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #d9d9d9;
  background-color: #fafafa;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.filter-controls {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.filter-controls .ant-input {
  border-radius: 4px;
}

.filter-controls .ant-switch {
  margin: 0;
}

.filter-controls .ant-switch-checked .ant-switch-inner {
  background-color: #1890ff;
}

.filter-controls .ant-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-list {
  flex: 1;
  overflow-y: auto;
}

.request-list .active {
  background-color: #e6f7ff !important;
  border-left: 3px solid #1890ff;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-tag {
  font-size: 12px;
  min-width: 50px;
  text-align: center;
}

.url {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.request-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
}

.editor-panel {
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #d9d9d9;
  background-color: #fafafa;
  display: flex;
  gap: 8px;
}

.request-editor h4,
.response-viewer h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

/* 动态调整textarea高度 - 现在由JavaScript控制 */
.request-editor .ant-textarea,
.response-viewer .ant-textarea {
  resize: vertical;
  overflow-y: auto;
  min-height: 150px; /* 确保最小可用高度 */
}

.request-editor,
.response-viewer {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 允许flex子元素缩小 */
}

.request-editor h4,
.response-viewer h4 {
  flex-shrink: 0;
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

/* 确保编辑器容器能够正确滚动 */
.request-editor,
.response-viewer {
  position: relative;
}

.request-editor .ant-textarea,
.response-viewer .ant-textarea {
  flex: 1;
  overflow-y: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.readonly-response {
  background-color: #f5f5f5 !important;
  color: #666 !important;
  border: 1px solid #d9d9d9 !important;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.loading-container p {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.resizer {
  width: 4px;
  background-color: #d9d9d9;
  cursor: col-resize;
  transition: background-color 0.2s;
}

.resizer:hover {
  background-color: #1890ff;
}
</style>
