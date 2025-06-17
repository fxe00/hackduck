console.log("DevTools page script loaded!");

chrome.devtools.panels.create(
    "HackDuck",
    "/dist/icons/icon48.png",
    "/dist/index.html",
);

