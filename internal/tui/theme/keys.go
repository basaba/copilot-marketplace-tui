package theme

import "github.com/charmbracelet/bubbles/key"

// KeyMap defines all global keybindings
type KeyMap struct {
	Quit      key.Binding
	Help      key.Binding
	Tab       key.Binding
	ShiftTab  key.Binding
	Up        key.Binding
	Down      key.Binding
	Enter     key.Binding
	Back      key.Binding
	Search    key.Binding
	Enable    key.Binding
	Disable   key.Binding
	Install   key.Binding
	Uninstall key.Binding
	Update    key.Binding
	UpdateAll key.Binding
	Refresh   key.Binding
}

// DefaultKeyMap returns the default keybindings
var DefaultKeyMap = KeyMap{
	Quit: key.NewBinding(
		key.WithKeys("q", "ctrl+c"),
		key.WithHelp("q", "quit"),
	),
	Help: key.NewBinding(
		key.WithKeys("?"),
		key.WithHelp("?", "help"),
	),
	Tab: key.NewBinding(
		key.WithKeys("tab"),
		key.WithHelp("tab", "next tab"),
	),
	ShiftTab: key.NewBinding(
		key.WithKeys("shift+tab"),
		key.WithHelp("shift+tab", "prev tab"),
	),
	Up: key.NewBinding(
		key.WithKeys("up", "k"),
		key.WithHelp("↑/k", "up"),
	),
	Down: key.NewBinding(
		key.WithKeys("down", "j"),
		key.WithHelp("↓/j", "down"),
	),
	Enter: key.NewBinding(
		key.WithKeys("enter"),
		key.WithHelp("enter", "select"),
	),
	Back: key.NewBinding(
		key.WithKeys("esc"),
		key.WithHelp("esc", "back"),
	),
	Search: key.NewBinding(
		key.WithKeys("/"),
		key.WithHelp("/", "search"),
	),
	Enable: key.NewBinding(
		key.WithKeys("e"),
		key.WithHelp("e", "enable"),
	),
	Disable: key.NewBinding(
		key.WithKeys("d"),
		key.WithHelp("d", "disable"),
	),
	Install: key.NewBinding(
		key.WithKeys("i"),
		key.WithHelp("i", "install"),
	),
	Uninstall: key.NewBinding(
		key.WithKeys("x"),
		key.WithHelp("x", "uninstall"),
	),
	Update: key.NewBinding(
		key.WithKeys("u"),
		key.WithHelp("u", "update"),
	),
	UpdateAll: key.NewBinding(
		key.WithKeys("U"),
		key.WithHelp("U", "update all"),
	),
	Refresh: key.NewBinding(
		key.WithKeys("r"),
		key.WithHelp("r", "refresh"),
	),
}

// ShortHelp returns keybindings to show in the mini help view
func (k KeyMap) ShortHelp() []key.Binding {
	return []key.Binding{k.Tab, k.Enter, k.Search, k.Help, k.Quit}
}

// FullHelp returns keybindings for the expanded help view
func (k KeyMap) FullHelp() [][]key.Binding {
	return [][]key.Binding{
		{k.Up, k.Down, k.Enter, k.Back},
		{k.Tab, k.ShiftTab, k.Search, k.Refresh},
		{k.Install, k.Uninstall, k.Enable, k.Disable},
		{k.Update, k.UpdateAll, k.Help, k.Quit},
	}
}
