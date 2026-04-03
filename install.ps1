# One-line install (PowerShell):
# irm https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'

Write-Host "⚡ Installing Copilot Plugin Marketplace (cpm)..." -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Node.js not found. Install it from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $(node -v)" -ForegroundColor Green

# Install gh CLI if missing
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "⏳ Installing GitHub CLI..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id GitHub.cli --accept-source-agreements --accept-package-agreements
        # Refresh PATH for current session
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install gh -y
    } elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
        scoop install gh
    } else {
        Write-Host "✗ Could not auto-install gh. Install manually: https://cli.github.com" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ GitHub CLI installed" -ForegroundColor Green
}
Write-Host "✓ gh $(gh --version | Select-Object -First 1)" -ForegroundColor Green

# Ensure gh is authenticated
$authOk = $false
try { gh auth status 2>&1 | Out-Null; $authOk = $true } catch {}
if (-not $authOk) {
    Write-Host "⏳ GitHub CLI not authenticated. Running 'gh auth login'..." -ForegroundColor Yellow
    gh auth login
}

# Install copilot extension if missing
if (-not (Get-Command copilot -ErrorAction SilentlyContinue)) {
    Write-Host "⏳ Installing GitHub Copilot CLI extension..." -ForegroundColor Yellow
    gh extension install github/gh-copilot
    if (-not (Get-Command copilot -ErrorAction SilentlyContinue)) {
        Write-Host "⚠ Copilot CLI not on PATH. You may need to restart your terminal." -ForegroundColor Yellow
    }
}

# Clean up any previous broken install
$npmGlobal = "$(npm prefix -g 2>$null)\node_modules\copilot-plugin-marketplace"
if (Test-Path $npmGlobal) {
    Write-Host "⏳ Removing previous install..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $npmGlobal
}

# Install cpm globally from GitHub
Write-Host "⏳ Installing cpm from GitHub..." -ForegroundColor Yellow
npm install -g "github:basaba/copilot-marketplace-tui"

# Verify cpm is on PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
if (Get-Command cpm -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "✅ Installed! Run 'cpm' to launch." -ForegroundColor Green
} else {
    $npmBin = npm prefix -g 2>$null
    Write-Host ""
    Write-Host "✅ Installed, but 'cpm' is not on your PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Add npm's global bin directory to your PATH:" -ForegroundColor Yellow
    Write-Host "  $npmBin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then restart your terminal." -ForegroundColor Yellow
}
