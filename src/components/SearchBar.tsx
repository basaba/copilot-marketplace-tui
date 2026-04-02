import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../theme.js";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  active: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  active,
}: SearchBarProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={active ? colors.primary : colors.border}
      paddingX={1}
      width={40}
      overflow="hidden"
    >
      <Text color={colors.primary}>🔍 </Text>
      <Text wrap="truncate-end">
        {active ? undefined : (
          <Text color={value ? colors.text : colors.textDim}>
            {value || placeholder}
          </Text>
        )}
      </Text>
      {active && (
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </Box>
  );
}
