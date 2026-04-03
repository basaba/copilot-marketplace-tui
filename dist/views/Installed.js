import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { SearchBar, Table, StatusBar } from "../components/index.js";
const columns = [
    { title: "Name", width: 22, key: "name" },
    { title: "Version", width: 12, key: "version" },
    { title: "Status", width: 14, key: "status" },
    { title: "Marketplace", width: 24, key: "marketplace" },
    { title: "Update", width: 12, key: "update" },
];
function filterPlugins(plugins, query) {
    if (!query)
        return plugins;
    const q = query.toLowerCase();
    return plugins.filter((p) => p.name.toLowerCase().includes(q) ||
        p.marketplace.toLowerCase().includes(q));
}
// Overhead: App padding(2) + TabBar(2) + SearchBar(3) + margin(1) + StatusBar(2) + Table header/sep/scroll(3)
const INSTALLED_CHROME = 13;
export default function InstalledView({ plugins, cursor, searchQuery, searchActive, onSearchChange, termHeight, }) {
    const tableHeight = termHeight ? Math.max(5, termHeight - INSTALLED_CHROME) : undefined;
    const filtered = filterPlugins(plugins, searchQuery);
    const rows = filtered.map((p) => ({
        name: p.name,
        version: p.version,
        status: p.enabled ? "● enabled" : "○ disabled",
        marketplace: p.marketplace,
        update: p.updateAvailable ? "⬆ update" : "",
    }));
    if (plugins.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { italic: true, color: colors.textDim, children: "No plugins installed. Browse the Marketplace to discover and install plugins." }) }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(SearchBar, { value: searchQuery, onChange: onSearchChange, placeholder: "Filter plugins...", active: searchActive }), _jsx(Box, { marginTop: 1, children: _jsx(Table, { columns: columns, rows: rows, cursor: cursor, height: tableHeight }) }), _jsx(StatusBar, { items: [
                    { key: "↑/↓", desc: "navigate" },
                    { key: "enter", desc: "detail" },
                    { key: "/", desc: "search" },
                    { key: "e", desc: "enable" },
                    { key: "d", desc: "disable" },
                    { key: "u", desc: "update" },
                    { key: "x", desc: "uninstall" },
                ] })] }));
}
export { filterPlugins, INSTALLED_CHROME };
