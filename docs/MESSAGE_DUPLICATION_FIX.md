# 消息重复导致的重复记录修复

## 问题描述

用户报告仍然存在重复记录问题，每个请求都被记录了两次：
```
GET https://www.baidu.com/favicon.ico 200
GET https://www.baidu.com/favicon.ico Pending
```

## 问题分析

### 根本原因
**消息循环导致的重复记录**

1. **onBeforeRequest事件**：创建请求并发送`REQUEST_CAPTURED`消息
2. **REQUEST_CAPTURED处理器**：接收消息并再次添加请求到数组
3. **结果**：同一个请求被添加了两次

### 技术细节
```typescript
// onBeforeRequest事件中
interceptedRequests.unshift(request);  // 第一次添加
chrome.runtime.sendMessage({
  type: 'REQUEST_CAPTURED',  // 发送消息
  data: request
});

// REQUEST_CAPTURED处理器中
interceptedRequests.unshift(request);  // 第二次添加（重复！）
```

## 解决方案

### 修复消息循环
将`onBeforeRequest`中的消息类型从`REQUEST_CAPTURED`改为`REQUEST_UPDATED`：

```typescript
// 修复前
chrome.runtime.sendMessage({
  type: 'REQUEST_CAPTURED',  // 会导致重复处理
  data: request
});

// 修复后
chrome.runtime.sendMessage({
  type: 'REQUEST_UPDATED',   // 只更新，不重复添加
  data: request
});
```

### 修复逻辑
1. **onBeforeRequest**：直接添加请求到数组，发送`REQUEST_UPDATED`消息
2. **REQUEST_CAPTURED处理器**：只处理来自content script的消息
3. **REQUEST_UPDATED处理器**：只更新现有请求，不添加新请求

## 修复效果

### 预期结果
1. **消除重复记录**：每个请求只显示一次
2. **正确的消息流**：避免消息循环
3. **状态一致性**：请求状态正确更新

### 消息流程
```
onBeforeRequest → 添加请求 → 发送REQUEST_UPDATED → 更新UI
onCompleted → 更新状态 → 发送REQUEST_UPDATED → 更新UI
```

## 技术说明

### 消息类型区分
- **REQUEST_CAPTURED**：来自content script的新请求
- **REQUEST_UPDATED**：请求状态更新（来自webRequest或content script）

### 避免循环
- webRequest事件直接操作数组，发送更新消息
- content script消息通过处理器添加，避免重复

### 性能优化
- 减少不必要的消息传递
- 避免重复的数组操作
- 更清晰的消息流

## 验证步骤

1. **重新加载扩展**
2. **访问百度网站**
3. **检查请求列表**
4. **确认每个请求只显示一次**
5. **查看控制台日志**

### 控制台日志
- `✅ New request intercepted via webRequest`：新请求被记录
- `🔄 Request already exists, skipping duplicate`：重复请求被跳过
- `✅ Request completed and updated`：请求状态更新

## 调试信息

### 如果问题仍然存在
1. 检查控制台是否有重复的日志
2. 确认消息类型是否正确
3. 验证数组操作是否重复
4. 检查是否有其他事件监听器干扰

### 故障排除
1. **清除扩展数据**：重新安装扩展
2. **检查权限**：确认webRequest权限正确
3. **验证消息流**：检查消息传递是否正确

## 后续优化

### 如果问题仍然存在
1. **完全禁用消息传递**：直接在webRequest中处理
2. **使用事件总线**：实现更清晰的事件管理
3. **状态机管理**：实现请求状态的状态机

### 性能优化
1. **批量更新**：批量处理请求更新
2. **防抖处理**：避免频繁的UI更新
3. **内存管理**：定期清理过期的请求记录

## 结论

通过修复消息循环问题，应该能够：
1. 完全消除重复记录
2. 确保每个请求只显示一次
3. 提供更稳定的用户体验

这是解决重复记录问题的关键修复，如果问题仍然存在，需要进一步调查其他可能的原因。
