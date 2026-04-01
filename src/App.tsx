import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import Spinner from "ink-spinner";
import { TabBar } from "./components/index.js";
import {
  Dashboard,
  InstalledView,
  MarketplaceView,
  DetailView,
  SettingsView,
} from "./views/index.js";
import { quickActions } from "./views/Dashboard.js";
import { filterPlugins as filterInstalled, INSTALLED_CHROME } from "./views/Installed.js";
import { filterPlugins as filterMarketplace, MARKETPLACE_CHROME } from "./views/Marketplace.js";
import { demo, copilot, config } from "./services/index.js";
import type { Screen, InstalledPlugin, MarketplacePlugin } from "./types.js";

interface AppProps {
  demoMode: boolean;
}

type DetailTarget =
  | { source: "installed"; plugin: InstalledPlugin }
  | { source: "marketplace"; plugin: MarketplacePlugin };

type AppData = {
  plugins: InstalledPlugin[];
  marketplaces: import("./types.js").Marketplace[];
  mpPlugins: Record<string, MarketplacePlugin[]>;
};

function loadDataSync(demoMode: boolean): AppData {
  if (demoMode) {
    const plugins = demo.demoInstalledPlugins();
    const marketplaces = config.applyConfig(demo.demoMarketplaces());
    const persisted = config.loadMarketplacePlugins();
    const mpPlugins: Record<string, MarketplacePlugin[]> = {};
    for (const mp of marketplaces) {
      const demoPlugins = demo.demoMarketplacePlugins(mp.name);
      mpPlugins[mp.name] = demoPlugins.length > 0 ? demoPlugins : (persisted[mp.name] || []);
    }
    return { plugins, marketplaces, mpPlugins };
  }
  return { plugins: [], marketplaces: [], mpPlugins: {} };
}

async function loadDataAsync(): Promise<AppData> {
  const [plugins, rawMarketplaces] = await Promise.all([
    copilot.listInstalledAsync(),
    copilot.listMarketplacesAsync(),
  ]);
  const marketplaces = config.applyConfig(rawMarketplaces);
  const installedNames = new Set(plugins.map((p) => p.name));
  const persisted = config.loadMarketplacePlugins();
  const mpEntries = await Promise.all(
    marketplaces.map(async (mp) => {
      const items = await copilot.browseMarketplaceAsync(mp.name, installedNames);
      // Fall back to persisted plugin list if CLI returns nothing
      return [mp.name, items.length > 0 ? items : (persisted[mp.name] || [])] as const;
    })
  );
  const mpPlugins: Record<string, MarketplacePlugin[]> = {};
  for (const [name, items] of mpEntries) {
    mpPlugins[name] = items;
  }
  return { plugins, marketplaces, mpPlugins };
}

export default function App({ demoMode }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;
  const termHeight = stdout?.rows ?? 24;

  // Data — load synchronously for demo, async for real CLI
  const [ready, setReady] = useState(demoMode);
  const [plugins, setPlugins] = useState<InstalledPlugin[]>(() =>
    demoMode ? demo.demoInstalledPlugins() : []
  );
  const [marketplaces, setMarketplaces] = useState<import("./types.js").Marketplace[]>(() =>
    demoMode ? config.applyConfig(demo.demoMarketplaces()) : []
  );
  const [mpPlugins, setMpPlugins] = useState<Record<string, MarketplacePlugin[]>>(() => {
    if (!demoMode) return {};
    const mps = config.applyConfig(demo.demoMarketplaces());
    const persisted = config.loadMarketplacePlugins();
    const result: Record<string, MarketplacePlugin[]> = {};
    for (const mp of mps) {
      const demoPlugins = demo.demoMarketplacePlugins(mp.name);
      result[mp.name] = demoPlugins.length > 0 ? demoPlugins : (persisted[mp.name] || []);
    }
    return result;
  });

  useEffect(() => {
    if (demoMode) return;
    loadDataAsync().then((data) => {
      setPlugins(data.plugins);
      setMarketplaces(data.marketplaces);
      setMpPlugins(data.mpPlugins);
      setReady(true);
    });
  }, [demoMode]);

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
  const [mpFocus, setMpFocus] = useState<"tabbar" | "content">("tabbar");
  const [settingsCursor, setSettingsCursor] = useState(0);

  // Search state
  const [instSearch, setInstSearch] = useState("");
  const [instSearchActive, setInstSearchActive] = useState(false);
  const [mpSearch, setMpSearch] = useState("");
  const [mpSearchActive, setMpSearchActive] = useState(false);

  // Settings: add marketplace input state
  const [addMpActive, setAddMpActive] = useState(false);
  const [addMpValue, setAddMpValue] = useState("");

  // Toast
  const [toast, setToast] = useState("");
  // Loading state for async CLI operations
  const [loading, setLoading] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Plugin action handlers — call real CLI (async) when not in demo mode
  const installPlugin = useCallback((p: MarketplacePlugin) => {
    if (p.installed || loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => [...prev, {
        name: p.name,
        version: p.version,
        enabled: true,
        marketplace: p.marketplace,
        updateAvailable: false,
      }]);
      setMpPlugins(prev => {
        const updated = { ...prev };
        const key = p.marketplace;
        updated[key] = (updated[key] || []).map(mp =>
          mp.name === p.name ? { ...mp, installed: true } : mp
        );
        return updated;
      });
      showToast(`✓ Installed ${p.name}`);
    };
    if (!demoMode) {
      setLoading(`Installing ${p.name}…`);
      copilot.installPluginAsync(spec).then(result => {
        setLoading("");
        if (result.success) onSuccess();
        else showToast(`✗ Install failed: ${p.name}`);
      });
    } else {
      onSuccess();
    }
  }, [demoMode, loading, showToast]);

  const uninstallPlugin = useCallback((p: InstalledPlugin) => {
    if (loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.filter(pl => pl.name !== p.name));
      setMpPlugins(prev => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          updated[key] = updated[key]!.map(mp =>
            mp.name === p.name ? { ...mp, installed: false } : mp
          );
        }
        return updated;
      });
      showToast(`✓ Uninstalled ${p.name}`);
    };
    if (!demoMode) {
      setLoading(`Uninstalling ${p.name}…`);
      copilot.uninstallPluginAsync(spec).then(result => {
        setLoading("");
        if (result.success) onSuccess();
        else showToast(`✗ Uninstall failed: ${p.name}`);
      });
    } else {
      onSuccess();
    }
  }, [demoMode, loading, showToast]);

  const enablePlugin = useCallback((p: InstalledPlugin) => {
    if (loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, enabled: true } : pl
      ));
      showToast(`✓ Enabled ${p.name}`);
    };
    if (!demoMode) {
      setLoading(`Enabling ${p.name}…`);
      copilot.enablePluginAsync(spec).then(result => {
        setLoading("");
        if (result.success) onSuccess();
        else showToast(`✗ Enable failed: ${p.name}`);
      });
    } else {
      onSuccess();
    }
  }, [demoMode, loading, showToast]);

  const disablePlugin = useCallback((p: InstalledPlugin) => {
    if (loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, enabled: false } : pl
      ));
      showToast(`✓ Disabled ${p.name}`);
    };
    if (!demoMode) {
      setLoading(`Disabling ${p.name}…`);
      copilot.disablePluginAsync(spec).then(result => {
        setLoading("");
        if (result.success) onSuccess();
        else showToast(`✗ Disable failed: ${p.name}`);
      });
    } else {
      onSuccess();
    }
  }, [demoMode, loading, showToast]);

  const updatePlugin = useCallback((p: InstalledPlugin) => {
    if (!p.updateAvailable || loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, updateAvailable: false } : pl
      ));
      showToast(`✓ Updated ${p.name}`);
    };
    if (!demoMode) {
      setLoading(`Updating ${p.name}…`);
      copilot.updatePluginAsync(spec).then(result => {
        setLoading("");
        if (result.success) onSuccess();
        else showToast(`✗ Update failed: ${p.name}`);
      });
    } else {
      onSuccess();
    }
  }, [demoMode, loading, showToast]);

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

  const instPageSize = Math.max(1, termHeight - INSTALLED_CHROME);
  const mpPageSize = Math.max(1, termHeight - MARKETPLACE_CHROME);

  useInput((input, key) => {
    // Block all input while loading or not yet ready
    if (loading || !ready) return;

    // Detail view keybindings
    if (showDetail) {
      if (key.escape) {
        setShowDetail(false);
        return;
      }
      if (detail?.source === "installed") {
        const p = detail.plugin as InstalledPlugin;
        if (input === "e") enablePlugin(p);
        if (input === "d") disablePlugin(p);
        if (input === "u") updatePlugin(p);
        if (input === "x") { uninstallPlugin(p); setShowDetail(false); }
      }
      if (detail?.source === "marketplace") {
        const p = detail.plugin as MarketplacePlugin;
        if (input === "i") installPlugin(p);
      }
      return;
    }

    // Search mode — allow arrows + enter + escape, pass rest to TextInput
    if (instSearchActive) {
      if (key.escape) {
        setInstSearchActive(false);
        setInstSearch("");
        setInstCursor(0);
        return;
      }
      if (key.upArrow) {
        setInstCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setInstCursor((c) => Math.min(filteredInstalled.length - 1, c + 1));
        return;
      }
      if (key.pageUp) {
        setInstCursor((c) => Math.max(0, c - instPageSize));
        return;
      }
      if (key.pageDown) {
        setInstCursor((c) => Math.min(filteredInstalled.length - 1, c + instPageSize));
        return;
      }
      if (key.return) {
        setInstSearchActive(false);
        const p = filteredInstalled[instCursor];
        if (p) {
          setDetail({ source: "installed", plugin: p });
          setShowDetail(true);
        }
        return;
      }
      // All other keys go to TextInput (handled by Ink)
      return;
    }
    if (mpSearchActive) {
      if (key.escape) {
        setMpSearchActive(false);
        setMpSearch("");
        setMpCursor(0);
        return;
      }
      if (key.upArrow) {
        setMpCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setMpCursor((c) => Math.min(filteredMp.length - 1, c + 1));
        return;
      }
      if (key.pageUp) {
        setMpCursor((c) => Math.max(0, c - mpPageSize));
        return;
      }
      if (key.pageDown) {
        setMpCursor((c) => Math.min(filteredMp.length - 1, c + mpPageSize));
        return;
      }
      if (key.return) {
        setMpSearchActive(false);
        const p = filteredMp[mpCursor];
        if (p) {
          setDetail({ source: "marketplace", plugin: p });
          setShowDetail(true);
        }
        return;
      }
      return;
    }

    // Add marketplace input mode
    if (addMpActive) {
      if (key.escape) {
        setAddMpActive(false);
        setAddMpValue("");
        return;
      }
      if (key.return) {
        const spec = addMpValue.trim();
        if (!spec) {
          setAddMpActive(false);
          setAddMpValue("");
          return;
        }
        setAddMpActive(false);
        setAddMpValue("");
        const onSuccess = (name: string, url: string) => {
          const newMp = { name, url };
          config.persistAdd(newMp);
          setMarketplaces((prev) => [...prev, newMp]);
          showToast(`✓ Added marketplace ${name}`);
          const installedNames = new Set(plugins.map((p) => p.name));
          if (!demoMode) {
            setMpPlugins((prev) => ({ ...prev, [name]: [] }));
            copilot.browseMarketplaceAsync(name, installedNames).then((items) => {
              if (items.length > 0) {
                config.persistMarketplacePlugins(name, items);
                setMpPlugins((prev) => ({ ...prev, [name]: items }));
              } else {
                // CLI returned nothing — try persisted data
                const persisted = config.loadMarketplacePlugins();
                if (persisted[name]?.length) {
                  setMpPlugins((prev) => ({ ...prev, [name]: persisted[name]! }));
                }
              }
            });
          } else {
            // Demo mode: use demo data, then persisted config
            const demoPlugins = demo.demoMarketplacePlugins(name);
            if (demoPlugins.length > 0) {
              setMpPlugins((prev) => ({ ...prev, [name]: demoPlugins }));
            } else {
              const persisted = config.loadMarketplacePlugins();
              setMpPlugins((prev) => ({ ...prev, [name]: persisted[name] || [] }));
            }
          }
        };
        if (!demoMode) {
          setLoading(`Adding marketplace ${spec}…`);
          const result = copilot.addMarketplace(spec);
          setLoading("");
          if (result.success) {
            // Re-list marketplaces from CLI to get the correct name
            copilot.listMarketplacesAsync().then((fresh) => {
              const existing = new Set(marketplaces.map((m) => m.name));
              // Find newly added, or match by spec (could be short name or owner/repo)
              const added = fresh.find((m) => !existing.has(m.name))
                || fresh.find((m) => m.name === spec || m.url.endsWith(`/${spec}`));
              if (added && !existing.has(added.name)) {
                onSuccess(added.name, added.url);
              } else if (added) {
                // Already in our list — just browse to refresh plugins
                const installedNames = new Set(plugins.map((p) => p.name));
                copilot.browseMarketplaceAsync(added.name, installedNames).then((items) => {
                  if (items.length > 0) {
                    config.persistMarketplacePlugins(added.name, items);
                    setMpPlugins((prev) => ({ ...prev, [added.name]: items }));
                  }
                });
                showToast(`✓ Refreshed ${added.name}`);
              } else {
                onSuccess(spec, `https://github.com/${spec}`);
              }
            });
          } else {
            showToast(`✗ Add failed: ${spec}`);
          }
        } else {
          const name = spec;
          const url = `https://github.com/${spec}`;
          onSuccess(name, url);
        }
        return;
      }
      return;
    }

    // Global
    if (input === "q") {
      exit();
      return;
    }

    // ←/→ arrows: context-sensitive based on focus zone
    if (key.leftArrow) {
      if (screen === "marketplace" && mpFocus === "content") {
        setMpTab((t) => (t - 1 + marketplaces.length) % marketplaces.length);
        setMpCursor(0);
        setMpSearch("");
      } else {
        const idx = screens.indexOf(screen);
        setScreen(screens[(idx - 1 + screens.length) % screens.length]!);
        setMpFocus("tabbar");
      }
      return;
    }
    if (key.rightArrow) {
      if (screen === "marketplace" && mpFocus === "content") {
        setMpTab((t) => (t + 1) % marketplaces.length);
        setMpCursor(0);
        setMpSearch("");
      } else {
        const idx = screens.indexOf(screen);
        setScreen(screens[(idx + 1) % screens.length]!);
        setMpFocus("tabbar");
      }
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
          if (action?.id === "marketplace") { setScreen("marketplace"); setMpFocus("tabbar"); }
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
        if (key.pageUp)
          setInstCursor((c) => Math.max(0, c - instPageSize));
        if (key.pageDown)
          setInstCursor((c) => Math.min(filteredInstalled.length - 1, c + instPageSize));
        if (key.return) {
          const p = filteredInstalled[instCursor];
          if (p) {
            setDetail({ source: "installed", plugin: p });
            setShowDetail(true);
          }
        }
        if (input === "e") {
          const p = filteredInstalled[instCursor];
          if (p) enablePlugin(p);
        }
        if (input === "d") {
          const p = filteredInstalled[instCursor];
          if (p) disablePlugin(p);
        }
        if (input === "u") {
          const p = filteredInstalled[instCursor];
          if (p) updatePlugin(p);
        }
        if (input === "x") {
          const p = filteredInstalled[instCursor];
          if (p) {
            uninstallPlugin(p);
            setInstCursor(c => Math.max(0, Math.min(c, filteredInstalled.length - 2)));
          }
        }
        break;
      }
      case "marketplace": {
        if (input === "/") {
          setMpSearchActive(true);
          setMpFocus("content");
          return;
        }
        if (mpFocus === "tabbar") {
          // ↓ or Enter drops focus into content
          if (key.downArrow || input === "j" || key.return) {
            setMpFocus("content");
          }
        } else {
          // Content zone: ↑ at top returns to tabbar
          if ((key.upArrow || input === "k") && mpCursor === 0) {
            setMpFocus("tabbar");
          } else if (key.upArrow || input === "k") {
            setMpCursor((c) => Math.max(0, c - 1));
          }
          if (key.downArrow || input === "j")
            setMpCursor((c) => Math.min(filteredMp.length - 1, c + 1));
          if (key.pageUp)
            setMpCursor((c) => Math.max(0, c - mpPageSize));
          if (key.pageDown)
            setMpCursor((c) => Math.min(filteredMp.length - 1, c + mpPageSize));
          if (key.return) {
            const p = filteredMp[mpCursor];
            if (p) {
              setDetail({ source: "marketplace", plugin: p });
              setShowDetail(true);
            }
          }
          if (input === "i") {
            const p = filteredMp[mpCursor];
            if (p) installPlugin(p);
          }
        }
        // Number keys for marketplace tab select
        const num = parseInt(input, 10);
        if (num >= 1 && num <= marketplaces.length) {
          setMpTab(num - 1);
          setMpCursor(0);
          setMpSearch("");
          setMpFocus("content");
        }
        break;
      }
      case "settings": {
        if (key.upArrow || input === "k")
          setSettingsCursor((c) => Math.max(0, c - 1));
        if (key.downArrow || input === "j")
          setSettingsCursor((c) => Math.min(marketplaces.length - 1, c + 1));
        if (input === "a") {
          setAddMpActive(true);
          setAddMpValue("");
        }
        if (input === "x") {
          const mp = marketplaces[settingsCursor];
          if (mp) {
            const onSuccess = () => {
              config.persistRemove(mp.name);
              setMarketplaces((prev) => prev.filter((m) => m.name !== mp.name));
              setMpPlugins((prev) => {
                const updated = { ...prev };
                delete updated[mp.name];
                return updated;
              });
              setSettingsCursor((c) => Math.max(0, Math.min(c, marketplaces.length - 2)));
              showToast(`✓ Removed ${mp.name}`);
            };
            if (!demoMode) {
              setLoading(`Removing ${mp.name}…`);
              const result = copilot.removeMarketplace(mp.name);
              setLoading("");
              if (result.success) onSuccess();
              else showToast(`✗ Remove failed: ${mp.name}`);
            } else {
              onSuccess();
            }
          }
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
            termHeight={termHeight}
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
            contentFocused={mpFocus === "content"}
            termHeight={termHeight}
          />
        );
      case "settings":
        return <SettingsView marketplaces={marketplaces} cursor={settingsCursor} addActive={addMpActive} addValue={addMpValue} onAddChange={setAddMpValue} />;
    }
  };

  if (!ready) {
    return (
      <Box flexDirection="column" width={termWidth} height={termHeight} paddingX={1} paddingY={1} justifyContent="center" alignItems="center">
        <Box>
          <Text color="#58a6ff">
            <Spinner type="dots" />
          </Text>
          <Text color="#58a6ff"> Loading plugins and marketplaces…</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight} paddingX={1} paddingY={1}>
      {!showDetail && <TabBar active={screen} onSwitch={setScreen} focused={screen !== "marketplace" || mpFocus === "tabbar"} />}
      {loading && (
        <Box marginBottom={1}>
          <Text color="#58a6ff">
            <Spinner type="dots" />
          </Text>
          <Text color="#58a6ff"> {loading}</Text>
        </Box>
      )}
      {!loading && toast && (
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
