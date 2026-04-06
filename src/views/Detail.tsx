import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { InstalledPlugin, MarketplacePlugin, PluginCapability } from "../types.js";

interface DetailViewProps {
  plugin: InstalledPlugin | MarketplacePlugin | null;
  source: "installed" | "marketplace";
  termWidth?: number;
  skills?: PluginCapability[];
  agents?: PluginCapability[];
  capabilitiesLoading?: boolean;
}

function isInstalled(p: InstalledPlugin | MarketplacePlugin): p is InstalledPlugin {
  return "enabled" in p;
}

function Field({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box>
      <Box width={18}>
        <Text bold color={colors.accent}>{label}</Text>
      </Box>
      <Text color={valueColor || colors.text}>{value}</Text>
    </Box>
  );
}

export default function DetailView({
  plugin, source, termWidth = 80, skills = [], agents = [], capabilitiesLoading = false,
}: DetailViewProps) {
  const allCapabilities = [...skills, ...agents];
  const [cursor, setCursor] = useState(0);

  // Reset cursor when capabilities change (new plugin opened)
  useEffect(() => {
    setCursor(0);
  }, [skills, agents]);

  useInput((_input, key) => {
    if (allCapabilities.length === 0) return;
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(allCapabilities.length - 1, c + 1));
  });

  if (!plugin) {
    return (
      <Box>
        <Text color={colors.textDim}>No plugin selected.</Text>
      </Box>
    );
  }

  const baseHelp = source === "installed"
    ? [
        { key: "e", desc: "enable" },
        { key: "d", desc: "disable" },
        { key: "u", desc: "update" },
        { key: "x", desc: "uninstall" },
        { key: "esc", desc: "back" },
      ]
    : [
        { key: "i", desc: "install" },
        { key: "esc", desc: "back" },
      ];

  const helpItems = allCapabilities.length > 0
    ? [{ key: "↑/↓", desc: "select" }, ...baseHelp]
    : baseHelp;

  const hasCapabilities = skills.length > 0 || agents.length > 0;
  const descWidth = Math.max(20, termWidth - 12);

  const renderCapabilityItem = (cap: PluginCapability, globalIdx: number) => {
    const selected = cursor === globalIdx;
    return (
      <Box key={cap.name} flexDirection="column">
        <Box gap={1}>
          <Text color={selected ? colors.primary : colors.textDim}>
            {selected ? "›" : " "}
          </Text>
          <Text bold color={selected ? colors.primary : colors.text}>{cap.name}</Text>
          {cap.model && (
            <Text color={colors.textDim}>[{cap.model}]</Text>
          )}
        </Box>
        {selected && cap.description && (
          <Box marginLeft={2} width={descWidth} marginBottom={1}>
            <Text color={colors.textDim} wrap="wrap">{cap.description}</Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {/* Metadata */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        <Field label="Name" value={plugin.name} />
        <Field label="Version" value={plugin.version} />
        <Field label="Marketplace" value={plugin.marketplace} />

        {"description" in plugin && plugin.description && (
          <Field label="Description" value={plugin.description} />
        )}

        {isInstalled(plugin) && (
          <>
            <Field
              label="Status"
              value={plugin.enabled ? "● Enabled" : "○ Disabled"}
              valueColor={plugin.enabled ? colors.success : colors.danger}
            />
            <Field
              label="Update"
              value={plugin.updateAvailable ? "⬆ Update available" : "Up to date"}
              valueColor={plugin.updateAvailable ? colors.warning : colors.success}
            />
          </>
        )}

        {!isInstalled(plugin) && (
          <Field
            label="Installed"
            value={plugin.installed ? "✓ Yes" : "✗ No"}
            valueColor={plugin.installed ? colors.success : colors.textDim}
          />
        )}
      </Box>

      {/* Capabilities */}
      {capabilitiesLoading && (
        <Box paddingX={2} paddingY={1}>
          <Text color={colors.textDim}>Loading capabilities...</Text>
        </Box>
      )}
      {!capabilitiesLoading && hasCapabilities && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.border}
          paddingX={2}
          paddingY={1}
          gap={1}
        >
          {skills.length > 0 && (
            <Box flexDirection="column">
              <Text bold color={colors.accent}>Skills</Text>
              {skills.map((cap, i) => renderCapabilityItem(cap, i))}
            </Box>
          )}
          {agents.length > 0 && (
            <Box flexDirection="column">
              <Text bold color={colors.accent}>Agents</Text>
              {agents.map((cap, i) => renderCapabilityItem(cap, skills.length + i))}
            </Box>
          )}
        </Box>
      )}
      {!capabilitiesLoading && !hasCapabilities && (
        <Box paddingX={2} paddingY={1}>
          <Text color={colors.textDim}>No skills or agents defined.</Text>
        </Box>
      )}

      <StatusBar items={helpItems} />
    </Box>
  );
}
