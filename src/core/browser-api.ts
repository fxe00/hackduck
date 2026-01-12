// 统一的浏览器 API 兼容层
// Firefox 使用 browser.* API，Chrome/Edge 使用 chrome.* API

// 检测是否为 Firefox
// @ts-ignore - browser API 在 Firefox 中可用
const isFirefox = typeof browser !== 'undefined' && typeof chrome === 'undefined';

// 统一 API 对象
// @ts-ignore - browser API 在 Firefox 中可用
export const runtimeAPI = isFirefox ? browser.runtime : chrome.runtime;
// @ts-ignore - browser API 在 Firefox 中可用
export const tabsAPI = isFirefox ? browser.tabs : chrome.tabs;
// @ts-ignore - browser API 在 Firefox 中可用
export const cookiesAPI = isFirefox ? browser.cookies : chrome.cookies;
// @ts-ignore - browser API 在 Firefox 中可用
export const webRequestAPI = isFirefox ? browser.webRequest : chrome.webRequest;
// @ts-ignore - browser API 在 Firefox 中可用
export const devtoolsAPI = isFirefox ? browser.devtools : chrome.devtools;

// 兼容性辅助函数
export function sendMessage(message: any): Promise<any> {
  if (isFirefox) {
    // @ts-ignore - browser API 在 Firefox 中可用
    return browser.runtime.sendMessage(message);
  } else {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// 检查 API 是否可用
export function isRuntimeAvailable(): boolean {
  return typeof runtimeAPI !== 'undefined' && runtimeAPI !== null;
}

export function isTabsAvailable(): boolean {
  return typeof tabsAPI !== 'undefined' && tabsAPI !== null;
}

export function isDevtoolsAvailable(): boolean {
  return typeof devtoolsAPI !== 'undefined' && devtoolsAPI !== null;
}
