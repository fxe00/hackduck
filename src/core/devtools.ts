// 开发者工具面板初始化
if (typeof chrome !== 'undefined' && chrome.devtools) {
  chrome.devtools.panels.create(
    'HackDuck',
    'icons/icon48.png',
    'devtools.html',
    (panel: chrome.devtools.panels.ExtensionPanel) => {
      console.log('HackDuck DevTools panel created');
    }
  );
}
