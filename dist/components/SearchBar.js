import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../theme.js";
export default function SearchBar({ value, onChange, placeholder = "Search...", active, }) {
    return (_jsxs(Box, { borderStyle: "round", borderColor: active ? colors.primary : colors.border, paddingX: 1, width: 40, overflow: "hidden", children: [_jsx(Text, { color: colors.primary, children: "\uD83D\uDD0D " }), _jsx(Text, { wrap: "truncate-end", children: active ? undefined : (_jsx(Text, { color: value ? colors.text : colors.textDim, children: value || placeholder })) }), active && (_jsx(TextInput, { value: value, onChange: onChange, placeholder: placeholder }))] }));
}
