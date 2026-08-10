import { cva } from 'class-variance-authority';

import type { GridProps, GridSize } from './Grid.types';

import { cn } from '@/lib/utils';

const MIN_ITEM_WIDTH: Record<GridSize, string> = {
    small: '14rem',
    medium: '18rem',
    large: '24rem',
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
            small: 'gap-2',
            medium: 'gap-4',
            large: 'gap-6',
        },
    },
    defaultVariants: {
        columns: 3,
        gap: 'medium',
    },
});

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
