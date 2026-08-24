import Card from '@/components/ui-app/card/Card';
import Flex from '@/components/ui-app/flex/Flex';
import Heading from '@/components/ui-app/heading/Heading';
import Skeleton from '@/components/ui-app/skeleton/Skeleton';

const JobCardSkeleton = ({ jobName }: { jobName?: string }) => {
    // Determine heading content
    let headingContent = <Skeleton className="h-2 w-1/2" />;
    if (jobName) {
        headingContent = (
            <Heading size="sm" level={3} weight="bold" truncate>
                {jobName}
            </Heading>
        );
    }

    return (
        <Card>
            <Flex direction="column" gap="lg">
                <Flex direction="column" gap="sm" className="min-w-0">
                    <Flex className="min-w-0">{headingContent}</Flex>

                    <Flex align="center" gap="xs">
                        <Skeleton className="size-2.5 rounded-full" />
                        <Skeleton className="h-2 w-1/3" />
                    </Flex>
                </Flex>

                <Flex direction="column" gap="sm">
                    <Skeleton className="h-2.5 w-1/2" />
                    <Skeleton className="h-2.5 w-1/3" />
                    <Skeleton className="h-2.5 w-1/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                </Flex>

                <Skeleton className="h-6 w-1/4" />
            </Flex>
        </Card>
    );
};

export default JobCardSkeleton;
