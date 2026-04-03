import type { InstalledPlugin, MarketplacePlugin, Marketplace } from "../types.js";
export declare function listInstalled(): InstalledPlugin[];
export declare function listInstalledAsync(): Promise<InstalledPlugin[]>;
export declare function listMarketplaces(): Marketplace[];
export declare function listMarketplacesAsync(): Promise<Marketplace[]>;
export declare function browseMarketplaceAsync(name: string, installedNames: Set<string>, url?: string): Promise<MarketplacePlugin[]>;
/** Backfill descriptions using copilot CLI (returns full name+desc list). */
export declare function fetchDescriptionsAsync(name: string, installedNames: Set<string>): Promise<MarketplacePlugin[]>;
export declare function installPlugin(name: string): {
    success: boolean;
    message: string;
};
export declare function installPluginAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function uninstallPlugin(name: string): {
    success: boolean;
    message: string;
};
export declare function uninstallPluginAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function enablePlugin(name: string): {
    success: boolean;
    message: string;
};
export declare function enablePluginAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function disablePlugin(name: string): {
    success: boolean;
    message: string;
};
export declare function disablePluginAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function updatePlugin(name: string): {
    success: boolean;
    message: string;
};
export declare function updatePluginAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function addMarketplace(spec: string): {
    success: boolean;
    message: string;
};
export declare function addMarketplaceAsync(spec: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function removeMarketplace(name: string): {
    success: boolean;
    message: string;
};
export declare function removeMarketplaceAsync(name: string): Promise<{
    success: boolean;
    message: string;
}>;
/** Fetch a plugin's README.md from its marketplace repo via gh API. */
export declare function fetchPluginReadmeAsync(pluginName: string, marketplaceUrl: string): Promise<string>;
