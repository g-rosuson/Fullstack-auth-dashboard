import Flex from '@/components/ui-app/layout/flex/Flex';
import Heading from '@/components/ui-app/typography/heading/Heading';
import Text from '@/components/ui-app/typography/text/Text';

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

const ScheduleComponent = ({ schedule, size = 'xs' }: { schedule: Schedule; size?: 'xs' | 's' }) => {
    return (
        <Flex justify="between" align="end" gap="s">
            <Flex direction="column" gap="s">
                {schedule.type && (
                    <Flex direction="column" gap="xs">
                        <Heading size={size} level={3} weight="bold" variant="muted" removeMargin>
                            {constants.title.type}
                        </Heading>

                        <Text size={size} variant="foreground">
                            {schedule.type}
                        </Text>
                    </Flex>
                )}

                <Flex direction="column" gap="xs">
                    <Heading size={size} level={3} weight="bold" variant="muted" removeMargin>
                        {constants.title.startDate}
                    </Heading>

                    <Text size={size} variant="foreground">
                        {schedule.startDate}
                    </Text>
                </Flex>

                <Flex direction="column" gap="xs">
                    <Heading size={size} level={3} weight="bold" variant="muted" removeMargin>
                        {constants.title.endDate}
                    </Heading>

                    <Text size={size} variant="foreground">
                        {schedule.endDate}
                    </Text>
                </Flex>
            </Flex>

            <Flex direction="column" gap="s">
                <Flex direction="column" gap="xs">
                    <Heading size={size} level={3} weight="bold" variant="muted" removeMargin>
                        {constants.title.nextRun}
                    </Heading>

                    <Text size={size} variant="foreground">
                        {schedule.nextRun}
                    </Text>
                </Flex>

                <Flex direction="column" gap="xs">
                    <Heading size={size} level={3} weight="bold" variant="muted" removeMargin>
                        {constants.title.lastRun}
                    </Heading>

                    <Text size={size} variant="foreground">
                        {schedule.lastRun}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default ScheduleComponent;
