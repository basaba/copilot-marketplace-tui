import type { InstalledPlugin, MarketplacePlugin, PluginCapability } from "../types.js";
interface DetailViewProps {
    plugin: InstalledPlugin | MarketplacePlugin | null;
    source: "installed" | "marketplace";
    termWidth?: number;
    skills?: PluginCapability[];
    agents?: PluginCapability[];
    capabilitiesLoading?: boolean;
}
export default function DetailView({ plugin, source, termWidth, skills, agents, capabilitiesLoading, }: DetailViewProps): import("react/jsx-runtime").JSX.Element;
export {};
