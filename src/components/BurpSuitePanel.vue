<template>
  <div class="burp-suite-panel">
    <!-- 左侧：请求列表 -->
    <div class="request-list-panel" :class="{ collapsed: isListCollapsed }" :style="{ width: isListCollapsed ? '0' : leftWidth + '%' }">
      <div class="panel-header">
        <h3>请求列表 ({{ filteredRequests.length }})</h3>
        <a-button 
          type="text" 
          size="small" 
          :icon="h(MenuFoldOutlined)"
          @click="toggleListCollapse"
          class="collapse-btn"
          title="收缩列表"
        />
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
            <div class="filter-switch-wrapper">
              <span class="switch-label">当前域名</span>
              <a-switch 
                v-model:checked="showCurrentDomainOnly" 
                checked-children="ON" 
                un-checked-children="OFF"
                size="small"
                class="filter-switch"
              />
            </div>
          </a-col>
          <a-col :span="7">
            <div class="filter-switch-wrapper">
              <span class="switch-label">静态资源</span>
              <a-switch 
                v-model:checked="hideStaticResources" 
                checked-children="ON" 
                un-checked-children="OFF"
                size="small"
                class="filter-switch"
              />
            </div>
          </a-col>
        </a-row>
      </div>
      
      <!-- 请求列表 -->
      <div class="request-list" ref="requestListRef">
        <a-list
          :data-source="filteredRequests"
          size="small"
        >
          <template #renderItem="{ item }: { item: HttpRequest }">
            <a-list-item
              :key="item.id"
              :class="{ active: isRequestSelected(item.id) }"
              @click="selectRequest(item)"
              :data-request-id="item.id"
            >
              <a-list-item-meta>
                <template #title>
                  <div class="request-info">
                    <a-tag
                      :color="getMethodColor(item.method)"
                      class="method-tag"
                    >
                      {{ item.method }}
                    </a-tag>
                    <span class="url" :title="item.url">{{ truncateUrl(item.url) }}</span>
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
    <div class="resizer" v-if="!isListCollapsed" @mousedown="startResize"></div>
    
    <!-- 展开按钮（当列表收缩时显示） -->
    <div class="expand-button" v-if="isListCollapsed" @click="toggleListCollapse">
      <a-button 
        type="text" 
        size="small" 
        :icon="h(MenuUnfoldOutlined)"
        title="展开列表"
      />
    </div>

    <!-- 右侧：编辑器 -->
    <div class="editor-panel" :style="{ width: isListCollapsed ? '100%' : rightWidth + '%' }">
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
            <div class="request-editor-header">
              <h4>请求编辑器</h4>
              <a-button-group size="small">
                <a-button 
                  :type="requestViewMode === 'text' ? 'primary' : 'default'"
                  :icon="h(FileTextOutlined)"
                  @click="requestViewMode = 'text'"
                  title="文本视图"
                >
                  文本
                </a-button>
                <a-button 
                  :type="requestViewMode === 'table' ? 'primary' : 'default'"
                  :icon="h(TableOutlined)"
                  @click="requestViewMode = 'table'"
                  title="表格视图"
                >
                  表格
                </a-button>
              </a-button-group>
            </div>
            
            <!-- 文本视图 -->
            <div v-if="requestViewMode === 'text'" class="request-text-view">
              <div class="http-request-editor-wrapper">
                <pre class="http-request-highlighted" v-html="highlightedRequestText"></pre>
                <a-textarea
                  v-model:value="requestText"
                  :style="{ height: Math.max(200, editorHeight - 80) + 'px' }"
                  placeholder="原始HTTP请求内容...&#10;&#10;例如：&#10;GET /api/users HTTP/1.1&#10;Host: example.com&#10;User-Agent: Mozilla/5.0...&#10;Accept: application/json"
                  @contextmenu="handleRightClick"
                  @keydown="handleKeyDown"
                  @input="updateHighlightedText"
                  @focus="handleRequestEditorFocus"
                  ref="requestTextareaRef"
                  class="http-request-editor"
                />
              </div>
            </div>
            
            <!-- 表格视图 -->
            <div v-else class="request-table-view">
              <div class="request-table-content" :style="{ height: Math.max(200, editorHeight - 80) + 'px' }">
                <div class="request-line" v-if="parsedRequest.method">
                  <div class="request-line-label">方法:</div>
                  <div class="request-line-value">
                    <a-tag :color="getMethodColor(parsedRequest.method)" class="method-tag-small">
                      {{ parsedRequest.method }}
                    </a-tag>
                  </div>
                </div>
                <div class="request-line" v-if="parsedRequest.path">
                  <div class="request-line-label">路径:</div>
                  <div class="request-line-value">{{ parsedRequest.path }}</div>
                </div>
                <div class="request-line" v-if="parsedRequest.version">
                  <div class="request-line-label">版本:</div>
                  <div class="request-line-value">{{ parsedRequest.version }}</div>
                </div>
                
                <div class="headers-section" v-if="parsedRequest.headers && parsedRequest.headers.length > 0">
                  <div class="headers-title">请求头 ({{ parsedRequest.headers.length }})</div>
                  <div class="headers-table">
                    <div 
                      v-for="(header, index) in parsedRequest.headers" 
                      :key="index"
                      class="header-row-item"
                    >
                      <div class="header-key">
                        <a-tag color="blue" class="header-key-tag">{{ header.key }}</a-tag>
                      </div>
                      <div class="header-value">{{ header.value }}</div>
                    </div>
                  </div>
                </div>
                
                <div class="body-section" v-if="parsedRequest.body">
                  <div class="body-title">请求体</div>
                  <div class="body-content">{{ parsedRequest.body }}</div>
                </div>
              </div>
            </div>
          </div>
        </a-col>
        
        <!-- 右侧：响应查看器 -->
        <a-col :span="12">
          <div class="response-viewer" :style="{ height: editorHeight + 'px' }">
            <div class="response-viewer-header">
              <h4>响应查看器</h4>
            </div>
            
            <div v-if="isSendingRequest" class="loading-container" :style="{ height: Math.max(150, editorHeight - 60) + 'px' }">
              <a-spin size="large" />
              <p>正在发送请求...</p>
            </div>
            <div v-else class="response-text-wrapper">
              <pre class="response-highlighted" v-html="escapeHtml(responseText)"></pre>
              <a-textarea
                :value="responseText"
                :style="{ height: Math.max(200, editorHeight - 40) + 'px' }"
                readonly
                class="readonly-response"
                placeholder="响应内容..."
                ref="responseTextareaRef"
              />
            </div>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick, h } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SendOutlined, 
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TableOutlined,
  FileTextOutlined
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
const selectedRequestId = ref<string | null>(null); // 保存选中请求的 ID，用于保持选中状态
const filterText = ref('');
const showCurrentDomainOnly = ref(false); // 默认不限制当前域名
const hideStaticResources = ref(false);
const requestText = ref('');
const responseText = ref('');
const isSendingRequest = ref(false);
const selectedMethod = ref<string>('');

// 拖拽相关
const leftWidth = ref(30);
const rightWidth = ref(70);
const isResizing = ref(false);

// 列表收缩状态
const isListCollapsed = ref(false); // 默认展开

// 请求视图模式
const requestViewMode = ref<'text' | 'table'>('text');
const highlightedRequestText = ref('');

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedText = ref('');
const targetElement = ref<HTMLElement | null>(null);
const requestTextareaRef = ref<HTMLTextAreaElement>();
const requestListRef = ref<HTMLElement | null>(null);

const responseTextareaRef = ref<HTMLTextAreaElement>();

// 历史记录相关
const history = ref<Array<{ type: string; originalText: string; newText: string; timestamp: number }>>([]);
const historyIndex = ref(-1);
const maxHistorySize = 50;
let isUpdatingFromHistory = false; // 标记是否正在从历史记录更新，避免循环

// 动态高度相关
const editorHeight = ref(400);

// 解析请求文本
const parsedRequest = computed(() => {
  if (!requestText.value) {
    return { method: '', path: '', version: '', headers: [], body: '' };
  }
  
  const lines = requestText.value.split('\n');
  const result: {
    method: string;
    path: string;
    version: string;
    headers: Array<{ key: string; value: string }>;
    body: string;
  } = {
    method: '',
    path: '',
    version: '',
    headers: [],
    body: ''
  };
  
  let bodyStartIndex = -1;
  
  // 解析请求行
  if (lines.length > 0) {
    const requestLine = lines[0].trim();
    const parts = requestLine.split(' ');
    if (parts.length >= 3) {
      result.method = parts[0];
      result.path = parts[1];
      result.version = parts[2];
    }
  }
  
  // 解析请求头
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      bodyStartIndex = i;
      break;
    }
    if (line.includes(': ')) {
      const colonIndex = line.indexOf(': ');
      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 2);
      result.headers.push({ key, value });
    }
  }
  
  // 解析请求体
  if (bodyStartIndex >= 0 && bodyStartIndex < lines.length - 1) {
    result.body = lines.slice(bodyStartIndex + 1).join('\n');
  }
  
  return result;
});

// 更新语法高亮文本
const updateHighlightedText = () => {
  if (!requestText.value) {
    highlightedRequestText.value = '';
    return;
  }
  
  const lines = requestText.value.split('\n');
  const highlightedLines = lines.map(line => {
    // HTTP 方法行
    if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|WEBSOCKET)\s/.test(line)) {
      const methodMatch = line.match(/^(\w+)\s/);
      if (methodMatch) {
        const method = methodMatch[1];
        const rest = line.substring(method.length);
        return `<span class="http-method">${escapeHtml(method)}</span>${escapeHtml(rest)}`;
      }
    }
    
    // HTTP 版本行
    if (line.startsWith('HTTP/')) {
      return `<span class="http-version">${escapeHtml(line)}</span>`;
    }
    
    // Header 行 (格式: Key: Value)
    if (line.includes(': ') && !line.startsWith('HTTP/')) {
      const colonIndex = line.indexOf(': ');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 2);
        return `<span class="http-header-key">${escapeHtml(key)}</span>: <span class="http-header-value">${escapeHtml(value)}</span>`;
      }
    }
    
    return escapeHtml(line);
  });
  
  highlightedRequestText.value = highlightedLines.join('\n');
};

// HTML 转义函数
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 监听 requestText 变化，更新高亮
// 用于跟踪上一次的文本值，用于历史记录
let lastRequestText = '';

watch(requestText, (newText, oldText) => {
  updateHighlightedText();
  
  // 自动记录历史（仅在用户输入时，不是程序修改）
  if (!isUpdatingFromHistory && oldText !== undefined && newText !== oldText && oldText !== '') {
    // 确保 targetElement 指向请求编辑器
    if (!targetElement.value && requestTextareaRef.value) {
      targetElement.value = requestTextareaRef.value;
    }
    
    // 记录历史（避免重复记录相同的文本）
    if (targetElement.value && oldText !== lastRequestText && newText !== lastRequestText) {
      addToHistory({
        type: '文本编辑',
        originalText: oldText,
        newText: newText,
        timestamp: Date.now()
      });
      lastRequestText = newText;
      console.log('📝 Auto-added to history:', {
        oldLength: oldText.length,
        newLength: newText.length,
        historyLength: history.value.length
      });
    }
  }
  
  // 如果请求文本发生变化（且不是初始加载），标记响应可能已过期
  if (oldText && newText !== oldText && responseText.value && !responseText.value.includes('(响应已过期')) {
    // 检查响应是否包含实际的响应数据（不是占位符）
    const hasRealResponse = responseText.value && 
      !responseText.value.includes('(点击"Send Request"') &&
      !responseText.value.includes('(响应头已收到');
    
    if (hasRealResponse) {
      // 在响应文本前添加过期提示
      const lines = responseText.value.split('\n');
      if (lines.length > 0 && !lines[0].includes('(响应已过期')) {
        lines.unshift('(响应已过期 - 请求已修改，请点击"Send Request"按钮获取新响应)');
        responseText.value = lines.join('\n');
      }
    }
  }
}, { immediate: true });

// 处理请求文本变化
const handleRequestTextChange = (event: Event) => {
  const target = event.target as HTMLElement;
  requestText.value = target.innerText;
};

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

// 截断 URL 显示
const truncateUrl = (url: string, maxLength: number = 60): string => {
  if (url.length <= maxLength) {
    return url;
  }
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    const search = urlObj.search;
    
    // 基础部分：协议 + 主机名
    const base = `${protocol}//${hostname}`;
    
    // 如果基础部分就已经超过限制，直接截断
    if (base.length >= maxLength) {
      return url.substring(0, maxLength - 3) + '...';
    }
    
    // 剩余可用长度
    const remainingLength = maxLength - base.length - 3; // 3 是 "..." 的长度
    
    // 路径和查询参数
    const fullPath = pathname + search;
    
    if (fullPath.length <= remainingLength) {
      return base + fullPath;
    } else {
      // 截断路径部分
      const truncatedPath = fullPath.substring(0, remainingLength);
      return base + truncatedPath + '...';
    }
  } catch {
    // 如果 URL 解析失败，直接截断
    return url.substring(0, maxLength - 3) + '...';
  }
};

// 监听 props.requests 的变化，只在选中请求的响应数据更新时更新引用
// 避免频繁触发导致焦点丢失
watch(() => {
  if (selectedRequestId.value) {
    const request = props.requests.find(req => req.id === selectedRequestId.value);
    if (request) {
      // 只监听响应相关的字段变化
      return `${request.id}-${request.status}-${request.responseTime}-${request.responseBody?.substring(0, 100) || ''}`;
    }
  }
  return null;
}, (newVal, oldVal) => {
  // 只有当值真正变化时才更新（避免初始化时的触发）
  if (newVal && newVal !== oldVal && selectedRequestId.value) {
    const updatedRequest = props.requests.find(req => req.id === selectedRequestId.value);
    if (updatedRequest && selectedRequest.value) {
      // 只有当响应数据真正变化时才更新（避免不必要的更新导致焦点丢失）
      const currentResponseHash = `${selectedRequest.value.status}-${selectedRequest.value.responseBody?.substring(0, 100) || ''}`;
      const newResponseHash = `${updatedRequest.status}-${updatedRequest.responseBody?.substring(0, 100) || ''}`;
      
      if (currentResponseHash !== newResponseHash) {
        // 更新 selectedRequest 的引用，确保使用最新的数据
        selectedRequest.value = updatedRequest;
        // 重新加载响应到查看器（确保响应数据正确显示）
        loadResponseToViewer(updatedRequest);
        // 确保选中状态在 DOM 中正确显示
        nextTick(() => {
          if (requestListRef.value && selectedRequestId.value) {
            const item = requestListRef.value.querySelector(`[data-request-id="${selectedRequestId.value}"]`);
            if (item && !item.classList.contains('active')) {
              item.classList.add('active');
            }
          }
        });
      }
    }
  }
}, { immediate: false });

// 滚动到选中的列表项
const scrollToSelectedItem = () => {
  if (!requestListRef.value || !selectedRequestId.value) return;
  
  nextTick(() => {
    // 使用 data-request-id 属性来查找，更可靠
    const activeItem = requestListRef.value?.querySelector(`[data-request-id="${selectedRequestId.value}"]`);
    if (activeItem) {
      // 确保 active 类已应用
      activeItem.classList.add('active');
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      // 如果找不到，尝试使用 .active 类
      const fallbackItem = requestListRef.value?.querySelector('.active');
      if (fallbackItem) {
        fallbackItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
};

// 计算属性 - 过滤后的请求
const filteredRequests = computed(() => {
  let filtered = props.requests;
  
  // 静态资源过滤
  if (!hideStaticResources.value) {
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

// 切换列表收缩/展开
const toggleListCollapse = () => {
  isListCollapsed.value = !isListCollapsed.value;
};

// 判断请求是否被选中
const isRequestSelected = (requestId: string): boolean => {
  if (!selectedRequestId.value) return false;
  return String(selectedRequestId.value) === String(requestId);
};

// 方法
const selectRequest = (request: HttpRequest) => {
  // 保存选中请求的 ID（这是关键，确保焦点保持）
  selectedRequestId.value = request.id;
  
  // 从 props.requests 中找到最新的请求对象，确保使用最新的数据（包括响应数据）
  const latestRequest = props.requests.find(req => req.id === request.id) || request;
  selectedRequest.value = latestRequest;
  
  loadRequestToEditor(latestRequest);
  console.log('📝 Selected request:', latestRequest.url, 'ID:', latestRequest.id, 'Has response:', !!(latestRequest.responseBody));
  
  // 使用 nextTick 确保 DOM 更新后焦点正确
  nextTick(() => {
    // 确保选中状态在 DOM 中正确显示
    if (requestListRef.value && selectedRequestId.value) {
      const item = requestListRef.value.querySelector(`[data-request-id="${selectedRequestId.value}"]`);
      if (item) {
        // 移除其他项的 active 类
        requestListRef.value.querySelectorAll('.active').forEach(el => {
          if (el !== item) {
            el.classList.remove('active');
          }
        });
        // 添加当前项的 active 类
        item.classList.add('active');
        // 确保滚动到可见位置
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
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
  // 确保 targetElement 指向请求编辑器
  if (!targetElement.value && requestTextareaRef.value) {
    targetElement.value = requestTextareaRef.value;
  }
  
  if (historyIndex.value >= 0 && history.value.length > 0) {
    const operation = history.value[historyIndex.value];
    const target = targetElement.value as HTMLTextAreaElement || requestTextareaRef.value;
    
    if (target) {
      // 标记正在从历史记录更新，避免触发新的历史记录
      isUpdatingFromHistory = true;
      
      // 直接使用原始文本
      const newValue = operation.originalText;
      
      target.value = newValue;
      requestText.value = newValue;
      lastRequestText = newValue;
      
      // 触发input事件以更新Vue的v-model
      target.dispatchEvent(new Event('input', { bubbles: true }));
      
      historyIndex.value--;
      
      // 重置标记
      setTimeout(() => {
        isUpdatingFromHistory = false;
      }, 100);
      
      message.success(`已撤销: ${operation.type}`);
      console.log('↩️ Undo:', operation.type, 'History index:', historyIndex.value, 'Remaining:', historyIndex.value + 1);
    } else {
      message.warning('无法找到目标元素');
      isUpdatingFromHistory = false;
    }
  } else {
    console.log('⚠️ No undo history:', {
      historyIndex: historyIndex.value,
      historyLength: history.value.length,
      hasTargetElement: !!targetElement.value,
      history: history.value.slice(0, 3)
    });
    message.warning('没有可撤销的操作');
  }
};

// 重做操作
const redo = () => {
  // 确保 targetElement 指向请求编辑器
  if (!targetElement.value && requestTextareaRef.value) {
    targetElement.value = requestTextareaRef.value;
  }
  
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const operation = history.value[historyIndex.value];
    const target = targetElement.value as HTMLTextAreaElement || requestTextareaRef.value;
    
    if (target) {
      // 标记正在从历史记录更新，避免触发新的历史记录
      isUpdatingFromHistory = true;
      
      // 直接使用新文本
      const newValue = operation.newText;
      
      target.value = newValue;
      requestText.value = newValue;
      lastRequestText = newValue;
      
      // 触发input事件以更新Vue的v-model
      target.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 重置标记
      setTimeout(() => {
        isUpdatingFromHistory = false;
      }, 100);
      
      message.success(`已重做: ${operation.type}`);
      console.log('↪️ Redo:', operation.type, 'History index:', historyIndex.value);
    } else {
      message.warning('无法找到目标元素');
      isUpdatingFromHistory = false;
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


// 将cookies数组转换为Cookie header字符串
const formatCookiesToString = (cookies: chrome.cookies.Cookie[]): string => {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
};

const loadRequestToEditor = (request: HttpRequest) => {
  // 设置选中的方法
  selectedMethod.value = request.method;
  
  // 调试信息：检查请求头和cookies
  console.log('🔍 Loading request to editor:', {
    url: request.url,
    method: request.method,
    headersCount: request.headers ? Object.keys(request.headers).length : 0,
    hasCookie: request.headers && (!!request.headers['Cookie'] || !!request.headers['cookie']),
    cookieValue: request.headers && (request.headers['Cookie'] || request.headers['cookie'] || 'No cookie'),
    cookiesCount: request.cookies ? request.cookies.length : 0,
    cookies: request.cookies,
    allHeaders: request.headers
  });
  
  // 检查是否为WebSocket请求
  const isWebSocket = request.method === 'WEBSOCKET' || 
                      request.url.startsWith('ws://') || 
                      request.url.startsWith('wss://');
  
  // 将请求转换为原始HTTP格式
  const url = new URL(request.url);
  let requestLines = [];
  
  // 请求行 - WebSocket请求使用GET方法进行握手
  if (isWebSocket) {
    requestLines.push(`GET ${url.pathname}${url.search} HTTP/1.1`);
    requestLines.push(`Host: ${url.host}`);
    requestLines.push(`Upgrade: websocket`);
    requestLines.push(`Connection: Upgrade`);
  } else {
    requestLines.push(`${request.method} ${url.pathname}${url.search} HTTP/1.1`);
    requestLines.push(`Host: ${url.host}`);
  }
  
  // 请求头 - 格式化显示
  const headers: Record<string, string> = { ...(request.headers || {}) };
  
  // 如果从chrome.cookies API获取到了cookies，且headers中没有Cookie，则添加
  if (request.cookies && request.cookies.length > 0) {
    const cookieString = formatCookiesToString(request.cookies);
    // 如果headers中已经有Cookie，则合并；否则添加新的
    if (headers['Cookie'] || headers['cookie']) {
      // 合并现有的Cookie header和新的cookies
      const existingCookie = headers['Cookie'] || headers['cookie'] || '';
      headers['Cookie'] = existingCookie ? `${existingCookie}; ${cookieString}` : cookieString;
      // 删除小写的cookie（如果有）
      if (headers['cookie'] && headers['Cookie']) {
        delete headers['cookie'];
      }
    } else {
      headers['Cookie'] = cookieString;
    }
  }
  
  // 输出所有请求头
  for (const [key, value] of Object.entries(headers)) {
    requestLines.push(`${key}: ${value}`);
  }
  
  // 空行分隔
  requestLines.push('');
  
  // 请求体
  if (request.body) {
    requestLines.push(request.body);
  }
  
  requestText.value = requestLines.join('\n');
  
  console.log('📝 Final request text:', requestText.value);
  
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
  
  // 响应体 - 优先使用已保存的响应体
  if (request.responseBody && request.responseBody.trim()) {
    responseLines.push(request.responseBody);
  } else if (request.status && typeof request.status === 'number') {
    // 如果有状态码但没有响应体，说明响应头已收到但响应体未捕获
    responseLines.push('(响应头已收到，但响应体未捕获。点击"Send Request"按钮重新获取完整响应)');
  } else {
    responseLines.push('(点击"Send Request"按钮发起请求后获得完整响应体)');
  }
  
  responseText.value = responseLines.join('\n');
  
  console.log('📥 Loaded response to viewer:', {
    url: request.url,
    status: request.status,
    hasResponseBody: !!(request.responseBody && request.responseBody.trim()),
    responseBodyLength: request.responseBody ? request.responseBody.length : 0
  });
};

const sendRequest = async () => {
  if (!selectedRequest.value) {
    message.warning('请先选择一个请求');
    return;
  }
  
  // 保存当前选中的 ID，确保在请求过程中不会丢失
  const currentSelectedId = selectedRequestId.value || selectedRequest.value.id;
  if (!currentSelectedId) {
    message.warning('无法确定选中的请求');
    return;
  }
  
  // 确保 selectedRequestId 已设置
  selectedRequestId.value = currentSelectedId;
  
  isSendingRequest.value = true;
  
  try {
    // 优先使用请求编辑器中的修改内容，如果没有修改则使用原始请求数据
    const originalRequest = selectedRequest.value;
    let method: string;
    let fullUrl: string;
    let headers: Record<string, string>;
    let body: string;
    
    // 检查请求编辑器是否有内容，如果有则解析使用
    if (requestText.value && requestText.value.trim()) {
      const parsed = parsedRequest.value;
      
      if (parsed.method && parsed.path) {
        // 使用解析出的方法
        method = parsed.method;
        
        // 构建完整 URL：从原始请求获取基础 URL（协议+主机名），然后使用解析出的路径
        try {
          const originalUrlObj = new URL(originalRequest.url);
          const baseUrl = `${originalUrlObj.protocol}//${originalUrlObj.host}`;
          
          // 如果路径是完整 URL，直接使用；否则拼接基础 URL
          if (parsed.path.startsWith('http://') || parsed.path.startsWith('https://')) {
            fullUrl = parsed.path;
          } else {
            fullUrl = baseUrl + parsed.path;
          }
        } catch {
          // 如果 URL 解析失败，使用原始 URL
          fullUrl = originalRequest.url;
        }
        
        // 使用解析出的头部
        headers = {};
        parsed.headers.forEach(header => {
          headers[header.key] = header.value;
        });
        
        // 使用解析出的请求体
        body = parsed.body || '';
        
        console.log('📝 Using edited request from editor:', {
          method,
          url: fullUrl,
          headersCount: Object.keys(headers).length,
          bodyLength: body.length
        });
      } else {
        // 如果解析失败，回退到原始请求数据
        method = originalRequest.method;
        fullUrl = originalRequest.url;
        headers = { ...originalRequest.headers };
        body = originalRequest.body || '';
        
        console.log('⚠️ Failed to parse edited request, using original:', {
          method,
          url: fullUrl
        });
      }
    } else {
      // 如果请求编辑器为空，使用原始请求数据
      method = originalRequest.method;
      fullUrl = originalRequest.url;
      headers = { ...originalRequest.headers };
      body = originalRequest.body || '';
    }
    
    // 保存原始请求数据，用于在找不到请求时查找相似请求
    const originalUrl = originalRequest.url;
    const originalMethod = originalRequest.method;
    
    console.log('🚀 Sending single request:', {
      url: fullUrl,
      method: method,
      headers: headers,
      body: body,
      selectedId: currentSelectedId
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
      
      // 更新选中请求的状态，并保持选中状态
      // 由于发送请求时，background script 可能会捕获并去重请求，我们需要等待一段时间
      // 然后查找新的请求（相同 URL 和方法）并更新选中状态
      
      // 首先尝试立即更新
      const selectedId = currentSelectedId;
      let requestIndex = props.requests.findIndex(req => req.id === selectedId);
      let targetRequest: HttpRequest | null = null;
      
      if (requestIndex !== -1) {
        // 找到了原始请求，直接更新
        targetRequest = props.requests[requestIndex];
        targetRequest.status = response.status;
        targetRequest.responseTime = responseTime;
        targetRequest.responseHeaders = responseHeaders;
        targetRequest.responseBody = responseBody;
        
        console.log('✅ Updated request in props.requests:', targetRequest.id, 'Status:', targetRequest.status);
      } else {
        // 请求可能被去重了，等待一段时间后查找新的请求
        console.debug('ℹ️ Request not found immediately, waiting for background script to process...');
        
        // 等待最多 500ms，每 50ms 检查一次
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 50;
        
        while (attempts < maxAttempts && !targetRequest) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          
          // 查找相同 URL 和方法的请求（可能是去重后的新请求）
          const similarRequest = props.requests.find(req => 
            req.url === originalUrl && req.method === originalMethod
          );
          
          if (similarRequest) {
            // 找到了相似请求，更新它
            similarRequest.status = response.status;
            similarRequest.responseTime = responseTime;
            similarRequest.responseHeaders = responseHeaders;
            similarRequest.responseBody = responseBody;
            
            targetRequest = similarRequest;
            console.log('✅ Found and updated similar request (after deduplication):', targetRequest.id);
            break;
          }
          
          attempts++;
        }
        
        // 如果还是找不到，更新 selectedRequest.value
        if (!targetRequest && selectedRequest.value) {
          if (selectedRequest.value.id === selectedId || !selectedRequestId.value) {
            selectedRequest.value.status = response.status;
            selectedRequest.value.responseTime = responseTime;
            selectedRequest.value.responseHeaders = responseHeaders;
            selectedRequest.value.responseBody = responseBody;
            
            targetRequest = selectedRequest.value;
            console.log('✅ Updated selectedRequest.value (fallback):', targetRequest.id);
          }
        }
      }
      
      // 更新选中状态
      if (targetRequest) {
        // 确保 selectedRequest.value 指向更新后的对象（保持引用一致）
        selectedRequest.value = targetRequest;
        selectedRequestId.value = targetRequest.id;
        
        // 使用 nextTick 确保在 DOM 更新后重新设置选中状态
        nextTick(() => {
          scrollToSelectedItem();
          // 重新加载响应到查看器（使用更新后的请求对象）
          loadResponseToViewer(targetRequest!);
        });
      } else {
        // 如果都找不到，至少保持 selectedRequestId
        selectedRequestId.value = selectedId;
        console.warn('⚠️ Could not update request, but keeping selectedRequestId:', selectedId);
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
          
          // 更新选中请求的状态，并保持选中状态
          // 由于发送请求时，background script 可能会捕获并去重请求，我们需要等待一段时间
          // 然后查找新的请求（相同 URL 和方法）并更新选中状态
          
          const selectedId = currentSelectedId;
          const responseTime = Date.now() - startTime;
          const responseHeaders = {
            'Content-Type': proxyResponse.headers.get('content-type') || 'text/plain',
            'Content-Length': proxyBody.length.toString()
          };
          
          // 首先尝试立即更新
          let requestIndex = props.requests.findIndex(req => req.id === selectedId);
          let targetRequest: HttpRequest | null = null;
          
          if (requestIndex !== -1) {
            // 找到了原始请求，直接更新
            targetRequest = props.requests[requestIndex];
            targetRequest.status = proxyResponse.status;
            targetRequest.responseTime = responseTime;
            targetRequest.responseHeaders = responseHeaders;
            targetRequest.responseBody = proxyBody;
            
            console.log('✅ Updated request in props.requests (proxy):', targetRequest.id, 'Status:', targetRequest.status);
          } else {
            // 请求可能被去重了，等待一段时间后查找新的请求
            console.debug('ℹ️ Request not found immediately (proxy), waiting for background script to process...');
            
            // 等待最多 500ms，每 50ms 检查一次
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = 50;
            
            while (attempts < maxAttempts && !targetRequest) {
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              
              // 查找相同 URL 和方法的请求（可能是去重后的新请求）
              const similarRequest = props.requests.find(req => 
                req.url === originalUrl && req.method === originalMethod
              );
              
              if (similarRequest) {
                // 找到了相似请求，更新它
                similarRequest.status = proxyResponse.status;
                similarRequest.responseTime = responseTime;
                similarRequest.responseHeaders = responseHeaders;
                similarRequest.responseBody = proxyBody;
                
                targetRequest = similarRequest;
                console.log('✅ Found and updated similar request (proxy, after deduplication):', targetRequest.id);
                break;
              }
              
              attempts++;
            }
            
            // 如果还是找不到，更新 selectedRequest.value
            if (!targetRequest && selectedRequest.value) {
              if (selectedRequest.value.id === selectedId || !selectedRequestId.value) {
                selectedRequest.value.status = proxyResponse.status;
                selectedRequest.value.responseTime = responseTime;
                selectedRequest.value.responseHeaders = responseHeaders;
                selectedRequest.value.responseBody = proxyBody;
                
                targetRequest = selectedRequest.value;
                console.log('✅ Updated selectedRequest.value (proxy fallback):', targetRequest.id);
              }
            }
          }
          
          // 更新选中状态
          if (targetRequest) {
            // 确保 selectedRequest.value 指向更新后的对象（保持引用一致）
            selectedRequest.value = targetRequest;
            selectedRequestId.value = targetRequest.id;
            
            // 使用 nextTick 确保在 DOM 更新后重新设置选中状态
            nextTick(() => {
              scrollToSelectedItem();
              // 重新加载响应到查看器（使用更新后的请求对象）
              loadResponseToViewer(targetRequest!);
            });
          } else {
            // 如果都找不到，至少保持 selectedRequestId
            selectedRequestId.value = selectedId;
            console.warn('⚠️ Could not update request (proxy), but keeping selectedRequestId:', selectedId);
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

const getMethodColor = (method: string) => {
  const upperMethod = method.toUpperCase();
  switch (upperMethod) {
    case 'GET':
      return 'blue';
    case 'POST':
      return 'green';
    case 'PUT':
      return 'orange';
    case 'DELETE':
      return 'red';
    case 'PATCH':
      return 'purple';
    case 'HEAD':
      return 'cyan';
    case 'OPTIONS':
      return 'geekblue';
    case 'WEBSOCKET':
      return 'magenta';
    default:
      return 'default';
  }
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
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
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
  transition: width 0.3s ease;
  overflow: hidden;
  min-width: 0;
}

.request-list-panel.collapsed {
  border-right: none;
  min-width: 0;
  width: 0 !important;
}

.request-list-panel.collapsed .panel-header,
.request-list-panel.collapsed .filter-controls,
.request-list-panel.collapsed .request-list {
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.panel-header {
  padding: 14px 18px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.panel-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  letter-spacing: 0.2px;
  color: rgba(0, 0, 0, 0.85);
}

.collapse-btn {
  color: rgba(0, 0, 0, 0.65);
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  color: #1890ff;
  background-color: #f0f2f5;
  transform: scale(1.1);
}

.filter-controls {
  padding: 12px 18px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.filter-controls .ant-input {
  border-radius: 4px;
}

.filter-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.switch-label {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 500;
  white-space: nowrap;
}

.filter-controls .filter-switch {
  min-width: 36px;
  height: 18px;
  line-height: 16px;
  background-color: #d9d9d9;
  border-radius: 9px;
  margin: 0;
}

.filter-controls .filter-switch.ant-switch-checked {
  background-color: #1890ff;
}

.filter-controls .filter-switch .ant-switch-inner {
  font-size: 9px;
  padding: 0 4px;
  min-width: 16px;
  color: #ffffff;
  font-weight: 600;
}

.filter-controls .filter-switch .ant-switch-handle {
  width: 14px;
  height: 14px;
  top: 2px;
  left: 2px;
}

.filter-controls .filter-switch.ant-switch-checked .ant-switch-handle {
  left: calc(100% - 16px);
}

.filter-controls .filter-switch.ant-switch-checked .ant-switch-inner {
  margin-left: 0;
  margin-right: 18px;
}

.filter-controls .filter-switch .ant-switch-inner-unchecked {
  margin-left: 18px;
  margin-right: 0;
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
  background: linear-gradient(90deg, #e6f7ff 0%, #f0f8ff 100%) !important;
  border-left: 3px solid #1890ff;
  box-shadow: -2px 0 8px rgba(24, 144, 255, 0.15);
}

.request-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0; /* 允许子元素收缩 */
}

.request-info .method-tag {
  flex-shrink: 0; /* 方法标签不收缩，保持固定宽度 */
}

.method-tag {
  font-size: 9px;
  min-width: 35px;
  max-width: 55px;
  text-align: center;
  font-weight: 600;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 2px 4px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  flex-shrink: 0;
  box-sizing: border-box;
}

.url {
  display: block;
  flex: 1;
  min-width: 0; /* 允许收缩和截断 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.2s ease;
  vertical-align: middle;
}

.request-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.editor-panel {
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.editor-toolbar {
  padding: 12px 18px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.request-editor h4,
.response-viewer h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
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
  font-size: 13px;
  font-weight: 600;
}

/* 确保编辑器容器能够正确滚动 */
.request-editor,
.response-viewer {
  position: relative;
}

.request-editor .ant-textarea {
  flex: 1;
  overflow-y: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

/* HTTP请求格式化样式 */
.request-editor .ant-textarea {
  position: relative;
}

/* 请求编辑器头部 */
.request-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8e8e8;
}

.request-editor-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

/* 文本视图样式 */
.request-text-view {
  position: relative;
  height: 100%;
}

.http-request-editor-wrapper {
  position: relative;
  height: 100%;
}

.http-request-highlighted {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 4px 11px;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 6px;
}

.http-request-highlighted .http-method {
  color: #1890ff;
  font-weight: 700;
}

.http-request-highlighted .http-version {
  color: #52c41a;
  font-weight: 600;
}

.http-request-highlighted .http-header-key {
  color: #722ed1;
  font-weight: 700;
}

.http-request-highlighted .http-header-value {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

/* HTTP请求编辑器样式 */
.http-request-editor {
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  overflow-y: auto !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  resize: vertical !important;
  position: relative;
  z-index: 2;
  background: transparent !important;
  caret-color: #1890ff;
}

.http-request-editor::selection {
  background: rgba(24, 144, 255, 0.2);
}

/* 表格视图样式 */
.request-table-view {
  height: 100%;
  overflow-y: auto;
}

.request-table-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.request-line {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.request-line-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  min-width: 50px;
  margin-right: 8px;
}

.request-line-value {
  flex: 1;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-all;
}

.method-tag-small {
  font-size: 9px;
  padding: 2px 6px;
  font-weight: 600;
}

.headers-section {
  margin-top: 12px;
}

.headers-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e8e8e8;
}

.headers-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-row-item {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  transition: all 0.2s ease;
}

.header-row-item:hover {
  background: linear-gradient(135deg, #f0f8ff 0%, #ffffff 100%);
  border-color: #1890ff;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.1);
}

.header-key {
  min-width: 150px;
  margin-right: 12px;
  flex-shrink: 0;
}

.header-key-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
}

.header-value {
  flex: 1;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-all;
  line-height: 1.5;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
}

.body-section {
  margin-top: 12px;
}

.body-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e8e8e8;
}

.body-content {
  padding: 10px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  font-size: 11px;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: rgba(0, 0, 0, 0.85);
  max-height: 300px;
  overflow-y: auto;
}

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

/* 搜索框样式 */

/* 响应查看器头部 */
.response-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.response-viewer-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

/* 响应文本包装器 */
.response-text-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.response-highlighted {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 11px;
  margin: 0;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: transparent;
  white-space: pre-wrap;
  word-wrap: break-word;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.response-viewer .ant-textarea {
  position: relative;
  z-index: 2;
}

/* 搜索结果高亮 */

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
  font-size: 13px;
}

.resizer {
  width: 4px;
  background-color: #e8e8e8;
  cursor: col-resize;
  transition: all 0.2s ease;
  z-index: 1;
}

.resizer:hover {
  background-color: #1890ff;
  width: 6px;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
}

/* 展开按钮样式（当列表收缩时显示） */
.expand-button {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e8e8e8;
  border-left: none;
  border-radius: 0 6px 6px 0;
  padding: 10px 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
}

.expand-button:hover {
  background: linear-gradient(180deg, #e6f7ff 0%, #f0f8ff 100%);
  border-color: #1890ff;
  box-shadow: 2px 0 12px rgba(24, 144, 255, 0.25);
  transform: translateY(-50%) translateX(2px);
}

.expand-button .ant-btn {
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-button:hover .ant-btn {
  color: #1890ff;
}
</style>
