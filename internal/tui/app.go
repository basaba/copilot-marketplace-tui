package tui

import (
	"fmt"

	"github.com/charmbracelet/bubbles/key"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/copilot-plugin-marketplace/cpm/internal/copilot"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/components"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/theme"
	"github.com/copilot-plugin-marketplace/cpm/internal/tui/views"
)

// Screen identifiers
type Screen int

const (
	ScreenDashboard Screen = iota
	ScreenInstalled
	ScreenMarketplace
	ScreenDetail
	ScreenSettings
)

var screenNames = []string{"Dashboard", "Installed", "Marketplace", "Settings"}

// Messages for async operations
type dataLoadedMsg struct {
	plugins      []copilot.InstalledPlugin
	marketplaces []copilot.Marketplace
	mpPlugins    map[string][]copilot.MarketplacePlugin
}

type commandResultMsg struct {
	success bool
	message string
}

type errMsg struct {
	err error
}

// App is the root Bubble Tea model
type App struct {
	// Sub-models for each screen
	dashboard   views.DashboardModel
	installed   views.InstalledModel
	marketplace views.MarketplaceModel
	detail      views.DetailModel
	settings    views.SettingsModel

	// Navigation state
	screen     Screen
	prevScreen Screen
	tabIndex   int

	// Data
	client       *copilot.Client
	demoMode     bool
	plugins      []copilot.InstalledPlugin
	marketplaces []copilot.Marketplace
	mpPlugins    map[string][]copilot.MarketplacePlugin

	// UI state
	spinner    components.SpinnerModel
	loading    bool
	toast      string
	toastIsErr bool
	width      int
	height     int
	showHelp   bool
}

// NewApp creates the root application model
func NewApp(demoMode bool) App {
	app := App{
		demoMode:  demoMode,
		mpPlugins: make(map[string][]copilot.MarketplacePlugin),
		screen:    ScreenDashboard,
		tabIndex:  0,
	}

	if !demoMode {
		client, err := copilot.NewClient()
		if err != nil {
			// Fall back to demo mode if copilot not found
			app.demoMode = true
		} else {
			app.client = client
		}
	}

	return app
}

// Init initializes the app and loads data
func (a App) Init() tea.Cmd {
	return a.loadData()
}

// loadData fetches plugin data (from CLI or demo)
func (a *App) loadData() tea.Cmd {
	return func() tea.Msg {
		if a.demoMode {
			plugins := copilot.DemoInstalledPlugins()
			marketplaces := copilot.DemoMarketplaces()
			mpPlugins := make(map[string][]copilot.MarketplacePlugin)
			for _, m := range marketplaces {
				mpPlugins[m.Name] = copilot.DemoMarketplacePlugins(m.Name)
			}
			return dataLoadedMsg{
				plugins:      plugins,
				marketplaces: marketplaces,
				mpPlugins:    mpPlugins,
			}
		}

		// Real CLI mode
		var plugins []copilot.InstalledPlugin
		var marketplaces []copilot.Marketplace
		mpPlugins := make(map[string][]copilot.MarketplacePlugin)

		if out, err := a.client.ListInstalled(); err == nil {
			plugins = copilot.ParseInstalledPlugins(out)
		}
		if out, err := a.client.ListMarketplaces(); err == nil {
			marketplaces = copilot.ParseMarketplaces(out)
			for _, m := range marketplaces {
				if browseOut, browseErr := a.client.BrowseMarketplace(m.Name); browseErr == nil {
					mpPlugins[m.Name] = copilot.ParseMarketplacePlugins(browseOut, m.Name)
				}
			}
		}

		return dataLoadedMsg{
			plugins:      plugins,
			marketplaces: marketplaces,
			mpPlugins:    mpPlugins,
		}
	}
}

// Update handles all messages
func (a App) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		a.width = msg.Width
		a.height = msg.Height
		contentHeight := a.height - 4 // account for tabs + status bar
		a.dashboard.SetSize(a.width-4, contentHeight)
		a.installed.SetSize(a.width-4, contentHeight)
		a.marketplace.SetSize(a.width-4, contentHeight)
		a.detail.SetSize(a.width-4, contentHeight)
		a.settings.SetSize(a.width-4, contentHeight)
		return a, nil

	case tea.KeyMsg:
		// Check if a sub-view is actively capturing input (search bar, text input, dialog)
		inputActive := false
		switch a.screen {
		case ScreenInstalled:
			inputActive = a.installed.IsInputActive()
		case ScreenMarketplace:
			inputActive = a.marketplace.IsInputActive()
		case ScreenSettings:
			inputActive = a.settings.IsInputActive()
		}

		// When a sub-view has active input, only handle ctrl+c globally
		if inputActive {
			if msg.Type == tea.KeyCtrlC {
				return a, tea.Quit
			}
			// Delegate everything else to the active screen
			break
		}

		// Global keybindings (only when no sub-view is capturing input)
		switch {
		case key.Matches(msg, theme.DefaultKeyMap.Quit):
			return a, tea.Quit
		case key.Matches(msg, theme.DefaultKeyMap.Help):
			a.showHelp = !a.showHelp
			return a, nil
		case key.Matches(msg, theme.DefaultKeyMap.Tab) && a.screen != ScreenDetail:
			a.tabIndex = (a.tabIndex + 1) % len(screenNames)
			a.switchToTab(a.tabIndex)
			return a, nil
		case key.Matches(msg, theme.DefaultKeyMap.ShiftTab) && a.screen != ScreenDetail:
			a.tabIndex = (a.tabIndex - 1 + len(screenNames)) % len(screenNames)
			a.switchToTab(a.tabIndex)
			return a, nil
		}

	case dataLoadedMsg:
		a.loading = false
		a.plugins = msg.plugins
		a.marketplaces = msg.marketplaces
		a.mpPlugins = msg.mpPlugins
		summary := copilot.ComputeSummary(a.plugins, a.marketplaces)
		a.dashboard = views.NewDashboard(summary)
		a.installed = views.NewInstalled(a.plugins)
		a.marketplace = views.NewMarketplace(a.marketplaces, a.mpPlugins)
		a.settings = views.NewSettings(a.marketplaces)
		contentHeight := a.height - 4
		a.dashboard.SetSize(a.width-4, contentHeight)
		a.installed.SetSize(a.width-4, contentHeight)
		a.marketplace.SetSize(a.width-4, contentHeight)
		a.settings.SetSize(a.width-4, contentHeight)
		return a, nil

	case commandResultMsg:
		a.loading = false
		a.toast = msg.message
		a.toastIsErr = !msg.success
		return a, a.loadData() // reload data after command

	case errMsg:
		a.loading = false
		a.toast = fmt.Sprintf("Error: %v", msg.err)
		a.toastIsErr = true
		return a, nil

	// Dashboard actions
	case views.DashboardSelectMsg:
		switch msg.Action {
		case views.ActionBrowseMarketplace:
			a.screen = ScreenMarketplace
			a.tabIndex = 2
		case views.ActionManageInstalled:
			a.screen = ScreenInstalled
			a.tabIndex = 1
		case views.ActionCheckUpdates:
			a.loading = true
			a.spinner = components.NewSpinner("Checking for updates...")
			return a, a.runUpdateAll()
		case views.ActionSettings:
			a.screen = ScreenSettings
			a.tabIndex = 3
		}
		return a, nil

	// Installed view actions
	case views.InstalledViewDetailMsg:
		a.prevScreen = ScreenInstalled
		a.detail = views.NewDetailFromInstalled(msg.Plugin)
		a.detail.SetSize(a.width-4, a.height-4)
		a.screen = ScreenDetail
		return a, nil
	case views.InstalledEnableMsg:
		return a, a.runPluginCommand("enable", msg.Name)
	case views.InstalledDisableMsg:
		return a, a.runPluginCommand("disable", msg.Name)
	case views.InstalledUninstallMsg:
		return a, a.runPluginCommand("uninstall", msg.Name)
	case views.InstalledUpdateMsg:
		return a, a.runPluginCommand("update", msg.Name)

	// Marketplace view actions
	case views.MarketplaceInstallMsg:
		installSource := msg.Plugin.Name + "@" + msg.Plugin.MarketplaceName
		return a, a.runPluginCommand("install", installSource)
	case views.MarketplaceViewDetailMsg:
		a.prevScreen = ScreenMarketplace
		a.detail = views.NewDetailFromMarketplace(msg.Plugin)
		a.detail.SetSize(a.width-4, a.height-4)
		a.screen = ScreenDetail
		return a, nil

	// Detail view actions
	case views.DetailBackMsg:
		a.screen = a.prevScreen
		return a, nil
	case views.DetailInstallMsg:
		return a, a.runPluginCommand("install", msg.Name)
	case views.DetailUninstallMsg:
		return a, a.runPluginCommand("uninstall", msg.Name)
	case views.DetailEnableMsg:
		return a, a.runPluginCommand("enable", msg.Name)
	case views.DetailDisableMsg:
		return a, a.runPluginCommand("disable", msg.Name)
	case views.DetailUpdateMsg:
		return a, a.runPluginCommand("update", msg.Name)

	// Settings actions
	case views.SettingsAddMsg:
		return a, a.runMarketplaceCommand("add", msg.Spec)
	case views.SettingsRemoveMsg:
		return a, a.runMarketplaceCommand("remove", msg.Name)
	}

	// Delegate to active screen
	var cmd tea.Cmd
	switch a.screen {
	case ScreenDashboard:
		a.dashboard, cmd = a.dashboard.Update(msg)
	case ScreenInstalled:
		a.installed, cmd = a.installed.Update(msg)
	case ScreenMarketplace:
		a.marketplace, cmd = a.marketplace.Update(msg)
	case ScreenDetail:
		a.detail, cmd = a.detail.Update(msg)
	case ScreenSettings:
		a.settings, cmd = a.settings.Update(msg)
	}
	cmds = append(cmds, cmd)

	// Update spinner
	if a.loading {
		a.spinner, cmd = a.spinner.Update(msg)
		cmds = append(cmds, cmd)
	}

	return a, tea.Batch(cmds...)
}

// View renders the app
func (a App) View() string {
	if a.width == 0 {
		return "Loading..."
	}

	var content string

	// Tab bar (not shown on detail screen)
	tabBar := a.renderTabBar()

	// Active screen content
	switch a.screen {
	case ScreenDashboard:
		content = a.dashboard.View()
	case ScreenInstalled:
		content = a.installed.View()
	case ScreenMarketplace:
		content = a.marketplace.View()
	case ScreenDetail:
		content = a.detail.View()
	case ScreenSettings:
		content = a.settings.View()
	}

	// Loading overlay
	if a.loading {
		content = a.spinner.View() + "\n\n" + content
	}

	// Toast message
	if a.toast != "" {
		var toastStyle lipgloss.Style
		if a.toastIsErr {
			toastStyle = theme.ErrorToastStyle
		} else {
			toastStyle = theme.SuccessToastStyle
		}
		content = toastStyle.Render(a.toast) + "\n\n" + content
	}

	// Status bar
	statusItems := []components.StatusBarItem{
		{Key: "tab", Value: "switch view"},
		{Key: "?", Value: "help"},
		{Key: "q", Value: "quit"},
	}
	if a.demoMode {
		statusItems = append([]components.StatusBarItem{{Key: "MODE", Value: "demo"}}, statusItems...)
	}
	statusBar := components.RenderStatusBar(statusItems, a.width)

	// Help panel
	helpText := ""
	if a.showHelp {
		helpText = a.renderHelp() + "\n"
	}

	// Assemble
	if a.screen == ScreenDetail {
		return lipgloss.JoinVertical(lipgloss.Left, content, helpText, statusBar)
	}
	return lipgloss.JoinVertical(lipgloss.Left, tabBar, content, helpText, statusBar)
}

func (a *App) switchToTab(idx int) {
	switch idx {
	case 0:
		a.screen = ScreenDashboard
	case 1:
		a.screen = ScreenInstalled
	case 2:
		a.screen = ScreenMarketplace
	case 3:
		a.screen = ScreenSettings
	}
}

func (a App) renderTabBar() string {
	var tabs []string
	for i, name := range screenNames {
		if i == a.tabIndex {
			tabs = append(tabs, theme.ActiveTabStyle.Render(name))
		} else {
			tabs = append(tabs, theme.InactiveTabStyle.Render(name))
		}
	}
	return lipgloss.JoinHorizontal(lipgloss.Top, tabs...) + "\n"
}

func (a App) renderHelp() string {
	groups := theme.DefaultKeyMap.FullHelp()
	var lines []string
	for _, group := range groups {
		var items []string
		for _, k := range group {
			items = append(items, fmt.Sprintf("%s %s", theme.HelpKeyStyle.Render(k.Help().Key), theme.HelpDescStyle.Render(k.Help().Desc)))
		}
		line := ""
		for i, item := range items {
			if i > 0 {
				line += theme.HelpSepStyle.Render(" • ")
			}
			line += item
		}
		lines = append(lines, line)
	}
	helpContent := ""
	for _, l := range lines {
		helpContent += l + "\n"
	}
	return theme.BoxStyle.Width(a.width - 4).Render(helpContent)
}

// Command execution helpers

func (a *App) runPluginCommand(action, name string) tea.Cmd {
	a.loading = true
	a.spinner = components.NewSpinner(fmt.Sprintf("Running: copilot plugin %s %s...", action, name))
	return func() tea.Msg {
		if a.demoMode {
			return commandResultMsg{success: true, message: fmt.Sprintf("✓ Plugin %s: %s (demo mode)", action, name)}
		}
		var out string
		var err error
		switch action {
		case "install":
			out, err = a.client.InstallPlugin(name)
		case "uninstall":
			out, err = a.client.UninstallPlugin(name)
		case "enable":
			out, err = a.client.EnablePlugin(name)
		case "disable":
			out, err = a.client.DisablePlugin(name)
		case "update":
			out, err = a.client.UpdatePlugin(name)
		}
		if err != nil {
			return commandResultMsg{success: false, message: fmt.Sprintf("✗ %s failed: %v", action, err)}
		}
		msg := fmt.Sprintf("✓ Plugin %s: %s", action, name)
		if out != "" {
			msg += "\n" + out
		}
		return commandResultMsg{success: true, message: msg}
	}
}

func (a *App) runMarketplaceCommand(action, spec string) tea.Cmd {
	a.loading = true
	a.spinner = components.NewSpinner(fmt.Sprintf("Running: copilot plugin marketplace %s %s...", action, spec))
	return func() tea.Msg {
		if a.demoMode {
			return commandResultMsg{success: true, message: fmt.Sprintf("✓ Marketplace %s: %s (demo mode)", action, spec)}
		}
		var err error
		switch action {
		case "add":
			_, err = a.client.AddMarketplace(spec)
		case "remove":
			_, err = a.client.RemoveMarketplace(spec)
		}
		if err != nil {
			return commandResultMsg{success: false, message: fmt.Sprintf("✗ marketplace %s failed: %v", action, err)}
		}
		return commandResultMsg{success: true, message: fmt.Sprintf("✓ Marketplace %s: %s", action, spec)}
	}
}

func (a *App) runUpdateAll() tea.Cmd {
	return func() tea.Msg {
		if a.demoMode {
			return commandResultMsg{success: true, message: "✓ All plugins up to date (demo mode)"}
		}
		_, err := a.client.UpdateAll()
		if err != nil {
			return commandResultMsg{success: false, message: fmt.Sprintf("✗ Update all failed: %v", err)}
		}
		return commandResultMsg{success: true, message: "✓ All plugins updated"}
	}
}
