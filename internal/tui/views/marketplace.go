package views

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/components"
)

// Action messages for the app shell to handle.
type MarketplaceInstallMsg struct{ Plugin copilot.MarketplacePlugin }
type MarketplaceViewDetailMsg struct{ Plugin copilot.MarketplacePlugin }

// IsInputActive returns true when the view is capturing keyboard input (search mode).
func (m MarketplaceModel) IsInputActive() bool {
	return m.searching
}

// MarketplaceModel is the Bubble Tea model for the marketplace browser view.
type MarketplaceModel struct {
	marketplaces []copilot.Marketplace
	activeTab    int
	plugins      map[string][]copilot.MarketplacePlugin
	filtered     []copilot.MarketplacePlugin
	table        components.Table
	search       components.SearchBar
	searching    bool
	width        int
	height       int
}

var marketplaceColumns = []components.Column{
	{Title: "Name", Width: 25},
	{Title: "Description", Width: 35},
	{Title: "Version", Width: 10},
	{Title: "Status", Width: 14},
}

// NewMarketplace creates a new MarketplaceModel with the given data.
func NewMarketplace(marketplaces []copilot.Marketplace, plugins map[string][]copilot.MarketplacePlugin) MarketplaceModel {
	m := MarketplaceModel{
		plugins: plugins,
		table:   components.NewTable(marketplaceColumns, 15),
		search:  components.NewSearchBar("Search plugins..."),
	}
	m.SetMarketplaces(marketplaces)
	return m
}

// SetSize updates the available dimensions.
func (m *MarketplaceModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	// Reserve space for title, tabs, search bar, help line, and padding.
	tableHeight := h - 10
	if tableHeight < 3 {
		tableHeight = 3
	}
	m.table.Height = tableHeight
	m.search.SetWidth(w)
}

// SetMarketplaces replaces the marketplace list and rebuilds the table.
func (m *MarketplaceModel) SetMarketplaces(marketplaces []copilot.Marketplace) {
	m.marketplaces = marketplaces
	if m.activeTab >= len(marketplaces) {
		m.activeTab = 0
	}
	m.filterPlugins()
}

// SetPlugins sets the plugin list for a specific marketplace and rebuilds if active.
func (m *MarketplaceModel) SetPlugins(marketplace string, plugins []copilot.MarketplacePlugin) {
	if m.plugins == nil {
		m.plugins = make(map[string][]copilot.MarketplacePlugin)
	}
	m.plugins[marketplace] = plugins
	if m.activeMarketplaceName() == marketplace {
		m.filterPlugins()
	}
}

// Update handles messages and returns the updated model plus any command.
func (m MarketplaceModel) Update(msg tea.Msg) (MarketplaceModel, tea.Cmd) {
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
		case "left", "h":
			m.switchTab(-1)
		case "right", "l":
			m.switchTab(1)
		case "1", "2", "3", "4", "5", "6", "7", "8", "9":
			idx := int(msg.String()[0]-'0') - 1
			if idx < len(m.marketplaces) {
				m.activeTab = idx
				m.filterPlugins()
			}
		case "/":
			m.searching = true
			cmd := m.search.Focus()
			return m, cmd
		case "i":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return MarketplaceInstallMsg{Plugin: *sel}
				}
			}
		case "enter":
			if sel := m.selectedPlugin(); sel != nil {
				return m, func() tea.Msg {
					return MarketplaceViewDetailMsg{Plugin: *sel}
				}
			}
		}
	case components.SearchChangedMsg:
		m.filterPlugins()
	}

	return m, nil
}

// View renders the marketplace browser view.
func (m MarketplaceModel) View() string {
	var b strings.Builder

	// Title
	b.WriteString(theme.TitleStyle.Render("Marketplace Browser"))
	b.WriteString("\n\n")

	// Empty state: no marketplaces registered
	if len(m.marketplaces) == 0 {
		emptyStyle := lipgloss.NewStyle().Foreground(theme.ColorTextDim).Italic(true).Padding(2, 4)
		b.WriteString(emptyStyle.Render(
			"No marketplaces registered.\n\n" +
				"Go to Settings (tab → Settings) and add a marketplace, or run:\n" +
				"  copilot plugin marketplace add <owner/repo>\n\n" +
				"Default marketplaces:\n" +
				"  • github/copilot-plugins\n" +
				"  • github/awesome-copilot"))
		b.WriteString("\n\n")
		b.WriteString(m.helpView())
		return b.String()
	}

	// Tab row
	b.WriteString(m.tabView())
	b.WriteString("\n\n")

	// Search bar
	b.WriteString(m.search.View())
	b.WriteString("\n")

	// Empty state: no plugins in selected marketplace
	if len(m.filtered) == 0 && m.search.Value() == "" {
		emptyStyle := lipgloss.NewStyle().Foreground(theme.ColorTextDim).Italic(true).Padding(1, 2)
		b.WriteString(emptyStyle.Render(
			"No plugins found in this marketplace.\n" +
				"Try switching to another marketplace with ← → or number keys."))
		b.WriteString("\n\n")
	} else {
		// Table
		b.WriteString(m.table.View())
		b.WriteString("\n\n")
	}

	// Help line
	b.WriteString(m.helpView())

	return b.String()
}

// tabView renders the marketplace tabs.
func (m MarketplaceModel) tabView() string {
	if len(m.marketplaces) == 0 {
		return lipgloss.NewStyle().Foreground(theme.ColorTextDim).Render("No marketplaces registered")
	}

	tabs := make([]string, 0, len(m.marketplaces))
	for i, mp := range m.marketplaces {
		label := fmt.Sprintf("%d. %s", i+1, mp.Name)
		if i == m.activeTab {
			tabs = append(tabs, theme.ActiveTabStyle.Render(label))
		} else {
			tabs = append(tabs, theme.InactiveTabStyle.Render(label))
		}
	}

	gap := lipgloss.NewStyle().Render("  ")
	return strings.Join(tabs, gap)
}

// filterPlugins rebuilds the filtered list and table rows from the search query.
func (m *MarketplaceModel) filterPlugins() {
	name := m.activeMarketplaceName()
	all := m.plugins[name]
	query := strings.ToLower(m.search.Value())

	m.filtered = nil
	for _, p := range all {
		if query == "" ||
			strings.Contains(strings.ToLower(p.Name), query) ||
			strings.Contains(strings.ToLower(p.Description), query) {
			m.filtered = append(m.filtered, p)
		}
	}

	rows := make([]components.Row, 0, len(m.filtered))
	for _, p := range m.filtered {
		status := theme.InstalledBadge(p.Installed)
		rows = append(rows, components.Row{p.Name, p.Description, p.Version, status})
	}
	m.table.SetRows(rows)
}

// switchTab moves the active tab by delta, wrapping around.
func (m *MarketplaceModel) switchTab(delta int) {
	n := len(m.marketplaces)
	if n == 0 {
		return
	}
	m.activeTab = (m.activeTab + delta + n) % n
	m.filterPlugins()
}

// activeMarketplaceName returns the name of the currently selected marketplace.
func (m *MarketplaceModel) activeMarketplaceName() string {
	if m.activeTab >= 0 && m.activeTab < len(m.marketplaces) {
		return m.marketplaces[m.activeTab].Name
	}
	return ""
}

// selectedPlugin returns a pointer to the currently selected filtered plugin, or nil.
func (m *MarketplaceModel) selectedPlugin() *copilot.MarketplacePlugin {
	idx := m.table.Cursor
	if idx >= 0 && idx < len(m.filtered) {
		return &m.filtered[idx]
	}
	return nil
}

// helpView renders the bottom help line.
func (m MarketplaceModel) helpView() string {
	pairs := []struct{ key, desc string }{
		{"←/→", "switch tab"},
		{"↑/↓", "navigate"},
		{"enter", "view detail"},
		{"i", "install"},
		{"/", "search"},
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
