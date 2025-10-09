<template>
  <div 
    v-if="visible" 
    class="context-menu"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @click.stop
  >
    <div class="context-menu-item" @click="encodeBase64">
      <span class="menu-icon">🔤</span>
      Base64 编码
    </div>
    <div class="context-menu-item" @click="decodeBase64">
      <span class="menu-icon">🔓</span>
      Base64 解码
    </div>
    <div class="context-menu-item" @click="encodeURL">
      <span class="menu-icon">🔗</span>
      URL 编码
    </div>
    <div class="context-menu-item" @click="decodeURL">
      <span class="menu-icon">🔓</span>
      URL 解码
    </div>
    <div class="context-menu-item" @click="encodeHTML">
      <span class="menu-icon">📝</span>
      HTML 编码
    </div>
    <div class="context-menu-item" @click="decodeHTML">
      <span class="menu-icon">🔓</span>
      HTML 解码
    </div>
    <div class="context-menu-item" @click="hashMD5">
      <span class="menu-icon">🔐</span>
      MD5 哈希
    </div>
    <div class="context-menu-item" @click="hashSHA256">
      <span class="menu-icon">🔐</span>
      SHA256 哈希
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import CryptoJS from 'crypto-js';

// Props
const props = defineProps<{
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  targetElement: HTMLElement | null;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  replaceText: [text: string];
  addToHistory: [operation: { type: string; originalText: string; newText: string; timestamp: number }];
}>();

// 编码方法
const encodeBase64 = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(props.selectedText)));
    replaceSelectedText(encoded);
    
    // 添加到历史记录
    emit('addToHistory', {
      type: 'Base64 编码',
      originalText: props.selectedText,
      newText: encoded,
      timestamp: Date.now()
    });
    
    message.success('Base64 编码完成');
  } catch (error) {
    message.error('Base64 编码失败');
  }
  emit('close');
};

const decodeBase64 = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  try {
    const decoded = decodeURIComponent(escape(atob(props.selectedText)));
    replaceSelectedText(decoded);
    
    // 添加到历史记录
    emit('addToHistory', {
      type: 'Base64 解码',
      originalText: props.selectedText,
      newText: decoded,
      timestamp: Date.now()
    });
    
    message.success('Base64 解码完成');
  } catch (error) {
    message.error('Base64 解码失败');
  }
  emit('close');
};

const encodeURL = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  const encoded = encodeURIComponent(props.selectedText);
  replaceSelectedText(encoded);
  
  // 添加到历史记录
  emit('addToHistory', {
    type: 'URL 编码',
    originalText: props.selectedText,
    newText: encoded,
    timestamp: Date.now()
  });
  
  message.success('URL 编码完成');
  emit('close');
};

const decodeURL = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  try {
    const decoded = decodeURIComponent(props.selectedText);
    replaceSelectedText(decoded);
    
    // 添加到历史记录
    emit('addToHistory', {
      type: 'URL 解码',
      originalText: props.selectedText,
      newText: decoded,
      timestamp: Date.now()
    });
    
    message.success('URL 解码完成');
  } catch (error) {
    message.error('URL 解码失败');
  }
  emit('close');
};

const encodeHTML = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  const encoded = props.selectedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  replaceSelectedText(encoded);
  
  // 添加到历史记录
  emit('addToHistory', {
    type: 'HTML 编码',
    originalText: props.selectedText,
    newText: encoded,
    timestamp: Date.now()
  });
  
  message.success('HTML 编码完成');
  emit('close');
};

const decodeHTML = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  const decoded = props.selectedText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  replaceSelectedText(decoded);
  
  // 添加到历史记录
  emit('addToHistory', {
    type: 'HTML 解码',
    originalText: props.selectedText,
    newText: decoded,
    timestamp: Date.now()
  });
  
  message.success('HTML 解码完成');
  emit('close');
};

const hashMD5 = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  try {
    const hash = CryptoJS.MD5(props.selectedText).toString();
    replaceSelectedText(hash);
    
    // 添加到历史记录
    emit('addToHistory', {
      type: 'MD5 哈希',
      originalText: props.selectedText,
      newText: hash,
      timestamp: Date.now()
    });
    
    message.success('MD5 哈希完成');
  } catch (error) {
    message.error('MD5 哈希失败');
  }
  emit('close');
};

const hashSHA256 = () => {
  if (!props.selectedText.trim()) {
    message.warning('没有选中文本');
    return;
  }
  try {
    const hash = CryptoJS.SHA256(props.selectedText).toString();
    replaceSelectedText(hash);
    
    // 添加到历史记录
    emit('addToHistory', {
      type: 'SHA256 哈希',
      originalText: props.selectedText,
      newText: hash,
      timestamp: Date.now()
    });
    
    message.success('SHA256 哈希完成');
  } catch (error) {
    message.error('SHA256 哈希失败');
  }
  emit('close');
};

// 替换选中文本
const replaceSelectedText = (newText: string) => {
  if (props.targetElement) {
    // 如果是textarea或input元素
    if (props.targetElement.tagName === 'TEXTAREA' || props.targetElement.tagName === 'INPUT') {
      const element = props.targetElement as HTMLTextAreaElement | HTMLInputElement;
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const value = element.value;
      const newValue = value.substring(0, start) + newText + value.substring(end);
      element.value = newValue;
      
      // 触发input事件以更新Vue的v-model
      element.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 设置新的选中范围
      const newStart = start;
      const newEnd = start + newText.length;
      element.setSelectionRange(newStart, newEnd);
    }
  }
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.context-menu')) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}
</style>
