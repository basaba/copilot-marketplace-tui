import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { PluginSummary } from "../types.js";

interface DashboardProps {
  summary: PluginSummary;
}

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

export default function Dashboard({ summary }: DashboardProps) {
  return (
    <Box flexDirection="column">
      {/* Stat cards */}
      <Box gap={1} marginY={1}>
        <StatCard value={summary.totalInstalled} label="Installed" color={colors.primary} />
        <StatCard value={summary.enabled} label="Enabled" color={colors.success} />
        <StatCard value={summary.disabled} label="Disabled" color={colors.warning} />
        <StatCard value={summary.updatesAvailable} label="Updates" color={colors.danger} />
      </Box>

      <StatusBar
        items={[
          { key: "←/→", desc: "switch view" },
          { key: "q", desc: "quit" },
        ]}
      />
    </Box>
  );
}
