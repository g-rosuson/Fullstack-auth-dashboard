import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const flexVariants = cva('flex', {
    variants: {
        direction: {
            row: 'flex-row',
            column: 'flex-col',
        },
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
            around: 'justify-around',
        },
        align: {
            start: 'items-start',
            center: 'items-center',
            end: 'items-end',
            between: 'items-between',
            around: 'items-around',
            stretch: 'items-stretch',
        },
        as: {
            div: 'div',
            section: 'section',
        },
        gap: {
            xs: 'gap-1',
            s: 'gap-1.5',
            m: 'gap-4',
            l: 'gap-6',
        },
        wrap: {
            wrap: 'flex-wrap',
            nowrap: 'flex-nowrap',
        },
    },
    defaultVariants: {
        direction: 'row',
        justify: 'start',
        align: 'start',
        as: 'div',
        gap: 's',
        wrap: 'nowrap',
    },
});

interface FlexProps {
    children: React.ReactNode;
    className?: string;
    direction?: 'row' | 'column';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: 'wrap' | 'nowrap';
    align?: 'start' | 'center' | 'end' | 'between' | 'around' | 'stretch';
    as?: React.ElementType;
    gap?: 'xs' | 's' | 'm' | 'l';
}

const Flex = ({ children, className, direction, justify, wrap, align, as: Tag = 'div', gap }: FlexProps) => {
    const extras = ['w-full'];
    return (
        <Tag className={cn(flexVariants({ direction, justify, wrap, align, gap }), extras, className)}>{children}</Tag>
    );
};

Flex.displayName = 'Flex';

export default Flex;
