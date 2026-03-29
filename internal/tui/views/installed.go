package views

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/components"
)

// Action messages for the app shell to handle.
type InstalledViewDetailMsg struct{ Plugin copilot.InstalledPlugin }
type InstalledEnableMsg struct{ Name string }
type InstalledDisableMsg struct{ Name string }
type InstalledUninstallMsg struct{ Name string }
type InstalledUpdateMsg struct{ Name string }

// InstalledModel is the Bubble Tea model for the installed plugins list view.
// IsInputActive returns true when the view is capturing keyboard input (search mode).
func (m InstalledModel) IsInputActive() bool {
	return m.searching
}

type InstalledModel struct {
	plugins   []copilot.InstalledPlugin
	filtered  []copilot.InstalledPlugin
	table     components.Table
	search    components.SearchBar
	searching bool
	width     int
	height    int
}

var installedColumns = []components.Column{
	{Title: "Name", Width: 25},
	{Title: "Version", Width: 12},
	{Title: "Status", Width: 14},
	{Title: "Marketplace", Width: 20},
	{Title: "Update", Width: 10},
}

// NewInstalled creates a new InstalledModel with the given plugins.
func NewInstalled(plugins []copilot.InstalledPlugin) InstalledModel {
	m := InstalledModel{
		table:  components.NewTable(installedColumns, 15),
		search: components.NewSearchBar("Filter plugins..."),
	}
	m.SetPlugins(plugins)
	return m
}

// SetPlugins replaces the plugin list and rebuilds the table.
func (m *InstalledModel) SetPlugins(plugins []copilot.InstalledPlugin) {
	m.plugins = plugins
	m.filterPlugins()
}

// SetSize updates the available dimensions.
func (m *InstalledModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	// Reserve space for title, search bar, help line, and padding.
	tableHeight := h - 8
	if tableHeight < 3 {
		tableHeight = 3
	}
	m.table.Height = tableHeight
	m.search.SetWidth(w)
}

// Update handles messages and returns the updated model plus any command.
func (m InstalledModel) Update(msg tea.Msg) (InstalledModel, tea.Cmd) {
	// When searching, delegate key messages to the search bar.
	if m.searching {
		switch msg := msg.(type) {
		case tea.KeyMsg:
			switch msg.Type {
			case tea.KeyEsc:
				m.searching = false
				m.search.Blur()
				return m, nil
			}
		case components.SearchChangedMsg:
			m.filterPlugins()
			return m, nil
		}
		var cmd tea.Cmd
		m.search, cmd = m.search.Update(msg)
		return m, cmd
	}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			m.table.MoveUp()
		case "down", "j":
			m.table.MoveDown()
		case "/":
			m.searching = true
			cmd := m.search.Focus()
			return m, cmd
		case "enter":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return InstalledViewDetailMsg{Plugin: *sel}
				}
			}
		case "e":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return InstalledEnableMsg{Name: sel.Name}
				}
			}
		case "d":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return InstalledDisableMsg{Name: sel.Name}
				}
			}
		case "x":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return InstalledUninstallMsg{Name: sel.Name}
				}
			}
		case "u":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return InstalledUpdateMsg{Name: sel.Name}
				}
			}
		}
	case components.SearchChangedMsg:
		m.filterPlugins()
	}

	return m, nil
}

// View renders the installed plugins view.
func (m InstalledModel) View() string {
	var b strings.Builder

	// Title
	b.WriteString(theme.TitleStyle.Render("Installed Plugins"))
	b.WriteString("\n\n")

	// Empty state: no plugins installed
	if len(m.plugins) == 0 {
		emptyStyle := lipgloss.NewStyle().Foreground(theme.ColorTextDim).Italic(true).Padding(2, 4)
		b.WriteString(emptyStyle.Render(
			"No plugins installed.\n\n" +
				"Browse the Marketplace (tab → Marketplace) to discover and install plugins, or run:\n" +
				"  copilot plugin install <name>@<marketplace>"))
		b.WriteString("\n\n")
		b.WriteString(m.helpView())
		return b.String()
	}

	// Search bar
	b.WriteString(m.search.View())
	b.WriteString("\n")

	// Table
	b.WriteString(m.table.View())
	b.WriteString("\n\n")

	// Help line
	b.WriteString(m.helpView())

	return b.String()
}

// filterPlugins rebuilds the filtered list and table rows from the search query.
func (m *InstalledModel) filterPlugins() {
	query := strings.ToLower(m.search.Value())

	m.filtered = nil
	for _, p := range m.plugins {
		if query == "" || strings.Contains(strings.ToLower(p.Name), query) {
			m.filtered = append(m.filtered, p)
		}
	}

	rows := make([]components.Row, 0, len(m.filtered))
	for _, p := range m.filtered {
		status := theme.StatusText(p.Status == copilot.StatusEnabled)
		update := theme.UpdateBadge(p.UpdateAvailable)
		rows = append(rows, components.Row{p.Name, p.Version, status, p.Marketplace, update})
	}
	m.table.SetRows(rows)
}

// selectedPlugin returns a pointer to the currently selected filtered plugin, or nil.
func (m *InstalledModel) selectedPlugin() *copilot.InstalledPlugin {
	idx := m.table.Cursor
	if idx >= 0 && idx < len(m.filtered) {
		return &m.filtered[idx]
	}
	return nil
}

// helpView renders the bottom help line.
func (m InstalledModel) helpView() string {
	pairs := []struct{ key, desc string }{
		{"↑/↓", "navigate"},
		{"enter", "view detail"},
		{"/", "search"},
		{"e", "enable"},
		{"d", "disable"},
		{"u", "update"},
		{"x", "uninstall"},
	}

	parts := make([]string, 0, len(pairs))
	sep := lipgloss.NewStyle().Foreground(theme.ColorTextDim).Render(" • ")
	for _, p := range pairs {
		k := theme.HelpKeyStyle.Render(p.key)
		d := theme.HelpDescStyle.Render(p.desc)
		parts = append(parts, k+" "+d)
	}
	return strings.Join(parts, sep)
}
