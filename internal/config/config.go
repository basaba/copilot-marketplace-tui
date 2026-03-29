package config

// AppName is the application name shown in the TUI header
const AppName = "CPM — Copilot Plugin Manager"

// AppVersion is the current application version
const AppVersion = "0.1.0"

// Config holds app-level configuration
type Config struct {
	// DemoMode uses mock data instead of calling copilot CLI
	DemoMode bool

	// CopilotBin overrides the path to the copilot binary
	CopilotBin string
}

// DefaultConfig returns sensible defaults
func DefaultConfig() Config {
	return Config{
		DemoMode: false,
	}
}
