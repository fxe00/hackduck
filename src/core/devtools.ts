// 开发者工具面板初始化
// 防止重复创建面板（Firefox 兼容性）
// 使用 background script 维护创建状态，但每次 DevTools 打开时重置
(async function() {
  // @ts-ignore - browser API 在 Firefox 中可用
  const browserAPI = typeof browser !== 'undefined' ? browser : null;
  const chromeAPI = typeof chrome !== 'undefined' ? chrome : null;
  const devtoolsAPI = browserAPI?.devtools || chromeAPI?.devtools;
  const runtimeAPI = browserAPI?.runtime || chromeAPI?.runtime;
  
  if (!devtoolsAPI || !devtoolsAPI.panels) {
    console.warn('⚠️ DevTools API not available');
    return;
  }
  
  if (!runtimeAPI) {
    console.warn('⚠️ Runtime API not available');
    return;
  }
  
  // 使用本地标志防止同一执行上下文中重复调用
  const localKey = '__hackduck_panel_creating_v9';
  if (typeof window !== 'undefined' && (window as any)[localKey]) {
    console.log('⚠️ Panel creation already in progress in this context');
    return;
  }
  
  // 立即标记为正在创建
  if (typeof window !== 'undefined') {
    (window as any)[localKey] = true;
  }
  
  // 通知 background script 开始创建面板
  // background script 会维护一个"当前 DevTools 窗口已创建"的标志
  let shouldCreate = true;
  
  try {
    if (browserAPI?.runtime) {
      // Firefox: Promise-based
      // @ts-ignore - browser API 在 Firefox 中可用
      const response = await browser.runtime.sendMessage({ 
        type: 'CHECK_AND_MARK_PANEL_CREATION' 
      });
      shouldCreate = response?.shouldCreate !== false;
    } else {
      // Chrome: Callback-based
      shouldCreate = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'CHECK_AND_MARK_PANEL_CREATION' },
          (response: any) => {
            resolve(response?.shouldCreate !== false);
          }
        );
      });
    }
  } catch (error) {
    console.warn('Failed to check panel creation status:', error);
    // 如果检查失败，允许创建（安全起见）
    shouldCreate = true;
  }
  
  if (!shouldCreate) {
    console.log('⚠️ Panel creation skipped (already created in this DevTools session)');
    // 清除本地标记
    if (typeof window !== 'undefined') {
      delete (window as any)[localKey];
    }
    return;
  }
  
  // 延迟创建，确保 DevTools API 完全初始化
  setTimeout(() => {
    try {
      if (browserAPI?.devtools) {
        // Firefox: Promise-based
        // @ts-ignore - browser API 在 Firefox 中可用
        browser.devtools.panels.create(
          'HackDuck',
          'icons/icon48.png',
          'devtools.html',
          (panel: any) => {
            if (panel) {
              console.log('✅ HackDuck DevTools panel created');
              // 通知 background script 面板创建成功
              if (browserAPI?.runtime) {
                // @ts-ignore - browser API 在 Firefox 中可用
                browser.runtime.sendMessage({ 
                  type: 'PANEL_CREATED_SUCCESS' 
                }).catch(console.warn);
              }
            } else {
              console.log('⚠️ Panel creation returned null (may already exist)');
              // 如果返回 null，通知 background script 清除标志
              if (browserAPI?.runtime) {
                // @ts-ignore - browser API 在 Firefox 中可用
                browser.runtime.sendMessage({ 
                  type: 'PANEL_CREATION_FAILED' 
                }).catch(console.warn);
              }
            }
            // 清除本地标记
            if (typeof window !== 'undefined') {
              delete (window as any)[localKey];
            }
          }
        );
      } else {
        // Chrome: Callback-based
        chrome.devtools.panels.create(
          'HackDuck',
          'icons/icon48.png',
          'devtools.html',
          (panel: chrome.devtools.panels.ExtensionPanel | null) => {
            if (panel) {
              console.log('✅ HackDuck DevTools panel created');
              // 通知 background script 面板创建成功
              chrome.runtime.sendMessage({ 
                type: 'PANEL_CREATED_SUCCESS' 
              }, () => {});
            } else {
              console.log('⚠️ Panel creation returned null (may already exist)');
              // 如果返回 null，通知 background script 清除标志
              chrome.runtime.sendMessage({ 
                type: 'PANEL_CREATION_FAILED' 
              }, () => {});
            }
            // 清除本地标记
            if (typeof window !== 'undefined') {
              delete (window as any)[localKey];
            }
          }
        );
      }
    } catch (error: any) {
      console.warn('⚠️ Error creating DevTools panel:', error);
      // 如果出错，清除本地标记并通知 background script
      if (typeof window !== 'undefined') {
        delete (window as any)[localKey];
      }
      try {
        if (browserAPI?.runtime) {
          // @ts-ignore - browser API 在 Firefox 中可用
          browser.runtime.sendMessage({ 
            type: 'PANEL_CREATION_FAILED' 
          }).catch(console.warn);
        } else {
          chrome.runtime.sendMessage({ 
            type: 'PANEL_CREATION_FAILED' 
          }, () => {});
        }
      } catch (e) {
        // 忽略错误
      }
    }
  }, 200);
})();
