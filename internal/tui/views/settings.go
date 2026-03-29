package views

import (
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/components"
)

// Mode enum for the settings view.
const (
	settingsNormal       int = iota
	settingsAdding
	settingsConfirmRemove
)

// IsInputActive returns true when the view is capturing keyboard input (adding or confirming).
func (m SettingsModel) IsInputActive() bool {
	return m.mode != settingsNormal
}

// Action messages for the app shell to handle.
type SettingsAddMsg struct{ Spec string }
type SettingsRemoveMsg struct{ Name string }

// SettingsModel is the Bubble Tea model for the settings / marketplace management view.
type SettingsModel struct {
	marketplaces []copilot.Marketplace
	table        components.Table
	mode         int
	addInput     textinput.Model
	confirm      components.ConfirmModel
	width        int
	height       int
}

var settingsColumns = []components.Column{
	{Title: "Name", Width: 25},
	{Title: "Description", Width: 40},
	{Title: "URL", Width: 30},
}

// NewSettings creates a new SettingsModel with the given marketplaces.
func NewSettings(marketplaces []copilot.Marketplace) SettingsModel {
	ti := textinput.New()
	ti.Placeholder = "Enter marketplace URL or owner/repo..."
	ti.CharLimit = 200

	m := SettingsModel{
		table:    components.NewTable(settingsColumns, 15),
		addInput: ti,
		mode:     settingsNormal,
	}
	m.SetMarketplaces(marketplaces)
	return m
}

// SetMarketplaces replaces the marketplace list and rebuilds the table rows.
func (m *SettingsModel) SetMarketplaces(marketplaces []copilot.Marketplace) {
	m.marketplaces = marketplaces
	rows := make([]components.Row, 0, len(marketplaces))
	for _, mp := range marketplaces {
		rows = append(rows, components.Row{mp.Name, mp.Description, mp.URL})
	}
	m.table.SetRows(rows)
}

// SetSize updates the available dimensions.
func (m *SettingsModel) SetSize(w, h int) {
	m.width = w
	m.height = h
	tableHeight := h - 10
	if tableHeight < 3 {
		tableHeight = 3
	}
	m.table.Height = tableHeight
}

// Update handles messages and returns the updated model plus any command.
func (m SettingsModel) Update(msg tea.Msg) (SettingsModel, tea.Cmd) {
	switch m.mode {
	case settingsAdding:
		return m.updateAdding(msg)
	case settingsConfirmRemove:
		return m.updateConfirmRemove(msg)
	default:
		return m.updateNormal(msg)
	}
}

func (m SettingsModel) updateNormal(msg tea.Msg) (SettingsModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "up", "k":
			m.table.MoveUp()
		case "down", "j":
			m.table.MoveDown()
		case "a":
			m.mode = settingsAdding
			m.addInput.Reset()
			return m, m.addInput.Focus()
		case "x":
			if sel := m.selectedMarketplace(); sel != nil {
				m.confirm = components.NewConfirm(
					"remove-marketplace",
					"Remove Marketplace",
					"Are you sure you want to remove \""+sel.Name+"\"?",
				)
				m.mode = settingsConfirmRemove
			}
		}
	}
	return m, nil
}

func (m SettingsModel) updateAdding(msg tea.Msg) (SettingsModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyEsc:
			m.mode = settingsNormal
			m.addInput.Blur()
			return m, nil
		case tea.KeyEnter:
			spec := strings.TrimSpace(m.addInput.Value())
			if spec != "" {
				m.mode = settingsNormal
				m.addInput.Blur()
				return m, func() tea.Msg {
					return SettingsAddMsg{Spec: spec}
				}
			}
			return m, nil
		}
	}

	var cmd tea.Cmd
	m.addInput, cmd = m.addInput.Update(msg)
	return m, cmd
}

func (m SettingsModel) updateConfirmRemove(msg tea.Msg) (SettingsModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if msg.Type == tea.KeyEsc {
			m.mode = settingsNormal
			return m, nil
		}
	case components.ConfirmResult:
		m.mode = settingsNormal
		if msg.Confirmed {
			if sel := m.selectedMarketplace(); sel != nil {
				name := sel.Name
				return m, func() tea.Msg {
					return SettingsRemoveMsg{Name: name}
				}
			}
		}
		return m, nil
	}

	var cmd tea.Cmd
	m.confirm, cmd = m.confirm.Update(msg)
	return m, cmd
}

// View renders the settings view.
func (m SettingsModel) View() string {
	var b strings.Builder

	b.WriteString(theme.TitleStyle.Render("Settings — Marketplace Management"))
	b.WriteString("\n\n")

	b.WriteString(m.table.View())
	b.WriteString("\n\n")

	if m.mode == settingsAdding {
		b.WriteString(m.addInputView())
		b.WriteString("\n\n")
	}

	if m.mode == settingsConfirmRemove {
		b.WriteString(m.confirm.View())
		b.WriteString("\n\n")
	}

	b.WriteString(m.helpView())

	return b.String()
}

// addInputView renders the text input with a rounded border when active.
func (m SettingsModel) addInputView() string {
	inputStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.ColorPrimary).
		Padding(0, 1)

	label := lipgloss.NewStyle().
		Foreground(theme.ColorPrimary).
		Bold(true).
		Render("Add Marketplace")

	return label + "\n" + inputStyle.Render(m.addInput.View())
}

// helpView renders the bottom help line based on the current mode.
func (m SettingsModel) helpView() string {
	var pairs []struct{ key, desc string }

	switch m.mode {
	case settingsAdding:
		pairs = []struct{ key, desc string }{
			{"enter", "submit"},
			{"esc", "cancel"},
		}
	case settingsConfirmRemove:
		pairs = []struct{ key, desc string }{
			{"←/→", "select"},
			{"enter", "confirm"},
			{"esc", "cancel"},
		}
	default:
		pairs = []struct{ key, desc string }{
			{"↑/↓", "navigate"},
			{"a", "add marketplace"},
			{"x", "remove selected"},
			{"esc", "back"},
		}
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

// selectedMarketplace returns a pointer to the currently selected marketplace, or nil.
func (m *SettingsModel) selectedMarketplace() *copilot.Marketplace {
	idx := m.table.Cursor
	if idx >= 0 && idx < len(m.marketplaces) {
		return &m.marketplaces[idx]
	}
	return nil
}
