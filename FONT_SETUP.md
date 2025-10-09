# HackDuck 字体配置指南

## 📁 字体文件放置位置

将你的字体文件放在以下目录：
```
src/assets/fonts/
```

## 🎨 推荐字体

### 编程字体（用于代码显示）
- **JetBrains Mono** - 专为编程设计
- **Fira Code** - 支持连字符，美观
- **Source Code Pro** - Adobe开源
- **Cascadia Code** - 微软开源
- **Monaco** - macOS系统字体

### 界面字体（用于UI文本）
- **Inter** - 现代无衬线字体
- **Roboto** - Google设计
- **SF Pro Display** - Apple设计
- **Segoe UI** - Microsoft设计

## 📝 配置步骤

### 1. 下载字体文件
从以下网站下载你喜欢的字体：
- [Google Fonts](https://fonts.google.com/)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
- [Fira Code](https://github.com/tonsky/FiraCode)
- [Source Code Pro](https://github.com/adobe-fonts/source-code-pro)

### 2. 放置字体文件
将字体文件（.ttf, .woff2, .woff等格式）复制到：
```
src/assets/fonts/
```

### 3. 修改字体配置
编辑 `src/assets/fonts/fonts.css` 文件，更新字体路径：

```css
@font-face {
  font-family: 'HackDuck-Main';
  src: url('./fonts/你的字体文件名.woff2') format('woff2'),
       url('./fonts/你的字体文件名.woff') format('woff'),
       url('./fonts/你的字体文件名.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

### 4. 重新构建
```bash
npm run build
```

## 🎯 字体应用范围

- **界面文本** - 使用 HackDuck-Main 字体
- **代码显示** - 使用 HackDuck-Code 字体
- **请求/响应内容** - 使用 HackDuck-Code 字体
- **按钮和表单** - 使用 HackDuck-Main 字体

## 💡 字体优化建议

1. **使用 woff2 格式** - 文件更小，加载更快
2. **设置 font-display: swap** - 避免字体加载时的闪烁
3. **提供备用字体** - 确保字体加载失败时有备用方案
4. **考虑字体大小** - 代码字体建议 13-14px，界面字体建议 14-16px

## 🔧 自定义字体大小

在 `src/assets/fonts/fonts.css` 中调整：

```css
.code-textarea,
.readonly-response,
.request-textarea,
.response-textarea {
  font-family: 'HackDuck-Code', monospace;
  font-size: 13px; /* 调整代码字体大小 */
  line-height: 1.5; /* 调整行高 */
}
```

## 📱 响应式字体

```css
/* 小屏幕 */
@media (max-width: 768px) {
  .code-textarea {
    font-size: 12px;
  }
}

/* 大屏幕 */
@media (min-width: 1200px) {
  .code-textarea {
    font-size: 14px;
  }
}
```
