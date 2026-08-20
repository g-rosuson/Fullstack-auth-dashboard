import { useState } from 'react';

import Popover from '@/components/ui-app/popover/Popover';
import Text from '@/components/ui-app/text/Text';

import type { IndicatorProps } from './Indicator.types';

import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';
import { cn } from '@/lib/utils';

/**
 * Coloured status dot that reveals its reason codes in a hover popover.
 * Green when passed (no popover), red when rejected (popover with reason codes).
 */
const Indicator = ({ passed, reasonCodes }: IndicatorProps) => {
    // State
    const [open, setOpen] = useState(false);

    // Indicator
    const colorClass = passed ? 'bg-green-500' : 'bg-red-500';
    const indicator = <span className={cn('inline-block size-2 rounded-full', colorClass)} />;

    // Popover content
    const popoverContent = (
        <div className="flex flex-col gap-1">
            <Text size="xs" variant="foreground">
                {constants.label.section.execution.table.indicator.reasonCodes}
            </Text>

            {reasonCodes.map(code => (
                <Text key={code} size="xs">
                    {code}
                </Text>
            ))}
        </div>
    );

    const contentWithPopover = (
        <Popover
            triggerMode="hover"
            open={open}
            onOpenChange={setOpen}
            trigger={indicator}
            content={popoverContent}
            side="right"
        />
    );

    return passed ? indicator : contentWithPopover;
};

export default Indicator;
