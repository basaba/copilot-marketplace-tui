import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";

interface HelpItem {
  key: string;
  desc: string;
}

interface StatusBarProps {
  items: HelpItem[];
}

export default function StatusBar({ items }: StatusBarProps) {
  return (
    <Box paddingTop={1}>
      {items.map((item, i) => (
        <React.Fragment key={item.key}>
          {i > 0 && <Text color={colors.border}> • </Text>}
          <Text bold color={colors.primary}>
            {item.key}
          </Text>
          <Text color={colors.textDim}> {item.desc}</Text>
        </React.Fragment>
      ))}
    </Box>
  );
}
