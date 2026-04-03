import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../theme.js";
import { StatusBar } from "../components/index.js";
export default function SettingsView({ marketplaces, cursor, addActive = false, addValue = "", onAddChange, }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: colors.border, paddingX: 2, paddingY: 1, children: [_jsx(Text, { bold: true, color: colors.text, children: "Registered Marketplaces" }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: marketplaces.length === 0 ? (_jsx(Text, { italic: true, color: colors.textDim, children: "No marketplaces registered. Press 'a' to add one." })) : (marketplaces.map((mp, i) => {
                            const selected = i === cursor;
                            return (_jsxs(Box, { gap: 1, children: [_jsxs(Text, { bold: selected, color: selected ? colors.primary : colors.text, children: [selected ? "▸" : " ", " ", mp.name] }), _jsx(Text, { color: colors.textDim, children: mp.url })] }, mp.name));
                        })) })] }), addActive && (_jsxs(Box, { marginTop: 1, borderStyle: "round", borderColor: colors.primary, paddingX: 1, children: [_jsx(Text, { color: colors.primary, children: "+ Add marketplace: " }), _jsx(TextInput, { value: addValue, onChange: onAddChange || (() => { }), placeholder: "owner/repo" })] })), _jsx(StatusBar, { items: addActive
                    ? [
                        { key: "enter", desc: "confirm" },
                        { key: "esc", desc: "cancel" },
                    ]
                    : [
                        { key: "↑/↓", desc: "navigate" },
                        { key: "a", desc: "add marketplace" },
                        { key: "x", desc: "remove" },
                    ] })] }));
}
