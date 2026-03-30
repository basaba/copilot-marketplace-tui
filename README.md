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

- Node.js 18+
- GitHub Copilot CLI installed and configured (`copilot` binary in PATH) — not needed for demo mode

## Quick Start

```bash
npm install
npm start -- --demo    # Run in demo mode with sample data
```

## Development

```bash
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

CPM wraps the existing `copilot plugin` CLI commands:

- `copilot plugin list` — list installed plugins
- `copilot plugin install/uninstall` — install/remove plugins
- `copilot plugin enable/disable` — toggle plugins
- `copilot plugin update` — update plugins
- `copilot plugin marketplace list/browse/add/remove` — manage marketplaces

## Demo Mode

Force demo mode with `--demo` to see sample data without needing the copilot CLI.

## Built With

- [Ink](https://github.com/vadimdemedes/ink) — React for CLIs
- [React](https://react.dev) — UI component model
- [TypeScript](https://www.typescriptlang.org) — Type safety

## License

MIT
