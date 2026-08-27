import JobCardSkeleton from './skeleton/Skeleton';
import Card from '@/components/blocks/card/Card';
import DropdownMenu from '@/components/blocks/dropdownMenu/DropdownMenu';
import ActionButton from '@/components/pages/jobs/components/jobsList/components/shared/components/actionButton/ActionButton';
import Schedule from '@/components/pages/jobs/components/jobsList/components/shared/components/schedule/Schedule';
import Status from '@/components/pages/jobs/components/jobsList/components/shared/components/status/Status';
import Flex from '@/components/ui-app/flex/Flex';

import type { JobCardProps } from './JobCard.types';

const JobCard = ({
    jobName,
    schedule,
    status,
    showSkeleton,
    isSubmitting,
    menuItems,
    onOpen,
    onRequestConfirm,
}: JobCardProps) => {
    let content = null;

    if (showSkeleton) {
        content = <JobCardSkeleton jobName={jobName} />;
    } else {
        // Note: This relies on the stream to be hydrated.
        content = (
            <Card
                titleSize="sm"
                title={jobName}
                titleAddon={<Status status={status} />}
                headerActions={<DropdownMenu items={menuItems} />}
                onClick={onOpen}>
                <Flex direction="column" gap="lg">
                    <Schedule schedule={schedule} />

                    <ActionButton status={status} isLoading={isSubmitting} onClick={onRequestConfirm} />
                </Flex>
            </Card>
        );
    }

    return content;
};

export default JobCard;
