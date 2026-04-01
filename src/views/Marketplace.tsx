import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { SearchBar, Table, StatusBar } from "../components/index.js";
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
}

const columns = [
  { title: "Name", width: 22, key: "name" },
  { title: "Description", width: 36, key: "description" },
  { title: "Version", width: 12, key: "version" },
  { title: "Status", width: 14, key: "status" },
];

function filterPlugins(
  plugins: MarketplacePlugin[],
  query: string
): MarketplacePlugin[] {
  if (!query) return plugins;
  const q = query.toLowerCase();
  return plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export default function MarketplaceView({
  marketplaces,
  plugins,
  activeTab,
  cursor,
  searchQuery,
  searchActive,
  onSearchChange,
  contentFocused = false,
}: MarketplaceViewProps) {
  if (marketplaces.length === 0) {
    return (
      <Box flexDirection="column">
        <Box paddingX={2} paddingY={1}>
          <Text italic color={colors.textDim}>
            No marketplaces registered. Go to Settings and add one.
          </Text>
        </Box>
      </Box>
    );
  }

  const activeMarketplace = marketplaces[activeTab]?.name || "";
  const allPlugins = plugins[activeMarketplace] || [];
  const filtered = filterPlugins(allPlugins, searchQuery);

  const rows = filtered.map((p) => ({
    name: p.name,
    description: p.description,
    version: p.version,
    status: p.installed ? "✓ installed" : "",
  }));

  return (
    <Box flexDirection="column">
      {/* Marketplace tabs */}
      <Box gap={1} marginBottom={1}>
        {marketplaces.map((mp, i) => {
          const isActive = i === activeTab;
          return (
            <Box key={mp.name} paddingX={1}>
              <Text
                bold={isActive && contentFocused}
                color={
                  contentFocused && isActive
                    ? colors.white
                    : isActive
                      ? colors.secondary
                      : colors.textDim
                }
                backgroundColor={
                  contentFocused && isActive
                    ? colors.accent
                    : isActive
                      ? colors.border
                      : undefined
                }
              >
                {i + 1}. {mp.name}
              </Text>
            </Box>
          );
        })}
      </Box>

      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search plugins..."
        active={searchActive}
      />

      <Box marginTop={1}>
        <Table columns={columns} rows={rows} cursor={cursor} />
      </Box>

      <StatusBar
        items={
          contentFocused
            ? [
                { key: "←/→", desc: "switch marketplace" },
                { key: "↑/↓", desc: "navigate" },
                { key: "enter", desc: "detail" },
                { key: "i", desc: "install" },
                { key: "/", desc: "search" },
              ]
            : [
                { key: "←/→", desc: "switch view" },
                { key: "↓/enter", desc: "enter content" },
              ]
        }
      />
    </Box>
  );
}

export { filterPlugins };
