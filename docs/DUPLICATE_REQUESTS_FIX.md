# 重复请求修复

## 问题描述

用户报告发现以下问题：
1. **重复记录**：同一个请求被记录了多次
2. **状态不一致**：同一个请求有时显示为Pending，有时显示为200
3. **favicon.ico重复**：百度网站的favicon.ico请求被重复记录

## 问题分析

### 根本原因
1. **双重拦截**：同时启用了`webRequest` API和`injected script`
2. **去重逻辑不够严格**：1秒的时间窗口太短
3. **状态更新冲突**：不同来源的请求状态更新不同步

### 具体表现
```
GET https://www.baidu.com/favicon.ico 200
GET https://www.baidu.com/favicon.ico Pending  
GET https://www.baidu.com/favicon.ico 200
GET https://www.baidu.com/favicon.ico Pending
```

## 解决方案

### 1. 改进去重逻辑
- **时间窗口**：从1秒增加到5秒
- **智能更新**：当检测到重复请求时，更新现有请求而不是忽略
- **优先级**：injected script的请求优先于webRequest

### 2. 状态保护机制
- **状态升级保护**：只允许状态从低到高更新（避免从200降级到pending）
- **一致性检查**：确保状态更新的一致性

### 3. 代码改进

#### 去重逻辑改进
```typescript
// 检查是否已存在相同的请求（去重）- 更严格的去重逻辑
const existingIndex = interceptedRequests.findIndex(
  req => req.url === request.url && 
         req.method === request.method && 
         Math.abs(req.timestamp - request.timestamp) < 5000 // 5秒内的请求认为是重复的
);

if (existingIndex === -1) {
  // 新请求
  interceptedRequests.unshift(request);
} else {
  // 重复请求，智能更新
  const existingRequest = interceptedRequests[existingIndex];
  if (request.id.startsWith('injected-') && !existingRequest.id.startsWith('injected-')) {
    // injected script的请求通常有更完整的信息，更新现有请求
    Object.assign(existingRequest, request);
  }
}
```

#### 状态保护机制
```typescript
// 只有当状态更好时才更新（避免从200降级到pending）
if (!request.status || request.status < responseData.status || responseData.status < 400) {
  request.status = responseData.status;
  request.responseHeaders = responseData.headers;
  request.responseBody = responseData.body;
  request.responseTime = Date.now() - request.timestamp;
} else {
  console.log('🔄 Response update skipped (better status already exists)');
}
```

## 修复效果

### 预期改进
1. **消除重复记录**：同一个请求只会显示一次
2. **状态一致性**：请求状态不会出现不一致的情况
3. **更好的去重**：5秒时间窗口能更好地处理网络延迟

### 验证步骤
1. 重新加载扩展
2. 访问百度网站
3. 检查HackDuck面板中的请求列表
4. 确认favicon.ico等请求只显示一次
5. 确认状态显示一致

## 技术细节

### 去重策略
- **时间窗口**：5秒内的相同URL和方法的请求被认为是重复的
- **优先级**：injected script > webRequest
- **更新策略**：智能更新而不是简单忽略

### 状态保护
- **升级保护**：只允许状态从低到高更新
- **一致性**：确保最终状态的一致性
- **日志记录**：详细记录状态更新过程

## 注意事项

1. **性能影响**：5秒时间窗口可能会增加内存使用
2. **网络延迟**：需要根据实际网络情况调整时间窗口
3. **调试信息**：控制台会显示详细的去重和状态更新日志

## 后续优化

如果问题仍然存在，可以考虑：
1. **禁用其中一个拦截方式**：只使用webRequest或injected script
2. **更严格的去重**：基于请求的唯一标识符
3. **状态机**：实现请求状态的状态机管理
