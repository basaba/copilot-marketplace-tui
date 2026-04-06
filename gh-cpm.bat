@echo off
REM gh-cpm — GitHub CLI extension entry point (Windows)
REM Install: gh extension install basaba/copilot-marketplace-tui
REM Usage:   gh cpm

setlocal

set "DIR=%~dp0"
cd /d "%DIR%"

REM Ensure Node.js is available
where node >nul 2>&1 || (
    echo Error: Node.js is required but not found. Install it from https://nodejs.org >&2
    exit /b 1
)

REM Install npm dependencies on first run (or after upgrade)
if not exist "%DIR%node_modules" (
    echo Installing dependencies... >&2
    npm install --omit=dev --silent 2>nul
)

REM Compile TypeScript if dist is missing
if not exist "%DIR%dist\index.js" (
    echo Building... >&2
    npx --yes tsc 2>nul
)

node "%DIR%dist\index.js" %*
