import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
import type { Marketplace } from "../types.js";

interface SettingsViewProps {
  marketplaces: Marketplace[];
  cursor: number;
}

export default function SettingsView({
  marketplaces,
  cursor,
}: SettingsViewProps) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={colors.white} backgroundColor={colors.primary}>
          {" "}Settings{" "}
        </Text>
      </Box>

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

      <StatusBar
        items={[
          { key: "↑/↓", desc: "navigate" },
          { key: "a", desc: "add marketplace" },
          { key: "x", desc: "remove" },
        ]}
      />
    </Box>
  );
}
