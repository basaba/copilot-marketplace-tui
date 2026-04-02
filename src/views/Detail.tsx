import React, { useMemo, useEffect, useState } from "react";
import { Box, Text } from "ink";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { colors } from "../theme.js";
import { SearchBar, StatusBar } from "../components/index.js";
import type { InstalledPlugin, MarketplacePlugin } from "../types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
marked.use(markedTerminal() as any);

interface DetailViewProps {
  plugin: InstalledPlugin | MarketplacePlugin | null;
  source: "installed" | "marketplace";
  readme?: string | null;
  readmeLoading?: boolean;
  termHeight?: number;
  scrollOffset?: number;
  searchQuery?: string;
  searchActive?: boolean;
  onSearchChange?: (query: string) => void;
  onScrollTo?: (offset: number) => void;
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

function renderReadme(md: string): string {
  return (marked.parse(md) as string).trimEnd();
}

// Skeleton shimmer placeholder while README loads
const SHIMMER_WIDTHS = [60, 45, 72, 38, 55, 0, 50, 65, 42, 58, 70, 35, 48, 0, 62, 44];
const SHIMMER_GRAYS = ["#1a1f28", "#22272e", "#2d333b", "#373e47", "#2d333b", "#22272e"];

function ShimmerBlock({ lineCount, tick }: { lineCount: number; tick: number }) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={2}
      paddingY={1}
    >
      {Array.from({ length: lineCount }, (_, i) => {
        const w = SHIMMER_WIDTHS[i % SHIMMER_WIDTHS.length]!;
        if (w === 0) return <Text key={i}> </Text>;
        const colorIdx = (i + tick) % SHIMMER_GRAYS.length;
        return (
          <Text key={i} color={SHIMMER_GRAYS[colorIdx]}>
            {"█".repeat(w)}
          </Text>
        );
      })}
    </Box>
  );
}

const ANSI_RE = /\x1B\[[0-9;]*[a-zA-Z]/g;

// Strip ANSI escape codes for plain-text search matching
function stripAnsi(str: string): string {
  return str.replace(ANSI_RE, "");
}

// Highlight only matching words inside an ANSI-rich line.
// Maps plain-text match positions back to the original string.
function highlightWord(line: string, query: string): string {
  const plain = stripAnsi(line);
  const qLower = query.toLowerCase();
  const plainLower = plain.toLowerCase();

  // Collect all match ranges in the *plain* text
  const ranges: [number, number][] = [];
  let pos = 0;
  while (pos <= plainLower.length - qLower.length) {
    const idx = plainLower.indexOf(qLower, pos);
    if (idx === -1) break;
    ranges.push([idx, idx + qLower.length]);
    pos = idx + 1;
  }
  if (ranges.length === 0) return line;

  // Build a map: plainIndex -> originalIndex for each visible char
  const plainToOrig: number[] = [];
  let pi = 0;
  for (let i = 0; i < line.length; ) {
    ANSI_RE.lastIndex = i;
    const m = ANSI_RE.exec(line);
    if (m && m.index === i) {
      i += m[0].length;
    } else {
      plainToOrig[pi++] = i;
      i++;
    }
  }
  // Sentinel for slicing up to end
  plainToOrig[pi] = line.length;

  // Build result by slicing original string around highlighted ranges
  let result = "";
  let lastPlain = 0;
  for (const [start, end] of ranges) {
    // Chars before this match (keep original ANSI)
    result += line.slice(plainToOrig[lastPlain]!, plainToOrig[start]!);
    // The matched portion with highlight
    result += `\x1B[43m\x1B[30m${line.slice(plainToOrig[start]!, plainToOrig[end]!)}\x1B[0m`;
    lastPlain = end;
  }
  // Remainder after last match
  result += line.slice(plainToOrig[lastPlain]!);
  return result;
}

export default function DetailView({
  plugin, source, readme, readmeLoading, termHeight,
  scrollOffset = 0, searchQuery = "", searchActive = false,
  onSearchChange, onScrollTo,
}: DetailViewProps) {
  if (!plugin) {
    return (
      <Box>
        <Text color={colors.textDim}>No plugin selected.</Text>
      </Box>
    );
  }

  // Shimmer animation tick
  const [shimmerTick, setShimmerTick] = useState(0);
  useEffect(() => {
    if (!readmeLoading) return;
    const id = setInterval(() => setShimmerTick((t) => t + 1), 150);
    return () => clearInterval(id);
  }, [readmeLoading]);

  // Render README lines and find search matches
  const rendered = useMemo(() => readme ? renderReadme(readme) : "", [readme]);
  const lines = useMemo(() => rendered ? rendered.split("\n") : [], [rendered]);
  const matchLines = useMemo(() => {
    if (!searchQuery || lines.length === 0) return [];
    const q = searchQuery.toLowerCase();
    const matches: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (stripAnsi(lines[i]!).toLowerCase().includes(q)) {
        matches.push(i);
      }
    }
    return matches;
  }, [searchQuery, lines]);

  // Auto-scroll to first match when query changes
  useEffect(() => {
    if (matchLines.length > 0 && onScrollTo) {
      onScrollTo(matchLines[0]!);
    }
  }, [matchLines, onScrollTo]);

  const helpItems =
    source === "installed"
      ? [
          { key: "↑/↓", desc: "scroll" },
          { key: "/", desc: "find" },
          { key: "n/N", desc: "next/prev" },
          { key: "e", desc: "enable" },
          { key: "d", desc: "disable" },
          { key: "u", desc: "update" },
          { key: "x", desc: "uninstall" },
          { key: "esc", desc: "back" },
        ]
      : [
          { key: "↑/↓", desc: "scroll" },
          { key: "/", desc: "find" },
          { key: "n/N", desc: "next/prev" },
          { key: "i", desc: "install" },
          { key: "esc", desc: "back" },
        ];

  const viewHeight = termHeight ? Math.max(5, termHeight - (searchActive || searchQuery ? 19 : 17)) : 15;
  const maxOffset = Math.max(0, lines.length - viewHeight);
  const offset = Math.min(scrollOffset, maxOffset);
  const visible = lines.slice(offset, offset + viewHeight);

  // Highlight matching words in the visible window
  const matchSet = new Set(matchLines);
  const highlightedVisible = visible.map((line, i) => {
    const lineIdx = offset + i;
    if (searchQuery && matchSet.has(lineIdx)) {
      return highlightWord(line, searchQuery);
    }
    return line;
  });

  const matchInfo = searchQuery && matchLines.length > 0
    ? (() => {
        let currentIdx = matchLines.findIndex((l) => l >= offset);
        if (currentIdx === -1) currentIdx = matchLines.length;
        return `${currentIdx + 1}/${matchLines.length}`;
      })()
    : searchQuery ? "no matches" : "";

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

      {/* Search bar */}
      {(searchActive || searchQuery) && (
        <Box gap={1}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange || (() => {})}
            placeholder="Find in README..."
            active={searchActive}
          />
          {matchInfo && (
            <Text color={matchLines.length > 0 ? colors.accent : colors.danger}>
              {matchInfo}
            </Text>
          )}
        </Box>
      )}

      {/* README section */}
      {readmeLoading && (
        <ShimmerBlock lineCount={viewHeight} tick={shimmerTick} />
      )}
      {!readmeLoading && readme && lines.length > 0 && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.border}
          paddingX={2}
          paddingY={1}
        >
          <Text>{highlightedVisible.join("\n")}</Text>
          {lines.length > viewHeight && (
            <Text color={colors.textDim}>
              {" "}lines {offset + 1}–{Math.min(offset + viewHeight, lines.length)} of {lines.length}
            </Text>
          )}
        </Box>
      )}

      <StatusBar items={helpItems} />
    </Box>
  );
}
