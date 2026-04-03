import { type Screen } from "../types.js";
interface TabBarProps {
    active: Screen;
    onSwitch: (screen: Screen) => void;
    focused?: boolean;
}
export default function TabBar({ active, focused }: TabBarProps): import("react/jsx-runtime").JSX.Element;
export {};
