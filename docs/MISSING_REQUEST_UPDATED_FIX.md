# 缺失REQUEST_UPDATED监听器修复

## 问题描述

用户报告在修复消息循环后，现在连请求都捕获不到了：
> "现在如果我在开着插件的情况下刷新页面，根本一个请求都捕获不到"

## 问题分析

### 根本原因
**缺失REQUEST_UPDATED消息监听器**

1. **修复消息循环**：将`onBeforeRequest`中的消息类型改为`REQUEST_UPDATED`
2. **缺失监听器**：`devtools-app.ts`中没有监听`REQUEST_UPDATED`消息
3. **结果**：请求被捕获但无法传递到Vue组件

### 技术细节
```typescript
// background.ts - 发送REQUEST_UPDATED消息
chrome.runtime.sendMessage({
  type: 'REQUEST_UPDATED',  // 新消息类型
  data: request
});

// devtools-app.ts - 只监听REQUEST_CAPTURED
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CAPTURED') {  // 缺失REQUEST_UPDATED处理
    // 处理逻辑
  }
});
```

## 解决方案

### 添加REQUEST_UPDATED监听器
在`devtools-app.ts`中添加对`REQUEST_UPDATED`消息的监听：

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CAPTURED') {
    // 触发Vue组件更新
    window.dispatchEvent(new CustomEvent('hackduck-request-captured', {
      detail: message.data
    }));
  } else if (message.type === 'REQUEST_UPDATED') {
    // 触发Vue组件更新
    window.dispatchEvent(new CustomEvent('hackduck-request-captured', {
      detail: message.data
    }));
  }
});
```

### 消息流程
```
onBeforeRequest → 添加请求 → 发送REQUEST_UPDATED → devtools-app监听 → 触发Vue组件更新
```

## 修复效果

### 预期结果
1. **恢复请求捕获**：能够正常捕获HTTP请求
2. **正确的消息流**：REQUEST_UPDATED消息被正确处理
3. **Vue组件更新**：请求列表正常显示

### 验证步骤
1. 重新加载扩展
2. 打开DevTools
3. 访问百度网站
4. 检查HackDuck面板是否显示请求
5. 查看控制台日志

## 技术说明

### 消息类型
- **REQUEST_CAPTURED**：来自content script的新请求
- **REQUEST_UPDATED**：来自webRequest的请求更新

### 事件处理
- 两种消息类型都触发相同的Vue组件事件
- 确保请求列表能够正常更新
- 保持消息流的一致性

### 调试信息
控制台应该显示：
- `✅ New request intercepted via webRequest`：请求被捕获
- `✅ Request completed and updated`：请求状态更新

## 故障排除

### 如果仍然捕获不到请求
1. **检查扩展权限**：确认webRequest权限正确
2. **检查拦截状态**：确认isIntercepting为true
3. **检查控制台**：查看是否有错误信息
4. **重新安装扩展**：清除扩展数据重新安装

### 调试步骤
1. 打开Chrome DevTools
2. 查看Console标签页
3. 检查是否有HackDuck相关的日志
4. 确认webRequest事件是否触发

## 后续优化

### 消息处理优化
1. **统一消息处理**：使用统一的消息处理函数
2. **错误处理**：添加消息传递的错误处理
3. **性能优化**：减少不必要的消息传递

### 调试工具
1. **日志系统**：添加详细的调试日志
2. **状态监控**：监控拦截状态和消息流
3. **错误报告**：自动收集错误信息

## 结论

通过添加`REQUEST_UPDATED`消息监听器，应该能够：
1. 恢复请求捕获功能
2. 确保消息流正常工作
3. 提供稳定的用户体验

这是修复"捕获不到请求"问题的关键修复，确保消息流能够正常工作。
