import React from 'react';

import { TextVariants, textVariants } from '../shared/variants/text.variants';
import { cn } from '@/lib/utils';

type TextProps = Omit<TextVariants, 'size'> & {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    size?: 'xs' | 'sm' | 'md' | 'lg';
};

const Text = (props: TextProps) => {
    const { children, className, as: Tag = 'p', variant, size, weight, align } = props;

    return <Tag className={cn(textVariants({ size, variant, weight, align }), className)}>{children}</Tag>;
};

Text.displayName = 'Text';

export default Text;
