package views

import (
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
)

// Action messages emitted by the detail view.

type DetailBackMsg struct{}

type DetailInstallMsg struct {
	Name string
}

type DetailUninstallMsg struct {
	Name string
}

type DetailEnableMsg struct {
	Name string
}

type DetailDisableMsg struct {
	Name string
}

type DetailUpdateMsg struct {
	Name string
}

// DetailModel displays the full detail view for a single plugin.
type DetailModel struct {
	plugin          copilot.Plugin
	installed       bool
	enabled         bool
	updateAvailable bool
	marketplace     string
	selectedAction  int
	width           int
	height          int
}

// NewDetailFromInstalled creates a DetailModel from an installed plugin.
func NewDetailFromInstalled(p copilot.InstalledPlugin) DetailModel {
	return DetailModel{
		plugin:          p.Plugin,
		installed:       true,
		enabled:         p.Status == copilot.StatusEnabled,
		updateAvailable: p.UpdateAvailable,
		marketplace:     p.Marketplace,
	}
}

// NewDetailFromMarketplace creates a DetailModel from a marketplace plugin.
func NewDetailFromMarketplace(p copilot.MarketplacePlugin) DetailModel {
	return DetailModel{
		plugin:      p.Plugin,
		installed:   p.Installed,
		enabled:     false,
		marketplace: p.MarketplaceName,
	}
}

// SetSize updates the available width and height for rendering.
func (m *DetailModel) SetSize(w, h int) {
	m.width = w
	m.height = h
}

// actions returns the list of contextual action labels available.
func (m DetailModel) actions() []string {
	if !m.installed {
		return []string{"[i] install", "[esc] back"}
	}
	acts := make([]string, 0, 5)
	if m.enabled {
		acts = append(acts, "[d] disable")
	} else {
		acts = append(acts, "[e] enable")
	}
	acts = append(acts, "[x] uninstall")
	if m.updateAvailable {
		acts = append(acts, "[u] update")
	}
	acts = append(acts, "[esc] back")
	return acts
}

// Update handles key messages and returns appropriate action messages.
func (m DetailModel) Update(msg tea.Msg) (DetailModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "esc":
			return m, func() tea.Msg { return DetailBackMsg{} }
		case "i":
			if !m.installed {
				return m, func() tea.Msg { return DetailInstallMsg{Name: m.plugin.Name} }
			}
		case "x":
			if m.installed {
				return m, func() tea.Msg { return DetailUninstallMsg{Name: m.plugin.Name} }
			}
		case "e":
			if m.installed && !m.enabled {
				return m, func() tea.Msg { return DetailEnableMsg{Name: m.plugin.Name} }
			}
		case "d":
			if m.installed && m.enabled {
				return m, func() tea.Msg { return DetailDisableMsg{Name: m.plugin.Name} }
			}
		case "u":
			if m.installed && m.updateAvailable {
				return m, func() tea.Msg { return DetailUpdateMsg{Name: m.plugin.Name} }
			}
		}
	}
	return m, nil
}

// View renders the full detail view.
func (m DetailModel) View() string {
	var sections []string

	// Title
	title := theme.TitleStyle.Render("Plugin: " + m.plugin.Name)
	sections = append(sections, title)

	// Info section inside a box
	sections = append(sections, m.renderInfoBox())

	// Components section
	sections = append(sections, m.renderComponents())

	// Status section
	sections = append(sections, m.renderStatus())

	// Action bar
	sections = append(sections, m.renderActionBar())

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

// renderInfoBox renders the info section with labeled rows inside a box.
func (m DetailModel) renderInfoBox() string {
	rows := []string{
		m.labeledRow("Name", m.plugin.Name),
		m.labeledRow("Description", m.plugin.Description),
		m.labeledRow("Version", m.plugin.Version),
		m.labeledRow("Author", m.plugin.Author),
		m.labeledRow("Source", m.plugin.Source),
		m.labeledRow("Marketplace", m.marketplace),
	}
	content := lipgloss.JoinVertical(lipgloss.Left, rows...)
	boxWidth := m.width
	if boxWidth > 0 {
		return theme.BoxStyle.Width(boxWidth - 4).Render(content)
	}
	return theme.BoxStyle.Render(content)
}

// renderComponents renders the plugin components section.
func (m DetailModel) renderComponents() string {
	header := lipgloss.NewStyle().
		Foreground(theme.ColorPrimary).
		Bold(true).
		MarginTop(1).
		Render("Components")

	rows := []string{
		header,
		m.labeledRow("Skills", formatList(m.plugin.Skills)),
		m.labeledRow("Agents", formatList(m.plugin.Agents)),
		m.labeledRow("Hooks", formatList(m.plugin.Hooks)),
		m.labeledRow("MCP Servers", formatList(m.plugin.MCPServers)),
	}
	return lipgloss.JoinVertical(lipgloss.Left, rows...)
}

// renderStatus renders the status section.
func (m DetailModel) renderStatus() string {
	header := lipgloss.NewStyle().
		Foreground(theme.ColorPrimary).
		Bold(true).
		MarginTop(1).
		Render("Status")

	var statusParts []string
	if m.installed {
		statusParts = append(statusParts, theme.EnabledStyle.Render("✓ installed"))
	} else {
		statusParts = append(statusParts, theme.DisabledStyle.Render("✗ not installed"))
	}

	if m.installed {
		statusParts = append(statusParts, theme.StatusText(m.enabled))
	}

	if m.updateAvailable {
		statusParts = append(statusParts, theme.UpdateAvailableStyle.Render("⬆ update available"))
	}

	statusLine := strings.Join(statusParts, "  ")
	return lipgloss.JoinVertical(lipgloss.Left, header, statusLine)
}

// renderActionBar renders the contextual action bar at the bottom.
func (m DetailModel) renderActionBar() string {
	acts := m.actions()
	parts := make([]string, len(acts))
	for i, a := range acts {
		// Split on "] " to style key and description separately
		idx := strings.Index(a, "] ")
		if idx == -1 {
			parts[i] = theme.HelpDescStyle.Render(a)
			continue
		}
		key := a[:idx+1]  // e.g. "[i]"
		desc := a[idx+1:] // e.g. " install"
		parts[i] = theme.HelpKeyStyle.Render(key) + theme.HelpDescStyle.Render(desc)
	}
	bar := strings.Join(parts, "    ")
	return lipgloss.NewStyle().MarginTop(1).Render(bar)
}

// labeledRow renders a single label: value row.
func (m DetailModel) labeledRow(label, value string) string {
	if value == "" {
		value = "—"
	}
	return theme.DetailLabelStyle.Render(label) + theme.DetailValueStyle.Render(value)
}

// formatList joins a slice as a comma-separated string or returns "none".
func formatList(items []string) string {
	if len(items) == 0 {
		return "none"
	}
	return strings.Join(items, ", ")
}
