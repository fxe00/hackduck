# HackDuck 拦截调试指南

## 🔍 问题诊断

### 当前问题
- 仍然抓不到HTTP请求
- CORB错误持续出现
- 13个请求显示但无法捕获

## 🛠️ 修复措施

### 1. 默认开启拦截
**问题**: 拦截功能默认关闭，用户需要手动开启
**解决**: 
```typescript
// 默认开启拦截
const isIntercepting = ref(true);

// 组件挂载时自动开启
onMounted(() => {
  chrome.runtime.sendMessage({
    type: 'TOGGLE_INTERCEPT',
    data: { intercepting: true }
  });
});
```

### 2. 增强调试日志
**问题**: 缺乏详细的调试信息
**解决**: 添加了详细的console.log输出

```typescript
console.log('WebRequest triggered:', { 
  url: details.url, 
  method: details.method, 
  isIntercepting,
  requestId: details.requestId 
});
```

### 3. 请求过滤优化
**问题**: 可能拦截了不应该拦截的请求
**解决**: 优化了URL过滤逻辑

```typescript
// 跳过扩展内部请求
if (details.url.startsWith('chrome-extension://') || 
    details.url.startsWith('moz-extension://') ||
    details.url.startsWith('edge-extension://') ||
    details.url.includes('devtools://')) {
  return;
}
```

## 🔍 调试步骤

### 1. 检查Service Worker
1. 打开 `chrome://extensions/`
2. 找到HackDuck扩展
3. 点击"检查视图：Service Worker"
4. 查看控制台是否有错误

### 2. 检查拦截状态
在Service Worker控制台中查看：
- `Intercepting toggled: true` - 拦截已开启
- `WebRequest triggered:` - webRequest被触发
- `✅ Request intercepted via webRequest:` - 请求被成功拦截

### 3. 检查DevTools面板
1. 打开任意网站
2. 按F12打开DevTools
3. 查看HackDuck面板
4. 检查请求列表是否显示

### 4. 测试不同网站
- 简单网站：如 `http://example.com`
- 复杂网站：如 `https://www.google.com`
- API请求：如 `https://api.github.com`

## 🚨 常见问题

### 问题1: 拦截开关显示关闭
**原因**: 组件状态与background script不同步
**解决**: 重新加载扩展，检查onMounted中的自动开启逻辑

### 问题2: webRequest不触发
**原因**: 权限不足或URL过滤过严
**解决**: 检查manifest.json权限，放宽URL过滤条件

### 问题3: 请求显示但状态不更新
**原因**: onCompleted监听器有问题
**解决**: 检查响应完成监听器的逻辑

## 📝 调试日志说明

### 正常日志流程
```
1. "Intercepting toggled: true" - 拦截开启
2. "WebRequest triggered: {...}" - 请求被触发
3. "✅ Request intercepted via webRequest: {...}" - 请求被拦截
4. "Request completed: {...}" - 请求完成
```

### 异常日志
```
1. "Intercepting is disabled, skipping request" - 拦截未开启
2. "Skipping extension/internal request: ..." - 跳过内部请求
3. "Failed to send message to devtools: ..." - 消息发送失败
```

## 🔧 下一步调试

如果问题仍然存在，请：

1. **完全重新安装扩展**
2. **检查控制台日志**，特别是Service Worker控制台
3. **测试简单网站**，如http://example.com
4. **提供完整的错误日志**

---

*调试指南更新时间: 2024年10月1日*
