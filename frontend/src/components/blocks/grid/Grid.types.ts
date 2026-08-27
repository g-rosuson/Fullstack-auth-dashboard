import type { ElementType, ReactNode } from 'react';

type GridSize = 'xs' | 'sm' | 'md' | 'lg';
type GridGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type GridBaseProps = {
    children: ReactNode;
    as?: ElementType;
    className?: string;
    gap?: GridGap;
};

type GridFixedColumnsProps = GridBaseProps & {
    columns: 1 | 2 | 3 | 4 | 5 | 6;
    minItemWidth?: never;
};

type GridFluidProps = GridBaseProps & {
    minItemWidth: GridSize;
    columns?: never;
};

type GridProps = GridFixedColumnsProps | GridFluidProps;

export type { GridGap, GridProps, GridSize };
