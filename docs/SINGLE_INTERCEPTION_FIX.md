# 单一拦截方式修复

## 问题描述

用户报告仍然存在重复记录问题：
```
GET https://pss.bdstatic.com/static/superman/js/components/invoke-97e9694cb9.js 200
GET https://pss.bdstatic.com/static/superman/js/components/invoke-97e9694cb9.js Pending
```

## 问题分析

### 根本原因
双重拦截机制导致的问题：
1. **webRequest API** 和 **injected script** 同时工作
2. 同一个请求被两个机制都捕获
3. 去重逻辑无法完全解决双重拦截的冲突

### 技术细节
- `webRequest` API 在请求发起时捕获
- `injected script` 在页面执行时捕获
- 两者捕获的时机和数据结构可能不同
- 导致状态更新不一致

## 解决方案

### 采用单一拦截方式
**完全禁用 injected script，只使用 webRequest API**

### 具体修改

#### 1. 禁用 injected script 监听
```typescript
// 暂时禁用injected script监听，避免与webRequest冲突
// window.addEventListener('message', (event) => {
//   // ... 监听逻辑
// });
```

#### 2. 禁用 injected script 注入
```typescript
// 暂时禁用injected script注入，避免与webRequest冲突
// const script = document.createElement('script');
// script.src = chrome.runtime.getURL('injected.js');
// // ... 注入逻辑
```

#### 3. 简化去重逻辑
```typescript
// 简化去重逻辑，只使用webRequest
const existingIndex = interceptedRequests.findIndex(
  req => req.url === request.url && 
         req.method === request.method && 
         Math.abs(req.timestamp - request.timestamp) < 2000 // 2秒内的请求认为是重复的
);
```

## 优势

### 1. 消除重复记录
- 只有一个拦截机制工作
- 每个请求只会被捕获一次
- 状态更新一致

### 2. 简化逻辑
- 不需要复杂的去重机制
- 减少状态冲突
- 更稳定的行为

### 3. 性能提升
- 减少不必要的脚本注入
- 降低内存使用
- 减少消息传递

## 潜在影响

### 1. 功能限制
- 无法捕获页面内的 fetch/XMLHttpRequest 调用
- 只能捕获通过 webRequest API 的请求
- 某些动态请求可能无法捕获

### 2. 兼容性
- webRequest API 在 Manifest V3 中有限制
- 某些请求类型可能无法拦截
- 需要适当的权限配置

## 验证步骤

1. **重新加载扩展**
2. **访问百度网站**
3. **检查请求列表**
4. **确认无重复记录**
5. **测试其他网站**

## 后续优化

如果发现某些请求无法捕获，可以考虑：

### 1. 重新启用 injected script
- 但使用更严格的去重逻辑
- 基于请求的唯一标识符
- 实现更智能的状态管理

### 2. 混合策略
- 主要使用 webRequest
- 对特定类型的请求使用 injected script
- 实现更精确的过滤

### 3. 状态机管理
- 实现请求状态的状态机
- 确保状态转换的一致性
- 避免状态冲突

## 技术说明

### webRequest API 优势
- 官方支持的拦截方式
- 更稳定的行为
- 更好的性能
- 完整的请求生命周期

### 当前配置
- 只使用 `chrome.webRequest` API
- 监听 `onBeforeRequest`, `onHeadersReceived`, `onCompleted`
- 2秒去重时间窗口
- 简化的状态管理

## 结论

通过禁用双重拦截，采用单一 webRequest 方式，应该能够：
1. 完全消除重复记录
2. 确保状态一致性
3. 提供更稳定的用户体验

如果用户发现某些请求无法捕获，我们可以根据具体情况调整策略。
