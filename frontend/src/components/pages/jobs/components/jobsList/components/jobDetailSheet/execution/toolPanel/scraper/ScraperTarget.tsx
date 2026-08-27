import Indicator from './components/indicator/Indicator';
import Table from '@/components/blocks/table/Table';

import mappers from './mappers';

import type { ScraperTargetProps, ScraperTargetRow } from './types/Scraper.types';
import type { ColumnDef } from '@tanstack/react-table';

import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';
import jobListConstants from '@/components/pages/jobs/components/jobsList/constants';

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
            header: constants.label.section.execution.table.header.passed,
            accessorKey: constants.key.section.execution.table.header.passed,
            meta: { align: 'center' },
            cell: ({ row }) => <Indicator passed={row.original.passed} reasonCodes={row.original.reasonCodes} />,
        },
        {
            header: constants.label.section.execution.table.header.title,
            accessorKey: constants.key.section.execution.table.header.title,
        },
        {
            header: constants.label.section.execution.table.header.url,
            accessorKey: constants.key.section.execution.table.header.url,
            cell: ({ row }) => {
                const url = row.original.url;
                if (!url || url === jobListConstants.label.empty) {
                    return jobListConstants.label.empty;
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

    return <Table data={[...passedRows, ...failedRows]} columns={columns} />;
};

export default ScraperTarget;
