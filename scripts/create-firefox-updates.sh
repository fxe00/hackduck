#!/bin/bash

echo "🦊 Creating Firefox updates.json..."

# Create updates.json for Firefox auto-updates
cat > releases/updates.json << 'EOF'
{
  "addons": {
    "hackduck@example.com": {
      "updates": [
        {
          "version": "1.1.0",
          "update_link": "https://github.com/fxe00/hackduck/releases/download/v1.1.0/hackduck-firefox-v1.1.0.zip",
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

echo "✅ Firefox updates.json created: releases/updates.json"
