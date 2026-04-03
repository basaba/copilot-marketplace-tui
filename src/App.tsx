import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import Spinner from "ink-spinner";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { TabBar } from "./components/index.js";
import {
  Dashboard,
  InstalledView,
  MarketplaceView,
  DetailView,
  SettingsView,
} from "./views/index.js";
import { filterPlugins as filterInstalled, INSTALLED_CHROME } from "./views/Installed.js";
import { filterPlugins as filterMarketplace, MARKETPLACE_CHROME } from "./views/Marketplace.js";
import { copilot, config } from "./services/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
marked.use(markedTerminal() as any);
import type { Screen, InstalledPlugin, MarketplacePlugin, Marketplace, PluginSummary } from "./types.js";

type DetailTarget =
  | { source: "installed"; plugin: InstalledPlugin; marketplaceUrl?: string }
  | { source: "marketplace"; plugin: MarketplacePlugin; marketplaceUrl?: string };

type AppData = {
  plugins: InstalledPlugin[];
  marketplaces: Marketplace[];
  mpPlugins: Record<string, MarketplacePlugin[]>;
  errors: string[];
};

function computeSummary(plugins: InstalledPlugin[], marketplaces: Marketplace[]): PluginSummary {
  return {
    totalInstalled: plugins.length,
    enabled: plugins.filter((p) => p.enabled).length,
    disabled: plugins.filter((p) => !p.enabled).length,
    updatesAvailable: plugins.filter((p) => p.updateAvailable).length,
    marketplaceCount: marketplaces.length,
  };
}

async function loadDataAsync(): Promise<AppData> {
  const [plugins, rawMarketplaces] = await Promise.all([
    copilot.listInstalledAsync(),
    copilot.listMarketplacesAsync(),
  ]);
  const marketplaces = config.applyConfig(rawMarketplaces);
  // Start with persisted plugin lists — actual data is loaded lazily per marketplace
  const persisted = config.loadMarketplacePlugins();
  const mpPlugins: Record<string, MarketplacePlugin[]> = {};
  for (const mp of marketplaces) {
    mpPlugins[mp.name] = persisted[mp.name] || [];
  }
  return { plugins, marketplaces, mpPlugins, errors: [] };
}

export default function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;
  const termHeight = stdout?.rows ?? 24;

  // Data — load async from CLI
  const [ready, setReady] = useState(false);
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [mpPlugins, setMpPlugins] = useState<Record<string, MarketplacePlugin[]>>({});

  // Toast
  const [toast, setToast] = useState("");
  // Loading state for async CLI operations
  const [loading, setLoading] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  useEffect(() => {
    loadDataAsync().then((data) => {
      setPlugins(data.plugins);
      setMarketplaces(data.marketplaces);
      setMpPlugins(data.mpPlugins);
      setReady(true);
      if (data.errors.length > 0) {
        showToast(data.errors.join("; "));
      }
    });
  }, []);

  const summary = useMemo(
    () => computeSummary(plugins, marketplaces),
    [plugins, marketplaces]
  );

  // Navigation
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailReadme, setDetailReadme] = useState<string | null>(null);
  const [detailReadmeLoading, setDetailReadmeLoading] = useState(false);
  const [detailScroll, setDetailScroll] = useState(0);
  const [detailSearchActive, setDetailSearchActive] = useState(false);
  const [detailSearchQuery, setDetailSearchQuery] = useState("");

  // Fetch README when detail view opens
  useEffect(() => {
    if (!showDetail || !detail) {
      setDetailReadme(null);
      setDetailScroll(0);
      setDetailSearchActive(false);
      setDetailSearchQuery("");
      return;
    }
    const pluginName = detail.plugin.name;
    const url = detail.marketplaceUrl;
    if (!url) return;
    setDetailReadme(null);
    setDetailReadmeLoading(true);
    setDetailScroll(0);
    copilot.fetchPluginReadmeAsync(pluginName, url).then((md) => {
      setDetailReadme(md);
      setDetailReadmeLoading(false);
    }).catch(() => {
      setDetailReadme(null);
      setDetailReadmeLoading(false);
    });
  }, [showDetail, detail]);

  // Cursors per screen
  const [instCursor, setInstCursor] = useState(0);
  const [mpCursor, setMpCursor] = useState(0);
  const [mpTab, setMpTab] = useState(0);
  const [mpFocus, setMpFocus] = useState<"tabbar" | "content">("tabbar");
  const [settingsCursor, setSettingsCursor] = useState(0);

  // Track which marketplaces have been fetched to avoid redundant loads
  const [mpFetched, setMpFetched] = useState<Set<string>>(new Set());
  const [mpLoading, setMpLoading] = useState<Set<string>>(new Set());
  // Track which marketplaces have had descriptions backfilled
  const [mpDescFetched, setMpDescFetched] = useState<Set<string>>(new Set());

  // Lazy-load marketplace plugins when the user navigates to the marketplace view
  // Phase 1: fast — fetch plugin names via Git Trees API (single call)
  // Phase 2: background — backfill descriptions via copilot CLI
  useEffect(() => {
    if (screen !== "marketplace" || marketplaces.length === 0) return;
    const mp = marketplaces[mpTab];
    if (!mp || mpFetched.has(mp.name) || mpLoading.has(mp.name)) return;
    setMpLoading((prev) => new Set(prev).add(mp.name));
    const installedNames = new Set(plugins.map((p) => p.name));

    // Phase 1: get plugin names instantly
    copilot.browseMarketplaceAsync(mp.name, installedNames, mp.url).then((items) => {
      if (items.length > 0) {
        setMpPlugins((prev) => ({ ...prev, [mp.name]: items }));
      }
      setMpFetched((prev) => new Set(prev).add(mp.name));
      setMpLoading((prev) => { const next = new Set(prev); next.delete(mp.name); return next; });

      // Phase 2: backfill descriptions in the background
      copilot.fetchDescriptionsAsync(mp.name, installedNames).then((withDescs) => {
        if (withDescs.length > 0) {
          config.persistMarketplacePlugins(mp.name, withDescs);
          setMpPlugins((prev) => ({ ...prev, [mp.name]: withDescs }));
        }
        setMpDescFetched((prev) => new Set(prev).add(mp.name));
      }).catch(() => {
        // Descriptions failed — names are still shown, not critical
      });
    }).catch(() => {
      showToast(`✗ Failed to browse "${mp.name}"`);
      setMpFetched((prev) => new Set(prev).add(mp.name));
      setMpLoading((prev) => { const next = new Set(prev); next.delete(mp.name); return next; });
    });
  }, [screen, mpTab, marketplaces, mpFetched, mpLoading, plugins, showToast]);

  // Search state
  const [instSearch, setInstSearch] = useState("");
  const [instSearchActive, setInstSearchActive] = useState(false);
  const [mpSearch, setMpSearch] = useState("");
  const [mpSearchActive, setMpSearchActive] = useState(false);

  // Settings: add marketplace input state
  const [addMpActive, setAddMpActive] = useState(false);
  const [addMpValue, setAddMpValue] = useState("");

  // Plugin action handlers
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
    setLoading(`Installing ${p.name}…`);
    copilot.installPluginAsync(spec).then(result => {
      setLoading("");
      if (result.success) onSuccess();
      else showToast(`✗ Install failed: ${p.name}`);
    });
  }, [loading, showToast]);

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
    setLoading(`Uninstalling ${p.name}…`);
    copilot.uninstallPluginAsync(spec).then(result => {
      setLoading("");
      if (result.success) onSuccess();
      else showToast(`✗ Uninstall failed: ${p.name}`);
    });
  }, [loading, showToast]);

  const enablePlugin = useCallback((p: InstalledPlugin) => {
    if (loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, enabled: true } : pl
      ));
      showToast(`✓ Enabled ${p.name}`);
    };
    setLoading(`Enabling ${p.name}…`);
    copilot.enablePluginAsync(spec).then(result => {
      setLoading("");
      if (result.success) onSuccess();
      else showToast(`✗ Enable failed: ${p.name}`);
    });
  }, [loading, showToast]);

  const disablePlugin = useCallback((p: InstalledPlugin) => {
    if (loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, enabled: false } : pl
      ));
      showToast(`✓ Disabled ${p.name}`);
    };
    setLoading(`Disabling ${p.name}…`);
    copilot.disablePluginAsync(spec).then(result => {
      setLoading("");
      if (result.success) onSuccess();
      else showToast(`✗ Disable failed: ${p.name}`);
    });
  }, [loading, showToast]);

  const updatePlugin = useCallback((p: InstalledPlugin) => {
    if (!p.updateAvailable || loading) return;
    const spec = `${p.name}@${p.marketplace}`;
    const onSuccess = () => {
      setPlugins(prev => prev.map(pl =>
        pl.name === p.name ? { ...pl, updateAvailable: false } : pl
      ));
      showToast(`✓ Updated ${p.name}`);
    };
    setLoading(`Updating ${p.name}…`);
    copilot.updatePluginAsync(spec).then(result => {
      setLoading("");
      if (result.success) onSuccess();
      else showToast(`✗ Update failed: ${p.name}`);
    });
  }, [loading, showToast]);

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
      // Search input mode
      if (detailSearchActive) {
        if (key.escape) {
          setDetailSearchActive(false);
          return;
        }
        if (key.return) {
          setDetailSearchActive(false);
          return;
        }
        // Let TextInput handle the rest via onSearchChange
        return;
      }

      if (key.escape) {
        if (detailSearchQuery) {
          setDetailSearchQuery("");
        } else {
          setShowDetail(false);
        }
        return;
      }
      if (key.upArrow) { setDetailScroll((s) => Math.max(0, s - 1)); return; }
      if (key.downArrow) { setDetailScroll((s) => s + 1); return; }
      if (key.pageUp || input === "b") { setDetailScroll((s) => Math.max(0, s - (termHeight - 16))); return; }
      if (key.pageDown || input === " ") { setDetailScroll((s) => s + (termHeight - 16)); return; }
      if (input === "/") { setDetailSearchActive(true); return; }
      // n/N: jump to next/prev search match
      if ((input === "n" || input === "N") && detailSearchQuery && detailReadme) {
        const rendered = (marked.parse(detailReadme) as string).trimEnd();
        const lines = rendered.split("\n");
        const q = detailSearchQuery.toLowerCase();
        const matchIdxs: number[] = [];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]!.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").toLowerCase().includes(q)) {
            matchIdxs.push(i);
          }
        }
        if (matchIdxs.length > 0) {
          if (input === "n") {
            const next = matchIdxs.find((l) => l > detailScroll) ?? matchIdxs[0]!;
            setDetailScroll(next);
          } else {
            const prev = [...matchIdxs].reverse().find((l) => l < detailScroll) ?? matchIdxs[matchIdxs.length - 1]!;
            setDetailScroll(prev);
          }
        }
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
          const mpUrl = marketplaces.find((m) => m.name === p.marketplace)?.url;
          setDetail({ source: "installed", plugin: p, marketplaceUrl: mpUrl });
          setShowDetail(true);
        }
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
          const mpUrl = marketplaces[mpTab]?.url;
          setDetail({ source: "marketplace", plugin: p, marketplaceUrl: mpUrl });
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
          setMpPlugins((prev) => ({ ...prev, [name]: [] }));
          copilot.browseMarketplaceAsync(name, installedNames, url).then((items) => {
            if (items.length > 0) {
              config.persistMarketplacePlugins(name, items);
              setMpPlugins((prev) => ({ ...prev, [name]: items }));
            } else {
              const persisted = config.loadMarketplacePlugins();
              if (persisted[name]?.length) {
                setMpPlugins((prev) => ({ ...prev, [name]: persisted[name]! }));
              }
            }
          }).catch(() => {
            showToast(`✗ Failed to browse "${name}" — check copilot login`);
            const persisted = config.loadMarketplacePlugins();
            if (persisted[name]?.length) {
              setMpPlugins((prev) => ({ ...prev, [name]: persisted[name]! }));
            }
          });
        };
        setLoading(`Adding marketplace ${spec}…`);
        copilot.addMarketplaceAsync(spec).then((result) => {
          if (result.success) {
            // Re-list marketplaces from CLI to get the correct name
            copilot.listMarketplacesAsync().then((fresh) => {
              setLoading("");
              const existing = new Set(marketplaces.map((m) => m.name));
              const added = fresh.find((m) => !existing.has(m.name))
                || fresh.find((m) => m.name === spec || m.url.endsWith(`/${spec}`));
              if (added && !existing.has(added.name)) {
                onSuccess(added.name, added.url);
              } else if (added) {
                const installedNames = new Set(plugins.map((p) => p.name));
                copilot.browseMarketplaceAsync(added.name, installedNames, added.url).then((items) => {
                  if (items.length > 0) {
                    config.persistMarketplacePlugins(added.name, items);
                    setMpPlugins((prev) => ({ ...prev, [added.name]: items }));
                  }
                }).catch(() => {
                  showToast(`✗ Failed to browse "${added.name}" — check copilot login`);
                });
                showToast(`✓ Refreshed ${added.name}`);
              } else {
                // CLI accepted the add but we can't resolve the name — use the
                // full fresh list instead of guessing from the raw user input.
                const newOnes = fresh.filter((m) => !existing.has(m.name));
                if (newOnes.length === 1) {
                  onSuccess(newOnes[0]!.name, newOnes[0]!.url);
              } else {
                showToast(`✗ Marketplace added but could not resolve name for "${spec}"`);
              }
            }
            });
          } else {
            setLoading("");
            showToast(`✗ Add failed: ${spec}`);
          }
        }).catch(() => {
          setLoading("");
          showToast(`✗ Add failed: ${spec}`);
        });
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
            setDetail({ source: "installed", plugin: p, marketplaceUrl: marketplaces.find((m) => m.name === p.marketplace)?.url });
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
              setDetail({ source: "marketplace", plugin: p, marketplaceUrl: marketplaces[mpTab]?.url });
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
            setLoading(`Removing ${mp.name}…`);
            copilot.removeMarketplaceAsync(mp.name).then((result) => {
              setLoading("");
              if (result.success) onSuccess();
              else showToast(`✗ Remove failed: ${mp.name}`);
            }).catch(() => {
              setLoading("");
              showToast(`✗ Remove failed: ${mp.name}`);
            });          }
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
          readme={detailReadme}
          readmeLoading={detailReadmeLoading}
          termHeight={termHeight}
          termWidth={termWidth}
          scrollOffset={detailScroll}
          searchQuery={detailSearchQuery}
          searchActive={detailSearchActive}
          onSearchChange={setDetailSearchQuery}
          onScrollTo={setDetailScroll}
        />
      );
    }

    switch (screen) {
      case "dashboard":
        return (
          <Dashboard
            summary={summary}
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
            loadingMarketplaces={mpLoading}
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
