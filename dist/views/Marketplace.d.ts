import type { MarketplacePlugin, Marketplace } from "../types.js";
interface MarketplaceViewProps {
    marketplaces: Marketplace[];
    plugins: Record<string, MarketplacePlugin[]>;
    activeTab: number;
    cursor: number;
    searchQuery: string;
    searchActive: boolean;
    onSearchChange: (query: string) => void;
    contentFocused?: boolean;
    termHeight?: number;
    loadingMarketplaces?: Set<string>;
}
declare function filterPlugins(plugins: MarketplacePlugin[], query: string): MarketplacePlugin[];
declare const MARKETPLACE_CHROME = 15;
export default function MarketplaceView({ marketplaces, plugins, activeTab, cursor, searchQuery, searchActive, onSearchChange, contentFocused, termHeight, loadingMarketplaces, }: MarketplaceViewProps): import("react/jsx-runtime").JSX.Element;
export { filterPlugins, MARKETPLACE_CHROME };
