#!/bin/bash

echo "🚀 Building HackDuck v1.0.0 for all browsers..."

# Build base project
echo "📦 Building base project..."
npm run build

# Build Chrome version
echo "🔨 Building Chrome version..."
./build-chrome.sh

# Build Firefox version
echo "🦊 Building Firefox version..."
./build-firefox.sh

# Build Edge version
echo "🌐 Building Edge version..."
./build-edge.sh

echo ""
echo "✅ All builds completed!"
echo ""
echo "📁 Generated files:"
echo "  - hackduck-chrome-v1.0.0.zip"
echo "  - hackduck-firefox-v1.0.0.zip"
echo "  - hackduck-edge-v1.0.0.zip"
echo ""
echo "🎉 Ready for GitHub release!"
