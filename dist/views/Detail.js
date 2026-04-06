import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
function isInstalled(p) {
    return "enabled" in p;
}
function Field({ label, value, valueColor }) {
    return (_jsxs(Box, { children: [_jsx(Box, { width: 18, children: _jsx(Text, { bold: true, color: colors.accent, children: label }) }), _jsx(Text, { color: valueColor || colors.text, children: value })] }));
}
export default function DetailView({ plugin, source, termWidth = 80, skills = [], agents = [], capabilitiesLoading = false, }) {
    const allCapabilities = [...skills, ...agents];
    const [cursor, setCursor] = useState(0);
    // Reset cursor when capabilities change (new plugin opened)
    useEffect(() => {
        setCursor(0);
    }, [skills, agents]);
    useInput((_input, key) => {
        if (allCapabilities.length === 0)
            return;
        if (key.upArrow)
            setCursor((c) => Math.max(0, c - 1));
        if (key.downArrow)
            setCursor((c) => Math.min(allCapabilities.length - 1, c + 1));
    });
    if (!plugin) {
        return (_jsx(Box, { children: _jsx(Text, { color: colors.textDim, children: "No plugin selected." }) }));
    }
    const baseHelp = source === "installed"
        ? [
            { key: "e", desc: "enable" },
            { key: "d", desc: "disable" },
            { key: "u", desc: "update" },
            { key: "x", desc: "uninstall" },
            { key: "esc", desc: "back" },
        ]
        : [
            { key: "i", desc: "install" },
            { key: "esc", desc: "back" },
        ];
    const helpItems = allCapabilities.length > 0
        ? [{ key: "↑/↓", desc: "select" }, ...baseHelp]
        : baseHelp;
    const hasCapabilities = skills.length > 0 || agents.length > 0;
    const descWidth = Math.max(20, termWidth - 12);
    const renderCapabilityItem = (cap, globalIdx) => {
        const selected = cursor === globalIdx;
        return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { gap: 1, children: [_jsx(Text, { color: selected ? colors.primary : colors.textDim, children: selected ? "›" : " " }), _jsx(Text, { bold: true, color: selected ? colors.primary : colors.text, children: cap.name }), cap.model && (_jsxs(Text, { color: colors.textDim, children: ["[", cap.model, "]"] }))] }), selected && cap.description && (_jsx(Box, { marginLeft: 2, width: descWidth, marginBottom: 1, children: _jsx(Text, { color: colors.textDim, wrap: "wrap", children: cap.description }) }))] }, cap.name));
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: colors.border, paddingX: 2, paddingY: 1, children: [_jsx(Field, { label: "Name", value: plugin.name }), _jsx(Field, { label: "Version", value: plugin.version }), _jsx(Field, { label: "Marketplace", value: plugin.marketplace }), "description" in plugin && plugin.description && (_jsx(Field, { label: "Description", value: plugin.description })), isInstalled(plugin) && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Status", value: plugin.enabled ? "● Enabled" : "○ Disabled", valueColor: plugin.enabled ? colors.success : colors.danger }), _jsx(Field, { label: "Update", value: plugin.updateAvailable ? "⬆ Update available" : "Up to date", valueColor: plugin.updateAvailable ? colors.warning : colors.success })] })), !isInstalled(plugin) && (_jsx(Field, { label: "Installed", value: plugin.installed ? "✓ Yes" : "✗ No", valueColor: plugin.installed ? colors.success : colors.textDim }))] }), capabilitiesLoading && (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { color: colors.textDim, children: "Loading capabilities..." }) })), !capabilitiesLoading && hasCapabilities && (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: colors.border, paddingX: 2, paddingY: 1, gap: 1, children: [skills.length > 0 && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: colors.accent, children: "Skills" }), skills.map((cap, i) => renderCapabilityItem(cap, i))] })), agents.length > 0 && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: colors.accent, children: "Agents" }), agents.map((cap, i) => renderCapabilityItem(cap, skills.length + i))] }))] })), !capabilitiesLoading && !hasCapabilities && (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { color: colors.textDim, children: "No skills or agents defined." }) })), _jsx(StatusBar, { items: helpItems })] }));
}
