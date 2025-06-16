console.log("DevTools page script loaded!");

chrome.devtools.panels.create(
    "Hackduck",
    "/dist/icons/icon48.png",
    "/dist/index.html",
    function(panel) {
        console.log("Minimal DevTools Panel created!");
    }
);

