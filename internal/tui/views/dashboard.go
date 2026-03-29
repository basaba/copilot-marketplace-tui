package views

import (
	"fmt"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
)

const dashboardVersion = "v0.1.0"

// DashboardAction represents an action the user can select from the quick-actions menu.
type DashboardAction int

const (
	ActionBrowseMarketplace DashboardAction = iota
	ActionManageInstalled
	ActionCheckUpdates
	ActionSettings
)

// DashboardSelectMsg is sent when the user presses enter on a quick action.
type DashboardSelectMsg struct {
	Action DashboardAction
}

type quickAction struct {
	action DashboardAction
	label  string
	desc   string
}

var quickActions = []quickAction{
	{ActionBrowseMarketplace, "Browse Marketplace", "Discover and install new plugins"},
	{ActionManageInstalled, "Manage Installed", "View and configure installed plugins"},
	{ActionCheckUpdates, "Check Updates", "Check for plugin updates"},
	{ActionSettings, "Settings", "Configure CPM preferences"},
}

// DashboardModel is the Bubble Tea sub-model for the home/dashboard screen.
type DashboardModel struct {
	Summary        copilot.PluginSummary
	selectedAction int
	width          int
	height         int
}

// NewDashboard creates a new DashboardModel with the given summary.
func NewDashboard(summary copilot.PluginSummary) DashboardModel {
	return DashboardModel{
		Summary: summary,
	}
}

// SetSize updates the viewport dimensions.
func (m *DashboardModel) SetSize(w, h int) {
	m.width = w
	m.height = h
}

// SetSummary updates the plugin summary stats.
func (m *DashboardModel) SetSummary(s copilot.PluginSummary) {
	m.Summary = s
}

// Init satisfies the tea.Model interface (no initial command).
func (m DashboardModel) Init() tea.Cmd {
	return nil
}

// Update handles key messages for the dashboard.
func (m DashboardModel) Update(msg tea.Msg) (DashboardModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			if m.selectedAction > 0 {
				m.selectedAction--
			}
		case "down", "j":
			if m.selectedAction < len(quickActions)-1 {
				m.selectedAction++
			}
		case "enter":
			return m, func() tea.Msg {
				return DashboardSelectMsg{Action: quickActions[m.selectedAction].action}
			}
		}
	}
	return m, nil
}

// View renders the full dashboard screen.
func (m DashboardModel) View() string {
	// Title
	title := theme.TitleStyle.Render("⚡ CPM — Copilot Plugin Manager " + dashboardVersion)
	subtitle := theme.SubtitleStyle.Render("Manage your GitHub Copilot plugins from the terminal")

	// Stat cards
	cards := m.renderStatCards()

	// Quick actions
	actionsTitle := lipgloss.NewStyle().
		Foreground(theme.ColorText).
		Bold(true).
		MarginTop(1).
		MarginBottom(1).
		Render("Quick Actions")

	actionsList := m.renderQuickActions()

	actionsBox := theme.BoxStyle.Render(
		lipgloss.JoinVertical(lipgloss.Left, actionsTitle, actionsList),
	)

	// Help legend
	help := m.renderHelp()

	// Join everything vertically
	content := lipgloss.JoinVertical(
		lipgloss.Left,
		title,
		subtitle,
		"",
		cards,
		"",
		actionsBox,
		"",
		help,
	)

	return content
}

func (m DashboardModel) renderStatCards() string {
	type cardDef struct {
		value int
		label string
		color lipgloss.Color
	}

	defs := []cardDef{
		{m.Summary.TotalInstalled, "Installed", theme.ColorPrimary},
		{m.Summary.EnabledCount, "Enabled", theme.ColorSuccess},
		{m.Summary.DisabledCount, "Disabled", theme.ColorWarning},
		{m.Summary.UpdatesAvailable, "Updates", theme.ColorDanger},
	}

	cards := make([]string, len(defs))
	for i, d := range defs {
		numStr := theme.StatNumberStyle.Copy().
			Foreground(d.color).
			Render(fmt.Sprintf("%d", d.value))

		labelStr := theme.StatLabelStyle.Render(d.label)

		card := theme.StatCardStyle.Copy().
			BorderForeground(d.color).
			Render(lipgloss.JoinVertical(lipgloss.Center, numStr, labelStr))

		cards[i] = card
	}

	return lipgloss.JoinHorizontal(lipgloss.Top, cards...)
}

func (m DashboardModel) renderQuickActions() string {
	items := make([]string, len(quickActions))

	selectedStyle := lipgloss.NewStyle().
		Foreground(theme.ColorPrimary).
		Bold(true)

	normalStyle := lipgloss.NewStyle().
		Foreground(theme.ColorText)

	descStyle := lipgloss.NewStyle().
		Foreground(theme.ColorTextDim)

	for i, qa := range quickActions {
		var line string
		if i == m.selectedAction {
			indicator := selectedStyle.Render("▸ ")
			label := selectedStyle.Render(qa.label)
			desc := descStyle.Render("  " + qa.desc)
			line = indicator + label + desc
		} else {
			indicator := normalStyle.Render("  ")
			label := normalStyle.Render(qa.label)
			desc := descStyle.Render("  " + qa.desc)
			line = indicator + label + desc
		}
		items[i] = line
	}

	return lipgloss.JoinVertical(lipgloss.Left, items...)
}

func (m DashboardModel) renderHelp() string {
	pairs := []struct {
		key  string
		desc string
	}{
		{"↑/↓", "navigate"},
		{"enter", "select"},
		{"tab", "switch tab"},
		{"/", "search"},
		{"q", "quit"},
		{"?", "help"},
	}

	parts := make([]string, len(pairs))
	for i, p := range pairs {
		k := theme.HelpKeyStyle.Render(p.key)
		d := theme.HelpDescStyle.Render(" " + p.desc)
		parts[i] = k + d
	}

	sep := theme.HelpDescStyle.Render("  •  ")
	result := parts[0]
	for i := 1; i < len(parts); i++ {
		result += sep + parts[i]
	}

	return result
}
