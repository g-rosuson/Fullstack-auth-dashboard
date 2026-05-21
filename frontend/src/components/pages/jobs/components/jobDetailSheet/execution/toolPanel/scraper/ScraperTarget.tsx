import Indicator from './components/indicator/Indicator';
import DataTable from '@/components/ui-app/table/Table';

import mappers from './mappers';

import type { ScraperTargetProps, ScraperTargetRow } from './types/Scraper.types';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Displays a scraper target's results in a table.
 * @todo Extend row filtering when the need arises -> Use tanstack table conventions.
 * @param {ScraperTargetProps} target - The target to display.
 * @returns
 */
const ScraperTarget = ({ target }: ScraperTargetProps) => {
    const failedRows: ScraperTargetRow[] = [];
    const passedRows: ScraperTargetRow[] = [];

    const columns: ColumnDef<ScraperTargetRow>[] = [
        {
            header: 'Passed',
            accessorKey: 'passed',
            meta: { align: 'center' },
            cell: ({ row }) => <Indicator passed={row.original.passed} reasonCodes={row.original.reasonCodes} />,
        },
        { header: 'Title', accessorKey: 'title' },
        {
            header: 'URL',
            accessorKey: 'url',
            cell: ({ row }) => {
                const url = row.original.url;
                if (!url || url === 'n/a') {
                    return 'n/a';
                }
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                        {url}
                    </a>
                );
            },
        },
    ];

    for (const resultItem of target.results) {
        const row = mappers.mapToRow(resultItem);

        if (row.passed) {
            passedRows.push(row);
        } else {
            failedRows.push(row);
        }
    }

    return <DataTable data={[...passedRows, ...failedRows]} columns={columns} />;
};

export default ScraperTarget;
