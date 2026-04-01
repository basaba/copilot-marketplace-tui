import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { InstalledPlugin, MarketplacePlugin } from "../types.js";

interface DetailViewProps {
  plugin: InstalledPlugin | MarketplacePlugin | null;
  source: "installed" | "marketplace";
}

function isInstalled(p: InstalledPlugin | MarketplacePlugin): p is InstalledPlugin {
  return "enabled" in p;
}

function Field({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box>
      <Box width={18}>
        <Text bold color={colors.accent}>
          {label}
        </Text>
      </Box>
      <Text color={valueColor || colors.text}>{value}</Text>
    </Box>
  );
}

export default function DetailView({ plugin, source }: DetailViewProps) {
  if (!plugin) {
    return (
      <Box>
        <Text color={colors.textDim}>No plugin selected.</Text>
      </Box>
    );
  }

  const helpItems =
    source === "installed"
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

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
        gap={0}
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

      <StatusBar items={helpItems} />
    </Box>
  );
}
