import { MouseEvent } from 'react';

import { DropdownMenuItem } from '@/components/ui-app/dropdownMenu/DropdownMenu.types';

import type { JobStatus, Schedule } from '../../types';

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
