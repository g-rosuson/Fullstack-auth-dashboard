import type { SkeletonProps } from './Skeleton.types';

import { cn } from '@/lib/utils';

/**
 * Shows a loading placeholder in place of content that is not yet available.
 */
const Skeleton = ({ className, ...props }: SkeletonProps) => {
    return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
};

export default Skeleton;

export type { SkeletonProps } from './Skeleton.types';
