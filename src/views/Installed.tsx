import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { SearchBar, Table, StatusBar } from "../components/index.js";
import type { InstalledPlugin } from "../types.js";

interface InstalledViewProps {
  plugins: InstalledPlugin[];
  cursor: number;
  searchQuery: string;
  searchActive: boolean;
  onSearchChange: (query: string) => void;
  termHeight?: number;
}

const columns = [
  { title: "Name", width: 22, key: "name" },
  { title: "Version", width: 12, key: "version" },
  { title: "Status", width: 14, key: "status" },
  { title: "Marketplace", width: 24, key: "marketplace" },
  { title: "Update", width: 12, key: "update" },
];

function filterPlugins(plugins: InstalledPlugin[], query: string): InstalledPlugin[] {
  if (!query) return plugins;
  const q = query.toLowerCase();
  return plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.marketplace.toLowerCase().includes(q)
  );
}

// Overhead: App padding(2) + TabBar(2) + SearchBar(3) + margin(1) + StatusBar(2) + Table header/sep/scroll(3)
const INSTALLED_CHROME = 13;

export default function InstalledView({
  plugins,
  cursor,
  searchQuery,
  searchActive,
  onSearchChange,
  termHeight,
}: InstalledViewProps) {
  const tableHeight = termHeight ? Math.max(5, termHeight - INSTALLED_CHROME) : undefined;
  const filtered = filterPlugins(plugins, searchQuery);

  const rows = filtered.map((p) => ({
    name: p.name,
    version: p.version,
    status: p.enabled ? "● enabled" : "○ disabled",
    marketplace: p.marketplace,
    update: p.updateAvailable ? "⬆ update" : "",
  }));

  if (plugins.length === 0) {
    return (
      <Box flexDirection="column">
        <Box paddingX={2} paddingY={1}>
          <Text italic color={colors.textDim}>
            No plugins installed. Browse the Marketplace to discover and install
            plugins.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Filter plugins..."
        active={searchActive}
      />

      <Box marginTop={1}>
        <Table columns={columns} rows={rows} cursor={cursor} height={tableHeight} />
      </Box>

      <StatusBar
        items={[
          { key: "↑/↓", desc: "navigate" },
          { key: "enter", desc: "detail" },
          { key: "/", desc: "search" },
          { key: "e", desc: "enable" },
          { key: "d", desc: "disable" },
          { key: "u", desc: "update" },
          { key: "x", desc: "uninstall" },
        ]}
      />
    </Box>
  );
}

export { filterPlugins, INSTALLED_CHROME };
