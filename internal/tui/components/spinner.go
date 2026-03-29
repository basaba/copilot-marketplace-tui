package components

import (
	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// SpinnerModel wraps a bubbles spinner with a message
type SpinnerModel struct {
	spinner spinner.Model
	Message string
	Active  bool
}

// NewSpinner creates a new loading spinner
func NewSpinner(message string) SpinnerModel {
	s := spinner.New()
	s.Spinner = spinner.Dot
	s.Style = lipgloss.NewStyle().Foreground(lipgloss.Color("#58a6ff"))
	return SpinnerModel{
		spinner: s,
		Message: message,
		Active:  true,
	}
}

// Init returns the spinner tick command
func (m SpinnerModel) Init() tea.Cmd {
	return m.spinner.Tick
}

// Update handles spinner animation
func (m SpinnerModel) Update(msg tea.Msg) (SpinnerModel, tea.Cmd) {
	if !m.Active {
		return m, nil
	}
	var cmd tea.Cmd
	m.spinner, cmd = m.spinner.Update(msg)
	return m, cmd
}

// View renders the spinner with message
func (m SpinnerModel) View() string {
	if !m.Active {
		return ""
	}
	msgStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#c9d1d9"))
	return m.spinner.View() + " " + msgStyle.Render(m.Message)
}
