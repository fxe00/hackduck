import { createApp } from 'vue';
// @ts-ignore
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './styles.css';
import App from './components/App.vue';

// 创建Vue应用
const app = createApp(App);

// 注册Ant Design Vue
app.use(Antd);

// 挂载应用
app.mount('#app');

// 连接background script
console.log('🚀 DevTools app starting...');

if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🚀 Chrome runtime available, setting up message listeners...');
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 DevTools received message:', message);
    if (message.type === 'REQUEST_CAPTURED') {
      // 触发Vue组件更新
      window.dispatchEvent(new CustomEvent('hackduck-request-captured', {
        detail: message.data
      }));
    } else if (message.type === 'REQUEST_UPDATED') {
      // 触发Vue组件更新 - 使用不同的事件名
      window.dispatchEvent(new CustomEvent('hackduck-request-updated', {
        detail: message.data
      }));
    }
  });
  
  // 请求现有请求列表
  console.log('📨 Requesting existing requests...');
  chrome.runtime.sendMessage({ type: 'GET_REQUESTS' }, (response) => {
    console.log('📨 Received requests response:', response);
    if (response && response.requests) {
      window.dispatchEvent(new CustomEvent('hackduck-requests-loaded', {
        detail: response.requests
      }));
    }
  });
} else {
  console.log('❌ Chrome runtime not available');
}
