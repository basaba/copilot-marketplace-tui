#!/usr/bin/env bash
# One-line install: curl -fsSL https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.sh | bash
set -euo pipefail

echo "⚡ Installing Copilot Plugin Marketplace (cpm)..."

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "✗ Node.js not found. Install it from https://nodejs.org"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# Install gh CLI if missing
if ! command -v gh &>/dev/null; then
  echo "⏳ Installing GitHub CLI..."
  if command -v brew &>/dev/null; then
    brew install gh
  elif command -v apt-get &>/dev/null; then
    (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y))
    sudo mkdir -p -m 755 /etc/apt/keyrings
    out=$(mktemp) && wget -nv -O"$out" https://cli.github.com/packages/githubcli-archive-keyring.gpg && cat "$out" | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
    sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update && sudo apt install gh -y
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y gh
  elif command -v yum &>/dev/null; then
    sudo yum install -y gh
  else
    echo "✗ Could not auto-install gh. Install manually: https://cli.github.com"
    exit 1
  fi
  echo "✓ GitHub CLI installed"
fi
echo "✓ gh $(gh --version | head -1)"

# Ensure gh is authenticated
if ! gh auth status &>/dev/null 2>&1; then
  echo "⏳ GitHub CLI not authenticated. Running 'gh auth login'..."
  gh auth login
fi

# Install copilot extension if missing
if ! command -v copilot &>/dev/null; then
  echo "⏳ Installing GitHub Copilot CLI extension..."
  gh extension install github/gh-copilot || true
  # copilot binary may be at a gh extension path — check again
  if ! command -v copilot &>/dev/null; then
    echo "⚠ Copilot CLI not on PATH. You may need to add gh extensions to your PATH."
    echo "  Try: export PATH=\"\$PATH:\$(gh extension list --json path -q '.[].path' 2>/dev/null | tr '\n' ':')\""
  fi
fi

# Install cpm globally from GitHub
echo "⏳ Installing cpm from GitHub..."
npm install -g github:basaba/copilot-marketplace-tui 2>&1

echo ""
echo "✅ Installed! Run 'cpm' to launch."
