import { cva } from 'class-variance-authority';

import type { GridProps, GridSize } from './Grid.types';

import { cn } from '@/lib/utils';

const MIN_ITEM_WIDTH: Record<GridSize, string> = {
    sm: '14rem',
    md: '18rem',
    lg: '24rem',
};

const gridVariants = cva('grid', {
    variants: {
        columns: {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4',
            5: 'grid-cols-5',
            6: 'grid-cols-6',
        },
        gap: {
            xs: 'gap-xs',
            sm: 'gap-sm',
            md: 'gap-md',
            lg: 'gap-lg',
            xl: 'gap-xl',
        },
    },
    defaultVariants: {
        gap: 'md',
    },
});

/**
 * Lays out children in columns with named gap.
 */
const Grid = ({ children, className, gap, as: Tag = 'div', minItemWidth, columns }: GridProps) => {
    const hasMinItemWidth = !!minItemWidth;
    const gridStyle = hasMinItemWidth
        ? { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${MIN_ITEM_WIDTH[minItemWidth]}), 1fr))` }
        : undefined;

    return (
        <Tag
            className={cn(gridVariants({ columns: hasMinItemWidth ? undefined : columns, gap }), className)}
            style={gridStyle}>
            {children}
        </Tag>
    );
};

Grid.displayName = 'Grid';

export default Grid;

export type { GridGap, GridProps, GridSize } from './Grid.types';
