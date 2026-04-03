import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
function truncate(str, max) {
    if (max <= 0)
        return "";
    if (str.length <= max)
        return str;
    if (max <= 3)
        return str.slice(0, max);
    return str.slice(0, max - 3) + "...";
}
function pad(str, width) {
    return str.padEnd(width);
}
export default function Table({ columns, rows, cursor, height = 15, }) {
    // Calculate scroll offset
    let offset = 0;
    if (cursor >= height) {
        offset = cursor - height + 1;
    }
    const visibleRows = rows.slice(offset, offset + height);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { children: columns.map((col) => (_jsx(Box, { width: col.width, children: _jsx(Text, { bold: true, color: colors.primary, children: pad(col.title, col.width) }) }, col.key))) }), _jsx(Box, { children: _jsx(Text, { color: colors.border, children: "─".repeat(columns.reduce((sum, c) => sum + c.width, 0)) }) }), visibleRows.length === 0 ? (_jsx(Box, { paddingY: 1, paddingX: 2, children: _jsx(Text, { italic: true, color: colors.textDim, children: "No items to display" }) })) : (visibleRows.map((row, i) => {
                const actualIndex = offset + i;
                const selected = actualIndex === cursor;
                return (_jsx(Box, { children: columns.map((col) => (_jsx(Box, { width: col.width, children: _jsx(Text, { bold: selected, color: selected ? colors.white : colors.text, backgroundColor: selected ? colors.primary : undefined, children: pad(truncate(row[col.key] || "", col.width - 1), col.width) }) }, col.key))) }, actualIndex));
            })), rows.length > height && (_jsx(Box, { paddingTop: 0, children: _jsxs(Text, { color: colors.textDim, children: [" ", "showing ", offset + 1, "-", Math.min(offset + height, rows.length), " of", " ", rows.length] }) }))] }));
}
