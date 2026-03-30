import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { SCREENS, SCREEN_LABELS, type Screen } from "../types.js";

interface TabBarProps {
  active: Screen;
  onSwitch: (screen: Screen) => void;
}

export default function TabBar({ active }: TabBarProps) {
  return (
    <Box gap={1} paddingBottom={1}>
      {SCREENS.map((screen) => {
        const isActive = screen === active;
        return (
          <Box key={screen} paddingX={1}>
            <Text
              bold={isActive}
              color={isActive ? colors.white : colors.textDim}
              backgroundColor={isActive ? colors.primary : colors.bgAlt}
            >
              {" "}
              {SCREEN_LABELS[screen]}{" "}
            </Text>
          </Box>
        );
      })}
      <Box flexGrow={1} />
      <Text dimColor>←/→ to switch views</Text>
    </Box>
  );
}
