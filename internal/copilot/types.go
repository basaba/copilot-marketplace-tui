package copilot

// PluginStatus represents whether a plugin is enabled or disabled
type PluginStatus string

const (
	StatusEnabled  PluginStatus = "enabled"
	StatusDisabled PluginStatus = "disabled"
)

// Plugin represents a Copilot CLI plugin (common fields for both installed and marketplace)
type Plugin struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Version     string   `json:"version"`
	Author      string   `json:"author,omitempty"`
	Source      string   `json:"source,omitempty"`
	Skills      []string `json:"skills,omitempty"`
	Agents      []string `json:"agents,omitempty"`
	Hooks       []string `json:"hooks,omitempty"`
	MCPServers  []string `json:"mcp_servers,omitempty"`
	LSPServers  []string `json:"lsp_servers,omitempty"`
}

// InstalledPlugin extends Plugin with installation-specific info
type InstalledPlugin struct {
	Plugin
	Status          PluginStatus `json:"status"`
	Marketplace     string       `json:"marketplace,omitempty"`
	UpdateAvailable bool         `json:"update_available,omitempty"`
	InstalledPath   string       `json:"installed_path,omitempty"`
}

// MarketplacePlugin extends Plugin with marketplace-specific info
type MarketplacePlugin struct {
	Plugin
	Installed       bool   `json:"installed"`
	MarketplaceName string `json:"marketplace_name"`
}

// Marketplace represents a registered plugin marketplace
type Marketplace struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	URL         string `json:"url,omitempty"`
	PluginCount int    `json:"plugin_count,omitempty"`
}

// PluginSummary holds aggregate stats for the dashboard
type PluginSummary struct {
	TotalInstalled   int
	EnabledCount     int
	DisabledCount    int
	UpdatesAvailable int
	MarketplaceCount int
}

// CommandResult wraps the result of a CLI command execution
type CommandResult struct {
	Success bool
	Output  string
	Error   string
}
