package copilot

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// Client wraps copilot CLI plugin commands
type Client struct {
	copilotBin string // path to copilot binary
}

// NewClient creates a new Client, locating the copilot binary
func NewClient() (*Client, error) {
	bin, err := exec.LookPath("copilot")
	if err != nil {
		return nil, fmt.Errorf("copilot CLI not found in PATH: %w", err)
	}
	return &Client{copilotBin: bin}, nil
}

// NewClientWithBin creates a client with a specific binary path (for testing)
func NewClientWithBin(bin string) *Client {
	return &Client{copilotBin: bin}
}

// runCommand executes a copilot CLI command and returns the output
func (c *Client) runCommand(args ...string) (string, error) {
	cmd := exec.Command(c.copilotBin, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("command failed: %s: %w", strings.TrimSpace(stderr.String()), err)
	}
	return strings.TrimSpace(stdout.String()), nil
}

// ListInstalled returns all installed plugins
func (c *Client) ListInstalled() (string, error) {
	return c.runCommand("plugin", "list")
}

// InstallPlugin installs a plugin by name or source
func (c *Client) InstallPlugin(source string) (string, error) {
	return c.runCommand("plugin", "install", source)
}

// UninstallPlugin removes an installed plugin
func (c *Client) UninstallPlugin(name string) (string, error) {
	return c.runCommand("plugin", "uninstall", name)
}

// EnablePlugin enables a disabled plugin
func (c *Client) EnablePlugin(name string) (string, error) {
	return c.runCommand("plugin", "enable", name)
}

// DisablePlugin disables an enabled plugin
func (c *Client) DisablePlugin(name string) (string, error) {
	return c.runCommand("plugin", "disable", name)
}

// UpdatePlugin updates a specific plugin
func (c *Client) UpdatePlugin(name string) (string, error) {
	return c.runCommand("plugin", "update", name)
}

// UpdateAll updates all installed plugins
func (c *Client) UpdateAll() (string, error) {
	return c.runCommand("plugin", "update", "--all")
}

// ListMarketplaces returns registered marketplaces
func (c *Client) ListMarketplaces() (string, error) {
	return c.runCommand("plugin", "marketplace", "list")
}

// BrowseMarketplace lists plugins in a marketplace
func (c *Client) BrowseMarketplace(name string) (string, error) {
	return c.runCommand("plugin", "marketplace", "browse", name)
}

// AddMarketplace registers a new marketplace
func (c *Client) AddMarketplace(spec string) (string, error) {
	return c.runCommand("plugin", "marketplace", "add", spec)
}

// RemoveMarketplace removes a registered marketplace
func (c *Client) RemoveMarketplace(name string) (string, error) {
	return c.runCommand("plugin", "marketplace", "remove", name)
}
