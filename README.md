# CPM — Copilot Plugin Manager

A rich terminal UI for managing GitHub Copilot CLI plugins. Browse marketplaces, install/uninstall plugins, enable/disable, update, and configure — all from a beautiful TUI.

## Features

- 📦 **Dashboard** — overview of installed plugins, quick actions
- 🔍 **Marketplace Browser** — browse and search registered marketplaces, install plugins
- 📋 **Installed Plugins** — manage installed plugins with search, enable/disable, uninstall, update
- 📄 **Plugin Details** — view full plugin metadata (skills, agents, hooks, MCP servers)
- ⚙️ **Settings** — manage marketplace registrations (add/remove)
- 🎨 **GitHub Dark Theme** — cohesive dark color scheme inspired by GitHub
- ⌨️ **Keyboard-Driven** — vim-style navigation (j/k), tab switching, search (/)

## Prerequisites

- Go 1.18+
- GitHub Copilot CLI installed and configured (`copilot` binary in PATH)

## Installation

### From source

```bash
git clone <repo-url>
cd copilot-plugin-marketplace
make build
# Binary is at ./cpm
```

### Install to PATH

```bash
make install
```

## Usage

```bash
# Launch TUI (uses real copilot CLI)
./cpm

# Launch in demo mode (sample data, no copilot CLI needed)
./cpm --demo
```

## Keybindings

| Key              | Action                 |
| ---------------- | ---------------------- |
| `tab`/`shift+tab`| Switch between views   |
| `↑/k` / `↓/j`   | Navigate up/down       |
| `enter`          | Select / view details  |
| `/`              | Search/filter          |
| `esc`            | Back / cancel search   |
| `i`              | Install plugin         |
| `x`              | Uninstall plugin       |
| `e`              | Enable plugin          |
| `d`              | Disable plugin         |
| `u`              | Update plugin          |
| `U`              | Update all plugins     |
| `r`              | Refresh data           |
| `?`              | Toggle help            |
| `q` / `Ctrl+C`  | Quit                   |

## Architecture

```
cmd/cpm/main.go              # Entry point
internal/
├── copilot/
│   ├── types.go              # Data types (Plugin, Marketplace, etc.)
│   ├── client.go             # CLI wrapper (shells out to `copilot plugin ...`)
│   └── parser.go             # Parses CLI output into Go structs
├── tui/
│   ├── app.go                # Root Bubble Tea model, screen routing
│   ├── theme/
│   │   ├── styles.go         # Lip Gloss styles (GitHub dark theme)
│   │   └── keys.go           # Global keybindings
│   ├── components/
│   │   ├── table.go          # Reusable table component
│   │   ├── searchbar.go      # Search/filter input
│   │   ├── statusbar.go      # Bottom status bar
│   │   ├── confirm.go        # Confirmation dialog
│   │   └── spinner.go        # Loading spinner
│   └── views/
│       ├── dashboard.go      # Home screen
│       ├── installed.go      # Installed plugins list
│       ├── marketplace.go    # Marketplace browser
│       ├── detail.go         # Plugin detail view
│       └── settings.go       # Marketplace management
└── config/
    └── config.go             # App configuration
```

## How It Works

CPM wraps the existing `copilot plugin` CLI commands:

- `copilot plugin list` — list installed plugins
- `copilot plugin install/uninstall` — install/remove plugins
- `copilot plugin enable/disable` — toggle plugins
- `copilot plugin update` — update plugins
- `copilot plugin marketplace list/browse/add/remove` — manage marketplaces

This ensures CPM stays in sync with Copilot CLI updates without maintaining separate logic.

## Demo Mode

If the `copilot` binary is not found in PATH, CPM automatically falls back to demo mode with sample data. You can also force demo mode with `--demo`.

## Built With

- [Bubble Tea](https://github.com/charmbracelet/bubbletea) — TUI framework
- [Lip Gloss](https://github.com/charmbracelet/lipgloss) — Style definitions
- [Bubbles](https://github.com/charmbracelet/bubbles) — Common TUI components

## License

MIT
