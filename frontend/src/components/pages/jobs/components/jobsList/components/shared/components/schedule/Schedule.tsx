import Flex from '@/components/blocks/flex/Flex';
import Text from '@/components/blocks/text/Text';
import Title from '@/components/blocks/title/Title';

import type { Schedule } from '@/components/pages/jobs/components/jobsList/types';

const constants = {
    title: {
        schedule: 'Schedule',
        startDate: 'Start Date',
        endDate: 'End Date',
        nextRun: 'Next run',
        lastRun: 'Last run',
        type: 'Type',
    },
};

const ScheduleComponent = ({ schedule, size = 'xs' }: { schedule: Schedule; size?: 'xs' | 'sm' }) => {
    return (
        <Flex justify="between" align="end" gap="sm">
            <Flex direction="column" gap="sm">
                {schedule.type && (
                    <div>
                        <Title size={size} level={3} weight="bold" variant="muted">
                            {constants.title.type}
                        </Title>

                        <Text size={size} variant="foreground">
                            {schedule.type}
                        </Text>
                    </div>
                )}

                <div>
                    <Title size={size} level={3} weight="bold" variant="muted">
                        {constants.title.startDate}
                    </Title>

                    <Text size={size} variant="foreground">
                        {schedule.startDate}
                    </Text>
                </div>

                <div>
                    <Title size={size} level={3} weight="bold" variant="muted">
                        {constants.title.endDate}
                    </Title>

                    <Text size={size} variant="foreground">
                        {schedule.endDate}
                    </Text>
                </div>
            </Flex>

            <Flex direction="column" gap="sm">
                <div>
                    <Title size={size} level={3} weight="bold" variant="muted">
                        {constants.title.nextRun}
                    </Title>

                    <Text size={size} variant="foreground">
                        {schedule.nextRun}
                    </Text>
                </div>

                <div>
                    <Title size={size} level={3} weight="bold" variant="muted">
                        {constants.title.lastRun}
                    </Title>

                    <Text size={size} variant="foreground">
                        {schedule.lastRun}
                    </Text>
                </div>
            </Flex>
        </Flex>
    );
};

export default ScheduleComponent;
