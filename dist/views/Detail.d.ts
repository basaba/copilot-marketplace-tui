import type { InstalledPlugin, MarketplacePlugin } from "../types.js";
interface DetailViewProps {
    plugin: InstalledPlugin | MarketplacePlugin | null;
    source: "installed" | "marketplace";
    readme?: string | null;
    readmeLoading?: boolean;
    termHeight?: number;
    termWidth?: number;
    scrollOffset?: number;
    searchQuery?: string;
    searchActive?: boolean;
    onSearchChange?: (query: string) => void;
    onScrollTo?: (offset: number) => void;
}
export default function DetailView({ plugin, source, readme, readmeLoading, termHeight, termWidth, scrollOffset, searchQuery, searchActive, onSearchChange, onScrollTo, }: DetailViewProps): import("react/jsx-runtime").JSX.Element;
export {};
