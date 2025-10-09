<template>
  <div class="mode-selector">
    <a-radio-group 
      v-model:value="currentMode" 
      button-style="solid"
      @change="handleModeChange"
    >
      <a-radio-button value="burp">Burp Suite</a-radio-button>
      <a-radio-button value="hackbar">HackBar</a-radio-button>
    </a-radio-group>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// 定义事件
const emit = defineEmits<{
  modeChange: [mode: 'burp' | 'hackbar']
}>();

// 当前模式
const currentMode = ref<'burp' | 'hackbar'>('burp');

// 处理模式切换
const handleModeChange = (e: any) => {
  const mode = e.target.value;
  currentMode.value = mode;
  emit('modeChange', mode);
  console.log('🔄 Mode changed to:', mode);
};

// 暴露给父组件的方法
defineExpose({
  currentMode,
  setMode: (mode: 'burp' | 'hackbar') => {
    currentMode.value = mode;
  }
});
</script>

<style scoped>
.mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-selector .ant-radio-group {
  margin: 0;
}
</style>
