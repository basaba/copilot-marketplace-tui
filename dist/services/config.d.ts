import type { Marketplace, MarketplacePlugin } from "../types.js";
interface ConfigData {
    addedMarketplaces: Marketplace[];
    removedMarketplaceNames: string[];
    marketplacePlugins: Record<string, MarketplacePlugin[]>;
}
export declare function loadConfig(): ConfigData;
/** Merge base marketplaces with persisted adds/removes. */
export declare function applyConfig(base: Marketplace[]): Marketplace[];
/** Load persisted plugin lists for marketplaces. */
export declare function loadMarketplacePlugins(): Record<string, MarketplacePlugin[]>;
/** Persist the plugin list for a marketplace. */
export declare function persistMarketplacePlugins(name: string, plugins: MarketplacePlugin[]): void;
export declare function persistAdd(mp: Marketplace): void;
export declare function persistRemove(name: string): void;
export {};
