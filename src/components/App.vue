<template>
  <div class="hackduck-app">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <a-row :gutter="12" align="middle" justify="space-between">
        <!-- 左侧：模式切换 -->
        <a-col :span="6">
          <ModeSelector @mode-change="handleModeChange" ref="modeSelectorRef" />
        </a-col>
        
        <!-- 中间：操作按钮组 -->
        <a-col :span="12">
          <div class="toolbar-actions">
            <a-switch 
              v-model:checked="isIntercepting" 
              checked-children="拦截请求" 
              un-checked-children="停止拦截"
              @change="toggleIntercept"
            />
            <a-button @click="clearRequests" :icon="h(DeleteOutlined)">清空</a-button>
            <a-button @click="exportRequests" :icon="h(DownloadOutlined)">导出</a-button>
          </div>
        </a-col>
        
        <!-- 右侧：当前域名 -->
        <a-col :span="6">
          <div class="toolbar-right">
            <span class="current-domain" v-if="currentDomain">
              当前域名: {{ currentDomain }}
            </span>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- Burp Suite 模式 -->
      <BurpSuitePanel 
        v-if="currentMode === 'burp'"
        :requests="requests"
        :current-domain="currentDomain"
      />
      
      <!-- HackBar 模式 -->
      <HackBarPanel 
        v-if="currentMode === 'hackbar'"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { message } from 'ant-design-vue';
import { 
  DeleteOutlined, 
  DownloadOutlined
} from '@ant-design/icons-vue';
import type { HttpRequest } from '../types';
import ModeSelector from './ModeSelector.vue';
import BurpSuitePanel from './BurpSuitePanel.vue';
import HackBarPanel from './HackBarPanel.vue';

// 响应式数据
const isIntercepting = ref(true); // 默认开启拦截
const requests = ref<HttpRequest[]>([]);
const currentDomain = ref(''); // 当前域名
const currentMode = ref<'burp' | 'hackbar'>('burp'); // 当前模式
const modeSelectorRef = ref();

// 方法
const handleModeChange = (mode: 'burp' | 'hackbar') => {
  currentMode.value = mode;
  console.log('🔄 Mode changed to:', mode);
};

const toggleIntercept = (checked: boolean) => {
  isIntercepting.value = checked;
  chrome.runtime.sendMessage({
    type: 'TOGGLE_INTERCEPT',
    data: { intercepting: checked }
  });
};

const getCurrentDomain = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url);
        currentDomain.value = url.hostname;
        console.log('🌐 Current domain:', currentDomain.value);
      } catch (error) {
        console.error('Failed to parse current domain:', error);
      }
    }
  });
};

const clearRequests = () => {
  requests.value = [];
  chrome.runtime.sendMessage({
    type: 'CLEAR_REQUESTS'
  });
};

const exportRequests = () => {
  const data = JSON.stringify(requests.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hackduck-requests.json';
  a.click();
  URL.revokeObjectURL(url);
};


// 生命周期
onMounted(() => {
  // 自动开启拦截
  chrome.runtime.sendMessage({
    type: 'TOGGLE_INTERCEPT',
    data: { intercepting: true }
  });
  
  // 获取当前域名
  getCurrentDomain();
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'REQUEST_CAPTURED') {
      requests.value.unshift(message.data);
    } else if (message.type === 'REQUEST_UPDATED') {
      // 更新现有请求
      const index = requests.value.findIndex(req => req.id === message.data.id);
      if (index !== -1) {
        requests.value[index] = message.data;
      }
    }
  });
  
  // 监听自定义事件
  window.addEventListener('hackduck-request-captured', (event: any) => {
    requests.value.unshift(event.detail);
  });
  
  window.addEventListener('hackduck-request-updated', (event: any) => {
    const updatedRequest = event.detail;
    const existingIndex = requests.value.findIndex(
      req => req.url === updatedRequest.url && req.method === updatedRequest.method
    );
    
    if (existingIndex !== -1) {
      requests.value.splice(existingIndex, 1);
      requests.value.unshift(updatedRequest);
    } else {
      requests.value.unshift(updatedRequest);
    }
  });
  
  window.addEventListener('hackduck-requests-loaded', (event: any) => {
    requests.value = event.detail;
  });
});
</script>

<style>
/* 样式已移至 styles.css 文件 */
</style>