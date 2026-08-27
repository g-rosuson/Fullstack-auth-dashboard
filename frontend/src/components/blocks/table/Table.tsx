import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import Button from '@/components/blocks/button/Button';
import Flex from '@/components/ui-app/flex/Flex';

import type { TableProps } from './Table.types';

import { textVariants } from '@/components/blocks/shared/variants/typography/text.variants';
import { titleVariants } from '@/components/blocks/shared/variants/typography/title.variants';
import { Table as TablePrimitive, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Composes the shadcn table with a product content model: columns, rows, empty state, and paging.
 */
function Table<TData, TValue>({ columns, data }: TableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
            <div className="overflow-hidden rounded-md border">
                <TablePrimitive>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={titleVariants({ size: 'xs', spacing: 'none' })}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
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

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    textVariants({ size: 'xs', spacing: 'none' }),
                                                    isCentered && 'flex justify-center'
                                                )}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className={cn(textVariants({ size: 'xs', spacing: 'none' }), 'h-24 text-center')}>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </TablePrimitive>
            </div>

            <Flex justify="center" gap="sm" className="mt-md">
                <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronLeftIcon />}
                    ariaLabel="Previous page"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                />
                <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronRightIcon />}
                    ariaLabel="Next page"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                />
            </Flex>
        </>
    );
}

export default Table;

export type { TableProps } from './Table.types';
