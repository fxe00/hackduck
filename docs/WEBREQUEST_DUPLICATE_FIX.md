# WebRequest重复记录修复

## 问题描述

用户报告每个请求都被记录了两次：
```
GET https://www.baidu.com/favicon.ico 200
GET https://www.baidu.com/favicon.ico Pending
GET https://passport.baidu.com/passApi/js/wrapper.js 200  
GET https://passport.baidu.com/passApi/js/wrapper.js Pending
```

## 问题分析

### 根本原因
**webRequest API的事件机制导致重复记录**

1. **onBeforeRequest事件**：在请求发起时触发，记录请求
2. **onCompleted事件**：在请求完成时触发，更新状态
3. **问题**：某些情况下，同一个请求的`onBeforeRequest`可能被触发多次

### 技术细节
- `details.requestId`是Chrome为每个请求分配的唯一标识符
- 同一个请求的`onBeforeRequest`不应该被触发多次
- 但实际观察发现确实存在重复触发的情况

## 解决方案

### 基于requestId的去重检查
在`onBeforeRequest`事件中添加基于`requestId`的去重检查：

```typescript
// 检查是否已存在相同的请求（基于requestId）
const existingIndex = interceptedRequests.findIndex(
  req => req.id.includes(details.requestId)
);

if (existingIndex === -1) {
  // 新请求，记录它
  const request: HttpRequest = {
    id: `${details.requestId}-${Date.now()}`,
    // ... 其他属性
  };
  interceptedRequests.unshift(request);
} else {
  // 请求已存在，跳过重复记录
  console.log('🔄 Request already exists, skipping duplicate');
}
```

### 关键改进

1. **requestId匹配**：使用`req.id.includes(details.requestId)`进行精确匹配
2. **重复检查**：在记录新请求前检查是否已存在
3. **跳过重复**：如果请求已存在，跳过记录并记录日志

## 修复效果

### 预期结果
1. **消除重复记录**：每个请求只显示一次
2. **状态一致性**：请求状态不会出现Pending/200交替
3. **更清晰的日志**：控制台会显示重复请求的跳过信息

### 验证步骤
1. 重新加载扩展
2. 访问百度网站
3. 检查请求列表
4. 确认每个请求只显示一次
5. 查看控制台日志确认去重工作

## 技术说明

### requestId机制
- Chrome为每个HTTP请求分配唯一的`requestId`
- 同一个请求的`requestId`在整个生命周期中保持不变
- 可以用来精确识别和去重请求

### 去重策略
- **精确匹配**：基于`requestId`进行匹配
- **时间戳**：结合时间戳确保唯一性
- **日志记录**：详细记录去重过程

### 性能考虑
- 去重检查的时间复杂度：O(n)
- 对于大量请求，可能需要优化
- 当前实现适合中等规模的请求量

## 调试信息

### 控制台日志
- `✅ New request intercepted via webRequest`：新请求被记录
- `🔄 Request already exists, skipping duplicate`：重复请求被跳过
- 包含详细的请求信息（URL、方法、requestId等）

### 故障排除
如果仍然出现重复记录：
1. 检查控制台日志
2. 确认requestId是否一致
3. 检查是否有其他事件监听器干扰
4. 验证扩展是否正确重新加载

## 后续优化

### 如果问题仍然存在
1. **更严格的去重**：基于URL+方法+时间戳的组合
2. **事件过滤**：只监听特定类型的事件
3. **状态机**：实现请求状态的状态机管理

### 性能优化
1. **索引优化**：使用Map而不是数组进行查找
2. **内存管理**：定期清理过期的请求记录
3. **批量处理**：批量处理请求更新

## 结论

通过基于`requestId`的去重检查，应该能够：
1. 完全消除重复记录
2. 确保每个请求只显示一次
3. 提供更稳定的用户体验

如果问题仍然存在，需要进一步调查webRequest API的具体行为。
