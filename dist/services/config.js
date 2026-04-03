import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const CONFIG_DIR = join(homedir(), ".copilot-plugin-marketplace");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
function defaultConfig() {
    return { addedMarketplaces: [], removedMarketplaceNames: [], marketplacePlugins: {} };
}
export function loadConfig() {
    try {
        if (!existsSync(CONFIG_FILE))
            return defaultConfig();
        const raw = readFileSync(CONFIG_FILE, "utf-8");
        const data = JSON.parse(raw);
        return {
            addedMarketplaces: Array.isArray(data.addedMarketplaces) ? data.addedMarketplaces : [],
            removedMarketplaceNames: Array.isArray(data.removedMarketplaceNames) ? data.removedMarketplaceNames : [],
            marketplacePlugins: data.marketplacePlugins && typeof data.marketplacePlugins === "object" ? data.marketplacePlugins : {},
        };
    }
    catch {
        return defaultConfig();
    }
}
function saveConfig(config) {
    try {
        if (!existsSync(CONFIG_DIR)) {
            mkdirSync(CONFIG_DIR, { recursive: true });
        }
        writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    }
    catch {
        // Silently fail — best-effort persistence
    }
}
/** Merge base marketplaces with persisted adds/removes. */
export function applyConfig(base) {
    const config = loadConfig();
    const removed = new Set(config.removedMarketplaceNames);
    const result = base.filter((mp) => !removed.has(mp.name));
    for (const mp of config.addedMarketplaces) {
        if (!result.some((m) => m.name === mp.name)) {
            result.push(mp);
        }
    }
    return result;
}
/** Load persisted plugin lists for marketplaces. */
export function loadMarketplacePlugins() {
    return loadConfig().marketplacePlugins;
}
/** Persist the plugin list for a marketplace. */
export function persistMarketplacePlugins(name, plugins) {
    if (plugins.length === 0)
        return;
    const cfg = loadConfig();
    cfg.marketplacePlugins[name] = plugins;
    saveConfig(cfg);
}
export function persistAdd(mp) {
    const config = loadConfig();
    config.removedMarketplaceNames = config.removedMarketplaceNames.filter((n) => n !== mp.name);
    if (!config.addedMarketplaces.some((m) => m.name === mp.name)) {
        config.addedMarketplaces.push(mp);
    }
    saveConfig(config);
}
export function persistRemove(name) {
    const config = loadConfig();
    config.addedMarketplaces = config.addedMarketplaces.filter((m) => m.name !== name);
    delete config.marketplacePlugins[name];
    if (!config.removedMarketplaceNames.includes(name)) {
        config.removedMarketplaceNames.push(name);
    }
    saveConfig(config);
}
