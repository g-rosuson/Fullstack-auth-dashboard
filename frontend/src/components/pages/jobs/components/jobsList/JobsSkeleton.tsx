import JobCardSkeleton from './components/jobCard/skeleton/Skeleton';
import Grid from '@/components/ui-app/layout/grid/Grid';

import constants from './constants';

const JobsSkeleton = () => (
    <Grid minItemWidth={constants.layout.minItemWidth} gap={constants.layout.gap}>
        {Array.from({ length: constants.layout.skeletonCount }, (_, index) => (
            <JobCardSkeleton key={index} />
        ))}
    </Grid>
);

export default JobsSkeleton;
