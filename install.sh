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

# Clean up any previous broken install
NPM_GLOBAL=$(npm prefix -g 2>/dev/null)/lib/node_modules/copilot-plugin-marketplace
if [ -e "$NPM_GLOBAL" ]; then
  echo "⏳ Removing previous install..."
  rm -rf "$NPM_GLOBAL"
fi

# Install cpm globally from GitHub
echo "⏳ Installing cpm from GitHub..."
npm install -g github:basaba/copilot-marketplace-tui 2>&1

# Determine npm global bin directory
NPM_BIN="$(npm prefix -g 2>/dev/null)/bin"

# If cpm binary/symlink wasn't created, create it manually
if [ ! -e "$NPM_BIN/cpm" ]; then
  NPM_GLOBAL="$(npm prefix -g 2>/dev/null)/lib/node_modules/copilot-plugin-marketplace"
  if [ -f "$NPM_GLOBAL/dist/index.js" ]; then
    echo "⏳ Creating cpm symlink..."
    ln -sf "$NPM_GLOBAL/dist/index.js" "$NPM_BIN/cpm"
    chmod +x "$NPM_BIN/cpm"
  fi
fi

# Verify cpm is on PATH
hash -r 2>/dev/null  # refresh shell command cache
if command -v cpm &>/dev/null; then
  echo ""
  echo "✅ Installed! Run 'cpm' to launch."
else
  echo ""
  echo "✅ Installed, but 'cpm' is not on your PATH."
  echo ""
  echo "Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
  echo ""
  echo "  export PATH=\"\$PATH:$NPM_BIN\""
  echo ""
  echo "Then run: source ~/.bashrc"
fi
