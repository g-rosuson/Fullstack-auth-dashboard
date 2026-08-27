import { MouseEvent } from 'react';

import type { JobStatus, Schedule } from '../../types';
import type { DropdownMenuItem } from '@/components/blocks/dropdownMenu/DropdownMenu.types';

interface JobCardProps {
    jobId: string;
    jobName: string;
    schedule: Schedule;
    status: JobStatus;
    showSkeleton: boolean;
    isSubmitting: boolean;
    menuItems: DropdownMenuItem[];
    onOpen: () => void;
    onRequestConfirm: (e: MouseEvent<HTMLButtonElement>) => void;
}

export type { JobCardProps };
