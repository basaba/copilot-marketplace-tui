interface HelpItem {
    key: string;
    desc: string;
}
interface StatusBarProps {
    items: HelpItem[];
}
export default function StatusBar({ items }: StatusBarProps): import("react/jsx-runtime").JSX.Element;
export {};
