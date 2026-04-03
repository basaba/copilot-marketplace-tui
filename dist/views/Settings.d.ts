import type { Marketplace } from "../types.js";
interface SettingsViewProps {
    marketplaces: Marketplace[];
    cursor: number;
    addActive?: boolean;
    addValue?: string;
    onAddChange?: (value: string) => void;
}
export default function SettingsView({ marketplaces, cursor, addActive, addValue, onAddChange, }: SettingsViewProps): import("react/jsx-runtime").JSX.Element;
export {};
