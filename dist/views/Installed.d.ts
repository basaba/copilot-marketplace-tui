import type { InstalledPlugin } from "../types.js";
interface InstalledViewProps {
    plugins: InstalledPlugin[];
    cursor: number;
    searchQuery: string;
    searchActive: boolean;
    onSearchChange: (query: string) => void;
    termHeight?: number;
}
declare function filterPlugins(plugins: InstalledPlugin[], query: string): InstalledPlugin[];
declare const INSTALLED_CHROME = 13;
export default function InstalledView({ plugins, cursor, searchQuery, searchActive, onSearchChange, termHeight, }: InstalledViewProps): import("react/jsx-runtime").JSX.Element;
export { filterPlugins, INSTALLED_CHROME };
