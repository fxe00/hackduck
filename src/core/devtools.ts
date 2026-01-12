// 开发者工具面板初始化
// 防止重复创建面板（Firefox 兼容性）
if (typeof window !== 'undefined') {
  // 使用全局标志防止重复创建
  if ((window as any).__hackduck_panel_created_v3) {
    console.log('⚠️ HackDuck panel already created, skipping...');
  } else {
    (window as any).__hackduck_panel_created_v3 = true;
    
    // 检测浏览器 API
    // @ts-ignore - browser API 在 Firefox 中可用
    const browserAPI = typeof browser !== 'undefined' ? browser : null;
    const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
    
    const devtoolsAPI = browserAPI?.devtools || chromeAPI?.devtools;
    
    if (devtoolsAPI && devtoolsAPI.panels) {
      // 延迟创建，确保 DevTools API 完全初始化（Firefox 兼容性）
      setTimeout(() => {
        devtoolsAPI.panels.create(
          'HackDuck',
          'icons/icon48.png',
          'devtools.html',
          (panel: any) => {
            console.log('HackDuck DevTools panel created');
          }
        );
      }, 100);
    } else {
      console.warn('⚠️ DevTools API not available');
    }
  }
}
