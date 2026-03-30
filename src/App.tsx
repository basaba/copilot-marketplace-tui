import React, { useState, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { TabBar } from "./components/index.js";
import {
  Dashboard,
  InstalledView,
  MarketplaceView,
  DetailView,
  SettingsView,
} from "./views/index.js";
import { quickActions } from "./views/Dashboard.js";
import { filterPlugins as filterInstalled } from "./views/Installed.js";
import { filterPlugins as filterMarketplace } from "./views/Marketplace.js";
import { demo } from "./services/index.js";
import type { Screen, InstalledPlugin, MarketplacePlugin } from "./types.js";

interface AppProps {
  demoMode: boolean;
}

type DetailTarget =
  | { source: "installed"; plugin: InstalledPlugin }
  | { source: "marketplace"; plugin: MarketplacePlugin };

export default function App({ demoMode }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;
  const termHeight = stdout?.rows ?? 24;

  // Data
  const [plugins] = useState(() => (demoMode ? demo.demoInstalledPlugins() : []));
  const [marketplaces] = useState(() => (demoMode ? demo.demoMarketplaces() : []));
  const [mpPlugins] = useState(() => {
    if (!demoMode) return {};
    const result: Record<string, MarketplacePlugin[]> = {};
    for (const mp of demo.demoMarketplaces()) {
      result[mp.name] = demo.demoMarketplacePlugins(mp.name);
    }
    return result;
  });

  const summary = useMemo(
    () => demo.computeSummary(plugins, marketplaces),
    [plugins, marketplaces]
  );

  // Navigation
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Cursors per screen
  const [dashCursor, setDashCursor] = useState(0);
  const [instCursor, setInstCursor] = useState(0);
  const [mpCursor, setMpCursor] = useState(0);
  const [mpTab, setMpTab] = useState(0);
  const [settingsCursor, setSettingsCursor] = useState(0);

  // Search state
  const [instSearch, setInstSearch] = useState("");
  const [instSearchActive, setInstSearchActive] = useState(false);
  const [mpSearch, setMpSearch] = useState("");
  const [mpSearchActive, setMpSearchActive] = useState(false);

  // Toast
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Get filtered lists for cursor bounds
  const filteredInstalled = useMemo(
    () => filterInstalled(plugins, instSearch),
    [plugins, instSearch]
  );
  const activeMarketplace = marketplaces[mpTab]?.name || "";
  const filteredMp = useMemo(
    () => filterMarketplace(mpPlugins[activeMarketplace] || [], mpSearch),
    [mpPlugins, activeMarketplace, mpSearch]
  );

  const screens: Screen[] = ["dashboard", "installed", "marketplace", "settings"];

  useInput((input, key) => {
    // Detail view keybindings
    if (showDetail) {
      if (key.escape) {
        setShowDetail(false);
        return;
      }
      if (detail?.source === "installed") {
        const p = detail.plugin as InstalledPlugin;
        if (input === "e") showToast(`✓ Enabled ${p.name} (demo)`);
        if (input === "d") showToast(`✓ Disabled ${p.name} (demo)`);
        if (input === "u") showToast(`✓ Updated ${p.name} (demo)`);
        if (input === "x") showToast(`✓ Uninstalled ${p.name} (demo)`);
      }
      if (detail?.source === "marketplace") {
        const p = detail.plugin as MarketplacePlugin;
        if (input === "i") showToast(`✓ Installed ${p.name} (demo)`);
      }
      return;
    }

    // Search mode — only handle escape to exit search
    if (instSearchActive || mpSearchActive) {
      if (key.escape) {
        setInstSearchActive(false);
        setInstSearch("");
        setMpSearchActive(false);
        setMpSearch("");
        setInstCursor(0);
        setMpCursor(0);
      }
      return;
    }

    // Global
    if (input === "q") {
      exit();
      return;
    }
    if (key.tab && !key.shift) {
      const idx = screens.indexOf(screen);
      setScreen(screens[(idx + 1) % screens.length]!);
      return;
    }
    if (key.tab && key.shift) {
      const idx = screens.indexOf(screen);
      setScreen(screens[(idx - 1 + screens.length) % screens.length]!);
      return;
    }

    // Per-screen keybindings
    switch (screen) {
      case "dashboard": {
        if (key.upArrow || input === "k")
          setDashCursor((c) => Math.max(0, c - 1));
        if (key.downArrow || input === "j")
          setDashCursor((c) => Math.min(quickActions.length - 1, c + 1));
        if (key.return) {
          const action = quickActions[dashCursor];
          if (action?.id === "marketplace") setScreen("marketplace");
          if (action?.id === "installed") setScreen("installed");
          if (action?.id === "settings") setScreen("settings");
          if (action?.id === "updates") showToast("✓ All plugins up to date (demo)");
        }
        break;
      }
      case "installed": {
        if (input === "/") {
          setInstSearchActive(true);
          return;
        }
        if (key.upArrow || input === "k")
          setInstCursor((c) => Math.max(0, c - 1));
        if (key.downArrow || input === "j")
          setInstCursor((c) => Math.min(filteredInstalled.length - 1, c + 1));
        if (key.return) {
          const p = filteredInstalled[instCursor];
          if (p) {
            setDetail({ source: "installed", plugin: p });
            setShowDetail(true);
          }
        }
        if (input === "e") {
          const p = filteredInstalled[instCursor];
          if (p) showToast(`✓ Enabled ${p.name} (demo)`);
        }
        if (input === "d") {
          const p = filteredInstalled[instCursor];
          if (p) showToast(`✓ Disabled ${p.name} (demo)`);
        }
        if (input === "u") {
          const p = filteredInstalled[instCursor];
          if (p) showToast(`✓ Updated ${p.name} (demo)`);
        }
        if (input === "x") {
          const p = filteredInstalled[instCursor];
          if (p) showToast(`✓ Uninstalled ${p.name} (demo)`);
        }
        break;
      }
      case "marketplace": {
        if (input === "/") {
          setMpSearchActive(true);
          return;
        }
        if (key.leftArrow || input === "h") {
          setMpTab((t) =>
            (t - 1 + marketplaces.length) % marketplaces.length
          );
          setMpCursor(0);
          setMpSearch("");
        }
        if (key.rightArrow || input === "l") {
          setMpTab((t) => (t + 1) % marketplaces.length);
          setMpCursor(0);
          setMpSearch("");
        }
        if (key.upArrow || input === "k")
          setMpCursor((c) => Math.max(0, c - 1));
        if (key.downArrow || input === "j")
          setMpCursor((c) => Math.min(filteredMp.length - 1, c + 1));
        if (key.return) {
          const p = filteredMp[mpCursor];
          if (p) {
            setDetail({ source: "marketplace", plugin: p });
            setShowDetail(true);
          }
        }
        if (input === "i") {
          const p = filteredMp[mpCursor];
          if (p) showToast(`✓ Installed ${p.name} (demo)`);
        }
        // Number keys for direct tab select
        const num = parseInt(input, 10);
        if (num >= 1 && num <= marketplaces.length) {
          setMpTab(num - 1);
          setMpCursor(0);
          setMpSearch("");
        }
        break;
      }
      case "settings": {
        if (key.upArrow || input === "k")
          setSettingsCursor((c) => Math.max(0, c - 1));
        if (key.downArrow || input === "j")
          setSettingsCursor((c) => Math.min(marketplaces.length - 1, c + 1));
        if (input === "a") showToast("Add marketplace (not implemented in demo)");
        if (input === "x") {
          const mp = marketplaces[settingsCursor];
          if (mp) showToast(`✓ Removed ${mp.name} (demo)`);
        }
        break;
      }
    }
  });

  const renderScreen = () => {
    if (showDetail) {
      return (
        <DetailView
          plugin={detail?.plugin || null}
          source={detail?.source || "installed"}
        />
      );
    }

    switch (screen) {
      case "dashboard":
        return (
          <Dashboard
            summary={summary}
            cursor={dashCursor}
            onAction={() => {}}
          />
        );
      case "installed":
        return (
          <InstalledView
            plugins={plugins}
            cursor={instCursor}
            searchQuery={instSearch}
            searchActive={instSearchActive}
            onSearchChange={(v) => {
              setInstSearch(v);
              setInstCursor(0);
            }}
          />
        );
      case "marketplace":
        return (
          <MarketplaceView
            marketplaces={marketplaces}
            plugins={mpPlugins}
            activeTab={mpTab}
            cursor={mpCursor}
            searchQuery={mpSearch}
            searchActive={mpSearchActive}
            onSearchChange={(v) => {
              setMpSearch(v);
              setMpCursor(0);
            }}
          />
        );
      case "settings":
        return <SettingsView marketplaces={marketplaces} cursor={settingsCursor} />;
    }
  };

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight} paddingX={1} paddingY={1}>
      {!showDetail && <TabBar active={screen} onSwitch={setScreen} />}
      {toast && (
        <Box marginBottom={1}>
          <Box paddingX={1}>
            <Text bold color={toast.startsWith("✗") ? "#f85149" : "#3fb950"}>
              {toast}
            </Text>
          </Box>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1}>
        {renderScreen()}
      </Box>
    </Box>
  );
}
