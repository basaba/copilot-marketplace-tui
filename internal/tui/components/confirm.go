package components

import (
	"fmt"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	dialogBoxStyle = lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(lipgloss.Color("#d29922")).
		Padding(1, 3).
		Width(50).
		Align(lipgloss.Center)

	dialogTitleStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#d29922")).
		Bold(true)

	dialogBtnActiveStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#ffffff")).
		Background(lipgloss.Color("#58a6ff")).
		Padding(0, 2).
		Bold(true)

	dialogBtnInactiveStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#8b949e")).
		Padding(0, 2)
)

// ConfirmResult is sent when the user confirms or cancels
type ConfirmResult struct {
	ID        string
	Confirmed bool
}

// ConfirmModel is a confirmation dialog
type ConfirmModel struct {
	ID      string
	Title   string
	Message string
	focused int // 0 = Yes, 1 = No
	Active  bool
}

// NewConfirm creates a new confirmation dialog
func NewConfirm(id, title, message string) ConfirmModel {
	return ConfirmModel{
		ID:      id,
		Title:   title,
		Message: message,
		focused: 1, // default to No for safety
		Active:  true,
	}
}

// Update handles key presses
func (m ConfirmModel) Update(msg tea.Msg) (ConfirmModel, tea.Cmd) {
	if !m.Active {
		return m, nil
	}
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "left", "h", "tab":
			m.focused = (m.focused + 1) % 2
		case "right", "l", "shift+tab":
			m.focused = (m.focused + 1) % 2
		case "enter":
			m.Active = false
			return m, func() tea.Msg {
				return ConfirmResult{ID: m.ID, Confirmed: m.focused == 0}
			}
		case "esc":
			m.Active = false
			return m, func() tea.Msg {
				return ConfirmResult{ID: m.ID, Confirmed: false}
			}
		case "y", "Y":
			m.Active = false
			return m, func() tea.Msg {
				return ConfirmResult{ID: m.ID, Confirmed: true}
			}
		case "n", "N":
			m.Active = false
			return m, func() tea.Msg {
				return ConfirmResult{ID: m.ID, Confirmed: false}
			}
		}
	}
	return m, nil
}

// View renders the confirmation dialog
func (m ConfirmModel) View() string {
	if !m.Active {
		return ""
	}
	title := dialogTitleStyle.Render(m.Title)
	msg := m.Message

	yes := dialogBtnInactiveStyle.Render("[ Yes ]")
	no := dialogBtnInactiveStyle.Render("[ No ]")
	if m.focused == 0 {
		yes = dialogBtnActiveStyle.Render("[ Yes ]")
	} else {
		no = dialogBtnActiveStyle.Render("[ No ]")
	}

	buttons := fmt.Sprintf("%s   %s", yes, no)

	content := fmt.Sprintf("%s\n\n%s\n\n%s", title, msg, buttons)
	return dialogBoxStyle.Render(content)
}
