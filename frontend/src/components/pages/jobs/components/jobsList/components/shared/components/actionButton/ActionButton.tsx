import { Pause, Play, RotateCcw, Square } from 'lucide-react';

import Button from '@/components/blocks/button/Button';

import mappers from '@/components/pages/jobs/components/jobsList/mappers';

import type { ButtonSize } from '@/components/blocks/button/Button.types';
import type { ActionType, JobStatus } from '@/components/pages/jobs/components/jobsList/types';
import type { LucideIcon } from 'lucide-react';
import type { MouseEventHandler } from 'react';

import constants from '@/components/pages/jobs/components/jobsList/constants';

/**
 * Maps a job status to the labelled action control for that lifecycle step.
 */
const ActionButton = ({
    status,
    size = 'xs',
    isLoading,
    onClick,
}: {
    status: JobStatus;
    size?: ButtonSize;
    isLoading: boolean;
    onClick: MouseEventHandler<HTMLButtonElement>;
}) => {
    const actionToIconMap = {
        stop: Square,
        pause: Pause,
        activate: Play,
        run: Play,
        retry: RotateCcw,
    } as const satisfies Record<ActionType, LucideIcon>;

    const actionToVariantMap = {
        stop: 'destructive',
        pause: 'warning',
        activate: 'success',
        run: 'default',
        retry: 'default',
    } as const satisfies Record<ActionType, 'default' | 'destructive' | 'warning' | 'success'>;

    const actionToLabelMap = {
        ...constants.label.action.execution,
        ...constants.label.action.schedule,
    } as const satisfies Record<ActionType, string>;

    const action = mappers.mapToActionType(status);
    const Icon = actionToIconMap[action];

    return (
        <Button
            size={size}
            variant={actionToVariantMap[action]}
            icon={<Icon fill="currentColor" />}
            label={actionToLabelMap[action]}
            isLoading={isLoading}
            onClick={onClick}
        />
    );
};

export default ActionButton;
