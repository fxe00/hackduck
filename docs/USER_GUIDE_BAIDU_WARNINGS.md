# 用户指南：百度网站警告说明

## 重要说明

您看到的这些警告和错误**不是HackDuck扩展的问题**，而是百度网站本身的问题。

## 警告解释

### 1. "Deprecated feature used" 警告
```
Deprecated feature used
Unload event listeners are deprecated and will be removed.
```
- **来源**: 百度网站的JavaScript代码 (`all_async_search_75181ec.js`)
- **原因**: 百度使用了已弃用的`unload`事件监听器
- **影响**: 不影响网站功能，只是代码过时警告

### 2. "CORB (Cross-Origin Read Blocking)" 错误
```
Response was blocked by CORB (Cross-Origin Read Blocking)
```
- **来源**: 浏览器的安全机制
- **原因**: 百度的某些请求被浏览器安全策略阻止
- **影响**: 这是正常的浏览器安全行为

### 3. 被阻止的请求
所有被阻止的请求都是百度的内部请求：
- `ztbox?action=zpblog&appname=pcsearch&...`
- 这些是百度搜索页面的数据收集请求
- 被阻止是正常的，不影响网站使用

## HackDuck扩展状态

✅ **扩展功能正常** - 这些警告不影响HackDuck的工作

### 验证扩展功能
1. 打开Chrome DevTools (F12)
2. 查看"HackDuck"面板
3. 确认能看到HTTP请求列表
4. 测试请求编辑和发送功能

### 如果扩展不工作
如果HackDuck面板没有显示请求，请：
1. 刷新页面
2. 重新打开DevTools
3. 检查扩展是否已启用
4. 查看Console是否有扩展相关错误

## 建议

1. **忽略百度警告**: 这些是百度网站的问题，不是扩展问题
2. **测试其他网站**: 在Google、GitHub等网站测试HackDuck功能
3. **正常使用**: HackDuck应该能够正常拦截和显示HTTP请求

## 技术说明

- CORB是浏览器的安全特性，用于防止恶意网站读取敏感数据
- 百度的一些请求被CORB阻止是正常现象
- 我们的扩展已经过滤了这些有问题的请求，避免干扰

## 联系支持

如果您发现HackDuck扩展本身有问题（如无法显示请求、无法编辑请求等），请提供：
1. 具体的错误信息
2. 在哪个网站出现的问题
3. Chrome DevTools Console中的错误日志
