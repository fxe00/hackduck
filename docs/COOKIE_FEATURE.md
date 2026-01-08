# Cookie 获取功能说明

## 功能概述

HackDuck 现在可以获取目标网站的所有 Cookie 信息，而不仅仅是从请求头中读取。

## 实现方式

### 1. 权限声明

在 `manifest.json` 中添加了 `cookies` 权限：

```json
{
  "permissions": ["cookies"]
}
```

### 2. 使用 Chrome Cookies API

使用 `chrome.cookies.getAll()` API 来获取指定域名的所有 Cookie：

```typescript
// 获取指定域名的所有Cookie
async function getAllCookiesForDomain(
  domain: string
): Promise<chrome.cookies.Cookie[]> {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "Failed to get cookies:",
          chrome.runtime.lastError.message
        );
        resolve([]);
        return;
      }
      resolve(cookies || []);
    });
  });
}
```

### 3. 自动获取 Cookie

在捕获 HTTP 请求时，会自动：

1. 从请求 URL 中提取域名
2. 使用 `chrome.cookies.getAll()` 获取该域名的所有 Cookie
3. 将 Cookie 信息添加到请求对象中

## 数据结构

### HttpRequest 类型更新

```typescript
export interface HttpRequest {
  // ... 其他字段
  cookies?: chrome.cookies.Cookie[]; // 从chrome.cookies API获取的完整cookie信息
}
```

### Cookie 对象结构

每个 Cookie 对象包含以下信息：

- `name`: Cookie 名称
- `value`: Cookie 值
- `domain`: Cookie 域名
- `path`: Cookie 路径
- `secure`: 是否仅通过 HTTPS 发送
- `httpOnly`: 是否仅通过 HTTP 访问（JavaScript 无法访问）
- `sameSite`: SameSite 属性
- `expirationDate`: 过期时间（时间戳）
- `storeId`: Cookie 存储 ID

## 使用场景

### 1. 查看完整 Cookie 信息

在 DevTools 面板中，可以查看每个请求关联的所有 Cookie，包括：

- Cookie 的完整属性
- 过期时间
- 安全设置

### 2. 调试 Cookie 问题

当请求缺少预期的 Cookie 时，可以：

- 查看该域名下实际存在的所有 Cookie
- 检查 Cookie 的域名、路径匹配规则
- 验证 Cookie 的安全设置

### 3. 重放请求时使用 Cookie

在重放请求时，可以使用获取到的 Cookie 信息来：

- 确保请求包含正确的 Cookie
- 调试认证问题
- 测试不同 Cookie 值的影响

## 注意事项

1. **权限要求**：需要用户授权 `cookies` 权限
2. **域名匹配**：Cookie API 使用域名匹配，可能需要处理子域名
3. **异步获取**：Cookie 获取是异步的，可能在请求捕获后稍晚才更新
4. **隐私考虑**：Cookie 包含敏感信息，确保遵守隐私政策

## 参考

- [Chrome Cookies API 文档](https://developer.chrome.com/docs/extensions/reference/cookies/)
- [Cookie-Editor 扩展](https://addons.mozilla.org/zh-CN/firefox/addon/cookie-editor/) - 参考实现
