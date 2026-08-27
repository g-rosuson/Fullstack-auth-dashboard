import type { Execution } from '@/_types/_gen';
import type { DropdownMenuItem } from '@/components/blocks/dropdownMenu/DropdownMenu.types';
import type { JobStatus, Schedule } from '@/components/pages/jobs/components/jobsList/types';
import type { MouseEvent } from 'react';

/**
 * The props for the JobDetailSheet component.
 */
interface JobDetailSheetProps {
    jobName: string;
    executions: Execution[];
    schedule?: Schedule;
    status?: JobStatus;
    menuItems: DropdownMenuItem[];
    isSubmitting: boolean;
    isOpen: boolean;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line no-unused-vars
    onRequestConfirm: (event: MouseEvent<HTMLButtonElement>) => void;
}

export type { JobDetailSheetProps };
