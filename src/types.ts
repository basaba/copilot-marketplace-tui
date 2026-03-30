export interface InstalledPlugin {
  name: string;
  version: string;
  enabled: boolean;
  marketplace: string;
  updateAvailable: boolean;
}

export interface MarketplacePlugin {
  name: string;
  description: string;
  version: string;
  installed: boolean;
  marketplace: string;
}

export interface Marketplace {
  name: string;
  url: string;
}

export interface PluginSummary {
  totalInstalled: number;
  enabled: number;
  disabled: number;
  updatesAvailable: number;
  marketplaceCount: number;
}

export type Screen = "dashboard" | "installed" | "marketplace" | "settings";

export const SCREENS: Screen[] = [
  "dashboard",
  "installed",
  "marketplace",
  "settings",
];

export const SCREEN_LABELS: Record<Screen, string> = {
  dashboard: "Dashboard",
  installed: "Installed",
  marketplace: "Marketplace",
  settings: "Settings",
};
