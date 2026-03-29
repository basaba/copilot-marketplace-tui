package copilot

import (
	"encoding/json"
	"regexp"
	"strings"
)

// ParseInstalledPlugins attempts to parse the output of `copilot plugin list`
// Real format example:
//
//	Installed plugins:
//	  • workiq@copilot-plugins (v1.0.0)
//	  • terraform-helper@awesome-copilot (v0.5.0) [disabled]
func ParseInstalledPlugins(output string) []InstalledPlugin {
	// Try JSON first
	var plugins []InstalledPlugin
	if err := json.Unmarshal([]byte(output), &plugins); err == nil && len(plugins) > 0 {
		return plugins
	}

	var wrapper struct {
		Plugins []InstalledPlugin `json:"plugins"`
	}
	if err := json.Unmarshal([]byte(output), &wrapper); err == nil && len(wrapper.Plugins) > 0 {
		return wrapper.Plugins
	}

	// Real CLI format: "• name@marketplace (vX.Y.Z) [disabled]"
	re := regexp.MustCompile(`[•◆\-\*]\s+([^@\s]+)(?:@(\S+))?\s*(?:\(v?([^)]+)\))?\s*(?:\[(\w+)\])?`)

	var result []InstalledPlugin
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			p := InstalledPlugin{
				Plugin: Plugin{Name: matches[1]},
				Status: StatusEnabled,
			}
			if matches[2] != "" {
				p.Marketplace = matches[2]
			}
			if matches[3] != "" {
				p.Plugin.Version = matches[3]
			}
			if strings.ToLower(matches[4]) == "disabled" {
				p.Status = StatusDisabled
			}
			result = append(result, p)
		}
	}
	return result
}

// ParseMarketplaces attempts to parse the output of `copilot plugin marketplace list`
// Real format example:
//
//	✨ Included with GitHub Copilot:
//	  ◆ copilot-plugins (GitHub: github/copilot-plugins)
//	  ◆ awesome-copilot (GitHub: github/awesome-copilot)
func ParseMarketplaces(output string) []Marketplace {
	// Try JSON first
	var marketplaces []Marketplace
	if err := json.Unmarshal([]byte(output), &marketplaces); err == nil && len(marketplaces) > 0 {
		return marketplaces
	}

	var wrapper struct {
		Marketplaces []Marketplace `json:"marketplaces"`
	}
	if err := json.Unmarshal([]byte(output), &wrapper); err == nil && len(wrapper.Marketplaces) > 0 {
		return wrapper.Marketplaces
	}

	// Real CLI format: "◆ name (GitHub: owner/repo)" or "◆ name (URL)"
	re := regexp.MustCompile(`[•◆\-\*]\s+(\S+)\s*(?:\((?:GitHub:\s*)?([^)]+)\))?`)

	var result []Marketplace
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			m := Marketplace{Name: matches[1]}
			if matches[2] != "" {
				m.URL = strings.TrimSpace(matches[2])
			}
			result = append(result, m)
		}
	}
	return result
}

// ParseMarketplacePlugins attempts to parse the output of `copilot plugin marketplace browse`
// Real format example:
//
//	Plugins in "copilot-plugins":
//	  • workiq - WorkIQ plugin for GitHub Copilot.
//	  • spark - Spark plugin for GitHub Copilot.
//
//	Install with: copilot plugin install <plugin-name>@copilot-plugins
func ParseMarketplacePlugins(output string, marketplaceName string) []MarketplacePlugin {
	// Try JSON first
	var plugins []MarketplacePlugin
	if err := json.Unmarshal([]byte(output), &plugins); err == nil && len(plugins) > 0 {
		for i := range plugins {
			plugins[i].MarketplaceName = marketplaceName
		}
		return plugins
	}

	var wrapper struct {
		Plugins []MarketplacePlugin `json:"plugins"`
	}
	if err := json.Unmarshal([]byte(output), &wrapper); err == nil && len(wrapper.Plugins) > 0 {
		for i := range wrapper.Plugins {
			wrapper.Plugins[i].MarketplaceName = marketplaceName
		}
		return wrapper.Plugins
	}

	// Real CLI format: "• name - description"
	re := regexp.MustCompile(`[•◆\-\*]\s+(\S+)\s*(?:-\s+(.+))?`)

	var result []MarketplacePlugin
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		matches := re.FindStringSubmatch(line)
		if matches != nil {
			name := matches[1]
			// Skip lines that look like headers or instructions
			if strings.Contains(strings.ToLower(name), "plugin") ||
				strings.Contains(strings.ToLower(name), "install") ||
				strings.Contains(name, ":") ||
				strings.Contains(name, "\"") {
				continue
			}
			p := MarketplacePlugin{
				Plugin:          Plugin{Name: name},
				MarketplaceName: marketplaceName,
			}
			if matches[2] != "" {
				p.Plugin.Description = strings.TrimSpace(matches[2])
			}
			result = append(result, p)
		}
	}
	return result
}

// ComputeSummary calculates aggregate stats from installed plugins and marketplaces
func ComputeSummary(plugins []InstalledPlugin, marketplaces []Marketplace) PluginSummary {
	summary := PluginSummary{
		TotalInstalled:   len(plugins),
		MarketplaceCount: len(marketplaces),
	}
	for _, p := range plugins {
		if p.Status == StatusEnabled {
			summary.EnabledCount++
		} else {
			summary.DisabledCount++
		}
		if p.UpdateAvailable {
			summary.UpdatesAvailable++
		}
	}
	return summary
}

// DemoInstalledPlugins returns sample data for development/demo purposes
func DemoInstalledPlugins() []InstalledPlugin {
	return []InstalledPlugin{
		{Plugin: Plugin{Name: "database-data-management", Description: "Generate SQL queries and manage database schemas", Version: "1.2.0", Author: "github", Skills: []string{"sql-gen", "schema-mgmt"}}, Status: StatusEnabled, Marketplace: "awesome-copilot"},
		{Plugin: Plugin{Name: "frontend-design", Description: "Professional-looking GUI generator", Version: "2.1.0", Author: "github", Skills: []string{"frontend-design"}}, Status: StatusEnabled, Marketplace: "copilot-plugins"},
		{Plugin: Plugin{Name: "workiq", Description: "Microsoft 365 workplace intelligence", Version: "0.9.1", Author: "microsoft", Skills: []string{"workiq"}}, Status: StatusEnabled, Marketplace: "copilot-plugins"},
		{Plugin: Plugin{Name: "docker-compose", Description: "Docker Compose file generation and management", Version: "1.0.3", Author: "community", Skills: []string{"docker-gen"}}, Status: StatusDisabled, Marketplace: "awesome-copilot"},
		{Plugin: Plugin{Name: "terraform-helper", Description: "Terraform plan review and HCL generation", Version: "0.5.0", Author: "hashicorp", Skills: []string{"tf-plan", "hcl-gen"}}, Status: StatusEnabled, Marketplace: "awesome-copilot", UpdateAvailable: true},
	}
}

// DemoMarketplaces returns sample marketplace data for development/demo purposes
func DemoMarketplaces() []Marketplace {
	return []Marketplace{
		{Name: "copilot-plugins", Description: "Official GitHub Copilot plugins", URL: "https://github.com/github/copilot-plugins", PluginCount: 12},
		{Name: "awesome-copilot", Description: "Community-curated Copilot plugins", URL: "https://github.com/github/awesome-copilot", PluginCount: 47},
	}
}

// DemoMarketplacePlugins returns sample marketplace plugin data
func DemoMarketplacePlugins(marketplaceName string) []MarketplacePlugin {
	if marketplaceName == "copilot-plugins" {
		return []MarketplacePlugin{
			{Plugin: Plugin{Name: "frontend-design", Description: "Professional-looking GUI generator", Version: "2.1.0"}, Installed: true, MarketplaceName: marketplaceName},
			{Plugin: Plugin{Name: "workiq", Description: "Microsoft 365 workplace intelligence", Version: "0.9.1"}, Installed: true, MarketplaceName: marketplaceName},
			{Plugin: Plugin{Name: "api-tester", Description: "API endpoint testing and documentation", Version: "1.0.0"}, Installed: false, MarketplaceName: marketplaceName},
			{Plugin: Plugin{Name: "git-reviewer", Description: "Automated code review suggestions", Version: "0.8.2"}, Installed: false, MarketplaceName: marketplaceName},
			{Plugin: Plugin{Name: "security-scanner", Description: "SAST and dependency vulnerability scanning", Version: "1.1.0"}, Installed: false, MarketplaceName: marketplaceName},
		}
	}
	return []MarketplacePlugin{
		{Plugin: Plugin{Name: "database-data-management", Description: "SQL queries and database schema management", Version: "1.2.0"}, Installed: true, MarketplaceName: marketplaceName},
		{Plugin: Plugin{Name: "terraform-helper", Description: "Terraform plan review and HCL generation", Version: "0.6.0"}, Installed: true, MarketplaceName: marketplaceName},
		{Plugin: Plugin{Name: "docker-compose", Description: "Docker Compose file generation", Version: "1.0.3"}, Installed: true, MarketplaceName: marketplaceName},
		{Plugin: Plugin{Name: "k8s-manifest", Description: "Kubernetes manifest generation", Version: "0.3.1"}, Installed: false, MarketplaceName: marketplaceName},
		{Plugin: Plugin{Name: "ci-pipeline", Description: "CI/CD pipeline configuration", Version: "1.4.0"}, Installed: false, MarketplaceName: marketplaceName},
		{Plugin: Plugin{Name: "markdown-docs", Description: "Documentation generation from code", Version: "0.7.0"}, Installed: false, MarketplaceName: marketplaceName},
	}
}
