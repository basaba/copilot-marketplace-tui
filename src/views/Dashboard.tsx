import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { PluginSummary } from "../types.js";

interface DashboardProps {
  summary: PluginSummary;
  cursor: number;
  onAction: (action: string) => void;
}

const quickActions = [
  { id: "marketplace", label: "Browse Marketplace", desc: "Discover and install new plugins" },
  { id: "installed", label: "Manage Installed", desc: "View and configure installed plugins" },
  { id: "updates", label: "Check Updates", desc: "Check for plugin updates" },
  { id: "settings", label: "Settings", desc: "Configure CPM preferences" },
];

interface StatCardProps {
  value: number;
  label: string;
  color: string;
}

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={color}
      paddingX={2}
      paddingY={0}
      width={18}
      flexDirection="column"
      alignItems="center"
    >
      <Text bold color={color}>
        {value}
      </Text>
      <Text color={colors.textDim}>{label}</Text>
    </Box>
  );
}

export default function Dashboard({ summary, cursor }: DashboardProps) {
  return (
    <Box flexDirection="column">
      {/* Stat cards */}
      <Box gap={1} marginY={1}>
        <StatCard value={summary.totalInstalled} label="Installed" color={colors.primary} />
        <StatCard value={summary.enabled} label="Enabled" color={colors.success} />
        <StatCard value={summary.disabled} label="Disabled" color={colors.warning} />
        <StatCard value={summary.updatesAvailable} label="Updates" color={colors.danger} />
      </Box>

      {/* Quick actions */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        <Text bold color={colors.text} >
          Quick Actions
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {quickActions.map((action, i) => {
            const selected = i === cursor;
            return (
              <Box key={action.id} gap={1}>
                <Text bold={selected} color={selected ? colors.primary : colors.text}>
                  {selected ? "▸" : " "} {action.label}
                </Text>
                <Text color={colors.textDim}>{action.desc}</Text>
              </Box>
            );
          })}
        </Box>
      </Box>

      <StatusBar
        items={[
          { key: "↑/↓", desc: "navigate" },
          { key: "enter", desc: "select" },
          { key: "←/→", desc: "switch view" },
          { key: "q", desc: "quit" },
        ]}
      />
    </Box>
  );
}

export { quickActions };
