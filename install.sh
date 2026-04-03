#!/usr/bin/env bash
# One-line install: curl -fsSL https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.sh | bash
set -euo pipefail

echo "⚡ Installing Copilot Plugin Marketplace (cpm)..."

# Check prerequisites
for cmd in node npm gh copilot; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "✗ Required command not found: $cmd"
    [ "$cmd" = "node" ] && echo "  Install Node.js: https://nodejs.org"
    [ "$cmd" = "gh" ] && echo "  Install GitHub CLI: https://cli.github.com"
    [ "$cmd" = "copilot" ] && echo "  Install Copilot CLI: gh extension install github/gh-copilot"
    exit 1
  fi
done

echo "✓ Prerequisites OK (node, npm, gh, copilot)"

# Install globally from GitHub
echo "⏳ Installing from GitHub..."
npm install -g github:basaba/copilot-marketplace-tui 2>&1

echo ""
echo "✅ Installed! Run 'cpm' to launch."
