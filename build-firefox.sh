#!/bin/bash

echo "🦊 Building HackDuck for Mozilla Firefox..."

# Clean previous builds
rm -rf dist-firefox
mkdir -p dist-firefox

# Copy dist files to Firefox directory
cp -r dist/* dist-firefox/

# Create Firefox-specific manifest (Manifest V2 for better compatibility)
cat > dist-firefox/manifest.json << 'EOF'
{
  "manifest_version": 2,
  "name": "HackDuck - HTTP Request Debugger",
  "version": "1.0.0",
  "description": "A powerful browser extension for HTTP request debugging and manipulation",
  "permissions": [
    "activeTab",
    "storage",
    "webRequest",
    "webRequestBlocking",
    "tabs",
    "debugger",
    "<all_urls>"
  ],
  "background": {
    "scripts": ["background.js"],
    "persistent": true
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
    "injected.js"
  ],
  "applications": {
    "gecko": {
      "id": "hackduck@example.com",
      "strict_min_version": "78.0"
    }
  }
}
EOF

# Create Firefox package
cd dist-firefox
zip -r ../hackduck-firefox-v1.0.0.zip .
cd ..

echo "✅ Firefox build completed: hackduck-firefox-v1.0.0.zip"
