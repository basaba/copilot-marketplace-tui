package components

import (
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	searchBoxActive = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#58a6ff")).
		Padding(0, 1)

	searchBoxInactive = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#30363d")).
		Padding(0, 1)
)

// SearchChangedMsg is sent when the search query changes
type SearchChangedMsg struct {
	Query string
}

// SearchBar is a search/filter input component
type SearchBar struct {
	input  textinput.Model
	Active bool
	Width  int
}

// NewSearchBar creates a new search bar
func NewSearchBar(placeholder string) SearchBar {
	ti := textinput.New()
	ti.Placeholder = placeholder
	ti.Prompt = "🔍 "
	ti.CharLimit = 100
	return SearchBar{
		input: ti,
		Width: 40,
	}
}

// Focus activates the search bar
func (s *SearchBar) Focus() tea.Cmd {
	s.Active = true
	return s.input.Focus()
}

// Blur deactivates the search bar
func (s *SearchBar) Blur() {
	s.Active = false
	s.input.Blur()
}

// Value returns the current search query
func (s SearchBar) Value() string {
	return s.input.Value()
}

// Reset clears the search bar
func (s *SearchBar) Reset() {
	s.input.Reset()
	s.Active = false
	s.input.Blur()
}

// SetWidth sets the width of the search bar
func (s *SearchBar) SetWidth(w int) {
	s.Width = w
	s.input.Width = w - 6 // account for prompt and padding
}

// Update handles input
func (s SearchBar) Update(msg tea.Msg) (SearchBar, tea.Cmd) {
	if !s.Active {
		return s, nil
	}
	var cmd tea.Cmd
	s.input, cmd = s.input.Update(msg)
	return s, tea.Batch(cmd, func() tea.Msg {
		return SearchChangedMsg{Query: s.input.Value()}
	})
}

// View renders the search bar
func (s SearchBar) View() string {
	style := searchBoxInactive
	if s.Active {
		style = searchBoxActive
	}
	return style.Width(s.Width).Render(s.input.View())
}
