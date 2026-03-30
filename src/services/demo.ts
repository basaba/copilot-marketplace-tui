import type {
  InstalledPlugin,
  MarketplacePlugin,
  Marketplace,
  PluginSummary,
} from "../types.js";

// Demo data for testing without a real copilot CLI

export function demoMarketplaces(): Marketplace[] {
  return [
    { name: "github/copilot-plugins", url: "https://github.com/github/copilot-plugins" },
    { name: "github/awesome-copilot", url: "https://github.com/github/awesome-copilot" },
    { name: "community/extensions", url: "https://github.com/community/extensions" },
  ];
}

export function demoInstalledPlugins(): InstalledPlugin[] {
  return [
    { name: "docker", version: "1.2.0", enabled: true, marketplace: "github/copilot-plugins", updateAvailable: false },
    { name: "azure", version: "0.9.1", enabled: true, marketplace: "github/copilot-plugins", updateAvailable: true },
    { name: "terraform", version: "2.0.0", enabled: false, marketplace: "github/copilot-plugins", updateAvailable: false },
    { name: "kubernetes", version: "1.5.3", enabled: true, marketplace: "github/awesome-copilot", updateAvailable: false },
    { name: "postgres", version: "0.4.0", enabled: true, marketplace: "community/extensions", updateAvailable: true },
    { name: "redis", version: "1.0.0", enabled: false, marketplace: "community/extensions", updateAvailable: false },
    { name: "github-actions", version: "3.1.0", enabled: true, marketplace: "github/copilot-plugins", updateAvailable: false },
    { name: "sentry", version: "0.2.1", enabled: true, marketplace: "github/awesome-copilot", updateAvailable: true },
  ];
}

export function demoMarketplacePlugins(marketplace: string): MarketplacePlugin[] {
  const all: Record<string, MarketplacePlugin[]> = {
    "github/copilot-plugins": [
      { name: "docker", description: "Docker container management", version: "1.2.0", installed: true, marketplace: "github/copilot-plugins" },
      { name: "azure", description: "Azure cloud services integration", version: "1.0.0", installed: true, marketplace: "github/copilot-plugins" },
      { name: "terraform", description: "Infrastructure as code with Terraform", version: "2.0.0", installed: true, marketplace: "github/copilot-plugins" },
      { name: "github-actions", description: "CI/CD with GitHub Actions", version: "3.1.0", installed: true, marketplace: "github/copilot-plugins" },
      { name: "aws", description: "Amazon Web Services integration", version: "1.3.0", installed: false, marketplace: "github/copilot-plugins" },
      { name: "gcp", description: "Google Cloud Platform tools", version: "0.8.0", installed: false, marketplace: "github/copilot-plugins" },
    ],
    "github/awesome-copilot": [
      { name: "kubernetes", description: "Kubernetes cluster management", version: "1.5.3", installed: true, marketplace: "github/awesome-copilot" },
      { name: "sentry", description: "Error tracking and monitoring", version: "0.3.0", installed: true, marketplace: "github/awesome-copilot" },
      { name: "datadog", description: "Application monitoring and analytics", version: "1.1.0", installed: false, marketplace: "github/awesome-copilot" },
      { name: "pagerduty", description: "Incident response automation", version: "0.5.0", installed: false, marketplace: "github/awesome-copilot" },
    ],
    "community/extensions": [
      { name: "postgres", description: "PostgreSQL database management", version: "0.4.0", installed: true, marketplace: "community/extensions" },
      { name: "redis", description: "Redis cache and data store", version: "1.0.0", installed: true, marketplace: "community/extensions" },
      { name: "mongodb", description: "MongoDB document database", version: "0.7.0", installed: false, marketplace: "community/extensions" },
      { name: "elasticsearch", description: "Full-text search engine", version: "1.2.0", installed: false, marketplace: "community/extensions" },
      { name: "rabbitmq", description: "Message queue broker", version: "0.3.0", installed: false, marketplace: "community/extensions" },
    ],
  };

  return all[marketplace] || [];
}

export function computeSummary(plugins: InstalledPlugin[], marketplaces: Marketplace[]): PluginSummary {
  return {
    totalInstalled: plugins.length,
    enabled: plugins.filter((p) => p.enabled).length,
    disabled: plugins.filter((p) => !p.enabled).length,
    updatesAvailable: plugins.filter((p) => p.updateAvailable).length,
    marketplaceCount: marketplaces.length,
  };
}
