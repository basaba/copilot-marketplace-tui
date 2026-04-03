import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
export default function StatusBar({ items }) {
    return (_jsx(Box, { paddingTop: 1, children: items.map((item, i) => (_jsxs(React.Fragment, { children: [i > 0 && _jsx(Text, { color: colors.border, children: " \u2022 " }), _jsx(Text, { bold: true, color: colors.primary, children: item.key }), _jsxs(Text, { color: colors.textDim, children: [" ", item.desc] })] }, item.key))) }));
}
