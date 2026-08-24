import { BadgeInfo } from 'lucide-react';

import Execution from './execution/Execution';
import ActionButton from '@/components/pages/jobs/components/jobsList/components/shared/components/actionButton/ActionButton';
import Schedule from '@/components/pages/jobs/components/jobsList/components/shared/components/schedule/Schedule';
import Status from '@/components/pages/jobs/components/jobsList/components/shared/components/status/Status';
import DialogTitle from '@/components/ui-app/dialogTitle/DialogTitle';
import DropdownMenu from '@/components/ui-app/dropdownMenu/DropdownMenu';
import Flex from '@/components/ui-app/flex/Flex';
import Sheet from '@/components/ui-app/sheet/Sheet';
import Text from '@/components/ui-app/text/Text';

import type { JobDetailSheetProps } from './types';

import constants from '@/components/pages/jobs/components/jobsList/components/jobDetailSheet/constants';

const JobDetailSheet = ({
    jobName,
    executions,
    schedule,
    status,
    menuItems,
    isSubmitting,
    isOpen,
    onOpenChange,
    onRequestConfirm,
}: JobDetailSheetProps) => {
    if (!schedule || !status || !executions) {
        return null;
    }

    // Determine executions content
    const hasExecutions = executions.length > 0;

    let executionsContent = (
        <Flex direction="column" gap="sm" align="center" justify="center">
            <BadgeInfo size={24} />

            <DialogTitle size="md" className="mb-0">
                {constants.label.placeholder.executions.title}
            </DialogTitle>

            <Text size="sm" variant="muted" align="center">
                {constants.label.placeholder.executions.description}
            </Text>
        </Flex>
    );

    if (hasExecutions) {
        executionsContent = (
            <>
                <Flex direction="column" gap="sm">
                    {executions.map(execution => (
                        <Execution key={execution.executionId} execution={execution} />
                    ))}
                </Flex>
            </>
        );
    }

    const ariaDescribedby = constants.label.ariaDescribedby;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange} side="right" ariaDescribedby={ariaDescribedby}>
            <Flex direction="column" gap="md">
                <section className="w-full">
                    <Flex direction="column" gap="md">
                        <Flex justify="between">
                            <div>
                                <DialogTitle size="lg" className="mb-xs">
                                    {jobName}
                                </DialogTitle>

                                <Status status={status} size="sm" />
                            </div>

                            <DropdownMenu dropdownMenuItems={menuItems} />
                        </Flex>

                        <Schedule schedule={schedule} size="sm" />

                        <ActionButton status={status} size="sm" isLoading={isSubmitting} onClick={onRequestConfirm} />
                    </Flex>
                </section>

                <section className="w-full">
                    <DialogTitle>{constants.label.title.executions}</DialogTitle>

                    {executionsContent}
                </section>
            </Flex>
        </Sheet>
    );
};

export default JobDetailSheet;
