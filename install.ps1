# One-line install (PowerShell):
# irm https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'

Write-Host "⚡ Installing Copilot Plugin Marketplace (cpm)..." -ForegroundColor Cyan

# Check prerequisites
$missing = @()
foreach ($cmd in @('node', 'npm', 'gh', 'copilot')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        $missing += $cmd
        switch ($cmd) {
            'node'    { Write-Host "  ✗ node not found — Install Node.js: https://nodejs.org" -ForegroundColor Red }
            'npm'     { Write-Host "  ✗ npm not found — Comes with Node.js: https://nodejs.org" -ForegroundColor Red }
            'gh'      { Write-Host "  ✗ gh not found — Install GitHub CLI: https://cli.github.com" -ForegroundColor Red }
            'copilot' { Write-Host "  ✗ copilot not found — Run: gh extension install github/gh-copilot" -ForegroundColor Red }
        }
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n✗ Missing prerequisites: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Prerequisites OK (node, npm, gh, copilot)" -ForegroundColor Green

# Install globally from GitHub
Write-Host "⏳ Installing from GitHub..." -ForegroundColor Yellow
npm install -g "github:basaba/copilot-marketplace-tui"

Write-Host ""
Write-Host "✅ Installed! Run 'cpm' to launch." -ForegroundColor Green
