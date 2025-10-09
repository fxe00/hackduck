#!/bin/bash

echo "🦊 Building HackDuck for Mozilla Firefox..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Building version: $VERSION"

# Clean previous builds
rm -rf releases/dist-firefox
mkdir -p releases/dist-firefox

# Copy dist files to Firefox directory
cp -r dist/* releases/dist-firefox/

# Create Firefox-specific manifest (Manifest V2 for better compatibility)
cat > releases/dist-firefox/manifest.json << EOF
{
  "manifest_version": 2,
  "name": "HackDuck - HTTP Request Debugger",
  "version": "$VERSION",
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
      "strict_min_version": "78.0",
      "update_url": "https://github.com/fxe00/hackduck/releases/latest/download/updates.json"
    }
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "hackduck@example.com",
      "strict_min_version": "78.0"
    }
  },
  "author": "HackDuck Team",
  "homepage_url": "https://github.com/fxe00/hackduck"
}
EOF

# Create Firefox updates.json
echo "📝 Creating Firefox updates.json..."
cat > releases/updates.json << EOF
{
  "addons": {
    "hackduck@example.com": {
      "updates": [
        {
          "version": "$VERSION",
          "update_link": "https://github.com/fxe00/hackduck/releases/download/v$VERSION/hackduck-firefox-v$VERSION.zip",
          "applications": {
            "gecko": {
              "strict_min_version": "78.0"
            }
          }
        }
      ]
    }
  }
}
EOF

# Create Firefox package
cd releases/dist-firefox
zip -r ../hackduck-firefox-v$VERSION.zip .
cd ../..

echo "✅ Firefox build completed: releases/hackduck-firefox-v$VERSION.zip"
echo "✅ Firefox updates.json created: releases/updates.json"
