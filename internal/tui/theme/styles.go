package theme

import "github.com/charmbracelet/lipgloss"

// Colors - GitHub-inspired dark theme
var (
	ColorPrimary   = lipgloss.Color("#58a6ff") // blue
	ColorSecondary = lipgloss.Color("#8b949e") // gray
	ColorSuccess   = lipgloss.Color("#3fb950") // green
	ColorWarning   = lipgloss.Color("#d29922") // yellow
	ColorDanger    = lipgloss.Color("#f85149") // red
	ColorAccent    = lipgloss.Color("#bc8cff") // purple
	ColorBg        = lipgloss.Color("#0d1117") // dark bg
	ColorBgAlt     = lipgloss.Color("#161b22") // slightly lighter bg
	ColorBorder    = lipgloss.Color("#30363d") // border
	ColorText      = lipgloss.Color("#c9d1d9") // primary text
	ColorTextDim   = lipgloss.Color("#8b949e") // dim text
	ColorWhite     = lipgloss.Color("#ffffff")
)

// App-level styles
var (
	AppStyle = lipgloss.NewStyle().
			Padding(1, 2)

	// Header / Title bar
	TitleStyle = lipgloss.NewStyle().
			Foreground(ColorWhite).
			Background(ColorPrimary).
			Bold(true).
			Padding(0, 2).
			MarginBottom(1)

	SubtitleStyle = lipgloss.NewStyle().
			Foreground(ColorSecondary).
			Italic(true)

	// Tab bar for navigation
	ActiveTabStyle = lipgloss.NewStyle().
			Foreground(ColorWhite).
			Background(ColorPrimary).
			Bold(true).
			Padding(0, 2)

	InactiveTabStyle = lipgloss.NewStyle().
				Foreground(ColorTextDim).
				Background(ColorBgAlt).
				Padding(0, 2)

	TabGapStyle = lipgloss.NewStyle().
			Foreground(ColorBorder)

	// List / Table styles
	SelectedItemStyle = lipgloss.NewStyle().
				Foreground(ColorWhite).
				Background(ColorPrimary).
				Bold(true).
				Padding(0, 1)

	NormalItemStyle = lipgloss.NewStyle().
			Foreground(ColorText).
			Padding(0, 1)

	// Status indicators
	EnabledStyle = lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Bold(true)

	DisabledStyle = lipgloss.NewStyle().
			Foreground(ColorDanger)

	UpdateAvailableStyle = lipgloss.NewStyle().
				Foreground(ColorWarning).
				Bold(true)

	InstalledBadgeStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess).
				Bold(true)

	// Content boxes
	BoxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorBorder).
			Padding(1, 2)

	ActiveBoxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorPrimary).
			Padding(1, 2)

	// Dashboard stat cards
	StatCardStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorBorder).
			Padding(1, 3).
			Width(22).
			Align(lipgloss.Center)

	StatNumberStyle = lipgloss.NewStyle().
			Foreground(ColorPrimary).
			Bold(true)

	StatLabelStyle = lipgloss.NewStyle().
			Foreground(ColorTextDim)

	// Detail view
	DetailLabelStyle = lipgloss.NewStyle().
				Foreground(ColorAccent).
				Bold(true).
				Width(16)

	DetailValueStyle = lipgloss.NewStyle().
				Foreground(ColorText)

	// Search bar
	SearchStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorSecondary).
			Padding(0, 1).
			MarginBottom(1)

	SearchActiveStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(ColorPrimary).
				Padding(0, 1).
				MarginBottom(1)

	SearchPromptStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary)

	// Status bar (bottom)
	StatusBarStyle = lipgloss.NewStyle().
			Foreground(ColorTextDim).
			Background(ColorBgAlt).
			Padding(0, 1)

	StatusBarKeyStyle = lipgloss.NewStyle().
				Foreground(ColorPrimary).
				Background(ColorBgAlt).
				Bold(true).
				Padding(0, 1)

	StatusBarValueStyle = lipgloss.NewStyle().
				Foreground(ColorText).
				Background(ColorBgAlt).
				Padding(0, 1)

	// Confirmation dialog
	DialogStyle = lipgloss.NewStyle().
			Border(lipgloss.DoubleBorder()).
			BorderForeground(ColorWarning).
			Padding(1, 3).
			Width(50).
			Align(lipgloss.Center)

	DialogTitleStyle = lipgloss.NewStyle().
				Foreground(ColorWarning).
				Bold(true).
				MarginBottom(1)

	// Spinner / loading
	SpinnerStyle = lipgloss.NewStyle().
			Foreground(ColorPrimary)

	// Toast / notification
	SuccessToastStyle = lipgloss.NewStyle().
				Foreground(ColorSuccess).
				Bold(true).
				Padding(0, 1)

	ErrorToastStyle = lipgloss.NewStyle().
			Foreground(ColorDanger).
			Bold(true).
			Padding(0, 1)

	// Help text
	HelpKeyStyle = lipgloss.NewStyle().
			Foreground(ColorPrimary).
			Bold(true)

	HelpDescStyle = lipgloss.NewStyle().
			Foreground(ColorTextDim)

	HelpSepStyle = lipgloss.NewStyle().
			Foreground(ColorBorder)
)

// Helper functions

// StatusText returns a styled status string.
func StatusText(enabled bool) string {
	if enabled {
		return EnabledStyle.Render("● enabled")
	}
	return DisabledStyle.Render("○ disabled")
}

// InstalledBadge returns a styled "installed" badge or empty string.
func InstalledBadge(installed bool) string {
	if installed {
		return InstalledBadgeStyle.Render("✓ installed")
	}
	return ""
}

// UpdateBadge returns a styled "update available" badge or empty string.
func UpdateBadge(available bool) string {
	if available {
		return UpdateAvailableStyle.Render("⬆ update")
	}
	return ""
}
