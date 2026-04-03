interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    active: boolean;
}
export default function SearchBar({ value, onChange, placeholder, active, }: SearchBarProps): import("react/jsx-runtime").JSX.Element;
export {};
