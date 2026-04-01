import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { Marketplace } from "../types.js";

interface SettingsViewProps {
  marketplaces: Marketplace[];
  cursor: number;
  addActive?: boolean;
  addValue?: string;
  onAddChange?: (value: string) => void;
}

export default function SettingsView({
  marketplaces,
  cursor,
  addActive = false,
  addValue = "",
  onAddChange,
}: SettingsViewProps) {
  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.border}
        paddingX={2}
        paddingY={1}
      >
        <Text bold color={colors.text}>
          Registered Marketplaces
        </Text>
        <Box flexDirection="column" marginTop={1}>
          {marketplaces.length === 0 ? (
            <Text italic color={colors.textDim}>
              No marketplaces registered. Press &apos;a&apos; to add one.
            </Text>
          ) : (
            marketplaces.map((mp, i) => {
              const selected = i === cursor;
              return (
                <Box key={mp.name} gap={1}>
                  <Text
                    bold={selected}
                    color={selected ? colors.primary : colors.text}
                  >
                    {selected ? "▸" : " "} {mp.name}
                  </Text>
                  <Text color={colors.textDim}>{mp.url}</Text>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {addActive && (
        <Box marginTop={1} borderStyle="round" borderColor={colors.primary} paddingX={1}>
          <Text color={colors.primary}>+ Add marketplace: </Text>
          <TextInput
            value={addValue}
            onChange={onAddChange || (() => {})}
            placeholder="owner/repo"
          />
        </Box>
      )}

      <StatusBar
        items={
          addActive
            ? [
                { key: "enter", desc: "confirm" },
                { key: "esc", desc: "cancel" },
              ]
            : [
                { key: "↑/↓", desc: "navigate" },
                { key: "a", desc: "add marketplace" },
                { key: "x", desc: "remove" },
              ]
        }
      />
    </Box>
  );
}
