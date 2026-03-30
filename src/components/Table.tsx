import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";

export interface Column {
  title: string;
  width: number;
  key: string;
}

interface TableProps {
  columns: Column[];
  rows: Record<string, string>[];
  cursor: number;
  height?: number;
}

function truncate(str: string, max: number): string {
  if (max <= 0) return "";
  if (str.length <= max) return str;
  if (max <= 3) return str.slice(0, max);
  return str.slice(0, max - 3) + "...";
}

function pad(str: string, width: number): string {
  return str.padEnd(width);
}

export default function Table({
  columns,
  rows,
  cursor,
  height = 15,
}: TableProps) {
  // Calculate scroll offset
  let offset = 0;
  if (cursor >= height) {
    offset = cursor - height + 1;
  }
  const visibleRows = rows.slice(offset, offset + height);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        {columns.map((col) => (
          <Box key={col.key} width={col.width}>
            <Text bold color={colors.primary}>
              {pad(col.title, col.width)}
            </Text>
          </Box>
        ))}
      </Box>
      <Box>
        <Text color={colors.border}>
          {"─".repeat(columns.reduce((sum, c) => sum + c.width, 0))}
        </Text>
      </Box>

      {/* Rows */}
      {visibleRows.length === 0 ? (
        <Box paddingY={1} paddingX={2}>
          <Text italic color={colors.textDim}>
            No items to display
          </Text>
        </Box>
      ) : (
        visibleRows.map((row, i) => {
          const actualIndex = offset + i;
          const selected = actualIndex === cursor;
          return (
            <Box key={actualIndex}>
              {columns.map((col) => (
                <Box key={col.key} width={col.width}>
                  <Text
                    bold={selected}
                    color={selected ? colors.white : colors.text}
                    backgroundColor={selected ? colors.primary : undefined}
                  >
                    {pad(truncate(row[col.key] || "", col.width - 1), col.width)}
                  </Text>
                </Box>
              ))}
            </Box>
          );
        })
      )}

      {/* Scroll indicator */}
      {rows.length > height && (
        <Box paddingTop={0}>
          <Text color={colors.textDim}>
            {" "}
            showing {offset + 1}-{Math.min(offset + height, rows.length)} of{" "}
            {rows.length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
