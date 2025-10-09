#!/bin/bash

echo "🚀 Building HackDuck v1.1.1 for all browsers..."

# Build base project
echo "📦 Building base project..."
npm run build

# Build Chrome version
echo "🔨 Building Chrome version..."
./scripts/build-chrome.sh

# Build Firefox version
echo "🦊 Building Firefox version..."
./scripts/build-firefox.sh

# Build Edge version
echo "🌐 Building Edge version..."
./scripts/build-edge.sh

echo ""
echo "✅ All builds completed!"
echo ""
echo "📁 Generated files:"
echo "  - releases/hackduck-chrome-v1.1.1.zip"
echo "  - releases/hackduck-firefox-v1.1.1.zip"
echo "  - releases/hackduck-edge-v1.1.1.zip"
echo ""
echo "🎉 Ready for GitHub release!"
