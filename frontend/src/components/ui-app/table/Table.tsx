import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import Heading from '@/components/ui-app/heading/Heading';
import Text from '@/components/ui-app/text/Text';

import type { DataTableProps } from './Table.types';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <Heading size="xs" level={3} removeMargin>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </Heading>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map(cell => {
                                        /**
                                         * Add a `justify-center` class to the cell if the column is centered.
                                         * @todo extract to a component when a cell grows in complexity.
                                         */
                                        const isCentered = cell.column.columnDef.meta?.align === 'center';
                                        let className = '';

                                        if (isCentered) {
                                            className = 'flex justify-center';
                                        }

                                        return (
                                            <TableCell key={cell.id} className={cn(className)}>
                                                <Text size="xs">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Text>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="w-full flex justify-center gap-sm mt-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}>
                    <ChevronLeftIcon className="size-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <ChevronRightIcon className="size-4" />
                </Button>
            </div>
        </>
    );
}

export default DataTable;
