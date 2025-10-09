#!/bin/bash

echo "🌐 Building HackDuck for Microsoft Edge..."

# Clean previous builds
rm -rf dist-edge
mkdir -p dist-edge

# Copy dist files to Edge directory
cp -r dist/* dist-edge/

# Create Edge-specific manifest
cat > dist-edge/manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "HackDuck - HTTP Request Debugger",
  "version": "1.0.0",
  "description": "A powerful browser extension for HTTP request debugging and manipulation",
  "permissions": [
    "activeTab",
    "storage",
    "webRequest",
    "declarativeNetRequest",
    "tabs",
    "scripting",
    "debugger"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "devtools_page": "devtools.html",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "minimum_chrome_version": "88"
}
EOF

# Create Edge package
cd dist-edge
zip -r ../hackduck-edge-v1.0.0.zip .
cd ..

echo "✅ Edge build completed: hackduck-edge-v1.0.0.zip"
