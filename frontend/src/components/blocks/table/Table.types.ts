import type { ColumnDef } from '@tanstack/react-table';

// Extends TanStack's ColumnMeta so every ColumnDef in the project can declare
// `meta: { align: 'center' }` without casting.
declare module '@tanstack/react-table' {
    interface ColumnMeta<TData, TValue> {
        align?: 'center';
    }
}

type TableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
};

export type { TableProps };
