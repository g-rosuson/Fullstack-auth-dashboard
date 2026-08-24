import React from 'react';

type GridSize = 'small' | 'medium' | 'large';
type GridGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type GridBaseProps = {
    children: React.ReactNode;
    as?: React.ElementType;
    className?: string;
    gap?: GridGap;
};

type GridFixedColumnsProps = GridBaseProps & {
    columns: 1 | 2 | 3 | 4 | 5 | 6;
    minItemWidth?: never;
};

type GridFluidProps = GridBaseProps & {
    /** Minimum track width token. Column count follows the container. */
    minItemWidth: GridSize;
    columns?: never;
};

type GridProps = GridFixedColumnsProps | GridFluidProps;
export type { GridProps, GridSize, GridGap };
