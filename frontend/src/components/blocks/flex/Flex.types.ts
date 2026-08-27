import type { ElementType, ReactNode } from 'react';

type FlexGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type FlexProps = {
    children: ReactNode;
    className?: string;
    direction?: 'row' | 'column';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: 'wrap' | 'nowrap';
    align?: 'start' | 'center' | 'end' | 'between' | 'around' | 'stretch';
    as?: ElementType;
    gap?: FlexGap;
};

export type { FlexGap, FlexProps };
