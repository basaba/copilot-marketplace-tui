import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { colors } from "../theme.js";
import { SearchBar, Table, StatusBar } from "../components/index.js";
const columns = [
    { title: "Name", width: 22, key: "name" },
    { title: "Description", width: 36, key: "description" },
    { title: "Version", width: 12, key: "version" },
    { title: "Status", width: 14, key: "status" },
];
function filterPlugins(plugins, query) {
    if (!query)
        return plugins;
    const q = query.toLowerCase();
    return plugins.filter((p) => p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q));
}
// Overhead: App padding(2) + TabBar(2) + MP tabs(2) + SearchBar(3) + margin(1) + StatusBar(2) + Table header/sep/scroll(3)
const MARKETPLACE_CHROME = 15;
export default function MarketplaceView({ marketplaces, plugins, activeTab, cursor, searchQuery, searchActive, onSearchChange, contentFocused = false, termHeight, loadingMarketplaces, }) {
    const tableHeight = termHeight ? Math.max(5, termHeight - MARKETPLACE_CHROME) : undefined;
    if (marketplaces.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { italic: true, color: colors.textDim, children: "No marketplaces registered. Go to Settings and add one." }) }) }));
    }
    const activeMarketplace = marketplaces[activeTab]?.name || "";
    const allPlugins = plugins[activeMarketplace] || [];
    const filtered = filterPlugins(allPlugins, searchQuery);
    const rows = filtered.map((p) => ({
        name: p.name,
        description: p.description,
        version: p.version,
        status: p.installed ? "✓ installed" : "",
    }));
    const isLoading = loadingMarketplaces?.has(activeMarketplace);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { gap: 1, marginBottom: 1, children: marketplaces.map((mp, i) => {
                    const isActive = i === activeTab;
                    return (_jsx(Box, { paddingX: 1, children: _jsxs(Text, { bold: isActive && contentFocused, color: contentFocused && isActive
                                ? colors.white
                                : isActive
                                    ? colors.secondary
                                    : colors.textDim, backgroundColor: contentFocused && isActive
                                ? colors.accent
                                : isActive
                                    ? colors.border
                                    : undefined, children: [i + 1, ". ", mp.name] }) }, mp.name));
                }) }), _jsx(SearchBar, { value: searchQuery, onChange: onSearchChange, placeholder: "Search plugins...", active: searchActive }), _jsx(Box, { marginTop: 1, children: isLoading && rows.length === 0 ? (_jsxs(Box, { paddingX: 2, children: [_jsx(Text, { color: colors.accent, children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { color: colors.textDim, children: " Loading plugins\u2026" })] })) : (_jsx(Table, { columns: columns, rows: rows, cursor: cursor, height: tableHeight })) }), _jsx(StatusBar, { items: contentFocused
                    ? [
                        { key: "←/→", desc: "switch marketplace" },
                        { key: "↑/↓", desc: "navigate" },
                        { key: "enter", desc: "detail" },
                        { key: "i", desc: "install" },
                        { key: "/", desc: "search" },
                    ]
                    : [
                        { key: "←/→", desc: "switch view" },
                        { key: "↓/enter", desc: "enter content" },
                    ] })] }));
}
export { filterPlugins, MARKETPLACE_CHROME };
