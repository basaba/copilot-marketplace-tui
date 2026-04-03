import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
function StatCard({ value, label, color }) {
    return (_jsxs(Box, { borderStyle: "round", borderColor: color, paddingX: 2, paddingY: 0, width: 18, flexDirection: "column", alignItems: "center", children: [_jsx(Text, { bold: true, color: color, children: value }), _jsx(Text, { color: colors.textDim, children: label })] }));
}
export default function Dashboard({ summary }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { gap: 1, marginY: 1, children: [_jsx(StatCard, { value: summary.totalInstalled, label: "Installed", color: colors.primary }), _jsx(StatCard, { value: summary.enabled, label: "Enabled", color: colors.success }), _jsx(StatCard, { value: summary.disabled, label: "Disabled", color: colors.warning }), _jsx(StatCard, { value: summary.updatesAvailable, label: "Updates", color: colors.danger })] }), _jsx(StatusBar, { items: [
                    { key: "←/→", desc: "switch view" },
                    { key: "q", desc: "quit" },
                ] })] }));
}
