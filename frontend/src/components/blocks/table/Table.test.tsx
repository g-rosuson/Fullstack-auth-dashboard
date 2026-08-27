import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';

import type { TableProps } from './Table';
import type { ColumnDef } from '@tanstack/react-table';

import Table from './Table';

type Row = {
    name: string;
    url: string;
    status?: string;
};

const columns: ColumnDef<Row>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'URL', accessorKey: 'url' },
];

const rows: Row[] = [
    { name: 'Alpha', url: 'https://alpha.example' },
    { name: 'Beta', url: 'https://beta.example' },
];

/**
 * Renders Table with named columns and optional rows.
 */
const renderTable = (props: Partial<TableProps<Row, unknown>> = {}) => {
    return render(<Table columns={props.columns ?? columns} data={props.data ?? rows} />);
};

describe('Table block: headers and rows', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-TBL-001] / [FR-UI-TBL-001] exposes each column name as a column header', () => {
        renderTable();

        const table = screen.getByRole('table');

        expect(within(table).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(within(table).getByRole('columnheader', { name: 'URL' })).toBeInTheDocument();
    });

    it('[CLIENT-UI-TBL-002] / [FR-UI-TBL-002] presents each row’s values in cells under the corresponding headers', () => {
        renderTable();

        const table = screen.getByRole('table');
        const dataRows = within(table).getAllByRole('row').slice(1);

        expect(dataRows).toHaveLength(2);
        expect(within(dataRows[0]).getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
        expect(within(dataRows[0]).getByRole('cell', { name: 'https://alpha.example' })).toBeInTheDocument();
        expect(within(dataRows[1]).getByRole('cell', { name: 'Beta' })).toBeInTheDocument();
        expect(within(dataRows[1]).getByRole('cell', { name: 'https://beta.example' })).toBeInTheDocument();
    });

    it('applies the xs title token on column headers', () => {
        renderTable();

        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass('text-xs');
    });

    it('centers a cell when the column meta asks for center alignment', () => {
        renderTable({
            columns: [
                { header: 'Name', accessorKey: 'name' },
                { header: 'Status', accessorKey: 'status', meta: { align: 'center' } },
            ],
            data: [{ name: 'Alpha', url: 'https://alpha.example', status: 'Passed' }],
        });

        const table = screen.getByRole('table');
        const dataRow = within(table).getAllByRole('row')[1];

        expect(within(dataRow).getByRole('cell', { name: 'Passed' })).toHaveClass('flex');
        expect(within(dataRow).getByRole('cell', { name: 'Passed' })).toHaveClass('justify-center');
        expect(within(dataRow).getByRole('cell', { name: 'Alpha' })).not.toHaveClass('justify-center');
    });
});

describe('Table block: empty state', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[CLIENT-UI-TBL-003] / [FR-UI-TBL-003] indicates there are no results when there are no rows', () => {
        renderTable({ data: [] });

        const table = screen.getByRole('table');

        expect(within(table).getByRole('cell', { name: 'No results.' })).toBeInTheDocument();
        expect(within(table).queryByRole('cell', { name: 'Alpha' })).not.toBeInTheDocument();
    });
});

describe('Table block: paging', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const pagedRows: Row[] = Array.from({ length: 11 }, (_, index) => ({
        name: `Row ${index + 1}`,
        url: `https://${index + 1}.example`,
    }));

    it('[CLIENT-UI-TBL-004] / [FR-UI-TBL-004] / [FR-UI-ACT-001] names page controls and moves to the next and previous page', async () => {
        renderTable({ data: pagedRows });

        const table = screen.getByRole('table');
        const previous = screen.getByRole('button', { name: 'Previous page' });
        const next = screen.getByRole('button', { name: 'Next page' });

        expect(previous).toBeDisabled();
        expect(next).toBeEnabled();
        expect(within(table).getByRole('cell', { name: 'Row 1' })).toBeInTheDocument();
        expect(within(table).queryByRole('cell', { name: 'Row 11' })).not.toBeInTheDocument();

        await userEvent.click(next);

        expect(within(table).queryByRole('cell', { name: 'Row 1' })).not.toBeInTheDocument();
        expect(within(table).getByRole('cell', { name: 'Row 11' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));

        expect(within(table).getByRole('cell', { name: 'Row 1' })).toBeInTheDocument();
        expect(within(table).queryByRole('cell', { name: 'Row 11' })).not.toBeInTheDocument();
    });

    it('disables next page when every row fits on one page', () => {
        renderTable();

        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });
});
