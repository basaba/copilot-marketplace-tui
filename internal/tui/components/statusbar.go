package components

import (
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	statusBarKeyStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#58a6ff")).
		Bold(true).
		Padding(0, 1)

	statusBarValStyle = lipgloss.NewStyle().
		Foreground(lipgloss.Color("#c9d1d9")).
		Padding(0, 1, 0, 0)

	statusBarBg = lipgloss.NewStyle().
		Background(lipgloss.Color("#161b22"))
)

// StatusBarItem is a key-value pair shown in the status bar
type StatusBarItem struct {
	Key   string
	Value string
}

// RenderStatusBar renders a status bar at the bottom with key-value items
func RenderStatusBar(items []StatusBarItem, width int) string {
	var parts []string
	for _, item := range items {
		k := statusBarKeyStyle.Render(item.Key)
		v := statusBarValStyle.Render(item.Value)
		parts = append(parts, k+v)
	}
	bar := strings.Join(parts, statusBarValStyle.Render(" │ "))
	return statusBarBg.Width(width).Render(bar)
}
