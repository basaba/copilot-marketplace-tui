import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { colors } from "../theme.js";
import { SCREENS, SCREEN_LABELS } from "../types.js";
export default function TabBar({ active, focused = true }) {
    return (_jsxs(Box, { gap: 1, paddingBottom: 1, children: [SCREENS.map((screen) => {
                const isActive = screen === active;
                return (_jsx(Box, { paddingX: 1, children: _jsxs(Text, { bold: isActive && focused, color: focused && isActive
                            ? colors.white
                            : isActive
                                ? colors.secondary
                                : colors.textDim, backgroundColor: focused && isActive
                            ? colors.primary
                            : isActive
                                ? colors.border
                                : focused
                                    ? colors.bgAlt
                                    : undefined, children: [" ", SCREEN_LABELS[screen], " "] }) }, screen));
            }), _jsx(Box, { flexGrow: 1 }), _jsx(Text, { dimColor: true, children: "\u2190/\u2192 to switch views" })] }));
}
