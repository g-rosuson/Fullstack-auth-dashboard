import JobCardSkeleton from './skeleton/Skeleton';
import ActionButton from '@/components/pages/jobs/components/jobsList/components/shared/components/actionButton/ActionButton';
import Schedule from '@/components/pages/jobs/components/jobsList/components/shared/components/schedule/Schedule';
import Status from '@/components/pages/jobs/components/jobsList/components/shared/components/status/Status';
import Card from '@/components/ui-app/card/Card';
import DropdownMenu from '@/components/ui-app/dropdownMenu/DropdownMenu';
import Flex from '@/components/ui-app/flex/Flex';
import Heading from '@/components/ui-app/heading/Heading';

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
        // Note: This expects the stream to be hydrated.
        content = (
            <Card className="cursor-pointer" onClick={onOpen}>
                <Flex direction="column" gap="md">
                    <Flex justify="between">
                        <div>
                            <Heading size="sm" level={2}>
                                {jobName}
                            </Heading>

                            <Status status={status} />
                        </div>

                        <DropdownMenu dropdownMenuItems={menuItems} />
                    </Flex>

                    <Schedule schedule={schedule} />

                    <ActionButton status={status} isLoading={isSubmitting} onClick={onRequestConfirm} />
                </Flex>
            </Card>
        );
    }

    return content;
};

export default JobCard;
