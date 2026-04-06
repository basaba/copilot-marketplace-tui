# CPM — Copilot Plugin Manager

A rich terminal UI for managing GitHub Copilot CLI plugins. Browse marketplaces, install/uninstall plugins, enable/disable, update, and configure — all from a beautiful TUI.

Built with [Ink](https://github.com/vadimdemedes/ink) (React for CLIs) and TypeScript.

## Features

- 📦 **Dashboard** — overview of installed plugins, quick actions
- 🔍 **Marketplace Browser** — browse and search registered marketplaces, install plugins
- 📋 **Installed Plugins** — manage installed plugins with search, enable/disable, uninstall, update
- 📄 **Plugin Details** — view full plugin metadata
- ⚙️ **Settings** — manage marketplace registrations (add/remove)
- 🎨 **GitHub Dark Theme** — cohesive dark color scheme inspired by GitHub
- ⌨️ **Keyboard-Driven** — vim-style navigation (j/k), tab switching, search (/)

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated — includes the `gh copilot` extension for plugin management
- Node.js 18+

## Install as GitHub CLI Extension (Recommended)

The recommended way to use CPM is as a **GitHub CLI extension**. This integrates it directly into the `gh` command so you can manage Copilot plugins alongside your other GitHub workflows.

```bash
gh extension install basaba/copilot-marketplace-tui
```

Then launch it with:

```bash
gh cpm
```

> **How it works:** On first run the extension installs npm dependencies and compiles TypeScript automatically — no extra setup required. Subsequent launches start instantly.

To upgrade:

```bash
gh extension upgrade cpm
```

To remove:

```bash
gh extension remove cpm
```

### Alternative install methods

<details>
<summary><strong>macOS / Linux (curl)</strong></summary>

```bash
curl -fsSL https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.sh | bash
```

Then run: `cpm`
</details>

<details>
<summary><strong>Windows (PowerShell)</strong></summary>

```powershell
irm https://raw.githubusercontent.com/basaba/copilot-marketplace-tui/main/install.ps1 | iex
```

Then run: `cpm`
</details>

<details>
<summary><strong>npm (any platform)</strong></summary>

```bash
npm install -g github:basaba/copilot-marketplace-tui
```

Then run: `cpm`
</details>

## Development

```bash
npm install
npm run build          # Compile TypeScript
npm start              # Run (real copilot CLI integration)
npm start -- --demo    # Run with demo data
```

## Keybindings

| Key | Action |
|-----|--------|
| `tab` / `shift+tab` | Switch between screens |
| `↑/k` / `↓/j` | Navigate lists |
| `←/→` | Switch marketplace tabs |
| `enter` | Select / view detail |
| `/` | Search / filter |
| `esc` | Exit search / go back |
| `i` | Install plugin |
| `e` / `d` | Enable / disable plugin |
| `u` | Update plugin |
| `x` | Uninstall / remove |
| `q` | Quit |

## Architecture

```
src/
├── index.tsx              # CLI entry point
├── App.tsx                # Root component, navigation, state
├── types.ts               # TypeScript type definitions
├── theme.ts               # GitHub dark theme colors
├── components/
│   ├── TabBar.tsx         # Top-level screen navigation
│   ├── SearchBar.tsx      # Search/filter input
│   ├── Table.tsx          # Navigable data table
│   └── StatusBar.tsx      # Bottom help/status line
├── views/
│   ├── Dashboard.tsx      # Home screen with stats + quick actions
│   ├── Installed.tsx      # Installed plugins list
│   ├── Marketplace.tsx    # Marketplace browser with sub-tabs
│   ├── Detail.tsx         # Plugin detail view
│   └── Settings.tsx       # Marketplace management
└── services/
    ├── copilot.ts         # CLI wrapper (shells out to `copilot plugin ...`)
    └── demo.ts            # Demo data generator
```

## How It Works

CPM integrates directly with the GitHub Copilot CLI. It auto-detects the available command — preferring `gh copilot` (tighter GitHub CLI integration) and falling back to the standalone `copilot` binary:

- `gh copilot plugin list` — list installed plugins
- `gh copilot plugin install/uninstall` — install/remove plugins
- `gh copilot plugin enable/disable` — toggle plugins
- `gh copilot plugin update` — update plugins
- `gh copilot plugin marketplace list/browse/add/remove` — manage marketplaces

## Demo Mode

Force demo mode with `--demo` to see sample data without needing the copilot CLI.

## Built With

- [Ink](https://github.com/vadimdemedes/ink) — React for CLIs
- [React](https://react.dev) — UI component model
- [TypeScript](https://www.typescriptlang.org) — Type safety

## License

MIT
