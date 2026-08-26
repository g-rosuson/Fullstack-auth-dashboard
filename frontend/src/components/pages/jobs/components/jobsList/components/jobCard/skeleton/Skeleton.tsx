import Card from '@/components/blocks/card/Card';
import Flex from '@/components/ui-app/flex/Flex';
import Skeleton from '@/components/ui-app/skeleton/Skeleton';

const JobCardSkeleton = ({ jobName }: { jobName?: string }) => {
    return (
        <Card
            titleSize="sm"
            title={jobName ?? <Skeleton className="h-2 w-1/2" />}
            titleAddon={
                <Flex align="center" gap="xs">
                    <Skeleton className="size-2.5 rounded-full" />
                    <Skeleton className="h-2 w-1/3" />
                </Flex>
            }>
            <Flex direction="column" gap="lg">
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
