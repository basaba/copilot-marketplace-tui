export interface Column {
    title: string;
    width: number;
    key: string;
}
interface TableProps {
    columns: Column[];
    rows: Record<string, string>[];
    cursor: number;
    height?: number;
}
export default function Table({ columns, rows, cursor, height, }: TableProps): import("react/jsx-runtime").JSX.Element;
export {};
